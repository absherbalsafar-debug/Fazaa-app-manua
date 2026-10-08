typedef JsonRow = Map<String, Object?>;

enum OtpVerificationKind {
  success,
  missing,
  expired,
  locked,
  incorrect,
  needsRegistration,
  roleConflict,
  inactive,
}

final class OtpVerificationResult {
  const OtpVerificationResult(this.kind, {this.user, this.token});

  final OtpVerificationKind kind;
  final JsonRow? user;
  final String? token;
}

Object? _isoValue(Object? value) {
  if (value is DateTime) return value.toUtc().toIso8601String();
  return value;
}

bool _boolValue(Object? value) {
  if (value is bool) return value;
  if (value is num) return value != 0;
  return value?.toString().toLowerCase() == 'true';
}

/// Only fields needed by the current Flutter UI and API are serialized.
/// In particular, this deliberately excludes passwordHash and nationalId.
JsonRow publicUser(JsonRow row) {
  final keys = <String>[
    'id',
    'name',
    'phone',
    'email',
    'role',
    'status',
    'avatarUrl',
    'city',
    'country',
    'governorate',
    'district',
    'whatsapp',
    'categoryId',
    'specialty',
    'bio',
    'yearsExperience',
    'providerAccountStatus',
    'subscriptionPlan',
    'subscriptionExpiresAt',
    'termsAcceptedAt',
    'createdAt',
    'isAvailable',
  ];
  final result = <String, Object?>{};
  for (final key in keys) {
    if (row.containsKey(key)) result[key] = _isoValue(row[key]);
  }
  result['phoneVerified'] = _boolValue(row['phoneVerified']);
  result['emailVerified'] = _boolValue(row['emailVerified']);
  final latitude = double.tryParse(row['latitude']?.toString() ?? '');
  final longitude = double.tryParse(row['longitude']?.toString() ?? '');
  result['latitude'] = latitude;
  result['longitude'] = longitude;
  return result;
}
