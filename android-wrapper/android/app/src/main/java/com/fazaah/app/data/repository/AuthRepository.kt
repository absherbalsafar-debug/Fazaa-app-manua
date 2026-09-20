package com.fazaah.app.data.repository

import com.fazaah.app.data.api.FazaaApi
import com.fazaah.app.data.local.SessionStore
import com.fazaah.app.domain.model.SendOtpRequest
import com.fazaah.app.domain.model.SendOtpResponse
import com.fazaah.app.domain.model.VerifyOtpRequest
import com.fazaah.app.domain.model.VerifyOtpResponse

class AuthRepository(
    private val api: FazaaApi,
    private val sessionStore: SessionStore,
) {
    suspend fun sendOtp(phone: String, role: String, mode: String): SendOtpResponse =
        api.sendOtp(SendOtpRequest(phone = phone, role = role, mode = mode))

    suspend fun verifyOtp(request: VerifyOtpRequest): VerifyOtpResponse =
        api.verifyOtp(request).also { response ->
            response.token?.takeIf { it.isNotBlank() }?.let { sessionStore.saveToken(it) }
        }

    suspend fun logout() {
        runCatching { api.logoutAll() }
        sessionStore.clear()
    }
}
