import 'dart:convert';
import 'dart:io';

abstract final class FazaaApiServer {
  static Future<HttpServer> bind({required int port}) {
    return HttpServer.bind(InternetAddress.anyIPv4, port);
  }

  static Future<void> handle(HttpRequest request) async {
    final response = request.response;
    response.headers.contentType = ContentType.json;
    response.headers.set(HttpHeaders.cacheControlHeader, 'no-store');

    if (request.method == 'GET' &&
        (request.uri.path == '/health' || request.uri.path == '/api/health')) {
      response.statusCode = HttpStatus.ok;
      response.write(
        jsonEncode({
          'status': 'ok',
          'service': 'fazaah-api-dart',
          'phase': 'scaffold',
        }),
      );
    } else {
      response.statusCode = HttpStatus.notFound;
      response.write(jsonEncode({'error': 'route_not_found'}));
    }

    await response.close();
  }
}
