package com.fazaah.app.presentation.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.fazaah.app.data.repository.AuthRepository
import com.fazaah.app.domain.model.VerifyOtpRequest
import com.fazaah.app.domain.model.VerificationDocumentRequest
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

class AuthViewModel(private val repository: AuthRepository) : ViewModel() {
    private val _uiState = MutableStateFlow(AuthUiState())
    val uiState: StateFlow<AuthUiState> = _uiState.asStateFlow()

    fun setRole(role: UserRole) = _uiState.update { it.copy(role = role) }
    fun setPhone(value: String) = _uiState.update { it.copy(phone = value.filter(Char::isDigit), message = null) }
    fun setCode(value: String) = _uiState.update { it.copy(code = value.filter(Char::isDigit).take(6), message = null) }
    fun setName(value: String) = _uiState.update { it.copy(name = value, message = null) }
    fun setLatitude(value: String) = _uiState.update { it.copy(latitude = value, message = null) }
    fun setLongitude(value: String) = _uiState.update { it.copy(longitude = value, message = null) }
    fun setWhatsapp(value: String) = _uiState.update { it.copy(whatsapp = value.filter { char -> char.isDigit() || char == '+' }, message = null) }
    fun setCategoryId(value: Int?) = _uiState.update { it.copy(categoryId = value, message = null) }
    fun setSpecialty(value: String) = _uiState.update { it.copy(specialty = value, message = null) }
    fun setBio(value: String) = _uiState.update { it.copy(bio = value, message = null) }
    fun setSelfie(value: String?) = _uiState.update { it.copy(selfieBase64 = value, message = null) }
    fun setIdFront(value: String?) = _uiState.update { it.copy(idFrontBase64 = value, message = null) }
    fun setIdBack(value: String?) = _uiState.update { it.copy(idBackBase64 = value, message = null) }

    fun sendOtp() {
        val state = _uiState.value
        if (state.phone.length < 9) return
        execute(request = {
            repository.sendOtp(state.phone, state.role.apiValue, "login")
        }, onSuccess = { response ->
            _uiState.update { it.copy(step = AuthStep.OTP, developmentOtp = response.otp) }
        })
    }

    fun verifyLogin() {
        val state = _uiState.value
        if (state.code.length != 6) return
        execute(request = {
            repository.verifyOtp(VerifyOtpRequest(state.phone, state.code, role = state.role.apiValue, mode = "login"))
        }, onSuccess = { response ->
            _uiState.update { current -> current.copy(step = if (response.needsRegistration) AuthStep.PROFILE else AuthStep.HOME) }
        })
    }

    fun completeProfile() {
        val state = _uiState.value
        if (state.name.trim().split(" ").filter(String::isNotBlank).size < 4) return
        if (state.role == UserRole.PROVIDER && (state.latitude.toDoubleOrNull() == null || state.longitude.toDoubleOrNull() == null || state.selfieBase64 == null || state.idFrontBase64 == null || state.idBackBase64 == null)) {
            _uiState.update { it.copy(message = "الموقع والصورة الشخصية وصور الهوية مطلوبة للمهني") }
            return
        }
        execute(request = {
            repository.verifyOtp(VerifyOtpRequest(
                phone = state.phone,
                code = state.code,
                name = state.name.trim(),
                role = state.role.apiValue,
                mode = "register",
                latitude = state.latitude.toDoubleOrNull(),
                longitude = state.longitude.toDoubleOrNull(),
                whatsapp = state.whatsapp.trim(),
                categoryId = state.categoryId,
                specialty = state.specialty.trim(),
                bio = state.bio.trim(),
                termsAccepted = state.role == UserRole.PROVIDER,
            ))
        }, onSuccess = { response ->
            viewModelScope.launch {
                if (state.role == UserRole.PROVIDER) {
                    listOf(
                        "selfie" to state.selfieBase64,
                        "id_front" to state.idFrontBase64,
                        "id_back" to state.idBackBase64,
                    ).forEach { (type, data) ->
                        if (data != null) repository.uploadVerificationDocument(VerificationDocumentRequest(type, "$type.jpg", dataBase64 = data))
                    }
                }
                _uiState.update { it.copy(step = AuthStep.HOME, message = if (state.role == UserRole.PROVIDER) "تم إرسال طلب اعتمادك للمراجعة" else null) }
            }
        })
    }

    fun goBack() = _uiState.update { state ->
        state.copy(step = when (state.step) {
            AuthStep.PROFILE -> AuthStep.OTP
            AuthStep.OTP -> AuthStep.PHONE
            else -> state.step
        }, message = null)
    }

    fun resetToPhone() = _uiState.update { it.copy(step = AuthStep.PHONE, code = "", developmentOtp = null, message = null) }

    fun logout() {
        viewModelScope.launch {
            repository.logout()
            _uiState.value = AuthUiState()
        }
    }

    private fun <T> execute(request: suspend () -> T, onSuccess: (T) -> Unit) {
        _uiState.update { it.copy(loading = true, message = null) }
        viewModelScope.launch {
            runCatching { request() }
                .onSuccess(onSuccess)
                .onFailure { error -> _uiState.update { it.copy(message = error.message ?: "تعذر تنفيذ الطلب") } }
            _uiState.update { it.copy(loading = false) }
        }
    }

    companion object {
        fun factory(repository: AuthRepository): ViewModelProvider.Factory =
            object : ViewModelProvider.Factory {
                @Suppress("UNCHECKED_CAST")
                override fun <T : ViewModel> create(modelClass: Class<T>): T = AuthViewModel(repository) as T
            }
    }
}
