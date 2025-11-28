package com.fayo.healthcare.domain.usecases

import com.fayo.healthcare.data.models.VerifyOtpResponse
import com.fayo.healthcare.domain.repositories.AuthRepository

class VerifyOtpUseCase(
    private val authRepository: AuthRepository
) {
    suspend operator fun invoke(phone: String, otp: String): Result<VerifyOtpResponse> {
        return authRepository.verifyOtp(phone, otp)
    }
}

