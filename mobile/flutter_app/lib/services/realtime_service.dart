import 'dart:async';
import 'dart:convert';
import 'package:web_socket_channel/web_socket_channel.dart';
import 'package:web_socket_channel/status.dart' as status;
import '../models/hospital.dart';

enum RealtimeEventType {
  hospitalCreated,
  hospitalUpdated,
  hospitalDeleted,
  hospitalStatusChanged,
  connected,
  disconnected,
  error,
  failed,
  connecting, // Added connecting status
  joinedHospitalUpdates, // Added for specific room join confirmation
  leftHospitalUpdates, // Added for specific room leave confirmation
  pong, // Added for ping-pong responses
  testBroadcast, // Added for test broadcasts
}

class RealtimeEvent {
  final RealtimeEventType type;
  final Map<String, dynamic> data;
  final DateTime timestamp;

  RealtimeEvent({
    required this.type,
    required this.data,
    required this.timestamp,
  });

  factory RealtimeEvent.fromJson(Map<String, dynamic> json) {
    return RealtimeEvent(
      type: _parseEventType(json['type']),
      data: json['data'] ?? json,
      timestamp: DateTime.parse(json['timestamp'] ?? DateTime.now().toIso8601String()),
    );
  }

  static RealtimeEventType _parseEventType(String? type) {
    switch (type) {
      case 'hospital.created':
        return RealtimeEventType.hospitalCreated;
      case 'hospital.updated':
        return RealtimeEventType.hospitalUpdated;
      case 'hospital.deleted':
        return RealtimeEventType.hospitalDeleted;
      case 'hospital.status_changed':
        return RealtimeEventType.hospitalStatusChanged;
      case 'connected':
        return RealtimeEventType.connected;
      case 'disconnected':
        return RealtimeEventType.disconnected;
      case 'error':
        return RealtimeEventType.error;
      case 'failed':
        return RealtimeEventType.failed;
      case 'connecting':
        return RealtimeEventType.connecting;
      case 'joined_hospital_updates':
        return RealtimeEventType.joinedHospitalUpdates;
      case 'left_hospital_updates':
        return RealtimeEventType.leftHospitalUpdates;
      case 'pong':
        return RealtimeEventType.pong;
      case 'test.broadcast':
        return RealtimeEventType.testBroadcast;
      default:
        return RealtimeEventType.error;
    }
  }
}

class RealtimeService {
  static final RealtimeService _instance = RealtimeService._internal();
  factory RealtimeService() => _instance;
  RealtimeService._internal();

  WebSocketChannel? _channel;
  StreamController<RealtimeEvent>? _eventController;
  StreamController<Hospital>? _hospitalController;
  StreamController<String>? _connectionController;

  bool _isConnected = false;
  Timer? _reconnectTimer;
  int _reconnectAttempts = 0;
  static const int _maxReconnectAttempts = 5;
  static const Duration _reconnectDelay = Duration(seconds: 3);

  // Getters
  bool get isConnected => _isConnected;
  Stream<RealtimeEvent> get eventStream => _eventController!.stream;
  Stream<Hospital> get hospitalStream => _hospitalController!.stream;
  Stream<String> get connectionStatusStream => _connectionController!.stream;

  Future<void> init() async {
    _eventController = StreamController<RealtimeEvent>.broadcast();
    _hospitalController = StreamController<Hospital>.broadcast();
    _connectionController = StreamController<String>.broadcast();

    await connect();
  }

  Future<void> connect() async {
    try {
      if (_isConnected) {
        print('🔌 Already connected, skipping connection attempt');
        return;
      }

      // Disconnect existing channel if any
      if (_channel != null) {
        print('🔌 Disconnecting existing WebSocket channel');
        await _channel!.sink.close();
        _channel = null;
      }

      // WebSocket URL - using raw WebSocket instead of Socket.IO
      // Note: The service has a global prefix 'api/v1', so the WebSocket path is '/api/v1/ws'
      // Using the gateway endpoint for WebSocket connections
      const String socketUrl = 'ws://31.97.58.62:3006/api/v1/ws';
      

      _channel = WebSocketChannel.connect(Uri.parse(socketUrl));

      // Set connecting status immediately
      _connectionController?.add('connecting');

      // Listen to the channel stream
      _channel!.stream.listen(
        _handleMessage,
        onError: _handleError,
        onDone: _handleDisconnection,
      );

      // Set up connection timeout
      Timer(const Duration(seconds: 5), () {
        if (!_isConnected) {
          _handleError('Connection timeout');
        }
      });

      // Wait a bit for the connection to establish
      await Future.delayed(const Duration(milliseconds: 1000));

      // Check if the channel is still valid and connection is stable
      if (_channel != null) {
        if (!_isConnected) {
          _isConnected = true;
          _reconnectAttempts = 0;
          _connectionController?.add('connected');
        } else {
          // Still emit connected status to ensure UI is updated
          _connectionController?.add('connected');
        }

        // Send a test message to verify connection
        Timer(const Duration(milliseconds: 500), () {
          _sendMessage('ping', {'message': 'Hello from Flutter'});
        });
        
        // Join hospital updates room
        Timer(const Duration(milliseconds: 1000), () {
          _sendMessage('join_hospital_updates', {});
        });
      } else {
        throw Exception('WebSocket channel is null');
      }

    } catch (e) {
      _handleError(e);
    }
  }

  void _handleMessage(dynamic message) {
    try {
      // Update connection status immediately when we receive any message
      if (!_isConnected) {
        _isConnected = true;
        _connectionController?.add('connected');
      }

      // Parse the message
      Map<String, dynamic> data;
      if (message is String) {
        data = json.decode(message);
      } else if (message is Map<String, dynamic>) {
        data = message;
      } else {
        return;
      }

      // Handle different message types
      if (data['type'] != null) {
        final eventType = RealtimeEvent._parseEventType(data['type']);
        final event = RealtimeEvent(
          type: eventType,
          data: data,
          timestamp: DateTime.now(),
        );
        _eventController?.add(event);

        // Handle specific hospital events
        if (eventType == RealtimeEventType.hospitalCreated ||
            eventType == RealtimeEventType.hospitalUpdated) {
          try {
            final hospital = Hospital.fromJson(data['hospital'] ?? data);
            _hospitalController?.add(hospital);
          } catch (e) {
            // Silently handle parsing errors
          }
        }
        
        // Handle hospital deleted event
        if (eventType == RealtimeEventType.hospitalDeleted) {
          try {
            final hospitalId = data['hospitalId'] as String?;
            if (hospitalId != null) {
              // Emit a special event for hospital deletion
              _eventController?.add(RealtimeEvent(
                type: RealtimeEventType.hospitalDeleted,
                data: {'hospitalId': hospitalId},
                timestamp: DateTime.now(),
              ));
            }
          } catch (e) {
            // Silently handle parsing errors
          }
        }
        
        // Handle hospital status changed event
        if (eventType == RealtimeEventType.hospitalStatusChanged) {
          try {
            final hospital = Hospital.fromJson(data['hospital'] ?? data);
            _hospitalController?.add(hospital);
          } catch (e) {
            // Silently handle parsing errors
          }
        }
        
        // Handle connection status events
        if (eventType == RealtimeEventType.connected ||
            eventType == RealtimeEventType.joinedHospitalUpdates ||
            eventType == RealtimeEventType.pong) {
          // Update connection status for these positive events
          if (!_isConnected) {
            _isConnected = true;
            _connectionController?.add('connected');
          }
        }
      } else if (data['message'] == 'pong') {
        // Update connection status when we receive pong
        if (!_isConnected) {
          _isConnected = true;
          _connectionController?.add('connected');
        }
      } else if (data['message'] == 'Connected to hospital updates') {
        // Update connection status when we receive connection confirmation
        if (!_isConnected) {
          _isConnected = true;
          _connectionController?.add('connected');
        }
      }

    } catch (e) {
      // Silently handle errors
    }
  }

  void _handleError(dynamic error) {
    _isConnected = false;
    _connectionController?.add('error');

    // Only schedule reconnect if we haven't exceeded max attempts
    if (_reconnectAttempts < _maxReconnectAttempts) {
      _scheduleReconnect();
    } else {
      _connectionController?.add('failed');
    }
  }

  void _handleDisconnection() {
    _isConnected = false;
    _connectionController?.add('disconnected');
    _scheduleReconnect();
  }

  void _scheduleReconnect() {
    if (_reconnectAttempts >= _maxReconnectAttempts) {
      _connectionController?.add('failed');
      return;
    }

    _reconnectAttempts++;
    _reconnectTimer?.cancel();
    _reconnectTimer = Timer(_reconnectDelay, () {
      connect();
    });
  }

  void _sendMessage(String type, Map<String, dynamic> data) {
    if (_isConnected && _channel != null) {
      final message = {
        'type': type,
        'data': data,
        'timestamp': DateTime.now().toIso8601String(),
      };

      try {
        _channel!.sink.add(json.encode(message));
      } catch (e) {
        _handleError(e);
      }
    }
  }

  Future<void> disconnect() async {
    _reconnectTimer?.cancel();
    _reconnectTimer = null;

    if (_channel != null) {
      await _channel!.sink.close(status.goingAway);
      _channel = null;
    }
    
    _isConnected = false;
    _connectionController?.add('disconnected');
  }

  Future<void> dispose() async {
    await disconnect();
    await _eventController?.close();
    await _hospitalController?.close();
    await _connectionController?.close();
  }

  // Subscribe to all realtime events
  Stream<RealtimeEvent> subscribeToEvents() {
    return _eventController!.stream;
  }

  // Send a message to the server
  void sendMessage(String event, Map<String, dynamic> data) {
    _sendMessage(event, data);
  }

  // Test connection
  void testConnection() {
    _sendMessage('test', {'message': 'Testing connection'});
  }

  // Join hospital updates room (for compatibility)
  void joinHospitalUpdates() {
    _sendMessage('join_hospital_updates', {});
  }

  // Leave hospital updates room (for compatibility)
  void leaveHospitalUpdates() {
    _sendMessage('leave_hospital_updates', {});
  }

  // Get connection status
  String getConnectionStatus() {
    if (_isConnected) {
      return 'connected';
    } else if (_reconnectAttempts > 0) {
      return 'reconnecting';
    } else {
      return 'disconnected';
    }
  }


  // Force reconnection
  Future<void> forceReconnect() async {
    await disconnect();
    _reconnectAttempts = 0;
    await connect();
  }
}