package com.fayo.healthcare.ui.screens

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.fayo.healthcare.domain.usecases.SendOtpUseCase
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class LoginUiState(
    val isLoading: Boolean = false,
    val isSuccess: Boolean = false,
    val errorMessage: String? = null
)

class LoginViewModel(
    private val sendOtpUseCase: SendOtpUseCase
) : ViewModel() {
    
    private val _uiState = MutableStateFlow(LoginUiState())
    val uiState: StateFlow<LoginUiState> = _uiState.asStateFlow()
    
    fun sendOtp(phone: String) {
        println("🔐 [LoginViewModel] Sending OTP to $phone")
        viewModelScope.launch {
            _uiState.value = LoginUiState(isLoading = true, errorMessage = null)
            sendOtpUseCase(phone)
                .onSuccess {
                    println("✅ [LoginViewModel] OTP sent successfully")
                    _uiState.value = LoginUiState(isSuccess = true)
                }
                .onFailure { error ->
                    println("❌ [LoginViewModel] Failed to send OTP: ${error.message}")
                    println("❌ [LoginViewModel] Error type: ${error::class.simpleName}")
                    error.printStackTrace()
                    
                    // Provide user-friendly error messages
                    val errorMessage = when {
                        error.message?.contains("SSL", ignoreCase = true) == true ||
                        error.message?.contains("certificate", ignoreCase = true) == true ||
                        error.message?.contains("handshake", ignoreCase = true) == true -> {
                            "SSL connection error. Please check server certificate configuration."
                        }
                        error.message?.contains("timeout", ignoreCase = true) == true ||
                        error.message?.contains("connection", ignoreCase = true) == true -> {
                            "Connection timeout. Please check your internet connection and try again."
                        }
                        error.message?.contains("404", ignoreCase = true) == true -> {
                            "Server endpoint not found. Please check API configuration."
                        }
                        error.message?.contains("500", ignoreCase = true) == true -> {
                            "Server error. Please try again later."
                        }
                        else -> {
                            error.message ?: "Failed to send OTP. Please try again."
                        }
                    }
                    
                    _uiState.value = LoginUiState(
                        errorMessage = errorMessage
                    )
                }
        }
    }
}

