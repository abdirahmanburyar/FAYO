# FAYO Healthcare App - Flutter Mobile Client

## Overview
This is the Flutter mobile application for the FAYO Healthcare platform. It provides OTP-based authentication and core healthcare features.

## Features
- **OTP Authentication**: Phone number-based login with OTP verification
- **Modern UI**: Clean, intuitive interface following Material Design 3
- **State Management**: Provider pattern for state management
- **API Integration**: RESTful API integration with the backend services
- **Responsive Design**: Optimized for various screen sizes

## Screens
1. **Splash Screen**: App loading and initialization
2. **Login Screen**: Phone number input for OTP authentication
3. **OTP Verification**: 6-digit OTP verification screen
4. **Home Screen**: Main dashboard with quick actions

## Getting Started

### Prerequisites
- Flutter SDK (>=3.0.0)
- Dart SDK (>=3.0.0)
- Android Studio / VS Code
- Android device or emulator

### Installation
1. Navigate to the project directory:
   ```bash
   cd mobile/flutter_app
   ```

2. Install dependencies:
   ```bash
   flutter pub get
   ```

3. Run the app:
   ```bash
   flutter run
   ```

### Configuration
Update the API base URL in `lib/services/api_service.dart`:
```dart
static const String baseUrl = 'http://your-gateway-url/api/v1';
```

## Project Structure
```
lib/
├── main.dart                 # App entry point
├── screens/                  # UI screens
│   ├── splash_screen.dart
│   ├── login_screen.dart
│   ├── otp_verification_screen.dart
│   └── home_screen.dart
├── services/                 # Business logic
│   ├── auth_service.dart
│   └── api_service.dart
├── models/                   # Data models
├── widgets/                  # Reusable widgets
└── assets/                   # Images and other assets
```

## API Integration
The app integrates with the following backend services:
- **User Service**: Authentication and user management
- **Appointment Service**: Appointment booking and management
- **Gateway**: API routing and authentication

## Development Notes
- The app uses simulated API calls in development mode
- Replace simulation code with actual API calls for production
- Ensure proper error handling and user feedback
- Test on both Android and iOS devices

## Future Enhancements
- Push notifications
- Offline support
- Biometric authentication
- Dark mode support
- Multi-language support
