import 'dart:async';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:permission_handler/permission_handler.dart';
import '../core/constants/api_constants.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'dart:io';

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
    debugPrint('🚀 [FCM] Starting FCM initialization...');
    debugPrint('   User ID: ${userId ?? "null (not logged in)"}');
    
    try {
      debugPrint('🔔 [FCM] Requesting notification permission...');
      
      // On Android 13+, we need to request POST_NOTIFICATIONS permission first
      if (Platform.isAndroid) {
        debugPrint('🤖 [FCM] Android detected - checking POST_NOTIFICATIONS permission...');
        final androidStatus = await Permission.notification.status;
        debugPrint('📋 [FCM] Android notification permission status: $androidStatus');
        
        if (androidStatus.isDenied) {
          debugPrint('🔔 [FCM] Requesting Android notification permission...');
          final result = await Permission.notification.request();
          debugPrint('📋 [FCM] Android permission request result: $result');
          
          if (result.isDenied || result.isPermanentlyDenied) {
            debugPrint('❌ [FCM] Android notification permission denied');
            debugPrint('   User needs to enable notifications in app settings');
            if (result.isPermanentlyDenied) {
              debugPrint('   ⚠️ Permission permanently denied - user must enable in Settings');
            }
            return;
          }
          debugPrint('✅ [FCM] Android notification permission granted');
        } else if (androidStatus.isGranted) {
          debugPrint('✅ [FCM] Android notification permission already granted');
        } else if (androidStatus.isPermanentlyDenied) {
          debugPrint('❌ [FCM] Android notification permission permanently denied');
          debugPrint('   User must enable notifications in app settings');
          return;
        }
      }
      
      // Request permission for notifications (Firebase Messaging)
      debugPrint('🔔 [FCM] Requesting Firebase Messaging permission...');
      NotificationSettings settings = await _firebaseMessaging.requestPermission(
        alert: true,
        badge: true,
        sound: true,
        provisional: false,
      );

      debugPrint('📋 [FCM] Firebase permission status: ${settings.authorizationStatus}');
      debugPrint('   Alert: ${settings.alert}');
      debugPrint('   Badge: ${settings.badge}');
      debugPrint('   Sound: ${settings.sound}');

      if (settings.authorizationStatus == AuthorizationStatus.authorized) {
        debugPrint('✅ [FCM] User granted Firebase notification permission');
      } else if (settings.authorizationStatus == AuthorizationStatus.provisional) {
        debugPrint('⚠️ [FCM] User granted provisional Firebase notification permission');
      } else if (settings.authorizationStatus == AuthorizationStatus.denied) {
        debugPrint('❌ [FCM] User denied Firebase notification permission');
        debugPrint('   Cannot proceed without permission');
        return;
      } else if (settings.authorizationStatus == AuthorizationStatus.notDetermined) {
        debugPrint('⚠️ [FCM] Firebase permission not determined yet');
        return;
      } else {
        debugPrint('❌ [FCM] Unknown Firebase permission status: ${settings.authorizationStatus}');
        return;
      }

      debugPrint('🔑 [FCM] Getting FCM token from Firebase...');
      
      // Get FCM token
      _fcmToken = await _firebaseMessaging.getToken();
      
      if (_fcmToken != null) {
        debugPrint('📱 [FCM] ✅ FCM Token generated successfully!');
        debugPrint('📱 [FCM] Token: $_fcmToken');
        debugPrint('📱 [FCM] Token length: ${_fcmToken!.length} characters');
        debugPrint('💾 [FCM] Saving token to backend...');
        await _saveTokenToBackend(_fcmToken!, userId);
      } else {
        debugPrint('❌ [FCM] Failed to get FCM token - token is null');
        debugPrint('   This might happen if:');
        debugPrint('   - Firebase is not properly configured');
        debugPrint('   - google-services.json is missing or incorrect');
        debugPrint('   - App is not registered with Firebase');
      }

      debugPrint('🔄 [FCM] Setting up token refresh listener...');
      
      // Listen for token refresh
      _tokenSubscription = _firebaseMessaging.onTokenRefresh.listen(
        (newToken) {
          debugPrint('🔄 [FCM] Token refreshed!');
          debugPrint('📱 [FCM] New token: $newToken');
          _fcmToken = newToken;
          _saveTokenToBackend(newToken, userId);
        },
      );

      debugPrint('📨 [FCM] Setting up foreground message listener...');
      
      // Handle foreground messages
      FirebaseMessaging.onMessage.listen(_handleForegroundMessage);

      debugPrint('👆 [FCM] Setting up notification tap listener...');
      
      // Handle background message taps
      FirebaseMessaging.onMessageOpenedApp.listen((message) {
        debugPrint('👆 [FCM] User tapped notification (app was in background)');
        if (onNotificationTap != null) {
          onNotificationTap!(message);
        } else {
          _handleMessageTap(message);
        }
      });

      debugPrint('🔍 [FCM] Checking for initial message (app opened from notification)...');
      
      // Check if app was opened from a notification
      RemoteMessage? initialMessage = await _firebaseMessaging.getInitialMessage();
      if (initialMessage != null) {
        debugPrint('📨 [FCM] App was opened from a notification!');
        if (onNotificationTap != null) {
          onNotificationTap!(initialMessage);
        } else {
          _handleMessageTap(initialMessage);
        }
      } else {
        debugPrint('ℹ️ [FCM] No initial message (app opened normally)');
      }

      debugPrint('✅ [FCM] FCM Service initialized successfully!');
      debugPrint('   Token: ${_fcmToken ?? "null"}');
      debugPrint('   User ID: ${userId ?? "null"}');
    } catch (e, stackTrace) {
      debugPrint('❌ [FCM] Error initializing FCM: $e');
      debugPrint('❌ [FCM] Stack trace: $stackTrace');
    }
  }

  /// Save FCM token to backend
  Future<void> _saveTokenToBackend(String token, String? userId) async {
    debugPrint('💾 [FCM] _saveTokenToBackend called');
    debugPrint('   Token: ${token.substring(0, 20)}...');
    debugPrint('   User ID: ${userId ?? "null"}');
    
    if (userId == null) {
      debugPrint('⚠️ [FCM] No user ID - saving token temporarily');
      // Save token temporarily, will register when user logs in
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('pending_fcm_token', token);
      debugPrint('💾 [FCM] Token saved to SharedPreferences as pending_fcm_token');
      debugPrint('   Token will be registered when user logs in');
      return;
    }

    try {
      debugPrint('🌐 [FCM] Preparing to send token to backend...');
      final prefs = await SharedPreferences.getInstance();
      final authToken = prefs.getString('auth_token');
      
      final platform = defaultTargetPlatform == TargetPlatform.android
          ? 'android'
          : defaultTargetPlatform == TargetPlatform.iOS
              ? 'ios'
              : 'web';
      
      final deviceId = await _getDeviceId();
      
      final url = '${ApiConstants.apiBaseUrl}/notifications/register-token';
      debugPrint('🌐 [FCM] API URL: $url');
      debugPrint('🌐 [FCM] Platform: $platform');
      debugPrint('🌐 [FCM] Device ID: ${deviceId ?? "null"}');
      debugPrint('🌐 [FCM] Auth token: ${authToken != null ? "present" : "missing"}');

      final requestBody = {
        'token': token,
        'deviceId': deviceId,
        'platform': platform,
      };
      
      debugPrint('📤 [FCM] Sending POST request...');
      debugPrint('   Body: ${jsonEncode(requestBody)}');

      final response = await http.post(
        Uri.parse(url),
        headers: {
          'Content-Type': 'application/json',
          if (authToken != null) 'Authorization': 'Bearer $authToken',
        },
        body: jsonEncode(requestBody),
      );

      debugPrint('📥 [FCM] Response received');
      debugPrint('   Status code: ${response.statusCode}');
      debugPrint('   Response body: ${response.body}');

      if (response.statusCode == 200 || response.statusCode == 201) {
        debugPrint('✅ [FCM] ✅✅✅ FCM token registered with backend successfully! ✅✅✅');
        // Clear pending token if exists
        await prefs.remove('pending_fcm_token');
        debugPrint('🧹 [FCM] Cleared pending token from SharedPreferences');
      } else {
        debugPrint('❌ [FCM] Failed to register FCM token');
        debugPrint('   Status code: ${response.statusCode}');
        debugPrint('   Response: ${response.body}');
      }
    } catch (e, stackTrace) {
      debugPrint('❌ [FCM] Error registering FCM token: $e');
      debugPrint('❌ [FCM] Stack trace: $stackTrace');
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
    debugPrint('👤 [FCM] registerTokenForUser called');
    debugPrint('   User ID: $userId');
    
    final prefs = await SharedPreferences.getInstance();
    final pendingToken = prefs.getString('pending_fcm_token');
    
    debugPrint('   Pending token: ${pendingToken != null ? "exists" : "null"}');
    debugPrint('   Current token: ${_fcmToken != null ? "exists" : "null"}');
    
    if (pendingToken != null) {
      debugPrint('💾 [FCM] Registering pending token...');
      await _saveTokenToBackend(pendingToken, userId);
    } else if (_fcmToken != null) {
      debugPrint('💾 [FCM] Registering current token...');
      await _saveTokenToBackend(_fcmToken!, userId);
    } else {
      debugPrint('⚠️ [FCM] No token available to register');
      debugPrint('   This might happen if FCM was not initialized');
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

