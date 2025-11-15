class Hospital {
  final String id;
  final String name;
  final String type; // 'HOSPITAL' or 'CLINIC'
  final String address;
  final String city;
  final String? phone;
  final String? email;
  final String? website;
  final bool isActive;
  final DateTime createdAt;
  final DateTime updatedAt;
  final List<HospitalSpecialty>? specialties;
  final List<HospitalService>? services;

  Hospital({
    required this.id,
    required this.name,
    required this.type,
    required this.address,
    required this.city,
    this.phone,
    this.email,
    this.website,
    required this.isActive,
    required this.createdAt,
    required this.updatedAt,
    this.specialties,
    this.services,
  });

  factory Hospital.fromJson(Map<String, dynamic> json) {
    return Hospital(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      type: json['type'] ?? 'HOSPITAL',
      address: json['address'] ?? '',
      city: json['city'] ?? '',
      phone: json['phone'],
      email: json['email'],
      website: json['website'],
      isActive: json['isActive'] ?? true,
      createdAt: DateTime.parse(json['createdAt'] ?? DateTime.now().toIso8601String()),
      updatedAt: DateTime.parse(json['updatedAt'] ?? DateTime.now().toIso8601String()),
      specialties: json['specialties'] != null
          ? (json['specialties'] as List)
              .map((e) => HospitalSpecialty.fromJson(e))
              .toList()
          : null,
      services: json['services'] != null
          ? (json['services'] as List)
              .map((e) => HospitalService.fromJson(e))
              .toList()
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'type': type,
      'address': address,
      'city': city,
      'phone': phone,
      'email': email,
      'website': website,
      'isActive': isActive,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
      'specialties': specialties?.map((e) => e.toJson()).toList(),
      'services': services?.map((e) => e.toJson()).toList(),
    };
  }

  String get displayType => type == 'HOSPITAL' ? 'Hospital' : 'Clinic';
  
  String get shortAddress {
    if (address.length > 50) {
      return '${address.substring(0, 50)}...';
    }
    return address;
  }

  bool get hasContactInfo => phone != null || email != null || website != null;
}

class HospitalSpecialty {
  final String id;
  final String hospitalId;
  final String specialtyId;
  final String specialtyName;
  final bool isActive;
  final DateTime createdAt;
  final DateTime updatedAt;

  HospitalSpecialty({
    required this.id,
    required this.hospitalId,
    required this.specialtyId,
    required this.specialtyName,
    required this.isActive,
    required this.createdAt,
    required this.updatedAt,
  });

  factory HospitalSpecialty.fromJson(Map<String, dynamic> json) {
    return HospitalSpecialty(
      id: json['id'] ?? '',
      hospitalId: json['hospitalId'] ?? '',
      specialtyId: json['specialtyId'] ?? '',
      specialtyName: json['specialtyName'] ?? '',
      isActive: json['isActive'] ?? true,
      createdAt: DateTime.parse(json['createdAt'] ?? DateTime.now().toIso8601String()),
      updatedAt: DateTime.parse(json['updatedAt'] ?? DateTime.now().toIso8601String()),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'hospitalId': hospitalId,
      'specialtyId': specialtyId,
      'specialtyName': specialtyName,
      'isActive': isActive,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }
}


class HospitalService {
  final String id;
  final String hospitalId;
  final String serviceId;
  final String serviceName;
  final bool isActive;
  final DateTime createdAt;
  final DateTime updatedAt;

  HospitalService({
    required this.id,
    required this.hospitalId,
    required this.serviceId,
    required this.serviceName,
    required this.isActive,
    required this.createdAt,
    required this.updatedAt,
  });

  factory HospitalService.fromJson(Map<String, dynamic> json) {
    return HospitalService(
      id: json['id'] ?? '',
      hospitalId: json['hospitalId'] ?? '',
      serviceId: json['serviceId'] ?? '',
      serviceName: json['serviceName'] ?? '',
      isActive: json['isActive'] ?? true,
      createdAt: DateTime.parse(json['createdAt'] ?? DateTime.now().toIso8601String()),
      updatedAt: DateTime.parse(json['updatedAt'] ?? DateTime.now().toIso8601String()),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'hospitalId': hospitalId,
      'serviceId': serviceId,
      'serviceName': serviceName,
      'isActive': isActive,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }
}
