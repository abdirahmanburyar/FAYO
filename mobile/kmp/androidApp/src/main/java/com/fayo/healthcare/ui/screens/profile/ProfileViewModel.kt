package com.fayo.healthcare.ui.screens

import androidx.lifecycle.ViewModel
import com.fayo.healthcare.domain.repositories.AuthRepository

class ProfileViewModel(
    private val authRepository: AuthRepository
) : ViewModel() {

    fun logout() {
        authRepository.logout()
    }
}


