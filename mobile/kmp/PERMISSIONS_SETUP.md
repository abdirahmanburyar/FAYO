# Camera and Microphone Permissions Setup

## Overview
Zoom Video SDK requires camera and microphone permissions to function properly. This document explains how permissions are handled in the Android app.

## Permissions in AndroidManifest.xml

The following permissions are declared in `AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
```

These are **declarative permissions** - they tell Android the app needs these capabilities, but **runtime permissions** must still be requested.

## Runtime Permission Requests

### Implementation

The app uses **Accompanist Permissions** library to handle runtime permissions:

1. **CallScreen.kt** automatically requests permissions when the screen loads
2. **AndroidZoomVideoService.kt** checks permissions before:
   - Joining a session
   - Starting video (`toggleVideo(true)`)
   - Starting audio (`toggleAudio(true)`)

### Permission Flow

```
CallScreen loads
    ↓
Request CAMERA + RECORD_AUDIO permissions
    ↓
Permissions granted?
    ├─ Yes → Initialize Zoom SDK → Join session
    └─ No → Show permission denied UI → User can retry
```

### Code Location

**Permission Request**: `mobile/kmp/androidApp/src/main/java/com/fayo/healthcare/ui/screens/call/CallScreen.kt`

```kotlin
val permissionsState = rememberMultiplePermissionsState(
    permissions = listOf(
        Manifest.permission.CAMERA,
        Manifest.permission.RECORD_AUDIO
    )
)

LaunchedEffect(Unit) {
    if (!permissionsState.allPermissionsGranted) {
        permissionsState.launchMultiplePermissionRequest()
    }
}
```

**Permission Checks**: `mobile/kmp/androidApp/src/main/java/com/fayo/healthcare/data/services/AndroidZoomVideoService.kt`

```kotlin
private fun hasCameraPermission(): Boolean
private fun hasMicrophonePermission(): Boolean
private fun hasAllPermissions(): Boolean
```

## Permission Checks Before Operations

### 1. Before Joining Session

```kotlin
override suspend fun joinSession(...) {
    if (!hasAllPermissions()) {
        return Result.failure(Exception("Required permissions not granted"))
    }
    // ... proceed with join
}
```

### 2. Before Starting Video

```kotlin
override suspend fun toggleVideo(enabled: Boolean) {
    if (enabled && !hasCameraPermission()) {
        return Result.failure(Exception("Camera permission required"))
    }
    // ... proceed with video toggle
}
```

### 3. Before Starting Audio

```kotlin
override suspend fun toggleAudio(enabled: Boolean) {
    if (enabled && !hasMicrophonePermission()) {
        return Result.failure(Exception("Microphone permission required"))
    }
    // ... proceed with audio toggle
}
```

## User Experience

### Permission Denied UI

When permissions are not granted, the CallScreen shows:
- Warning icon
- "Permissions Required" message
- Explanation text
- "Grant Permissions" button to retry

### Error Handling

- If permissions are denied, the user sees a clear error message
- The app doesn't crash - it shows a user-friendly error
- Users can retry granting permissions from the error screen

## Android Emulator Camera Support

### Important Notes

1. **Emulator Limitations**: 
   - Android emulators may not have camera/microphone access by default
   - Some emulators support virtual camera/microphone
   - Physical devices are recommended for testing video calls

2. **Testing on Emulator**:
   - Use Android Studio's Extended Controls to enable virtual camera
   - Settings → Extended Controls → Camera → VirtualScene (or Webcam)
   - Microphone can use host system's microphone

3. **Permission Testing**:
   - Test permission denial flow
   - Test "Don't ask again" scenario
   - Verify permission checks work correctly

## Best Practices

1. ✅ **Request permissions early** - Before initializing Zoom SDK
2. ✅ **Check permissions before operations** - Don't assume they're granted
3. ✅ **Provide clear error messages** - Tell users what's needed
4. ✅ **Allow retry** - Let users grant permissions from error screen
5. ✅ **Handle edge cases** - "Don't ask again", permission revoked, etc.

## Troubleshooting

### Issue: Permissions not requested
**Solution**: 
- Check Accompanist Permissions dependency is added
- Verify `rememberMultiplePermissionsState` is used correctly
- Check AndroidManifest has permission declarations

### Issue: Permission check fails
**Solution**:
- Verify `ContextCompat.checkSelfPermission` is used
- Check permission strings match AndroidManifest
- Ensure checking on Main thread (permissions are checked in `withContext(Dispatchers.Main)`)

### Issue: Video/Audio doesn't start
**Solution**:
- Check logs for permission errors
- Verify permissions are granted before calling `startVideo()`/`startAudio()`
- Check Zoom SDK logs for additional errors

## References

- [Android Runtime Permissions](https://developer.android.com/training/permissions/requesting)
- [Accompanist Permissions](https://google.github.io/accompanist/permissions/)
- [Zoom SDK Android Permissions](https://marketplace.zoom.us/docs/sdk/video/android/getting-started/integration)

