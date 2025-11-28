package com.fayo.healthcare.data.api

import io.ktor.client.*
import io.ktor.client.engine.okhttp.*
import io.ktor.client.plugins.contentnegotiation.*
import io.ktor.client.plugins.logging.*
import io.ktor.client.plugins.websocket.*
import io.ktor.serialization.kotlinx.json.*
import kotlinx.serialization.json.Json

actual fun createHttpClient(): HttpClient = HttpClient(OkHttp) {
    engine {
        config {
            // Configure OkHttp for better WebSocket support
            followRedirects(true)
            followSslRedirects(true)
            
            // SSL/TLS Configuration for HTTPS
            // Note: For production, consider implementing certificate pinning
            // For development with self-signed certificates, you may need to add custom trust manager
        }
    }
    install(WebSockets) {
        // WebSocket configuration
        maxFrameSize = Long.MAX_VALUE
        pingInterval = 30_000 // 30 seconds
    }
    install(ContentNegotiation) {
        json(Json {
            ignoreUnknownKeys = true
            isLenient = true
            encodeDefaults = true  // Include default values in serialization (required for createdBy field)
        })
    }
    install(Logging) {
        level = LogLevel.INFO
    }
}

