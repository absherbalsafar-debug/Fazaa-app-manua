import 'package:flutter_secure_storage/flutter_secure_storage.dart';

abstract interface class SessionTokenStore {
  Future<String?> read();

  Future<void> write(String token);

  Future<void> delete();
}

final class SecureSessionTokenStore implements SessionTokenStore {
  SecureSessionTokenStore({FlutterSecureStorage? storage})
    : _storage = storage ?? const FlutterSecureStorage();

  static const String _tokenKey = 'fazaah.session.token';

  final FlutterSecureStorage _storage;

  @override
  Future<String?> read() => _storage.read(key: _tokenKey);

  @override
  Future<void> write(String token) =>
      _storage.write(key: _tokenKey, value: token);

  @override
  Future<void> delete() => _storage.delete(key: _tokenKey);
}
