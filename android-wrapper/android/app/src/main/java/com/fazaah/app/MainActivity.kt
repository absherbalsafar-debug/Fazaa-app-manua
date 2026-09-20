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
import androidx.compose.foundation.layout.Box
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
import androidx.compose.material3.Typography
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
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
private val FazaahFont = FontFamily(
    Font(com.fazaah.app.R.font.noto_sans_arabic_regular, FontWeight.Normal),
    Font(com.fazaah.app.R.font.noto_sans_arabic_bold, FontWeight.Bold),
)
private val FazaahTypography = Typography().let { base ->
    base.copy(
        displayLarge = base.displayLarge.copy(fontFamily = FazaahFont),
        displayMedium = base.displayMedium.copy(fontFamily = FazaahFont),
        displaySmall = base.displaySmall.copy(fontFamily = FazaahFont),
        headlineLarge = base.headlineLarge.copy(fontFamily = FazaahFont),
        headlineMedium = base.headlineMedium.copy(fontFamily = FazaahFont),
        headlineSmall = base.headlineSmall.copy(fontFamily = FazaahFont),
        titleLarge = base.titleLarge.copy(fontFamily = FazaahFont),
        titleMedium = base.titleMedium.copy(fontFamily = FazaahFont),
        titleSmall = base.titleSmall.copy(fontFamily = FazaahFont),
        bodyLarge = base.bodyLarge.copy(fontFamily = FazaahFont),
        bodyMedium = base.bodyMedium.copy(fontFamily = FazaahFont),
        bodySmall = base.bodySmall.copy(fontFamily = FazaahFont),
        labelLarge = base.labelLarge.copy(fontFamily = FazaahFont),
        labelMedium = base.labelMedium.copy(fontFamily = FazaahFont),
        labelSmall = base.labelSmall.copy(fontFamily = FazaahFont),
    )
}

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val container = AppContainer(applicationContext)
        setContent {
            androidx.compose.runtime.CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Rtl) {
                MaterialTheme(colorScheme = FazaahColors, typography = FazaahTypography) {
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
    var showWelcome by rememberSaveable { mutableStateOf(true) }

    if (showWelcome) {
        WelcomeScreen(onStart = { role -> viewModel.setRole(role); showWelcome = false }, onSkip = { viewModel.setRole(UserRole.CLIENT); showWelcome = false })
        return
    }

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

        Image(painterResource(com.fazaah.app.R.drawable.fazaah_logo), contentDescription = "شعار فزعة", modifier = Modifier.height(82.dp))
        Spacer(Modifier.height(14.dp))
        Text(
            when (state.step) {
                AuthStep.PHONE -> "أدخل رقم هاتفك"
                AuthStep.OTP -> "تحقق من هاتفك"
                AuthStep.PROFILE -> "أكمل بياناتك"
                AuthStep.HOME -> "مرحبًا بك في فزعة"
            },
            style = MaterialTheme.typography.headlineLarge,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.primary,
        )
        Text(
            when (state.step) {
                AuthStep.PHONE -> "سنرسل رمزاً قصيراً إلى رقمك لتبدأ تجربتك بأمان."
                AuthStep.OTP -> "أدخل الرمز الذي وصل إلى هاتفك لإكمال الدخول."
                AuthStep.PROFILE -> if (state.role == UserRole.PROVIDER) "عرّف العملاء بخدمتك حتى تصل إليك الطلبات المناسبة." else "أكمل بياناتك وحدد موقعك لنتمكن من عرض أفضل الخدمات القريبة منك."
                AuthStep.HOME -> "خدماتك أقرب مما تتخيل"
            },
            style = MaterialTheme.typography.bodyLarge,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
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
private fun WelcomeScreen(onStart: (UserRole) -> Unit, onSkip: () -> Unit) {
    var page by rememberSaveable { mutableStateOf(0) }
    val title = when (page) {
        0 -> "أهلاً وسهلاً بك في فزعة"
        1 -> "تواصل مباشرة مع المهني المناسب"
        else -> "اختر كيف ستستخدم فزعة؟"
    }
    val description = when (page) {
        0 -> "منصة توصلك بأفضل المهنيين والفنيين لإنجاز احتياجاتك بسهولة وسرعة."
        1 -> "اختر نوع الخدمة، وتواصل مع أفضل المهنيين المعتمدين لإنجاز احتياجك بسهولة وأمان."
        else -> "اختر دورك للبدء والاستفادة من خدمات منصة فزعة."
    }
    Column(modifier = Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(horizontal = 20.dp, vertical = 28.dp), horizontalAlignment = Alignment.CenterHorizontally) {
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
            Text("فزعة", color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold)
            Image(painterResource(com.fazaah.app.R.drawable.fazaah_logo), contentDescription = "شعار فزعة", modifier = Modifier.height(64.dp))
            Text("●  ●", color = MaterialTheme.colorScheme.secondary)
        }
        Spacer(Modifier.height(24.dp))
        Image(painterResource(com.fazaah.app.R.drawable.fazaah_logo), contentDescription = null, modifier = Modifier.height(170.dp))
        Text(title, style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary, textAlign = androidx.compose.ui.text.style.TextAlign.Center)
        Spacer(Modifier.height(10.dp))
        Text(description, style = MaterialTheme.typography.bodyLarge, color = MaterialTheme.colorScheme.onSurfaceVariant, textAlign = androidx.compose.ui.text.style.TextAlign.Center)
        Spacer(Modifier.height(28.dp))
        if (page < 2) {
            Button(onClick = { page += 1 }, modifier = Modifier.fillMaxWidth().height(54.dp)) { Text(if (page == 0) "لنبدأ" else "التالي", fontWeight = FontWeight.Bold) }
        } else {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                Button(onClick = { onStart(UserRole.CLIENT) }, modifier = Modifier.weight(1f).height(54.dp)) { Text("أبحث عن خدمة") }
                androidx.compose.material3.OutlinedButton(onClick = { onStart(UserRole.PROVIDER) }, modifier = Modifier.weight(1f).height(54.dp)) { Text("أقدم خدمة") }
            }
        }
        Spacer(Modifier.height(16.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) { repeat(3) { index -> androidx.compose.material3.Surface(modifier = Modifier.height(8.dp).width(if (index == page) 32.dp else 8.dp), shape = androidx.compose.foundation.shape.RoundedCornerShape(50), color = if (index == page) MaterialTheme.colorScheme.secondary else MaterialTheme.colorScheme.outlineVariant) {} } }
        TextButton(onClick = onSkip) { Text("تخطي") }
    }
}

@Composable
private fun PhoneStep(state: AuthUiState, viewModel: AuthViewModel) {
    Surface(modifier = Modifier.height(80.dp).width(80.dp), shape = androidx.compose.foundation.shape.RoundedCornerShape(26.dp), color = MaterialTheme.colorScheme.primary.copy(alpha = .10f)) {
        Box(contentAlignment = Alignment.Center) { Icon(Icons.Default.Phone, contentDescription = null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.height(34.dp).width(34.dp)) }
    }
    Spacer(Modifier.height(16.dp))
    Text("كيف ستستخدم فزعة؟", fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary, modifier = Modifier.fillMaxWidth())
    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
        RoleCard("أبحث عن خدمة", "ستظهر لك أفضل الخدمات والمهنيين", state.role == UserRole.CLIENT, { viewModel.setRole(UserRole.CLIENT) }, Modifier.weight(1f))
        RoleCard("أقدم خدمة", "ستستقبل طلبات العملاء وتدير عملك", state.role == UserRole.PROVIDER, { viewModel.setRole(UserRole.PROVIDER) }, Modifier.weight(1f))
    }
    Spacer(Modifier.height(14.dp))
    OutlinedTextField(state.phone, viewModel::setPhone, label = { Text("رقم الهاتف") }, placeholder = { Text("7XXXXXXXX") }, singleLine = true, modifier = Modifier.fillMaxWidth(), textStyle = androidx.compose.ui.text.TextStyle(textAlign = androidx.compose.ui.text.style.TextAlign.Center, fontSize = 18.sp))
    Spacer(Modifier.height(16.dp))
    Button(enabled = !state.loading && state.phone.length >= 9, onClick = viewModel::sendOtp, modifier = Modifier.fillMaxWidth().height(54.dp), shape = androidx.compose.foundation.shape.RoundedCornerShape(16.dp)) {
        if (state.loading) CircularProgressIndicator(modifier = Modifier.width(20.dp).height(20.dp), color = MaterialTheme.colorScheme.onPrimary) else { Text("إرسال رمز التحقق", fontWeight = FontWeight.Bold); Spacer(Modifier.width(8.dp)); Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = null) }
    }
}

@Composable
private fun RoleCard(title: String, description: String, selected: Boolean, onClick: () -> Unit, modifier: Modifier) {
    Card(onClick = onClick, modifier = modifier, colors = androidx.compose.material3.CardDefaults.cardColors(containerColor = if (selected) MaterialTheme.colorScheme.primary else Color.White), border = androidx.compose.foundation.BorderStroke(1.dp, if (selected) MaterialTheme.colorScheme.primary else Color(0xFFD4D9DF))) {
        Column(modifier = Modifier.padding(12.dp)) {
            Text(if (title.contains("أقدم")) "▣" else "♙", color = if (selected) MaterialTheme.colorScheme.secondary else Color(0xFFB57920), fontSize = 22.sp)
            Text(title, fontWeight = FontWeight.Bold, color = if (selected) Color.White else MaterialTheme.colorScheme.primary)
            Text(description, style = MaterialTheme.typography.bodySmall, color = if (selected) Color.White.copy(alpha = .75f) else MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}

@Composable
private fun OtpStep(state: AuthUiState, viewModel: AuthViewModel) {
    Surface(modifier = Modifier.height(80.dp).width(80.dp), shape = androidx.compose.foundation.shape.RoundedCornerShape(26.dp), color = MaterialTheme.colorScheme.secondary.copy(alpha = .20f)) {
        Box(contentAlignment = Alignment.Center) { Text("✓", color = Color(0xFFB57920), fontSize = 34.sp, fontWeight = FontWeight.Bold) }
    }
    Spacer(Modifier.height(16.dp))
    Text("أرسلنا الرمز إلى رقم هاتفك", color = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.fillMaxWidth())
    Spacer(Modifier.height(12.dp))
    OutlinedTextField(state.code, viewModel::setCode, label = { Text("رمز التحقق") }, placeholder = { Text("000000") }, singleLine = true, modifier = Modifier.fillMaxWidth(), textStyle = androidx.compose.ui.text.TextStyle(textAlign = androidx.compose.ui.text.style.TextAlign.Center, fontSize = 24.sp, letterSpacing = 8.sp))
    state.developmentOtp?.let { otp ->
        Spacer(Modifier.height(12.dp))
        Card(modifier = Modifier.fillMaxWidth(), colors = androidx.compose.material3.CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.secondary.copy(alpha = .12f))) { Text("رمز التطوير: $otp", modifier = Modifier.padding(16.dp), color = Color(0xFF8A6925), fontWeight = FontWeight.Bold) }
    }
    Spacer(Modifier.height(16.dp))
    Button(enabled = !state.loading && state.code.length == 6, onClick = viewModel::verifyLogin, modifier = Modifier.fillMaxWidth().height(54.dp), shape = androidx.compose.foundation.shape.RoundedCornerShape(16.dp)) { Text("تأكيد الرمز", fontWeight = FontWeight.Bold); Spacer(Modifier.width(8.dp)); Text("✓") }
    TextButton(onClick = viewModel::resetToPhone) { Text("تغيير رقم الهاتف", color = Color(0xFFB57920), fontWeight = FontWeight.Bold) }
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
    Surface(modifier = Modifier.fillMaxWidth(), shape = androidx.compose.foundation.shape.RoundedCornerShape(26.dp), color = MaterialTheme.colorScheme.primary) {
        Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
            Surface(modifier = Modifier.height(46.dp).width(46.dp), shape = androidx.compose.foundation.shape.RoundedCornerShape(16.dp), color = MaterialTheme.colorScheme.secondary) { Box(contentAlignment = Alignment.Center) { Text(if (state.role == UserRole.PROVIDER) "▣" else "♙", color = MaterialTheme.colorScheme.primary, fontSize = 22.sp) } }
            Spacer(Modifier.width(12.dp))
            Column { Text(if (state.role == UserRole.PROVIDER) "أقدم خدمة" else "أبحث عن خدمة", color = Color.White, fontWeight = FontWeight.Bold); Text(if (state.role == UserRole.PROVIDER) "ستستقبل طلبات العملاء وتدير عملك" else "ستظهر لك أفضل الخدمات والمهنيين", color = Color.White.copy(alpha = .72f), style = MaterialTheme.typography.bodySmall) }
        }
    }
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
        Button(onClick = { locationPermission.launch(arrayOf(Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION)) }, modifier = Modifier.fillMaxWidth(), shape = androidx.compose.foundation.shape.RoundedCornerShape(16.dp)) { Text(if (state.latitude.isNotBlank()) "تم تحديد موقعك" else "حدد موقعك بدقة") }
        Text(if (state.latitude.isNotBlank()) "${state.latitude}, ${state.longitude}" else "الموقع مطلوب لعرض الخدمات القريبة منك", color = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.fillMaxWidth())
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
