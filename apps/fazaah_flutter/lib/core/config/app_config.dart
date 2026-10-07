abstract final class AppConfig {
  /// Override at build/run time with --dart-define=FAZAA_API_BASE_URL=... .
  /// The default is same-origin so a future deployment proxy can route /api.
  static const apiBaseUrl = String.fromEnvironment(
    'FAZAA_API_BASE_URL',
    defaultValue: '/api',
  );
}
