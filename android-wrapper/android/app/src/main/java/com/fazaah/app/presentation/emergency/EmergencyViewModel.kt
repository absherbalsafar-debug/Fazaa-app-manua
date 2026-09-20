package com.fazaah.app.presentation.emergency

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.fazaah.app.data.repository.AuthRepository
import com.fazaah.app.data.repository.CatalogRepository
import com.fazaah.app.domain.model.ServiceRequestInput
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class EmergencyService(
    val id: Int,
    val categoryId: Int?,
    val title: String,
    val description: String,
)

data class EmergencyUiState(
    val city: String = "صنعاء",
    val selectedServiceId: Int? = null,
    val sending: Boolean = false,
    val sent: Boolean = false,
    val error: String? = null,
)

class EmergencyViewModel(
    private val catalogRepository: CatalogRepository,
    private val authRepository: AuthRepository,
) : ViewModel() {
    private val _uiState = MutableStateFlow(EmergencyUiState())
    val uiState: StateFlow<EmergencyUiState> = _uiState.asStateFlow()

    init {
        viewModelScope.launch {
            runCatching { authRepository.currentUser() }
                .onSuccess { user -> _uiState.update { it.copy(city = user.city?.takeIf(String::isNotBlank) ?: "صنعاء") } }
        }
    }

    fun send(service: EmergencyService) {
        if (_uiState.value.sending) return
        _uiState.update { it.copy(selectedServiceId = service.id, sending = true, error = null) }
        viewModelScope.launch {
            runCatching {
                val page = catalogRepository.providers(categoryId = service.categoryId)
                val provider = page.providers.firstOrNull { it.isAvailable } ?: page.providers.firstOrNull()
                    ?: error("لا يوجد مهني متاح لهذا النوع حالياً")
                catalogRepository.createRequest(
                    ServiceRequestInput(
                        providerId = provider.id,
                        serviceType = service.title,
                        description = "طلب طارئ: ${service.description}",
                        city = _uiState.value.city,
                        district = "",
                        scheduledAt = null,
                        isImmediate = true,
                    ),
                )
            }.onSuccess {
                _uiState.update { it.copy(sending = false, sent = true) }
            }.onFailure { throwable ->
                _uiState.update { it.copy(sending = false, error = throwable.message ?: "تعذر إرسال الطلب، حاول مرة أخرى") }
            }
        }
    }

    fun consumeError() = _uiState.update { it.copy(error = null) }

    companion object {
        fun factory(catalogRepository: CatalogRepository, authRepository: AuthRepository) = object : ViewModelProvider.Factory {
            @Suppress("UNCHECKED_CAST")
            override fun <T : ViewModel> create(modelClass: Class<T>): T = EmergencyViewModel(catalogRepository, authRepository) as T
        }
    }
}
