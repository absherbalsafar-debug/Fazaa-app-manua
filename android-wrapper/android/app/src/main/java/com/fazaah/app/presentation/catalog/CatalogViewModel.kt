package com.fazaah.app.presentation.catalog

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.fazaah.app.data.repository.CatalogRepository
import com.fazaah.app.domain.model.Category
import com.fazaah.app.domain.model.ProviderSummary
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class CatalogUiState(
    val categories: List<Category> = emptyList(),
    val providers: List<ProviderSummary> = emptyList(),
    val selectedCategoryId: Int? = null,
    val search: String = "",
    val specialty: String = "",
    val isLoading: Boolean = false,
    val error: String? = null,
)

class CatalogViewModel(private val repository: CatalogRepository) : ViewModel() {
    private val _uiState = MutableStateFlow(CatalogUiState())
    val uiState: StateFlow<CatalogUiState> = _uiState.asStateFlow()

    init { load() }

    fun setSearch(value: String) = _uiState.update { it.copy(search = value) }
    fun setSpecialty(value: String) = _uiState.update { it.copy(specialty = value) }
    fun selectCategory(categoryId: Int?) {
        _uiState.update { it.copy(selectedCategoryId = categoryId) }
        loadProviders()
    }

    fun load() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            runCatching { repository.categories() }
                .onSuccess { categories -> _uiState.update { it.copy(categories = categories) } }
                .onFailure { error -> _uiState.update { it.copy(error = error.message ?: "تعذر تحميل الخدمات") } }
            loadProvidersInternal()
        }
    }

    fun search() = loadProviders()

    private fun loadProviders() {
        viewModelScope.launch { loadProvidersInternal() }
    }

    private suspend fun loadProvidersInternal() {
        val state = _uiState.value
        _uiState.update { it.copy(isLoading = true, error = null) }
        runCatching {
            repository.providers(
                categoryId = state.selectedCategoryId,
                search = state.search.takeIf(String::isNotBlank),
                specialty = state.specialty.takeIf(String::isNotBlank),
            )
        }.onSuccess { page ->
            _uiState.update { it.copy(providers = page.providers, isLoading = false) }
        }.onFailure { error ->
            _uiState.update { it.copy(isLoading = false, error = error.message ?: "تعذر تحميل المهنيين") }
        }
    }

    companion object {
        fun factory(repository: CatalogRepository): ViewModelProvider.Factory =
            object : ViewModelProvider.Factory {
                @Suppress("UNCHECKED_CAST")
                override fun <T : ViewModel> create(modelClass: Class<T>): T = CatalogViewModel(repository) as T
            }
    }
}
