import 'dart:async';
import 'dart:convert';
import 'package:web_socket_channel/web_socket_channel.dart';
import '../../core/constants/api_constants.dart';
import '../models/ads_models.dart';

class AdsWebSocketService {
  WebSocketChannel? _channel;
  StreamController<AdUpdateEvent>? _controller;
  Timer? _pingTimer;
  bool _isConnected = false;

  Stream<AdUpdateEvent> connect() {
    _controller ??= StreamController<AdUpdateEvent>.broadcast();
    _connect();
    return _controller!.stream;
  }

  void _connect() {
    try {
      final uri = Uri.parse(ApiConstants.adsWebSocketUrl);
      _channel = WebSocketChannel.connect(uri);
      _isConnected = true;

      // Send join message
      _channel?.sink.add(jsonEncode({'type': 'join_ads_updates'}));

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
            final event = AdUpdateEvent.fromJson(data);
            _controller?.add(event);
          } catch (e) {
            print('Error parsing Ads WebSocket message: $e');
          }
        },
        onError: (error) {
          print('Ads WebSocket error: $error');
          _isConnected = false;
          _reconnect();
        },
        onDone: () {
          print('Ads WebSocket connection closed');
          _isConnected = false;
          _reconnect();
        },
      );
    } catch (e) {
      print('Error connecting to Ads WebSocket: $e');
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

