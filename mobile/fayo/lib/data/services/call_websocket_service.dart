import 'dart:async';
import 'dart:convert';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import '../../core/constants/api_constants.dart';
import '../models/appointment_models.dart';

class CallWebSocketService {
  IO.Socket? _socket;
  StreamController<CallInvitationEvent>? _controller;
  String? _patientId;
  bool _isConnected = false;

  Stream<CallInvitationEvent> connect(String patientId) {
    _patientId = patientId;
    _controller ??= StreamController<CallInvitationEvent>.broadcast();
    _connect();
    return _controller!.stream;
  }

  void _connect() {
    try {
      final uri = ApiConstants.appointmentWebSocketUrl;
      _socket = IO.io(uri, <String, dynamic>{
        'transports': ['websocket'],
        'autoConnect': true,
      });

      _socket!.on('connect', (_) {
        print('✅ [CallSocketIO] Connected successfully');
        _isConnected = true;

        // Send join messages
        _socket!.emit('join_appointment_updates');
        _socket!.emit('join_patient_room', {'patientId': _patientId});
      });

      _socket!.on('call.invitation', (data) {
        try {
          final messageJson = data is String ? data : jsonEncode(data);
          final message = CallInvitationMessage.fromJson(
            jsonDecode(messageJson) as Map<String, dynamic>,
          );

          if (message.appointmentId != null &&
              message.patientId == _patientId &&
              message.credentials != null) {
            final participantCredentials =
                message.credentials!.getParticipantCredentials();
            final channelName = message.channelName ??
                message.callSession?.channelName ??
                participantCredentials?.channelName ??
                '';

            final invitation = CallInvitationDto(
              appointmentId: message.appointmentId!,
              patientId: message.patientId!,
              channelName: channelName,
              callSession: message.callSession,
              credentials: participantCredentials?.copyWith(
                channelName: channelName,
              ),
              timestamp: message.timestamp,
            );

            _controller?.add(
              CallInvitationEvent.invitationReceived(invitation),
            );
          }
        } catch (e) {
          print('❌ [CallSocketIO] Error parsing call.invitation: $e');
        }
      });

      _socket!.on('call.ended', (data) {
        try {
          final messageJson = data is String ? data : jsonEncode(data);
          final message = CallInvitationMessage.fromJson(
            jsonDecode(messageJson) as Map<String, dynamic>,
          );

          if (message.callSession != null && message.appointmentId != null) {
            _controller?.add(
              CallInvitationEvent.callEnded(
                message.callSession!.id,
                message.appointmentId!,
              ),
            );
          }
        } catch (e) {
          print('❌ [CallSocketIO] Error parsing call.ended: $e');
        }
      });

      _socket!.on('disconnect', (_) {
        print('❌ [CallSocketIO] Disconnected');
        _isConnected = false;
        _reconnect();
      });

      _socket!.on('error', (error) {
        print('❌ [CallSocketIO] Error: $error');
        _isConnected = false;
        _reconnect();
      });
    } catch (e) {
      print('❌ [CallSocketIO] Connection error: $e');
      _isConnected = false;
      _reconnect();
    }
  }

  void _reconnect() {
    Future.delayed(const Duration(seconds: 5), () {
      if (!_isConnected && _patientId != null) {
        _connect();
      }
    });
  }

  void disconnect() {
    _socket?.disconnect();
    _socket?.dispose();
    _controller?.close();
    _isConnected = false;
  }

  bool get isConnected => _isConnected;
}

// Extension to add copyWith to CallCredentialsDto
extension CallCredentialsDtoExtension on CallCredentialsDto {
  CallCredentialsDto copyWith({
    String? appId,
    String? token,
    String? channelName,
    String? uid,
    String? role,
    String? expiresAt,
    int? expiresIn,
  }) {
    return CallCredentialsDto(
      appId: appId ?? this.appId,
      token: token ?? this.token,
      channelName: channelName ?? this.channelName,
      uid: uid ?? this.uid,
      role: role ?? this.role,
      expiresAt: expiresAt ?? this.expiresAt,
      expiresIn: expiresIn ?? this.expiresIn,
    );
  }
}

