package com.fazaah.app.presentation.requests

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.background
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.Switch
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.CardDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.produceState
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.RectangleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.navigation.NavHostController
import com.fazaah.app.data.repository.AuthRepository
import com.fazaah.app.domain.model.ServiceRequestInput

private fun statusLabel(status: String): String = when (status) {
    "pending" -> "قيد الانتظار"
    "accepted" -> "تم القبول"
    "in_progress" -> "جاري التنفيذ"
    "completed" -> "مكتمل"
    "rejected" -> "مرفوض"
    "cancelled" -> "ملغي"
    else -> status
}

@Composable
fun RequestsScreen(viewModel: RequestViewModel, authRepository: AuthRepository, navController: NavHostController) {
    val role by produceState(initialValue = "client") { value = runCatching { authRepository.currentUser().role ?: "client" }.getOrDefault("client") }
    val state by viewModel.state.collectAsStateWithLifecycle()
    LaunchedEffect(role) { viewModel.load(role) }
    Column(modifier = Modifier.fillMaxSize().background(Color(0xFFF7F9FB))) {
        Column(Modifier.fillMaxWidth().background(Color(0xFF082846)).padding(horizontal = 18.dp, vertical = 24.dp)) {
            Text(if (role == "provider") "الطلبات الواردة" else "طلباتي", color = Color.White, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.ExtraBold)
            Text(if (role == "provider") "راجع طلبات العملاء وتابع أعمالك" else "تابع حالة طلبات الخدمة الخاصة بك", color = Color.White.copy(alpha = .7f), modifier = Modifier.padding(top = 5.dp))
        }
        Column(Modifier.padding(16.dp)) {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) { StatusPill("الكل", true); StatusPill("قيد الانتظار", false); StatusPill("مكتملة", false) }
        Spacer(Modifier.height(16.dp))
        when {
            state.loading -> CircularProgressIndicator(color = Color(0xFFF6C107))
            state.error != null -> Text(state.error!!, color = MaterialTheme.colorScheme.error)
            state.requests.isEmpty() -> Text(if (role == "provider") "لم تتلقى أي طلبات عمل بعد." else "لم تقم بطلب أي خدمة بعد.", color = MaterialTheme.colorScheme.onSurfaceVariant)
            else -> LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) { items(state.requests) { request -> Card(onClick = { navController.navigate("requests/detail/${request.id}") }, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(16.dp), colors = CardDefaults.cardColors(containerColor = Color.White)) { Column(Modifier.padding(16.dp)) { Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) { Column { Text(request.serviceType, fontWeight = FontWeight.ExtraBold, color = Color(0xFF082846)); Text(if (role == "provider") "العميل: ${request.clientName ?: "—"}" else "المهني: ${request.providerName ?: "—"}", style = MaterialTheme.typography.bodySmall, color = Color.Gray) }; Text(statusLabel(request.status), color = Color(0xFFB58900), fontWeight = FontWeight.Bold) }; Text(request.description, maxLines = 2, color = Color(0xFF5E6B76), modifier = Modifier.padding(top = 12.dp)); Text("${request.city} · ${request.district}", style = MaterialTheme.typography.bodySmall, color = Color.Gray, modifier = Modifier.padding(top = 8.dp)) } } } }
        }
        }
    }
}

@Composable
private fun StatusPill(label: String, selected: Boolean) { Text(label, color = if (selected) Color(0xFF082846) else Color(0xFF526273), fontWeight = FontWeight.Bold, modifier = Modifier.background(if (selected) Color(0xFFF6C107) else Color.White, RoundedCornerShape(20.dp)).padding(horizontal = 14.dp, vertical = 8.dp)) }

@Composable
fun RequestDetailScreen(viewModel: RequestViewModel, requestId: Int) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    LaunchedEffect(requestId) { viewModel.loadOne(requestId) }
    val request = state.selected
    Column(modifier = Modifier.fillMaxSize().padding(18.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text("تفاصيل الطلب", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
        if (state.loading || request == null) CircularProgressIndicator() else {
            Text(request.serviceType, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
            Text(statusLabel(request.status), color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold)
            Text(request.description)
            Text("الموقع: ${request.city}، ${request.district}")
            Text(if (request.isImmediate) "الموعد: عاجل (الآن)" else "الموعد: ${request.scheduledAt ?: "غير محدد"}")
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                if (request.status == "pending") { Button(onClick = { viewModel.updateStatus(request.id, "accepted") }) { Text("قبول الطلب") }; Button(onClick = { viewModel.updateStatus(request.id, "rejected") }) { Text("رفض") } }
                if (request.status == "accepted") Button(onClick = { viewModel.updateStatus(request.id, "in_progress") }) { Text("بدء التنفيذ") }
                if (request.status == "in_progress") Button(onClick = { viewModel.updateStatus(request.id, "completed") }) { Text("إكمال الخدمة") }
                if (request.status == "pending" || request.status == "accepted") TextButton(onClick = { viewModel.updateStatus(request.id, "cancelled") }) { Text("إلغاء الطلب") }
            }
        }
        state.error?.let { Text(it, color = MaterialTheme.colorScheme.error) }
        state.message?.let { Text(it, color = MaterialTheme.colorScheme.primary) }
    }
}

@Composable
fun NewRequestScreen(viewModel: RequestViewModel, providerId: Int) {
    var serviceType by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }
    var city by remember { mutableStateOf("") }
    var district by remember { mutableStateOf("") }
    var immediate by remember { mutableStateOf(true) }
    val state by viewModel.state.collectAsStateWithLifecycle()
    Column(modifier = Modifier.fillMaxSize().padding(18.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
        Text("طلب خدمة جديدة", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
        Text("فزعة تربطك بالمهني فقط، ويتم الاتفاق على السعر والتنفيذ مباشرة.", color = MaterialTheme.colorScheme.onSurfaceVariant)
        OutlinedTextField(serviceType, { serviceType = it }, label = { Text("نوع الخدمة المطلوبة") }, modifier = Modifier.fillMaxWidth())
        OutlinedTextField(description, { description = it }, label = { Text("وصف المشكلة") }, minLines = 4, modifier = Modifier.fillMaxWidth())
        OutlinedTextField(city, { city = it }, label = { Text("المدينة") }, modifier = Modifier.fillMaxWidth())
        OutlinedTextField(district, { district = it }, label = { Text("المنطقة / الحي") }, modifier = Modifier.fillMaxWidth())
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) { Column { Text("أحتاج الخدمة الآن", fontWeight = FontWeight.Bold); Text("أريد من المهني الحضور بأسرع وقت", style = MaterialTheme.typography.bodySmall) }; Switch(checked = immediate, onCheckedChange = { immediate = it }) }
        Button(enabled = !state.saving && providerId > 0 && serviceType.trim().length >= 2 && description.trim().length >= 10 && city.trim().length >= 2 && district.trim().length >= 2, onClick = { viewModel.create(ServiceRequestInput(providerId, serviceType.trim(), description.trim(), city.trim(), district.trim(), isImmediate = immediate), {}) }, modifier = Modifier.fillMaxWidth()) { Text(if (state.saving) "جارٍ الإرسال..." else "تأكيد وإرسال الطلب") }
        state.message?.let { Text(it, color = MaterialTheme.colorScheme.primary) }
        state.error?.let { Text(it, color = MaterialTheme.colorScheme.error) }
    }
}
