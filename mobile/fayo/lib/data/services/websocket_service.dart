import 'dart:async';
import 'dart:convert';
import 'package:web_socket_channel/web_socket_channel.dart';
import '../../core/constants/api_constants.dart';
import '../models/hospital_models.dart';

class WebSocketService {
  WebSocketChannel? _channel;
  StreamController<HospitalUpdateEvent>? _controller;
  Timer? _pingTimer;
  bool _isConnected = false;

  Stream<HospitalUpdateEvent> connect() {
    _controller ??= StreamController<HospitalUpdateEvent>.broadcast();
    _connect();
    return _controller!.stream;
  }

  void _connect() {
    try {
      final uri = Uri.parse(ApiConstants.hospitalWebSocketUrl);
      _channel = WebSocketChannel.connect(uri);
      _isConnected = true;

      // Send join message
      _channel?.sink.add(jsonEncode({'type': 'join_hospital_updates'}));

      // Start ping timer
      _pingTimer = Timer.periodic(
        const Duration(seconds: 30),
        (_) {
          _channel?.sink.add(jsonEncode({'type': 'ping'}));
        },
      );

      // Listen for messages
      _channel?.stream.listen(
        (message) {
          try {
            final data = jsonDecode(message);
            final wsMessage = WebSocketMessage.fromJson(data);
            final event = HospitalUpdateEvent.fromWebSocketMessage(wsMessage);
            _controller?.add(event);
          } catch (e) {
            print('Error parsing WebSocket message: $e');
          }
        },
        onError: (error) {
          print('WebSocket error: $error');
          _isConnected = false;
          _reconnect();
        },
        onDone: () {
          print('WebSocket connection closed');
          _isConnected = false;
          _reconnect();
        },
      );
    } catch (e) {
      print('Error connecting to WebSocket: $e');
      _isConnected = false;
      _reconnect();
    }
  }

  void _reconnect() {
    Future.delayed(const Duration(seconds: 5), () {
      if (!_isConnected) {
        _connect();
      }
    });
  }

  void disconnect() {
    _pingTimer?.cancel();
    _channel?.sink.close();
    _controller?.close();
    _isConnected = false;
  }

  bool get isConnected => _isConnected;
}

