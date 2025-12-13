class AppointmentDto {
  final String id;
  final int? appointmentNumber;
  final String patientId;
  final String? doctorId;
  final String? hospitalId;
  final String? specialtyId;
  final String appointmentDate;
  final String appointmentTime;
  final int duration;
  final String status;
  final String consultationType;
  final String? reason;
  final String? description;
  final int consultationFee;
  final String paymentStatus;
  final String createdAt;
  final String updatedAt;

  AppointmentDto({
    required this.id,
    this.appointmentNumber,
    required this.patientId,
    this.doctorId,
    this.hospitalId,
    this.specialtyId,
    required this.appointmentDate,
    required this.appointmentTime,
    required this.duration,
    required this.status,
    required this.consultationType,
    this.reason,
    this.description,
    required this.consultationFee,
    required this.paymentStatus,
    required this.createdAt,
    required this.updatedAt,
  });

  factory AppointmentDto.fromJson(Map<String, dynamic> json) {
    return AppointmentDto(
      id: json['id'] ?? '',
      appointmentNumber: json['appointmentNumber'],
      patientId: json['patientId'] ?? '',
      doctorId: json['doctorId'],
      hospitalId: json['hospitalId'],
      specialtyId: json['specialtyId'],
      appointmentDate: json['appointmentDate'] ?? '',
      appointmentTime: json['appointmentTime'] ?? '',
      duration: json['duration'] ?? 30,
      status: json['status'] ?? '',
      consultationType: json['consultationType'] ?? 'IN_PERSON',
      reason: json['reason'],
      description: json['description'],
      consultationFee: json['consultationFee'] ?? 0,
      paymentStatus: json['paymentStatus'] ?? 'PENDING',
      createdAt: json['createdAt'] ?? '',
      updatedAt: json['updatedAt'] ?? '',
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'appointmentNumber': appointmentNumber,
        'patientId': patientId,
        'doctorId': doctorId,
        'hospitalId': hospitalId,
        'specialtyId': specialtyId,
        'appointmentDate': appointmentDate,
        'appointmentTime': appointmentTime,
        'duration': duration,
        'status': status,
        'consultationType': consultationType,
        'reason': reason,
        'description': description,
        'consultationFee': consultationFee,
        'paymentStatus': paymentStatus,
        'createdAt': createdAt,
        'updatedAt': updatedAt,
      };
}

class CreateAppointmentRequest {
  final String patientId;
  final String? doctorId;
  final String? hospitalId;
  final String? specialtyId;
  final String appointmentDate;
  final String appointmentTime;
  final int duration;
  final String consultationType;
  final String? reason;
  final String? description;
  final String createdBy;

  CreateAppointmentRequest({
    required this.patientId,
    this.doctorId,
    this.hospitalId,
    this.specialtyId,
    required this.appointmentDate,
    required this.appointmentTime,
    this.duration = 30,
    this.consultationType = "IN_PERSON",
    this.reason,
    this.description,
    required this.createdBy,
  });

  Map<String, dynamic> toJson() => {
        'patientId': patientId,
        'doctorId': doctorId,
        'hospitalId': hospitalId,
        'specialtyId': specialtyId,
        'appointmentDate': appointmentDate,
        'appointmentTime': appointmentTime,
        'duration': duration,
        'consultationType': consultationType,
        'reason': reason,
        'description': description,
        'createdBy': createdBy,
      };
}

class CallInvitationDto {
  final String appointmentId;
  final String patientId;
  final String channelName;
  final CallSessionDto? callSession;
  final CallCredentialsDto? credentials;
  final String? timestamp;

  CallInvitationDto({
    required this.appointmentId,
    required this.patientId,
    required this.channelName,
    this.callSession,
    this.credentials,
    this.timestamp,
  });

  factory CallInvitationDto.fromJson(Map<String, dynamic> json) {
    return CallInvitationDto(
      appointmentId: json['appointmentId'] ?? '',
      patientId: json['patientId'] ?? '',
      channelName: json['channelName'] ?? '',
      callSession: json['callSession'] != null
          ? CallSessionDto.fromJson(json['callSession'])
          : null,
      credentials: json['credentials'] != null
          ? CallCredentialsDto.fromJson(json['credentials'])
          : null,
      timestamp: json['timestamp'],
    );
  }

  Map<String, dynamic> toJson() => {
        'appointmentId': appointmentId,
        'patientId': patientId,
        'channelName': channelName,
        'callSession': callSession?.toJson(),
        'credentials': credentials?.toJson(),
        'timestamp': timestamp,
      };
}

class CallSessionDto {
  final String id;
  final String appointmentId;
  final String channelName;
  final String status;
  final String? createdAt;

  CallSessionDto({
    required this.id,
    required this.appointmentId,
    required this.channelName,
    required this.status,
    this.createdAt,
  });

  factory CallSessionDto.fromJson(Map<String, dynamic> json) {
    return CallSessionDto(
      id: json['id'] ?? '',
      appointmentId: json['appointmentId'] ?? '',
      channelName: json['channelName'] ?? '',
      status: json['status'] ?? '',
      createdAt: json['createdAt'],
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'appointmentId': appointmentId,
        'channelName': channelName,
        'status': status,
        'createdAt': createdAt,
      };
}

class CallCredentialsDto {
  final String appId;
  final String token;
  final String channelName;
  final String uid;
  final String role;
  final String? expiresAt;
  final int? expiresIn;

  CallCredentialsDto({
    required this.appId,
    required this.token,
    required this.channelName,
    required this.uid,
    required this.role,
    this.expiresAt,
    this.expiresIn,
  });

  factory CallCredentialsDto.fromJson(Map<String, dynamic> json) {
    return CallCredentialsDto(
      appId: json['appId'] ?? '',
      token: json['token'] ?? '',
      channelName: json['channelName'] ?? '',
      uid: json['uid']?.toString() ?? '0',
      role: json['role'] ?? 'AUDIENCE',
      expiresAt: json['expiresAt'],
      expiresIn: json['expiresIn'],
    );
  }

  Map<String, dynamic> toJson() => {
        'appId': appId,
        'token': token,
        'channelName': channelName,
        'uid': uid,
        'role': role,
        'expiresAt': expiresAt,
        'expiresIn': expiresIn,
      };
}

class CallCredentialsWrapper {
  final CallCredentialsDto? host;
  final CallCredentialsDto? participant;
  final String? appId;
  final String? token;
  final String? channelName;
  final String? uid;
  final String? role;
  final String? expiresAt;
  final int? expiresIn;

  CallCredentialsWrapper({
    this.host,
    this.participant,
    this.appId,
    this.token,
    this.channelName,
    this.uid,
    this.role,
    this.expiresAt,
    this.expiresIn,
  });

  factory CallCredentialsWrapper.fromJson(Map<String, dynamic> json) {
    return CallCredentialsWrapper(
      host: json['host'] != null
          ? CallCredentialsDto.fromJson(json['host'])
          : null,
      participant: json['participant'] != null
          ? CallCredentialsDto.fromJson(json['participant'])
          : null,
      appId: json['appId'],
      token: json['token'],
      channelName: json['channelName'],
      uid: json['uid']?.toString(),
      role: json['role'],
      expiresAt: json['expiresAt'],
      expiresIn: json['expiresIn'],
    );
  }

  CallCredentialsDto? getParticipantCredentials() {
    if (participant != null) return participant;
    if (token != null && appId != null) {
      return CallCredentialsDto(
        appId: appId!,
        token: token!,
        channelName: channelName ?? '',
        uid: uid ?? '0',
        role: role ?? 'AUDIENCE',
        expiresAt: expiresAt,
        expiresIn: expiresIn,
      );
    }
    return null;
  }
}

class CallInvitationMessage {
  final String type;
  final String? appointmentId;
  final String? patientId;
  final String? channelName;
  final CallSessionDto? callSession;
  final CallCredentialsWrapper? credentials;
  final String? timestamp;

  CallInvitationMessage({
    required this.type,
    this.appointmentId,
    this.patientId,
    this.channelName,
    this.callSession,
    this.credentials,
    this.timestamp,
  });

  factory CallInvitationMessage.fromJson(Map<String, dynamic> json) {
    return CallInvitationMessage(
      type: json['type'] ?? '',
      appointmentId: json['appointmentId'],
      patientId: json['patientId'],
      channelName: json['channelName'],
      callSession: json['callSession'] != null
          ? CallSessionDto.fromJson(json['callSession'])
          : null,
      credentials: json['credentials'] != null
          ? CallCredentialsWrapper.fromJson(json['credentials'])
          : null,
      timestamp: json['timestamp'],
    );
  }
}

enum CallInvitationEventType {
  invitationReceived,
  callEnded,
}

class CallInvitationEvent {
  final CallInvitationEventType type;
  final CallInvitationDto? invitation;
  final String? sessionId;
  final String? appointmentId;

  CallInvitationEvent({
    required this.type,
    this.invitation,
    this.sessionId,
    this.appointmentId,
  });

  factory CallInvitationEvent.invitationReceived(CallInvitationDto invitation) {
    return CallInvitationEvent(
      type: CallInvitationEventType.invitationReceived,
      invitation: invitation,
    );
  }

  factory CallInvitationEvent.callEnded(String sessionId, String appointmentId) {
    return CallInvitationEvent(
      type: CallInvitationEventType.callEnded,
      sessionId: sessionId,
      appointmentId: appointmentId,
    );
  }
}

