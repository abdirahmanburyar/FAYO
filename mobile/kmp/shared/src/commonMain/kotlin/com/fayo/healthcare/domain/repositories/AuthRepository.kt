package com.fayo.healthcare.domain.repositories

import com.fayo.healthcare.data.models.VerifyOtpResponse

interface AuthRepository {
    suspend fun sendOtp(phone: String): Result<Unit>
    suspend fun verifyOtp(phone: String, otp: String): Result<VerifyOtpResponse>
    fun isAuthenticated(): Boolean
    fun logout()
}

