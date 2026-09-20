package com.fazaah.app.presentation.emergency

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.ElectricBolt
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material.icons.filled.WaterDrop
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavHostController
import com.fazaah.app.data.repository.AuthRepository
import com.fazaah.app.data.repository.CatalogRepository
import com.fazaah.app.presentation.navigation.Routes

private val services = listOf(
    EmergencyService(1, 2, "كهربائي طارئ", "مشكلة كهربائية خطيرة"),
    EmergencyService(2, 1, "سباك طارئ", "تسرب مياه أو انسداد"),
    EmergencyService(3, null, "فتح أقفال", "فتح باب أو قفل"),
)

@Composable
fun EmergencyScreen(
    catalogRepository: CatalogRepository,
    authRepository: AuthRepository,
    navController: NavHostController,
) {
    val model: EmergencyViewModel = viewModel(factory = EmergencyViewModel.factory(catalogRepository, authRepository))
    val state by model.uiState.collectAsStateWithLifecycle()
    val snackbar = remember { SnackbarHostState() }
    LaunchedEffect(state.error) {
        state.error?.let { snackbar.showSnackbar(it); model.consumeError() }
    }
    if (state.sent) {
        EmergencySuccess { navController.navigate(Routes.Requests) { popUpTo(Routes.Emergency) { inclusive = true } } }
        return
    }
    Scaffold(snackbarHost = { SnackbarHost(snackbar) }) { inner ->
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(inner),
            verticalArrangement = Arrangement.spacedBy(16.dp),
            contentPadding = PaddingValues(bottom = 32.dp),
        ) {
            item { EmergencyHeader { navController.popBackStack() } }
            items(services) { service ->
                EmergencyServiceCard(service, state.selectedServiceId == service.id, state.sending) { model.send(service) }
            }
            item { LocationCard(state.city) }
            item { SevereDangerCard() }
        }
    }
}

@Composable
private fun EmergencyHeader(onBack: () -> Unit) {
    Column(Modifier.fillMaxWidth().height(150.dp).background(Color(0xFFDC2626)).padding(horizontal = 16.dp, vertical = 22.dp), verticalArrangement = Arrangement.SpaceBetween) {
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            IconButton(onClick = onBack, modifier = Modifier.size(42.dp)) { Icon(Icons.AutoMirrored.Filled.ArrowBack, "رجوع", tint = Color.White) }
            Icon(Icons.Default.Warning, null, tint = Color.White, modifier = Modifier.padding(horizontal = 10.dp))
            Text("خدمة الطوارئ", color = Color.White, fontSize = 20.sp, fontWeight = FontWeight.Black)
        }
        Text("اضغط على نوع الطارئ وسنرسل لك أقرب مهني متاح فوراً", color = Color(0xFFFEE2E2), fontSize = 14.sp)
    }
}

@Composable
private fun EmergencyServiceCard(service: EmergencyService, selected: Boolean, sending: Boolean, onClick: () -> Unit) {
    val color = when (service.id) { 1 -> Color(0xFFEAB308); 2 -> Color(0xFF3B82F6); else -> Color(0xFF374151) }
    val icon = when (service.id) { 1 -> Icons.Default.ElectricBolt; 2 -> Icons.Default.WaterDrop; else -> Icons.Default.Lock }
    Card(
        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp).clickable(enabled = !sending, onClick = onClick),
        shape = RoundedCornerShape(16.dp),
        border = BorderStroke(2.dp, if (selected) Color(0xFFEF4444) else MaterialTheme.colorScheme.outlineVariant),
        colors = CardDefaults.cardColors(containerColor = if (selected) Color(0xFFFEF2F2) else MaterialTheme.colorScheme.surface),
    ) {
        Row(Modifier.fillMaxWidth().padding(20.dp), verticalAlignment = Alignment.CenterVertically) {
            Surface(modifier = Modifier.size(56.dp), shape = RoundedCornerShape(16.dp), color = color) { Box(contentAlignment = Alignment.Center) { Icon(icon, null, tint = Color.White, modifier = Modifier.size(28.dp)) } }
            Column(Modifier.weight(1f).padding(horizontal = 16.dp)) { Text(service.title, fontSize = 18.sp, fontWeight = FontWeight.Black, color = Color(0xFF182D53)); Text(service.description, fontSize = 14.sp, color = Color(0xFF637087)) }
            if (selected && sending) CircularProgressIndicator(Modifier.size(24.dp), color = Color(0xFFEF4444), strokeWidth = 2.dp)
        }
    }
}

@Composable
private fun LocationCard(city: String) {
    Card(modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 14.dp), shape = RoundedCornerShape(16.dp), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)) {
        Column(Modifier.padding(16.dp)) { Row(verticalAlignment = Alignment.CenterVertically) { Icon(Icons.Default.LocationOn, null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(20.dp)); Text("موقعك الحالي", fontWeight = FontWeight.Bold, modifier = Modifier.padding(horizontal = 8.dp)) }; Text("$city — سيتم تحديد الموقع الدقيق عند الإرسال", color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 14.sp, modifier = Modifier.padding(top = 8.dp)) }
    }
}

@Composable
private fun SevereDangerCard() {
    val context = LocalContext.current
    Card(modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp), shape = RoundedCornerShape(16.dp), border = BorderStroke(1.dp, Color(0xFFFECACA)), colors = CardDefaults.cardColors(containerColor = Color(0xFFFEF2F2))) {
        Column(Modifier.fillMaxWidth().padding(16.dp), horizontalAlignment = Alignment.CenterHorizontally) {
            Row(verticalAlignment = Alignment.CenterVertically) { Icon(Icons.Default.Phone, null, tint = Color(0xFFDC2626), modifier = Modifier.size(20.dp)); Text("في حالات الخطر الشديد", color = Color(0xFFB91C1C), modifier = Modifier.padding(horizontal = 8.dp)) }
            Text("اتصل 199", color = Color(0xFFDC2626), fontSize = 24.sp, fontWeight = FontWeight.Black, modifier = Modifier.padding(top = 8.dp).clickable { context.startActivity(Intent(Intent.ACTION_DIAL, Uri.parse("tel:199"))) })
        }
    }
}

@Composable
private fun EmergencySuccess(onTrack: () -> Unit) {
    Box(Modifier.fillMaxSize().background(Color(0xFF182D53)), contentAlignment = Alignment.Center) {
        Column(Modifier.fillMaxWidth().padding(32.dp), horizontalAlignment = Alignment.CenterHorizontally) {
            Surface(modifier = Modifier.size(96.dp), shape = CircleShape, color = Color(0xFFF0B046)) { Box(contentAlignment = Alignment.Center) { Icon(Icons.Default.CheckCircle, null, tint = Color.White, modifier = Modifier.size(48.dp)) } }
            Text("تم إرسال طلبك!", color = Color.White, fontSize = 24.sp, fontWeight = FontWeight.Black, modifier = Modifier.padding(top = 22.dp))
            Text("نبحث الآن عن أقرب مهني متاح في منطقتك", color = Color.White.copy(alpha = .7f), textAlign = TextAlign.Center, modifier = Modifier.padding(top = 8.dp))
            Surface(modifier = Modifier.fillMaxWidth().padding(vertical = 24.dp), shape = RoundedCornerShape(16.dp), color = Color.White.copy(alpha = .10f)) { Column(Modifier.padding(16.dp), horizontalAlignment = Alignment.CenterHorizontally) { Text("متوسط وقت الاستجابة", color = Color.White.copy(alpha = .6f)); Text("١٥ دقيقة", color = Color.White, fontSize = 30.sp, fontWeight = FontWeight.Black) } }
            Button(onClick = onTrack, modifier = Modifier.fillMaxWidth().height(56.dp), colors = androidx.compose.material3.ButtonDefaults.buttonColors(containerColor = Color(0xFFF0B046), contentColor = Color(0xFF182D53)), shape = RoundedCornerShape(16.dp)) { Text("تتبع الطلب", fontWeight = FontWeight.Black) }
        }
    }
}
