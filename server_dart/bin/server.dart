import 'dart:io';

import 'package:fazaah_api_dart/src/api_server.dart';

Future<void> main() async {
  final port = int.tryParse(Platform.environment['PORT'] ?? '') ?? 8080;
  final server = await FazaaApiServer.bind(port: port);
  stdout.writeln('Fazaa Dart API scaffold listening on 0.0.0.0:$port');

  await for (final request in server) {
    await FazaaApiServer.handle(request);
  }
}
