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

void main() {
  testWidgets('يفتح للعميل شاشة دخول مستقلة وخطوة OTP توضيحية', (tester) async {
    await openRole(tester, 'أحتاج خدمة');

    expect(find.text('تسجيل دخول العميل'), findsOneWidget);
    expect(find.byKey(const ValueKey('login-phone-field')), findsOneWidget);

    await tester.enterText(
      find.byKey(const ValueKey('login-phone-field')),
      '771234567',
    );
    await tester.tap(find.text('المتابعة برمز التحقق'));
    await tester.pumpAndSettle();

    expect(find.text('تحقق من رقم الجوال'), findsOneWidget);
    await tester.enterText(
      find.byKey(const ValueKey('login-otp-field')),
      '123456',
    );
    await tester.tap(find.text('تأكيد الرمز'));
    await tester.pumpAndSettle();
    expect(find.textContaining('التحقق غير متصل بالخادم بعد'), findsOneWidget);
  });

  testWidgets('يفتح للمهني شاشة دخول خاصة به', (tester) async {
    await openRole(tester, 'أقدم خدمة');

    expect(find.text('تسجيل دخول المهني'), findsOneWidget);
    expect(
      find.text('تابع طلبات العملاء وأدر ملفك المهني من مكان واحد.'),
      findsOneWidget,
    );
    expect(find.byKey(const ValueKey('login-phone-field')), findsOneWidget);
    expect(find.text('البريد الإلكتروني'), findsOneWidget);
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
    expect(
      find.textContaining('التحقق من الحساب غير مربوط بالخادم بعد'),
      findsOneWidget,
    );
  });
}
