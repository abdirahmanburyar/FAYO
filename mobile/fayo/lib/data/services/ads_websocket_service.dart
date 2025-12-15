import 'dart:async';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import '../../core/constants/api_constants.dart';
import '../models/ads_models.dart';

class AdsWebSocketService {
  IO.Socket? _socket;
  StreamController<AdUpdateEvent>? _controller;
  Timer? _reconnectTimer;
  bool _isConnected = false;
  bool _isConnecting = false;

  Stream<AdUpdateEvent> connect() {
    _controller ??= StreamController<AdUpdateEvent>.broadcast();
    _connect();
    return _controller!.stream;
  }

  void _connect() {
    if (_isConnected || _isConnecting) return; // Prevent multiple connections
    
    try {
      _isConnecting = true;
      final baseUrl = ApiConstants.adsBaseUrl.replaceFirst('/api/v1', '');
      print('🔌 Connecting to Ads WebSocket: $baseUrl');
      
      _socket = IO.io(
        baseUrl,
        IO.OptionBuilder()
            .setTransports(['websocket', 'polling'])
            .setPath('/ws/ads')
            .enableAutoConnect()
            .enableReconnection()
            .setReconnectionDelay(5000)
            .setReconnectionDelayMax(10000)
            .setReconnectionAttempts(5)
            .setTimeout(20000)
            .build(),
      );

      // Connection event
      _socket!.onConnect((_) {
        print('✅ Ads WebSocket connected');
        _isConnected = true;
        _isConnecting = false;
        
        // Join ads updates room
        _socket!.emit('join_ads_updates');
      });

      // Disconnection event
      _socket!.onDisconnect((_) {
        print('🔌 Ads WebSocket disconnected');
        _isConnected = false;
        _isConnecting = false;
      });

      // Connection error
      _socket!.onConnectError((error) {
        print('❌ Ads WebSocket connection error: $error');
        _isConnected = false;
        _isConnecting = false;
      });

      // Listen for ad events
      _socket!.on('ad.created', (data) {
        try {
          if (data is Map<String, dynamic>) {
            final event = AdUpdateEvent.fromJson(data);
            _controller?.add(event);
          }
        } catch (e) {
          print('Error parsing ad.created event: $e');
        }
      });

      _socket!.on('ad.updated', (data) {
        try {
          if (data is Map<String, dynamic>) {
            final event = AdUpdateEvent.fromJson(data);
            _controller?.add(event);
          }
        } catch (e) {
          print('Error parsing ad.updated event: $e');
        }
      });

      _socket!.on('ad.deleted', (data) {
        try {
          if (data is Map<String, dynamic>) {
            final event = AdUpdateEvent.fromJson(data);
            _controller?.add(event);
          }
        } catch (e) {
          print('Error parsing ad.deleted event: $e');
        }
      });

      _socket!.on('ad.clicked', (data) {
        try {
          if (data is Map<String, dynamic>) {
            final event = AdUpdateEvent.fromJson(data);
            _controller?.add(event);
          }
        } catch (e) {
          print('Error parsing ad.clicked event: $e');
        }
      });

      // Error handler
      _socket!.onError((error) {
        print('Ads WebSocket error: $error');
        _isConnected = false;
        _isConnecting = false;
      });

    } catch (e) {
      print('Error connecting to Ads WebSocket: $e');
      _isConnected = false;
      _isConnecting = false;
    }
  }

  void disconnect() {
    print('🔌 Disconnecting Ads WebSocket...');
    _reconnectTimer?.cancel();
    _reconnectTimer = null;
    _socket?.disconnect();
    _socket?.dispose();
    _socket = null;
    _controller?.close();
    _controller = null;
    _isConnected = false;
    _isConnecting = false;
  }

  bool get isConnected => _isConnected;
}

