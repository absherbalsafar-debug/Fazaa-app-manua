package com.fazaah.app.data.api

import com.fazaah.app.domain.model.AuthUser
import com.fazaah.app.domain.model.SendOtpRequest
import com.fazaah.app.domain.model.SendOtpResponse
import com.fazaah.app.domain.model.VerifyOtpRequest
import com.fazaah.app.domain.model.VerifyOtpResponse
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST

interface FazaaApi {
    @POST("auth/send-otp")
    suspend fun sendOtp(@Body request: SendOtpRequest): SendOtpResponse

    @POST("auth/verify-otp")
    suspend fun verifyOtp(@Body request: VerifyOtpRequest): VerifyOtpResponse

    @GET("auth/me")
    suspend fun currentUser(): AuthUser

    @POST("auth/logout-all")
    suspend fun logoutAll()
}
