import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'fcm_service.dart';

/// Helper class to handle FCM notification navigation
/// This should be initialized in your main app with a BuildContext
class FcmNavigationHelper {
  static void initialize(BuildContext context) {
    // Set up navigation callback for FCM notifications
    FcmService.onNotificationTap = (RemoteMessage message) {
      _handleNotificationNavigation(context, message);
    };
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
        if (hospitalId != null) {
          // Navigate to hospital details page
          // Based on your HospitalDetailsScreen, the route should be:
          context.go('/hospitals/$hospitalId');
          // Or if you use a different route structure:
          // context.push('/hospital-details', extra: {'hospitalId': hospitalId});
        }
        break;

      default:
        // Handle unknown notification types
        debugPrint('Unknown notification type: $type');
        break;
    }
  }
}

