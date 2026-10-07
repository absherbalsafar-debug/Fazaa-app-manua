import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';

import '../features/role_intro/presentation/role_intro_page.dart';
import '../features/welcome/presentation/welcome_page.dart';
import 'app_routes.dart';
import 'theme/fazaah_theme.dart';

class FazaaApp extends StatelessWidget {
  const FazaaApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'فزعة',
      debugShowCheckedModeBanner: false,
      locale: const Locale('ar'),
      supportedLocales: const [Locale('ar'), Locale('en')],
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      theme: FazaaTheme.light,
      home: const WelcomePage(),
      routes: {
        AppRoutes.customer: (_) => const RoleIntroPage(
          title: 'أحتاج خدمة',
          message: 'رحلتك تبدأ من احتياجك. سنبني تجربة العميل هنا خطوة بخطوة.',
          icon: Icons.home_repair_service_rounded,
        ),
        AppRoutes.provider: (_) => const RoleIntroPage(
          title: 'أقدم خدمة',
          message:
              'سنجهز لك أدوات إدارة الطلبات والملف المهني في المرحلة التالية.',
          icon: Icons.handyman_rounded,
        ),
      },
    );
  }
}
