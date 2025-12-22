# FCM Quick Start - Flutter App

## ✅ What's Already Done

1. ✅ Firebase packages installed (`pubspec.yaml`)
2. ✅ FCM service created (`lib/services/fcm_service.dart`)
3. ✅ Navigation helper created (`lib/services/fcm_navigation_helper.dart`)
4. ✅ Firebase initialized in `main.dart`
5. ✅ FCM auto-initializes when user logs in
6. ✅ Android build.gradle configured
7. ✅ iOS Info.plist configured

## ⚠️ What You Need to Do

### 1. Download Firebase Config Files

**Android:**
- Go to Firebase Console → Project Settings
- Download `google-services.json`
- Place in: `android/app/google-services.json`

**iOS:**
- Go to Firebase Console → Project Settings  
- Download `GoogleService-Info.plist`
- Place in: `ios/Runner/GoogleService-Info.plist`

### 2. Install Dependencies

```bash
cd mobile/fayo
flutter pub get

# For iOS (if on macOS)
cd ios
pod install
cd ..
```

### 3. Run the App

```bash
flutter run
```

### 4. Test

1. Login to the app
2. Check logs for: `✅ FCM token registered with backend`
3. Send test notification from backend or Firebase Console

## How It Works

- **App starts** → Firebase initializes
- **User logs in** → FCM token automatically registered
- **Backend sends notification** → App receives (even when closed)
- **User taps notification** → Navigates to relevant screen

## File Locations

```
mobile/fayo/
├── android/app/google-services.json  ← Add this file
├── ios/Runner/GoogleService-Info.plist  ← Add this file
└── lib/
    ├── main.dart  ← Firebase initialized ✅
    └── services/
        ├── fcm_service.dart  ← FCM service ✅
        └── fcm_navigation_helper.dart  ← Navigation ✅
```

See `FLUTTER_FCM_SETUP.md` for detailed instructions.

