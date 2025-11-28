package com.fayo.healthcare.data.services

import com.fayo.healthcare.data.models.CallCredentialsDto

/**
 * Common interface for Zoom Video SDK service
 * Platform-specific implementations will be provided via expect/actual
 */
interface ZoomVideoService {
    /**
     * Initialize the Zoom Video SDK
     */
    suspend fun initialize(): Result<Unit>

    /**
     * Join a Zoom video session
     * @param credentials - Zoom session credentials
     */
    suspend fun joinSession(credentials: CallCredentialsDto): Result<Unit>

    /**
     * Leave the current session
     */
    suspend fun leaveSession(): Result<Unit>

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
    fun getSessionState(): ZoomSessionState

    /**
     * Cleanup resources
     */
    fun cleanup()
}

data class ZoomSessionState(
    val isJoined: Boolean = false,
    val isVideoOn: Boolean = true,
    val isAudioOn: Boolean = true,
    val remoteParticipants: List<ZoomParticipant> = emptyList()
)

data class ZoomParticipant(
    val userId: String,
    val userName: String? = null,
    val isVideoOn: Boolean = false,
    val isAudioOn: Boolean = false
)

