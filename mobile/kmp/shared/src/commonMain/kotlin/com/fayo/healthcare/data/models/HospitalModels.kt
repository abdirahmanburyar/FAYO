package com.fayo.healthcare.data.models

import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonElement

@Serializable
data class HospitalDto(
    val id: String,
    val name: String,
    val type: String,
    val address: String? = null,
    val city: String? = null,
    val phone: String? = null,
    val email: String? = null,
    val website: String? = null,
    val logoUrl: String? = null,
    val bookingPolicy: String? = "DIRECT_DOCTOR",
    val description: String? = null,
    val isActive: Boolean = true,
    val createdAt: String,
    val updatedAt: String,
    // Enriched fields
    val specialties: List<HospitalSpecialtyDto> = emptyList(),
    val services: List<HospitalServiceDto> = emptyList()
)

@Serializable
data class HospitalSpecialtyDto(
    val id: String,
    val hospitalId: String,
    val specialtyId: String,
    val name: String,
    val description: String? = null,
    val isActive: Boolean
)

@Serializable
data class HospitalServiceDto(
    val id: String,
    val hospitalId: String,
    val serviceId: String,
    val name: String,
    val description: String? = null,
    val isActive: Boolean
)

@Serializable
data class HospitalListResponse(
    val hospitals: List<HospitalDto>
)

@Serializable
data class WebSocketMessage(
    val type: String,
    val message: String? = null,
    val hospital: HospitalDto? = null,
    val hospitalId: String? = null,
    val timestamp: String? = null
)

@Serializable
data class HospitalDoctorDto(
    val id: String,
    val doctorId: String,
    val hospitalId: String,
    val role: String,
    val shift: String? = null,
    val startTime: String? = null,
    val endTime: String? = null,
    val consultationFee: Int? = null,
    val status: String,
    val joinedAt: String,
    val leftAt: String? = null,
    val doctor: DoctorDto? = null
)

@Serializable
data class DoctorDto(
    val id: String,
    val userId: String,
    val specialty: String = "General Practice", // Default value if missing
    val licenseNumber: String,
    val experience: Int,
    val isVerified: Boolean,
    val isAvailable: Boolean,
    val consultationFee: Int? = null,
    val bio: String? = null,
    val imageUrl: String? = null,
    val education: String? = null,
    val certifications: String? = null,
    val languages: String? = null,
    val awards: String? = null,
    val publications: String? = null,
    val memberships: String? = null,
    val researchInterests: String? = null,
    val user: DoctorUserDto? = null
)

@Serializable
data class DoctorUserDto(
    val id: String,
    val firstName: String,
    val lastName: String,
    val email: String,
    val phone: String? = null
)

sealed class HospitalUpdateEvent {
    data class Created(val hospital: HospitalDto) : HospitalUpdateEvent()
    data class Updated(val hospital: HospitalDto) : HospitalUpdateEvent()
    data class Deleted(val hospitalId: String) : HospitalUpdateEvent()
}
