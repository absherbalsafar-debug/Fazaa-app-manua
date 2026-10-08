import 'dart:async';
import 'dart:io';

import 'package:fazaah_api_dart/src/api_server.dart';
import 'package:fazaah_api_dart/src/postgres_auth_store.dart';

Future<void> main() async {
  final environment = Platform.environment;
  final port = int.tryParse(environment['PORT'] ?? '') ?? 8080;
  final appEnvironment = (environment['APP_ENV'] ?? 'production').toLowerCase();
  final connectionString = environment['NEON_DATABASE_URL']?.trim() ?? '';
  final store = connectionString.isEmpty
      ? null
      : PostgresAuthStore(connectionString);
  final allowedOrigins = (environment['CORS_ALLOWED_ORIGINS'] ?? '')
      .split(',')
      .map((origin) => origin.trim())
      .where((origin) => origin.isNotEmpty)
      .toSet();
  final api = FazaaApiServer(
    store: store,
    allowDevelopmentOtp:
        appEnvironment == 'development' &&
        environment['ALLOW_DEV_OTP'] == 'true',
    allowedOrigins: allowedOrigins,
  );
  final server = await HttpServer.bind(InternetAddress.anyIPv4, port);
  stdout.writeln('Fazaa Dart API listening on 0.0.0.0:$port');
  stdout.writeln('Neon database configured: ${store != null}');
  stdout.writeln('Development OTP enabled: ${api.allowDevelopmentOtp}');

  final signalSubscriptions = <StreamSubscription<ProcessSignal>>[
    ProcessSignal.sigint.watch().listen(
      (_) => unawaited(server.close(force: true)),
    ),
    ProcessSignal.sigterm.watch().listen(
      (_) => unawaited(server.close(force: true)),
    ),
  ];
  await for (final request in server) {
    unawaited(api.handle(request));
  }
  for (final subscription in signalSubscriptions) {
    await subscription.cancel();
  }
  await store?.close();
}
