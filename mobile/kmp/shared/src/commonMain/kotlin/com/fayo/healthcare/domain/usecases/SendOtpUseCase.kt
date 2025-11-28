package com.fayo.healthcare.domain.usecases

import com.fayo.healthcare.domain.repositories.AuthRepository

class SendOtpUseCase(
    private val authRepository: AuthRepository
) {
    suspend operator fun invoke(phone: String): Result<Unit> {
        return authRepository.sendOtp(phone)
    }
}

