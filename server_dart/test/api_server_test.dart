import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:crypto/crypto.dart';
import 'package:fazaah_api_dart/src/api_server.dart';
import 'package:fazaah_api_dart/src/auth_store.dart';
import 'package:fazaah_api_dart/src/default_categories.dart';
import 'package:fazaah_api_dart/src/models.dart';
import 'package:test/test.dart';

const _passwordHash =
    '00112233445566778899aabbccddeeff:'
    '2897778d6cf59390c66926cd514f3357f1a987c3ccd6d6c25501ee5524731e20'
    '7353bafbc569ac23a4069281ca2aeb2bd90d16de4fbe48eb6a15a2ea25e91a5d';

void main() {
  late HttpServer server;
  late HttpClient client;
  late _MemoryAuthStore store;
  late Uri baseUri;

  setUp(() async {
    store = _MemoryAuthStore();
    server = await HttpServer.bind(InternetAddress.loopbackIPv4, 0);
    client = HttpClient();
    baseUri = Uri.parse('http://127.0.0.1:${server.port}');
    final api = FazaaApiServer(
      store: store,
      allowDevelopmentOtp: true,
      allowedOrigins: const {'https://app.example.test'},
    );
    server.listen((request) => unawaited(api.handle(request)));
  });

  tearDown(() async {
    client.close(force: true);
    await server.close(force: true);
  });

  test('health ينجح بعد فحص المخزن المتصل', () async {
    final (status, body) = await _send(client, baseUri, 'GET', '/api/health');
    expect(status, HttpStatus.ok);
    expect(body['ok'], isTrue);
  });

  test('التصنيفات تعرض كتالوج فزعة المتوافق مع الواجهة الحالية', () async {
    final (status, body) = await _send(
      client,
      baseUri,
      'GET',
      '/api/categories',
    );
    expect(status, HttpStatus.ok);
    expect((body['categories'] as List<dynamic>).length, 8);
  });

  test('تسجيل البريد ينشئ جلسة ويعيد مستخدمًا بلا passwordHash', () async {
    store.user['phone'] = 'email:${List.filled(80, 'x').join()}';
    final (status, body) = await _send(
      client,
      baseUri,
      'POST',
      '/api/auth/login/email',
      body: const {
        'email': 'CLIENT@FAZAAH.TEST',
        'password': 'test-password-fazaa',
        'role': 'client',
      },
    );

    expect(status, HttpStatus.ok);
    expect(body['token'], startsWith('email_'));
    final user = body['user'] as Map<String, dynamic>;
    expect(user['role'], 'client');
    expect(user.containsKey('passwordHash'), isFalse);
    expect(user.containsKey('nationalId'), isFalse);
    expect(store.sessionSubjects[body['token']], 'uid:7');

    final (meStatus, meBody) = await _send(
      client,
      baseUri,
      'GET',
      '/api/auth/me',
      headers: {'Authorization': 'Bearer ${body['token']}'},
    );
    expect(meStatus, HttpStatus.ok);
    expect((meBody['user'] as Map<String, dynamic>)['name'], 'عميل اختبار');
  });

  test('يرفض اختيار دور مختلف عن الدور المسجل', () async {
    final (status, body) = await _send(
      client,
      baseUri,
      'POST',
      '/api/auth/login/email',
      body: const {
        'email': 'client@fazaah.test',
        'password': 'test-password-fazaa',
        'role': 'provider',
      },
    );
    expect(status, HttpStatus.forbidden);
    expect(body['error'], contains('نوع الحساب'));
    expect(store.sessions, isEmpty);
  });

  test('لوحة المهني وتحديث التوفر يعملان عبر جلسة مصادق عليها', () async {
    store.user['role'] = 'provider';
    final (loginStatus, loginBody) = await _send(
      client,
      baseUri,
      'POST',
      '/api/auth/login/email',
      body: const {
        'email': 'client@fazaah.test',
        'password': 'test-password-fazaa',
        'role': 'provider',
      },
    );
    expect(loginStatus, HttpStatus.ok);
    final token = loginBody['token'] as String;
    final authorization = {'Authorization': 'Bearer $token'};

    final (dashboardStatus, dashboardBody) = await _send(
      client,
      baseUri,
      'GET',
      '/api/dashboard',
      headers: authorization,
    );
    expect(dashboardStatus, HttpStatus.ok);
    expect((dashboardBody['user'] as Map<String, dynamic>)['role'], 'provider');
    expect(dashboardBody['metrics'], isA<Map<String, dynamic>>());

    final (availabilityStatus, availabilityBody) = await _send(
      client,
      baseUri,
      'PATCH',
      '/api/providers/me/availability',
      headers: authorization,
      body: const {'available': true},
    );
    expect(availabilityStatus, HttpStatus.ok);
    expect(availabilityBody['isAvailable'], isTrue);
    expect(store.user['isAvailable'], isTrue);
  });

  test('رمز OTP التطويري لا يخزن نصًا صريحًا ويصدر جلسة عند التحقق', () async {
    final (sendStatus, sendBody) = await _send(
      client,
      baseUri,
      'POST',
      '/api/auth/send-otp',
      body: const {'phone': '771234567', 'role': 'client', 'mode': 'login'},
    );
    expect(sendStatus, HttpStatus.ok);
    expect(sendBody['developmentOnly'], isTrue);
    final code = sendBody['otp'] as String;
    expect(store.lastOtpHash, sha256.convert(utf8.encode(code)).toString());
    expect(store.lastOtpHash, isNot(code));

    final (verifyStatus, verifyBody) = await _send(
      client,
      baseUri,
      'POST',
      '/api/auth/verify-otp',
      body: {
        'phone': '771234567',
        'code': code,
        'role': 'client',
        'mode': 'login',
      },
    );
    expect(verifyStatus, HttpStatus.ok);
    expect(verifyBody['token'], startsWith('phone_'));
    expect((verifyBody['user'] as Map<String, dynamic>)['role'], 'client');
  });

  test('CORS يسمح بالمصدر المعتمد ويرفض المصدر العشوائي', () async {
    final (allowedStatus, allowedBody, allowedOrigin) = await _sendWithHeader(
      client,
      baseUri,
      'OPTIONS',
      '/api/auth/login/email',
      headerName: 'Origin',
      headerValue: 'https://app.example.test',
    );
    expect(allowedStatus, HttpStatus.noContent);
    expect(allowedBody, isEmpty);
    expect(allowedOrigin, 'https://app.example.test');

    final (blockedStatus, blockedBody, _) = await _sendWithHeader(
      client,
      baseUri,
      'GET',
      '/api/auth/me',
      headerName: 'Origin',
      headerValue: 'https://evil.example',
    );
    expect(blockedStatus, HttpStatus.forbidden);
    expect(blockedBody['error'], contains('مصدر'));
  });
}

Future<(int, Map<String, dynamic>)> _send(
  HttpClient client,
  Uri baseUri,
  String method,
  String path, {
  Map<String, Object?>? body,
  Map<String, String> headers = const {},
}) async {
  final request = await client.openUrl(method, baseUri.resolve(path));
  headers.forEach(request.headers.set);
  if (body != null) {
    request.headers.contentType = ContentType.json;
    request.write(jsonEncode(body));
  }
  final response = await request.close();
  final text = await utf8.decoder.bind(response).join();
  return (
    response.statusCode,
    text.isEmpty
        ? <String, dynamic>{}
        : jsonDecode(text) as Map<String, dynamic>,
  );
}

Future<(int, Map<String, dynamic>, String?)> _sendWithHeader(
  HttpClient client,
  Uri baseUri,
  String method,
  String path, {
  required String headerName,
  required String headerValue,
}) async {
  final request = await client.openUrl(method, baseUri.resolve(path));
  request.headers.set(headerName, headerValue);
  final response = await request.close();
  final text = await utf8.decoder.bind(response).join();
  return (
    response.statusCode,
    text.isEmpty
        ? <String, dynamic>{}
        : jsonDecode(text) as Map<String, dynamic>,
    response.headers.value('access-control-allow-origin'),
  );
}

final class _MemoryAuthStore implements AuthStore {
  final JsonRow user = <String, Object?>{
    'id': 7,
    'phone': '+967771234567',
    'name': 'عميل اختبار',
    'email': 'client@fazaah.test',
    'passwordHash': _passwordHash,
    'role': 'client',
    'status': 'active',
    'phoneVerified': 1,
    'emailVerified': 1,
    'isAvailable': false,
    'createdAt': DateTime.utc(2026, 1, 1),
  };
  final Map<String, JsonRow> sessions = <String, JsonRow>{};
  final Map<String, String> sessionSubjects = <String, String>{};
  String? lastOtpHash;

  @override
  Future<void> checkConnection() async {}

  @override
  Future<List<JsonRow>> findUsersByEmail(String email) async =>
      email == user['email'] ? <JsonRow>[user] : <JsonRow>[];

  @override
  Future<JsonRow?> findUserByPhone(String phone) async =>
      phone == user['phone'] ? user : null;

  @override
  Future<JsonRow?> findUserForSession(String token) async => sessions[token];

  @override
  Future<void> createSession({
    required String token,
    required String sessionSubject,
    required DateTime expiresAt,
  }) async {
    sessionSubjects[token] = sessionSubject;
    sessions[token] = user;
  }

  @override
  Future<void> deleteSession(String token) async {
    sessions.remove(token);
  }

  @override
  Future<void> storeOtp({
    required String phone,
    required String codeHash,
    required DateTime expiresAt,
  }) async {
    lastOtpHash = codeHash;
  }

  @override
  Future<OtpVerificationResult> verifyOtpAndCreateSession({
    required String phone,
    required String codeHash,
    required String role,
    required String token,
    required DateTime now,
    required DateTime sessionExpiresAt,
  }) async {
    if (lastOtpHash == null) {
      return const OtpVerificationResult(OtpVerificationKind.missing);
    }
    if (lastOtpHash != codeHash) {
      return const OtpVerificationResult(OtpVerificationKind.incorrect);
    }
    if (user['role'] != role) {
      return const OtpVerificationResult(OtpVerificationKind.roleConflict);
    }
    sessions[token] = user;
    lastOtpHash = null;
    return OtpVerificationResult(
      OtpVerificationKind.success,
      user: user,
      token: token,
    );
  }

  @override
  Future<JsonRow> loadDashboard(JsonRow user) async => <String, Object?>{
    'user': publicUser(this.user),
    'metrics': const <String, Object?>{
      'totalRequests': 0,
      'newRequests': 0,
      'activeRequests': 0,
      'completedRequests': 0,
      'favorites': 0,
      'rating': null,
      'reviewCount': 0,
    },
    'recentRequests': const <JsonRow>[],
  };

  @override
  Future<bool> setProviderAvailability({
    required int userId,
    required bool available,
  }) async {
    if (userId != user['id'] || user['role'] != 'provider') return false;
    user['isAvailable'] = available;
    return true;
  }

  @override
  Future<List<JsonRow>> listCategories() async => defaultCategories;

  @override
  Future<void> close() async {}
}
