package com.fazaah.app.presentation.utility

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
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.navigation.NavHostController
import com.fazaah.app.data.repository.SubscriptionRepository
import com.fazaah.app.domain.model.SubscriptionCheckoutRequest

@Composable
fun ProviderBusinessScreen(navController: NavHostController) {
    var name by remember { mutableStateOf("") }
    var category by remember { mutableStateOf("") }
    var specialty by remember { mutableStateOf("") }
    var bio by remember { mutableStateOf("") }
    var whatsapp by remember { mutableStateOf("") }
    FormPage("بيانات النشاط المهني", "أكمل بيانات نشاطك ليظهر ملفك بشكل واضح للعملاء.", navController) {
        OutlinedTextField(name, { name = it }, label = { Text("اسم النشاط") }, modifier = Modifier.fillMaxWidth(), singleLine = true)
        OutlinedTextField(category, { category = it }, label = { Text("المجال") }, modifier = Modifier.fillMaxWidth(), singleLine = true)
        OutlinedTextField(specialty, { specialty = it }, label = { Text("التخصص") }, modifier = Modifier.fillMaxWidth(), singleLine = true)
        OutlinedTextField(bio, { bio = it }, label = { Text("وصف النشاط والخبرة") }, modifier = Modifier.fillMaxWidth(), minLines = 4)
        OutlinedTextField(whatsapp, { whatsapp = it }, label = { Text("رقم الواتساب") }, modifier = Modifier.fillMaxWidth(), singleLine = true)
        Button(onClick = {}, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(16.dp)) { Text("حفظ بيانات النشاط", fontWeight = FontWeight.Bold) }
    }
}

@Composable
fun VerifyProviderScreen(navController: NavHostController) {
    FormPage("توثيق الملف المهني", "ارفع المستندات المطلوبة لمراجعة واعتماد ملفك.", navController) {
        UploadRow("صورة الهوية الأمامية")
        UploadRow("صورة الهوية الخلفية")
        UploadRow("الصورة الشخصية")
        Text("لن تظهر مستنداتك للعملاء، وتستخدم للمراجعة فقط.", color = MaterialTheme.colorScheme.onSurfaceVariant, style = MaterialTheme.typography.bodySmall)
        Button(onClick = {}, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(16.dp)) { Text("إرسال للمراجعة", fontWeight = FontWeight.Bold) }
    }
}

@Composable
private fun UploadRow(label: String) {
    Card(modifier = Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface), shape = RoundedCornerShape(16.dp)) {
        Row(Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) { Icon(Icons.Default.UploadFile, null, tint = MaterialTheme.colorScheme.primary); Column(Modifier.weight(1f).padding(horizontal = 12.dp)) { Text(label, fontWeight = FontWeight.Bold); Text("لم يتم اختيار ملف", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant) }; TextButton(onClick = {}) { Text("اختيار") } }
    }
}

@Composable
fun ProviderSubscriptionScreen(repository: SubscriptionRepository, navController: NavHostController) {
    val state by produceState<SubscriptionUiState>(initialValue = SubscriptionUiState(loading = true)) {
        value = runCatching { SubscriptionUiState(plans = repository.plans().plans) }.getOrElse { SubscriptionUiState(error = it.message ?: "تعذر تحميل الباقات") }
    }
    FormPage("الاشتراك والإعلانات", "اختر الباقة المناسبة لزيادة ظهور ملفك المهني.", navController) {
        if (state.loading) CircularProgressIndicator(modifier = Modifier.align(Alignment.CenterHorizontally))
        state.error?.let { Text(it, color = MaterialTheme.colorScheme.error) }
        if (!state.loading && state.plans.isEmpty() && state.error == null) Text("لا توجد باقات متاحة حاليًا.", color = MaterialTheme.colorScheme.onSurfaceVariant)
        state.plans.forEach { plan -> Card(modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(18.dp)) { Column(Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) { Text(plan.name ?: "باقة فزعة", fontWeight = FontWeight.Black, style = MaterialTheme.typography.titleMedium); Text(plan.description ?: "ظهور أفضل وميزات إضافية لملفك.", color = MaterialTheme.colorScheme.onSurfaceVariant); Text("${plan.price ?: 0.0} ر.ي", fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary); Button(onClick = {}) { Text("اختيار الباقة") } } } }
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
    FormPage("الدعم والمساعدة", "نساعدك على فهم خدمات فزعة واستخدامها بأمان.", navController) { Card(Modifier.fillMaxWidth(), shape = RoundedCornerShape(18.dp)) { Row(Modifier.padding(18.dp), verticalAlignment = Alignment.CenterVertically) { Icon(Icons.Default.HelpOutline, null, tint = MaterialTheme.colorScheme.primary); Text("للتواصل مع الدعم، اكتب تفاصيل المشكلة من داخل التطبيق.", Modifier.padding(horizontal = 12.dp)) } }; Button(onClick = {}, Modifier.fillMaxWidth(), shape = RoundedCornerShape(16.dp)) { Text("إرسال طلب دعم") } }
}

@Composable
private fun FormPage(title: String, subtitle: String, navController: NavHostController, content: @Composable ColumnScope.() -> Unit) {
    LazyColumn(modifier = Modifier.fillMaxSize().padding(18.dp), verticalArrangement = Arrangement.spacedBy(12.dp), contentPadding = androidx.compose.foundation.layout.PaddingValues(bottom = 28.dp)) {
        item { Row(verticalAlignment = Alignment.CenterVertically) { TextButton(onClick = { navController.popBackStack() }) { Icon(Icons.AutoMirrored.Filled.ArrowBack, null); Text("رجوع") }; Text(title, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Black) } }
        item { Text(subtitle, color = MaterialTheme.colorScheme.onSurfaceVariant) }
        item { Column(verticalArrangement = Arrangement.spacedBy(12.dp), content = content) }
    }
}
