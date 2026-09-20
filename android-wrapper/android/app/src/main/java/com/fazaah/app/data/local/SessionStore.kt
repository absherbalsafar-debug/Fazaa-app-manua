package com.fazaah.app.data.local

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

private val Context.sessionDataStore by preferencesDataStore(name = "fazaah_session")

class SessionStore(private val context: Context) {
    private val tokenKey = stringPreferencesKey("auth_token")
    @Volatile var currentToken: String? = null
        private set

    val token: Flow<String?> = context.sessionDataStore.data.map { preferences ->
        preferences[tokenKey].also { currentToken = it }
    }

    suspend fun saveToken(token: String) {
        currentToken = token
        context.sessionDataStore.edit { it[tokenKey] = token }
    }

    suspend fun clear() {
        currentToken = null
        context.sessionDataStore.edit { it.remove(tokenKey) }
    }
}
