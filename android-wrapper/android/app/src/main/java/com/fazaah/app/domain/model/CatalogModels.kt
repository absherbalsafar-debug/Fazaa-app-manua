package com.fazaah.app.domain.model

data class Category(
    val id: Int,
    val name: String,
    val icon: String? = null,
    val providerCount: Int = 0,
    val specialties: List<String> = emptyList(),
)

data class ProviderSummary(
    val id: Int,
    val name: String,
    val phone: String = "",
    val categoryName: String = "مقدم خدمة",
    val categoryIcon: String? = null,
    val specialty: String = "",
    val bio: String = "",
    val city: String = "",
    val district: String = "",
    val rating: Double = 0.0,
    val reviewCount: Int = 0,
    val yearsExperience: Int = 0,
    val isVerified: Boolean = false,
    val isAvailable: Boolean = false,
    val distanceKm: Double? = null,
    val isFavorited: Boolean = false,
)

data class ProvidersPage(
    val providers: List<ProviderSummary> = emptyList(),
    val total: Int = 0,
    val page: Int = 1,
    val limit: Int = 20,
)
