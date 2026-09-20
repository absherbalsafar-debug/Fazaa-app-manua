package com.fazaah.app.presentation.catalog

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.fazaah.app.data.repository.CatalogRepository
import com.fazaah.app.domain.model.ProviderSummary
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class ProviderDetailsUiState(
    val provider: ProviderSummary? = null,
    val loading: Boolean = true,
    val error: String? = null,
)

class ProviderDetailsViewModel(
    private val repository: CatalogRepository,
    private val providerId: Int,
) : ViewModel() {
    private val _uiState = MutableStateFlow(ProviderDetailsUiState())
    val uiState: StateFlow<ProviderDetailsUiState> = _uiState.asStateFlow()

    init {
        viewModelScope.launch {
            runCatching { repository.provider(providerId) }
                .onSuccess { _uiState.value = ProviderDetailsUiState(provider = it, loading = false) }
                .onFailure { _uiState.value = ProviderDetailsUiState(loading = false, error = it.message ?: "تعذر تحميل بيانات المهني") }
        }
    }

    companion object {
        fun factory(repository: CatalogRepository, providerId: Int): ViewModelProvider.Factory =
            object : ViewModelProvider.Factory {
                @Suppress("UNCHECKED_CAST")
                override fun <T : ViewModel> create(modelClass: Class<T>): T = ProviderDetailsViewModel(repository, providerId) as T
            }
    }
}
