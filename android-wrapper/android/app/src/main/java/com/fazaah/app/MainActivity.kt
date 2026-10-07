package com.fazaah.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.collectAsState
import com.fazaah.app.presentation.auth.AuthViewModel
import com.fazaah.app.presentation.catalog.CatalogShell
import com.fazaah.app.ui.FazaaTheme

class MainActivity : ComponentActivity() {
    private lateinit var container: AppContainer

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        container = AppContainer(this)
        setContent {
            FazaaTheme {
                FazaaNativeApp(container)
            }
        }
    }
}

@Composable
private fun FazaaNativeApp(container: AppContainer) {
    val token by container.sessionStore.token.collectAsState(initial = null)
    var resolvedRole by remember { mutableStateOf<com.fazaah.app.presentation.auth.UserRole?>(null) }
    var checkingSession by remember(token) { mutableStateOf(token != null) }

    LaunchedEffect(token) {
        if (token == null) {
            resolvedRole = null
            checkingSession = false
        } else {
            checkingSession = true
            resolvedRole = runCatching {
                val user = container.authRepository.currentUser()
                if (user.role == "provider") com.fazaah.app.presentation.auth.UserRole.PROVIDER
                else com.fazaah.app.presentation.auth.UserRole.CLIENT
            }.getOrDefault(com.fazaah.app.presentation.auth.UserRole.CLIENT)
            checkingSession = false
        }
    }

    if (checkingSession) {
        com.fazaah.app.ui.components.BrandLoadingScreen()
    } else if (token != null && resolvedRole != null) {
        CatalogShell(
            catalogRepository = container.catalogRepository,
            authRepository = container.authRepository,
            subscriptionRepository = container.subscriptionRepository,
            role = resolvedRole!!,
            onLogout = { resolvedRole = null },
        )
    } else {
        val authViewModel: AuthViewModel = androidx.lifecycle.viewmodel.compose.viewModel(
            factory = AuthViewModel.factory(container.authRepository),
        )
        com.fazaah.app.presentation.auth.AuthFlow(
            viewModel = authViewModel,
            onAuthenticated = { role -> resolvedRole = role },
        )
    }
}
