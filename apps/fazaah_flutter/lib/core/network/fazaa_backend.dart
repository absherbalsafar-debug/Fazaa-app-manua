import 'backend_models.dart';

abstract interface class FazaaBackend {
  Future<BackendUser?> restoreSession();

  Future<BackendUser> loginWithEmail({
    required String email,
    required String password,
    required String role,
  });

  Future<OtpChallenge> sendPhoneOtp({
    required String phone,
    required String role,
  });

  Future<BackendUser> verifyPhoneOtp({
    required String phone,
    required String code,
    required String role,
  });

  Future<DashboardSnapshot> loadDashboard();

  Future<void> setProviderAvailability(bool available);

  Future<void> logout();
}

final class BackendException implements Exception {
  const BackendException(this.message, {this.statusCode});

  final String message;
  final int? statusCode;

  @override
  String toString() => message;
}
