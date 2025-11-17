# Zoom Video SDK Implementation Guide for Flutter

## Current Status
⚠️ **The call_screen.dart currently has a PLACEHOLDER implementation**. The actual Zoom Video SDK integration needs to be completed.

## Why the Placeholder?
The `flutter_zoom_videosdk` package (v1.14.0) doesn't export classes like `ZoomVideoSdk`, `ZoomVideoView`, etc. in the way we initially expected. The exact API structure needs to be verified from the official documentation.

## Steps to Complete Implementation

### 1. Verify Package API
Check the official Zoom Video SDK Flutter documentation:
- **Documentation**: https://marketplace.zoom.us/docs/sdk/video/flutter
- **GitHub Sample**: https://github.com/zoom/videosdk-flutter-quickstart
- **Package Page**: https://pub.dev/packages/flutter_zoom_videosdk

### 2. Check Package Exports
Run this in your Flutter project to see what the package exports:

```bash
cd mobile/flutter_app
flutter pub deps --style=tree | grep zoom
```

### 3. Review Sample Code
The official quickstart repository should have working examples. Key files to check:
- How to initialize the SDK
- How to join a session
- How to render video views
- How to handle events

### 4. Common API Patterns
Based on other Zoom SDK implementations, the API might use:

```dart
import 'package:flutter_zoom_videosdk/flutter_zoom_videosdk.dart';

// Initialization
var zoom = ZoomVideoSdk(); // or ZoomVideoSdkPlatform.instance
await zoom.initSdk(initConfig);

// Joining
await zoom.joinSession(joinConfig);

// Event listeners
zoom.onUserJoin = (user) { /* handle */ };
zoom.onSessionJoin = () { /* handle */ };

// Video rendering
// Might use a Widget like ZoomView or platform view
```

### 5. Replace Placeholder
Once you understand the API, replace the placeholder in `lib/screens/call_screen.dart` with:

1. **Correct imports**
2. **SDK initialization** with your credentials
3. **Session joining** with the token from backend
4. **Event handling** for user join/leave, video/audio status
5. **Video rendering** for local and remote users
6. **Controls** for mute/unmute, video on/off, leave session

## Backend Integration
The backend is already set up and generates valid Zoom JWT tokens:

### Token Structure
```javascript
{
  iss: "YOUR_SDK_KEY_OR_CLIENT_ID",
  exp: EXPIRATION_TIME,
  aud: "zoom",
  iat: ISSUED_AT_TIME,
  sessionName: "session_name",
  userIdentity: "user_id",
  role: 1 // or 0 (HOST or PARTICIPANT)
}
```

### Your Credentials (Backend)
```env
ZOOM_CLIENT_ID=VeGoqTdsQYKdjPeWSdgLuw
ZOOM_CLIENT_SECRET=4UCWlPCZhfLC2he09oMNUXtmoIWnLZF2
ZOOM_SECRET_TOKEN=B1bHjZztQUaaGUsOD2kBQg
ZOOM_ACCOUNT_ID=9mq72XcPTOaCqrSX9HDM7w
```

## Testing Checklist
Once implemented:
- [ ] SDK initializes without errors
- [ ] Can join a session with backend-generated token
- [ ] Local video displays
- [ ] Remote video displays when another user joins
- [ ] Audio works bidirectionally
- [ ] Mute/unmute controls work
- [ ] Video on/off controls work
- [ ] Leave session works cleanly
- [ ] Handles reconnection gracefully
- [ ] Proper error messages displayed

## Need Help?
- Check Zoom Developer Forum: https://devforum.zoom.us/
- Review the package issues: https://pub.dev/packages/flutter_zoom_videosdk/versions
- Consult the official Flutter SDK guide

## Current Backend API
The Flutter app receives credentials from the backend in this format:

```dart
class CallCredential {
  final String sdkKey;        // Zoom SDK Key or Client ID
  final String token;         // JWT token
  final String sessionName;   // Session identifier
  final String userIdentity;  // User identifier
  final String role;          // "HOST" or "PARTICIPANT"
}
```

This credential is passed to the `CallScreen` widget and should be used to join the Zoom session.

