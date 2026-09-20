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
import androidx.compose.material3.TextField
import androidx.compose.material3.TextFieldDefaults
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
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
import androidx.compose.ui.graphics.toArgb
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

private val FazaahDarkColors = darkColorScheme(
    primary = Color(0xFF2B78C7),
    onPrimary = Color.White,
    secondary = Color(0xFFF0B046),
    onSecondary = Color(0xFF182D53),
    background = Color(0xFF0C111D),
    onBackground = Color(0xFFF4F6FA),
    surface = Color(0xFF151B29),
    onSurface = Color(0xFFF4F6FA),
    surfaceVariant = Color(0xFF1B2433),
    onSurfaceVariant = Color(0xFF8B9AAF),
)
private val FazaahLightColors = lightColorScheme(
    primary = Color(0xFF182D53), onPrimary = Color.White,
    secondary = Color(0xFFF0B046), onSecondary = Color(0xFF182D53),
    background = Color(0xFFF7F8FA), onBackground = Color(0xFF182D53),
    surface = Color.White, onSurface = Color(0xFF182D53),
    surfaceVariant = Color(0xFFEFECE5), onSurfaceVariant = Color(0xFF637087),
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
        window.statusBarColor = Color(0xFF080B12).toArgb()
        window.navigationBarColor = Color(0xFF080B12).toArgb()
        val container = AppContainer(applicationContext)
        setContent {
            var darkMode by rememberSaveable { mutableStateOf(false) }
            androidx.compose.runtime.CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Rtl) {
                MaterialTheme(colorScheme = if (darkMode) FazaahDarkColors else FazaahLightColors, typography = FazaahTypography) {
                    Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
                        FazaahAuthScreen(container, darkMode, { darkMode = !darkMode })
                    }
                }
            }
        }
    }
}

@Composable
private fun FazaahAuthScreen(container: AppContainer, darkMode: Boolean, onToggleTheme: () -> Unit) {
    val viewModel: AuthViewModel = viewModel(factory = AuthViewModel.factory(container.authRepository))
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    var showWelcome by rememberSaveable { mutableStateOf(true) }

    if (showWelcome) {
        WelcomeScreen(onStart = { role -> viewModel.setRole(role); showWelcome = false }, onSkip = { viewModel.setRole(UserRole.CLIENT); showWelcome = false }, darkMode = darkMode, onToggleTheme = onToggleTheme)
        return
    }

    if (state.step == AuthStep.HOME) {
        CatalogShell(container.catalogRepository, container.authRepository, onLogout = viewModel::logout)
        return
    }

    Column(
        modifier = Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(horizontal = 36.dp, vertical = 24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Top,
    ) {
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            androidx.compose.material3.TextButton(onClick = onToggleTheme) { Text(if (darkMode) "نهاري" else "ليلي", color = MaterialTheme.colorScheme.secondary) }
            if (state.step != AuthStep.PHONE && state.step != AuthStep.HOME) {
                IconButton(onClick = viewModel::goBack) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "رجوع")
                }
            } else { Spacer(Modifier.width(1.dp)) }
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
private fun WelcomeScreen(onStart: (UserRole) -> Unit, onSkip: () -> Unit, darkMode: Boolean, onToggleTheme: () -> Unit) {
    var page by rememberSaveable { mutableStateOf(0) }
    var selectedRole by rememberSaveable { mutableStateOf(UserRole.CLIENT) }
    Box(modifier = Modifier.fillMaxSize()) {
        if (page < 2) {
            Column(modifier = Modifier.fillMaxSize()) {
                Spacer(Modifier.weight(0.76f))
                Surface(modifier = Modifier.fillMaxWidth().weight(0.24f), color = Color(0xFF182D53)) {}
            }
        }
        Column(
            modifier = Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(horizontal = 20.dp, vertical = 24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                if (page > 0) IconButton(onClick = { page -= 1 }) { Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "العودة", tint = MaterialTheme.colorScheme.primary) } else Text("9:41", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                Image(painterResource(com.fazaah.app.R.drawable.fazaah_logo), contentDescription = "شعار فزعة", modifier = Modifier.height(76.dp).width(100.dp))
                TextButton(onClick = onToggleTheme) { Text(if (darkMode) "نهاري" else "ليلي", color = MaterialTheme.colorScheme.secondary, fontSize = 11.sp) }
            }
            if (page == 0) {
                Surface(shape = androidx.compose.foundation.shape.RoundedCornerShape(50), color = MaterialTheme.colorScheme.secondary.copy(alpha = .18f)) { Text("✦  خدمة تستحق الثقة", modifier = Modifier.padding(horizontal = 14.dp, vertical = 8.dp), color = Color(0xFFB57920), fontSize = 11.sp, fontWeight = FontWeight.Bold) }
                Text("أهلاً وسهلاً بك في", style = MaterialTheme.typography.headlineLarge, fontWeight = FontWeight.Black, color = MaterialTheme.colorScheme.primary, textAlign = androidx.compose.ui.text.style.TextAlign.Center, modifier = Modifier.padding(top = 14.dp))
                Text("فزعة", style = MaterialTheme.typography.headlineLarge, fontWeight = FontWeight.Black, color = Color(0xFFB57920))
                Text("منصة توصلك بأفضل المهنيين والفنيين لإنجاز احتياجاتك بسهولة وسرعة.", color = MaterialTheme.colorScheme.onSurfaceVariant, textAlign = androidx.compose.ui.text.style.TextAlign.Center, lineHeight = 26.sp, modifier = Modifier.padding(horizontal = 18.dp, vertical = 8.dp))
                NativePhonePreview(detailed = false)
                BenefitsRow()
            } else if (page == 1) {
                Text("تواصل مباشرة مع", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Black, color = MaterialTheme.colorScheme.primary, textAlign = androidx.compose.ui.text.style.TextAlign.Center, modifier = Modifier.padding(top = 8.dp))
                Text("المهني المناسب", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Black, color = Color(0xFFB57920))
                Text("اختر نوع الخدمة، وتواصل مع أفضل المهنيين المعتمدين لإنجاز احتياجك بسهولة وأمان.", color = MaterialTheme.colorScheme.onSurfaceVariant, textAlign = androidx.compose.ui.text.style.TextAlign.Center, lineHeight = 26.sp, modifier = Modifier.padding(horizontal = 18.dp, vertical = 8.dp))
                NativePhonePreview(detailed = true)
                BenefitsRow()
            } else {
                Column(modifier = Modifier.fillMaxWidth()) {
                    Text("الخطوة الأخيرة", color = Color(0xFFB57920), fontWeight = FontWeight.Bold, fontSize = 11.sp)
                    Text("اختر كيف ستستخدم فزعة؟", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Black, color = MaterialTheme.colorScheme.primary, modifier = Modifier.padding(top = 10.dp))
                    Text("يمكنك اختيار الطريقة الأنسب لك الآن.", color = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.padding(top = 6.dp, bottom = 18.dp))
                    WelcomeRoleCard(UserRole.CLIENT, selectedRole, "أبحث عن خدمة", "أصل إلى الشخص المناسب بثقة", "اطلب، تابع، وقيّم تجربتك من مكان واحد") { selectedRole = UserRole.CLIENT }
                    Spacer(Modifier.height(12.dp))
                    WelcomeRoleCard(UserRole.PROVIDER, selectedRole, "أقدّم خدمة", "أحوّل خبرتي إلى فرص حقيقية", "اعرض مهارتك واستقبل طلبات من حولك") { selectedRole = UserRole.PROVIDER }
                    Text("ابدأ بطريقتك المفضلة", modifier = Modifier.fillMaxWidth().padding(top = 24.dp, bottom = 10.dp), textAlign = androidx.compose.ui.text.style.TextAlign.Center, color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 11.sp)
                    Button(onClick = { onStart(selectedRole) }, modifier = Modifier.fillMaxWidth().height(56.dp), shape = androidx.compose.foundation.shape.RoundedCornerShape(18.dp)) { Icon(Icons.Default.Phone, contentDescription = null, tint = MaterialTheme.colorScheme.secondary); Spacer(Modifier.width(8.dp)); Text("التسجيل برقم الهاتف", fontWeight = FontWeight.Bold) }
                    androidx.compose.material3.OutlinedButton(onClick = {}, modifier = Modifier.fillMaxWidth().height(50.dp).padding(top = 4.dp), shape = androidx.compose.foundation.shape.RoundedCornerShape(18.dp)) { Text("المتابعة باستخدام جوجل") }
                    androidx.compose.material3.OutlinedButton(onClick = {}, modifier = Modifier.fillMaxWidth().height(50.dp).padding(top = 4.dp), shape = androidx.compose.foundation.shape.RoundedCornerShape(18.dp)) { Text("التسجيل بالبريد الإلكتروني") }
                    TextButton(onClick = { onStart(selectedRole) }, modifier = Modifier.fillMaxWidth()) { Text("لديك حساب بالفعل؟ تسجيل الدخول برقم الهاتف", color = Color(0xFFB57920), fontSize = 12.sp) }
                }
            }
            Spacer(Modifier.weight(1f))
            if (page < 2) Button(onClick = { page += 1 }, modifier = Modifier.fillMaxWidth().height(56.dp), colors = androidx.compose.material3.ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.secondary, contentColor = Color(0xFF182D53)), shape = androidx.compose.foundation.shape.RoundedCornerShape(18.dp)) { Text(if (page == 0) "لنبدأ" else "التالي", fontWeight = FontWeight.Black) }
            Spacer(Modifier.height(12.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) { repeat(3) { index -> Surface(modifier = Modifier.height(8.dp).width(if (index == page) 32.dp else 8.dp), shape = androidx.compose.foundation.shape.RoundedCornerShape(50), color = if (index == page) MaterialTheme.colorScheme.secondary else Color(0xFFC8D3E1)) {} } }
            if (page < 2) TextButton(onClick = onSkip) { Text("تخطي", color = if (darkMode) Color.White.copy(alpha=.75f) else Color(0xFF637087)) }
        }
    }
}

@Composable
private fun NativePhonePreview(detailed: Boolean) {
    Surface(modifier = Modifier.padding(vertical = 10.dp).width(250.dp).height(260.dp), shape = androidx.compose.foundation.shape.RoundedCornerShape(34.dp), color = Color(0xFF182D53), shadowElevation = 14.dp) {
        Surface(modifier = Modifier.padding(8.dp), shape = androidx.compose.foundation.shape.RoundedCornerShape(27.dp), color = Color(0xFFF7F8FA)) {
            Column(Modifier.padding(14.dp)) {
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) { Image(painterResource(com.fazaah.app.R.drawable.fazaah_logo), contentDescription = null, modifier = Modifier.height(38.dp)); Surface(shape = androidx.compose.foundation.shape.RoundedCornerShape(50), color = Color.White) { Text("♙", modifier = Modifier.padding(8.dp), color = Color(0xFF182D53)) } }
                if (detailed) {
                    Text("مرحباً بك في فزعة", fontSize = 10.sp, color = Color(0xFF637087), modifier = Modifier.padding(top = 12.dp))
                    Surface(color = Color.White, shape = androidx.compose.foundation.shape.RoundedCornerShape(12.dp), modifier = Modifier.fillMaxWidth().padding(top = 8.dp)) { Text("⌕  ابحث عن خدمة أو مهني", modifier = Modifier.padding(10.dp), color = Color(0xFF8C897F), fontSize = 9.sp) }
                    Text("ما الخدمة التي تحتاجها؟", fontWeight = FontWeight.Black, fontSize = 12.sp, color = Color(0xFF182D53), modifier = Modifier.padding(top = 12.dp))
                    Row(Modifier.fillMaxWidth().padding(top = 8.dp), horizontalArrangement = Arrangement.spacedBy(5.dp)) { listOf("سباكة","كهرباء","تكييف","برمجة").forEach { item -> Surface(modifier = Modifier.weight(1f), color = Color.White, shape = androidx.compose.foundation.shape.RoundedCornerShape(10.dp)) { Text(item, modifier = Modifier.padding(vertical = 12.dp, horizontal = 2.dp), textAlign = androidx.compose.ui.text.style.TextAlign.Center, color = Color(0xFF60728A), fontSize = 7.sp) } } }
                } else {
                    Surface(color = Color(0xFF182D53), shape = androidx.compose.foundation.shape.RoundedCornerShape(18.dp), modifier = Modifier.fillMaxWidth().padding(top = 20.dp)) { Column(Modifier.padding(14.dp)) { Text("خدماتك أقرب", color = Color(0xFFF0B046), fontSize = 10.sp); Text("الشخص المناسب\nفي الوقت المناسب", color = Color.White, fontWeight = FontWeight.Black, fontSize = 19.sp, lineHeight = 25.sp, modifier = Modifier.padding(top = 7.dp)); Text("●  فزعة توصلك بثقة", color = Color.White.copy(alpha=.68f), fontSize = 8.sp, modifier = Modifier.padding(top = 18.dp)) } }
                }
            }
        }
    }
}

@Composable
private fun BenefitsRow() {
    Surface(modifier = Modifier.fillMaxWidth(), color = Color.White.copy(alpha=.92f), shape = androidx.compose.foundation.shape.RoundedCornerShape(18.dp), shadowElevation = 3.dp) {
        Row(Modifier.fillMaxWidth().padding(vertical = 12.dp), horizontalArrangement = Arrangement.SpaceEvenly) { listOf("♙\nمهنيون محترفون", "◷\nتواصل سريع", "✓\nموثوقون").forEach { Text(it, color = Color(0xFF182D53), textAlign = androidx.compose.ui.text.style.TextAlign.Center, fontWeight = FontWeight.Bold, fontSize = 9.sp) } }
    }
}

@Composable
private fun WelcomeRoleCard(role: UserRole, selected: UserRole, title: String, description: String, detail: String, onClick: () -> Unit) {
    val active = role == selected
    Card(onClick = onClick, modifier = Modifier.fillMaxWidth(), shape = androidx.compose.foundation.shape.RoundedCornerShape(24.dp), colors = androidx.compose.material3.CardDefaults.cardColors(containerColor = if (active) Color(0xFF182D53) else MaterialTheme.colorScheme.surface), border = androidx.compose.foundation.BorderStroke(1.dp, if (active) Color(0xFF182D53) else MaterialTheme.colorScheme.outlineVariant)) {
        Row(Modifier.fillMaxWidth().padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
            Surface(modifier = Modifier.width(56.dp).height(56.dp), shape = androidx.compose.foundation.shape.RoundedCornerShape(17.dp), color = if (active) Color(0xFFF0B046) else Color(0xFFFFF4D2)) { Box(contentAlignment = Alignment.Center) { Text(if (role == UserRole.PROVIDER) "▣" else "♙", fontSize = 24.sp, color = Color(0xFF182D53)) } }
            Column(Modifier.weight(1f).padding(horizontal = 14.dp)) { Text(title, fontWeight = FontWeight.Bold, color = if (active) Color.White else MaterialTheme.colorScheme.primary); Text(description, fontSize = 12.sp, color = if (active) Color.White.copy(alpha=.7f) else MaterialTheme.colorScheme.onSurfaceVariant); Text(detail, fontSize = 10.sp, color = Color(0xFFF0B046), modifier = Modifier.padding(top = 4.dp)) }
            Text(if (active) "✓" else "○", color = if (active) Color(0xFFF0B046) else MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}

@Composable
private fun PhoneStep(state: AuthUiState, viewModel: AuthViewModel) {
    Surface(modifier = Modifier.height(118.dp).width(118.dp), shape = androidx.compose.foundation.shape.RoundedCornerShape(34.dp), color = Color(0xFF0D2233)) {
        Box(contentAlignment = Alignment.Center) { Icon(Icons.Default.Phone, contentDescription = null, tint = Color(0xFF2B78C7), modifier = Modifier.height(54.dp).width(54.dp)) }
    }
    Spacer(Modifier.height(16.dp))
    Text("كيف ستستخدم فزعة؟", fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary, modifier = Modifier.fillMaxWidth())
    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
        RoleCard("أبحث عن خدمة", "ستظهر لك أفضل الخدمات والمهنيين", state.role == UserRole.CLIENT, { viewModel.setRole(UserRole.CLIENT) }, Modifier.weight(1f))
        RoleCard("أقدم خدمة", "ستستقبل طلبات العملاء وتدير عملك", state.role == UserRole.PROVIDER, { viewModel.setRole(UserRole.PROVIDER) }, Modifier.weight(1f))
    }
    Spacer(Modifier.height(14.dp))
    TextField(
        value = state.phone,
        onValueChange = viewModel::setPhone,
        placeholder = { Text("7XXXXXXXXX", modifier = Modifier.fillMaxWidth(), textAlign = androidx.compose.ui.text.style.TextAlign.Center) },
        singleLine = true,
        modifier = Modifier.fillMaxWidth().height(64.dp),
        textStyle = androidx.compose.ui.text.TextStyle(textAlign = androidx.compose.ui.text.style.TextAlign.Center, fontSize = 20.sp, fontWeight = FontWeight.Bold),
        colors = TextFieldDefaults.colors(
            focusedContainerColor = Color(0xFF151B29),
            unfocusedContainerColor = Color(0xFF151B29),
            focusedIndicatorColor = Color.Transparent,
            unfocusedIndicatorColor = Color.Transparent,
            focusedTextColor = Color(0xFFF4F6FA),
            unfocusedTextColor = Color(0xFFF4F6FA),
            unfocusedPlaceholderColor = Color(0xFF8796AA),
            focusedPlaceholderColor = Color(0xFF8796AA),
        ),
        shape = androidx.compose.foundation.shape.RoundedCornerShape(24.dp),
    )
    Spacer(Modifier.height(16.dp))
    Button(enabled = !state.loading && state.phone.length >= 9, onClick = viewModel::sendOtp, modifier = Modifier.fillMaxWidth().height(64.dp), shape = androidx.compose.foundation.shape.RoundedCornerShape(22.dp)) {
        if (state.loading) CircularProgressIndicator(modifier = Modifier.width(20.dp).height(20.dp), color = MaterialTheme.colorScheme.onPrimary) else { Text("إرسال رمز التحقق", fontWeight = FontWeight.Bold); Spacer(Modifier.width(8.dp)); Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = null) }
    }
}

@Composable
private fun RoleCard(title: String, description: String, selected: Boolean, onClick: () -> Unit, modifier: Modifier) {
    Card(onClick = onClick, modifier = modifier, colors = androidx.compose.material3.CardDefaults.cardColors(containerColor = if (selected) Color(0xFF2B78C7) else Color(0xFF151B29)), border = androidx.compose.foundation.BorderStroke(1.dp, if (selected) Color(0xFF2B78C7) else Color(0xFF293243))) {
        Column(modifier = Modifier.padding(12.dp)) {
            Text(if (title.contains("أقدم")) "▣" else "♙", color = Color(0xFFF0B046), fontSize = 22.sp)
            Text(title, fontWeight = FontWeight.Bold, color = if (selected) Color.White else MaterialTheme.colorScheme.primary)
            Text(description, style = MaterialTheme.typography.bodySmall, color = if (selected) Color.White.copy(alpha = .78f) else Color(0xFF8B9AAF))
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
    OutlinedTextField(state.name, viewModel::setName, placeholder = { Text("أدخل اسمك الرباعي") }, label = { Text("الاسم الرباعي *") }, singleLine = true, modifier = Modifier.fillMaxWidth(), shape = androidx.compose.foundation.shape.RoundedCornerShape(18.dp))
    if (state.role == UserRole.PROVIDER) {
        Surface(modifier = Modifier.fillMaxWidth(), shape = androidx.compose.foundation.shape.RoundedCornerShape(24.dp), color = MaterialTheme.colorScheme.surface, tonalElevation = 2.dp) {
            Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text("التحقق من الهوية والتواصل", color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold)
                OutlinedTextField(state.nationalId, viewModel::setNationalId, placeholder = { Text("الرقم الوطني — 11 رقمًا") }, label = { Text("الرقم الوطني") }, singleLine = true, modifier = Modifier.fillMaxWidth(), shape = androidx.compose.foundation.shape.RoundedCornerShape(16.dp))
                OutlinedTextField(state.whatsapp, viewModel::setWhatsapp, placeholder = { Text("أدخل رقم الواتس اب") }, label = { Text("رقم واتساب") }, singleLine = true, modifier = Modifier.fillMaxWidth(), shape = androidx.compose.foundation.shape.RoundedCornerShape(16.dp))
            }
        }
        Spacer(Modifier.height(12.dp))
        Surface(modifier = Modifier.fillMaxWidth(), shape = androidx.compose.foundation.shape.RoundedCornerShape(24.dp), color = MaterialTheme.colorScheme.surface, tonalElevation = 2.dp) {
            Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text("اختر تخصصك أو مجالك", color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold)
                OutlinedTextField(state.specialty, viewModel::setSpecialty, placeholder = { Text("اكتب تخصصك الدقيق") }, label = { Text("التخصص الدقيق") }, singleLine = true, modifier = Modifier.fillMaxWidth(), shape = androidx.compose.foundation.shape.RoundedCornerShape(16.dp))
                OutlinedTextField(state.bio, viewModel::setBio, placeholder = { Text("اكتب وصف تخصصك أو مجالك، مثل: أقدم خدمات السباكة المنزلية وإصلاح التسربات...") }, label = { Text("وصف الخبرة والخدمة") }, minLines = 4, modifier = Modifier.fillMaxWidth(), shape = androidx.compose.foundation.shape.RoundedCornerShape(16.dp))
                OutlinedTextField(state.yearsExperience, viewModel::setYearsExperience, placeholder = { Text("سنوات الخبرة (اختياري)") }, label = { Text("سنوات الخبرة") }, singleLine = true, modifier = Modifier.fillMaxWidth(), shape = androidx.compose.foundation.shape.RoundedCornerShape(16.dp))
            }
        }
        Spacer(Modifier.height(10.dp))
        Button(onClick = { locationPermission.launch(arrayOf(Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION)) }, modifier = Modifier.fillMaxWidth()) { Text(if (state.latitude.isNotBlank()) "تم تحديد الموقع بدقة" else "السماح بتحديد موقع العمل") }
        Text(if (state.latitude.isNotBlank()) "${state.latitude}, ${state.longitude}" else "الموقع الدقيق مطلوب لاعتماد المهني", color = MaterialTheme.colorScheme.onSurfaceVariant)
        DocumentButton("الصورة الشخصية", state.selfieBase64 != null) { selfiePicker.launch("image/*") }
        DocumentButton("صورة الهوية — الأمام", state.idFrontBase64 != null) { frontPicker.launch("image/*") }
        DocumentButton("صورة الهوية — الخلف", state.idBackBase64 != null) { backPicker.launch("image/*") }
        Surface(modifier = Modifier.fillMaxWidth(), shape = androidx.compose.foundation.shape.RoundedCornerShape(24.dp), color = MaterialTheme.colorScheme.surface, tonalElevation = 2.dp) {
            Row(Modifier.padding(14.dp), verticalAlignment = Alignment.Top) {
                androidx.compose.material3.Checkbox(checked = state.termsAccepted, onCheckedChange = viewModel::setTermsAccepted)
                Text("أقر بأن بياناتي ومستنداتي صحيحة، وأوافق على مراجعتها وفق شروط منصة فزعة.", modifier = Modifier.padding(top = 10.dp), style = MaterialTheme.typography.bodySmall)
            }
        }
    } else {
        Spacer(Modifier.height(10.dp))
        Button(onClick = { locationPermission.launch(arrayOf(Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION)) }, modifier = Modifier.fillMaxWidth(), shape = androidx.compose.foundation.shape.RoundedCornerShape(16.dp)) { Text(if (state.latitude.isNotBlank()) "تم تحديد موقعك" else "حدد موقعك بدقة") }
        Text(if (state.latitude.isNotBlank()) "${state.latitude}, ${state.longitude}" else "الموقع مطلوب لعرض الخدمات القريبة منك", color = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.fillMaxWidth())
    }
    Spacer(Modifier.height(16.dp))
    Button(enabled = !state.loading && state.name.trim().split(" ").filter(String::isNotBlank).size >= 4 && (state.role != UserRole.PROVIDER || state.termsAccepted), onClick = viewModel::completeProfile, modifier = Modifier.fillMaxWidth().height(58.dp), shape = androidx.compose.foundation.shape.RoundedCornerShape(20.dp)) { Text(if (state.role == UserRole.PROVIDER) "إرسال طلب اعتماد المهني" else "إكمال التسجيل") }
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
