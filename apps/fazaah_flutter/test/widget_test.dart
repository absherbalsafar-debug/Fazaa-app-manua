import 'package:fazaah_flutter/app/fazaah_app.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('يعرض اختيار نوع الحساب وينتقل لمسار العميل', (tester) async {
    await tester.pumpWidget(const FazaaApp());

    expect(find.text('فزعة'), findsOneWidget);
    expect(find.text('أحتاج خدمة'), findsOneWidget);
    expect(find.text('أقدم خدمة'), findsOneWidget);

    await tester.tap(find.text('أحتاج خدمة'));
    await tester.pumpAndSettle();

    expect(find.text('أحتاج خدمة'), findsWidgets);
    expect(find.textContaining('رحلتك تبدأ من احتياجك'), findsOneWidget);
  });
}
