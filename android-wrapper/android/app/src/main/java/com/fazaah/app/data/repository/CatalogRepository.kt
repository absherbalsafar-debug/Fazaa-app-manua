package com.fazaah.app.data.repository

import com.fazaah.app.data.api.FazaaApi
import com.fazaah.app.domain.model.Category
import com.fazaah.app.domain.model.ProvidersPage
import com.fazaah.app.domain.model.ServiceRequest
import com.fazaah.app.domain.model.ServiceRequestInput
import com.fazaah.app.domain.model.ServiceRequestUpdate
import com.fazaah.app.domain.model.AppNotification
import com.fazaah.app.domain.model.ProviderUpdateRequest

class CatalogRepository(private val api: FazaaApi) {
    suspend fun categories(): List<Category> = api.categories()

    suspend fun providers(
        categoryId: Int? = null,
        search: String? = null,
        specialty: String? = null,
        city: String? = null,
    ): ProvidersPage = api.providers(categoryId, search, specialty, city)

    suspend fun provider(id: Int) = api.provider(id)
    suspend fun providerProfile() = api.providerProfile()
    suspend fun updateAvailability(id: Int, isAvailable: Boolean) = api.updateProvider(id, ProviderUpdateRequest(isAvailable))
    suspend fun favorites() = api.favorites()
    suspend fun addFavorite(providerId: Int) = api.addFavorite(providerId)
    suspend fun removeFavorite(providerId: Int) = api.removeFavorite(providerId)

    suspend fun requests(role: String): List<ServiceRequest> = api.requests(role)
    suspend fun createRequest(request: ServiceRequestInput): ServiceRequest = api.createRequest(request)
    suspend fun request(id: Int): ServiceRequest = api.request(id)
    suspend fun updateRequest(id: Int, request: ServiceRequestUpdate): ServiceRequest = api.updateRequest(id, request)
    suspend fun notifications(): List<AppNotification> = api.notifications()
    suspend fun markAllNotificationsRead() = api.markAllNotificationsRead()
}
