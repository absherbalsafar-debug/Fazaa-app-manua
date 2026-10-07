package com.fazaah.app.domain.model

data class SubscriptionPlan(
    val id: Int? = null,
    val name: String? = null,
    val price: Double? = null,
    val durationDays: Int? = null,
    val description: String? = null,
)

data class SubscriptionPlansResponse(val plans: List<SubscriptionPlan> = emptyList())
data class ProviderSubscriptionStatus(val active: Boolean = false, val plan: SubscriptionPlan? = null, val expiresAt: String? = null)
data class SubscriptionCheckoutRequest(val planId: Int, val successUrl: String? = null, val cancelUrl: String? = null)
data class SubscriptionCheckoutResponse(val checkoutUrl: String? = null, val sessionId: String? = null)
