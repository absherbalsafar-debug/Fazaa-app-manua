package com.fazaah.app.presentation.provider

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.TrendingUp
import androidx.compose.material.icons.filled.AccountBalanceWallet
import androidx.compose.material.icons.filled.AccessTime
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.Work
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ColorFilter
import androidx.compose.ui.res.painterResource
import androidx.compose.foundation.Image
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavHostController
import com.fazaah.app.R
import com.fazaah.app.data.repository.CatalogRepository
import com.fazaah.app.domain.model.ServiceRequest
import com.fazaah.app.presentation.navigation.Routes

private val statusLabels = mapOf(
    "pending" to "بانتظار ردك", "accepted" to "تم القبول", "in_progress" to "قيد التنفيذ",
    "completed" to "مكتمل", "rejected" to "مرفوض", "cancelled" to "ملغي",
)

@Composable
fun ProviderDashboardScreen(repository: CatalogRepository, navController: NavHostController) {
    val model: ProviderDashboardViewModel = viewModel(factory = ProviderDashboardViewModel.factory(repository))
    val state by model.uiState.collectAsStateWithLifecycle()
    if (state.loading) { Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) { CircularProgressIndicator() }; return }
    val profile = state.profile
    if (profile == null) {
        Box(Modifier.fillMaxSize().padding(24.dp), contentAlignment = Alignment.Center) { Column(horizontalAlignment = Alignment.CenterHorizontally) { Icon(Icons.Default.Work, null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(48.dp)); Text("أكمل ملفك المهني", fontSize = 20.sp, fontWeight = FontWeight.Black, modifier = Modifier.padding(top = 16.dp)); Text(state.error ?: "أنشئ ملفك حتى تبدأ باستقبال طلبات العملاء.", color = MaterialTheme.colorScheme.onSurfaceVariant); Button(onClick = { navController.navigate(Routes.Profile) }, modifier = Modifier.padding(top = 20.dp)) { Text("الانتقال إلى الملف") } } }; return
    }
    val pending = state.requests.count { it.status == "pending" }
    val active = state.requests.count { it.status == "accepted" || it.status == "in_progress" }
    val completed = state.requests.count { it.status == "completed" }
    LazyColumn(modifier = Modifier.fillMaxSize().background(MaterialTheme.colorScheme.background), contentPadding = PaddingValues(bottom = 28.dp)) {
        item {
            Column(Modifier.fillMaxWidth().background(Brush.linearGradient(listOf(Color(0xFF182D53), Color(0xFF17559A)))).padding(horizontal = 16.dp, vertical = 26.dp)) {
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.Top) {
                    Column(Modifier.weight(1f)) {
                        Image(painterResource(R.drawable.fazaah_logo), "فزعة", colorFilter = ColorFilter.tint(Color.White), modifier = Modifier.width(96.dp).height(48.dp))
                        Text("لوحة المهني", color = Color.White.copy(alpha = .65f), fontSize = 14.sp, modifier = Modifier.padding(top = 10.dp))
                        Text("أهلًا ${profile.name.trim().substringBefore(' ')}", color = Color.White, fontSize = 24.sp, fontWeight = FontWeight.Black)
                        Text("${profile.categoryName} · ${profile.city}", color = Color.White.copy(alpha = .7f), fontSize = 12.sp, modifier = Modifier.padding(top = 8.dp))
                        if (profile.bio.isNotBlank()) Text(profile.bio, color = Color.White.copy(alpha = .65f), fontSize = 12.sp, lineHeight = 20.sp, modifier = Modifier.padding(top = 8.dp))
                    }
                    IconButton(onClick = { navController.navigate(Routes.Settings) }, modifier = Modifier.background(Color.White.copy(alpha = .10f), RoundedCornerShape(16.dp))) { Icon(Icons.Default.Settings, "الإعدادات", tint = Color.White) }
                }
                Surface(modifier = Modifier.fillMaxWidth().padding(top = 20.dp), color = Color.White.copy(alpha = .10f), shape = RoundedCornerShape(16.dp), border = BorderStroke(1.dp, Color.White.copy(alpha = .10f))) {
                    Row(Modifier.padding(13.dp), verticalAlignment = Alignment.CenterVertically) {
                        Surface(Modifier.size(12.dp), shape = RoundedCornerShape(50), color = if (profile.isAvailable) Color(0xFF6EE7B7) else Color.White.copy(alpha = .35f)) {}
                        Column(Modifier.weight(1f).padding(horizontal = 12.dp)) { Text(if (profile.isAvailable) "متاح الآن" else "غير متاح", color = Color.White, fontWeight = FontWeight.Bold); Text("استقبال طلبات جديدة", color = Color.White.copy(alpha = .65f), fontSize = 11.sp) }
                        if (state.updatingAvailability) CircularProgressIndicator(Modifier.size(24.dp), color = Color.White, strokeWidth = 2.dp) else Switch(checked = profile.isAvailable, onCheckedChange = model::toggleAvailability)
                    }
                }
                Spacer(Modifier.height(36.dp))
            }
        }
        item { Column(Modifier.padding(horizontal = 16.dp)) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) { DashboardStat("طلبات جديدة", pending.toString(), Color(0xFFD97706), Color(0xFFFFFBEB), Icons.Default.AccessTime, Modifier.weight(1f)); DashboardStat("أعمال نشطة", active.toString(), Color(0xFF2563EB), Color(0xFFEFF6FF), Icons.Default.Work, Modifier.weight(1f)) }
            Row(Modifier.fillMaxWidth().padding(top = 12.dp), horizontalArrangement = Arrangement.spacedBy(12.dp)) { DashboardStat("أعمال مكتملة", (profile.completedJobs + completed).toString(), Color(0xFF059669), Color(0xFFECFDF5), Icons.Default.CheckCircle, Modifier.weight(1f)); DashboardStat("التقييم", String.format("%.1f", profile.rating), Color(0xFFCA8A04), Color(0xFFFEFCE8), Icons.Default.Star, Modifier.weight(1f)) }
        } }
        item { DashboardLink("الاشتراك والإعلانات", "تابع أداء ملفك، فعّل اشتراكك وأنشئ إعلاناً مدفوعاً.", Icons.Default.Visibility) { navController.navigate(Routes.ProviderSubscription) } }
        item { Row(Modifier.fillMaxWidth().padding(horizontal = 16.dp), horizontalArrangement = Arrangement.spacedBy(12.dp)) { InfoTile("الأرباح", "قيد التفعيل", "ستظهر بعد اكتمال أول طلب", Icons.Default.AccountBalanceWallet, Modifier.weight(1f)); InfoTile("الخبرة", "${profile.yearsExperience} سنوات", "${profile.reviewCount} تقييم موثق", Icons.AutoMirrored.Filled.TrendingUp, Modifier.weight(1f)) } }
        if (!profile.isVerified) item { Card(onClick = { navController.navigate(Routes.Profile) }, modifier = Modifier.fillMaxWidth().padding(16.dp), colors = CardDefaults.cardColors(containerColor = Color(0xFFFFFBEB)), border = BorderStroke(1.dp, Color(0xFFFDE68A)), shape = RoundedCornerShape(16.dp)) { Row(Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) { Icon(Icons.Default.Shield, null, tint = Color(0xFFD97706)); Column(Modifier.weight(1f).padding(horizontal = 12.dp)) { Text("وثّق ملفك لزيادة الثقة", fontWeight = FontWeight.Bold, color = Color(0xFF78350F)); Text("ارفع الهوية والشهادات لإظهار شارة التوثيق.", fontSize = 12.sp, color = Color(0xFFB45309)) }; Icon(Icons.AutoMirrored.Filled.ArrowBack, null) } } }
        item { RecentRequests(state.requests.take(4), navController) }
        item { OutlinedButton(onClick = model::reload, modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp)) { Icon(Icons.Default.Refresh, null); Spacer(Modifier.width(8.dp)); Text("تحديث الطلبات") } }
        state.error?.let { error -> item { Text(error, color = MaterialTheme.colorScheme.error, modifier = Modifier.padding(16.dp)) } }
    }
}

@Composable
private fun DashboardStat(label: String, value: String, color: Color, bg: Color, icon: androidx.compose.ui.graphics.vector.ImageVector, modifier: Modifier) {
    Card(modifier = modifier, shape = RoundedCornerShape(16.dp), border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)) { Column(Modifier.padding(16.dp)) { Surface(Modifier.size(36.dp), shape = RoundedCornerShape(12.dp), color = bg) { Box(contentAlignment = Alignment.Center) { Icon(icon, null, tint = color, modifier = Modifier.size(18.dp)) } }; Text(value, fontSize = 24.sp, fontWeight = FontWeight.Black, modifier = Modifier.padding(top = 12.dp)); Text(label, color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 12.sp) } }
}

@Composable
private fun DashboardLink(title: String, subtitle: String, icon: androidx.compose.ui.graphics.vector.ImageVector, onClick: () -> Unit) {
    Card(onClick = onClick, modifier = Modifier.fillMaxWidth().padding(16.dp), shape = RoundedCornerShape(16.dp), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primary.copy(alpha = .05f)), border = BorderStroke(1.dp, MaterialTheme.colorScheme.primary.copy(alpha = .15f))) { Row(Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) { Surface(Modifier.size(40.dp), shape = RoundedCornerShape(12.dp), color = MaterialTheme.colorScheme.primary) { Box(contentAlignment = Alignment.Center) { Icon(icon, null, tint = Color.White) } }; Column(Modifier.weight(1f).padding(horizontal = 12.dp)) { Text(title, fontWeight = FontWeight.Black); Text(subtitle, fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant) }; Icon(Icons.AutoMirrored.Filled.ArrowBack, null, tint = MaterialTheme.colorScheme.primary) } }
}

@Composable
private fun InfoTile(title: String, value: String, subtitle: String, icon: androidx.compose.ui.graphics.vector.ImageVector, modifier: Modifier) {
    Card(modifier = modifier, shape = RoundedCornerShape(16.dp), border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)) { Column(Modifier.padding(16.dp)) { Row(verticalAlignment = Alignment.CenterVertically) { Icon(icon, null, tint = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.size(18.dp)); Text(title, color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 12.sp, modifier = Modifier.padding(horizontal = 8.dp)) }; Text(value, fontSize = 18.sp, fontWeight = FontWeight.Black, modifier = Modifier.padding(top = 12.dp)); Text(subtitle, fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant) } }
}

@Composable
private fun RecentRequests(requests: List<ServiceRequest>, navController: NavHostController) {
    Card(modifier = Modifier.fillMaxWidth().padding(16.dp), shape = RoundedCornerShape(16.dp), border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)) {
        Column { Row(Modifier.fillMaxWidth().padding(16.dp), horizontalArrangement = Arrangement.SpaceBetween) { Column { Text("آخر الطلبات", fontWeight = FontWeight.Bold); Text("تابع أعمالك ورد على العملاء", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant) }; Text("عرض الكل", color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold, fontSize = 12.sp) }
            if (requests.isEmpty()) Text("لا توجد طلبات حتى الآن", modifier = Modifier.fillMaxWidth().padding(32.dp), textAlign = androidx.compose.ui.text.style.TextAlign.Center, color = MaterialTheme.colorScheme.onSurfaceVariant)
            requests.forEach { request -> Row(Modifier.fillMaxWidth().padding(16.dp), verticalAlignment = Alignment.CenterVertically) { Surface(Modifier.size(40.dp), shape = RoundedCornerShape(12.dp), color = MaterialTheme.colorScheme.primary.copy(alpha = .1f)) { Box(contentAlignment = Alignment.Center) { Icon(Icons.Default.Visibility, null, tint = MaterialTheme.colorScheme.primary) } }; Column(Modifier.weight(1f).padding(horizontal = 12.dp)) { Text(request.serviceType, fontWeight = FontWeight.Bold, maxLines = 1, overflow = TextOverflow.Ellipsis); Text("${request.clientName ?: "عميل"} · ${request.city}", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant, maxLines = 1) }; Text(statusLabels[request.status] ?: request.status, fontSize = 11.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurfaceVariant) } }
        }
    }
}
