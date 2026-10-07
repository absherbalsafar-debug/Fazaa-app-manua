import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';

import '../features/auth/domain/account_role.dart';
import '../features/auth/presentation/login_page.dart';
import '../features/dashboard/presentation/dashboard_page.dart';
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
        AppRoutes.customer: (_) => const LoginPage(role: AccountRole.customer),
        AppRoutes.provider: (_) =>
            const LoginPage(role: AccountRole.professional),
        AppRoutes.customerDashboard: (_) =>
            const DashboardPage(role: AccountRole.customer),
        AppRoutes.providerDashboard: (_) =>
            const DashboardPage(role: AccountRole.professional),
      },
    );
  }
}
