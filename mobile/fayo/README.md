# FAYO Healthcare - Flutter Mobile App

Professional Flutter mobile application for FAYO Healthcare, migrated from Kotlin Multiplatform (KMP).

## 🚀 Features

- ✅ **Authentication**: OTP-based login with phone number verification
- ✅ **Hospitals**: Browse and search hospitals/clinics
- ✅ **Doctors**: Browse and search doctors
- ✅ **Appointments**: View, create, and manage appointments
- ✅ **Video Calls**: Real-time video calling with Agora RTC SDK
- ✅ **Payments**: QR code-based payment integration with Waafipay
- ✅ **Real-time Updates**: WebSocket integration for live updates
- ✅ **Ads**: Dynamic ad banners with real-time updates
- ✅ **Profile**: User profile management

## 📋 Prerequisites

- Flutter SDK 3.10.3 or higher
- Dart SDK 3.10.3 or higher
- Android Studio / VS Code with Flutter extensions
- Android SDK (for Android development)
- iOS SDK (for iOS development - macOS only)

## 🛠️ Setup

1. **Install Flutter dependencies:**
   ```bash
   flutter pub get
   ```

2. **Configure API endpoints:**
   Edit `lib/core/constants/api_constants.dart` to set your server URLs:
   ```dart
   static const String baseHost = "your-server-ip";
   static const bool useHttps = true; // Set to true for production
   ```

3. **Run the app:**
   ```bash
   flutter run
   ```

## 📱 Platform-Specific Setup

### Android

1. **Minimum SDK**: 21 (Android 5.0)
2. **Target SDK**: 34 (Android 14)
3. **Permissions**: Add to `android/app/src/main/AndroidManifest.xml`:
   ```xml
   <uses-permission android:name="android.permission.INTERNET"/>
   <uses-permission android:name="android.permission.CAMERA"/>
   <uses-permission android:name="android.permission.RECORD_AUDIO"/>
   <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS"/>
   ```

### iOS

1. **Minimum iOS**: 12.0
2. **Permissions**: Add to `ios/Runner/Info.plist`:
   ```xml
   <key>NSCameraUsageDescription</key>
   <string>We need camera access for video calls</string>
   <key>NSMicrophoneUsageDescription</key>
   <string>We need microphone access for video calls</string>
   ```

## 🏗️ Project Structure

```
lib/
├── core/
│   ├── constants/      # API constants, app constants
│   ├── router/         # Navigation setup
│   ├── theme/          # App theme and colors
│   └── utils/          # Utility functions
├── data/
│   ├── datasources/    # API client, local storage
│   ├── models/         # Data models
│   ├── repositories/   # Repository implementations
│   └── services/       # WebSocket services
├── domain/
│   ├── entities/       # Domain entities
│   ├── repositories/   # Repository interfaces
│   └── usecases/       # Business logic
└── presentation/
    ├── providers/      # State management (Riverpod)
    ├── screens/        # UI screens
    └── widgets/        # Reusable widgets
```

## 🔌 API Integration

The app connects to the following microservices:

- **User Service** (Port 3001): Authentication, user management
- **Hospital Service** (Port 3002): Hospitals, specialties
- **Doctor Service** (Port 3003): Doctors, specialties
- **Appointment Service** (Port 3005): Appointments, calls
- **Payment Service** (Port 3006): Payments, Waafipay
- **Ads Service** (Port 3007): Advertisements

## 🌐 WebSocket Connections

- **Hospital Updates**: Real-time hospital data updates
- **Call Invitations**: Socket.IO for video call invitations
- **Ads Updates**: Real-time ad updates

## 🎨 Design System

- **Primary Color**: Sky Blue (#0284C7)
- **Theme**: Material Design 3
- **Typography**: Inter font family
- **Components**: Modern card-based UI with 16dp radius

## 📦 Key Dependencies

- `flutter_riverpod`: State management
- `go_router`: Navigation
- `dio`: HTTP client
- `socket_io_client`: Socket.IO client
- `agora_rtc_engine`: Video calling
- `qr_flutter`: QR code generation
- `cached_network_image`: Image caching

## 🔐 Security

- JWT tokens stored securely
- HTTPS support for production
- Secure WebSocket connections (WSS)

## 🐛 Troubleshooting

### Build Issues

1. **Clean build:**
   ```bash
   flutter clean
   flutter pub get
   ```

2. **Android build issues:**
   - Ensure Android SDK is properly configured
   - Check `android/local.properties` for SDK path

3. **iOS build issues:**
   - Run `pod install` in `ios/` directory
   - Ensure Xcode is properly configured

### Runtime Issues

1. **API connection errors:**
   - Check server is running
   - Verify API endpoints in `api_constants.dart`
   - Check network connectivity

2. **WebSocket connection errors:**
   - Verify WebSocket URLs
   - Check firewall settings
   - Ensure server supports WebSocket connections

## 📝 Development Notes

- State management uses Riverpod (modern, type-safe)
- Navigation uses GoRouter (recommended by Flutter team)
- All API calls are async and use proper error handling
- WebSocket services include auto-reconnect logic

## 🚧 TODO / Future Enhancements

- [ ] Complete Agora RTC SDK integration for video calls
- [ ] Add payment status polling
- [ ] Implement profile editing
- [ ] Add notifications
- [ ] Implement offline mode
- [ ] Add unit and widget tests
- [ ] Performance optimizations

## 📄 License

Proprietary - FAYO Healthcare

## 👥 Support

For issues and questions, contact the development team.
