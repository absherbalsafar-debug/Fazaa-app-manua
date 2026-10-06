package com.fazaah.app.presentation

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.location.LocationManager
import android.net.Uri
import android.util.Base64
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
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.clickable
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowForward
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.UploadFile
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Checkbox
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import com.fazaah.app.domain.model.Category
import com.fazaah.app.presentation.auth.AuthUiState
import com.fazaah.app.presentation.auth.UserRole
import com.fazaah.app.data.repository.CatalogRepository

private val RegistrationNavy = Color(0xFF092F62)
private val RegistrationGold = Color(0xFFF6C107)

@Composable
fun RegistrationProfileScreen(
    state: AuthUiState,
    catalogRepository: CatalogRepository,
    onName: (String) -> Unit,
    onWhatsapp: (String) -> Unit,
    onNationalId: (String) -> Unit,
    onSpecialty: (String) -> Unit,
    onBio: (String) -> Unit,
    onCategory: (Int?) -> Unit,
    onTerms: (Boolean) -> Unit,
    onLocation: (Double, Double) -> Unit,
    onSelfie: (String?) -> Unit,
    onIdFront: (String?) -> Unit,
    onIdBack: (String?) -> Unit,
    onSubmit: () -> Unit,
    onBack: () -> Unit,
) {
    val context = LocalContext.current
    var categories by remember { mutableStateOf<List<Category>>(emptyList()) }
    var locationMessage by remember { mutableStateOf<String?>(null) }
    var documentTarget by remember { mutableStateOf("selfie") }
    LaunchedEffect(state.role) { if (state.role == UserRole.PROVIDER) runCatching { categories = catalogRepository.categories() } }

    val locationPermission = rememberLauncherForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) { grants ->
        if (grants[Manifest.permission.ACCESS_FINE_LOCATION] == true || grants[Manifest.permission.ACCESS_COARSE_LOCATION] == true) {
            readLastLocation(context, onLocation) { locationMessage = it }
        } else locationMessage = "اسمح بالوصول إلى الموقع لإكمال التسجيل"
    }
    val documentPicker = rememberLauncherForActivityResult(ActivityResultContracts.OpenDocument()) { uri ->
        uri ?: return@rememberLauncherForActivityResult
        val encoded = uri.toBase64(context)
        when (documentTarget) { "selfie" -> onSelfie(encoded); "front" -> onIdFront(encoded); "back" -> onIdBack(encoded) }
    }

    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(horizontal = 20.dp, vertical = 16.dp)) {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
            IconButton(onClick = onBack) { Icon(Icons.Default.ArrowForward, contentDescription = "رجوع", tint = RegistrationNavy) }
            Logo(Modifier.size(70.dp))
            Text("بيانات الحساب", color = RegistrationNavy.copy(alpha = .6f), fontSize = 12.sp)
        }
        Spacer(Modifier.height(16.dp))
        Text(if (state.role == UserRole.PROVIDER) "أنشئ حسابك المهني" else "أكمل حسابك", color = RegistrationNavy, fontSize = 27.sp, fontWeight = FontWeight.ExtraBold)
        Text(if (state.role == UserRole.PROVIDER) "بياناتك تساعد العملاء على اختيارك بثقة" else "أدخل بياناتك الأساسية لنكمل إنشاء حسابك", color = Color.Gray, fontSize = 13.sp)
        Spacer(Modifier.height(18.dp))
        OutlinedTextField(state.name, onName, Modifier.fillMaxWidth(), label = { Text("الاسم الرباعي الكامل") }, leadingIcon = { Icon(Icons.Default.Person, null) }, singleLine = true)
        Spacer(Modifier.height(12.dp))
        LocationCard(state.latitude, state.longitude, locationMessage) {
            if (ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED || ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED) readLastLocation(context, onLocation) { locationMessage = it }
            else locationPermission.launch(arrayOf(Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION))
        }
        if (state.role == UserRole.PROVIDER) {
            Spacer(Modifier.height(12.dp))
            OutlinedTextField(state.whatsapp, onWhatsapp, Modifier.fillMaxWidth(), label = { Text("رقم واتساب") }, prefix = { Text("+967 ") }, singleLine = true)
            Spacer(Modifier.height(12.dp))
            OutlinedTextField(state.nationalId, onNationalId, Modifier.fillMaxWidth(), label = { Text("الرقم الوطني") }, singleLine = true)
            Spacer(Modifier.height(12.dp))
            CategoryMenu(categories, state.categoryId, onCategory)
            Spacer(Modifier.height(12.dp))
            OutlinedTextField(state.specialty, onSpecialty, Modifier.fillMaxWidth(), label = { Text("التخصص الفرعي") }, singleLine = true)
            Spacer(Modifier.height(12.dp))
            OutlinedTextField(state.bio, onBio, Modifier.fillMaxWidth().height(130.dp), label = { Text("وصف خبرتك وتخصصك — 50 حرفاً على الأقل") })
            Spacer(Modifier.height(14.dp))
            DocumentButton("الصورة الشخصية", state.selfieBase64 != null) { documentTarget = "selfie"; documentPicker.launch(arrayOf("image/*")) }
            DocumentButton("الهوية الوطنية — الوجه الأمامي", state.idFrontBase64 != null) { documentTarget = "front"; documentPicker.launch(arrayOf("image/*")) }
            DocumentButton("الهوية الوطنية — الوجه الخلفي", state.idBackBase64 != null) { documentTarget = "back"; documentPicker.launch(arrayOf("image/*")) }
            Row(verticalAlignment = Alignment.CenterVertically) { Checkbox(state.termsAccepted, onTerms); Text("أقر بصحة البيانات وأوافق على التعهد والشروط", color = RegistrationNavy, fontSize = 12.sp) }
        }
        state.message?.let { Text(it, color = Color(0xFFB3261E), modifier = Modifier.padding(vertical = 12.dp), textAlign = TextAlign.Center) }
        Spacer(Modifier.height(14.dp))
        Button(onClick = onSubmit, enabled = !state.loading, modifier = Modifier.fillMaxWidth().height(54.dp), colors = ButtonDefaults.buttonColors(containerColor = RegistrationGold, contentColor = RegistrationNavy)) {
            if (state.loading) CircularProgressIndicator(color = RegistrationNavy, modifier = Modifier.size(22.dp)) else Text("حفظ البيانات والمتابعة", fontWeight = FontWeight.ExtraBold)
        }
        Spacer(Modifier.height(24.dp))
    }
}

@Composable
private fun LocationCard(latitude: String, longitude: String, message: String?, onRead: () -> Unit) {
    Card(Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = Color.White)) {
        Row(Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Default.LocationOn, null, tint = RegistrationGold, modifier = Modifier.size(30.dp))
            Column(Modifier.weight(1f).padding(horizontal = 10.dp)) {
                Text("موقعك الحالي", color = RegistrationNavy, fontWeight = FontWeight.Bold)
                Text(if (latitude.isNotBlank() && longitude.isNotBlank()) "تم تحديد الموقع بدقة" else message ?: "مطلوب لإكمال التسجيل", color = if (latitude.isNotBlank()) Color(0xFF2E7D32) else Color.Gray, fontSize = 12.sp)
            }
            TextButton(onClick = onRead) { Text("تحديد", color = RegistrationNavy) }
        }
    }
}

@Composable
private fun CategoryMenu(categories: List<Category>, selected: Int?, onSelect: (Int?) -> Unit) {
    var expanded by remember { mutableStateOf(false) }
    val selectedName = categories.firstOrNull { it.id == selected }?.name ?: "اختر المجال الرئيسي"
    Column {
        OutlinedTextField(selectedName, {}, modifier = Modifier.fillMaxWidth().clickable { expanded = true }, readOnly = true, label = { Text("المجال الرئيسي") })
        DropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) { categories.forEach { category -> DropdownMenuItem(text = { Text(category.name) }, onClick = { onSelect(category.id); expanded = false }) } }
    }
}

@Composable
private fun DocumentButton(title: String, uploaded: Boolean, onClick: () -> Unit) {
    Card(onClick = onClick, modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp), colors = CardDefaults.cardColors(containerColor = if (uploaded) Color(0xFFE8F5E9) else Color.White)) {
        Row(Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) { Icon(if (uploaded) Icons.Default.CheckCircle else Icons.Default.UploadFile, null, tint = if (uploaded) Color(0xFF2E7D32) else RegistrationNavy); Spacer(Modifier.width(10.dp)); Text(if (uploaded) "$title — تم الإرفاق" else title, color = RegistrationNavy, fontWeight = FontWeight.Bold) }
    }
}

@Composable
fun PinSetupScreen(loading: Boolean, message: String?, onCreate: (String, String) -> Unit, onBack: () -> Unit) {
    var pin by remember { mutableStateOf("") }
    var confirmation by remember { mutableStateOf("") }
    Column(Modifier.fillMaxSize().padding(horizontal = 24.dp, vertical = 18.dp), horizontalAlignment = Alignment.CenterHorizontally) {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) { IconButton(onClick = onBack) { Icon(Icons.Default.ArrowForward, "رجوع", tint = RegistrationNavy) }; Logo(Modifier.size(70.dp)); Text("٠٣ / ٠٣", color = RegistrationNavy.copy(alpha = .6f)) }
        Spacer(Modifier.height(50.dp))
        Icon(Icons.Default.CheckCircle, null, tint = RegistrationGold, modifier = Modifier.size(52.dp))
        Text("أنشئ رمز الدخول الخاص بك", color = RegistrationNavy, fontSize = 25.sp, fontWeight = FontWeight.ExtraBold, textAlign = TextAlign.Center)
        Text("سيستخدم هذا الرمز عند عودتك إلى التطبيق", color = Color.Gray, textAlign = TextAlign.Center)
        Spacer(Modifier.height(24.dp))
        Text("الرمز الجديد", color = RegistrationNavy, fontWeight = FontWeight.Bold)
        PinBoxes(value = pin, onValueChange = { pin = it })
        Spacer(Modifier.height(16.dp))
        Text("تأكيد الرمز", color = RegistrationNavy, fontWeight = FontWeight.Bold)
        PinBoxes(value = confirmation, onValueChange = { confirmation = it })
        Spacer(Modifier.height(24.dp))
        Button(onClick = { onCreate(pin, confirmation) }, enabled = !loading && pin.length == 4 && confirmation.length == 4, modifier = Modifier.fillMaxWidth().height(54.dp), colors = ButtonDefaults.buttonColors(containerColor = RegistrationGold, contentColor = RegistrationNavy)) { if (loading) CircularProgressIndicator(color = RegistrationNavy, modifier = Modifier.size(22.dp)) else Text("حفظ رمز الدخول", fontWeight = FontWeight.ExtraBold) }
        message?.let { Text(it, color = Color(0xFFB3261E), textAlign = TextAlign.Center, modifier = Modifier.padding(top = 12.dp)) }
    }
}

private fun Uri.toBase64(context: Context): String? = runCatching { context.contentResolver.openInputStream(this)?.use { Base64.encodeToString(it.readBytes(), Base64.NO_WRAP) } }.getOrNull()

private fun readLastLocation(context: Context, onLocation: (Double, Double) -> Unit, onError: (String) -> Unit) {
    if (ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED && ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) { onError("اسمح بالموقع أولاً"); return }
    runCatching {
        val manager = context.getSystemService(Context.LOCATION_SERVICE) as LocationManager
        val location = manager.getLastKnownLocation(LocationManager.GPS_PROVIDER) ?: manager.getLastKnownLocation(LocationManager.NETWORK_PROVIDER)
        if (location == null) onError("تعذر قراءة موقعك. فعّل GPS وحاول مرة أخرى") else onLocation(location.latitude, location.longitude)
    }.onFailure { onError("تعذر قراءة الموقع حالياً") }
}
