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
  final String callType;
  final DateTime? createdAt;
  final DateTime? expiresAt;
  final DateTime? startedAt;
  final DateTime? endedAt;

  CallSession({
    required this.id,
    required this.channelName,
    required this.initiatorId,
    this.recipientId,
    required this.status,
    required this.callType,
    this.createdAt,
    this.expiresAt,
    this.startedAt,
    this.endedAt,
  });

  factory CallSession.fromJson(Map<String, dynamic> json) {
    return CallSession(
      id: json['id'] as String,
      channelName: json['channelName'] as String,
      initiatorId: json['initiatorId'] as String,
      recipientId: json['recipientId'] as String?,
      status: json['status'] as String,
      callType: json['callType'] as String? ?? 'VIDEO',
      createdAt: json['createdAt'] != null 
          ? DateTime.parse(json['createdAt'] as String) 
          : null,
      expiresAt: json['expiresAt'] != null 
          ? DateTime.parse(json['expiresAt'] as String) 
          : null,
      startedAt: json['startedAt'] != null 
          ? DateTime.parse(json['startedAt'] as String) 
          : null,
      endedAt: json['endedAt'] != null 
          ? DateTime.parse(json['endedAt'] as String) 
          : null,
    );
  }

  /// Check if session is open to join
  bool get isOpenToJoin {
    if (status == 'COMPLETED' || status == 'CANCELLED' || status == 'EXPIRED') {
      return false;
    }
    if (expiresAt != null && DateTime.now().isAfter(expiresAt!)) {
      return false;
    }
    return status == 'PENDING' || status == 'RINGING' || status == 'ACTIVE';
  }

  /// Get status display text
  String get statusText {
    switch (status) {
      case 'PENDING':
        return 'Waiting';
      case 'RINGING':
        return 'Ringing';
      case 'ACTIVE':
        return 'Active';
      case 'COMPLETED':
        return 'Completed';
      case 'CANCELLED':
        return 'Cancelled';
      case 'EXPIRED':
        return 'Expired';
      default:
        return status;
    }
  }

  /// Get call type display text
  String get callTypeText {
    return callType == 'VIDEO' ? 'Video Call' : 'Voice Call';
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
    try {
      // Handle nested structure: { message, session, credential }
      final credential = json['credential'] as Map<String, dynamic>;
      final session = json['session'] as Map<String, dynamic>;
      
      return CallCredential(
        appId: credential['appId'] as String,
        token: credential['token'] as String,
        channelName: session['channelName'] as String,
        rtcUserId: credential['rtcUserId'] as String,
        role: credential['role'] as String,
      );
    } catch (e) {
      print('❌ [CALL CREDENTIAL] Error parsing JSON: $e');
      print('❌ [CALL CREDENTIAL] JSON structure: $json');
      rethrow;
    }
  }
}

class CallService {
  static final CallService _instance = CallService._internal();
  factory CallService() => _instance;
  CallService._internal();

  /// Get a specific call session by ID
  Future<CallSession> getSession({
    required String accessToken,
    required String sessionId,
  }) async {
    final url = '${CallConfig.baseUrl}/calls/session/$sessionId';
    
    print('📞 [CALL SERVICE] Fetching session: $url');
    
    final response = await http.get(
      Uri.parse(url),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $accessToken',
      },
    );

    print('📞 [CALL SERVICE] Response status: ${response.statusCode}');

    if (response.statusCode == 200 || response.statusCode == 201) {
      try {
        final data = jsonDecode(response.body) as Map<String, dynamic>;
        print('✅ [CALL SERVICE] Successfully fetched session');
        return CallSession.fromJson(data);
      } catch (e) {
        print('❌ [CALL SERVICE] Failed to parse session: $e');
        throw Exception('Failed to parse session: $e');
      }
    } else {
      print('❌ [CALL SERVICE] Request failed with status ${response.statusCode}');
      throw Exception('Failed to get session (${response.statusCode}): ${response.body}');
    }
  }

  Future<CallCredential> joinCall({
    required String accessToken,
    required String sessionId,
    bool asHost = false,
  }) async {
    final url = '${CallConfig.baseUrl}/calls/session/$sessionId/token';
    
    print('📞 [CALL SERVICE] Joining call: $url');
    print('📞 [CALL SERVICE] Session ID: $sessionId, Role: ${asHost ? "HOST" : "AUDIENCE"}');
    
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

    print('📞 [CALL SERVICE] Response status: ${response.statusCode}');
    print('📞 [CALL SERVICE] Response body: ${response.body}');

    // Accept both 200 (OK) and 201 (Created) as success
    if (response.statusCode == 200 || response.statusCode == 201) {
      try {
        final data = jsonDecode(response.body) as Map<String, dynamic>;
        print('✅ [CALL SERVICE] Successfully parsed response');
        return CallCredential.fromJson(data);
      } catch (e) {
        print('❌ [CALL SERVICE] Failed to parse response: $e');
        throw Exception('Failed to parse call credential: $e');
      }
    } else {
      print('❌ [CALL SERVICE] Request failed with status ${response.statusCode}');
      throw Exception('Failed to join call (${response.statusCode}): ${response.body}');
    }
  }
}


