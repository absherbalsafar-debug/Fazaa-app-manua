package com.fazaah.app.presentation.utility

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.navigation.NavHostController
import com.fazaah.app.presentation.navigation.Routes

@Composable
fun SettingsScreen(navController: NavHostController) {
    Column(Modifier.fillMaxSize().padding(18.dp)) {
        Text("الإعدادات", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Black)
        Text("خصص تجربة فزعة كما تحب", color = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.padding(top = 4.dp, bottom = 18.dp))
        SettingSection("المظهر", listOf("الوضع التلقائي", "الوضع النهاري", "الوضع الليلي"))
        SettingSection("الأمان والخصوصية", listOf("توثيق رقم الهاتف", "الإشعارات"))
        Button(onClick = { navController.navigate(Routes.Privacy) }, modifier = Modifier.fillMaxWidth().padding(top = 8.dp)) { Text("سياسة الخصوصية") }
        OutlinedButton(onClick = { navController.navigate(Routes.Terms) }, modifier = Modifier.fillMaxWidth()) { Text("شروط الاستخدام") }
    }
}

@Composable
private fun SettingSection(title: String, items: List<String>) {
    Text(title, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary, modifier = Modifier.padding(vertical = 8.dp))
    Card(Modifier.fillMaxWidth()) { Column { items.forEach { label -> Row(Modifier.fillMaxWidth().padding(16.dp), horizontalArrangement = Arrangement.SpaceBetween) { Text(label); Text("›", color = MaterialTheme.colorScheme.primary) } } } }
}

@Composable
fun LegalScreen(title: String, heading: String, intro: String, paragraphs: List<String>, onBack: () -> Unit) {
    Column(Modifier.fillMaxSize().padding(18.dp)) {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) { Text(title, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Black); Text("‹", color = MaterialTheme.colorScheme.primary) }
        LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.padding(top = 18.dp)) {
            item { Card { Column(Modifier.padding(18.dp)) { Text("فزعة FAZAAH", color = MaterialTheme.colorScheme.secondary, fontWeight = FontWeight.Bold); Text(heading, style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Black, modifier = Modifier.padding(top = 8.dp)); Text(intro, color = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.padding(top = 8.dp)) } } }
            items(paragraphs) { paragraph -> Text(paragraph, style = MaterialTheme.typography.bodyLarge, lineHeight = MaterialTheme.typography.bodyLarge.lineHeight) }
        }
    }
}

@Composable
fun PrivacyScreen() = LegalScreen("سياسة الخصوصية", "خصوصيتك أولوية", "نوضح هنا ما نحتاجه لتقديم تجربة آمنة وواضحة.", listOf("نستخدم بيانات الحساب لتسجيل الدخول وتشغيل خدمات فزعة وربط العميل بالمهني المناسب.", "نطلب الموقع عند الحاجة لعرض المهنيين القريبين وتحديد موقع تنفيذ الخدمة. لا نطلب إذن الموقع إلا عند استخدام هذه الوظيفة.", "تُراجع مستندات المهني لأغراض الاعتماد فقط، ويجب عدم رفع مستندات لا تملك حق تقديمها."), onBack = {})

@Composable
fun TermsScreen() = LegalScreen("شروط الاستخدام", "شروط واضحة للجميع", "تهدف هذه الشروط إلى تنظيم العلاقة بين العملاء ومقدمي الخدمات.", listOf("يلتزم المستخدم بتقديم بيانات صحيحة وعدم انتحال هوية شخص آخر.", "تُستخدم منصة فزعة للتواصل بين العميل والمهني، ويتحمل الطرفان مسؤولية الاتفاق على تفاصيل الخدمة.", "يحق للمنصة مراجعة حسابات المهنيين ومستنداتهم واتخاذ الإجراء المناسب عند وجود بيانات غير صحيحة."), onBack = {})
