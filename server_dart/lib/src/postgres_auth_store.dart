import 'package:postgres/postgres.dart';

import 'auth_store.dart';
import 'default_categories.dart';
import 'models.dart';

final class PostgresAuthStore implements AuthStore {
  PostgresAuthStore(String connectionString)
    : _pool = Pool.withUrl(connectionString);

  final Pool _pool;

  static const _userColumns = '''
    id,
    phone,
    name,
    email,
    "passwordHash" AS "passwordHash",
    role::text AS role,
    status::text AS status,
    "avatarUrl" AS "avatarUrl",
    "phoneVerified" AS "phoneVerified",
    "emailVerified" AS "emailVerified",
    city,
    country,
    governorate,
    district,
    latitude,
    longitude,
    whatsapp,
    "categoryId" AS "categoryId",
    specialty,
    bio,
    "yearsExperience" AS "yearsExperience",
    "providerAccountStatus"::text AS "providerAccountStatus",
    "subscriptionPlan"::text AS "subscriptionPlan",
    "subscriptionExpiresAt" AS "subscriptionExpiresAt",
    "termsAcceptedAt" AS "termsAcceptedAt",
    "createdAt" AS "createdAt",
    "isAvailable" AS "isAvailable"
  ''';

  static const _joinedUserColumns = '''
    u.id,
    u.phone,
    u.name,
    u.email,
    u."passwordHash" AS "passwordHash",
    u.role::text AS role,
    u.status::text AS status,
    u."avatarUrl" AS "avatarUrl",
    u."phoneVerified" AS "phoneVerified",
    u."emailVerified" AS "emailVerified",
    u.city,
    u.country,
    u.governorate,
    u.district,
    u.latitude,
    u.longitude,
    u.whatsapp,
    u."categoryId" AS "categoryId",
    u.specialty,
    u.bio,
    u."yearsExperience" AS "yearsExperience",
    u."providerAccountStatus"::text AS "providerAccountStatus",
    u."subscriptionPlan"::text AS "subscriptionPlan",
    u."subscriptionExpiresAt" AS "subscriptionExpiresAt",
    u."termsAcceptedAt" AS "termsAcceptedAt",
    u."createdAt" AS "createdAt",
    u."isAvailable" AS "isAvailable"
  ''';

  @override
  Future<void> checkConnection() async {
    await _pool.execute(Sql.named('SELECT 1'));
  }

  @override
  Future<List<JsonRow>> findUsersByEmail(String email) async {
    final rows = await _pool.execute(
      Sql.named('''
        SELECT $_userColumns
        FROM phone_users
        WHERE lower(email) = @email
        ORDER BY id ASC
        LIMIT 2
      '''),
      parameters: {'email': email},
    );
    return rows.map((row) => row.toColumnMap()).toList(growable: false);
  }

  @override
  Future<JsonRow?> findUserByPhone(String phone) async {
    final rows = await _pool.execute(
      Sql.named('''
        SELECT $_userColumns
        FROM phone_users
        WHERE phone = @phone
        LIMIT 1
      '''),
      parameters: {'phone': phone},
    );
    return rows.isEmpty ? null : rows.first.toColumnMap();
  }

  @override
  Future<JsonRow?> findUserForSession(String token) async {
    final rows = await _pool.execute(
      Sql.named('''
        SELECT $_joinedUserColumns
        FROM phone_auth_sessions s
        INNER JOIN phone_users u
          ON u.phone = s.phone OR s.phone = ('uid:' || u.id::text)
        WHERE s.token = @token
          AND s."expiresAt" > NOW()
          AND u.status = 'active'
        LIMIT 1
      '''),
      parameters: {'token': token},
    );
    return rows.isEmpty ? null : rows.first.toColumnMap();
  }

  @override
  Future<void> createSession({
    required String token,
    required String sessionSubject,
    required DateTime expiresAt,
  }) async {
    await _pool.execute(
      Sql.named('''
        INSERT INTO phone_auth_sessions (token, phone, "expiresAt")
        VALUES (@token, @phone, @expiresAt)
      '''),
      parameters: {
        'token': token,
        'phone': sessionSubject,
        'expiresAt': expiresAt.toUtc(),
      },
    );
  }

  @override
  Future<void> deleteSession(String token) async {
    await _pool.execute(
      Sql.named('DELETE FROM phone_auth_sessions WHERE token = @token'),
      parameters: {'token': token},
    );
  }

  @override
  Future<void> storeOtp({
    required String phone,
    required String codeHash,
    required DateTime expiresAt,
  }) async {
    await _pool.execute(
      Sql.named('''
        INSERT INTO phone_otp_codes (phone, "codeHash", "expiresAt", attempts)
        VALUES (@phone, @codeHash, @expiresAt, 0)
        ON CONFLICT (phone) DO UPDATE
        SET "codeHash" = EXCLUDED."codeHash",
            "expiresAt" = EXCLUDED."expiresAt",
            attempts = 0,
            "createdAt" = NOW()
      '''),
      parameters: {
        'phone': phone,
        'codeHash': codeHash,
        'expiresAt': expiresAt.toUtc(),
      },
    );
  }

  @override
  Future<OtpVerificationResult> verifyOtpAndCreateSession({
    required String phone,
    required String codeHash,
    required String role,
    required String token,
    required DateTime now,
    required DateTime sessionExpiresAt,
  }) {
    return _pool.runTx((transaction) async {
      final otpRows = await transaction.execute(
        Sql.named('''
          SELECT "codeHash" AS "codeHash", "expiresAt" AS "expiresAt", attempts
          FROM phone_otp_codes
          WHERE phone = @phone
          FOR UPDATE
        '''),
        parameters: {'phone': phone},
      );
      if (otpRows.isEmpty) {
        return const OtpVerificationResult(OtpVerificationKind.missing);
      }

      final otp = otpRows.first.toColumnMap();
      final expiresAt = otp['expiresAt'];
      if (expiresAt is! DateTime || !expiresAt.isAfter(now)) {
        return const OtpVerificationResult(OtpVerificationKind.expired);
      }
      final attempts = _asInt(otp['attempts']);
      if (attempts >= 5) {
        return const OtpVerificationResult(OtpVerificationKind.locked);
      }
      if (!_constantTimeEquals(otp['codeHash']?.toString() ?? '', codeHash)) {
        await transaction.execute(
          Sql.named('''
            UPDATE phone_otp_codes
            SET attempts = attempts + 1
            WHERE phone = @phone
          '''),
          parameters: {'phone': phone},
        );
        return const OtpVerificationResult(OtpVerificationKind.incorrect);
      }

      final userRows = await transaction.execute(
        Sql.named('''
          SELECT $_userColumns
          FROM phone_users
          WHERE phone = @phone
          LIMIT 1
        '''),
        parameters: {'phone': phone},
      );
      if (userRows.isEmpty) {
        return const OtpVerificationResult(
          OtpVerificationKind.needsRegistration,
        );
      }

      final user = userRows.first.toColumnMap();
      if (user['role'] != role) {
        return const OtpVerificationResult(OtpVerificationKind.roleConflict);
      }
      if (user['status'] != 'active') {
        return const OtpVerificationResult(OtpVerificationKind.inactive);
      }

      await transaction.execute(
        Sql.named('DELETE FROM phone_otp_codes WHERE phone = @phone'),
        parameters: {'phone': phone},
      );
      await transaction.execute(
        Sql.named('''
          INSERT INTO phone_auth_sessions (token, phone, "expiresAt")
          VALUES (@token, @phone, @expiresAt)
        '''),
        parameters: {
          'token': token,
          'phone': phone,
          'expiresAt': sessionExpiresAt.toUtc(),
        },
      );
      return OtpVerificationResult(
        OtpVerificationKind.success,
        user: user,
        token: token,
      );
    });
  }

  @override
  Future<JsonRow> loadDashboard(JsonRow user) async {
    final userId = _asInt(user['id']);
    final role = user['role']?.toString() ?? '';
    final ownerColumn = role == 'provider' ? '"providerId"' : '"clientId"';
    final countRows = await _pool.execute(
      Sql.named('''
        SELECT status::text AS status, COUNT(*)::int AS count
        FROM service_requests
        WHERE $ownerColumn = @userId
        GROUP BY status
      '''),
      parameters: {'userId': userId},
    );
    final counts = <String, int>{};
    for (final row in countRows) {
      final value = row.toColumnMap();
      counts[value['status']?.toString() ?? ''] = _asInt(value['count']);
    }

    final requestRows = await _pool.execute(
      Sql.named('''
        SELECT id, status::text AS status, "serviceType" AS "serviceType",
               city, district, "scheduledAt" AS "scheduledAt",
               "createdAt" AS "createdAt", "isImmediate" AS "isImmediate"
        FROM service_requests
        WHERE $ownerColumn = @userId
        ORDER BY "createdAt" DESC
        LIMIT 8
      '''),
      parameters: {'userId': userId},
    );
    final requests = requestRows
        .map((row) {
          final data = row.toColumnMap();
          return <String, Object?>{
            'id': _asInt(data['id']),
            'status': data['status'],
            'serviceType': data['serviceType'],
            'city': data['city'],
            'district': data['district'],
            'scheduledAt': _iso(data['scheduledAt']),
            'createdAt': _iso(data['createdAt']),
            'isImmediate': data['isImmediate'] == true,
          };
        })
        .toList(growable: false);

    var favorites = 0;
    if (role == 'client') {
      final favoriteRows = await _pool.execute(
        Sql.named('''
          SELECT COUNT(*)::int AS count
          FROM provider_favorites
          WHERE "clientId" = @userId
        '''),
        parameters: {'userId': userId},
      );
      if (favoriteRows.isNotEmpty) {
        favorites = _asInt(favoriteRows.first.toColumnMap()['count']);
      }
    }

    final total = counts.values.fold<int>(0, (sum, count) => sum + count);
    final completed = counts['completed'] ?? 0;
    final active = counts.entries
        .where(
          (entry) =>
              !const {'completed', 'cancelled', 'rejected'}.contains(entry.key),
        )
        .fold<int>(0, (sum, entry) => sum + entry.value);

    return <String, Object?>{
      'user': publicUser(user),
      'metrics': <String, Object?>{
        'totalRequests': total,
        'newRequests': counts['pending'] ?? 0,
        'activeRequests': active,
        'completedRequests': completed,
        'favorites': favorites,
        'rating': null,
        'reviewCount': 0,
      },
      'recentRequests': requests,
    };
  }

  @override
  Future<bool> setProviderAvailability({
    required int userId,
    required bool available,
  }) async {
    final result = await _pool.execute(
      Sql.named('''
        UPDATE phone_users
        SET "isAvailable" = @available, "updatedAt" = NOW()
        WHERE id = @userId AND role = 'provider' AND status = 'active'
        RETURNING id
      '''),
      parameters: {'userId': userId, 'available': available},
    );
    return result.isNotEmpty;
  }

  @override
  Future<List<JsonRow>> listCategories() async => defaultCategories;

  @override
  Future<void> close() => _pool.close();

  static int _asInt(Object? value) {
    if (value is int) return value;
    if (value is num) return value.toInt();
    return int.tryParse(value?.toString() ?? '') ?? 0;
  }

  static String? _iso(Object? value) {
    if (value is DateTime) return value.toUtc().toIso8601String();
    return value?.toString();
  }

  static bool _constantTimeEquals(String left, String right) {
    if (left.length != right.length) return false;
    var difference = 0;
    for (var index = 0; index < left.length; index++) {
      difference |= left.codeUnitAt(index) ^ right.codeUnitAt(index);
    }
    return difference == 0;
  }
}
