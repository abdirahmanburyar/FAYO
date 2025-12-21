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
        
        // Unified API Service URL (all services now on port 3001)
        val apiBaseUrl = "$protocol://$baseHost:3001/api/v1"
        
        // All services now use the unified API service
        val userBaseUrl = apiBaseUrl
        val hospitalBaseUrl = apiBaseUrl
        val appointmentBaseUrl = apiBaseUrl
        val doctorBaseUrl = apiBaseUrl
        val paymentBaseUrl = apiBaseUrl
        val adsBaseUrl = apiBaseUrl
        
        println("🔐 [AppModule] Using ${if (useHttps) "HTTPS" else "HTTP"} for API connections")
        println("🔐 [AppModule] Unified API Service: $apiBaseUrl")
        
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

