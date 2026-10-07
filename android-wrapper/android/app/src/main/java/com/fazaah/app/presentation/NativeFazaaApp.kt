package com.fazaah.app.presentation

import android.Manifest
import android.content.pm.PackageManager
import android.location.LocationManager
import android.util.Base64
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.ContextCompat
import androidx.compose.foundation.clickable

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.ArrowForward
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Checkbox
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.RadioButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.lightColorScheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.fazaah.app.AppContainer
import com.fazaah.app.R
import com.fazaah.app.presentation.auth.AuthStep
import com.fazaah.app.presentation.auth.AuthViewModel
import com.fazaah.app.presentation.auth.UserRole
import com.fazaah.app.presentation.catalog.CatalogShell

private val FazaaNavy = Color(0xFF092F62)
private val FazaaBlue = Color(0xFF0B4C8C)
private val FazaaGold = Color(0xFFF6C107)
private val FazaaCream = Color(0xFFF7F8FA)
private val FazaaLightSurface = Color(0xFFF9FBFD)
private val FazaaDarkSurface = Color(0xFF061D35)

@Composable
private fun FazaaTheme(content: @Composable () -> Unit) {
    val dark = isSystemInDarkTheme()
    val colors = if (dark) darkColorScheme(primary = FazaaGold, secondary = FazaaBlue, background = FazaaDarkSurface, surface = Color(0xFF0B2948), onBackground = Color.White, onSurface = Color.White)
    else lightColorScheme(primary = FazaaNavy, secondary = FazaaGold, background = FazaaLightSurface, surface = Color.White, onBackground = FazaaNavy, onSurface = FazaaNavy)
    MaterialTheme(colorScheme = colors, content = content)
}

@Composable
private fun FazaaCityBackdrop(modifier: Modifier = Modifier) {
    Image(painter = painterResource(R.drawable.fazaah_hero), contentDescription = null, modifier = modifier, contentScale = androidx.compose.ui.layout.ContentScale.Crop, alpha = if (isSystemInDarkTheme()) .30f else .18f, alignment = Alignment.BottomCenter)
}

@Composable
fun NativeFazaaApp(
    container: AppContainer,
    initialRoute: String,
    onWelcomeSeen: () -> Unit,
    onExit: () -> Unit,
) {
    val navController = rememberNavController()
    val authViewModel: AuthViewModel = viewModel(factory = AuthViewModel.factory(container.authRepository))
    val state by authViewModel.uiState.collectAsStateWithLifecycle()

    LaunchedEffect(state.step) {
        when (state.step) {
            AuthStep.OTP -> if (navController.currentDestination?.route != "otp") navController.navigate("otp")
            AuthStep.HOME -> {
                navController.navigate("home") { popUpTo(0) }
            }
            AuthStep.PROFILE -> if (navController.currentDestination?.route != "profile") navController.navigate("profile")
            AuthStep.PIN -> if (navController.currentDestination?.route != "pin-setup") navController.navigate("pin-setup")
            else -> Unit
        }
    }

    FazaaTheme {
        Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
            NavHost(navController = navController, startDestination = initialRoute) {
                composable("welcome") {
                    WelcomeScreen(onStart = {
                        onWelcomeSeen()
                        navController.navigate("role")
                    })
                }
                composable("role") {
                    AccountTypeScreen(selected = state.role, onRole = authViewModel::setRole, onContinue = { navController.navigate("phone") }, onBack = { navController.popBackStack() })
                }
                composable("phone") {
                    PhoneLoginScreen(
                        state = state,
                        onBack = { onExit() },
                        onRole = authViewModel::setRole,
                        onPhone = authViewModel::setPhone,
                        onSendOtp = authViewModel::sendOtp,
                        onOpenPin = { navController.navigate("pin") },
                    )
                }
                composable("pin") {
                    PinLoginScreen(
                        phone = state.phone,
                        pin = state.pin,
                        loading = state.loading,
                        message = state.message,
                        onBack = { navController.popBackStack() },
                        onPin = authViewModel::setPin,
                        onLogin = authViewModel::loginWithPin,
                        onUseOtp = { authViewModel.resetToPhone(); navController.navigate("phone") { popUpTo("pin") { inclusive = true } } },
                    )
                }
                composable("otp") {
                    OtpScreen(
                        phone = state.phone,
                        otp = state.code,
                        developmentOtp = state.developmentOtp,
                        loading = state.loading,
                        message = state.message,
                        onBack = { authViewModel.goBack(); navController.popBackStack() },
                        onOtp = authViewModel::setCode,
                        onVerify = authViewModel::verifyLogin,
                        onResend = authViewModel::sendOtp,
                    )
                }
                composable("profile") {
                    RegistrationProfileScreen(
                        state = state,
                        catalogRepository = container.catalogRepository,
                        onName = authViewModel::setName,
                        onWhatsapp = authViewModel::setWhatsapp,
                        onNationalId = authViewModel::setNationalId,
                        onSpecialty = authViewModel::setSpecialty,
                        onBio = authViewModel::setBio,
                        onCategory = authViewModel::setCategoryId,
                        onTerms = authViewModel::setTermsAccepted,
                        onLocation = { lat, lon -> authViewModel.setLatitude(lat.toString()); authViewModel.setLongitude(lon.toString()) },
                        onSelfie = authViewModel::setSelfie,
                        onIdFront = authViewModel::setIdFront,
                        onIdBack = authViewModel::setIdBack,
                        onSubmit = authViewModel::completeProfile,
                        onBack = { authViewModel.goBack(); navController.popBackStack() },
                    )
                }
                composable("pin-setup") {
                    PinSetupScreen(
                        loading = state.loading,
                        message = state.message,
                        onCreate = { pin, confirm -> authViewModel.createPin(pin, confirm) { } },
                        onBack = { authViewModel.goBack(); navController.popBackStack() },
                    )
                }
                composable("home") {
                    CatalogShell(
                        catalogRepository = container.catalogRepository,
                        authRepository = container.authRepository,
                        role = state.role,
                        onLogout = {
                            authViewModel.logout()
                            navController.navigate("phone") { popUpTo(0) }
                        },
                    )
                }
            }
        }
    }
}

@Composable
private fun WelcomeScreen(onStart: () -> Unit) {
    Box(Modifier.fillMaxSize().background(FazaaNavy)) {
        FazaaCityBackdrop(Modifier.fillMaxSize())
        Column(Modifier.fillMaxSize().padding(horizontal = 24.dp, vertical = 28.dp), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.SpaceBetween) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Spacer(Modifier.height(32.dp))
                Logo(Modifier.size(150.dp))
                Text("احتياجك .. نوصلّك بالمناسب", color = Color.White, fontSize = 15.sp, fontWeight = FontWeight.Bold)
            }
            Text("صنعاء • اليمن", color = Color.White, fontSize = 13.sp)
            Button(onClick = onStart, modifier = Modifier.fillMaxWidth().height(56.dp), shape = RoundedCornerShape(18.dp), colors = ButtonDefaults.buttonColors(containerColor = FazaaGold, contentColor = FazaaNavy)) {
                Text("ابدأ الآن", fontSize = 18.sp, fontWeight = FontWeight.ExtraBold)
                Spacer(Modifier.width(8.dp))
                Icon(Icons.Default.ArrowBack, contentDescription = null)
            }
        }
    }
}

@Composable
private fun AccountTypeScreen(selected: UserRole, onRole: (UserRole) -> Unit, onContinue: () -> Unit, onBack: () -> Unit) {
    Column(Modifier.fillMaxSize().background(FazaaNavy).padding(horizontal = 24.dp, vertical = 22.dp), horizontalAlignment = Alignment.CenterHorizontally) {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
            IconButton(onClick = onBack) { Icon(Icons.Default.ArrowForward, contentDescription = "رجوع", tint = Color.White) }
            Spacer(Modifier.size(48.dp))
            Text("إنشاء حساب عميل", color = Color.White, fontSize = 16.sp, fontWeight = FontWeight.Bold)
            Spacer(Modifier.size(48.dp))
        }
        StepProgress(active = 0, total = 3)
        Spacer(Modifier.height(42.dp))
        Logo(Modifier.size(112.dp))
        Spacer(Modifier.height(20.dp))
        Text("اختر نوع الحساب", color = Color.White, fontSize = 22.sp, fontWeight = FontWeight.ExtraBold)
        Spacer(Modifier.height(24.dp))
        DarkRoleCard("عميل", "أبحث عن خدمة أو مقدم خدمة", selected == UserRole.CLIENT, { onRole(UserRole.CLIENT) })
        Spacer(Modifier.height(12.dp))
        DarkRoleCard("مهني", "أقدم خدماتي للعملاء", selected == UserRole.PROVIDER, { onRole(UserRole.PROVIDER) })
        Spacer(Modifier.weight(1f))
        Button(onClick = onContinue, modifier = Modifier.fillMaxWidth().height(54.dp), shape = RoundedCornerShape(13.dp), colors = ButtonDefaults.buttonColors(containerColor = FazaaGold, contentColor = Color(0xFF071D36))) { Text("متابعة", fontWeight = FontWeight.ExtraBold, fontSize = 16.sp) }
    }
}

@Composable
private fun PhoneLoginScreen(
    state: com.fazaah.app.presentation.auth.AuthUiState,
    onBack: () -> Unit,
    onRole: (UserRole) -> Unit,
    onPhone: (String) -> Unit,
    onSendOtp: () -> Unit,
    onOpenPin: () -> Unit,
) {
    Column(Modifier.fillMaxSize().background(FazaaNavy).padding(horizontal = 28.dp, vertical = 22.dp), horizontalAlignment = Alignment.CenterHorizontally) {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
            IconButton(onClick = onBack) { Icon(Icons.Default.ArrowForward, contentDescription = "رجوع", tint = Color.White) }
            Text("التحقق من رقم الهاتف", color = Color.White, fontSize = 16.sp, fontWeight = FontWeight.Bold)
            Spacer(Modifier.size(48.dp))
        }
        StepProgress(active = 0, total = 3)
        Spacer(Modifier.height(50.dp))
        Text("أدخل رقم هاتفك", color = Color.White, fontSize = 24.sp, fontWeight = FontWeight.ExtraBold)
        Spacer(Modifier.height(10.dp))
        Text("سنرسل لك رمز التحقق على رقم هاتفك", color = Color.White.copy(alpha = .68f), textAlign = TextAlign.Center, fontSize = 13.sp)
        Spacer(Modifier.height(32.dp))
        DarkPhoneField(state.phone, onPhone)
        Spacer(Modifier.height(18.dp))
        Button(onClick = onSendOtp, enabled = !state.loading && state.phone.length >= 9, modifier = Modifier.fillMaxWidth().height(54.dp), shape = RoundedCornerShape(13.dp), colors = ButtonDefaults.buttonColors(containerColor = FazaaGold, contentColor = Color(0xFF071D36))) {
            if (state.loading) CircularProgressIndicator(color = Color(0xFF071D36), modifier = Modifier.size(22.dp)) else Text("إرسال رمز التحقق", fontWeight = FontWeight.ExtraBold)
        }
        TextButton(onClick = onOpenPin, enabled = state.phone.length >= 9) { Text("لديك حساب بالفعل؟ تسجيل الدخول", color = Color.White.copy(alpha = .8f), fontWeight = FontWeight.Bold) }
        state.message?.let { Text(it, color = Color(0xFFFFB4AB), textAlign = TextAlign.Center, modifier = Modifier.padding(top = 12.dp)) }
    }
}

@Composable
private fun PinLoginScreen(phone: String, pin: String, loading: Boolean, message: String?, onBack: () -> Unit, onPin: (String) -> Unit, onLogin: () -> Unit, onUseOtp: () -> Unit) {
    Column(Modifier.fillMaxSize().background(FazaaNavy).padding(horizontal = 28.dp, vertical = 22.dp), horizontalAlignment = Alignment.CenterHorizontally) {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
            IconButton(onClick = onBack) { Icon(Icons.Default.ArrowForward, contentDescription = "رجوع", tint = Color.White) }
            Text("تسجيل الدخول", color = Color.White, fontSize = 16.sp, fontWeight = FontWeight.Bold)
            Spacer(Modifier.size(48.dp))
        }
        StepProgress(active = 2, total = 3)
        Spacer(Modifier.height(54.dp))
        Icon(Icons.Default.Lock, contentDescription = null, tint = FazaaGold, modifier = Modifier.size(46.dp))
        Spacer(Modifier.height(12.dp))
        Text("أدخل رمز الدخول", color = Color.White, fontSize = 24.sp, fontWeight = FontWeight.ExtraBold)
        Text("استخدم رمز الدخول للعودة إلى حسابك", color = Color.White.copy(alpha = .7f), fontSize = 13.sp)
        if (phone.isNotBlank()) Text("+967 $phone", color = Color.White.copy(alpha = .75f), fontWeight = FontWeight.Bold, modifier = Modifier.padding(top = 10.dp))
        Spacer(Modifier.height(28.dp))
        PinBoxes(value = pin, onValueChange = onPin)
        Spacer(Modifier.height(26.dp))
        Button(onClick = onLogin, enabled = !loading && pin.length == 4 && phone.length >= 9, modifier = Modifier.fillMaxWidth().height(54.dp), shape = RoundedCornerShape(13.dp), colors = ButtonDefaults.buttonColors(containerColor = FazaaGold, contentColor = Color(0xFF071D36))) {
            if (loading) CircularProgressIndicator(color = Color(0xFF071D36), modifier = Modifier.size(22.dp)) else Text("التالي", fontWeight = FontWeight.ExtraBold, fontSize = 17.sp)
        }
        TextButton(onClick = onUseOtp) { Text("نسيت رمز الدخول؟", color = Color.White.copy(alpha = .8f)) }
        message?.let { Text(it, color = Color(0xFFFFB4AB), textAlign = TextAlign.Center) }
    }
}

@Composable
private fun OtpScreen(phone: String, otp: String, developmentOtp: String?, loading: Boolean, message: String?, onBack: () -> Unit, onOtp: (String) -> Unit, onVerify: () -> Unit, onResend: () -> Unit) {
    Column(Modifier.fillMaxSize().background(FazaaNavy).padding(horizontal = 28.dp, vertical = 22.dp), horizontalAlignment = Alignment.CenterHorizontally) {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) { IconButton(onClick = onBack) { Icon(Icons.Default.ArrowForward, contentDescription = "رجوع", tint = Color.White) }; Text("التحقق من رقم الهاتف", color = Color.White, fontSize = 16.sp, fontWeight = FontWeight.Bold); Spacer(Modifier.size(48.dp)) }
        StepProgress(active = 1, total = 3)
        Spacer(Modifier.height(45.dp))
        Text("تحقق من رقم الجوال", color = Color.White, fontSize = 24.sp, fontWeight = FontWeight.ExtraBold)
        Text("أدخل الرمز المرسل إلى +967 $phone", color = Color.White.copy(alpha = .7f), textAlign = TextAlign.Center)
        Spacer(Modifier.height(28.dp))
        OtpBoxes(value = otp, onValueChange = onOtp)
        developmentOtp?.let { Card(Modifier.fillMaxWidth().padding(top = 22.dp), colors = CardDefaults.cardColors(containerColor = Color(0xFF173D61))) { Text("رمز التطوير: $it", Modifier.padding(16.dp).fillMaxWidth(), color = FazaaGold, fontWeight = FontWeight.Bold, textAlign = TextAlign.Center) } }
        Spacer(Modifier.height(22.dp))
        Button(onClick = onVerify, enabled = !loading && otp.length == 6, modifier = Modifier.fillMaxWidth().height(54.dp), shape = RoundedCornerShape(13.dp), colors = ButtonDefaults.buttonColors(containerColor = FazaaGold, contentColor = Color(0xFF071D36))) { if (loading) CircularProgressIndicator(color = Color(0xFF071D36), modifier = Modifier.size(22.dp)) else Text("تأكيد الرمز", fontWeight = FontWeight.ExtraBold) }
        TextButton(onClick = onResend) { Text("إعادة إرسال الرمز", color = Color.White.copy(alpha = .8f)) }
        message?.let { Text(it, color = Color(0xFFFFB4AB), textAlign = TextAlign.Center) }
    }
}

@Composable
fun PinBoxes(value: String, onValueChange: (String) -> Unit) = BasicTextField(value = value, onValueChange = { onValueChange(it.filter(Char::isDigit).take(4)) }, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.NumberPassword), visualTransformation = PasswordVisualTransformation(), singleLine = true, textStyle = TextStyle(color = Color.Transparent), decorationBox = { inner -> PinRow(value, 4, inner) })

@Composable
private fun OtpBoxes(value: String, onValueChange: (String) -> Unit) = BasicTextField(value = value, onValueChange = { onValueChange(it.filter(Char::isDigit).take(6)) }, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number), singleLine = true, textStyle = TextStyle(color = Color.Transparent), decorationBox = { inner -> PinRow(value, 6, inner) })

@Composable
private fun PinRow(value: String, count: Int, inner: @Composable () -> Unit) {
    Box(contentAlignment = Alignment.Center) {
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            repeat(count) { index ->
                val filled = index < value.length
                Box(Modifier.size(if (count == 4) 58.dp else 44.dp).clip(RoundedCornerShape(10.dp)).background(if (filled) Color(0xFF173D61) else Color(0xFF0E2B49)).border(1.dp, if (filled) FazaaGold else Color(0xFF3B6382), RoundedCornerShape(10.dp)), contentAlignment = Alignment.Center) {
                    Text(if (filled) "●" else "", color = FazaaGold, fontSize = 18.sp)
                }
            }
        }
        Box(Modifier.matchParentSize().padding(1.dp)) { inner() }
    }
}

@Composable
private fun StepProgress(active: Int, total: Int) {
    Row(horizontalArrangement = Arrangement.Center, verticalAlignment = Alignment.CenterVertically, modifier = Modifier.fillMaxWidth().padding(horizontal = 36.dp)) {
        repeat(total) { index ->
            Box(Modifier.size(8.dp).background(if (index <= active) FazaaGold else Color(0xFF31516D), androidx.compose.foundation.shape.CircleShape))
            if (index < total - 1) Box(Modifier.width(42.dp).height(1.dp).background(if (index < active) FazaaGold else Color(0xFF31516D)))
        }
    }
}

@Composable
private fun DarkPhoneField(value: String, onValueChange: (String) -> Unit) {
    Row(Modifier.fillMaxWidth().height(54.dp).border(1.dp, Color(0xFF3F6B8D), RoundedCornerShape(12.dp)).background(Color(0xFF123653), RoundedCornerShape(12.dp)).padding(horizontal = 14.dp), verticalAlignment = Alignment.CenterVertically) {
        Text("🇾🇪  +967", color = Color.White, fontSize = 14.sp)
        Spacer(Modifier.width(12.dp))
        BasicTextField(value = value, onValueChange = { onValueChange(it.filter(Char::isDigit).take(9)) }, modifier = Modifier.weight(1f), singleLine = true, textStyle = TextStyle(color = Color.White, fontSize = 15.sp, textAlign = TextAlign.End), keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone), decorationBox = { inner -> if (value.isEmpty()) Text("رقم الهاتف", color = Color.White.copy(alpha = .55f), modifier = Modifier.fillMaxWidth(), textAlign = TextAlign.End) else inner() })
    }
}

@Composable
private fun DarkRoleCard(title: String, subtitle: String, selected: Boolean, onClick: () -> Unit) {
    Card(onClick = onClick, modifier = Modifier.fillMaxWidth().height(82.dp), shape = RoundedCornerShape(13.dp), colors = CardDefaults.cardColors(containerColor = if (selected) Color(0xFF092D50) else Color(0xFF0B2948)), border = androidx.compose.foundation.BorderStroke(1.dp, if (selected) FazaaGold else Color(0xFF2F5B7D))) {
        Row(Modifier.fillMaxSize().padding(horizontal = 18.dp), verticalAlignment = Alignment.CenterVertically) {
            Icon(if (selected) Icons.Default.Phone else Icons.Default.Person, contentDescription = null, tint = FazaaGold, modifier = Modifier.size(30.dp))
            Spacer(Modifier.width(16.dp))
            Column(Modifier.weight(1f)) { Text(title, color = Color.White, fontSize = 16.sp, fontWeight = FontWeight.Bold); Text(subtitle, color = Color.White.copy(alpha = .65f), fontSize = 11.sp) }
            Text("‹", color = if (selected) FazaaGold else Color.White.copy(alpha = .7f), fontSize = 25.sp)
        }
    }
}

@Composable
private fun RoleChoice(title: String, subtitle: String, selected: Boolean, onClick: () -> Unit, modifier: Modifier) {
    Card(modifier = modifier, onClick = onClick, shape = RoundedCornerShape(16.dp), colors = CardDefaults.cardColors(containerColor = if (selected) FazaaNavy else Color.White)) {
        Column(Modifier.padding(10.dp), horizontalAlignment = Alignment.CenterHorizontally) { RadioButton(selected = selected, onClick = onClick); Text(title, color = if (selected) Color.White else FazaaNavy, fontWeight = FontWeight.Bold, fontSize = 13.sp); Text(subtitle, color = if (selected) Color.White.copy(alpha = .7f) else Color.Gray, fontSize = 10.sp, textAlign = TextAlign.Center) }
    }
}

@Composable
private fun FeaturePill(text: String) { Box(Modifier.background(Color.White.copy(alpha = .1f), RoundedCornerShape(14.dp)).padding(horizontal = 12.dp, vertical = 8.dp)) { Text(text, color = Color.White, fontSize = 11.sp) } }

@Composable
fun Logo(modifier: Modifier) { androidx.compose.foundation.Image(painter = painterResource(R.drawable.fazaah_logo), contentDescription = "فزعة", modifier = modifier) }
