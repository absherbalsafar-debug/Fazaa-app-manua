package com.fazaah.app.domain.model

enum class RequestStatus { pending, accepted, rejected, in_progress, completed, cancelled }

data class ServiceRequest(
    val id: Int,
    val clientId: Int,
    val clientName: String? = null,
    val clientAvatarUrl: String? = null,
    val providerId: Int,
    val providerName: String? = null,
    val providerAvatarUrl: String? = null,
    val providerCategoryName: String? = null,
    val status: String,
    val serviceType: String,
    val description: String,
    val city: String,
    val district: String,
    val lat: Double? = null,
    val lng: Double? = null,
    val scheduledAt: String? = null,
    val completedAt: String? = null,
    val isImmediate: Boolean = true,
    val createdAt: String? = null,
)

data class ServiceRequestInput(
    val providerId: Int,
    val serviceType: String,
    val description: String,
    val city: String,
    val district: String,
    val lat: Double? = null,
    val lng: Double? = null,
    val scheduledAt: String? = null,
    val isImmediate: Boolean,
)

data class ServiceRequestUpdate(val status: String)

data class AppNotification(
    val id: Int,
    val userId: Int,
    val type: String,
    val title: String,
    val body: String,
    val isRead: Boolean,
    val relatedId: Int? = null,
    val createdAt: String,
)

data class SuccessResult(val success: Boolean, val message: String? = null)

data class Review(
    val id: Int,
    val clientId: Int,
    val clientName: String? = null,
    val clientAvatarUrl: String? = null,
    val providerId: Int,
    val requestId: Int? = null,
    val rating: Double,
    val comment: String? = null,
    val createdAt: String,
)
