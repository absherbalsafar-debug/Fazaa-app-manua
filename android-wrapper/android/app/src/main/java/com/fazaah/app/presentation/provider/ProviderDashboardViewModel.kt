package com.fazaah.app.presentation.provider

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.fazaah.app.data.repository.CatalogRepository
import com.fazaah.app.domain.model.ProviderSummary
import com.fazaah.app.domain.model.ServiceRequest
import kotlinx.coroutines.async
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class ProviderDashboardUiState(
    val profile: ProviderSummary? = null,
    val requests: List<ServiceRequest> = emptyList(),
    val loading: Boolean = true,
    val updatingAvailability: Boolean = false,
    val error: String? = null,
)

class ProviderDashboardViewModel(private val repository: CatalogRepository) : ViewModel() {
    private val _uiState = MutableStateFlow(ProviderDashboardUiState())
    val uiState: StateFlow<ProviderDashboardUiState> = _uiState.asStateFlow()

    init { reload() }

    fun reload() {
        _uiState.update { it.copy(loading = true, error = null) }
        viewModelScope.launch {
            runCatching {
                coroutineScope {
                    val profile = async { repository.providerProfile() }
                    val requests = async { repository.requests("provider") }
                    profile.await() to requests.await()
                }
            }.onSuccess { (profile, requests) ->
                _uiState.value = ProviderDashboardUiState(profile = profile, requests = requests, loading = false)
            }.onFailure { error ->
                _uiState.update { it.copy(loading = false, error = error.message ?: "تعذر تحميل لوحة المهني") }
            }
        }
    }

    fun toggleAvailability(value: Boolean) {
        val profile = _uiState.value.profile ?: return
        if (_uiState.value.updatingAvailability) return
        _uiState.update { it.copy(updatingAvailability = true, error = null) }
        viewModelScope.launch {
            runCatching { repository.updateAvailability(profile.id, value) }
                .onSuccess { updated -> _uiState.update { it.copy(profile = updated, updatingAvailability = false) } }
                .onFailure { error -> _uiState.update { it.copy(updatingAvailability = false, error = error.message ?: "تعذر تحديث الحالة") } }
        }
    }

    companion object {
        fun factory(repository: CatalogRepository) = object : ViewModelProvider.Factory {
            @Suppress("UNCHECKED_CAST")
            override fun <T : ViewModel> create(modelClass: Class<T>): T = ProviderDashboardViewModel(repository) as T
        }
    }
}
