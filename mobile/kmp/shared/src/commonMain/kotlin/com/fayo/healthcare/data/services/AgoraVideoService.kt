package com.fayo.healthcare.data.services

import com.fayo.healthcare.data.models.CallCredentialsDto

/**
 * Common interface for Agora RTC SDK service
 * Platform-specific implementations will be provided via expect/actual
 */
interface AgoraVideoService {
    /**
     * Initialize the Agora RTC SDK
     */
    suspend fun initialize(): Result<Unit>

    /**
     * Join an Agora RTC channel
     * @param credentials - Agora channel credentials
     */
    suspend fun joinChannel(credentials: CallCredentialsDto): Result<Unit>

    /**
     * Leave the current channel
     */
    suspend fun leaveChannel(): Result<Unit>

    /**
     * Toggle video on/off
     */
    suspend fun toggleVideo(enabled: Boolean): Result<Unit>

    /**
     * Toggle audio on/off
     */
    suspend fun toggleAudio(enabled: Boolean): Result<Unit>

    /**
     * Get current session state
     */
    fun getSessionState(): AgoraSessionState

    /**
     * Cleanup resources
     */
    fun cleanup()
}

data class AgoraSessionState(
    val isJoined: Boolean = false,
    val isVideoOn: Boolean = true,
    val isAudioOn: Boolean = true,
    val remoteUsers: List<AgoraRemoteUser> = emptyList()
)

data class AgoraRemoteUser(
    val uid: String,
    val hasVideo: Boolean = false,
    val hasAudio: Boolean = false
)

