package com.fazaah.app.presentation

import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
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
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
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
            else -> Unit
        }
    }

    MaterialTheme(colorScheme = lightColorScheme(primary = FazaaNavy, secondary = FazaaGold, background = FazaaCream)) {
        Surface(modifier = Modifier.fillMaxSize(), color = FazaaCream) {
            NavHost(navController = navController, startDestination = initialRoute) {
                composable("welcome") {
                    WelcomeScreen(onStart = {
                        onWelcomeSeen()
                        navController.navigate("phone")
                    })
                }
                composable("phone") {
                    PhoneLoginScreen(
                        state = state,
                        onBack = { onExit() },
                        onRole = authViewModel::setRole,
                        onPhone = authViewModel::setPhone,
                        onPin = authViewModel::setPin,
                        onSendOtp = authViewModel::sendOtp,
                        onPinLogin = authViewModel::loginWithPin,
                        onShowOtp = { authViewModel.resetToPhone(); navController.navigate("phone") },
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
    Column(
        modifier = Modifier.fillMaxSize().background(FazaaNavy).padding(horizontal = 24.dp, vertical = 28.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.SpaceBetween,
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Spacer(Modifier.height(18.dp))
            Logo(modifier = Modifier.size(118.dp))
            Text("خدمة تستحق الثقة", color = FazaaGold, fontSize = 13.sp, fontWeight = FontWeight.Bold)
            Spacer(Modifier.height(26.dp))
            Text("أهلاً وسهلاً بك في", color = Color.White, fontSize = 28.sp, fontWeight = FontWeight.ExtraBold)
            Text("فزعة", color = FazaaGold, fontSize = 36.sp, fontWeight = FontWeight.ExtraBold)
            Spacer(Modifier.height(10.dp))
            Text("منصة توصلك بأفضل المهنيين والفنيين لإنجاز احتياجاتك بسهولة وسرعة.", color = Color.White.copy(alpha = .72f), textAlign = TextAlign.Center, fontSize = 14.sp)
        }
        Card(
            modifier = Modifier.fillMaxWidth().height(245.dp),
            shape = RoundedCornerShape(32.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White.copy(alpha = .08f)),
        ) {
            Column(Modifier.fillMaxSize().padding(18.dp), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) {
                Icon(Icons.Default.Search, contentDescription = null, tint = FazaaGold, modifier = Modifier.size(54.dp))
                Spacer(Modifier.height(12.dp))
                Text("خدماتك أقرب", color = Color.White, fontSize = 22.sp, fontWeight = FontWeight.Bold)
                Text("الشخص المناسب في الوقت المناسب", color = Color.White.copy(alpha = .75f), fontSize = 14.sp)
                Spacer(Modifier.height(18.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    FeaturePill("مهنيون موثوقون")
                    FeaturePill("تواصل سريع")
                }
            }
        }
        Button(onClick = onStart, modifier = Modifier.fillMaxWidth().height(56.dp), shape = RoundedCornerShape(18.dp), colors = ButtonDefaults.buttonColors(containerColor = FazaaGold, contentColor = FazaaNavy)) {
            Text("لنبدأ", fontSize = 18.sp, fontWeight = FontWeight.ExtraBold)
            Spacer(Modifier.width(8.dp))
            Icon(Icons.Default.ArrowBack, contentDescription = null)
        }
    }
}

@Composable
private fun PhoneLoginScreen(
    state: com.fazaah.app.presentation.auth.AuthUiState,
    onBack: () -> Unit,
    onRole: (UserRole) -> Unit,
    onPhone: (String) -> Unit,
    onPin: (String) -> Unit,
    onSendOtp: () -> Unit,
    onPinLogin: () -> Unit,
    onShowOtp: () -> Unit,
) {
    Column(Modifier.fillMaxSize().padding(horizontal = 22.dp, vertical = 18.dp), horizontalAlignment = Alignment.CenterHorizontally) {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
            IconButton(onClick = onBack) { Icon(Icons.Default.ArrowForward, contentDescription = "رجوع", tint = FazaaNavy) }
            Logo(modifier = Modifier.size(72.dp))
            Text("٠١ / ٠٣", color = FazaaNavy.copy(alpha = .55f), fontSize = 12.sp)
        }
        Spacer(Modifier.height(26.dp))
        Icon(Icons.Default.Phone, contentDescription = null, tint = FazaaGold, modifier = Modifier.size(40.dp))
        Text("التحقق الآمن", color = FazaaGold, fontSize = 13.sp, fontWeight = FontWeight.Bold)
        Text("أدخل رقم هاتفك", color = FazaaNavy, fontSize = 28.sp, fontWeight = FontWeight.ExtraBold)
        Text("سنرسل رمزاً قصيراً إلى رقمك لتبدأ تجربتك بأمان.", color = Color.Gray, textAlign = TextAlign.Center, fontSize = 13.sp)
        Spacer(Modifier.height(22.dp))
        Text("كيف ستستخدم فزعة؟", color = FazaaNavy, fontWeight = FontWeight.Bold)
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            RoleChoice("أبحث عن خدمة", "أفضل الخدمات والمهنيين", state.role == UserRole.CLIENT, { onRole(UserRole.CLIENT) }, Modifier.weight(1f))
            RoleChoice("أقدّم خدمة", "أدير عملي وأستقبل الطلبات", state.role == UserRole.PROVIDER, { onRole(UserRole.PROVIDER) }, Modifier.weight(1f))
        }
        Spacer(Modifier.height(14.dp))
        OutlinedTextField(value = state.phone, onValueChange = onPhone, modifier = Modifier.fillMaxWidth(), label = { Text("رقم الهاتف") }, placeholder = { Text("7XXXXXXXX") }, prefix = { Text("+967 ") }, singleLine = true, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone), shape = RoundedCornerShape(16.dp))
        Spacer(Modifier.height(14.dp))
        Button(onClick = onSendOtp, enabled = !state.loading && state.phone.length >= 9, modifier = Modifier.fillMaxWidth().height(54.dp), shape = RoundedCornerShape(16.dp), colors = ButtonDefaults.buttonColors(containerColor = FazaaNavy)) {
            if (state.loading) CircularProgressIndicator(color = Color.White, modifier = Modifier.size(22.dp)) else Text("إرسال رمز التحقق", fontWeight = FontWeight.Bold)
        }
        Spacer(Modifier.height(16.dp))
        Card(Modifier.fillMaxWidth(), shape = RoundedCornerShape(20.dp), colors = CardDefaults.cardColors(containerColor = Color.White)) {
            Column(Modifier.padding(16.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                Row(verticalAlignment = Alignment.CenterVertically) { Icon(Icons.Default.Lock, contentDescription = null, tint = FazaaGold); Spacer(Modifier.width(6.dp)); Text("الدخول السريع بالرمز السري", color = FazaaNavy, fontWeight = FontWeight.Bold) }
                Spacer(Modifier.height(12.dp))
                PinBoxes(value = state.pin, onValueChange = onPin)
                Spacer(Modifier.height(12.dp))
                Button(onClick = onPinLogin, enabled = !state.loading && state.pin.length == 4 && state.phone.length >= 9, modifier = Modifier.fillMaxWidth().height(48.dp), shape = RoundedCornerShape(14.dp), colors = ButtonDefaults.buttonColors(containerColor = FazaaGold, contentColor = FazaaNavy)) { Text("دخول بالرمز السري", fontWeight = FontWeight.ExtraBold) }
                TextButton(onClick = onShowOtp) { Text("نسيت الرمز؟ استخدم رمز التحقق", color = FazaaNavy) }
            }
        }
        state.message?.let { Text(it, color = Color(0xFFB3261E), textAlign = TextAlign.Center, modifier = Modifier.padding(top = 12.dp)) }
    }
}

@Composable
private fun OtpScreen(phone: String, otp: String, developmentOtp: String?, loading: Boolean, message: String?, onBack: () -> Unit, onOtp: (String) -> Unit, onVerify: () -> Unit, onResend: () -> Unit) {
    Column(Modifier.fillMaxSize().padding(horizontal = 22.dp, vertical = 18.dp), horizontalAlignment = Alignment.CenterHorizontally) {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) { IconButton(onClick = onBack) { Icon(Icons.Default.ArrowForward, contentDescription = "رجوع") }; Logo(Modifier.size(72.dp)); Text("٠٢ / ٠٣", color = FazaaNavy.copy(alpha = .55f), fontSize = 12.sp) }
        Spacer(Modifier.height(45.dp))
        Text("تحقق من رقم الجوال", color = FazaaNavy, fontSize = 26.sp, fontWeight = FontWeight.ExtraBold)
        Text("أدخل الرمز المكون من 6 أرقام المرسل إلى +967 $phone", color = Color.Gray, textAlign = TextAlign.Center)
        Spacer(Modifier.height(28.dp))
        OtpBoxes(value = otp, onValueChange = onOtp)
        developmentOtp?.let { Card(Modifier.fillMaxWidth().padding(top = 22.dp), colors = CardDefaults.cardColors(containerColor = Color(0xFFFFF5D7))) { Text("رمز التطوير الظاهر مؤقتاً: $it", Modifier.padding(16.dp), color = FazaaNavy, fontWeight = FontWeight.Bold, textAlign = TextAlign.Center) } }
        Spacer(Modifier.height(22.dp))
        Button(onClick = onVerify, enabled = !loading && otp.length == 6, modifier = Modifier.fillMaxWidth().height(54.dp), shape = RoundedCornerShape(16.dp), colors = ButtonDefaults.buttonColors(containerColor = FazaaNavy)) { if (loading) CircularProgressIndicator(color = Color.White, modifier = Modifier.size(22.dp)) else Text("تأكيد الرمز", fontWeight = FontWeight.Bold) }
        TextButton(onClick = onResend) { Text("إعادة إرسال الرمز", color = FazaaNavy) }
        message?.let { Text(it, color = Color(0xFFB3261E), textAlign = TextAlign.Center) }
    }
}

@Composable
private fun PinBoxes(value: String, onValueChange: (String) -> Unit) = BasicTextField(value = value, onValueChange = { onValueChange(it.filter(Char::isDigit).take(4)) }, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.NumberPassword), visualTransformation = PasswordVisualTransformation(), singleLine = true, textStyle = TextStyle(color = Color.Transparent), decorationBox = { inner -> PinRow(value, 4, inner) })

@Composable
private fun OtpBoxes(value: String, onValueChange: (String) -> Unit) = BasicTextField(value = value, onValueChange = { onValueChange(it.filter(Char::isDigit).take(6)) }, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number), singleLine = true, textStyle = TextStyle(color = Color.Transparent), decorationBox = { inner -> PinRow(value, 6, inner) })

@Composable
private fun PinRow(value: String, count: Int, inner: @Composable () -> Unit) {
    Box(contentAlignment = Alignment.Center) {
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            repeat(count) { index ->
                val filled = index < value.length
                Box(Modifier.size(if (count == 4) 58.dp else 44.dp).clip(RoundedCornerShape(13.dp)).background(if (filled) FazaaNavy else Color.White).border(1.dp, if (filled) FazaaGold else FazaaNavy.copy(alpha = .25f), RoundedCornerShape(13.dp)), contentAlignment = Alignment.Center) {
                    Text(if (filled) "●" else "", color = if (filled) FazaaGold else FazaaNavy, fontSize = 18.sp)
                }
            }
        }
        Box(Modifier.matchParentSize().padding(1.dp)) { inner() }
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
private fun Logo(modifier: Modifier) { androidx.compose.foundation.Image(painter = painterResource(R.drawable.fazaah_logo), contentDescription = "فزعة", modifier = modifier) }
