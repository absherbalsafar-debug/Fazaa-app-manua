package com.fazaah.app.data.repository

import com.fazaah.app.data.api.FazaaApi
import com.fazaah.app.domain.model.ProviderSubscriptionStatus
import com.fazaah.app.domain.model.SubscriptionCheckoutRequest
import com.fazaah.app.domain.model.SubscriptionCheckoutResponse
import com.fazaah.app.domain.model.SubscriptionPlansResponse

class SubscriptionRepository(private val api: FazaaApi) {
    suspend fun plans(): SubscriptionPlansResponse = api.subscriptionPlans()
    suspend fun status(): ProviderSubscriptionStatus = api.providerSubscription()
    suspend fun checkout(request: SubscriptionCheckoutRequest): SubscriptionCheckoutResponse = api.subscriptionCheckout(request)
}
