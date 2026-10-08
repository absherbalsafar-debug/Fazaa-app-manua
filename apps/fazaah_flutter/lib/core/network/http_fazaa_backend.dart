import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

import '../config/app_config.dart';
import 'backend_models.dart';
import 'fazaa_backend.dart';
import 'session_token_store.dart';

final class HttpFazaaBackend implements FazaaBackend {
  HttpFazaaBackend({
    http.Client? client,
    SessionTokenStore? sessionTokenStore,
    String? baseUrl,
  }) : _client = client ?? http.Client(),
       _sessionTokenStore = sessionTokenStore ?? SecureSessionTokenStore(),
       _baseUrl = baseUrl ?? AppConfig.apiBaseUrl;

  static const Duration _requestTimeout = Duration(seconds: 20);

  final http.Client _client;
  final SessionTokenStore _sessionTokenStore;
  final String _baseUrl;

  @override
  Future<BackendUser?> restoreSession() async {
    final token = await _sessionTokenStore.read();
    if (token == null || token.isEmpty) return null;
    try {
      final body = await _request(
        'GET',
        '/auth/me',
        authenticated: true,
        clearSessionOnUnauthorized: true,
      );
      return BackendUser.fromJson(_map(body['user']));
    } on BackendException catch (error) {
      if (error.statusCode == 401) return null;
      rethrow;
    }
  }

  @override
  Future<BackendUser> loginWithEmail({
    required String email,
    required String password,
    required String role,
  }) async {
    final body = await _request(
      'POST',
      '/auth/login/email',
      authenticated: false,
      jsonBody: {'email': email.trim(), 'password': password, 'role': role},
    );
    await _saveToken(body['token']);
    return BackendUser.fromJson(_map(body['user']));
  }

  @override
  Future<OtpChallenge> sendPhoneOtp({
    required String phone,
    required String role,
  }) async {
    final body = await _request(
      'POST',
      '/auth/send-otp',
      authenticated: false,
      jsonBody: {'phone': phone, 'role': role, 'mode': 'login'},
    );
    return OtpChallenge.fromJson(body);
  }

  @override
  Future<BackendUser> verifyPhoneOtp({
    required String phone,
    required String code,
    required String role,
  }) async {
    final body = await _request(
      'POST',
      '/auth/verify-otp',
      authenticated: false,
      jsonBody: {'phone': phone, 'code': code, 'role': role, 'mode': 'login'},
    );
    if (body['needsRegistration'] == true) {
      throw const BackendException(
        'لا يوجد حساب مرتبط بهذا الرقم. إنشاء الحساب غير متاح في هذه المرحلة.',
      );
    }
    await _saveToken(body['token']);
    return BackendUser.fromJson(_map(body['user']));
  }

  @override
  Future<DashboardSnapshot> loadDashboard() async {
    final results = await Future.wait(<Future<JsonMap>>[
      _request('GET', '/dashboard', authenticated: true),
      _request('GET', '/categories', authenticated: false),
    ]);
    final categoryList = _list(results[1]['categories'])
        .map(_map)
        .toList(growable: false);
    return DashboardSnapshot.fromJson(results[0], categoryList);
  }

  @override
  Future<void> setProviderAvailability(bool available) async {
    await _request(
      'PATCH',
      '/providers/me/availability',
      authenticated: true,
      jsonBody: {'available': available},
    );
  }

  @override
  Future<void> logout() async {
    try {
      await _request('POST', '/auth/logout', authenticated: true);
    } finally {
      await _sessionTokenStore.delete();
    }
  }

  Future<JsonMap> _request(
    String method,
    String path, {
    required bool authenticated,
    Map<String, Object?>? jsonBody,
    bool clearSessionOnUnauthorized = false,
  }) async {
    final request = http.Request(method, _endpoint(path));
    request.headers['Accept'] = 'application/json';
    if (jsonBody != null) {
      request.headers['Content-Type'] = 'application/json; charset=utf-8';
      request.body = jsonEncode(jsonBody);
    }
    if (authenticated) {
      final token = await _sessionTokenStore.read();
      if (token == null || token.isEmpty) {
        throw const BackendException('سجّل الدخول للمتابعة.', statusCode: 401);
      }
      request.headers['Authorization'] = 'Bearer $token';
    }

    try {
      final streamed = await _client.send(request).timeout(_requestTimeout);
      final text = await streamed.stream.bytesToString().timeout(
        _requestTimeout,
      );
      JsonMap payload = <String, dynamic>{};
      if (text.isNotEmpty) {
        try {
          payload = _map(jsonDecode(text));
        } on FormatException {
          throw const BackendException('استجابة الخادم غير صالحة.');
        }
      }
      if (streamed.statusCode < 200 || streamed.statusCode >= 300) {
        if (streamed.statusCode == 401 && clearSessionOnUnauthorized) {
          await _sessionTokenStore.delete();
        }
        final message =
            payload['error']?.toString() ??
            'تعذر إكمال الطلب (${streamed.statusCode}).';
        throw BackendException(message, statusCode: streamed.statusCode);
      }
      return payload;
    } on TimeoutException {
      throw const BackendException('انتهت مهلة الاتصال بالخادم. حاول مجددًا.');
    } on http.ClientException {
      throw const BackendException(
        'تعذر الاتصال بخادم فزعة. تحقق من الشبكة وإعداد عنوان API.',
      );
    }
  }

  Uri _endpoint(String path) {
    final base = _baseUrl.trim();
    if (base.isEmpty || base.startsWith('/')) {
      if (!kIsWeb) {
        throw const BackendException(
          'على Android حدّد عنوان الخادم عبر --dart-define=FAZAA_API_BASE_URL=https://…/api.',
        );
      }
      final prefix = base.isEmpty
          ? '/api'
          : base.replaceFirst(RegExp(r'/+$'), '');
      return Uri.base.resolve('$prefix$path');
    }

    final uri = Uri.tryParse(base);
    if (uri == null || !uri.hasAuthority || !uri.hasScheme) {
      throw const BackendException('إعداد FAZAA_API_BASE_URL غير صالح.');
    }
    if (uri.scheme != 'https' &&
        uri.host != 'localhost' &&
        uri.host != '127.0.0.1') {
      throw const BackendException('يجب استخدام HTTPS خارج بيئة localhost.');
    }
    final basePath = uri.path.replaceFirst(RegExp(r'/+$'), '');
    return uri.replace(path: '$basePath$path', query: null, fragment: null);
  }

  Future<void> _saveToken(Object? value) async {
    final token = value?.toString() ?? '';
    if (token.isEmpty || token.length > 128) {
      throw const BackendException('لم يُرجع الخادم رمز جلسة صالحًا.');
    }
    await _sessionTokenStore.write(token);
  }

  static JsonMap _map(Object? value) {
    if (value is Map<String, dynamic>) return value;
    if (value is Map) {
      return value.map((key, item) => MapEntry(key.toString(), item));
    }
    return <String, dynamic>{};
  }

  static List<dynamic> _list(Object? value) => value is List ? value : const [];
}
