class HospitalDto {
  final String id;
  final String name;
  final String type;
  final String? address;
  final String? city;
  final String? phone;
  final String? email;
  final String? website;
  final String? logoUrl;
  final String? bookingPolicy;
  final String? description;
  final bool isActive;
  final String createdAt;
  final String updatedAt;
  final List<HospitalSpecialtyDto> specialties;
  final List<HospitalServiceDto> services;

  HospitalDto({
    required this.id,
    required this.name,
    required this.type,
    this.address,
    this.city,
    this.phone,
    this.email,
    this.website,
    this.logoUrl,
    this.bookingPolicy,
    this.description,
    this.isActive = true,
    required this.createdAt,
    required this.updatedAt,
    this.specialties = const [],
    this.services = const [],
  });

  factory HospitalDto.fromJson(Map<String, dynamic> json) {
    return HospitalDto(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      type: json['type'] ?? '',
      address: json['address'],
      city: json['city'],
      phone: json['phone'],
      email: json['email'],
      website: json['website'],
      logoUrl: json['logoUrl'],
      bookingPolicy: json['bookingPolicy'] ?? 'DIRECT_DOCTOR',
      description: json['description'],
      isActive: json['isActive'] ?? true,
      createdAt: json['createdAt'] ?? '',
      updatedAt: json['updatedAt'] ?? '',
      specialties: (json['specialties'] as List<dynamic>?)
              ?.map((e) => HospitalSpecialtyDto.fromJson(e))
              .toList() ??
          [],
      services: (json['services'] as List<dynamic>?)
              ?.map((e) => HospitalServiceDto.fromJson(e))
              .toList() ??
          [],
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'type': type,
        'address': address,
        'city': city,
        'phone': phone,
        'email': email,
        'website': website,
        'logoUrl': logoUrl,
        'bookingPolicy': bookingPolicy,
        'description': description,
        'isActive': isActive,
        'createdAt': createdAt,
        'updatedAt': updatedAt,
        'specialties': specialties.map((e) => e.toJson()).toList(),
        'services': services.map((e) => e.toJson()).toList(),
      };
}

class HospitalSpecialtyDto {
  final String id;
  final String hospitalId;
  final String specialtyId;
  final String name;
  final String? description;
  final bool isActive;

  HospitalSpecialtyDto({
    required this.id,
    required this.hospitalId,
    required this.specialtyId,
    required this.name,
    this.description,
    required this.isActive,
  });

  factory HospitalSpecialtyDto.fromJson(Map<String, dynamic> json) {
    return HospitalSpecialtyDto(
      id: json['id'] ?? '',
      hospitalId: json['hospitalId'] ?? '',
      specialtyId: json['specialtyId'] ?? '',
      name: json['name'] ?? '',
      description: json['description'],
      isActive: json['isActive'] ?? true,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'hospitalId': hospitalId,
        'specialtyId': specialtyId,
        'name': name,
        'description': description,
        'isActive': isActive,
      };
}

class HospitalServiceDto {
  final String id;
  final String hospitalId;
  final String serviceId;
  final String name;
  final String? description;
  final bool isActive;

  HospitalServiceDto({
    required this.id,
    required this.hospitalId,
    required this.serviceId,
    required this.name,
    this.description,
    required this.isActive,
  });

  factory HospitalServiceDto.fromJson(Map<String, dynamic> json) {
    return HospitalServiceDto(
      id: json['id'] ?? '',
      hospitalId: json['hospitalId'] ?? '',
      serviceId: json['serviceId'] ?? '',
      name: json['name'] ?? '',
      description: json['description'],
      isActive: json['isActive'] ?? true,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'hospitalId': hospitalId,
        'serviceId': serviceId,
        'name': name,
        'description': description,
        'isActive': isActive,
      };
}

class HospitalDoctorDto {
  final String id;
  final String doctorId;
  final String hospitalId;
  final String role;
  final String? shift;
  final String? startTime;
  final String? endTime;
  final int? consultationFee;
  final String status;
  final String joinedAt;
  final String? leftAt;
  final DoctorDto? doctor;

  HospitalDoctorDto({
    required this.id,
    required this.doctorId,
    required this.hospitalId,
    required this.role,
    this.shift,
    this.startTime,
    this.endTime,
    this.consultationFee,
    required this.status,
    required this.joinedAt,
    this.leftAt,
    this.doctor,
  });

  factory HospitalDoctorDto.fromJson(Map<String, dynamic> json) {
    return HospitalDoctorDto(
      id: json['id'] ?? '',
      doctorId: json['doctorId'] ?? '',
      hospitalId: json['hospitalId'] ?? '',
      role: json['role'] ?? '',
      shift: json['shift'],
      startTime: json['startTime'],
      endTime: json['endTime'],
      consultationFee: json['consultationFee'],
      status: json['status'] ?? '',
      joinedAt: json['joinedAt'] ?? '',
      leftAt: json['leftAt'],
      doctor: json['doctor'] != null ? DoctorDto.fromJson(json['doctor']) : null,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'doctorId': doctorId,
        'hospitalId': hospitalId,
        'role': role,
        'shift': shift,
        'startTime': startTime,
        'endTime': endTime,
        'consultationFee': consultationFee,
        'status': status,
        'joinedAt': joinedAt,
        'leftAt': leftAt,
        'doctor': doctor?.toJson(),
      };
}

class DoctorDto {
  final String id;
  final String userId;
  final String specialty;
  final String licenseNumber;
  final int experience;
  final bool isVerified;
  final bool isAvailable;
  final int? consultationFee;
  final String? bio;
  final String? imageUrl;
  final String? education;
  final String? certifications;
  final String? languages;
  final String? awards;
  final String? publications;
  final String? memberships;
  final String? researchInterests;
  final DoctorUserDto? user;

  DoctorDto({
    required this.id,
    required this.userId,
    this.specialty = "General Practice",
    required this.licenseNumber,
    required this.experience,
    required this.isVerified,
    required this.isAvailable,
    this.consultationFee,
    this.bio,
    this.imageUrl,
    this.education,
    this.certifications,
    this.languages,
    this.awards,
    this.publications,
    this.memberships,
    this.researchInterests,
    this.user,
  });

  factory DoctorDto.fromJson(Map<String, dynamic> json) {
    return DoctorDto(
      id: json['id'] ?? '',
      userId: json['userId'] ?? '',
      specialty: json['specialty'] ?? "General Practice",
      licenseNumber: json['licenseNumber'] ?? '',
      experience: json['experience'] ?? 0,
      isVerified: json['isVerified'] ?? false,
      isAvailable: json['isAvailable'] ?? false,
      consultationFee: json['consultationFee'],
      bio: json['bio'],
      imageUrl: json['imageUrl'],
      education: json['education'],
      certifications: json['certifications'],
      languages: json['languages'],
      awards: json['awards'],
      publications: json['publications'],
      memberships: json['memberships'],
      researchInterests: json['researchInterests'],
      user: json['user'] != null ? DoctorUserDto.fromJson(json['user']) : null,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'userId': userId,
        'specialty': specialty,
        'licenseNumber': licenseNumber,
        'experience': experience,
        'isVerified': isVerified,
        'isAvailable': isAvailable,
        'consultationFee': consultationFee,
        'bio': bio,
        'imageUrl': imageUrl,
        'education': education,
        'certifications': certifications,
        'languages': languages,
        'awards': awards,
        'publications': publications,
        'memberships': memberships,
        'researchInterests': researchInterests,
        'user': user?.toJson(),
      };

  String get displayName {
    if (user != null) {
      return '${user!.firstName} ${user!.lastName}';
    }
    return 'Dr. $specialty';
  }
}

class DoctorUserDto {
  final String id;
  final String firstName;
  final String lastName;
  final String email;
  final String? phone;

  DoctorUserDto({
    required this.id,
    required this.firstName,
    required this.lastName,
    required this.email,
    this.phone,
  });

  factory DoctorUserDto.fromJson(Map<String, dynamic> json) {
    return DoctorUserDto(
      id: json['id'] ?? '',
      firstName: json['firstName'] ?? '',
      lastName: json['lastName'] ?? '',
      email: json['email'] ?? '',
      phone: json['phone'],
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'firstName': firstName,
        'lastName': lastName,
        'email': email,
        'phone': phone,
      };
}

class WebSocketMessage {
  final String type;
  final String? message;
  final HospitalDto? hospital;
  final String? hospitalId;
  final String? timestamp;

  WebSocketMessage({
    required this.type,
    this.message,
    this.hospital,
    this.hospitalId,
    this.timestamp,
  });

  factory WebSocketMessage.fromJson(Map<String, dynamic> json) {
    return WebSocketMessage(
      type: json['type'] ?? '',
      message: json['message'],
      hospital: json['hospital'] != null
          ? HospitalDto.fromJson(json['hospital'])
          : null,
      hospitalId: json['hospitalId'],
      timestamp: json['timestamp'],
    );
  }
}

enum HospitalUpdateEventType {
  created,
  updated,
  deleted,
}

class HospitalUpdateEvent {
  final HospitalUpdateEventType type;
  final HospitalDto? hospital;
  final String? hospitalId;

  HospitalUpdateEvent({
    required this.type,
    this.hospital,
    this.hospitalId,
  });

  factory HospitalUpdateEvent.fromWebSocketMessage(WebSocketMessage message) {
    switch (message.type) {
      case 'hospital.created':
        return HospitalUpdateEvent(
          type: HospitalUpdateEventType.created,
          hospital: message.hospital,
        );
      case 'hospital.updated':
        return HospitalUpdateEvent(
          type: HospitalUpdateEventType.updated,
          hospital: message.hospital,
        );
      case 'hospital.deleted':
        return HospitalUpdateEvent(
          type: HospitalUpdateEventType.deleted,
          hospitalId: message.hospitalId,
        );
      default:
        throw Exception('Unknown hospital update event type: ${message.type}');
    }
  }
}

