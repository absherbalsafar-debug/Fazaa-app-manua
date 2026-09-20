package com.fazaah.app

import android.content.Context
import com.fazaah.app.data.api.ApiModule
import com.fazaah.app.data.local.SessionStore
import com.fazaah.app.data.repository.CatalogRepository
import com.fazaah.app.data.repository.AuthRepository

class AppContainer(context: Context) {
    private val applicationContext = context.applicationContext
    val sessionStore = SessionStore(applicationContext)
    val api = ApiModule.createApi(sessionStore)
    val authRepository = AuthRepository(api, sessionStore)
    val catalogRepository = CatalogRepository(api)
}
