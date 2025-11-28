package com.fayo.healthcare.di

import com.fayo.healthcare.ui.screens.*
import com.fayo.healthcare.ui.screens.hospitals.HospitalDetailsViewModel
import com.fayo.healthcare.ui.screens.hospitals.HospitalsViewModel
import com.fayo.healthcare.ui.screens.home.HomeViewModel
import org.koin.androidx.viewmodel.dsl.viewModel
import org.koin.dsl.module

val viewModelModule = module {
    viewModel { LoginViewModel(get()) }
    viewModel { OtpVerificationViewModel(get(), get<com.fayo.healthcare.data.storage.AndroidTokenStorage>()) }
    viewModel { HomeViewModel(get(), get<com.fayo.healthcare.data.storage.AndroidTokenStorage>()) }
    viewModel { HospitalsViewModel() }
    viewModel { (hospitalId: String) -> HospitalDetailsViewModel(hospitalId) }
    viewModel { AppointmentsViewModel(get<com.fayo.healthcare.data.storage.AndroidTokenStorage>()) }
    viewModel { ProfileViewModel(get()) }
}
