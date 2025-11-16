import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/call_config.dart';

enum CallType { video, voice }

class CallSession {
  final String id;
  final String channelName;
  final String initiatorId;
  final String? recipientId;
  final String status;

  CallSession({
    required this.id,
    required this.channelName,
    required this.initiatorId,
    this.recipientId,
    required this.status,
  });

  factory CallSession.fromJson(Map<String, dynamic> json) {
    return CallSession(
      id: json['id'] as String,
      channelName: json['channelName'] as String,
      initiatorId: json['initiatorId'] as String,
      recipientId: json['recipientId'] as String?,
      status: json['status'] as String,
    );
  }
}

class CallCredential {
  final String appId;
  final String token;
  final String channelName;
  final String rtcUserId;
  final String role;

  CallCredential({
    required this.appId,
    required this.token,
    required this.channelName,
    required this.rtcUserId,
    required this.role,
  });

  factory CallCredential.fromJson(Map<String, dynamic> json) {
    return CallCredential(
      appId: json['credential']['appId'] as String,
      token: json['credential']['token'] as String,
      channelName: json['session']['channelName'] as String,
      rtcUserId: json['credential']['rtcUserId'] as String,
      role: json['credential']['role'] as String,
    );
  }
}

class CallService {
  static final CallService _instance = CallService._internal();
  factory CallService() => _instance;
  CallService._internal();

  Future<CallCredential> joinCall({
    required String accessToken,
    required String sessionId,
    bool asHost = false,
  }) async {
    final url = '${CallConfig.baseUrl}/calls/session/$sessionId/token';
    final response = await http.post(
      Uri.parse(url),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $accessToken',
      },
      body: jsonEncode({
        'role': asHost ? 'HOST' : 'AUDIENCE',
      }),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body) as Map<String, dynamic>;
      return CallCredential.fromJson(data);
    } else {
      throw Exception('Failed to join call: ${response.body}');
    }
  }
}


