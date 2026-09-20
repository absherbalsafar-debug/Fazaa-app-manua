package com.fazaah.app.presentation.auth

enum class AuthStep { PHONE, OTP, PROFILE, HOME }

enum class UserRole(val apiValue: String) { CLIENT("client"), PROVIDER("provider") }

data class AuthUiState(
    val step: AuthStep = AuthStep.PHONE,
    val role: UserRole = UserRole.CLIENT,
    val phone: String = "",
    val code: String = "",
    val name: String = "",
    val latitude: String = "",
    val longitude: String = "",
    val whatsapp: String = "",
    val categoryId: Int? = null,
    val specialty: String = "",
    val bio: String = "",
    val selfieBase64: String? = null,
    val idFrontBase64: String? = null,
    val idBackBase64: String? = null,
    val developmentOtp: String? = null,
    val loading: Boolean = false,
    val message: String? = null,
)
