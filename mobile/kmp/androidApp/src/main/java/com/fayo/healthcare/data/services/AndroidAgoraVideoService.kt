package com.fayo.healthcare.data.services

import android.content.Context
import android.content.pm.PackageManager
import android.util.Log
import android.view.ViewGroup
import android.widget.FrameLayout
import androidx.compose.runtime.Composable
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import com.fayo.healthcare.data.models.CallCredentialsDto
import android.Manifest
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import io.agora.rtc2.*
import io.agora.rtc2.video.VideoCanvas
import android.view.SurfaceView

/**
 * Android implementation of Agora RTC SDK service
 * 
 * IMPORTANT: To complete this implementation, you need to:
 * 1. Add Agora RTC SDK dependency to build.gradle.kts:
 *    implementation("io.agora.rtc:full-sdk:4.2.0")
 *    Check https://docs.agora.io/en/video-calling/get-started/get-started-sdk?platform=android for the latest version
 * 
 * 2. Add required permissions to AndroidManifest.xml:
 *    - android.permission.CAMERA
 *    - android.permission.RECORD_AUDIO
 *    - android.permission.INTERNET
 *    - android.permission.ACCESS_NETWORK_STATE
 * 
 * 3. Initialize the SDK in Application class (optional, can be done in service)
 * 
 * Reference: https://docs.agora.io/en/video-calling/get-started/get-started-sdk?platform=android
 */
class AndroidAgoraVideoService(private val context: Context) : AgoraVideoService {
    private val TAG = "AgoraVideoService"
    private var isInitialized = false
    private var currentState = AgoraSessionState()
    private var currentAppId: String? = null
    
    // Agora RTC Engine
    private var rtcEngine: RtcEngine? = null
    private var localVideoView: SurfaceView? = null
    private val remoteUsersMap = mutableMapOf<Int, SurfaceView>()
    
    /**
     * Check if camera permission is granted
     */
    private fun hasCameraPermission(): Boolean {
        return ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.CAMERA
        ) == PackageManager.PERMISSION_GRANTED
    }
    
    /**
     * Check if microphone permission is granted
     */
    private fun hasMicrophonePermission(): Boolean {
        return ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.RECORD_AUDIO
        ) == PackageManager.PERMISSION_GRANTED
    }
    
    /**
     * Check if all required permissions are granted
     */
    private fun hasAllPermissions(): Boolean {
        val hasCamera = hasCameraPermission()
        val hasMic = hasMicrophonePermission()
        Log.d(TAG, "📱 [PERMISSIONS] Camera: $hasCamera, Microphone: $hasMic")
        return hasCamera && hasMic
    }

    /**
     * Initialize with a specific appId
     */
    private suspend fun initializeWithAppId(appId: String): Result<Unit> = withContext(Dispatchers.Main) {
        try {
            Log.d(TAG, "📞 [AGORA] Initializing Agora RTC SDK with App ID: ${appId.take(10)}...")
            
            // Validate appId
            if (appId.isBlank()) {
                val error = Exception("App ID is empty. Cannot initialize RTC Engine.")
                Log.e(TAG, "❌ [AGORA] ${error.message}")
                return@withContext Result.failure(error)
            }
            
            // Validate context
            if (context == null) {
                val error = Exception("Context is null. Cannot initialize RTC Engine.")
                Log.e(TAG, "❌ [AGORA] ${error.message}")
                return@withContext Result.failure(error)
            }
            
            // Clean up existing engine if any
            if (rtcEngine != null) {
                Log.d(TAG, "🧹 [AGORA] Cleaning up existing engine")
                rtcEngine?.leaveChannel()
                RtcEngine.destroy()
                rtcEngine = null
            }
            
            // Create RTC Engine instance with appId
            Log.d(TAG, "📞 [AGORA] Creating RTC Engine with context and appId")
            val config = RtcEngineConfig().apply {
                mContext = context
                mAppId = appId
                mEventHandler = object : IRtcEngineEventHandler() {
                    override fun onJoinChannelSuccess(channel: String?, uid: Int, elapsed: Int) {
                        Log.d(TAG, "✅ [AGORA] Joined channel successfully: $channel, uid: $uid")
                        currentState = currentState.copy(isJoined = true)
                        // Ensure local video is set up after joining
                        localVideoView?.let { view ->
                            Log.d(TAG, "📹 [AGORA] Re-setting up local video after join success")
                            setupLocalVideo(view)
                        }
                    }

                    override fun onUserJoined(uid: Int, elapsed: Int) {
                        Log.d(TAG, "👤 [AGORA] Remote user joined: $uid")
                        val remoteUser = AgoraRemoteUser(uid.toString(), hasVideo = false, hasAudio = false)
                        currentState = currentState.copy(
                            remoteUsers = currentState.remoteUsers + remoteUser
                        )
                    }

                    override fun onUserOffline(uid: Int, reason: Int) {
                        Log.d(TAG, "👤 [AGORA] Remote user left: $uid")
                        currentState = currentState.copy(
                            remoteUsers = currentState.remoteUsers.filter { it.uid != uid.toString() }
                        )
                        remoteUsersMap.remove(uid)
                    }

                    override fun onRemoteVideoStateChanged(uid: Int, state: Int, reason: Int, elapsed: Int) {
                        Log.d(TAG, "📹 [AGORA] Remote video state changed: uid=$uid, state=$state")
                        // Agora video state: 0=STOPPED, 1=STARTING, 2=DECODING, 3=FAILED, 4=FROZEN
                        // Use numeric values as constants may vary by SDK version
                        val hasVideo = state == 1 || state == 2 // STARTING or DECODING
                        currentState = currentState.copy(
                            remoteUsers = currentState.remoteUsers.map { 
                                if (it.uid == uid.toString()) it.copy(hasVideo = hasVideo) else it
                            }
                        )
                    }

                    override fun onRemoteAudioStateChanged(uid: Int, state: Int, reason: Int, elapsed: Int) {
                        Log.d(TAG, "🔊 [AGORA] Remote audio state changed: uid=$uid, state=$state")
                        // Agora audio state: 0=STOPPED, 1=STARTING, 2=DECODING, 3=FAILED, 4=FROZEN
                        // Use numeric values as constants may vary by SDK version
                        val hasAudio = state == 1 || state == 2 // STARTING or DECODING
                        currentState = currentState.copy(
                            remoteUsers = currentState.remoteUsers.map { 
                                if (it.uid == uid.toString()) it.copy(hasAudio = hasAudio) else it
                            }
                        )
                    }

                    override fun onError(err: Int) {
                        Log.e(TAG, "❌ [AGORA] Error: $err")
                    }
                }
            }
            
            // Try to create the engine
            val engine = try {
                RtcEngine.create(config)
            } catch (e: Exception) {
                Log.e(TAG, "❌ [AGORA] Exception creating RTC Engine: ${e.message}", e)
                val error = Exception("Failed to create RTC Engine: ${e.message}")
                return@withContext Result.failure(error)
            }
            
            // Verify engine was created successfully
            if (engine == null) {
                val error = Exception("Failed to create RTC Engine. RtcEngine.create() returned null. Check if appId is valid and Agora SDK is properly integrated.")
                Log.e(TAG, "❌ [AGORA] ${error.message}")
                Log.e(TAG, "❌ [AGORA] AppId length: ${appId.length}, Context: ${context.javaClass.simpleName}")
                return@withContext Result.failure(error)
            }
            
            // Store the engine
            rtcEngine = engine
            
            // Enable video (must be called before joining channel)
            engine.enableVideo()
            
            // Enable audio (must be called before joining channel)
            engine.enableAudio()
            
            // Video encoder configuration is optional
            // Agora SDK will use optimal default settings
            // You can customize this later if needed by setting VideoEncoderConfiguration
            // after the engine is created and before joining the channel
            
            Log.d(TAG, "✅ [AGORA] Video and audio enabled")
            
            // Set video encoder configuration (optional - using default settings)
            // Video encoder configuration can be set later if needed
            // For now, we'll use the default configuration
            
            currentAppId = appId
            isInitialized = true
            Log.d(TAG, "✅ [AGORA] SDK initialized with App ID")
            Result.success(Unit)
        } catch (e: Exception) {
            Log.e(TAG, "❌ [AGORA] Failed to initialize: ${e.message}", e)
            Result.failure(e)
        }
    }

    override suspend fun initialize(): Result<Unit> {
        // Default initialization without appId (will be set when joining channel)
        // This method is kept for interface compatibility but should not be used directly
        // The appId should be provided when joining the channel
        Log.w(TAG, "⚠️ [AGORA] initialize() called without appId. Engine will be created when joinChannel is called with credentials.")
        // Don't create engine without appId - wait for joinChannel to provide it
        return Result.success(Unit)
    }

    override suspend fun joinChannel(credentials: CallCredentialsDto): Result<Unit> = withContext(Dispatchers.Main) {
        try {
            Log.d(TAG, "📞 [AGORA] Joining channel: ${credentials.channelName}")
            Log.d(TAG, "📞 [AGORA] App ID: ${credentials.appId.take(10)}...")
            Log.d(TAG, "📞 [AGORA] UID: ${credentials.uid}, Role: ${credentials.role}")
            Log.d(TAG, "📞 [AGORA] Token: ${credentials.token.take(20)}...")
            
            // Validate credentials
            if (credentials.appId.isBlank()) {
                val error = Exception("App ID is empty. Cannot join channel.")
                Log.e(TAG, "❌ [AGORA] ${error.message}")
                return@withContext Result.failure(error)
            }
            
            if (credentials.channelName.isBlank()) {
                val error = Exception("Channel name is empty. Cannot join channel.")
                Log.e(TAG, "❌ [AGORA] ${error.message}")
                return@withContext Result.failure(error)
            }
            
            if (credentials.token.isBlank()) {
                val error = Exception("Token is empty. Cannot join channel.")
                Log.e(TAG, "❌ [AGORA] ${error.message}")
                return@withContext Result.failure(error)
            }
            
            // Check permissions before joining
            if (!hasAllPermissions()) {
                val missingPermissions = mutableListOf<String>()
                if (!hasCameraPermission()) missingPermissions.add("CAMERA")
                if (!hasMicrophonePermission()) missingPermissions.add("RECORD_AUDIO")
                val error = Exception("Required permissions not granted: ${missingPermissions.joinToString(", ")}")
                Log.e(TAG, "❌ [AGORA] ${error.message}")
                return@withContext Result.failure(error)
            }
            
            Log.d(TAG, "✅ [AGORA] All permissions granted, proceeding with join")
            
            // Ensure SDK is initialized with correct appId
            // If not initialized or appId changed, reinitialize
            if (!isInitialized || rtcEngine == null || currentAppId != credentials.appId) {
                // Store appId for comparison
                currentAppId = credentials.appId
                
                // Initialize with the appId from credentials
                val initResult = initializeWithAppId(credentials.appId)
                if (initResult.isFailure) {
                    return@withContext initResult
                }
            }
            
            // Parse UID (can be number or string)
            val uid = try {
                credentials.uid.toIntOrNull() ?: 0 // 0 means auto-generated UID
            } catch (e: Exception) {
                0
            }
            
            // Ensure RTC engine is not null
            val engine = rtcEngine
            if (engine == null) {
                val error = Exception("RTC Engine is null. Cannot join channel.")
                Log.e(TAG, "❌ [AGORA] ${error.message}")
                return@withContext Result.failure(error)
            }
            
            // Join channel
            val channelMediaOptions = ChannelMediaOptions().apply {
                // Enable local audio and video
                clientRoleType = if (credentials.role == "HOST") {
                    Constants.CLIENT_ROLE_BROADCASTER
                } else {
                    Constants.CLIENT_ROLE_AUDIENCE
                }
                publishCameraTrack = credentials.role == "HOST"
                publishMicrophoneTrack = credentials.role == "HOST"
            }
            
            Log.d(TAG, "📞 [AGORA] Calling joinChannel with:")
            Log.d(TAG, "   - Token: ${credentials.token.take(30)}...")
            Log.d(TAG, "   - Channel: ${credentials.channelName}")
            Log.d(TAG, "   - UID: $uid")
            Log.d(TAG, "   - Role: ${credentials.role}")
            Log.d(TAG, "   - ClientRole: ${channelMediaOptions.clientRoleType}")
            Log.d(TAG, "   - PublishCamera: ${channelMediaOptions.publishCameraTrack}")
            Log.d(TAG, "   - PublishMic: ${channelMediaOptions.publishMicrophoneTrack}")
            
            val result = engine.joinChannel(
                credentials.token,
                credentials.channelName,
                uid,
                channelMediaOptions
            )
            
            Log.d(TAG, "📞 [AGORA] joinChannel returned: $result")
            
            // Agora SDK returns 0 on success, non-zero on error
            if (result != 0) {
                val errorMsg = when (result) {
                    -1 -> "General error"
                    -2 -> "Invalid parameter"
                    -3 -> "SDK not initialized"
                    -4 -> "SDK not ready"
                    -5 -> "No permission"
                    -7 -> "Already in channel"
                    -17 -> "Join channel rejected"
                    else -> "Error code: $result"
                }
                val error = Exception("Failed to join channel: $errorMsg (code: $result)")
                Log.e(TAG, "❌ [AGORA] ${error.message}")
                return@withContext Result.failure(error)
            }
            
            Log.d(TAG, "✅ [AGORA] Join channel request sent successfully")
            Result.success(Unit)
        } catch (e: Exception) {
            Log.e(TAG, "❌ [AGORA] Failed to join channel: ${e.message}", e)
            Log.e(TAG, "❌ [AGORA] Error details: ${e.stackTraceToString()}")
            Result.failure(e)
        }
    }

    override suspend fun leaveChannel(): Result<Unit> = withContext(Dispatchers.Main) {
        try {
            Log.d(TAG, "📞 [AGORA] Leaving channel...")
            
            rtcEngine?.leaveChannel()
            
            // Clean up local video view (SurfaceView doesn't have release, just remove from parent)
            localVideoView?.let { view ->
                (view.parent as? ViewGroup)?.removeView(view)
            }
            localVideoView = null
            
            // Clean up remote video views
            remoteUsersMap.values.forEach { view ->
                (view.parent as? ViewGroup)?.removeView(view)
            }
            remoteUsersMap.clear()
            
            currentState = currentState.copy(
                isJoined = false,
                remoteUsers = emptyList()
            )
            
            Log.d(TAG, "✅ [AGORA] Left channel")
            Result.success(Unit)
        } catch (e: Exception) {
            Log.e(TAG, "❌ [AGORA] Failed to leave channel: ${e.message}", e)
            Result.failure(e)
        }
    }

    override suspend fun toggleVideo(enabled: Boolean): Result<Unit> = withContext(Dispatchers.Main) {
        try {
            Log.d(TAG, "📹 [AGORA] Toggling video: $enabled")
            
            // Check camera permission before starting video
            if (enabled && !hasCameraPermission()) {
                val error = Exception("Camera permission is required to start video")
                Log.e(TAG, "❌ [AGORA] ${error.message}")
                return@withContext Result.failure(error)
            }
            
            rtcEngine?.muteLocalVideoStream(!enabled)
            
            currentState = currentState.copy(isVideoOn = enabled)
            Log.d(TAG, "✅ [AGORA] Video toggled: $enabled")
            Result.success(Unit)
        } catch (e: Exception) {
            Log.e(TAG, "❌ [AGORA] Failed to toggle video: ${e.message}", e)
            Result.failure(e)
        }
    }

    override suspend fun toggleAudio(enabled: Boolean): Result<Unit> = withContext(Dispatchers.Main) {
        try {
            Log.d(TAG, "🔊 [AGORA] Toggling audio: $enabled")
            
            // Check microphone permission before starting audio
            if (enabled && !hasMicrophonePermission()) {
                val error = Exception("Microphone permission is required to start audio")
                Log.e(TAG, "❌ [AGORA] ${error.message}")
                return@withContext Result.failure(error)
            }
            
            rtcEngine?.muteLocalAudioStream(!enabled)
            
            currentState = currentState.copy(isAudioOn = enabled)
            Log.d(TAG, "✅ [AGORA] Audio toggled: $enabled")
            Result.success(Unit)
        } catch (e: Exception) {
            Log.e(TAG, "❌ [AGORA] Failed to toggle audio: ${e.message}", e)
            Result.failure(e)
        }
    }

    override fun getSessionState(): AgoraSessionState {
        return currentState
    }

    override fun cleanup() {
        Log.d(TAG, "🧹 [AGORA] Cleaning up...")
        // Use coroutine scope to call suspend function
        CoroutineScope(Dispatchers.Main).launch {
            leaveChannel()
        }
        // RtcEngine doesn't have a release() method, just set to null after leaving channel
        // The engine will be cleaned up when we leave the channel
        rtcEngine = null
        currentState = AgoraSessionState()
        isInitialized = false
    }
    
    /**
     * Setup local video view
     */
    fun setupLocalVideo(view: SurfaceView) {
        if (rtcEngine == null) {
            Log.w(TAG, "⚠️ [AGORA] Cannot setup local video: RTC engine is null")
            return
        }
        localVideoView = view
        Log.d(TAG, "📹 [AGORA] Setting up local video with RENDER_MODE_FIT")
        rtcEngine?.setupLocalVideo(VideoCanvas(view, Constants.RENDER_MODE_FIT, 0))
        // Start preview to show local video
        rtcEngine?.startPreview()
        Log.d(TAG, "✅ [AGORA] Local video preview started")
    }
    
    /**
     * Setup remote video view
     */
    fun setupRemoteVideo(uid: Int, view: SurfaceView) {
        if (rtcEngine == null) {
            Log.w(TAG, "⚠️ [AGORA] Cannot setup remote video: RTC engine is null")
            return
        }
        remoteUsersMap[uid] = view
        Log.d(TAG, "📹 [AGORA] Setting up remote video for uid: $uid with RENDER_MODE_FIT")
        rtcEngine?.setupRemoteVideo(VideoCanvas(view, Constants.RENDER_MODE_FIT, uid))
        Log.d(TAG, "✅ [AGORA] Remote video setup complete for uid: $uid")
    }
    
    /**
     * Get the video view container for displaying Agora video
     * This should be called from Compose to get the Android View
     */
    @Composable
    fun AgoraVideoView(
        modifier: androidx.compose.ui.Modifier = androidx.compose.ui.Modifier,
        isLocal: Boolean = true,
        uid: Int? = null
    ) {
        AndroidView(
            factory = { ctx ->
                SurfaceView(ctx).apply {
                    layoutParams = ViewGroup.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT,
                        ViewGroup.LayoutParams.MATCH_PARENT
                    )
                    setZOrderMediaOverlay(true)
                    holder.setFormat(android.graphics.PixelFormat.TRANSLUCENT)
                    
                    // Set up video after view is created
                    if (isLocal) {
                        Log.d(TAG, "📹 [AGORA] Setting up local video view")
                        setupLocalVideo(this)
                    } else if (uid != null) {
                        Log.d(TAG, "📹 [AGORA] Setting up remote video view for uid: $uid")
                        setupRemoteVideo(uid, this)
                    }
                }
            },
            modifier = modifier,
            update = { view ->
                // Update video setup when view is recomposed
                if (isLocal && rtcEngine != null && isInitialized) {
                    Log.d(TAG, "📹 [AGORA] Updating local video view")
                    setupLocalVideo(view)
                } else if (!isLocal && uid != null && rtcEngine != null && isInitialized) {
                    Log.d(TAG, "📹 [AGORA] Updating remote video view for uid: $uid")
                    setupRemoteVideo(uid, view)
                }
            }
        )
    }
}

