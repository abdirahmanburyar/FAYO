import 'dart:async';
import 'dart:convert';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import '../config/call_config.dart';

class CallInvite {
  final String sessionId;
  final String channelName;
  final String fromUserId;

  CallInvite({
    required this.sessionId,
    required this.channelName,
    required this.fromUserId,
  });

  factory CallInvite.fromJson(Map<String, dynamic> json) {
    return CallInvite(
      sessionId: json['id'] as String,
      channelName: json['channelName'] as String,
      fromUserId: json['initiatorId'] as String,
    );
  }
}

class CallSocketService {
  static final CallSocketService _instance = CallSocketService._internal();
  factory CallSocketService() => _instance;
  CallSocketService._internal();

  IO.Socket? _socket;
  final StreamController<CallInvite> _inviteController =
      StreamController<CallInvite>.broadcast();

  Stream<CallInvite> get inviteStream => _inviteController.stream;

  Future<void> connect(String jwtToken) async {
    if (_socket != null && _socket!.connected) {
      print('📞 [CALL SOCKET] Already connected');
      return;
    }

    try {
      print('📞 [CALL SOCKET] Connecting to ${CallConfig.websocketUrl}');
      
      // Disconnect existing socket if any
      await disconnect();

      // Connect using Socket.IO client
      _socket = IO.io(
        CallConfig.websocketUrl,
        IO.OptionBuilder()
            .setTransports(['websocket'])
            .setQuery({'token': jwtToken})
            .enableAutoConnect()
            .build(),
      );

      _socket!.onConnect((_) {
        print('✅ [CALL SOCKET] Connected to call service');
      });

      _socket!.onDisconnect((_) {
        print('❌ [CALL SOCKET] Disconnected from call service');
      });

      _socket!.onError((error) {
        print('❌ [CALL SOCKET] Error: $error');
      });

      // Listen for call invitations
      _socket!.on('call_invitation', (data) {
        print('📞 [CALL SOCKET] Received call invitation: $data');
        try {
          final session = data is Map<String, dynamic> ? data : json.decode(data.toString());
          final invite = CallInvite.fromJson(session);
          _inviteController.add(invite);
        } catch (e) {
          print('❌ [CALL SOCKET] Error parsing invitation: $e');
        }
      });

      _socket!.on('connected', (data) {
        print('✅ [CALL SOCKET] Server confirmed connection: $data');
      });

      _socket!.connect();
    } catch (e) {
      print('❌ [CALL SOCKET] Connection error: $e');
      rethrow;
    }
  }

  Future<void> disconnect() async {
    if (_socket != null) {
      _socket!.disconnect();
      _socket!.dispose();
      _socket = null;
      print('📞 [CALL SOCKET] Disconnected');
    }
  }

  Future<void> dispose() async {
    await disconnect();
    await _inviteController.close();
  }

  bool get isConnected => _socket != null && _socket!.connected;
}


