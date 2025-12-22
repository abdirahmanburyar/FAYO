# Firebase Cloud Messaging (FCM) Integration Guide

## Why FCM is Essential for FAYO Healthcare Platform

Firebase Cloud Messaging (FCM) provides **push notifications** that are crucial for a healthcare appointment system. Here's how it benefits your NestJS + Flutter architecture:

### Key Benefits

1. **Real-time Patient Engagement**
   - Appointment reminders (24h, 2h before)
   - Appointment confirmations
   - Appointment cancellations/rescheduling
   - Payment confirmations
   - Prescription ready notifications

2. **Doctor & Hospital Notifications**
   - New appointment requests
   - Appointment cancellations
   - Patient messages
   - System alerts

3. **Better User Experience**
   - Works even when app is closed
   - Low battery consumption
   - Reliable delivery
   - Cross-platform (iOS & Android)

4. **Business Value**
   - Reduces no-shows (reminders)
   - Improves patient satisfaction
   - Increases engagement
   - Better appointment management

## Architecture Overview

### FCM Flow: API Service → Flutter Mobile App

```
┌─────────────────────────────────────────────────────────────┐
│              FCM Notification Flow (Mobile Only)            │
└─────────────────────────────────────────────────────────────┘

1. Flutter App
   │
   ├─ Registers FCM token → API Service
   │  POST /api/v1/notifications/register-token
   │
   └─ Token stored in database

2. API Service (NestJS)
   │
   ├─ Event occurs (new doctor, appointment, etc.)
   │
   ├─ Queries user's FCM tokens from database
   │
   ├─ Sends notification via Firebase Admin SDK
   │  admin.messaging().sendEachForMulticast({...})
   │
   └─ Firebase FCM Service
      │
      └─ Delivers to Flutter App (even when closed)

3. Flutter App
   │
   ├─ Receives notification
   │
   └─ User taps → Navigates to relevant screen
```

### WebSocket Flow: API Service ↔ Admin Panel

```
┌─────────────┐
│ Admin Panel │  ← Uses WebSockets for real-time updates (NOT FCM)
│   (Web)     │
└──────┬──────┘
       │
       │ WebSocket (Socket.IO)
       │
       ◄──────────────┼──────────────►
                      │
       ┌──────────────┴──────────────┐
       │   NestJS Backend            │
       │   (WebSocket Gateways)      │
       └─────────────────────────────┘
```

**Key Points**:
- ✅ **FCM**: API Service → Flutter Mobile App (push notifications)
- ✅ **WebSockets**: API Service ↔ Admin Panel (real-time updates)
- ✅ **Different systems** for different platforms

## Use Cases for FAYO Healthcare

### 1. Appointment Reminders
- **24 hours before**: "Your appointment with Dr. Ahmed is tomorrow at 10:00 AM"
- **2 hours before**: "Reminder: Your appointment is in 2 hours"
- **30 minutes before**: "Your appointment starts soon"

### 2. Appointment Status Updates
- **Confirmed**: "Your appointment has been confirmed"
- **Cancelled**: "Your appointment on [date] has been cancelled"
- **Rescheduled**: "Your appointment has been rescheduled to [new date]"

### 3. Payment Notifications
- **Payment Success**: "Payment of $50.00 received for appointment #12345"
- **Payment Failed**: "Payment failed. Please try again"
- **Receipt Ready**: "Your receipt is ready for download"

### 4. Doctor Notifications
- **New Appointment**: "New appointment request from [Patient Name]"
- **Cancellation**: "Appointment #12345 has been cancelled"
- **Patient Message**: "New message from [Patient Name]"

### 5. System Notifications
- **Maintenance**: "System maintenance scheduled for [time]"
- **New Features**: "New feature available: Video consultations"
- **Promotions**: "Special offer: 20% off on first appointment"

## Implementation Steps

### Step 1: Setup Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use existing (✅ Already done: `fayo-healthcare`)
3. Add Android app (package name: `com.fayo.healthcare`)
4. Add iOS app (bundle ID: `com.fayo.healthcare`)
5. Download configuration files:
   - Android: `google-services.json` → Place in `mobile/fayo/android/app/`
   - iOS: `GoogleService-Info.plist` → Place in `mobile/fayo/ios/Runner/`
6. **Get Service Account JSON** (for backend):
   - Go to Project Settings → Service Accounts
   - Click "Generate New Private Key"
   - Download JSON file
   - Place in `services/api-service/firebase-service-account.json`
   - OR set as `FIREBASE_SERVICE_ACCOUNT` environment variable

### Your Firebase Project Info
- **Project ID**: `fayo-healthcare`
- **Messaging Sender ID**: `1011968725460`
- **Web Config**: Already saved in `web/admin-panel/src/config/firebase.config.ts`

### Step 2: NestJS Backend Setup
- Install `firebase-admin` package
- Initialize Firebase Admin SDK
- Create notification service
- Store FCM tokens in database
- Create endpoints to send notifications

### Step 3: Flutter App Setup
- Install `firebase_messaging` package
- Request notification permissions
- Get FCM token
- Send token to backend
- Handle incoming notifications
- Handle notification taps

## Database Schema

Add to your Prisma schema:

```prisma
model FcmToken {
  id        String   @id @default(cuid())
  userId    String
  token     String   @unique
  deviceId  String?
  platform  String   // 'android' | 'ios' | 'web'
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([token])
}
```

## Next Steps

See implementation files:
- `services/api-service/src/notifications/` - NestJS notification service
- `mobile/fayo/lib/services/fcm_service.dart` - Flutter FCM service
- `services/api-service/src/appointments/notifications-integration.example.ts` - Example integration
- `services/api-service/src/payments/notifications-integration.example.ts` - Example integration

## Setup Instructions

### 1. Backend Setup (NestJS)

1. **Install dependencies** (already done):
   ```bash
   cd services/api-service
   npm install firebase-admin
   ```

2. **Get Firebase Service Account**:
   - Go to Firebase Console → Project Settings → Service Accounts
   - Click "Generate New Private Key"
   - Save the JSON file

3. **Add to environment variables**:
   ```env
   FIREBASE_SERVICE_ACCOUNT='{"type":"service_account",...}' # Paste entire JSON as string
   ```
   OR save the file and reference it in code

4. **Run Prisma migration**:
   ```bash
   npx prisma migrate dev --name add_fcm_tokens
   ```

5. **Import NotificationsModule** in `app.module.ts` (already done)

### 2. Flutter Setup

1. **Install dependencies** (already added to pubspec.yaml):
   ```bash
   cd mobile/fayo
   flutter pub get
   ```

2. **Add Firebase configuration files**:
   - Android: Place `google-services.json` in `android/app/`
   - iOS: Place `GoogleService-Info.plist` in `ios/Runner/`

3. **Initialize FCM in main.dart**:
   ```dart
   import 'package:firebase_core/firebase_core.dart';
   import 'package:firebase_messaging/firebase_messaging.dart';
   import 'services/fcm_service.dart';
   
   void main() async {
     WidgetsFlutterBinding.ensureInitialized();
     await Firebase.initializeApp();
     
     // Set up background message handler
     FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);
     
     runApp(MyApp());
   }
   ```

4. **Initialize FCM service when user logs in**:
   ```dart
   // In your login/auth service
   await FcmService().initialize(userId: user.id);
   ```

5. **Register token after login**:
   ```dart
   await FcmService().registerTokenForUser(user.id);
   ```

6. **Unregister on logout**:
   ```dart
   await FcmService().unregisterToken();
   ```

## Testing

1. **Test from backend**:
   ```bash
   POST /api/v1/notifications/test
   Authorization: Bearer <token>
   ```

2. **Test from Flutter**:
   - Send a test notification from Firebase Console
   - Or use the test endpoint from the app

## New Doctor at Hospital Notifications

When a new doctor is added to a hospital, all patients will receive a push notification. When they tap the notification, they'll be taken to the hospital details page.

### Backend Integration

The notification is automatically sent when a doctor is added to a hospital via the `addDoctor` endpoint. The notification includes:
- Hospital ID (for navigation)
- Hospital name
- Doctor name
- Specialty (if available)

### Flutter Navigation Setup

1. **Initialize navigation helper in main.dart**:
   ```dart
   import 'services/fcm_navigation_helper.dart';
   
   void main() {
     runApp(MyApp());
   }
   
   class MyApp extends StatelessWidget {
     @override
     Widget build(BuildContext context) {
       final router = GoRouter(/* your routes */);
       
       return MaterialApp.router(
         routerConfig: router,
         builder: (context, child) {
           // Initialize FCM navigation when app builds
           WidgetsBinding.instance.addPostFrameCallback((_) {
             FcmNavigationHelper.initialize(context);
           });
           return child ?? SizedBox.shrink();
         },
       );
     }
   }
   ```

2. **Make sure your router has the hospital details route**:
   ```dart
   GoRoute(
     path: '/hospitals/:hospitalId',
     builder: (context, state) {
       final hospitalId = state.pathParameters['hospitalId']!;
       return HospitalDetailsScreen(hospitalId: hospitalId);
     },
   ),
   ```

## Common Issues

1. **"Firebase not initialized"**: Check FIREBASE_SERVICE_ACCOUNT env variable
2. **"No FCM tokens found"**: Make sure user has registered token after login
3. **Notifications not received**: Check notification permissions in device settings
4. **Background messages not working**: Ensure background handler is registered in main.dart
5. **Navigation not working**: Make sure FcmNavigationHelper is initialized with a valid BuildContext

