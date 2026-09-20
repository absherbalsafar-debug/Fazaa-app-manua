package com.fazaah.app.presentation.favorites

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.fazaah.app.data.repository.CatalogRepository
import com.fazaah.app.domain.model.ProviderSummary
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class FavoritesUiState(val items: List<ProviderSummary> = emptyList(), val loading: Boolean = false, val error: String? = null)

class FavoritesViewModel(private val repository: CatalogRepository) : ViewModel() {
    private val _state = MutableStateFlow(FavoritesUiState())
    val state = _state.asStateFlow()
    fun load() = viewModelScope.launch { _state.update { it.copy(loading = true, error = null) }; runCatching { repository.favorites() }.onSuccess { data -> _state.value = FavoritesUiState(data) }.onFailure { e -> _state.update { it.copy(loading = false, error = e.message ?: "تعذر تحميل المفضلة") } } }
    fun remove(id: Int) = viewModelScope.launch { runCatching { repository.removeFavorite(id) }.onSuccess { load() } }
    companion object { fun factory(repository: CatalogRepository) = object : ViewModelProvider.Factory { @Suppress("UNCHECKED_CAST") override fun <T : ViewModel> create(modelClass: Class<T>): T = FavoritesViewModel(repository) as T } }
}

@Composable
fun FavoritesScreen(repository: CatalogRepository) {
    val vm: FavoritesViewModel = androidx.lifecycle.viewmodel.compose.viewModel(factory = FavoritesViewModel.factory(repository))
    val state by vm.state.collectAsStateWithLifecycle()
    LaunchedEffect(Unit) { vm.load() }
    Column(Modifier.fillMaxSize().padding(18.dp)) {
        Text("المفضلة", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
        when { state.loading -> CircularProgressIndicator(); state.error != null -> Text(state.error!!, color = MaterialTheme.colorScheme.error); state.items.isEmpty() -> Text("لم تضف أي مهني إلى المفضلة بعد.", modifier = Modifier.padding(top = 32.dp), color = MaterialTheme.colorScheme.onSurfaceVariant); else -> LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.padding(top = 16.dp)) { items(state.items) { provider -> Card(Modifier.fillMaxWidth()) { Column(Modifier.padding(16.dp)) { Text(provider.name, fontWeight = FontWeight.Bold); Text("${provider.categoryName} • ${provider.city}", style = MaterialTheme.typography.bodySmall); Button(onClick = { vm.remove(provider.id) }) { Text("إزالة من المفضلة") } } } } } }
    }
}
