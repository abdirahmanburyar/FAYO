package com.fayo.healthcare.ui.screens

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.fayo.healthcare.domain.usecases.VerifyOtpUseCase
import com.fayo.healthcare.data.storage.AndroidTokenStorage
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class OtpVerificationUiState(
    val isLoading: Boolean = false,
    val isSuccess: Boolean = false,
    val errorMessage: String? = null
)

class OtpVerificationViewModel(
    private val verifyOtpUseCase: VerifyOtpUseCase,
    private val tokenStorage: AndroidTokenStorage
) : ViewModel() {
    
    private val _uiState = MutableStateFlow(OtpVerificationUiState())
    val uiState: StateFlow<OtpVerificationUiState> = _uiState.asStateFlow()
    
    fun verifyOtp(phone: String, otp: String) {
        println("OtpVerificationViewModel: Verifying OTP $otp for $phone")
        viewModelScope.launch {
            _uiState.value = OtpVerificationUiState(isLoading = true)
            verifyOtpUseCase(phone, otp)
                .onSuccess { response ->
                    println("OtpVerificationViewModel: OTP verified successfully")
                    // Save user name, user ID, and phone number
                    tokenStorage.saveUserName(response.user.firstName, response.user.lastName)
                    tokenStorage.saveUserId(response.user.id)
                    // Use phone from response.user if available, otherwise use the parameter
                    val phoneToSave = response.user.phone.takeIf { !it.isBlank() } ?: phone
                    tokenStorage.savePhoneNumber(phoneToSave)
                    println("📱 [OtpVerification] Saved phone number: $phoneToSave")
                    _uiState.value = OtpVerificationUiState(isSuccess = true)
                }
                .onFailure { error ->
                    println("OtpVerificationViewModel: Failed to verify OTP: ${error.message}")
                    error.printStackTrace()
                    _uiState.value = OtpVerificationUiState(
                        errorMessage = error.message ?: "Invalid OTP"
                    )
                }
        }
    }
}

