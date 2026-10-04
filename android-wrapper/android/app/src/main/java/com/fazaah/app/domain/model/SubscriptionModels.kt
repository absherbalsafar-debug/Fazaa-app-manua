package com.fazaah.app.domain.model

data class SubscriptionPlan(
    val id: String,
    val title: String,
    val days: Int,
    val amount: Int,
    val description: String,
)

data class SubscriptionPlansResponse(val plans: List<SubscriptionPlan> = emptyList())

data class SubscriptionPaymentSummary(
    val id: Int,
    val status: String,
    val plan: String,
)

data class ProviderSubscriptionStatus(
    val approved: Boolean,
    val plan: String? = null,
    val expiresAt: String? = null,
    val active: Boolean,
    val payments: List<SubscriptionPaymentSummary> = emptyList(),
)

data class SubscriptionCheckoutRequest(val plan: String)

data class SubscriptionCheckoutResponse(
    val success: Boolean,
    val paymentId: Int? = null,
    val status: String,
    val message: String,
)
