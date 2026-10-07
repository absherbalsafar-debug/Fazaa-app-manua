package com.fazaah.app.presentation.utility

import android.content.Intent
import android.net.Uri
import android.util.Base64
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.HelpOutline
import androidx.compose.material.icons.filled.UploadFile
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.produceState
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.platform.LocalContext
import com.fazaah.app.data.repository.AuthRepository
import androidx.navigation.NavHostController
import com.fazaah.app.data.repository.SubscriptionRepository
import com.fazaah.app.data.repository.CatalogRepository
import com.fazaah.app.domain.model.SubscriptionCheckoutRequest
import kotlinx.coroutines.launch

@Composable
fun ProviderBusinessScreen(repository: CatalogRepository, subscriptionRepository: SubscriptionRepository, navController: NavHostController) {
    val profile by produceState<com.fazaah.app.domain.model.ProviderSummary?>(initialValue = null) { value = runCatching { repository.providerProfile() }.getOrNull() }
    val business by produceState<com.fazaah.app.domain.model.ProviderBusinessSummary?>(initialValue = null) { value = runCatching { subscriptionRepository.business() }.getOrNull() }
    var name by remember { mutableStateOf("") }
    var category by remember { mutableStateOf("") }
    var specialty by remember { mutableStateOf("") }
    var bio by remember { mutableStateOf("") }
    var whatsapp by remember { mutableStateOf("") }
    var saving by remember { mutableStateOf(false) }
    var message by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()
    LaunchedEffect(profile) { profile?.let { name = it.name; specialty = it.specialty; bio = it.bio; whatsapp = it.phone } }
    FormPage("بيانات النشاط المهني", "أكمل بيانات نشاطك ليظهر ملفك بشكل واضح للعملاء.", navController) {
        if (profile == null) CircularProgressIndicator(modifier = Modifier.align(Alignment.CenterHorizontally))
        business?.let { summary ->
            Card(modifier = Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primary), shape = RoundedCornerShape(22.dp)) { Column(Modifier.padding(18.dp)) { Text("الاشتراك والإعلانات", color = androidx.compose.ui.graphics.Color.White, fontWeight = FontWeight.Black, style = MaterialTheme.typography.titleLarge); Text(if (summary.subscription.status == "active") "اشتراك ${summary.subscription.plan ?: "نشط"}" else "لا يوجد اشتراك فعال", color = androidx.compose.ui.graphics.Color.White.copy(alpha = .72f)); Text("المقاعد المجانية المتبقية: ${summary.freeSlotsRemaining}", color = androidx.compose.ui.graphics.Color.White.copy(alpha = .72f), style = MaterialTheme.typography.bodySmall) } }
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) { BusinessMetric("مشاهدات الملف", summary.metrics.profileViews, Modifier.weight(1f)); BusinessMetric("طلبات الخدمة", summary.metrics.serviceRequests, Modifier.weight(1f)) }
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) { BusinessMetric("ضغطات الاتصال", summary.metrics.callClicks, Modifier.weight(1f)); BusinessMetric("ضغطات واتساب", summary.metrics.whatsappClicks, Modifier.weight(1f)) }
        }
        OutlinedTextField(name, { name = it }, label = { Text("اسم النشاط") }, modifier = Modifier.fillMaxWidth(), singleLine = true)
        OutlinedTextField(category, { category = it }, label = { Text("المجال") }, modifier = Modifier.fillMaxWidth(), singleLine = true)
        OutlinedTextField(specialty, { specialty = it }, label = { Text("التخصص") }, modifier = Modifier.fillMaxWidth(), singleLine = true)
        OutlinedTextField(bio, { bio = it }, label = { Text("وصف النشاط والخبرة") }, modifier = Modifier.fillMaxWidth(), minLines = 4)
        OutlinedTextField(whatsapp, { whatsapp = it }, label = { Text("رقم الواتساب") }, modifier = Modifier.fillMaxWidth(), singleLine = true)
        message?.let { Text(it, color = MaterialTheme.colorScheme.primary) }
        Button(onClick = { profile?.let { current -> scope.launch { saving = true; message = runCatching { repository.updateBusiness(current.id, name.trim(), specialty.trim(), bio.trim(), whatsapp.trim()); "تم حفظ بيانات النشاط" }.getOrElse { it.message ?: "تعذر حفظ البيانات" }; saving = false } } }, enabled = profile != null && !saving && name.isNotBlank(), modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(16.dp)) { Text(if (saving) "جارٍ الحفظ..." else "حفظ بيانات النشاط", fontWeight = FontWeight.Bold) }
    }
}

@Composable
private fun BusinessMetric(label: String, value: Int, modifier: Modifier) { Card(modifier = modifier, shape = RoundedCornerShape(16.dp)) { Column(Modifier.padding(14.dp)) { Text(value.toString(), fontWeight = FontWeight.Black, style = MaterialTheme.typography.titleLarge); Text(label, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant) } } }

@Composable
fun VerifyProviderScreen(authRepository: AuthRepository, navController: NavHostController) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var front by remember { mutableStateOf<Uri?>(null) }
    var back by remember { mutableStateOf<Uri?>(null) }
    var selfie by remember { mutableStateOf<Uri?>(null) }
    var uploading by remember { mutableStateOf(false) }
    var message by remember { mutableStateOf<String?>(null) }
    var target by remember { mutableStateOf("front") }
    val picker = rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        when (target) { "front" -> front = uri; "back" -> back = uri; else -> selfie = uri }
    }
    FormPage("توثيق الملف المهني", "ارفع المستندات المطلوبة لمراجعة واعتماد ملفك.", navController) {
        UploadRow("صورة الهوية الأمامية", front != null) { target = "front"; picker.launch("image/*") }
        UploadRow("صورة الهوية الخلفية", back != null) { target = "back"; picker.launch("image/*") }
        UploadRow("الصورة الشخصية", selfie != null) { target = "selfie"; picker.launch("image/*") }
        Text("لن تظهر مستنداتك للعملاء، وتستخدم للمراجعة فقط.", color = MaterialTheme.colorScheme.onSurfaceVariant, style = MaterialTheme.typography.bodySmall)
        message?.let { Text(it, color = MaterialTheme.colorScheme.primary) }
        Button(onClick = { scope.launch { uploading = true; message = runCatching { listOf("id_front" to front, "id_back" to back, "selfie" to selfie).forEach { (type, uri) -> if (uri != null) { val data = context.contentResolver.openInputStream(uri)?.use { Base64.encodeToString(it.readBytes(), Base64.NO_WRAP) } ?: error("تعذر قراءة الملف"); authRepository.uploadVerificationDocument(com.fazaah.app.domain.model.VerificationDocumentRequest(type, "$type.jpg", dataBase64 = data)) } }; "تم إرسال المستندات للمراجعة" }.getOrElse { it.message ?: "تعذر رفع المستندات" }; uploading = false } }, enabled = !uploading && front != null && back != null && selfie != null, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(16.dp)) { Text(if (uploading) "جارٍ الرفع..." else "إرسال للمراجعة", fontWeight = FontWeight.Bold) }
    }
}

@Composable
private fun UploadRow(label: String, selected: Boolean, onPick: () -> Unit) {
    Card(modifier = Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface), shape = RoundedCornerShape(16.dp)) {
        Row(Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) { Icon(if (selected) Icons.Default.CheckCircle else Icons.Default.UploadFile, null, tint = MaterialTheme.colorScheme.primary); Column(Modifier.weight(1f).padding(horizontal = 12.dp)) { Text(label, fontWeight = FontWeight.Bold); Text(if (selected) "تم اختيار الملف" else "لم يتم اختيار ملف", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant) }; TextButton(onClick = onPick) { Text("اختيار") } }
    }
}

@Composable
fun ProviderSubscriptionScreen(repository: SubscriptionRepository, navController: NavHostController) {
    val state by produceState<SubscriptionUiState>(initialValue = SubscriptionUiState(loading = true)) {
        value = runCatching { SubscriptionUiState(plans = repository.plans()) }.getOrElse { SubscriptionUiState(error = it.message ?: "تعذر تحميل الباقات") }
    }
    val scope = rememberCoroutineScope()
    var checkoutMessage by remember { mutableStateOf<String?>(null) }
    FormPage("الاشتراك والإعلانات", "اختر الباقة المناسبة لزيادة ظهور ملفك المهني.", navController) {
        if (state.loading) CircularProgressIndicator(modifier = Modifier.align(Alignment.CenterHorizontally))
        state.error?.let { Text(it, color = MaterialTheme.colorScheme.error) }
        if (!state.loading && state.plans.isEmpty() && state.error == null) Text("لا توجد باقات متاحة حاليًا.", color = MaterialTheme.colorScheme.onSurfaceVariant)
        checkoutMessage?.let { Text(it, color = MaterialTheme.colorScheme.primary) }
        state.plans.forEach { plan -> Card(modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(18.dp)) { Column(Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) { Text(plan.title ?: plan.name ?: "باقة فزعة", fontWeight = FontWeight.Black, style = MaterialTheme.typography.titleMedium); Text(plan.description ?: "ظهور أفضل وميزات إضافية لملفك.", color = MaterialTheme.colorScheme.onSurfaceVariant); Text("${plan.amount ?: plan.monthlyPrice ?: 0.0} ر.ي", fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary); Button(onClick = { plan.id?.let { id -> scope.launch { checkoutMessage = runCatching { repository.checkout(SubscriptionCheckoutRequest(id)).message ?: "تم تسجيل طلب الاشتراك" }.getOrElse { it.message ?: "تعذر تجهيز الاشتراك" } } } }) { Text("اختيار الباقة") } } } }
    }
}

data class SubscriptionUiState(val loading: Boolean = false, val plans: List<com.fazaah.app.domain.model.SubscriptionPlan> = emptyList(), val error: String? = null)

@Composable
fun EarningsScreen(navController: NavHostController) {
    FormPage("الأرباح", "ستظهر تفاصيل أرباحك بعد اكتمال أول طلب.", navController) { Card(Modifier.fillMaxWidth(), shape = RoundedCornerShape(20.dp)) { Column(Modifier.padding(24.dp), horizontalAlignment = Alignment.CenterHorizontally) { Text("قيد التفعيل", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Black); Text("لم يتم تسجيل أرباح بعد", color = MaterialTheme.colorScheme.onSurfaceVariant) } } }
}

@Composable
fun WalletScreen(navController: NavHostController) {
    FormPage("المحفظة", "تابع الرصيد وسجل العمليات عند تفعيل الدفع.", navController) { Card(Modifier.fillMaxWidth(), shape = RoundedCornerShape(20.dp)) { Column(Modifier.padding(24.dp), horizontalAlignment = Alignment.CenterHorizontally) { Text("المحفظة غير مفعلة", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Black); Text("لا توجد عمليات مالية متاحة حاليًا.", color = MaterialTheme.colorScheme.onSurfaceVariant) } } }
}

@Composable
fun HelpSupportScreen(navController: NavHostController) {
    val context = LocalContext.current
    FormPage("الدعم والمساعدة", "نساعدك على فهم خدمات فزعة واستخدامها بأمان.", navController) { Card(Modifier.fillMaxWidth(), shape = RoundedCornerShape(18.dp)) { Row(Modifier.padding(18.dp), verticalAlignment = Alignment.CenterVertically) { Icon(Icons.Default.HelpOutline, null, tint = MaterialTheme.colorScheme.primary); Text("للتواصل مع الدعم، اكتب تفاصيل المشكلة من داخل التطبيق.", Modifier.padding(horizontal = 12.dp)) } }; Button(onClick = { context.startActivity(Intent(Intent.ACTION_SENDTO, Uri.parse("mailto:support@fazaah.com"))) }, Modifier.fillMaxWidth(), shape = RoundedCornerShape(16.dp)) { Text("مراسلة الدعم عبر البريد") } }
}

@Composable
private fun FormPage(title: String, subtitle: String, navController: NavHostController, content: @Composable ColumnScope.() -> Unit) {
    LazyColumn(modifier = Modifier.fillMaxSize().padding(18.dp), verticalArrangement = Arrangement.spacedBy(12.dp), contentPadding = androidx.compose.foundation.layout.PaddingValues(bottom = 28.dp)) {
        item { Row(verticalAlignment = Alignment.CenterVertically) { TextButton(onClick = { navController.popBackStack() }) { Icon(Icons.AutoMirrored.Filled.ArrowBack, null); Text("رجوع") }; Text(title, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Black) } }
        item { Text(subtitle, color = MaterialTheme.colorScheme.onSurfaceVariant) }
        item { Column(verticalArrangement = Arrangement.spacedBy(12.dp), content = content) }
    }
}
