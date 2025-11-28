package com.fayo.healthcare.data.repositories

import com.fayo.healthcare.data.api.ApiClient
import com.fayo.healthcare.data.api.TokenStorage
import com.fayo.healthcare.data.models.VerifyOtpResponse
import com.fayo.healthcare.domain.repositories.AuthRepository

class AuthRepositoryImpl(
    private val apiClient: ApiClient,
    private val tokenStorage: TokenStorage
) : AuthRepository {
    
    override suspend fun sendOtp(phone: String): Result<Unit> {
        return apiClient.sendOtp(phone).map { }
    }
    
    override suspend fun verifyOtp(phone: String, otp: String): Result<VerifyOtpResponse> {
        return apiClient.verifyOtp(phone, otp).onSuccess { response ->
            tokenStorage.saveToken(response.accessToken)
        }
    }
    
    override fun isAuthenticated(): Boolean {
        return tokenStorage.getToken() != null
    }
    
    override fun logout() {
        tokenStorage.clearToken()
    }
}

