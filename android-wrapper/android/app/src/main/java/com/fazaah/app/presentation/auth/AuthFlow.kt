package com.fazaah.app.presentation.auth

import android.util.Base64
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.ArrowForward
import androidx.compose.material.icons.filled.BusinessCenter
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.VerifiedUser
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Checkbox
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.platform.LocalContext
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.fazaah.app.R
import androidx.compose.ui.res.painterResource

private val Navy = Color(0xFF102443)
private val Gold = Color(0xFFF5B335)
private val Page = Color(0xFFF5F7F9)
private val Muted = Color(0xFF68778D)

@Composable
fun AuthFlow(viewModel: AuthViewModel, onAuthenticated: (UserRole) -> Unit) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    when (state.step) {
        AuthStep.PHONE -> PhoneStep(state, viewModel)
        AuthStep.OTP -> OtpStep(state, viewModel)
        AuthStep.PROFILE -> ProfileStep(state, viewModel)
        AuthStep.FORGOT -> ForgotPasswordStep(state, viewModel)
        AuthStep.HOME -> onAuthenticated(state.role)
    }
}

@Composable
private fun AuthFrame(title: String, subtitle: String, back: (() -> Unit)? = null, content: @Composable () -> Unit) {
    Surface(modifier = Modifier.fillMaxSize(), color = Page) {
        Column(modifier = Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(horizontal = 20.dp, vertical = 24.dp), horizontalAlignment = Alignment.CenterHorizontally) {
            Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.SpaceBetween) {
                if (back != null) IconButton(onClick = back) { Icon(Icons.Default.ArrowForward, "رجوع", tint = Navy) } else Spacer(Modifier.size(48.dp))
                ImageLogo(Modifier.size(width = 128.dp, height = 144.dp))
                Spacer(Modifier.size(48.dp))
            }
            Spacer(Modifier.height(14.dp))
            Text("خدمة تستحق الثقة", color = Color(0xFFB57920), fontSize = 11.sp, fontWeight = FontWeight.Bold)
            Spacer(Modifier.height(8.dp))
            Text(title, color = Navy, fontSize = 34.sp, fontWeight = FontWeight.Black, textAlign = TextAlign.Center, lineHeight = 40.sp)
            Spacer(Modifier.height(7.dp))
            Text(subtitle, color = Muted, fontSize = 13.sp, textAlign = TextAlign.Center, lineHeight = 21.sp)
            Spacer(Modifier.height(24.dp))
            content()
        }
    }
}

@Composable
private fun ImageLogo(modifier: Modifier = Modifier) {
    androidx.compose.foundation.Image(painter = painterResource(R.drawable.fazaah_logo), contentDescription = "فزعة", modifier = modifier)
}

@Composable
private fun PhoneStep(state: AuthUiState, viewModel: AuthViewModel) {
    var selectingRole by remember { mutableStateOf(false) }
    var emailMode by remember { mutableStateOf(false) }
    AuthFrame("أهلاً بك في فزعة", "منصة توصلك بأفضل المهنيين والفنيين لإنجاز احتياجاتك بسهولة وسرعة.") {
        if (!selectingRole) {
            Card(shape = RoundedCornerShape(26.dp), colors = CardDefaults.cardColors(containerColor = Color.White), modifier = Modifier.fillMaxWidth()) {
                Column(Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) { Icon(Icons.Default.Lock, null, tint = Gold); Spacer(Modifier.width(8.dp)); Text("دخول آمن وسريع", color = Navy, fontWeight = FontWeight.Black) }
                    Text("اختر نوع حسابك أولاً", color = Muted, fontSize = 12.sp)
                    RoleChoice("أبحث عن خدمة", "أصل إلى الشخص المناسب بثقة", Icons.Default.Person, state.role == UserRole.CLIENT) { viewModel.setRole(UserRole.CLIENT) }
                    RoleChoice("أقدّم خدمة", "أحوّل خبرتي إلى فرص حقيقية", Icons.Default.BusinessCenter, state.role == UserRole.PROVIDER) { viewModel.setRole(UserRole.PROVIDER) }
                    if (emailMode) {
                        OutlinedTextField(value = state.email, onValueChange = viewModel::setEmail, modifier = Modifier.fillMaxWidth(), label = { Text("البريد الإلكتروني") }, placeholder = { Text("name@example.com") }, singleLine = true, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email), leadingIcon = { Icon(Icons.Default.Email, null) })
                        OutlinedTextField(value = state.password, onValueChange = viewModel::setPassword, modifier = Modifier.fillMaxWidth(), label = { Text("كلمة المرور") }, singleLine = true, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password), leadingIcon = { Icon(Icons.Default.Lock, null) })
                    } else {
                        OutlinedTextField(value = state.phone, onValueChange = viewModel::setPhone, modifier = Modifier.fillMaxWidth(), label = { Text("رقم الجوال") }, placeholder = { Text("7xxxxxxxx") }, singleLine = true, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone), leadingIcon = { Icon(Icons.Default.Phone, null) })
                    }
                    state.message?.let { Text(it, color = Color(0xFFB42318), fontSize = 12.sp) }
                    Button(onClick = if (emailMode) viewModel::loginEmail else viewModel::sendOtp, enabled = if (emailMode) state.email.contains("@") && state.password.length >= 6 && !state.loading else state.phone.length >= 9 && !state.loading, modifier = Modifier.fillMaxWidth().height(54.dp), shape = RoundedCornerShape(16.dp), colors = ButtonDefaults.buttonColors(containerColor = Navy)) { if (state.loading) CircularProgressIndicator(color = Gold, modifier = Modifier.size(20.dp)) else { Text(if (emailMode) "دخول إلى حسابي" else "المتابعة برمز التحقق", fontWeight = FontWeight.Black); Spacer(Modifier.width(7.dp)); Icon(Icons.Default.ArrowBack, null, tint = Gold) } }
                    if (emailMode) TextButton(onClick = viewModel::openForgotPassword, modifier = Modifier.align(Alignment.End)) { Text("نسيت كلمة المرور؟", color = Color(0xFFB57920), fontWeight = FontWeight.Bold) }
                    Text("أو", modifier = Modifier.fillMaxWidth(), textAlign = TextAlign.Center, color = Muted, fontSize = 12.sp)
                    OutlinedButton(onClick = { emailMode = !emailMode }, modifier = Modifier.fillMaxWidth().height(48.dp), shape = RoundedCornerShape(14.dp)) { Icon(if (emailMode) Icons.Default.Phone else Icons.Default.Email, null, tint = Color(0xFF4285F4)); Spacer(Modifier.width(8.dp)); Text(if (emailMode) "الدخول برقم الجوال" else "الدخول بالبريد الإلكتروني") }
                }
            }
        } else {
            Text("اختر الطريقة المناسبة لك", color = Navy, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
private fun RoleChoice(title: String, description: String, icon: androidx.compose.ui.graphics.vector.ImageVector, selected: Boolean, onClick: () -> Unit) {
    OutlinedButton(onClick = onClick, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(18.dp), colors = ButtonDefaults.outlinedButtonColors(containerColor = if (selected) Navy else Color.White, contentColor = if (selected) Color.White else Navy)) {
        Icon(icon, null, tint = if (selected) Gold else Navy); Spacer(Modifier.width(10.dp)); Column(Modifier.weight(1f), horizontalAlignment = Alignment.Start) { Text(title, fontWeight = FontWeight.Bold); Text(description, fontSize = 10.sp, color = if (selected) Color.White.copy(.7f) else Muted) }; if (selected) Icon(Icons.Default.Check, null, tint = Gold)
    }
}

@Composable
private fun ForgotPasswordStep(state: AuthUiState, viewModel: AuthViewModel) {
    AuthFrame("استعادة كلمة المرور", "أدخل بريدك الإلكتروني وسنرسل لك رابط الاستعادة.", viewModel::goBack) {
        Card(shape = RoundedCornerShape(26.dp), colors = CardDefaults.cardColors(containerColor = Color.White), modifier = Modifier.fillMaxWidth()) {
            Column(Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
                Icon(Icons.Default.Email, null, tint = Gold, modifier = Modifier.size(40.dp).align(Alignment.CenterHorizontally))
                OutlinedTextField(value = state.resetEmail, onValueChange = viewModel::setResetEmail, modifier = Modifier.fillMaxWidth(), label = { Text("البريد الإلكتروني") }, singleLine = true, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email), leadingIcon = { Icon(Icons.Default.Email, null) })
                state.message?.let { Text(it, color = if (state.resetToken == null) Color(0xFFB42318) else Color(0xFF16833B), fontSize = 12.sp) }
                state.resetToken?.let { token -> Text("رمز التطوير: $token", color = Color(0xFFB57920), fontSize = 12.sp) }
                Button(onClick = viewModel::forgotPassword, enabled = state.resetEmail.contains("@") && !state.loading, modifier = Modifier.fillMaxWidth().height(54.dp), shape = RoundedCornerShape(16.dp), colors = ButtonDefaults.buttonColors(containerColor = Navy)) { if (state.loading) CircularProgressIndicator(color = Gold, modifier = Modifier.size(20.dp)) else Text("إرسال رابط الاستعادة", fontWeight = FontWeight.Black) }
            }
        }
    }
}

@Composable
private fun OtpStep(state: AuthUiState, viewModel: AuthViewModel) {
    AuthFrame("تحقق من رقمك", "أدخل رمز التحقق المكوّن من 6 أرقام الذي أرسلناه إلى رقم الجوال.", viewModel::goBack) {
        Card(shape = RoundedCornerShape(26.dp), colors = CardDefaults.cardColors(containerColor = Color.White), modifier = Modifier.fillMaxWidth()) {
            Column(Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
                Icon(Icons.Default.VerifiedUser, null, tint = Gold, modifier = Modifier.size(38.dp).align(Alignment.CenterHorizontally))
                OutlinedTextField(value = state.code, onValueChange = viewModel::setCode, modifier = Modifier.fillMaxWidth(), label = { Text("رمز التحقق") }, singleLine = true, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number), leadingIcon = { Icon(Icons.Default.Lock, null) })
                state.developmentOtp?.let { Text("رمز الاختبار الحالي: $it", color = Color(0xFFB57920), fontSize = 12.sp, textAlign = TextAlign.Center, modifier = Modifier.fillMaxWidth()) }
                state.message?.let { Text(it, color = Color(0xFFB42318), fontSize = 12.sp) }
                Button(onClick = viewModel::verifyLogin, enabled = state.code.length == 6 && !state.loading, modifier = Modifier.fillMaxWidth().height(54.dp), shape = RoundedCornerShape(16.dp), colors = ButtonDefaults.buttonColors(containerColor = Navy)) { Text("تأكيد الرمز", fontWeight = FontWeight.Black) }
                Text("لم يصلك الرمز؟ أعد الإرسال", color = Muted, fontSize = 12.sp, modifier = Modifier.align(Alignment.CenterHorizontally))
            }
        }
    }
}

@Composable
private fun ProfileStep(state: AuthUiState, viewModel: AuthViewModel) {
    val context = LocalContext.current
    var target by remember { mutableStateOf("selfie") }
    val picker = rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        if (uri != null) context.contentResolver.openInputStream(uri)?.use { stream -> Base64.encodeToString(stream.readBytes(), Base64.NO_WRAP) }?.let { data -> when (target) { "selfie" -> viewModel.setSelfie(data); "front" -> viewModel.setIdFront(data); else -> viewModel.setIdBack(data) } }
    }
    AuthFrame("أكمل ملفك في فزعة", "نحتاج بعض البيانات لنجهز لك تجربة مناسبة وآمنة.", viewModel::goBack) {
        Card(shape = RoundedCornerShape(26.dp), colors = CardDefaults.cardColors(containerColor = Color.White), modifier = Modifier.fillMaxWidth()) {
            Column(Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(11.dp)) {
                OutlinedTextField(state.name, viewModel::setName, modifier = Modifier.fillMaxWidth(), label = { Text("الاسم الرباعي") }, singleLine = true)
                OutlinedTextField(state.latitude, viewModel::setLatitude, modifier = Modifier.fillMaxWidth(), label = { Text("خط العرض") }, singleLine = true)
                OutlinedTextField(state.longitude, viewModel::setLongitude, modifier = Modifier.fillMaxWidth(), label = { Text("خط الطول") }, singleLine = true)
                OutlinedTextField(state.city, viewModel::setCity, modifier = Modifier.fillMaxWidth(), label = { Text("المدينة") }, singleLine = true)
                OutlinedTextField(state.district, viewModel::setDistrict, modifier = Modifier.fillMaxWidth(), label = { Text("المنطقة / الحي") }, singleLine = true)
                if (state.role == UserRole.PROVIDER) {
                    OutlinedTextField(state.whatsapp, viewModel::setWhatsapp, modifier = Modifier.fillMaxWidth(), label = { Text("رقم الواتساب") }, singleLine = true, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone))
                    OutlinedTextField(state.specialty, viewModel::setSpecialty, modifier = Modifier.fillMaxWidth(), label = { Text("التخصص") }, singleLine = true)
                    OutlinedTextField(state.bio, viewModel::setBio, modifier = Modifier.fillMaxWidth(), label = { Text("نبذة عن خبرتك") }, minLines = 3)
                    DocumentPickerRow("الصورة الشخصية", state.selfieBase64 != null) { target = "selfie"; picker.launch("image/*") }
                    DocumentPickerRow("الهوية الأمامية", state.idFrontBase64 != null) { target = "front"; picker.launch("image/*") }
                    DocumentPickerRow("الهوية الخلفية", state.idBackBase64 != null) { target = "back"; picker.launch("image/*") }
                }
                Row(verticalAlignment = Alignment.CenterVertically) { Checkbox(checked = state.termsAccepted, onCheckedChange = viewModel::setTermsAccepted); Text("أوافق على شروط الاستخدام وسياسة الخصوصية", fontSize = 11.sp, color = Muted) }
                state.message?.let { Text(it, color = Color(0xFFB42318), fontSize = 12.sp) }
                Button(onClick = viewModel::completeProfile, enabled = state.name.trim().split(" ").count { it.isNotBlank() } >= 4 && !state.loading, modifier = Modifier.fillMaxWidth().height(54.dp), shape = RoundedCornerShape(16.dp), colors = ButtonDefaults.buttonColors(containerColor = Navy)) { if (state.loading) CircularProgressIndicator(color = Gold, modifier = Modifier.size(20.dp)) else Text("حفظ والبدء", fontWeight = FontWeight.Black) }
            }
        }
    }
}

@Composable
private fun DocumentPickerRow(label: String, selected: Boolean, onPick: () -> Unit) { Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.SpaceBetween) { Text(if (selected) "✓ $label" else label, color = if (selected) Color(0xFF16833B) else Navy, fontSize = 12.sp); TextButton(onClick = onPick) { Text(if (selected) "تغيير" else "اختيار") } } }
