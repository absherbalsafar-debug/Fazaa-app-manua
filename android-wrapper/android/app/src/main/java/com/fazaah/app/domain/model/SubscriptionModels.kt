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
data class ProviderBusinessSummary(
    val subscription: BusinessSubscription = BusinessSubscription(),
    val metrics: BusinessMetrics = BusinessMetrics(),
    val freeSlotsRemaining: Int = 0,
)
data class BusinessSubscription(val plan: String? = null, val status: String? = null, val freeSlotNumber: Int? = null, val endsAt: String? = null)
data class BusinessMetrics(val profileViews: Int = 0, val callClicks: Int = 0, val whatsappClicks: Int = 0, val serviceRequests: Int = 0)
data class Advertisement(val id: Int = 0, val providerId: Int = 0, val title: String = "", val description: String? = null, val city: String? = null, val plan: String? = null, val imageUrl: String? = null)
