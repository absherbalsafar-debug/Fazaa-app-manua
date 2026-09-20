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
)

data class AuthUser(
    val id: Int? = null,
    val name: String? = null,
    val phone: String? = null,
    val role: String? = null,
    val status: String? = null,
)

data class VerifyOtpResponse(
    val token: String? = null,
    val user: AuthUser? = null,
    val needsRegistration: Boolean = false,
)
