package com.fazaah.app.data.api

import com.fazaah.app.domain.model.AuthUser
import com.fazaah.app.domain.model.Category
import com.fazaah.app.domain.model.ProvidersPage
import com.fazaah.app.domain.model.ProviderSummary
import com.fazaah.app.domain.model.SendOtpRequest
import com.fazaah.app.domain.model.SendOtpResponse
import com.fazaah.app.domain.model.VerifyOtpRequest
import com.fazaah.app.domain.model.VerifyOtpResponse
import com.fazaah.app.domain.model.UpdateProfileRequest
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.PATCH
import retrofit2.http.Path
import retrofit2.http.Query

interface FazaaApi {
    @POST("auth/send-otp")
    suspend fun sendOtp(@Body request: SendOtpRequest): SendOtpResponse

    @POST("auth/verify-otp")
    suspend fun verifyOtp(@Body request: VerifyOtpRequest): VerifyOtpResponse

    @GET("auth/me")
    suspend fun currentUser(): AuthUser

    @PATCH("auth/me")
    suspend fun updateProfile(@Body request: UpdateProfileRequest): AuthUser

    @POST("auth/logout-all")
    suspend fun logoutAll()

    @GET("categories")
    suspend fun categories(): List<Category>

    @GET("providers")
    suspend fun providers(
        @Query("categoryId") categoryId: Int? = null,
        @Query("search") search: String? = null,
        @Query("specialty") specialty: String? = null,
        @Query("city") city: String? = null,
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 50,
    ): ProvidersPage

    @GET("providers/{id}")
    suspend fun provider(@Path("id") id: Int): ProviderSummary
}
