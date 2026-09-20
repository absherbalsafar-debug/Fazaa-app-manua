package com.fazaah.app.presentation.requests

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.fazaah.app.data.repository.CatalogRepository
import com.fazaah.app.domain.model.ServiceRequest
import com.fazaah.app.domain.model.ServiceRequestInput
import com.fazaah.app.domain.model.ServiceRequestUpdate
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class RequestUiState(
    val requests: List<ServiceRequest> = emptyList(),
    val selected: ServiceRequest? = null,
    val loading: Boolean = false,
    val saving: Boolean = false,
    val error: String? = null,
    val message: String? = null,
)

class RequestViewModel(private val repository: CatalogRepository) : ViewModel() {
    private val _state = MutableStateFlow(RequestUiState())
    val state: StateFlow<RequestUiState> = _state.asStateFlow()

    fun load(role: String) = viewModelScope.launch {
        _state.update { it.copy(loading = true, error = null) }
        runCatching { repository.requests(role) }
            .onSuccess { data -> _state.update { it.copy(requests = data, loading = false) } }
            .onFailure { error -> _state.update { it.copy(loading = false, error = error.message ?: "تعذر تحميل الطلبات") } }
    }

    fun loadOne(id: Int) = viewModelScope.launch {
        _state.update { it.copy(loading = true, error = null) }
        runCatching { repository.request(id) }
            .onSuccess { request -> _state.update { it.copy(selected = request, loading = false) } }
            .onFailure { error -> _state.update { it.copy(loading = false, error = error.message ?: "تعذر تحميل الطلب") } }
    }

    fun create(input: ServiceRequestInput, onSuccess: () -> Unit) = viewModelScope.launch {
        _state.update { it.copy(saving = true, error = null, message = null) }
        runCatching { repository.createRequest(input) }
            .onSuccess { request -> _state.update { it.copy(saving = false, message = "تم إرسال الطلب بنجاح", selected = request) }; onSuccess() }
            .onFailure { error -> _state.update { it.copy(saving = false, error = error.message ?: "لم نتمكن من إرسال الطلب") } }
    }

    fun updateStatus(id: Int, status: String) = viewModelScope.launch {
        _state.update { it.copy(saving = true, error = null) }
        runCatching { repository.updateRequest(id, ServiceRequestUpdate(status)) }
            .onSuccess { request -> _state.update { it.copy(saving = false, selected = request, message = "تم تحديث حالة الطلب") } }
            .onFailure { error -> _state.update { it.copy(saving = false, error = error.message ?: "تعذر تحديث حالة الطلب") } }
    }

    companion object {
        fun factory(repository: CatalogRepository): ViewModelProvider.Factory = object : ViewModelProvider.Factory {
            @Suppress("UNCHECKED_CAST")
            override fun <T : ViewModel> create(modelClass: Class<T>): T = RequestViewModel(repository) as T
        }
    }
}
