package com.fazaah.app.data.repository

import com.fazaah.app.data.api.FazaaApi
import com.fazaah.app.domain.model.SubscriptionCheckoutRequest

class SubscriptionRepository(private val api: FazaaApi) {
    suspend fun plans() = api.subscriptionPlans().plans
    suspend fun status() = api.providerSubscription()
    suspend fun checkout(plan: String) = api.subscriptionCheckout(SubscriptionCheckoutRequest(plan))
}
