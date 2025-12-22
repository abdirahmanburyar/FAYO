import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'fcm_service.dart';

/// Helper class to handle FCM notification navigation
/// This should be initialized in your main app with a BuildContext
class FcmNavigationHelper {
  static BuildContext? _context;
  
  static void initialize(BuildContext context) {
    _context = context;
    debugPrint('🧭 [FCM Nav] Navigation helper initialized');
    
    // Set up navigation callback for FCM notifications
    FcmService.onNotificationTap = (RemoteMessage message) {
      if (_context != null) {
        _handleNotificationNavigation(_context!, message);
      } else {
        debugPrint('❌ [FCM Nav] Context is null - cannot navigate');
      }
    };
  }
  
  /// Update context (useful when navigating between screens)
  static void updateContext(BuildContext context) {
    _context = context;
  }

  static void _handleNotificationNavigation(BuildContext context, RemoteMessage message) {
    final type = message.data['type'];
    final appointmentId = message.data['appointmentId'];
    final paymentId = message.data['paymentId'];
    final hospitalId = message.data['hospitalId'];

    switch (type) {
      case 'APPOINTMENT_REMINDER':
      case 'APPOINTMENT_CONFIRMED':
      case 'APPOINTMENT_CANCELLED':
        if (appointmentId != null) {
          // Navigate to appointment details
          // Adjust route based on your app's routing structure
          context.go('/appointments/$appointmentId');
        }
        break;

      case 'PAYMENT_CONFIRMED':
        if (paymentId != null) {
          // Navigate to payment details
          context.go('/payments/$paymentId');
        }
        break;

      case 'NEW_DOCTOR_AT_HOSPITAL':
        final doctorId = message.data['doctorId'];
        if (doctorId != null && doctorId.isNotEmpty) {
          debugPrint('🧭 [FCM Nav] Navigating to doctor details: $doctorId');
          // Navigate to doctor details page
          try {
            context.go('/doctor-details?id=$doctorId');
            debugPrint('✅ [FCM Nav] Successfully navigated to /doctor-details?id=$doctorId');
          } catch (e) {
            debugPrint('❌ [FCM Nav] Error navigating to doctor: $e');
            // Fallback: try hospital details if doctor navigation fails
            if (hospitalId != null && hospitalId.isNotEmpty) {
              try {
                context.go('/hospitals/$hospitalId');
                debugPrint('✅ [FCM Nav] Used fallback route: /hospitals/$hospitalId');
              } catch (e2) {
                debugPrint('❌ [FCM Nav] Fallback route also failed: $e2');
              }
            }
          }
        } else if (hospitalId != null && hospitalId.isNotEmpty) {
          debugPrint('⚠️ [FCM Nav] Doctor ID not found, navigating to hospital: $hospitalId');
          try {
            context.go('/hospitals/$hospitalId');
          } catch (e) {
            debugPrint('❌ [FCM Nav] Error navigating to hospital: $e');
          }
        } else {
          debugPrint('⚠️ [FCM Nav] Both doctor ID and hospital ID are null or empty');
          debugPrint('   Message data: ${message.data}');
        }
        break;

      default:
        // Handle unknown notification types
        debugPrint('Unknown notification type: $type');
        break;
    }
  }
}

