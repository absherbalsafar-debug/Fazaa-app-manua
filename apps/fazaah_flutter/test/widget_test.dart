import 'package:fazaah_flutter/app/fazaah_app.dart';
import 'package:fazaah_flutter/core/network/backend_models.dart';
import 'package:fazaah_flutter/core/network/fazaa_backend.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

class FakeFazaaBackend implements FazaaBackend {
  BackendUser? user;
  bool availability = false;
  int logoutCalls = 0;

  BackendUser _userFor(String role) => BackendUser(
    id: role == 'provider' ? 82 : 41,
    name: role == 'provider' ? 'علي المهني' : 'نورة العريقي',
    role: role,
    status: 'active',
    phone: '+967771234567',
    email: role == 'provider' ? 'provider@example.com' : 'client@example.com',
    city: 'صنعاء',
    providerAccountStatus: role == 'provider' ? 'approved' : null,
    isAvailable: availability,
  );

  @override
  Future<BackendUser?> restoreSession() async => user;

  @override
  Future<BackendUser> loginWithEmail({
    required String email,
    required String password,
    required String role,
  }) async {
    if (password != 'secret123') {
      throw const BackendException('بيانات الدخول غير صحيحة', statusCode: 401);
    }
    user = _userFor(role);
    return user!;
  }

  @override
  Future<OtpChallenge> sendPhoneOtp({
    required String phone,
    required String role,
  }) async => OtpChallenge(
    phone: '+967$phone',
    expiresInSeconds: 600,
    developmentCode: '123456',
  );

  @override
  Future<BackendUser> verifyPhoneOtp({
    required String phone,
    required String code,
    required String role,
  }) async {
    if (code != '123456') {
      throw const BackendException('رمز التحقق غير صحيح', statusCode: 400);
    }
    user = _userFor(role);
    return user!;
  }

  @override
  Future<DashboardSnapshot> loadDashboard() async {
    final current = user;
    if (current == null) {
      throw const BackendException('تحتاج إلى تسجيل الدخول', statusCode: 401);
    }
    return DashboardSnapshot(
      user: current,
      metrics: const {
        'newRequests': 2,
        'activeRequests': 3,
        'completedRequests': 4,
        'rating': 4.7,
      },
      recentRequests: const [
        ServiceRequestSummary(
          id: 120,
          status: 'in_progress',
          serviceType: 'طلب صيانة كهرباء',
          city: 'صنعاء',
          district: 'حدة',
          createdAt: '2026-10-08T00:00:00.000Z',
        ),
      ],
      categories: const [
        ServiceCategory(id: 2, name: 'كهرباء'),
        ServiceCategory(id: 1, name: 'سباكة'),
      ],
    );
  }

  @override
  Future<void> setProviderAvailability(bool available) async {
    availability = available;
  }

  @override
  Future<void> logout() async {
    logoutCalls++;
    user = null;
  }
}

Future<void> openRole(
  WidgetTester tester,
  String label,
  FakeFazaaBackend backend,
) async {
  await tester.pumpWidget(FazaaApp(backend: backend));
  await tester.pumpAndSettle();
  await tester.tap(find.text(label));
  await tester.pumpAndSettle();
}

bool passwordIsObscured(WidgetTester tester) {
  final editableField = find.descendant(
    of: find.byKey(const ValueKey('login-password-field')),
    matching: find.byType(EditableText),
  );
  return tester.widget<EditableText>(editableField).obscureText;
}

Finder navigationLabel(String label) {
  return find.descendant(
    of: find.byType(NavigationBar),
    matching: find.text(label),
  );
}

void main() {
  testWidgets('دخول العميل بالجوال يتحقق من OTP ويحمل الطلبات', (tester) async {
    final backend = FakeFazaaBackend();
    await openRole(tester, 'أحتاج خدمة', backend);

    expect(find.text('تسجيل دخول العميل'), findsOneWidget);
    await tester.enterText(
      find.byKey(const ValueKey('login-phone-field')),
      '771234567',
    );
    await tester.tap(find.text('المتابعة برمز التحقق'));
    await tester.pumpAndSettle();

    expect(find.text('تحقق من رقم الجوال'), findsOneWidget);
    expect(
      find.textContaining('رمز التطوير لهذه الجلسة: 123456'),
      findsOneWidget,
    );
    await tester.enterText(
      find.byKey(const ValueKey('login-otp-field')),
      '123456',
    );
    await tester.ensureVisible(find.text('تأكيد الرمز'));
    await tester.tap(find.text('تأكيد الرمز'));
    await tester.pumpAndSettle();

    expect(find.text('أهلًا نورة العريقي'), findsOneWidget);
    expect(find.text('طلب صيانة كهرباء'), findsOneWidget);
    expect(navigationLabel('الرئيسية'), findsOneWidget);
    await tester.tap(navigationLabel('طلباتي'));
    await tester.pumpAndSettle();
    expect(find.text('قيد التنفيذ'), findsOneWidget);
  });

  testWidgets('دخول المهني بالبريد يعرض مؤشرات Neon ويحفظ التوفر', (
    tester,
  ) async {
    final backend = FakeFazaaBackend();
    await openRole(tester, 'أقدم خدمة', backend);
    expect(find.text('تسجيل دخول المهني'), findsOneWidget);

    await tester.tap(find.text('البريد الإلكتروني').first);
    await tester.pumpAndSettle();
    await tester.enterText(
      find.byKey(const ValueKey('login-email-field')),
      'provider@example.com',
    );
    await tester.enterText(
      find.byKey(const ValueKey('login-password-field')),
      'secret123',
    );
    await tester.ensureVisible(find.text('دخول إلى حساب المهني'));
    await tester.tap(find.text('دخول إلى حساب المهني'));
    await tester.pumpAndSettle();

    expect(find.text('أهلًا علي المهني'), findsOneWidget);
    expect(find.text('طلبات جديدة'), findsOneWidget);
    expect(find.text('2'), findsOneWidget);
    expect(find.text('غير متاح حاليًا'), findsOneWidget);
    await tester.tap(find.byType(Switch).first);
    await tester.pumpAndSettle();
    expect(backend.availability, isTrue);
    expect(find.text('متاح لاستقبال الطلبات'), findsOneWidget);
    await tester.tap(navigationLabel('الطلبات'));
    await tester.pumpAndSettle();
    expect(find.text('طلب صيانة كهرباء'), findsOneWidget);
  });

  testWidgets('يتحقق من البريد وكلمة المرور ويتيح إظهارها', (tester) async {
    final backend = FakeFazaaBackend();
    await openRole(tester, 'أحتاج خدمة', backend);
    await tester.tap(find.text('البريد الإلكتروني').first);
    await tester.pumpAndSettle();

    await tester.ensureVisible(find.text('دخول إلى حساب العميل'));
    await tester.tap(find.text('دخول إلى حساب العميل'));
    await tester.pumpAndSettle();
    expect(find.text('أدخل بريدًا إلكترونيًا صحيحًا.'), findsOneWidget);

    await tester.enterText(
      find.byKey(const ValueKey('login-email-field')),
      'client@example.com',
    );
    await tester.enterText(
      find.byKey(const ValueKey('login-password-field')),
      'secret123',
    );
    expect(passwordIsObscured(tester), isTrue);

    await tester.ensureVisible(find.byTooltip('إظهار كلمة المرور'));
    await tester.tap(find.byTooltip('إظهار كلمة المرور'));
    await tester.pumpAndSettle();
    expect(passwordIsObscured(tester), isFalse);

    await tester.ensureVisible(find.text('دخول إلى حساب العميل'));
    await tester.tap(find.text('دخول إلى حساب العميل'));
    await tester.pumpAndSettle();
    expect(find.text('أهلًا نورة العريقي'), findsOneWidget);
  });

  testWidgets('تسجيل الخروج يبطل الجلسة المحلية ويعيد إلى الترحيب', (
    tester,
  ) async {
    final backend = FakeFazaaBackend()
      ..user = BackendUser(
        id: 41,
        name: 'نورة العريقي',
        role: 'client',
        status: 'active',
      );
    await tester.pumpWidget(FazaaApp(backend: backend));
    await tester.pumpAndSettle();
    await tester.tap(navigationLabel('حسابي'));
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.text('تسجيل الخروج'));
    await tester.tap(find.text('تسجيل الخروج'));
    await tester.pumpAndSettle();
    expect(backend.logoutCalls, 1);
    expect(find.text('أحتاج خدمة'), findsOneWidget);
  });
}
