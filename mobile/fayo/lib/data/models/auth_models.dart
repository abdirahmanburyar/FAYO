class SendOtpRequest {
  final String phone;

  SendOtpRequest({required this.phone});

  Map<String, dynamic> toJson() => {'phone': phone};
}

class SendOtpResponse {
  final String message;
  final int? expiresIn;
  final bool? userCreated;

  SendOtpResponse({
    required this.message,
    this.expiresIn,
    this.userCreated,
  });

  factory SendOtpResponse.fromJson(Map<String, dynamic> json) {
    return SendOtpResponse(
      message: json['message'] ?? '',
      expiresIn: json['expiresIn'],
      userCreated: json['userCreated'],
    );
  }

  bool get success => true;
}

class VerifyOtpRequest {
  final String phone;
  final String otp;

  VerifyOtpRequest({required this.phone, required this.otp});

  Map<String, dynamic> toJson() => {
        'phone': phone,
        'code': otp,
      };
}

class VerifyOtpResponse {
  final String accessToken;
  final String refreshToken;
  final UserDto user;

  VerifyOtpResponse({
    required this.accessToken,
    required this.refreshToken,
    required this.user,
  });

  factory VerifyOtpResponse.fromJson(Map<String, dynamic> json) {
    return VerifyOtpResponse(
      accessToken: json['access_token'] ?? '',
      refreshToken: json['refresh_token'] ?? '',
      user: UserDto.fromJson(json['user'] ?? {}),
    );
  }
}

class UserDto {
  final String id;
  final String? username;
  final String phone;
  final String? firstName;
  final String? lastName;
  final String? email;
  final String role;
  final String? userType;

  UserDto({
    required this.id,
    this.username,
    required this.phone,
    this.firstName,
    this.lastName,
    this.email,
    required this.role,
    this.userType,
  });

  factory UserDto.fromJson(Map<String, dynamic> json) {
    return UserDto(
      id: json['id'] ?? '',
      username: json['username'],
      phone: json['phone'] ?? '',
      firstName: json['firstName'],
      lastName: json['lastName'],
      email: json['email'],
      role: json['role'] ?? 'PATIENT',
      userType: json['userType'],
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'username': username,
        'phone': phone,
        'firstName': firstName,
        'lastName': lastName,
        'email': email,
        'role': role,
        'userType': userType,
      };

  String get fullName {
    if (firstName != null && lastName != null) {
      return '$firstName $lastName';
    } else if (firstName != null) {
      return firstName!;
    } else if (lastName != null) {
      return lastName!;
    } else if (username != null) {
      return username!;
    }
    return phone;
  }
}

class UserProfileDto {
  final String id;
  final String? username;
  final String phone;
  final String? firstName;
  final String? lastName;
  final String? email;
  final String role;
  final String? userType;
  final String? dateOfBirth;
  final String? gender;
  final String? address;
  final String? fullName;
  final String? createdAt;
  final String? updatedAt;

  UserProfileDto({
    required this.id,
    this.username,
    required this.phone,
    this.firstName,
    this.lastName,
    this.email,
    required this.role,
    this.userType,
    this.dateOfBirth,
    this.gender,
    this.address,
    this.fullName,
    this.createdAt,
    this.updatedAt,
  });

  factory UserProfileDto.fromJson(Map<String, dynamic> json) {
    return UserProfileDto(
      id: json['id'] ?? '',
      username: json['username'],
      phone: json['phone'] ?? '',
      firstName: json['firstName'],
      lastName: json['lastName'],
      email: json['email'],
      role: json['role'] ?? 'PATIENT',
      userType: json['userType'],
      dateOfBirth: json['dateOfBirth'],
      gender: json['gender'],
      address: json['address'],
      fullName: json['fullName'],
      createdAt: json['createdAt'],
      updatedAt: json['updatedAt'],
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'username': username,
        'phone': phone,
        'firstName': firstName,
        'lastName': lastName,
        'email': email,
        'role': role,
        'userType': userType,
        'dateOfBirth': dateOfBirth,
        'gender': gender,
        'address': address,
        'fullName': fullName,
        'createdAt': createdAt,
        'updatedAt': updatedAt,
      };

  String get displayName {
    if (fullName != null && fullName!.isNotEmpty) {
      return fullName!;
    }
    if (firstName != null && lastName != null) {
      return '$firstName $lastName';
    } else if (firstName != null) {
      return firstName!;
    } else if (lastName != null) {
      return lastName!;
    } else if (username != null) {
      return username!;
    }
    return phone;
  }
}

class UpdateProfileRequest {
  final String? firstName;
  final String? lastName;
  final String? phone;
  final String? email;
  final String? address;
  final String? dateOfBirth;
  final String? gender;

  UpdateProfileRequest({
    this.firstName,
    this.lastName,
    this.phone,
    this.email,
    this.address,
    this.dateOfBirth,
    this.gender,
  });

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{};
    if (firstName != null) map['firstName'] = firstName;
    if (lastName != null) map['lastName'] = lastName;
    if (phone != null) map['phone'] = phone;
    if (email != null) map['email'] = email;
    if (address != null) map['address'] = address;
    if (dateOfBirth != null) map['dateOfBirth'] = dateOfBirth;
    if (gender != null) map['gender'] = gender;
    return map;
  }
}

