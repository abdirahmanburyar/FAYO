package com.fayo.healthcare.data.models

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class SendOtpRequest(
    val phone: String
)

@Serializable
data class SendOtpResponse(
    val message: String,
    val expiresIn: Long? = null,
    val userCreated: Boolean? = null
) {
    // Computed property for backward compatibility
    val success: Boolean
        get() = true // If we get a response, it's successful
}

@Serializable
data class VerifyOtpRequest(
    val phone: String,
    val otp: String
)

@Serializable
data class VerifyOtpResponse(
    @SerialName("access_token")
    val accessToken: String,
    @SerialName("refresh_token")
    val refreshToken: String,
    val user: UserDto
)

@Serializable
data class UserDto(
    val id: String,
    val username: String? = null,
    val phone: String,
    val firstName: String? = null,
    val lastName: String? = null,
    val email: String? = null,
    val role: String,
    val userType: String? = null
)

