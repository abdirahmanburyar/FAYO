# Android Build Fix Guide

## NDK Issue Fix

The error indicates a corrupted NDK installation. Here are the steps to fix it:

### Option 1: Delete and Re-download NDK (Recommended)

1. **Delete the corrupted NDK:**
   ```bash
   # Navigate to the NDK directory
   cd C:\sem7\tools\commandlinetools-win-13114758_latest\ndk
   # Delete the corrupted version
   rmdir /s /q 28.2.13676358
   ```

   Or manually delete the folder:
   - Go to: `C:\sem7\tools\commandlinetools-win-13114758_latest\ndk\28.2.13676358`
   - Delete the entire folder

2. **Clean Flutter build:**
   ```bash
   cd C:\FAYO\mobile\fayo
   flutter clean
   ```

3. **Let Gradle re-download NDK:**
   ```bash
   flutter pub get
   flutter run
   ```

   Gradle will automatically download the correct NDK version.

### Option 2: Use Android Studio SDK Manager

1. Open **Android Studio**
2. Go to **Tools > SDK Manager**
3. Click on **SDK Tools** tab
4. Uncheck **NDK (Side by side)** and click **Apply** to remove
5. Check **NDK (Side by side)** again and click **Apply** to reinstall
6. Select a specific NDK version (recommended: 25.1.8937393 or latest stable)

### Option 3: Specify NDK Version in build.gradle.kts

If you want to use a specific NDK version, edit `android/app/build.gradle.kts`:

```kotlin
android {
    namespace = "com.example.fayo"
    compileSdk = flutter.compileSdkVersion
    ndkVersion = "25.1.8937393" // Specify a known good version
    // ... rest of config
}
```

### Option 4: Disable NDK (If not needed)

If your app doesn't need native code, you can try removing NDK requirement:

1. Edit `android/app/build.gradle.kts`:
   ```kotlin
   android {
       namespace = "com.example.fayo"
       compileSdk = flutter.compileSdkVersion
       // Remove or comment out ndkVersion line
       // ndkVersion = flutter.ndkVersion
   ```

2. However, note that some Flutter plugins (like Agora RTC) require NDK.

## Additional Fixes

### Clean Build

Always try a clean build after fixing NDK:

```bash
cd C:\FAYO\mobile\fayo
flutter clean
flutter pub get
cd android
./gradlew clean
cd ..
flutter run
```

### Check Flutter Doctor

Run Flutter doctor to check for other issues:

```bash
flutter doctor -v
```

### Verify Android SDK

Ensure you have:
- Android SDK Platform 34 (or the version specified in your build.gradle)
- Android SDK Build-Tools
- Android SDK Command-line Tools

## If Issues Persist

1. **Update Flutter:**
   ```bash
   flutter upgrade
   ```

2. **Check local.properties:**
   Verify `android/local.properties` has correct SDK path:
   ```
   sdk.dir=C:\\Users\\YourUsername\\AppData\\Local\\Android\\Sdk
   ```

3. **Invalidate Caches (Android Studio):**
   - File > Invalidate Caches / Restart
   - Select "Invalidate and Restart"

4. **Reinstall Android SDK:**
   - Use Android Studio SDK Manager
   - Remove and reinstall Android SDK Platform-Tools

## Permissions Added

The AndroidManifest.xml has been updated with required permissions:
- Internet (for API calls)
- Camera (for video calls)
- Record Audio (for video calls)
- Network State (for connectivity checks)

These are required for the app's video calling and networking features.

