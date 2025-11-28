package com.fayo.healthcare.ui.screens.hospitals

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.fayo.healthcare.data.api.ApiClient
import com.fayo.healthcare.data.models.HospitalDto
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import org.koin.core.component.KoinComponent
import org.koin.core.component.inject

data class HospitalDetailsUiState(
    val hospital: HospitalDto? = null,
    val isLoading: Boolean = false,
    val error: String? = null
)

class HospitalDetailsViewModel(
    private val hospitalId: String
) : ViewModel(), KoinComponent {
    private val apiClient: ApiClient by inject()
    
    private val _uiState = MutableStateFlow(HospitalDetailsUiState())
    val uiState: StateFlow<HospitalDetailsUiState> = _uiState.asStateFlow()
    
    init {
        loadHospitalDetails()
    }
    
    fun loadHospitalDetails() {
        viewModelScope.launch {
            _uiState.value = HospitalDetailsUiState(isLoading = true)
            apiClient.getHospitalById(hospitalId)
                .onSuccess { hospital ->
                    _uiState.value = HospitalDetailsUiState(hospital = hospital)
                }
                .onFailure { error ->
                    _uiState.value = HospitalDetailsUiState(
                        error = error.message ?: "Failed to load hospital details"
                    )
                }
        }
    }
}

