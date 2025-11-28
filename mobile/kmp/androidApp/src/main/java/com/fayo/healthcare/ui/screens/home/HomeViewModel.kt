package com.fayo.healthcare.ui.screens.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.fayo.healthcare.data.api.ApiClient
import com.fayo.healthcare.data.models.CallInvitationEvent
import com.fayo.healthcare.data.models.CallCredentialsDto
import com.fayo.healthcare.data.storage.AndroidTokenStorage
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.launch

data class HomeUiState(
    val isLoading: Boolean = false,
    val callInvitation: CallInvitationEvent.InvitationReceived? = null,
    val activeSessions: List<ActiveSession> = emptyList(),
    val errorMessage: String? = null
)

data class ActiveSession(
    val appointmentId: String,
    val channelName: String,
    val patientId: String,
    val timestamp: String? = null
)

class HomeViewModel(
    private val apiClient: ApiClient,
    private val tokenStorage: AndroidTokenStorage
) : ViewModel() {
    
    private val _uiState = MutableStateFlow(HomeUiState())
    val uiState: StateFlow<HomeUiState> = _uiState.asStateFlow()
    
    private var callInvitationJob: kotlinx.coroutines.Job? = null
    
    init {
        startObservingCallInvitations()
    }
    
    private fun startObservingCallInvitations() {
        val patientId = tokenStorage.getUserId()
        if (patientId.isNullOrBlank()) {
            println("⚠️ [HomeViewModel] Patient ID not found, cannot observe call invitations")
            return
        }
        
        println("📞 [HomeViewModel] Starting to observe call invitations for patient: $patientId")
        
        callInvitationJob = viewModelScope.launch {
            apiClient.observeCallInvitations(patientId)
                .catch { error ->
                    println("❌ [HomeViewModel] Error observing call invitations: ${error.message}")
                    error.printStackTrace()
                }
                .collect { event ->
                    when (event) {
                        is CallInvitationEvent.InvitationReceived -> {
                            println("📞 [HomeViewModel] Call invitation received: ${event.invitation.appointmentId}")
                            val invitation = event.invitation
                            
                            // Add to active sessions if not already there
                            val currentState = _uiState.value
                            val activeSession = ActiveSession(
                                appointmentId = invitation.appointmentId,
                                channelName = invitation.channelName,
                                patientId = invitation.patientId,
                                timestamp = invitation.timestamp
                            )
                            
                            val updatedSessions = if (currentState.activeSessions.any { it.appointmentId == invitation.appointmentId }) {
                                currentState.activeSessions
                            } else {
                                currentState.activeSessions + activeSession
                            }
                            
                            _uiState.value = currentState.copy(
                                callInvitation = event,
                                activeSessions = updatedSessions
                            )
                        }
                        is CallInvitationEvent.CallEnded -> {
                            println("📞 [HomeViewModel] Call ended: ${event.sessionId}")
                            val currentState = _uiState.value
                            
                            // Remove from active sessions
                            val updatedSessions = currentState.activeSessions.filter { 
                                it.channelName != event.sessionId 
                            }
                            
                            // Clear invitation if call ended
                            val updatedInvitation = if (currentState.callInvitation?.invitation?.callSession?.id == event.sessionId) {
                                null
                            } else {
                                currentState.callInvitation
                            }
                            
                            _uiState.value = currentState.copy(
                                callInvitation = updatedInvitation,
                                activeSessions = updatedSessions
                            )
                        }
                    }
                }
        }
    }
    
    fun clearCallInvitation() {
        _uiState.value = _uiState.value.copy(callInvitation = null)
    }
    
    fun acceptCall(invitation: com.fayo.healthcare.data.models.CallInvitationDto) {
        viewModelScope.launch {
            try {
                // Send call.accepted event via WebSocket
                apiClient.sendCallAccepted(
                    appointmentId = invitation.appointmentId,
                    channelName = invitation.channelName,
                    patientId = invitation.patientId
                )
                println("📞 [HomeViewModel] Sent call.accepted event for appointment: ${invitation.appointmentId}")
            } catch (e: Exception) {
                println("❌ [HomeViewModel] Failed to send call.accepted event: ${e.message}")
                e.printStackTrace()
            }
        }
    }
    
    suspend fun getParticipantCredentials(appointmentId: String, userId: String): Result<CallCredentialsDto> {
        return try {
            val result = apiClient.getParticipantCredentials(appointmentId, userId)
            println("📞 [HomeViewModel] Got participant credentials for appointment: $appointmentId")
            result
        } catch (e: Exception) {
            println("❌ [HomeViewModel] Failed to get participant credentials: ${e.message}")
            e.printStackTrace()
            Result.failure(e)
        }
    }
    
    fun removeActiveSession(appointmentId: String) {
        val currentState = _uiState.value
        _uiState.value = currentState.copy(
            activeSessions = currentState.activeSessions.filter { it.appointmentId != appointmentId }
        )
    }
    
    fun getUserId(): String? {
        return tokenStorage.getUserId()
    }
    
    override fun onCleared() {
        super.onCleared()
        callInvitationJob?.cancel()
    }
}

