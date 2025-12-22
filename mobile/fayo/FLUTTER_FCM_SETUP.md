# Flutter FCM Setup Guide

## Overview

This guide will help you set up Firebase Cloud Messaging (FCM) for the FAYO Healthcare Flutter mobile app.

## Prerequisites

✅ Firebase packages already installed in `pubspec.yaml`:
- `firebase_core: ^3.6.0`
- `firebase_messaging: ^15.1.3`
- `flutter_local_notifications: ^18.0.1`

## Step 1: Get Firebase Configuration Files

### For Android: `google-services.json`

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: **fayo-healthcare**
3. Click **⚙️ Settings** → **Project settings**
4. Scroll down to **"Your apps"** section
5. If Android app doesn't exist:
   - Click **"Add app"** → Select **Android**
   - Package name: `com.example.fayo` (or your actual package name)
   - Register app
6. Download `google-services.json`
7. **Place it in**: `mobile/fayo/android/app/google-services.json`

### For iOS: `GoogleService-Info.plist`

1. In Firebase Console (same project settings page)
2. If iOS app doesn't exist:
   - Click **"Add app"** → Select **iOS**
   - Bundle ID: `com.example.fayo` (or your actual bundle ID)
   - Register app
3. Download `GoogleService-Info.plist`
4. **Place it in**: `mobile/fayo/ios/Runner/GoogleService-Info.plist`

## Step 2: Configure Android

### Update `android/build.gradle.kts`

Add Google Services plugin to the root `build.gradle.kts`:

```kotlin
buildscript {
    dependencies {
        classpath("com.google.gms:google-services:4.4.0")
    }
}
```

### Update `android/app/build.gradle.kts`

Add Google Services plugin at the bottom:

```kotlin
plugins {
    id("com.android.application")
    id("kotlin-android")
    id("dev.flutter.flutter-gradle-plugin")
    id("com.google.gms.google-services") // Add this line
}
```

## Step 3: Configure iOS

### Update `ios/Podfile`

Ensure Firebase pods are included (usually automatic with FlutterFire):

```ruby
platform :ios, '12.0'

target 'Runner' do
  use_frameworks!
  use_modular_headers!

  flutter_install_all_ios_pods File.dirname(File.realpath(__FILE__))
end
```

### Update `android/app/src/main/AndroidManifest.xml`

Add FCM permissions and metadata (already done):

```xml
<!-- Firebase Cloud Messaging Permissions -->
<uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>
<uses-permission android:name="android.permission.VIBRATE"/>

<!-- In <application> tag -->
<meta-data
    android:name="com.google.firebase.messaging.default_notification_channel_id"
    android:value="fayo_healthcare" />
```

**Note**: For Flutter apps, you don't need to create a custom `MyFirebaseMessagingService` in Kotlin. FlutterFire (`firebase_messaging` package) handles this automatically.

### Update `ios/Runner/Info.plist`

Add notification permissions (already done):

```xml
<key>UIBackgroundModes</key>
<array>
    <string>remote-notification</string>
</array>
```

## Step 4: Install Dependencies

```bash
cd mobile/fayo
flutter pub get

# For iOS (if on macOS)
cd ios
pod install
cd ..
```

## Step 5: Verify Setup

### Check Files Exist

```bash
# Android
ls android/app/google-services.json

# iOS
ls ios/Runner/GoogleService-Info.plist
```

### Run the App

```bash
flutter run
```

### Check Logs

When the app starts, you should see:
```
✅ Firebase initialized
✅ FCM background handler registered
✅ User granted notification permission
📱 FCM Token: <your-token>
✅ FCM token registered with backend
```

## Step 6: Test Notifications

### From Backend

1. Login to the app (FCM token will be registered)
2. Send test notification from API:
   ```bash
   POST /api/v1/notifications/test
   Authorization: Bearer <your-token>
   ```

### From Firebase Console

1. Go to Firebase Console → Cloud Messaging
2. Click "Send test message"
3. Enter FCM token (from app logs)
4. Send notification

## How It Works

1. **App Starts**: Firebase initializes in `main.dart`
2. **User Logs In**: FCM token is automatically registered with backend
3. **Backend Sends**: API service sends notification via FCM
4. **App Receives**: Notification appears even when app is closed
5. **User Taps**: Navigates to relevant screen (hospital details, appointment, etc.)

## Notification Types Handled

- ✅ `NEW_DOCTOR_AT_HOSPITAL` → Navigates to `/hospitals/:hospitalId`
- ✅ `APPOINTMENT_REMINDER` → Navigates to appointment details
- ✅ `APPOINTMENT_CONFIRMED` → Navigates to appointment details
- ✅ `APPOINTMENT_CANCELLED` → Navigates to appointment details
- ✅ `PAYMENT_CONFIRMED` → Navigates to payment details

## Troubleshooting

### "Firebase not initialized"
- Check `google-services.json` is in `android/app/`
- Check `GoogleService-Info.plist` is in `ios/Runner/`
- Verify Firebase packages are installed: `flutter pub get`

### "No FCM token"
- Check notification permissions are granted
- Check device has internet connection
- Check Firebase project is correct

### "Token not registered"
- Check API service is running
- Check user is logged in
- Check network connectivity
- Check API endpoint: `/api/v1/notifications/register-token`

### Android Build Errors
- Ensure `google-services.json` is in correct location
- Ensure Google Services plugin is added to `build.gradle.kts`
- Clean and rebuild: `flutter clean && flutter pub get`

### iOS Build Errors
- Run `pod install` in `ios/` directory
- Ensure `GoogleService-Info.plist` is added to Xcode project
- Check bundle ID matches Firebase project

## File Structure

```
mobile/fayo/
├── android/
│   └── app/
│       └── google-services.json  ← Place here
├── ios/
│   └── Runner/
│       └── GoogleService-Info.plist  ← Place here
├── lib/
│   ├── main.dart  ← Firebase initialized here
│   ├── services/
│   │   ├── fcm_service.dart  ← FCM service
│   │   └── fcm_navigation_helper.dart  ← Navigation handler
│   └── presentation/
│       └── providers/
│           └── auth_provider.dart  ← FCM initialized on login
└── pubspec.yaml  ← Firebase packages
```

## Next Steps

1. ✅ Add `google-services.json` (Android)
2. ✅ Add `GoogleService-Info.plist` (iOS)
3. ✅ Update Android build.gradle files
4. ✅ Run `flutter pub get`
5. ✅ Test the app
6. ✅ Verify notifications work

## Security Notes

- `google-services.json` and `GoogleService-Info.plist` can be committed to Git (they're public configs)
- FCM tokens are stored securely in the backend database
- Only the backend can send notifications to users

