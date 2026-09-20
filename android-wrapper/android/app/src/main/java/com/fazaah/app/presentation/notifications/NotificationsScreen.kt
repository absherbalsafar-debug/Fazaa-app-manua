package com.fazaah.app.presentation.notifications

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle

@Composable
fun NotificationsScreen(viewModel: NotificationsViewModel) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    LaunchedEffect(Unit) { viewModel.load() }
    Column(modifier = Modifier.fillMaxSize().padding(18.dp)) {
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Column { Text("الإشعارات", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold); Text("تابع آخر تحديثات طلباتك", color = MaterialTheme.colorScheme.onSurfaceVariant) }
            TextButton(onClick = viewModel::markAllRead) { Text("تحديد الكل كمقروء") }
        }
        when {
            state.loading -> CircularProgressIndicator()
            state.error != null -> Text(state.error!!, color = MaterialTheme.colorScheme.error)
            state.items.isEmpty() -> Text("لا يوجد إشعارات\nأنت على اطلاع بكل شيء!", modifier = Modifier.padding(top = 36.dp), color = MaterialTheme.colorScheme.onSurfaceVariant)
            else -> LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.padding(top = 16.dp)) { items(state.items) { item -> Column(modifier = Modifier.fillMaxWidth().padding(14.dp)) { Text(item.title, fontWeight = FontWeight.Bold, color = if (item.isRead) MaterialTheme.colorScheme.onSurfaceVariant else MaterialTheme.colorScheme.primary); Text(item.body, style = MaterialTheme.typography.bodySmall); Text(item.createdAt, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant) } } }
        }
    }
}
