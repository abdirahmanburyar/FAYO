import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'core/theme/app_theme.dart';
import 'core/router/app_router.dart';
import 'data/datasources/local_storage.dart';
import 'services/fcm_navigation_helper.dart';

/// Background message handler (must be top-level function)
/// This handles notifications when the app is in the background or terminated
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  debugPrint('📨 Background message received: ${message.messageId}');
  debugPrint('   Title: ${message.notification?.title}');
  debugPrint('   Body: ${message.notification?.body}');
  debugPrint('   Data: ${message.data}');
  
  // Handle background message processing here
  // Note: You cannot show UI in background handler
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize Firebase
  try {
    await Firebase.initializeApp();
    debugPrint('✅ Firebase initialized');
    
    // Set up background message handler
    FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);
    debugPrint('✅ FCM background handler registered');
  } catch (e) {
    debugPrint('❌ Error initializing Firebase: $e');
    // Continue without Firebase if initialization fails
  }
  
  // Initialize local storage
  await LocalStorage().init();
  
  runApp(
    const ProviderScope(
      child: FayoApp(),
    ),
  );
}

class FayoApp extends StatelessWidget {
  const FayoApp({super.key});

  @override
  Widget build(BuildContext context) {
    // Initialize FCM navigation helper when app builds
    WidgetsBinding.instance.addPostFrameCallback((_) {
      FcmNavigationHelper.initialize(context);
    });

    return MaterialApp.router(
      title: 'FAYO Healthcare',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: ThemeMode.light,
      routerConfig: AppRouter.router,
    );
  }
}
