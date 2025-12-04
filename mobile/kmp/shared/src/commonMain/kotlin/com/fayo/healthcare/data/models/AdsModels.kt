package com.fayo.healthcare.data.models

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
enum class AdStatus {
    ACTIVE,
    INACTIVE,
    PENDING,
    EXPIRED
}

@Serializable
enum class AdType {
    BANNER,
    CAROUSEL,
    INTERSTITIAL
}

@Serializable
data class AdDto(
    val id: String,
    val title: String,
    val description: String? = null,
    @SerialName("imageUrl")
    val imageUrl: String,
    @SerialName("linkUrl")
    val linkUrl: String? = null,
    val type: AdType = AdType.BANNER,
    val status: AdStatus = AdStatus.PENDING,
    @SerialName("startDate")
    val startDate: String,
    @SerialName("endDate")
    val endDate: String,
    val priority: Int = 0,
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

