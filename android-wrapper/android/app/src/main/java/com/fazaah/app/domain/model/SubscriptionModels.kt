package com.fazaah.app.domain.model

data class SubscriptionPlan(
    val id: String? = null,
    val name: String? = null,
    val title: String? = null,
    val amount: Double? = null,
    val monthlyPrice: Double? = null,
    val yearlyPrice: Double? = null,
    val days: Int? = null,
    val description: String? = null,
)

data class ProviderSubscriptionStatus(
    val approved: Boolean = false,
    val active: Boolean = false,
    val plan: String? = null,
    val expiresAt: String? = null,
)
data class SubscriptionCheckoutRequest(val plan: String, val receiptUrl: String? = null)
data class SubscriptionCheckoutResponse(val success: Boolean = false, val status: String? = null, val message: String? = null, val paymentId: Int? = null)
