import 'dart:async';
import 'dart:convert';
import 'package:web_socket_channel/web_socket_channel.dart';
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

  WebSocketChannel? _channel;
  final StreamController<CallInvite> _inviteController =
      StreamController<CallInvite>.broadcast();

  Stream<CallInvite> get inviteStream => _inviteController.stream;

  Future<void> connect(String jwtToken) async {
    if (_channel != null) return;

    final uri = Uri.parse('${CallConfig.websocketUrl}?token=$jwtToken');
    _channel = WebSocketChannel.connect(uri);

    _channel!.stream.listen((message) {
      try {
        final data = json.decode(message as String) as Map<String, dynamic>;
        final type = data['event'] ?? data['type'];

        if (type == 'call_invitation') {
          final session = data['session'] ?? data;
          final invite = CallInvite.fromJson(session as Map<String, dynamic>);
          _inviteController.add(invite);
        }
      } catch (_) {
        // ignore malformed messages
      }
    }, onError: (_) {
      disconnect();
    }, onDone: () {
      disconnect();
    });
  }

  Future<void> disconnect() async {
    await _channel?.sink.close();
    _channel = null;
  }

  Future<void> dispose() async {
    await disconnect();
    await _inviteController.close();
  }
}


