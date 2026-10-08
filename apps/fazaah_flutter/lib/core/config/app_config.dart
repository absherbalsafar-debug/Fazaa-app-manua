abstract final class AppConfig {
  /// Web uses same-origin `/api` by default. Android builds must provide an
  /// HTTPS server URL with `--dart-define=FAZAA_API_BASE_URL=.../api`.
  static const apiBaseUrl = String.fromEnvironment(
    'FAZAA_API_BASE_URL',
    defaultValue: '/api',
  );
}
