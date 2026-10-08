import 'models.dart';

abstract interface class AuthStore {
  Future<void> checkConnection();

  Future<List<JsonRow>> findUsersByEmail(String email);

  Future<JsonRow?> findUserByPhone(String phone);

  Future<JsonRow?> findUserForSession(String token);

  Future<void> createSession({
    required String token,
    required String sessionSubject,
    required DateTime expiresAt,
  });

  Future<void> deleteSession(String token);

  Future<void> storeOtp({
    required String phone,
    required String codeHash,
    required DateTime expiresAt,
  });

  Future<OtpVerificationResult> verifyOtpAndCreateSession({
    required String phone,
    required String codeHash,
    required String role,
    required String token,
    required DateTime now,
    required DateTime sessionExpiresAt,
  });

  Future<JsonRow> loadDashboard(JsonRow user);

  Future<bool> setProviderAvailability({
    required int userId,
    required bool available,
  });

  Future<List<JsonRow>> listCategories();

  Future<void> close();
}
