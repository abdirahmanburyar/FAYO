# FCM Architecture - FAYO Healthcare

## Flow: API Service → Flutter Mobile App

```
┌─────────────────────────────────────────────────────────────┐
│                    FCM Notification Flow                     │
└─────────────────────────────────────────────────────────────┘

1. Flutter App (Mobile)
   │
   ├─ Registers FCM token with backend
   │  POST /api/v1/notifications/register-token
   │  { token: "fcm_token_here", userId: "user123" }
   │
   └─ Stores token in database (FcmToken table)

2. API Service (NestJS Backend)
   │
   ├─ Receives event (e.g., new doctor added to hospital)
   │
   ├─ Queries database for user's FCM tokens
   │  SELECT token FROM fcm_tokens WHERE userId = 'user123'
   │
   ├─ Sends notification via Firebase Admin SDK
   │  admin.messaging().sendEachForMulticast({
   │    tokens: ['fcm_token_1', 'fcm_token_2'],
   │    notification: { title: '...', body: '...' },
   │    data: { type: 'NEW_DOCTOR_AT_HOSPITAL', hospitalId: '...' }
   │  })
   │
   └─ Firebase FCM Service
      │
      └─ Delivers to Flutter App (even if app is closed)

3. Flutter App (Mobile)
   │
   ├─ Receives notification
   │  - Foreground: FirebaseMessaging.onMessage
   │  - Background: firebaseMessagingBackgroundHandler
   │  - App closed: FirebaseMessaging.getInitialMessage
   │
   └─ User taps notification
      │
      └─ Navigates to hospital details page
         context.go('/hospitals/$hospitalId')
```

## Components

### 1. API Service (NestJS) - Sender
**Location**: `services/api-service/src/notifications/`

**Responsibilities**:
- ✅ Receives FCM tokens from Flutter app
- ✅ Stores tokens in database (FcmToken model)
- ✅ Sends notifications via Firebase Admin SDK
- ✅ Handles notification events (new doctor, appointment reminders, etc.)

**Required**:
- `firebase-service-account.json` (Service Account JSON)
- Firebase Admin SDK initialized

**Example Usage**:
```typescript
// In hospitals.service.ts
await this.notificationsService.notifyNewDoctorAtHospital(
  hospitalId,
  hospitalName,
  doctorName,
  specialty
);
```

### 2. Flutter Mobile App - Receiver
**Location**: `mobile/fayo/lib/services/fcm_service.dart`

**Responsibilities**:
- ✅ Requests notification permissions
- ✅ Gets FCM token from Firebase
- ✅ Sends token to backend API
- ✅ Receives and handles notifications
- ✅ Navigates when user taps notification

**Required**:
- `google-services.json` (Android)
- `GoogleService-Info.plist` (iOS)
- Firebase packages installed

**Example Flow**:
```dart
// 1. Initialize FCM
await FcmService().initialize(userId: user.id);

// 2. Token automatically sent to backend
// 3. Receives notifications
// 4. Handles navigation on tap
```

## Notification Types

### 1. New Doctor at Hospital
- **Trigger**: Doctor added to hospital
- **Sent to**: All patients
- **Action**: Navigate to hospital details

### 2. Appointment Reminders
- **Trigger**: Scheduled (24h, 2h before)
- **Sent to**: Patient
- **Action**: Navigate to appointment details

### 3. Appointment Confirmations
- **Trigger**: Appointment created/confirmed
- **Sent to**: Patient & Doctor
- **Action**: Navigate to appointment details

### 4. Payment Confirmations
- **Trigger**: Payment processed
- **Sent to**: Patient
- **Action**: Navigate to payment/receipt

## Data Flow Example: New Doctor Notification

```
1. Admin adds doctor to hospital
   POST /api/v1/hospitals/{id}/doctors/{doctorId}

2. HospitalsService.addDoctor()
   ├─ Creates hospital-doctor association
   └─ Calls notificationsService.notifyNewDoctorAtHospital()

3. NotificationsService.notifyNewDoctorAtHospital()
   ├─ Queries: All patients (users with role='PATIENT')
   ├─ Gets their FCM tokens from database
   └─ Sends via Firebase Admin SDK

4. Firebase FCM
   └─ Delivers to all patient devices

5. Flutter App receives
   ├─ Shows notification
   └─ User taps → Navigates to hospital details
```

## Setup Checklist

### API Service (Backend)
- [ ] Download Service Account JSON from Firebase Console
- [ ] Place in `services/api-service/firebase-service-account.json`
- [ ] Restart API service
- [ ] Verify logs: "✅ Firebase Admin SDK initialized"

### Flutter App (Mobile)
- [ ] Download `google-services.json` (Android)
- [ ] Download `GoogleService-Info.plist` (iOS)
- [ ] Place in correct directories
- [ ] Install Firebase packages: `flutter pub get`
- [ ] Initialize FCM in `main.dart`
- [ ] Test token registration

## Key Points

✅ **API Service sends** → Flutter app receives
✅ **One-way communication** (API → Mobile)
✅ **Works when app is closed** (push notifications)
✅ **WebSockets for admin panel** (different system)
✅ **FCM tokens stored in database** (for targeting users)

## Security

- ✅ Service Account JSON is private (in .gitignore)
- ✅ FCM tokens stored securely in database
- ✅ Only backend can send notifications
- ✅ Users can only register their own tokens

## Testing

1. **Test token registration**:
   ```bash
   # From Flutter app, check logs for:
   ✅ FCM Token: <token>
   ✅ FCM token registered with backend
   ```

2. **Test notification sending**:
   ```bash
   POST /api/v1/notifications/test
   Authorization: Bearer <token>
   ```

3. **Test new doctor notification**:
   - Add doctor to hospital via admin panel
   - Check Flutter app receives notification
   - Tap notification → Should navigate to hospital details

