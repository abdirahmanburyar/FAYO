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

```
┌─────────────┐
│   Flutter   │  ← Registers FCM token, receives notifications
│     App     │
└──────┬──────┘
       │
       │ HTTP API
       ▼
┌─────────────┐
│   NestJS    │  ← Sends notifications via FCM Admin SDK
│   Backend   │
└──────┬──────┘
       │
       │ FCM API
       ▼
┌─────────────┐
│  Firebase   │  ← Delivers to devices
│     FCM     │
└─────────────┘
```

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
2. Create a new project or use existing
3. Add Android app (package name: `com.fayo.healthcare`)
4. Add iOS app (bundle ID: `com.fayo.healthcare`)
5. Download configuration files:
   - Android: `google-services.json`
   - iOS: `GoogleService-Info.plist`
6. Get Server Key from Project Settings → Cloud Messaging

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

