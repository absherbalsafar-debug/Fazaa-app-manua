package com.fazaah.app.data.repository

import com.fazaah.app.data.api.FazaaApi
import com.fazaah.app.domain.model.Category
import com.fazaah.app.domain.model.ProvidersPage

class CatalogRepository(private val api: FazaaApi) {
    suspend fun categories(): List<Category> = api.categories()

    suspend fun providers(
        categoryId: Int? = null,
        search: String? = null,
        specialty: String? = null,
        city: String? = null,
    ): ProvidersPage = api.providers(categoryId, search, specialty, city)

    suspend fun provider(id: Int) = api.provider(id)
}
