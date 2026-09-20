package com.fazaah.app.domain.model

data class SendOtpRequest(
    val phone: String,
    val role: String,
    val mode: String,
)

data class SendOtpResponse(
    val otp: String? = null,
    val expiresInSeconds: Int? = null,
)

data class VerifyOtpRequest(
    val phone: String,
    val code: String,
    val name: String? = null,
    val role: String,
    val mode: String,
    val latitude: Double? = null,
    val longitude: Double? = null,
    val city: String? = null,
    val governorate: String? = null,
    val district: String? = null,
    val whatsapp: String? = null,
    val categoryId: Int? = null,
    val specialty: String? = null,
    val bio: String? = null,
    val yearsExperience: Int? = null,
    val termsAccepted: Boolean = false,
)

data class AuthUser(
    val id: Int? = null,
    val name: String? = null,
    val phone: String? = null,
    val role: String? = null,
    val status: String? = null,
    val city: String? = null,
    val governorate: String? = null,
    val district: String? = null,
    val whatsapp: String? = null,
)

data class UpdateProfileRequest(
    val name: String? = null,
    val city: String? = null,
    val governorate: String? = null,
    val district: String? = null,
    val whatsapp: String? = null,
)

data class VerificationDocumentRequest(
    val type: String,
    val originalName: String,
    val contentType: String = "image/jpeg",
    val dataBase64: String,
)

data class VerifyOtpResponse(
    val token: String? = null,
    val user: AuthUser? = null,
    val needsRegistration: Boolean = false,
)
