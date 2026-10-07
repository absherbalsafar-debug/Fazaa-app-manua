package com.fazaah.app.data.repository

import com.fazaah.app.data.api.FazaaApi
import com.fazaah.app.domain.model.ProviderSubscriptionStatus
import com.fazaah.app.domain.model.SubscriptionCheckoutRequest
import com.fazaah.app.domain.model.SubscriptionCheckoutResponse
import com.fazaah.app.domain.model.SubscriptionPlan

class SubscriptionRepository(private val api: FazaaApi) {
    suspend fun plans(): List<SubscriptionPlan> = api.subscriptionPlans()
    suspend fun status(): ProviderSubscriptionStatus = api.providerSubscription()
    suspend fun business() = api.providerBusiness()
    suspend fun checkout(request: SubscriptionCheckoutRequest): SubscriptionCheckoutResponse = api.subscriptionCheckout(request)
}
