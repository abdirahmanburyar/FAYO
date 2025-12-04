package com.fayo.healthcare.ui.screens

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.fayo.healthcare.data.api.ApiClient
import com.fayo.healthcare.data.models.UpdateProfileRequest
import com.fayo.healthcare.data.models.UserProfileDto
import com.fayo.healthcare.domain.repositories.AuthRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import org.koin.core.component.KoinComponent
import org.koin.core.component.inject

data class ProfileUiState(
    val profile: UserProfileDto? = null,
    val isLoading: Boolean = false,
    val isUpdating: Boolean = false,
    val error: String? = null
)

class ProfileViewModel(
    private val authRepository: AuthRepository,
    private val apiClient: ApiClient
) : ViewModel() {

    private val _uiState = MutableStateFlow(ProfileUiState())
    val uiState: StateFlow<ProfileUiState> = _uiState.asStateFlow()

    init {
        loadProfile()
    }

    fun loadProfile() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            
            apiClient.getUserProfile()
                .onSuccess { profile ->
                    _uiState.value = _uiState.value.copy(
                        profile = profile,
                        isLoading = false,
                        error = null
                    )
                }
                .onFailure { e ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = e.message ?: "Failed to load profile"
                    )
                }
        }
    }

    fun updateProfile(
        firstName: String?,
        lastName: String?,
        phone: String?,
        email: String?,
        address: String?,
        dateOfBirth: String?,
        gender: String?
    ) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isUpdating = true, error = null)
            
            val request = UpdateProfileRequest(
                firstName = firstName?.takeIf { it.isNotBlank() },
                lastName = lastName?.takeIf { it.isNotBlank() },
                phone = phone?.takeIf { it.isNotBlank() },
                email = email?.takeIf { it.isNotBlank() },
                address = address?.takeIf { it.isNotBlank() },
                dateOfBirth = dateOfBirth?.takeIf { it.isNotBlank() },
                gender = gender?.takeIf { it.isNotBlank() }
            )
            
            apiClient.updateUserProfile(request)
                .onSuccess { updatedProfile ->
                    _uiState.value = _uiState.value.copy(
                        profile = updatedProfile,
                        isUpdating = false,
                        error = null
                    )
                }
                .onFailure { e ->
                    _uiState.value = _uiState.value.copy(
                        isUpdating = false,
                        error = e.message ?: "Failed to update profile"
                    )
                }
        }
    }

    fun clearError() {
        _uiState.value = _uiState.value.copy(error = null)
    }

    fun logout() {
        authRepository.logout()
    }
}
