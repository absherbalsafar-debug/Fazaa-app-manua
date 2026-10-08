import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';
import 'dart:isolate';
import 'dart:math';

import 'package:crypto/crypto.dart';

import 'auth_store.dart';
import 'default_categories.dart';
import 'models.dart';
import 'password_hasher.dart';

final class FazaaApiServer {
  FazaaApiServer({
    required this.store,
    this.allowDevelopmentOtp = false,
    Set<String> allowedOrigins = const <String>{},
  }) : _allowedOrigins = allowedOrigins
           .map(_normalizeOrigin)
           .where((origin) => origin.isNotEmpty)
           .toSet();

  final AuthStore? store;
  final bool allowDevelopmentOtp;
  final Set<String> _allowedOrigins;
  final Random _random = Random.secure();
  final Map<String, List<DateTime>> _rateEvents = <String, List<DateTime>>{};

  static const Duration _sessionLifetime = Duration(days: 30);
  static const Duration _otpLifetime = Duration(minutes: 10);

  Future<void> handle(HttpRequest request) async {
    final origin = request.headers.value('origin');
    if (!_originAllowed(request, origin)) {
      await _writeJson(request.response, HttpStatus.forbidden, const {
        'error': 'مصدر الطلب غير مسموح',
      });
      return;
    }

    _applyHeaders(request.response, origin);
    if (request.method == 'OPTIONS') {
      request.response.statusCode = HttpStatus.noContent;
      await request.response.close();
      return;
    }

    try {
      final response = await _dispatch(request);
      await _writeJson(request.response, response.$1, response.$2);
    } on _ApiException catch (error) {
      await _writeJson(request.response, error.statusCode, <String, Object?>{
        'error': error.message,
      });
    } on FormatException {
      await _writeJson(request.response, HttpStatus.badRequest, const {
        'error': 'صيغة الطلب غير صحيحة',
      });
    } catch (error) {
      // Never log request bodies, credentials, tokens, connection strings or SQL.
      stderr.writeln('Fazaa Dart API request failed (${error.runtimeType}).');
      await _writeJson(request.response, HttpStatus.internalServerError, const {
        'error': 'حدث خطأ غير متوقع. حاول مرة أخرى لاحقًا.',
      });
    }
  }

  Future<(int, JsonRow)> _dispatch(HttpRequest request) async {
    final path = request.uri.path;
    if (request.method == 'GET' &&
        (path == '/health' || path == '/api/health')) {
      final activeStore = _requireStore();
      await activeStore.checkConnection();
      return (HttpStatus.ok, const <String, Object?>{'ok': true});
    }
    if (request.method == 'GET' && path == '/api/categories') {
      final activeStore = store;
      if (activeStore == null) {
        return (
          HttpStatus.ok,
          <String, Object?>{'categories': defaultCategories},
        );
      }
      return (
        HttpStatus.ok,
        <String, Object?>{'categories': await activeStore.listCategories()},
      );
    }

    switch ('${request.method} $path') {
      case 'POST /api/auth/login/email':
        return _loginEmail(request);
      case 'POST /api/auth/send-otp':
        return _sendOtp(request);
      case 'POST /api/auth/verify-otp':
        return _verifyOtp(request);
      case 'GET /api/auth/me':
        return _me(request);
      case 'POST /api/auth/logout':
        return _logout(request);
      case 'GET /api/dashboard':
        return _dashboard(request);
      case 'PATCH /api/providers/me/availability':
        return _setAvailability(request);
      default:
        throw const _ApiException(HttpStatus.notFound, 'المسار غير موجود');
    }
  }

  Future<(int, JsonRow)> _loginEmail(HttpRequest request) async {
    final ip = _clientAddress(request);
    if (!_allowRate('$ip:email-login', 10, const Duration(minutes: 1))) {
      throw const _ApiException(
        HttpStatus.tooManyRequests,
        'محاولات تسجيل الدخول كثيرة. انتظر قليلًا ثم حاول مجددًا.',
      );
    }
    final body = await _readBody(request);
    final email = _string(body['email']).trim().toLowerCase();
    final password = _string(body['password']);
    final role = _string(body['role']);
    if (!RegExp(r'^\S+@\S+\.\S+$').hasMatch(email) || email.length > 320) {
      throw const _ApiException(
        HttpStatus.badRequest,
        'أدخل بريدًا إلكترونيًا صحيحًا',
      );
    }
    if (password.isEmpty || password.length > 1024) {
      throw const _ApiException(HttpStatus.badRequest, 'أدخل كلمة المرور');
    }
    if (!_validRole(role)) {
      throw const _ApiException(HttpStatus.badRequest, 'نوع الحساب غير صحيح');
    }

    final activeStore = _requireStore();
    final users = await activeStore.findUsersByEmail(email);
    if (users.length > 1) {
      await Isolate.run(
        () => PasswordHasher.verify(password, PasswordHasher.dummyHash),
      );
      throw const _ApiException(
        HttpStatus.conflict,
        'يوجد أكثر من حساب مرتبط بهذا البريد. تواصل مع الدعم لاستعادة الحساب.',
      );
    }
    if (users.isEmpty) {
      await Isolate.run(
        () => PasswordHasher.verify(password, PasswordHasher.dummyHash),
      );
      throw const _ApiException(
        HttpStatus.unauthorized,
        'البريد الإلكتروني أو كلمة المرور غير صحيحة',
      );
    }

    final user = users.single;
    final validPassword = await Isolate.run(
      () => PasswordHasher.verify(password, user['passwordHash']?.toString()),
    );
    if (!validPassword) {
      throw const _ApiException(
        HttpStatus.unauthorized,
        'البريد الإلكتروني أو كلمة المرور غير صحيحة',
      );
    }
    if (user['status'] != 'active') {
      throw const _ApiException(
        HttpStatus.forbidden,
        'هذا الحساب موقوف حاليًا',
      );
    }
    if (user['role'] != role) {
      throw const _ApiException(
        HttpStatus.forbidden,
        'نوع الحساب لا يطابق هذا المستخدم. اختر نوع الحساب الصحيح.',
      );
    }

    final token = _sessionToken('email_');
    final userId = _asInt(user['id']);
    if (userId <= 0) {
      throw const _ApiException(
        HttpStatus.internalServerError,
        'تعذر إنشاء جلسة للمستخدم',
      );
    }
    // The production session.phone column is varchar(20), while synthetic
    // email phones can be much longer; keep an indexed, compact user reference.
    await activeStore.createSession(
      token: token,
      sessionSubject: 'uid:$userId',
      expiresAt: DateTime.now().toUtc().add(_sessionLifetime),
    );
    return (
      HttpStatus.ok,
      <String, Object?>{'token': token, 'user': publicUser(user)},
    );
  }

  Future<(int, JsonRow)> _sendOtp(HttpRequest request) async {
    final ip = _clientAddress(request);
    if (!_allowRate('$ip:otp-ip', 20, const Duration(minutes: 10))) {
      throw const _ApiException(
        HttpStatus.tooManyRequests,
        'طلبات التحقق كثيرة. انتظر قليلًا ثم حاول مجددًا.',
      );
    }
    final body = await _readBody(request);
    final phone = _normalizePhone(_string(body['phone']));
    final role = _string(body['role']);
    if (!RegExp(r'^\+\d{8,15}$').hasMatch(phone)) {
      throw const _ApiException(HttpStatus.badRequest, 'أدخل رقم هاتف صحيحًا');
    }
    if (!_validRole(role) ||
        (body['mode'] != null && body['mode'] != 'login')) {
      throw const _ApiException(
        HttpStatus.badRequest,
        'بيانات تسجيل الدخول غير صحيحة',
      );
    }
    if (!_allowRate('$phone:otp-phone', 3, const Duration(minutes: 10))) {
      throw const _ApiException(
        HttpStatus.tooManyRequests,
        'تم طلب رموز كثيرة لهذا الرقم. أرسل رمزًا جديدًا بعد قليل.',
      );
    }
    if (!allowDevelopmentOtp) {
      throw const _ApiException(
        HttpStatus.serviceUnavailable,
        'تسجيل الدخول بالهاتف غير متاح بعد: لم تُهيأ خدمة إرسال الرسائل النصية في الخادم.',
      );
    }

    final activeStore = _requireStore();
    final existing = await activeStore.findUserByPhone(phone);
    if (existing != null && existing['role'] != role) {
      throw const _ApiException(
        HttpStatus.conflict,
        'نوع الحساب لا يطابق هذا الرقم. اختر نوع الحساب المرتبط به.',
      );
    }
    final code = (100000 + _random.nextInt(900000)).toString();
    final expiresAt = DateTime.now().toUtc().add(_otpLifetime);
    await activeStore.storeOtp(
      phone: phone,
      codeHash: sha256.convert(utf8.encode(code)).toString(),
      expiresAt: expiresAt,
    );
    return (
      HttpStatus.ok,
      <String, Object?>{
        'success': true,
        'phone': phone,
        'expiresInSeconds': _otpLifetime.inSeconds,
        'otp': code,
        'developmentOnly': true,
      },
    );
  }

  Future<(int, JsonRow)> _verifyOtp(HttpRequest request) async {
    final body = await _readBody(request);
    final phone = _normalizePhone(_string(body['phone']));
    final code = _string(body['code']).trim();
    final role = _string(body['role']);
    if (!RegExp(r'^\+\d{8,15}$').hasMatch(phone) ||
        !RegExp(r'^\d{6}$').hasMatch(code) ||
        !_validRole(role) ||
        (body['mode'] != null && body['mode'] != 'login')) {
      throw const _ApiException(
        HttpStatus.badRequest,
        'بيانات رمز التحقق غير صحيحة',
      );
    }

    final now = DateTime.now().toUtc();
    final outcome = await _requireStore().verifyOtpAndCreateSession(
      phone: phone,
      codeHash: sha256.convert(utf8.encode(code)).toString(),
      role: role,
      token: _sessionToken('phone_'),
      now: now,
      sessionExpiresAt: now.add(_sessionLifetime),
    );
    switch (outcome.kind) {
      case OtpVerificationKind.success:
        return (
          HttpStatus.ok,
          <String, Object?>{
            'token': outcome.token,
            'user': publicUser(outcome.user!),
          },
        );
      case OtpVerificationKind.needsRegistration:
        return (
          HttpStatus.ok,
          const <String, Object?>{'needsRegistration': true},
        );
      case OtpVerificationKind.roleConflict:
        throw const _ApiException(
          HttpStatus.conflict,
          'نوع الحساب لا يطابق هذا الرقم. اختر نوع الحساب الصحيح.',
        );
      case OtpVerificationKind.inactive:
        throw const _ApiException(
          HttpStatus.forbidden,
          'هذا الحساب موقوف حاليًا',
        );
      case OtpVerificationKind.locked:
        throw const _ApiException(
          HttpStatus.tooManyRequests,
          'تجاوزت عدد محاولات التحقق. أرسل رمزًا جديدًا.',
        );
      case OtpVerificationKind.expired:
        throw const _ApiException(
          HttpStatus.badRequest,
          'انتهت صلاحية الرمز. أرسل رمزًا جديدًا.',
        );
      case OtpVerificationKind.incorrect:
        throw const _ApiException(HttpStatus.badRequest, 'رمز التحقق غير صحيح');
      case OtpVerificationKind.missing:
        throw const _ApiException(
          HttpStatus.badRequest,
          'لا يوجد رمز صالح لهذا الرقم. أرسل رمزًا جديدًا.',
        );
    }
  }

  Future<(int, JsonRow)> _me(HttpRequest request) async {
    final user = await _userForRequest(request);
    return (HttpStatus.ok, <String, Object?>{'user': publicUser(user)});
  }

  Future<(int, JsonRow)> _logout(HttpRequest request) async {
    final token = _bearerToken(request);
    if (token == null) {
      throw const _ApiException(
        HttpStatus.unauthorized,
        'تحتاج إلى تسجيل الدخول',
      );
    }
    await _requireStore().deleteSession(token);
    return (HttpStatus.ok, const <String, Object?>{'success': true});
  }

  Future<(int, JsonRow)> _dashboard(HttpRequest request) async {
    final user = await _userForRequest(request);
    return (HttpStatus.ok, await _requireStore().loadDashboard(user));
  }

  Future<(int, JsonRow)> _setAvailability(HttpRequest request) async {
    final user = await _userForRequest(request);
    if (user['role'] != 'provider') {
      throw const _ApiException(
        HttpStatus.forbidden,
        'هذا الإجراء للمهنيين فقط',
      );
    }
    final body = await _readBody(request);
    if (body['available'] is! bool) {
      throw const _ApiException(HttpStatus.badRequest, 'قيمة التوفر غير صحيحة');
    }
    final updated = await _requireStore().setProviderAvailability(
      userId: _asInt(user['id']),
      available: body['available'] as bool,
    );
    if (!updated) {
      throw const _ApiException(
        HttpStatus.forbidden,
        'تعذر تحديث حالة هذا الحساب',
      );
    }
    return (HttpStatus.ok, <String, Object?>{'isAvailable': body['available']});
  }

  Future<JsonRow> _userForRequest(HttpRequest request) async {
    final token = _bearerToken(request);
    if (token == null) {
      throw const _ApiException(
        HttpStatus.unauthorized,
        'تحتاج إلى تسجيل الدخول',
      );
    }
    final user = await _requireStore().findUserForSession(token);
    if (user == null) {
      throw const _ApiException(
        HttpStatus.unauthorized,
        'انتهت الجلسة. سجّل الدخول مجددًا.',
      );
    }
    return user;
  }

  AuthStore _requireStore() {
    final activeStore = store;
    if (activeStore == null) {
      throw const _ApiException(
        HttpStatus.serviceUnavailable,
        'خدمة قاعدة البيانات غير مهيأة على الخادم.',
      );
    }
    return activeStore;
  }

  Future<JsonRow> _readBody(HttpRequest request) async {
    if (request.contentLength > 32 * 1024) {
      throw const _ApiException(413, 'حجم الطلب أكبر من المسموح');
    }
    final builder = BytesBuilder(copy: false);
    await for (final chunk in request) {
      builder.add(chunk);
      if (builder.length > 32 * 1024) {
        throw const _ApiException(413, 'حجم الطلب أكبر من المسموح');
      }
    }
    if (builder.length == 0) return <String, Object?>{};
    final decoded = jsonDecode(utf8.decode(builder.takeBytes()));
    if (decoded is! Map<String, dynamic>) {
      throw const FormatException('Expected a JSON object');
    }
    return Map<String, Object?>.from(decoded);
  }

  bool _allowRate(String key, int limit, Duration window) {
    final now = DateTime.now();
    final events = _rateEvents.putIfAbsent(key, () => <DateTime>[]);
    events.removeWhere((time) => now.difference(time) >= window);
    if (events.length >= limit) return false;
    events.add(now);
    if (_rateEvents.length > 4096) {
      _rateEvents.removeWhere(
        (_, values) =>
            values.isEmpty ||
            now.difference(values.last) >= const Duration(hours: 1),
      );
    }
    return true;
  }

  String _clientAddress(HttpRequest request) =>
      request.connectionInfo?.remoteAddress.address ?? 'unknown';

  static String? _bearerToken(HttpRequest request) {
    final header = request.headers.value(HttpHeaders.authorizationHeader);
    if (header == null) return null;
    final parts = header.trim().split(RegExp(r'\s+'));
    if (parts.length != 2 || parts.first.toLowerCase() != 'bearer') return null;
    final token = parts.last.trim();
    return token.isEmpty || token.length > 128 ? null : token;
  }

  static bool _validRole(String role) => role == 'client' || role == 'provider';

  static String _string(Object? value) => value is String ? value : '';

  static int _asInt(Object? value) {
    if (value is int) return value;
    if (value is num) return value.toInt();
    return int.tryParse(value?.toString() ?? '') ?? 0;
  }

  static String _normalizePhone(String value) {
    final compact = value.trim().replaceAll(RegExp(r'[\s()\-]'), '');
    if (compact.startsWith('00')) return '+${compact.substring(2)}';
    if (compact.startsWith('+')) return compact;
    if (RegExp(r'^7\d{8}$').hasMatch(compact)) return '+967$compact';
    return '+$compact';
  }

  String _sessionToken(String prefix) {
    final bytes = List<int>.generate(16, (_) => _random.nextInt(256));
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    final hex = bytes
        .map((byte) => byte.toRadixString(16).padLeft(2, '0'))
        .join();
    final uuid =
        '${hex.substring(0, 8)}-${hex.substring(8, 12)}-'
        '${hex.substring(12, 16)}-${hex.substring(16, 20)}-${hex.substring(20)}';
    return '$prefix$uuid';
  }

  bool _originAllowed(HttpRequest request, String? origin) {
    if (origin == null || origin.isEmpty) return true;
    final normalized = _normalizeOrigin(origin);
    if (normalized.isEmpty) return false;
    if (_allowedOrigins.contains(normalized)) return true;

    final forwardedHost = request.headers.value('x-forwarded-host');
    final host =
        (forwardedHost?.split(',').first ??
                request.headers.value(HttpHeaders.hostHeader) ??
                '')
            .trim();
    final forwardedProto = request.headers.value('x-forwarded-proto');
    final scheme = (forwardedProto?.split(',').first ?? request.uri.scheme)
        .trim()
        .toLowerCase();
    if (host.isEmpty || (scheme != 'http' && scheme != 'https')) return false;
    return normalized == _normalizeOrigin('$scheme://$host');
  }

  static String _normalizeOrigin(String origin) {
    final uri = Uri.tryParse(origin.trim());
    if (uri == null ||
        (uri.scheme != 'http' && uri.scheme != 'https') ||
        !uri.hasAuthority ||
        uri.userInfo.isNotEmpty ||
        (uri.path.isNotEmpty && uri.path != '/') ||
        uri.hasQuery ||
        uri.hasFragment) {
      return '';
    }
    final port = uri.hasPort ? ':${uri.port}' : '';
    return '${uri.scheme.toLowerCase()}://${uri.host.toLowerCase()}$port';
  }

  static void _applyHeaders(HttpResponse response, String? origin) {
    response.headers.contentType = ContentType.json;
    response.headers.set(HttpHeaders.cacheControlHeader, 'no-store');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'no-referrer');
    if (origin != null && origin.isNotEmpty) {
      response.headers.set(HttpHeaders.accessControlAllowOriginHeader, origin);
      response.headers.set(HttpHeaders.varyHeader, 'Origin');
      response.headers.set(
        HttpHeaders.accessControlAllowMethodsHeader,
        'GET, POST, PATCH, OPTIONS',
      );
      response.headers.set(
        HttpHeaders.accessControlAllowHeadersHeader,
        'Authorization, Content-Type',
      );
      response.headers.set(HttpHeaders.accessControlMaxAgeHeader, '600');
    }
  }

  static Future<void> _writeJson(
    HttpResponse response,
    int statusCode,
    JsonRow body,
  ) async {
    response.statusCode = statusCode;
    response.headers.contentType = ContentType.json;
    response.headers.set(HttpHeaders.cacheControlHeader, 'no-store');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'no-referrer');
    response.write(jsonEncode(body));
    await response.close();
  }
}

final class _ApiException implements Exception {
  const _ApiException(this.statusCode, this.message);

  final int statusCode;
  final String message;
}
