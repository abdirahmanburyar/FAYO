package com.fayo.healthcare.ui.screens

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.fayo.healthcare.data.api.ApiClient
import com.fayo.healthcare.data.models.AppointmentDto
import com.fayo.healthcare.data.storage.AndroidTokenStorage
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import org.koin.core.component.KoinComponent
import org.koin.core.component.inject

data class AppointmentsUiState(
    val appointments: List<AppointmentDto> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null
)

class AppointmentsViewModel(
    private val tokenStorage: AndroidTokenStorage
) : ViewModel(), KoinComponent {
    private val apiClient: ApiClient by inject()
    
    private val _uiState = MutableStateFlow(AppointmentsUiState())
    val uiState: StateFlow<AppointmentsUiState> = _uiState.asStateFlow()
    
    fun loadAppointments() {
        viewModelScope.launch {
            _uiState.value = AppointmentsUiState(isLoading = true)
            
            // Get current user's patient ID
            val currentPatientId = tokenStorage.getUserId()
            
            if (currentPatientId.isNullOrBlank()) {
                _uiState.value = AppointmentsUiState(
                    error = "User not logged in"
                )
                return@launch
            }
            
            apiClient.getAppointments(patientId = currentPatientId)
                .onSuccess { allAppointments ->
                    // Filter appointments to only show those belonging to the current user
                    val userAppointments = allAppointments.filter { 
                        it.patientId == currentPatientId 
                    }
                    println("📅 [Appointments] Loaded ${userAppointments.size} appointments for patient: $currentPatientId (out of ${allAppointments.size} total)")
                    _uiState.value = AppointmentsUiState(appointments = userAppointments)
                }
                .onFailure { error ->
                    _uiState.value = AppointmentsUiState(
                        error = error.message ?: "Failed to load appointments"
                    )
                }
        }
    }
}

