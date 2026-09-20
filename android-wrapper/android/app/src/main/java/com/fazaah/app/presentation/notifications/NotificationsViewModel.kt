package com.fazaah.app.presentation.notifications

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.fazaah.app.data.repository.CatalogRepository
import com.fazaah.app.domain.model.AppNotification
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class NotificationsUiState(
    val items: List<AppNotification> = emptyList(),
    val loading: Boolean = false,
    val error: String? = null,
)

class NotificationsViewModel(private val repository: CatalogRepository) : ViewModel() {
    private val _state = MutableStateFlow(NotificationsUiState())
    val state: StateFlow<NotificationsUiState> = _state.asStateFlow()

    fun load() = viewModelScope.launch {
        _state.update { it.copy(loading = true, error = null) }
        runCatching { repository.notifications() }
            .onSuccess { items -> _state.update { it.copy(items = items, loading = false) } }
            .onFailure { error -> _state.update { it.copy(loading = false, error = error.message ?: "تعذر تحميل الإشعارات") } }
    }

    fun markAllRead() = viewModelScope.launch {
        runCatching { repository.markAllNotificationsRead() }.onSuccess { load() }
    }

    companion object {
        fun factory(repository: CatalogRepository): ViewModelProvider.Factory = object : ViewModelProvider.Factory {
            @Suppress("UNCHECKED_CAST")
            override fun <T : ViewModel> create(modelClass: Class<T>): T = NotificationsViewModel(repository) as T
        }
    }
}
