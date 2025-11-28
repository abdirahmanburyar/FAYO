package com.fayo.healthcare.ui.screens.call

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import com.fayo.healthcare.data.models.CallCredentialsDto
import com.fayo.healthcare.ui.theme.WarningYellow
import android.view.ViewGroup
import android.widget.FrameLayout
import kotlinx.coroutines.launch
import androidx.compose.runtime.rememberCoroutineScope
import android.Manifest
import com.google.accompanist.permissions.ExperimentalPermissionsApi
import com.google.accompanist.permissions.rememberMultiplePermissionsState
import com.google.accompanist.permissions.isGranted
import com.google.accompanist.permissions.shouldShowRationale

@OptIn(ExperimentalMaterial3Api::class, ExperimentalPermissionsApi::class)
@Composable
fun CallScreen(
    credentials: CallCredentialsDto,
    onEndCall: () -> Unit,
    agoraService: com.fayo.healthcare.data.services.AgoraVideoService? = null
) {
    val context = androidx.compose.ui.platform.LocalContext.current
    val scope = rememberCoroutineScope()
    val agoraVideoService = agoraService ?: remember { 
        com.fayo.healthcare.data.services.AndroidAgoraVideoService(context)
    }
    
    // Request runtime permissions for camera and microphone
    val permissionsState = rememberMultiplePermissionsState(
        permissions = listOf(
            Manifest.permission.CAMERA,
            Manifest.permission.RECORD_AUDIO
        )
    )
    
    var isVideoOn by remember { mutableStateOf(true) }
    var isAudioOn by remember { mutableStateOf(true) }
    var isJoined by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    var sessionState by remember { mutableStateOf(agoraVideoService.getSessionState()) }
    var permissionsGranted by remember { mutableStateOf(false) }

    // Request permissions when screen loads
    LaunchedEffect(Unit) {
        if (!permissionsState.allPermissionsGranted) {
            println("📱 [CALL] Requesting camera and microphone permissions...")
            permissionsState.launchMultiplePermissionRequest()
        } else {
            println("✅ [CALL] All permissions granted")
            permissionsGranted = true
        }
    }
    
    // Update permissionsGranted when permissions change
    LaunchedEffect(permissionsState.allPermissionsGranted) {
        permissionsGranted = permissionsState.allPermissionsGranted
        if (permissionsGranted) {
            println("✅ [CALL] Permissions granted, ready to initialize call")
        } else {
            println("⚠️ [CALL] Permissions not granted")
            val deniedPermissions = permissionsState.permissions.filter { !it.status.isGranted }
            val shouldShowRationale = deniedPermissions.any { it.status.shouldShowRationale }
            if (shouldShowRationale) {
                errorMessage = "Camera and microphone permissions are required for video calls. Please grant permissions in settings."
            } else {
                errorMessage = "Camera and microphone permissions are required for video calls."
            }
        }
    }

    LaunchedEffect(credentials, permissionsGranted) {
        // Only initialize if permissions are granted
        if (!permissionsGranted) {
            println("⏳ [CALL] Waiting for permissions before initializing...")
            return@LaunchedEffect
        }
        
        try {
            println("📞 [CALL] Initializing Agora SDK with credentials")
            println("📞 [CALL] Channel: ${credentials.channelName}")
            println("📞 [CALL] UID: ${credentials.uid}")
            println("📞 [CALL] Role: ${credentials.role}")
            println("✅ [CALL] Permissions granted - proceeding with initialization")
            
            // Join channel - this will initialize the SDK with the correct appId from credentials
            // No need to call initialize() separately
            val joinResult = agoraVideoService.joinChannel(credentials)
            if (joinResult.isFailure) {
                errorMessage = "Failed to join session: ${joinResult.exceptionOrNull()?.message}"
                return@LaunchedEffect
            }
            
            isJoined = true
            sessionState = agoraVideoService.getSessionState()
            isVideoOn = sessionState.isVideoOn
            isAudioOn = sessionState.isAudioOn
        } catch (e: Exception) {
            println("❌ [CALL] Error: ${e.message}")
            errorMessage = e.message
        }
    }
    
    // Update state from service
    LaunchedEffect(Unit) {
        while (true) {
            kotlinx.coroutines.delay(1000)
            sessionState = agoraVideoService.getSessionState()
            isVideoOn = sessionState.isVideoOn
            isAudioOn = sessionState.isAudioOn
        }
    }
    
    DisposableEffect(Unit) {
        onDispose {
            // Cleanup when screen is disposed
            scope.launch {
                agoraVideoService.leaveChannel()
                agoraVideoService.cleanup()
            }
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Video Call") },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Color.Black,
                    titleContentColor = Color.White
                )
            )
        },
        containerColor = Color.Black
    ) { padding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            // Video container - show video only after joining
            if (isJoined && permissionsGranted) {
                // Use Agora SDK video view if service supports it
                if (agoraVideoService is com.fayo.healthcare.data.services.AndroidAgoraVideoService) {
                    // Show local video
                    agoraVideoService.AgoraVideoView(
                        modifier = Modifier.fillMaxSize(),
                        isLocal = true
                    )
                    
                    // Show remote videos if any
                    sessionState.remoteUsers.forEach { remoteUser ->
                        val remoteUid = remoteUser.uid.toIntOrNull()
                        if (remoteUid != null && remoteUser.hasVideo) {
                            Box(
                                modifier = Modifier
                                    .size(120.dp)
                                    .align(Alignment.TopEnd)
                                    .padding(16.dp)
                            ) {
                                agoraVideoService.AgoraVideoView(
                                    modifier = Modifier.fillMaxSize(),
                                    isLocal = false,
                                    uid = remoteUid
                                )
                            }
                        }
                    }
                } else {
                    // Fallback view
                    AndroidView(
                        factory = { context ->
                            FrameLayout(context).apply {
                                layoutParams = ViewGroup.LayoutParams(
                                    ViewGroup.LayoutParams.MATCH_PARENT,
                                    ViewGroup.LayoutParams.MATCH_PARENT
                                )
                                setBackgroundColor(android.graphics.Color.BLACK)
                            }
                        },
                        modifier = Modifier.fillMaxSize()
                    )
                }
            } else {
                // Loading or error state
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(Color.Black),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center
                ) {
                    if (!permissionsGranted) {
                        // Permission denied state
                        Icon(
                            imageVector = Icons.Default.Warning,
                            contentDescription = null,
                            tint = WarningYellow,
                            modifier = Modifier.size(64.dp)
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Text(
                            text = "Permissions Required",
                            color = Color.White,
                            fontSize = 20.sp,
                            fontWeight = androidx.compose.ui.text.font.FontWeight.Bold
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = "Camera and microphone permissions are required for video calls.",
                            color = Color.White.copy(alpha = 0.8f),
                            fontSize = 14.sp
                        )
                        Spacer(modifier = Modifier.height(24.dp))
                        Button(
                            onClick = {
                                scope.launch {
                                    permissionsState.launchMultiplePermissionRequest()
                                }
                            }
                        ) {
                            Text("Grant Permissions")
                        }
                    } else if (errorMessage != null) {
                        // Error state
                        Icon(
                            imageVector = Icons.Default.Error,
                            contentDescription = null,
                            tint = Color.Red,
                            modifier = Modifier.size(64.dp)
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Text(
                            text = "Error",
                            color = Color.White,
                            fontSize = 20.sp,
                            fontWeight = androidx.compose.ui.text.font.FontWeight.Bold
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = errorMessage ?: "Unknown error",
                            color = Color.White.copy(alpha = 0.8f),
                            fontSize = 14.sp
                        )
                    } else {
                        // Loading state
                        CircularProgressIndicator(color = Color.White)
                        Spacer(modifier = Modifier.height(16.dp))
                        Text(
                            text = "Connecting...",
                            color = Color.White,
                            fontSize = 16.sp
                        )
                    }
                }
            }

            // Call controls at bottom
            Row(
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .padding(32.dp),
                horizontalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Mute/Unmute Audio
                FloatingActionButton(
                    onClick = { 
                        scope.launch {
                            val newState = !isAudioOn
                            agoraVideoService.toggleAudio(newState)
                            isAudioOn = newState
                        }
                    },
                    containerColor = if (isAudioOn) MaterialTheme.colorScheme.primary else Color.Gray,
                    content = {
                        Icon(
                            imageVector = if (isAudioOn) Icons.Default.Mic else Icons.Default.MicOff,
                            contentDescription = if (isAudioOn) "Mute" else "Unmute",
                            tint = Color.White
                        )
                    }
                )

                // Toggle Video
                FloatingActionButton(
                    onClick = { 
                        scope.launch {
                            val newState = !isVideoOn
                            agoraVideoService.toggleVideo(newState)
                            isVideoOn = newState
                        }
                    },
                    containerColor = if (isVideoOn) MaterialTheme.colorScheme.primary else Color.Gray,
                    content = {
                        Icon(
                            imageVector = if (isVideoOn) Icons.Default.Videocam else Icons.Default.VideocamOff,
                            contentDescription = if (isVideoOn) "Turn off video" else "Turn on video",
                            tint = Color.White
                        )
                    }
                )

                // End Call
                FloatingActionButton(
                    onClick = {
                        scope.launch {
                            agoraVideoService.leaveChannel()
                            agoraVideoService.cleanup()
                            onEndCall()
                        }
                    },
                    containerColor = Color.Red,
                    content = {
                        Icon(
                            imageVector = Icons.Default.CallEnd,
                            contentDescription = "End call",
                            tint = Color.White
                        )
                    }
                )
            }

            // Session info overlay
            Card(
                modifier = Modifier
                    .align(Alignment.TopStart)
                    .padding(16.dp),
                colors = CardDefaults.cardColors(
                    containerColor = Color.Black.copy(alpha = 0.7f)
                )
            ) {
                Column(
                    modifier = Modifier.padding(12.dp)
                ) {
                    Text(
                        text = "Channel: ${credentials.channelName}",
                        color = Color.White,
                        fontSize = 12.sp
                    )
                    Text(
                        text = "UID: ${credentials.uid}",
                        color = Color.White,
                        fontSize = 12.sp
                    )
                    Text(
                        text = "Role: ${credentials.role}",
                        color = Color.White,
                        fontSize = 12.sp
                    )
                }
            }
        }
    }
}

