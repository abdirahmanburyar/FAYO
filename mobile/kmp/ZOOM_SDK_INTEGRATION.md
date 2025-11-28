# Zoom Video SDK Integration Guide for Kotlin Multiplatform (Android)

## Overview
This guide explains how to integrate Zoom Video SDK into your Kotlin Multiplatform Android app using Jetpack Compose.

## Important Notes
- Zoom Video SDK is **platform-specific** (Android/iOS), not KMP-compatible
- You need to use **expect/actual** pattern or platform-specific implementations
- The SDK is primarily designed for native Android, not KMP

## Step 1: Add Zoom Video SDK Dependency

### Option A: Using Maven Repository (Recommended)

Add to `mobile/kmp/androidApp/build.gradle.kts`:

```kotlin
dependencies {
    // ... existing dependencies ...
    
    // Zoom Video SDK for Android
    // Check https://marketplace.zoom.us/docs/sdk/video/android for latest version
    implementation("us.zoom.sdk:zoom-videosdk:1.11.0") // Replace with actual version
    
    // Or if using AAR file directly:
    // implementation(files("libs/zoom-videosdk.aar"))
}
```

### Option B: Download AAR File

1. Download Zoom Video SDK AAR from: https://marketplace.zoom.us/docs/sdk/video/android
2. Place the AAR file in `mobile/kmp/androidApp/libs/`
3. Add to `build.gradle.kts`:

```kotlin
dependencies {
    implementation(files("libs/zoom-videosdk.aar"))
}
```

## Step 2: Add Required Permissions

Add to `mobile/kmp/androidApp/src/main/AndroidManifest.xml`:

```xml
<manifest>
    <!-- Required permissions for Zoom Video SDK -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
    <uses-permission android:name="android.permission.BLUETOOTH" />
    <uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
    
    <!-- Optional: For better performance -->
    <uses-feature android:name="android.hardware.camera" android:required="false" />
    <uses-feature android:name="android.hardware.camera.autofocus" android:required="false" />
</manifest>
```

## Step 3: Initialize SDK in Application Class

Update `mobile/kmp/androidApp/src/main/java/com/fayo/healthcare/FayoApplication.kt`:

```kotlin
import android.app.Application
import us.zoom.sdk.ZoomVideoSDK
import us.zoom.sdk.ZoomVideoSDKInitParams

class FayoApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        
        // Initialize Zoom Video SDK
        val zoomSDK = ZoomVideoSDK.getInstance()
        val initParams = ZoomVideoSDKInitParams().apply {
            enableLog = true // Enable for debugging
            logLevel = ZoomVideoSDKLogLevel.ZoomVideoSDKLogLevel_Info
        }
        
        val result = zoomSDK.initialize(this, initParams)
        if (result == ZoomVideoSDKErrors.Errors_Success) {
            android.util.Log.d("ZoomSDK", "✅ Zoom SDK initialized successfully")
        } else {
            android.util.Log.e("ZoomSDK", "❌ Failed to initialize Zoom SDK: $result")
        }
    }
}
```

Don't forget to register in `AndroidManifest.xml`:

```xml
<application
    android:name=".FayoApplication"
    ...>
</application>
```

## Step 4: Update AndroidZoomVideoService Implementation

The service is already set up in `AndroidZoomVideoService.kt`. Uncomment and update the implementation:

```kotlin
import us.zoom.sdk.*
import android.content.Context

class AndroidZoomVideoService(private val context: Context) : ZoomVideoService {
    private var zoomSDK: ZoomVideoSDK? = null
    private var zoomSession: ZoomVideoSDKSession? = null
    private var videoHelper: ZoomVideoSDKVideoHelper? = null
    private var audioHelper: ZoomVideoSDKAudioHelper? = null

    override suspend fun initialize(): Result<Unit> = withContext(Dispatchers.Main) {
        try {
            zoomSDK = ZoomVideoSDK.getInstance()
            val initParams = ZoomVideoSDKInitParams().apply {
                enableLog = true
                logLevel = ZoomVideoSDKLogLevel.ZoomVideoSDKLogLevel_Info
            }
            
            val result = zoomSDK?.initialize(context, initParams)
            if (result != ZoomVideoSDKErrors.Errors_Success) {
                throw Exception("Failed to initialize Zoom SDK: $result")
            }
            
            isInitialized = true
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun joinSession(credentials: CallCredentialsDto): Result<Unit> = withContext(Dispatchers.Main) {
        try {
            zoomSDK?.let { sdk ->
                val sessionContext = ZoomVideoSDKSessionContext().apply {
                    sessionName = credentials.sessionName
                    token = credentials.token
                    userName = credentials.userIdentity
                    sessionPassword = "" // Empty password
                }
                
                val joinResult = sdk.joinSession(sessionContext)
                if (joinResult != ZoomVideoSDKErrors.Errors_Success) {
                    throw Exception("Failed to join session: $joinResult")
                }
                
                zoomSession = sdk.session
                videoHelper = zoomSession?.videoHelper
                audioHelper = zoomSession?.audioHelper
                
                // Start video and audio
                videoHelper?.startVideo()
                audioHelper?.unMuteAudio()
                
                currentState = currentState.copy(isJoined = true)
                Result.success(Unit)
            } ?: throw Exception("Zoom SDK not initialized")
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun leaveSession(): Result<Unit> = withContext(Dispatchers.Main) {
        try {
            videoHelper?.stopVideo()
            audioHelper?.muteAudio()
            zoomSession?.leave()
            zoomSession = null
            videoHelper = null
            audioHelper = null
            currentState = currentState.copy(isJoined = false)
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun toggleVideo(enabled: Boolean): Result<Unit> = withContext(Dispatchers.Main) {
        try {
            if (enabled) {
                videoHelper?.startVideo()
            } else {
                videoHelper?.stopVideo()
            }
            currentState = currentState.copy(isVideoOn = enabled)
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun toggleAudio(enabled: Boolean): Result<Unit> = withContext(Dispatchers.Main) {
        try {
            if (enabled) {
                audioHelper?.unMuteAudio()
            } else {
                audioHelper?.muteAudio()
            }
            currentState = currentState.copy(isAudioOn = enabled)
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override fun cleanup() {
        zoomSession?.leave()
        zoomSDK?.cleanUp()
        currentState = ZoomSessionState()
        isInitialized = false
    }
    
    @Composable
    fun ZoomVideoView(modifier: Modifier = Modifier) {
        AndroidView(
            factory = { ctx ->
                val videoView = videoHelper?.getVideoView()
                videoView ?: FrameLayout(ctx).apply {
                    setBackgroundColor(android.graphics.Color.BLACK)
                }
            },
            modifier = modifier
        )
    }
}
```

## Step 5: Request Runtime Permissions

Add permission request in `CallScreen.kt`:

```kotlin
import androidx.compose.runtime.LaunchedEffect
import android.Manifest
import com.google.accompanist.permissions.ExperimentalPermissionsApi
import com.google.accompanist.permissions.rememberMultiplePermissionsState

@OptIn(ExperimentalPermissionsApi::class)
@Composable
fun CallScreen(...) {
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
    
    // ... rest of the screen
}
```

Add dependency to `build.gradle.kts`:

```kotlin
implementation("com.google.accompanist:accompanist-permissions:0.32.0")
```

## Step 6: Handle Video View in Compose

Update `CallScreen.kt` to use the Zoom video view:

```kotlin
if (isJoined && zoomVideoService is AndroidZoomVideoService) {
    zoomVideoService.ZoomVideoView(
        modifier = Modifier.fillMaxSize()
    )
}
```

## Troubleshooting

### SDK Not Found
- Ensure the AAR file is in the correct location
- Check that the dependency is correctly added to `build.gradle.kts`
- Sync Gradle files

### Permission Denied
- Request permissions at runtime before initializing SDK
- Check `AndroidManifest.xml` has all required permissions

### Session Join Fails
- Verify credentials are valid (token, sessionName)
- Check network connectivity
- Ensure SDK is initialized before joining

### Video Not Displaying
- Check camera permissions are granted
- Verify `ZoomVideoView` is properly added to the view hierarchy
- Check if video is started: `videoHelper?.startVideo()`

## Resources

- Official Documentation: https://marketplace.zoom.us/docs/sdk/video/android
- SDK Download: https://marketplace.zoom.us/docs/sdk/video/android/getting-started/integration
- API Reference: https://marketplace.zoom.us/docs/sdk/video/android/reference

## Alternative: Using WebRTC

If Zoom SDK integration is too complex, consider using WebRTC KMP:
- https://github.com/shepeliev/webrtc-kmp
- Cross-platform support
- More KMP-friendly

