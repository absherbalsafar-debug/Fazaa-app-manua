import 'dart:convert';

import 'package:fazaah_flutter/core/network/http_fazaa_backend.dart';
import 'package:fazaah_flutter/core/network/session_token_store.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';

class MemorySessionTokenStore implements SessionTokenStore {
  String? token;

  @override
  Future<String?> read() async => token;

  @override
  Future<void> write(String value) async => token = value;

  @override
  Future<void> delete() async => token = null;
}

void main() {
  test('دخول البريد يرسل الدور الصحيح ويحفظ رمز الجلسة', () async {
    final sessions = MemorySessionTokenStore();
    http.Request? sentRequest;
    final backend = HttpFazaaBackend(
      baseUrl: 'https://api.example.test/api',
      sessionTokenStore: sessions,
      client: MockClient((request) async {
        sentRequest = request;
        return http.Response(
          jsonEncode({
            'token': 'email_session_test',
            'user': {
              'id': 41,
              'name': 'نورة العريقي',
              'role': 'client',
              'status': 'active',
            },
          }),
          200,
          headers: {'content-type': 'application/json'},
        );
      }),
    );

    final user = await backend.loginWithEmail(
      email: '  client@example.test ',
      password: 'secret123',
      role: 'client',
    );

    expect(sentRequest!.method, 'POST');
    expect(sentRequest!.url.path, '/api/auth/login/email');
    expect(jsonDecode(sentRequest!.body), {
      'email': 'client@example.test',
      'password': 'secret123',
      'role': 'client',
    });
    expect(sessions.token, 'email_session_test');
    expect(user.name, 'نورة العريقي');
  });

  test('اللوحة ترسل Bearer وتحوّل الطلبات والتصنيفات إلى نماذج', () async {
    final sessions = MemorySessionTokenStore()..token = 'session_123';
    final requestPaths = <String>[];
    final backend = HttpFazaaBackend(
      baseUrl: 'https://api.example.test/api',
      sessionTokenStore: sessions,
      client: MockClient((request) async {
        requestPaths.add(request.url.path);
        if (request.url.path == '/api/dashboard') {
          expect(request.headers['authorization'], 'Bearer session_123');
          return http.Response(
            jsonEncode({
              'user': {
                'id': 82,
                'name': 'علي المهني',
                'role': 'provider',
                'status': 'active',
                'isAvailable': true,
              },
              'metrics': {
                'newRequests': 2,
                'activeRequests': 3,
                'completedRequests': 4,
                'rating': 4.7,
              },
              'recentRequests': [
                {
                  'id': 120,
                  'status': 'in_progress',
                  'serviceType': 'طلب صيانة كهرباء',
                  'city': 'صنعاء',
                  'district': 'حدة',
                  'createdAt': '2026-10-08T00:00:00Z',
                },
              ],
            }),
            200,
            headers: {'content-type': 'application/json'},
          );
        }
        return http.Response(
          jsonEncode({
            'categories': [
              {'id': 2, 'name': 'كهرباء', 'icon': '⚡'},
            ],
          }),
          200,
          headers: {'content-type': 'application/json'},
        );
      }),
    );

    final dashboard = await backend.loadDashboard();

    expect(requestPaths, containsAll(['/api/dashboard', '/api/categories']));
    expect(dashboard.user.isAvailable, isTrue);
    expect(dashboard.metric('newRequests'), 2);
    expect(dashboard.rating, 4.7);
    expect(dashboard.recentRequests.single.serviceType, 'طلب صيانة كهرباء');
    expect(dashboard.categories.single.name, 'كهرباء');
  });

  test('الجلسة المنتهية تُرفض ويُحذف رمزها المحفوظ', () async {
    final sessions = MemorySessionTokenStore()..token = 'expired_session';
    final backend = HttpFazaaBackend(
      baseUrl: 'https://api.example.test/api',
      sessionTokenStore: sessions,
      client: MockClient(
        (_) async => http.Response(
          jsonEncode({'error': 'انتهت الجلسة'}),
          401,
          headers: {'content-type': 'application/json'},
        ),
      ),
    );

    expect(await backend.restoreSession(), isNull);
    expect(sessions.token, isNull);
  });
}
