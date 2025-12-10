package com.fayo.healthcare.data.models

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
enum class AdStatus {
    INACTIVE,
    PUBLISHED
}

@Serializable
data class AdDto(
    val id: String,
    val company: String, // Company or person name
    val image: String, // Image path
    @SerialName("startDate")
    val startDate: String,
    @SerialName("endDate")
    val endDate: String,
    val range: Int, // Number of days
    val status: AdStatus = AdStatus.INACTIVE,
    @SerialName("clickCount")
    val clickCount: Int = 0,
    @SerialName("viewCount")
    val viewCount: Int = 0,
    @SerialName("createdBy")
    val createdBy: String? = null,
    @SerialName("createdAt")
    val createdAt: String? = null,
    @SerialName("updatedAt")
    val updatedAt: String? = null
)

@Serializable
data class AdUpdateEvent(
    val type: String, // "ad.created", "ad.updated", "ad.deleted", "ad.clicked"
    val ad: AdDto? = null,
    @SerialName("adId")
    val adId: String? = null,
    val timestamp: String? = null
)

