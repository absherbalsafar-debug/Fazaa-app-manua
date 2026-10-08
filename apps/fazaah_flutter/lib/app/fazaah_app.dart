import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';

import '../core/network/backend_models.dart';
import '../core/network/fazaa_backend.dart';
import '../core/network/http_fazaa_backend.dart';
import '../features/auth/domain/account_role.dart';
import '../features/auth/presentation/login_page.dart';
import '../features/dashboard/presentation/dashboard_page.dart';
import '../features/welcome/presentation/welcome_page.dart';
import 'app_routes.dart';
import 'theme/fazaah_theme.dart';

class FazaaApp extends StatefulWidget {
  const FazaaApp({this.backend, super.key});

  final FazaaBackend? backend;

  @override
  State<FazaaApp> createState() => _FazaaAppState();
}

class _FazaaAppState extends State<FazaaApp> {
  late final FazaaBackend _backend = widget.backend ?? HttpFazaaBackend();
  late final Future<BackendUser?> _initialUser = _restoreSession();

  Future<BackendUser?> _restoreSession() async {
    try {
      return await _backend.restoreSession();
    } catch (_) {
      // Keep the entry screen available when the API is temporarily offline.
      return null;
    }
  }

  Widget _homeFor(AsyncSnapshot<BackendUser?> snapshot) {
    if (snapshot.connectionState != ConnectionState.done) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator.adaptive()),
      );
    }
    final user = snapshot.data;
    final role = user?.accountRole;
    if (user != null && role != null) {
      return DashboardPage(role: role, backend: _backend);
    }
    return const WelcomePage();
  }

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
      home: FutureBuilder<BackendUser?>(
        future: _initialUser,
        builder: (context, snapshot) => _homeFor(snapshot),
      ),
      routes: {
        AppRoutes.signedOut: (_) => const WelcomePage(),
        AppRoutes.customer: (_) =>
            LoginPage(role: AccountRole.customer, backend: _backend),
        AppRoutes.provider: (_) =>
            LoginPage(role: AccountRole.professional, backend: _backend),
        AppRoutes.customerDashboard: (_) =>
            DashboardPage(role: AccountRole.customer, backend: _backend),
        AppRoutes.providerDashboard: (_) =>
            DashboardPage(role: AccountRole.professional, backend: _backend),
      },
    );
  }
}
