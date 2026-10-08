import '../../features/auth/domain/account_role.dart';

typedef JsonMap = Map<String, dynamic>;

final class BackendUser {
  const BackendUser({
    required this.id,
    required this.name,
    required this.role,
    required this.status,
    this.phone,
    this.email,
    this.city,
    this.avatarUrl,
    this.providerAccountStatus,
    this.isAvailable = false,
  });

  final int id;
  final String name;
  final String role;
  final String status;
  final String? phone;
  final String? email;
  final String? city;
  final String? avatarUrl;
  final String? providerAccountStatus;
  final bool isAvailable;

  AccountRole? get accountRole => switch (role) {
    'client' => AccountRole.customer,
    'provider' => AccountRole.professional,
    _ => null,
  };

  factory BackendUser.fromJson(JsonMap json) => BackendUser(
    id: _asInt(json['id']),
    name: json['name']?.toString() ?? 'مستخدم فزعة',
    role: json['role']?.toString() ?? '',
    status: json['status']?.toString() ?? '',
    phone: json['phone']?.toString(),
    email: json['email']?.toString(),
    city: json['city']?.toString(),
    avatarUrl: json['avatarUrl']?.toString(),
    providerAccountStatus: json['providerAccountStatus']?.toString(),
    isAvailable: json['isAvailable'] == true,
  );
}

final class OtpChallenge {
  const OtpChallenge({
    required this.phone,
    required this.expiresInSeconds,
    this.developmentCode,
  });

  final String phone;
  final int expiresInSeconds;
  final String? developmentCode;

  factory OtpChallenge.fromJson(JsonMap json) => OtpChallenge(
    phone: json['phone']?.toString() ?? '',
    expiresInSeconds: _asInt(json['expiresInSeconds']),
    developmentCode: json['developmentOnly'] == true
        ? json['otp']?.toString()
        : null,
  );
}

final class ServiceCategory {
  const ServiceCategory({required this.id, required this.name, this.icon});

  final int id;
  final String name;
  final String? icon;

  factory ServiceCategory.fromJson(JsonMap json) => ServiceCategory(
    id: _asInt(json['id']),
    name: json['name']?.toString() ?? '',
    icon: json['icon']?.toString(),
  );
}

final class ServiceRequestSummary {
  const ServiceRequestSummary({
    required this.id,
    required this.status,
    required this.serviceType,
    required this.city,
    required this.createdAt,
    this.district = '',
    this.scheduledAt,
    this.isImmediate = false,
  });

  final int id;
  final String status;
  final String serviceType;
  final String city;
  final String district;
  final String createdAt;
  final String? scheduledAt;
  final bool isImmediate;

  factory ServiceRequestSummary.fromJson(JsonMap json) => ServiceRequestSummary(
    id: _asInt(json['id']),
    status: json['status']?.toString() ?? 'pending',
    serviceType: json['serviceType']?.toString() ?? 'خدمة',
    city: json['city']?.toString() ?? '',
    district: json['district']?.toString() ?? '',
    createdAt: json['createdAt']?.toString() ?? '',
    scheduledAt: json['scheduledAt']?.toString(),
    isImmediate: json['isImmediate'] == true,
  );
}

final class DashboardSnapshot {
  const DashboardSnapshot({
    required this.user,
    required this.metrics,
    required this.recentRequests,
    required this.categories,
  });

  final BackendUser user;
  final JsonMap metrics;
  final List<ServiceRequestSummary> recentRequests;
  final List<ServiceCategory> categories;

  int metric(String key) => _asInt(metrics[key]);

  double? get rating {
    final value = metrics['rating'];
    if (value is num) return value.toDouble();
    return double.tryParse(value?.toString() ?? '');
  }

  factory DashboardSnapshot.fromJson(
    JsonMap dashboardJson,
    List<JsonMap> categoryJson,
  ) {
    final userJson = _asMap(dashboardJson['user']);
    final metricsJson = _asMap(dashboardJson['metrics']);
    final requestJson = _asList(dashboardJson['recentRequests']);
    return DashboardSnapshot(
      user: BackendUser.fromJson(userJson),
      metrics: metricsJson,
      recentRequests: requestJson
          .map((item) => ServiceRequestSummary.fromJson(_asMap(item)))
          .toList(growable: false),
      categories: categoryJson
          .map(ServiceCategory.fromJson)
          .where((category) => category.name.isNotEmpty)
          .toList(growable: false),
    );
  }
}

JsonMap _asMap(Object? value) {
  if (value is Map<String, dynamic>) return value;
  if (value is Map) {
    return value.map((key, item) => MapEntry(key.toString(), item));
  }
  return <String, dynamic>{};
}

List<dynamic> _asList(Object? value) => value is List ? value : const [];

int _asInt(Object? value) {
  if (value is int) return value;
  if (value is num) {
    return value.toInt();
  }
  return int.tryParse(value?.toString() ?? '') ?? 0;
}
