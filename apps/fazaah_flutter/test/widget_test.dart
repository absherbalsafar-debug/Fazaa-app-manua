import 'package:fazaah_flutter/app/fazaah_app.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

Future<void> openRole(WidgetTester tester, String label) async {
  await tester.pumpWidget(const FazaaApp());
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
  testWidgets('دخول العميل بالجوال يفتح لوحة العميل والتنقل يعمل', (
    tester,
  ) async {
    await openRole(tester, 'أحتاج خدمة');

    expect(find.text('تسجيل دخول العميل'), findsOneWidget);
    await tester.enterText(
      find.byKey(const ValueKey('login-phone-field')),
      '771234567',
    );
    await tester.tap(find.text('المتابعة برمز التحقق'));
    await tester.pumpAndSettle();

    expect(find.text('تحقق من رقم الجوال'), findsOneWidget);
    expect(find.textContaining('لم يُرسل رمز فعلي'), findsOneWidget);
    await tester.enterText(
      find.byKey(const ValueKey('login-otp-field')),
      '123456',
    );
    await tester.ensureVisible(find.text('تأكيد الرمز'));
    await tester.tap(find.text('تأكيد الرمز'));
    await tester.pumpAndSettle();

    expect(find.text('أهلًا بك في فزعة'), findsOneWidget);
    expect(find.textContaining('لا توجد جلسة دخول حقيقية'), findsOneWidget);
    expect(navigationLabel('الرئيسية'), findsOneWidget);
    await tester.tap(navigationLabel('طلباتي'));
    await tester.pumpAndSettle();
    expect(find.text('لا توجد بيانات لعرضها'), findsOneWidget);
  });

  testWidgets('دخول المهني بالبريد يفتح لوحته وتبويب الطلبات', (tester) async {
    await openRole(tester, 'أقدم خدمة');
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

    expect(find.text('أهلًا بك، مهني فزعة'), findsOneWidget);
    expect(find.text('طلبات جديدة'), findsOneWidget);
    expect(navigationLabel('لوحتي'), findsOneWidget);
    expect(find.text('غير متاح حاليًا'), findsOneWidget);
    await tester.tap(find.byType(Switch).first);
    await tester.pumpAndSettle();
    expect(find.text('متاح لاستقبال الطلبات'), findsOneWidget);
    await tester.tap(navigationLabel('الطلبات'));
    await tester.pumpAndSettle();
    expect(find.text('لا توجد طلبات جديدة'), findsOneWidget);
  });

  testWidgets('يتحقق من البريد وكلمة المرور ويتيح إظهارها', (tester) async {
    await openRole(tester, 'أحتاج خدمة');
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
    expect(find.text('أهلًا بك في فزعة'), findsOneWidget);
  });
}
