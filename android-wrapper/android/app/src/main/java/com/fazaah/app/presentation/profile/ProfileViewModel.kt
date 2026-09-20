package com.fazaah.app.presentation.profile

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.fazaah.app.data.repository.AuthRepository
import com.fazaah.app.domain.model.AuthUser
import com.fazaah.app.domain.model.UpdateProfileRequest
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class ProfileUiState(
    val user: AuthUser? = null,
    val name: String = "",
    val city: String = "",
    val governorate: String = "",
    val district: String = "",
    val whatsapp: String = "",
    val loading: Boolean = true,
    val saving: Boolean = false,
    val message: String? = null,
    val error: String? = null,
)

class ProfileViewModel(private val repository: AuthRepository) : ViewModel() {
    private val _uiState = MutableStateFlow(ProfileUiState())
    val uiState: StateFlow<ProfileUiState> = _uiState.asStateFlow()

    init { refresh() }

    fun refresh() {
        viewModelScope.launch {
            _uiState.update { it.copy(loading = true, error = null) }
            runCatching { repository.currentUser() }
                .onSuccess { user -> _uiState.value = ProfileUiState(user = user, name = user.name.orEmpty(), city = user.city.orEmpty(), governorate = user.governorate.orEmpty(), district = user.district.orEmpty(), whatsapp = user.whatsapp.orEmpty(), loading = false) }
                .onFailure { error -> _uiState.update { it.copy(loading = false, error = error.message ?: "تعذر تحميل الحساب") } }
        }
    }

    fun setName(value: String) = _uiState.update { it.copy(name = value, message = null) }
    fun setCity(value: String) = _uiState.update { it.copy(city = value, message = null) }
    fun setGovernorate(value: String) = _uiState.update { it.copy(governorate = value, message = null) }
    fun setDistrict(value: String) = _uiState.update { it.copy(district = value, message = null) }
    fun setWhatsapp(value: String) = _uiState.update { it.copy(whatsapp = value.filter { char -> char.isDigit() || char == '+' }, message = null) }

    fun save() {
        val state = _uiState.value
        if (state.name.trim().length < 3) {
            _uiState.update { it.copy(error = "يرجى إدخال اسم صحيح") }
            return
        }
        viewModelScope.launch {
            _uiState.update { it.copy(saving = true, error = null, message = null) }
            runCatching { repository.updateProfile(UpdateProfileRequest(state.name.trim(), state.city.trim(), state.governorate.trim(), state.district.trim(), state.whatsapp.trim())) }
                .onSuccess { user -> _uiState.update { it.copy(user = user, saving = false, message = "تم حفظ بيانات الحساب") } }
                .onFailure { error -> _uiState.update { it.copy(saving = false, error = error.message ?: "تعذر حفظ بيانات الحساب") } }
        }
    }

    companion object {
        fun factory(repository: AuthRepository): ViewModelProvider.Factory =
            object : ViewModelProvider.Factory {
                @Suppress("UNCHECKED_CAST")
                override fun <T : ViewModel> create(modelClass: Class<T>): T = ProfileViewModel(repository) as T
            }
    }
}
