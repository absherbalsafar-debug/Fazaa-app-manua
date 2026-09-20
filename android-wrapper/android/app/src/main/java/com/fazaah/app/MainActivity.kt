package com.fazaah.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.fazaah.app.presentation.auth.AuthStep
import com.fazaah.app.presentation.auth.AuthUiState
import com.fazaah.app.presentation.auth.AuthViewModel
import com.fazaah.app.presentation.auth.UserRole
import com.fazaah.app.presentation.catalog.CatalogShell

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val container = AppContainer(applicationContext)
        setContent {
            androidx.compose.runtime.CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Rtl) {
                MaterialTheme {
                    Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
                        FazaahAuthScreen(container)
                    }
                }
            }
        }
    }
}

@Composable
private fun FazaahAuthScreen(container: AppContainer) {
    val viewModel: AuthViewModel = viewModel(factory = AuthViewModel.factory(container.authRepository))
    val state by viewModel.uiState.collectAsStateWithLifecycle()

    Column(
        modifier = Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        if (state.step != AuthStep.PHONE && state.step != AuthStep.HOME) {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.Start) {
                IconButton(onClick = viewModel::goBack) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "رجوع")
                }
            }
        }

        Icon(Icons.Default.Phone, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
        Spacer(Modifier.height(16.dp))
        Text("فزعة FAZAAH", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold)
        Text(
            when (state.step) {
                AuthStep.PHONE -> "تطبيق Android أصلي بـ Kotlin"
                AuthStep.OTP -> "تحقق من هاتفك"
                AuthStep.PROFILE -> "أكمل بياناتك"
                AuthStep.HOME -> "مرحبًا بك في فزعة"
            },
            style = MaterialTheme.typography.bodyLarge,
        )
        Spacer(Modifier.height(28.dp))

        when (state.step) {
            AuthStep.PHONE -> PhoneStep(state, viewModel)
            AuthStep.OTP -> OtpStep(state, viewModel)
            AuthStep.PROFILE -> ProfileStep(state, viewModel)
            AuthStep.HOME -> HomeStep(container, viewModel)
        }

        state.message?.let {
            Spacer(Modifier.height(16.dp))
            Text(it, color = MaterialTheme.colorScheme.error)
        }
    }
}

@Composable
private fun PhoneStep(state: AuthUiState, viewModel: AuthViewModel) {
    Text("كيف ستستخدم فزعة؟", fontWeight = FontWeight.Bold)
    Spacer(Modifier.height(10.dp))
    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        FilterChip(selected = state.role == UserRole.CLIENT, onClick = { viewModel.setRole(UserRole.CLIENT) }, label = { Text("أبحث عن خدمة") })
        FilterChip(selected = state.role == UserRole.PROVIDER, onClick = { viewModel.setRole(UserRole.PROVIDER) }, label = { Text("أقدم خدمة") })
    }
    Spacer(Modifier.height(18.dp))
    OutlinedTextField(state.phone, viewModel::setPhone, label = { Text("رقم الهاتف") }, placeholder = { Text("7XXXXXXXX") }, singleLine = true, modifier = Modifier.fillMaxWidth())
    Spacer(Modifier.height(16.dp))
    Button(enabled = !state.loading && state.phone.length >= 9, onClick = viewModel::sendOtp, modifier = Modifier.fillMaxWidth()) {
        if (state.loading) CircularProgressIndicator(modifier = Modifier.width(20.dp).height(20.dp)) else Text("إرسال رمز التحقق")
    }
}

@Composable
private fun OtpStep(state: AuthUiState, viewModel: AuthViewModel) {
    Text("أدخل الرمز المكون من 6 أرقام")
    Spacer(Modifier.height(12.dp))
    OutlinedTextField(state.code, viewModel::setCode, label = { Text("رمز التحقق") }, singleLine = true, modifier = Modifier.fillMaxWidth())
    state.developmentOtp?.let { otp ->
        Spacer(Modifier.height(12.dp))
        Card(modifier = Modifier.fillMaxWidth()) { Text("رمز التطوير: $otp", modifier = Modifier.padding(16.dp), fontWeight = FontWeight.Bold) }
    }
    Spacer(Modifier.height(16.dp))
    Button(enabled = !state.loading && state.code.length == 6, onClick = viewModel::verifyLogin, modifier = Modifier.fillMaxWidth()) { Text("تحقق ودخول") }
    TextButton(onClick = viewModel::resetToPhone) { Text("تغيير رقم الهاتف") }
}

@Composable
private fun ProfileStep(state: AuthUiState, viewModel: AuthViewModel) {
    Text("أدخل بياناتك لإكمال إنشاء الحساب")
    Spacer(Modifier.height(12.dp))
    OutlinedTextField(state.name, viewModel::setName, label = { Text("الاسم الرباعي") }, singleLine = true, modifier = Modifier.fillMaxWidth())
    if (state.role == UserRole.CLIENT) {
        Spacer(Modifier.height(10.dp))
        OutlinedTextField(state.latitude, viewModel::setLatitude, label = { Text("خط العرض") }, singleLine = true, modifier = Modifier.fillMaxWidth())
        Spacer(Modifier.height(10.dp))
        OutlinedTextField(state.longitude, viewModel::setLongitude, label = { Text("خط الطول") }, singleLine = true, modifier = Modifier.fillMaxWidth())
    }
    Spacer(Modifier.height(16.dp))
    Button(enabled = !state.loading && state.name.trim().split(" ").filter(String::isNotBlank).size >= 4, onClick = viewModel::completeProfile, modifier = Modifier.fillMaxWidth()) { Text("إكمال التسجيل") }
}

@Composable
private fun HomeStep(container: AppContainer, viewModel: AuthViewModel) {
    CatalogShell(container.catalogRepository, onLogout = viewModel::logout)
}
