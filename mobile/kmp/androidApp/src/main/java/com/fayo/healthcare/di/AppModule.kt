package com.fayo.healthcare.di

import android.content.Context
import com.fayo.healthcare.data.api.ApiClient
import com.fayo.healthcare.data.api.TokenStorage
import com.fayo.healthcare.data.repositories.AuthRepositoryImpl
import com.fayo.healthcare.data.services.AndroidAgoraVideoService
import com.fayo.healthcare.data.services.AgoraVideoService
import com.fayo.healthcare.data.storage.AndroidTokenStorage
import com.fayo.healthcare.domain.repositories.AuthRepository
import com.fayo.healthcare.domain.usecases.SendOtpUseCase
import com.fayo.healthcare.domain.usecases.VerifyOtpUseCase
import org.koin.android.ext.koin.androidContext
import org.koin.dsl.module

val appModule = module {
    includes(viewModelModule)
    // API Configuration
    single {
        // IMPORTANT: Agora RTC SDK works with both HTTP and HTTPS
        // For production, use HTTPS URLs
        // For development with local server, you may need to use HTTP (not recommended for Zoom SDK)
        
        // Configuration: Set to true for production (HTTPS), false for development (HTTP)
        // TODO: Change to true when deploying to production with HTTPS
        val useHttps = false // Set to true for production with HTTPS
        
        // Server configuration
        val baseHost = "72.62.51.50" // Production server IP
        val protocol = if (useHttps) "https" else "http"
        
        // For production with HTTPS, you might use a domain name instead of IP
        // Example: val baseHost = "api.yourdomain.com"
        
        val userBaseUrl = "$protocol://$baseHost:3001/api/v1"
        val hospitalBaseUrl = "$protocol://$baseHost:3002/api/v1"
        val appointmentBaseUrl = "$protocol://$baseHost:3005/api/v1"
        val doctorBaseUrl = "$protocol://$baseHost:3003"
        val paymentBaseUrl = "$protocol://$baseHost:3006/api/v1"
        val adsBaseUrl = "$protocol://$baseHost:3007/api/v1"
        
        println("🔐 [AppModule] Using ${if (useHttps) "HTTPS" else "HTTP"} for API connections")
        println("🔐 [AppModule] Base URLs: user=$userBaseUrl, hospital=$hospitalBaseUrl, appointment=$appointmentBaseUrl, payment=$paymentBaseUrl, ads=$adsBaseUrl")
        
        ApiClient(
            userBaseUrl = userBaseUrl,
            hospitalBaseUrl = hospitalBaseUrl,
            appointmentBaseUrl = appointmentBaseUrl,
            doctorBaseUrl = doctorBaseUrl,
            paymentBaseUrl = paymentBaseUrl,
            adsBaseUrl = adsBaseUrl,
            tokenStorage = get()
        )
    }
    
    // Storage
    single { AndroidTokenStorage(androidContext()) }
    single<TokenStorage> { get<AndroidTokenStorage>() }
    
    // Repositories
    single<AuthRepository> { AuthRepositoryImpl(get(), get()) }
    
    // Use Cases
    factory { SendOtpUseCase(get()) }
    factory { VerifyOtpUseCase(get()) }
    
    // Agora Video Service
    factory<AgoraVideoService> { AndroidAgoraVideoService(androidContext()) }
}

