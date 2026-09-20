package com.fazaah.app

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.location.LocationManager
import android.os.Bundle
import android.net.Uri
import android.util.Base64
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
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
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.compose.ui.graphics.Color
import androidx.compose.foundation.Image
import androidx.compose.ui.res.painterResource
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.core.content.ContextCompat
import com.fazaah.app.presentation.auth.AuthStep
import com.fazaah.app.presentation.auth.AuthUiState
import com.fazaah.app.presentation.auth.AuthViewModel
import com.fazaah.app.presentation.auth.UserRole
import com.fazaah.app.presentation.catalog.CatalogShell

private val FazaahColors = lightColorScheme(
    primary = Color(0xFF182D53),
    onPrimary = Color.White,
    secondary = Color(0xFFF0B046),
    onSecondary = Color(0xFF182D53),
    background = Color(0xFFF5F3EE),
    onBackground = Color(0xFF182D53),
    surface = Color.White,
    onSurface = Color(0xFF182D53),
    surfaceVariant = Color(0xFFEFECE5),
    onSurfaceVariant = Color(0xFF637087),
)

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val container = AppContainer(applicationContext)
        setContent {
            androidx.compose.runtime.CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Rtl) {
                MaterialTheme(colorScheme = FazaahColors) {
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

    if (state.step == AuthStep.HOME) {
        CatalogShell(container.catalogRepository, container.authRepository, onLogout = viewModel::logout)
        return
    }

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

        Image(painterResource(com.fazaah.app.R.drawable.fazaah_logo), contentDescription = "شعار فزعة", modifier = Modifier.height(106.dp))
        Spacer(Modifier.height(10.dp))
        Text("أهلاً وسهلاً بك في فزعة", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold)
        Text(
            when (state.step) {
                AuthStep.PHONE -> "خدماتك أقرب مما تتخيل"
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
            AuthStep.HOME -> Unit
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
    val context = LocalContext.current
    val selfiePicker = rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { uri -> uri?.let { viewModel.setSelfie(readImageBase64(context, it)) } }
    val frontPicker = rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { uri -> uri?.let { viewModel.setIdFront(readImageBase64(context, it)) } }
    val backPicker = rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { uri -> uri?.let { viewModel.setIdBack(readImageBase64(context, it)) } }
    val locationPermission = rememberLauncherForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) { updateLastLocation(context, viewModel) }

    Text("أدخل بياناتك لإكمال إنشاء الحساب")
    Spacer(Modifier.height(12.dp))
    OutlinedTextField(state.name, viewModel::setName, label = { Text("الاسم الرباعي") }, singleLine = true, modifier = Modifier.fillMaxWidth())
    if (state.role == UserRole.PROVIDER) {
        Spacer(Modifier.height(10.dp))
        OutlinedTextField(state.whatsapp, viewModel::setWhatsapp, label = { Text("رقم واتساب") }, placeholder = { Text("أدخل رقم الواتساب") }, singleLine = true, modifier = Modifier.fillMaxWidth())
        Spacer(Modifier.height(10.dp))
        OutlinedTextField(state.specialty, viewModel::setSpecialty, label = { Text("التخصص الدقيق") }, placeholder = { Text("مثال: صيانة تمديدات المياه") }, singleLine = true, modifier = Modifier.fillMaxWidth())
        Spacer(Modifier.height(10.dp))
        OutlinedTextField(state.bio, viewModel::setBio, label = { Text("وصف الخبرة والخدمة") }, minLines = 3, modifier = Modifier.fillMaxWidth())
        Spacer(Modifier.height(10.dp))
        Button(onClick = { locationPermission.launch(arrayOf(Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION)) }, modifier = Modifier.fillMaxWidth()) { Text(if (state.latitude.isNotBlank()) "تم تحديد الموقع بدقة" else "السماح بتحديد موقع العمل") }
        Text(if (state.latitude.isNotBlank()) "${state.latitude}, ${state.longitude}" else "الموقع الدقيق مطلوب لاعتماد المهني", color = MaterialTheme.colorScheme.onSurfaceVariant)
        DocumentButton("الصورة الشخصية", state.selfieBase64 != null) { selfiePicker.launch("image/*") }
        DocumentButton("صورة الهوية — الأمام", state.idFrontBase64 != null) { frontPicker.launch("image/*") }
        DocumentButton("صورة الهوية — الخلف", state.idBackBase64 != null) { backPicker.launch("image/*") }
    } else {
        Spacer(Modifier.height(10.dp))
        OutlinedTextField(state.latitude, viewModel::setLatitude, label = { Text("خط العرض") }, singleLine = true, modifier = Modifier.fillMaxWidth())
        Spacer(Modifier.height(10.dp))
        OutlinedTextField(state.longitude, viewModel::setLongitude, label = { Text("خط الطول") }, singleLine = true, modifier = Modifier.fillMaxWidth())
    }
    Spacer(Modifier.height(16.dp))
    Button(enabled = !state.loading && state.name.trim().split(" ").filter(String::isNotBlank).size >= 4, onClick = viewModel::completeProfile, modifier = Modifier.fillMaxWidth()) { Text(if (state.role == UserRole.PROVIDER) "إرسال طلب اعتماد المهني" else "إكمال التسجيل") }
}

@Composable
private fun DocumentButton(label: String, selected: Boolean, onClick: () -> Unit) {
    Button(onClick = onClick, modifier = Modifier.fillMaxWidth()) { Text(if (selected) "✓ $label — تم الإرفاق" else "إرفاق $label") }
}

private fun readImageBase64(context: Context, uri: Uri): String? = runCatching {
    context.contentResolver.openInputStream(uri)?.use { Base64.encodeToString(it.readBytes(), Base64.NO_WRAP) }
}.getOrNull()

private fun updateLastLocation(context: Context, viewModel: AuthViewModel) {
    val granted = ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED || ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED
    if (!granted) return
    val manager = context.getSystemService(Context.LOCATION_SERVICE) as LocationManager
    val location = runCatching { manager.getLastKnownLocation(LocationManager.GPS_PROVIDER) ?: manager.getLastKnownLocation(LocationManager.NETWORK_PROVIDER) }.getOrNull()
    location?.let { viewModel.setLatitude(it.latitude.toString()); viewModel.setLongitude(it.longitude.toString()) }
}
