import 'dart:async';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../core/constants/api_constants.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

/// Firebase Cloud Messaging Service
/// Handles push notifications for the FAYO Healthcare app
class FcmService {
  static final FcmService _instance = FcmService._internal();
  factory FcmService() => _instance;
  FcmService._internal();

  final FirebaseMessaging _firebaseMessaging = FirebaseMessaging.instance;
  String? _fcmToken;
  StreamSubscription<String>? _tokenSubscription;
  StreamSubscription<RemoteMessage>? _messageSubscription;

  /// Initialize FCM service
  Future<void> initialize({String? userId}) async {
    try {
      // Request permission for notifications
      NotificationSettings settings = await _firebaseMessaging.requestPermission(
        alert: true,
        badge: true,
        sound: true,
        provisional: false,
      );

      if (settings.authorizationStatus == AuthorizationStatus.authorized) {
        debugPrint('✅ User granted notification permission');
      } else if (settings.authorizationStatus == AuthorizationStatus.provisional) {
        debugPrint('⚠️ User granted provisional notification permission');
      } else {
        debugPrint('❌ User declined notification permission');
        return;
      }

      // Get FCM token
      _fcmToken = await _firebaseMessaging.getToken();
      if (_fcmToken != null) {
        debugPrint('📱 FCM Token: $_fcmToken');
        await _saveTokenToBackend(_fcmToken!, userId);
      }

      // Listen for token refresh
      _tokenSubscription = _firebaseMessaging.onTokenRefresh.listen(
        (newToken) {
          debugPrint('🔄 FCM Token refreshed: $newToken');
          _fcmToken = newToken;
          _saveTokenToBackend(newToken, userId);
        },
      );

      // Handle foreground messages
      FirebaseMessaging.onMessage.listen(_handleForegroundMessage);

      // Handle background message taps
      FirebaseMessaging.onMessageOpenedApp.listen((message) {
        if (onNotificationTap != null) {
          onNotificationTap!(message);
        } else {
          _handleMessageTap(message);
        }
      });

      // Check if app was opened from a notification
      RemoteMessage? initialMessage = await _firebaseMessaging.getInitialMessage();
      if (initialMessage != null) {
        if (onNotificationTap != null) {
          onNotificationTap!(initialMessage);
        } else {
          _handleMessageTap(initialMessage);
        }
      }

      debugPrint('✅ FCM Service initialized successfully');
    } catch (e) {
      debugPrint('❌ Error initializing FCM: $e');
    }
  }

  /// Save FCM token to backend
  Future<void> _saveTokenToBackend(String token, String? userId) async {
    if (userId == null) {
      // Save token temporarily, will register when user logs in
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('pending_fcm_token', token);
      return;
    }

    try {
      final prefs = await SharedPreferences.getInstance();
      final authToken = prefs.getString('auth_token');

      final response = await http.post(
        Uri.parse('${ApiConstants.apiBaseUrl}/notifications/register-token'),
        headers: {
          'Content-Type': 'application/json',
          if (authToken != null) 'Authorization': 'Bearer $authToken',
        },
        body: jsonEncode({
          'token': token,
          'deviceId': await _getDeviceId(),
          'platform': defaultTargetPlatform == TargetPlatform.android
              ? 'android'
              : defaultTargetPlatform == TargetPlatform.iOS
                  ? 'ios'
                  : 'web',
        }),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        debugPrint('✅ FCM token registered with backend');
        // Clear pending token if exists
        await prefs.remove('pending_fcm_token');
      } else {
        debugPrint('❌ Failed to register FCM token: ${response.statusCode}');
      }
    } catch (e) {
      debugPrint('❌ Error registering FCM token: $e');
    }
  }

  /// Get device ID (you can use device_info_plus package for this)
  Future<String?> _getDeviceId() async {
    // TODO: Implement device ID retrieval using device_info_plus
    // For now, return null
    return null;
  }

  /// Handle foreground messages (when app is open)
  void _handleForegroundMessage(RemoteMessage message) {
    debugPrint('📨 Received foreground message: ${message.messageId}');
    debugPrint('   Title: ${message.notification?.title}');
    debugPrint('   Body: ${message.notification?.body}');
    debugPrint('   Data: ${message.data}');

    // Show local notification or in-app notification
    // You can use flutter_local_notifications for this
    _showInAppNotification(message);
  }

  /// Handle message tap (when user taps notification)
  /// Note: This method should be called from a context where navigation is available
  /// You may need to use a GlobalKey<NavigatorState> or pass BuildContext
  void _handleMessageTap(RemoteMessage message) {
    debugPrint('👆 User tapped notification: ${message.messageId}');
    debugPrint('   Data: ${message.data}');

    final type = message.data['type'];
    final appointmentId = message.data['appointmentId'];
    final paymentId = message.data['paymentId'];
    final hospitalId = message.data['hospitalId'];

    // Navigate based on notification type
    // You'll need to use your navigation service here
    // For go_router, you can use: context.go('/hospitals/$hospitalId')
    switch (type) {
      case 'APPOINTMENT_REMINDER':
      case 'APPOINTMENT_CONFIRMED':
      case 'APPOINTMENT_CANCELLED':
        if (appointmentId != null) {
          // Navigate to appointment details
          // Example: context.go('/appointments/$appointmentId');
          debugPrint('📅 Navigating to appointment: $appointmentId');
        }
        break;
      case 'PAYMENT_CONFIRMED':
        if (paymentId != null) {
          // Navigate to payment details
          // Example: context.go('/payments/$paymentId');
          debugPrint('💳 Navigating to payment: $paymentId');
        }
        break;
      case 'NEW_DOCTOR_AT_HOSPITAL':
        if (hospitalId != null) {
          // Navigate to hospital details page
          // Using go_router: context.go('/hospitals/$hospitalId')
          // Or using Navigator: Navigator.pushNamed(context, '/hospitals/$hospitalId')
          debugPrint('🏥 Navigating to hospital details: $hospitalId');
          // Store hospitalId for navigation (you'll need to handle this in your app)
          // You can use a callback or event bus to trigger navigation
        }
        break;
      default:
        break;
    }
  }

  /// Get navigation callback for handling notification taps
  /// This should be set from your main app to handle navigation
  static Function(RemoteMessage)? onNotificationTap;

  /// Handle notification tap with navigation callback
  static void handleNotificationTap(RemoteMessage message) {
    if (onNotificationTap != null) {
      onNotificationTap!(message);
    } else {
      // Fallback to default handling
      FcmService()._handleMessageTap(message);
    }
  }

  /// Show in-app notification (when app is in foreground)
  void _showInAppNotification(RemoteMessage message) {
    // You can use a snackbar, dialog, or custom notification widget
    // This is a placeholder - implement based on your UI needs
    final title = message.notification?.title ?? 'Notification';
    final body = message.notification?.body ?? '';
    
    debugPrint('🔔 Showing in-app notification: $title - $body');
    // TODO: Implement in-app notification UI
  }

  /// Register token when user logs in
  Future<void> registerTokenForUser(String userId) async {
    final prefs = await SharedPreferences.getInstance();
    final pendingToken = prefs.getString('pending_fcm_token');
    
    if (pendingToken != null) {
      await _saveTokenToBackend(pendingToken, userId);
    } else if (_fcmToken != null) {
      await _saveTokenToBackend(_fcmToken!, userId);
    }
  }

  /// Unregister token when user logs out
  Future<void> unregisterToken() async {
    if (_fcmToken == null) return;

    try {
      final prefs = await SharedPreferences.getInstance();
      final authToken = prefs.getString('auth_token');

      await http.delete(
        Uri.parse('${ApiConstants.apiBaseUrl}/notifications/unregister-token/$_fcmToken'),
        headers: {
          if (authToken != null) 'Authorization': 'Bearer $authToken',
        },
      );

      debugPrint('✅ FCM token unregistered');
    } catch (e) {
      debugPrint('❌ Error unregistering FCM token: $e');
    }
  }

  /// Get current FCM token
  String? get token => _fcmToken;

  /// Dispose resources
  void dispose() {
    _tokenSubscription?.cancel();
    _messageSubscription?.cancel();
  }
}

/// Background message handler (must be top-level function)
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  debugPrint('📨 Background message received: ${message.messageId}');
  debugPrint('   Title: ${message.notification?.title}');
  debugPrint('   Body: ${message.notification?.body}');
  debugPrint('   Data: ${message.data}');
  
  // Handle background message processing here
  // Note: You cannot show UI in background handler
}

