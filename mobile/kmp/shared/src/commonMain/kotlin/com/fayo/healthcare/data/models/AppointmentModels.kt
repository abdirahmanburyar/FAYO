package com.fayo.healthcare.data.models

import kotlinx.serialization.Serializable

@Serializable
data class AppointmentDto(
    val id: String,
    val appointmentNumber: Int,
    val patientId: String,
    val doctorId: String,
    val hospitalId: String? = null,
    val specialtyId: String? = null,
    val appointmentDate: String,
    val appointmentTime: String,
    val duration: Int,
    val status: String,
    val consultationType: String,
    val reason: String? = null,
    val description: String? = null,
    val consultationFee: Int,
    val paymentStatus: String,
    val createdAt: String,
    val updatedAt: String
)

@Serializable
data class CreateAppointmentRequest(
    val patientId: String,
    val doctorId: String,
    val hospitalId: String? = null,
    val specialtyId: String? = null,
    val appointmentDate: String,
    val appointmentTime: String,
    val duration: Int = 30,
    val consultationType: String = "IN_PERSON",
    val reason: String? = null,
    val description: String? = null,
    val createdBy: String  // Required field - no default value to ensure it's always serialized
)

// Call-related models
@Serializable
data class CallInvitationDto(
    val appointmentId: String,
    val patientId: String,
    val channelName: String,
    val callSession: CallSessionDto? = null,
    val credentials: CallCredentialsDto? = null,
    val timestamp: String? = null
)

@Serializable
data class CallSessionDto(
    val id: String,
    val appointmentId: String,
    val channelName: String,
    val status: String,
    val createdAt: String? = null
)

@Serializable
data class CallCredentialsDto(
    val appId: String,
    val token: String,
    val channelName: String,
    val uid: String, // Can be number as string or string UID
    val role: String, // HOST or AUDIENCE
    val expiresAt: String? = null,
    val expiresIn: Int? = null
)

@Serializable
data class CallInvitationMessage(
    val type: String,
    val appointmentId: String? = null,
    val patientId: String? = null,
    val channelName: String? = null,
    val callSession: CallSessionDto? = null,
    val credentials: CallCredentialsWrapper? = null, // Can be object with host/participant or direct
    val timestamp: String? = null
)

@Serializable
data class CallCredentialsWrapper(
    val host: CallCredentialsDto? = null,
    val participant: CallCredentialsDto? = null,
    // Direct credential fields (if not nested)
    val appId: String? = null,
    val token: String? = null,
    val channelName: String? = null,
    val uid: String? = null,
    val role: String? = null,
    val expiresAt: String? = null,
    val expiresIn: Int? = null
) {
    // Helper to get participant credentials
    fun getParticipantCredentials(): CallCredentialsDto? {
        return participant ?: if (token != null && appId != null) {
            // Smart cast: token and appId are non-null here
            CallCredentialsDto(
                appId = appId,
                token = token,
                channelName = channelName ?: "", // Will be set from message
                uid = uid ?: "0",
                role = role ?: "AUDIENCE",
                expiresAt = expiresAt,
                expiresIn = expiresIn
            )
        } else null
    }
}

sealed class CallInvitationEvent {
    data class InvitationReceived(val invitation: CallInvitationDto) : CallInvitationEvent()
    data class CallEnded(val sessionId: String, val appointmentId: String) : CallInvitationEvent()
}

