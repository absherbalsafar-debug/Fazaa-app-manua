package com.fazaah.app

import android.content.Context
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.ArrowForward
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.launch
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

private enum class AuthStep { PHONE, OTP, PROFILE, HOME }
private enum class Role { CLIENT, PROVIDER }

private data class ApiResult(val json: JSONObject)

private class AuthApi {
    private val baseUrl = BuildConfig.API_BASE_URL

    fun post(path: String, body: JSONObject): ApiResult {
        val connection = (URL("$baseUrl$path").openConnection() as HttpURLConnection).apply {
            requestMethod = "POST"
            connectTimeout = 15_000
            readTimeout = 15_000
            doOutput = true
            setRequestProperty("Content-Type", "application/json")
        }
        connection.outputStream.use { it.write(body.toString().toByteArray()) }
        val stream = if (connection.responseCode in 200..299) connection.inputStream else connection.errorStream
        val response = stream?.bufferedReader()?.use { it.readText() }.orEmpty()
        val json = if (response.isBlank()) JSONObject() else JSONObject(response)
        if (connection.responseCode !in 200..299) {
            throw IllegalStateException(json.optString("error", "حدث خطأ في الاتصال بالخادم"))
        }
        return ApiResult(json)
    }
}

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            androidx.compose.runtime.CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Rtl) {
                MaterialTheme {
                    Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
                        FazaahAuthScreen(getSharedPreferences("auth", Context.MODE_PRIVATE))
                    }
                }
            }
        }
    }
}

@androidx.compose.runtime.Composable
private fun FazaahAuthScreen(preferences: android.content.SharedPreferences) {
    val scope = rememberCoroutineScope()
    val api = remember { AuthApi() }
    var step by remember { mutableStateOf(AuthStep.PHONE) }
    var role by remember { mutableStateOf(Role.CLIENT) }
    var phone by remember { mutableStateOf("") }
    var code by remember { mutableStateOf("") }
    var name by remember { mutableStateOf("") }
    var latitude by remember { mutableStateOf("") }
    var longitude by remember { mutableStateOf("") }
    var developmentOtp by remember { mutableStateOf<String?>(null) }
    var message by remember { mutableStateOf<String?>(null) }
    var loading by remember { mutableStateOf(false) }

    fun runRequest(request: () -> ApiResult, onSuccess: (JSONObject) -> Unit) {
        loading = true
        message = null
        scope.launch {
            try {
                val result = withContext(Dispatchers.IO) { request() }
                onSuccess(result.json)
            } catch (error: Exception) {
                message = error.message ?: "تعذر تنفيذ الطلب"
            } finally {
                loading = false
            }
        }
    }

    Column(
        modifier = Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        if (step != AuthStep.PHONE) {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.Start) {
                IconButton(onClick = { step = if (step == AuthStep.PROFILE) AuthStep.OTP else AuthStep.PHONE }) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "رجوع")
                }
            }
        }

        Icon(Icons.Default.Phone, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
        Spacer(Modifier.height(16.dp))
        Text("فزعة FAZAAH", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold)
        Text(
            when (step) {
                AuthStep.PHONE -> "تطبيق Android أصلي بـ Kotlin"
                AuthStep.OTP -> "تحقق من هاتفك"
                AuthStep.PROFILE -> "أكمل بياناتك"
                AuthStep.HOME -> "مرحبًا بك في فزعة"
            },
            style = MaterialTheme.typography.bodyLarge,
        )
        Spacer(Modifier.height(28.dp))

        when (step) {
            AuthStep.PHONE -> {
                Text("كيف ستستخدم فزعة؟", fontWeight = FontWeight.Bold)
                Spacer(Modifier.height(10.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    FilterChip(selected = role == Role.CLIENT, onClick = { role = Role.CLIENT }, label = { Text("أبحث عن خدمة") })
                    FilterChip(selected = role == Role.PROVIDER, onClick = { role = Role.PROVIDER }, label = { Text("أقدم خدمة") })
                }
                Spacer(Modifier.height(18.dp))
                OutlinedTextField(phone, { phone = it.filter(Char::isDigit) }, label = { Text("رقم الهاتف") }, placeholder = { Text("7XXXXXXXX") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                Spacer(Modifier.height(16.dp))
                Button(enabled = !loading && phone.length >= 9, onClick = {
                    runRequest({ api.post("/auth/send-otp", JSONObject().put("phone", phone).put("role", role.name.lowercase()).put("mode", "login")) }) { result ->
                        developmentOtp = result.optString("otp").takeIf { it.isNotBlank() }
                        step = AuthStep.OTP
                    }
                }, modifier = Modifier.fillMaxWidth()) {
                    if (loading) CircularProgressIndicator(modifier = Modifier.width(20.dp).height(20.dp)) else Text("إرسال رمز التحقق")
                }
            }
            AuthStep.OTP -> {
                Text("أدخل الرمز المكون من 6 أرقام")
                Spacer(Modifier.height(12.dp))
                OutlinedTextField(code, { code = it.filter(Char::isDigit).take(6) }, label = { Text("رمز التحقق") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                developmentOtp?.let { otp ->
                    Spacer(Modifier.height(12.dp))
                    Card(modifier = Modifier.fillMaxWidth()) { Text("رمز التطوير: $otp", modifier = Modifier.padding(16.dp), fontWeight = FontWeight.Bold) }
                }
                Spacer(Modifier.height(16.dp))
                Button(enabled = !loading && code.length == 6, onClick = {
                    runRequest({ api.post("/auth/verify-otp", JSONObject().put("phone", phone).put("code", code).put("role", role.name.lowercase()).put("mode", "login")) }) { result ->
                        if (result.optBoolean("needsRegistration")) step = AuthStep.PROFILE else {
                            preferences.edit().putString("token", result.optString("token")).apply()
                            step = AuthStep.HOME
                        }
                    }
                }, modifier = Modifier.fillMaxWidth()) { Text("تحقق ودخول") }
                TextButton(onClick = { step = AuthStep.PHONE }) { Text("تغيير رقم الهاتف") }
            }
            AuthStep.PROFILE -> {
                Text("أدخل بياناتك لإكمال إنشاء الحساب")
                Spacer(Modifier.height(12.dp))
                OutlinedTextField(name, { name = it }, label = { Text("الاسم الرباعي") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                if (role == Role.CLIENT) {
                    Spacer(Modifier.height(10.dp))
                    OutlinedTextField(latitude, { latitude = it }, label = { Text("خط العرض") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                    Spacer(Modifier.height(10.dp))
                    OutlinedTextField(longitude, { longitude = it }, label = { Text("خط الطول") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                }
                Spacer(Modifier.height(16.dp))
                Button(enabled = !loading && name.trim().split(" ").filter(String::isNotBlank).size >= 4, onClick = {
                    runRequest({ api.post("/auth/verify-otp", JSONObject().put("phone", phone).put("code", code).put("name", name).put("role", role.name.lowercase()).put("mode", "register").put("latitude", latitude.toDoubleOrNull()).put("longitude", longitude.toDoubleOrNull())) }) { result ->
                        preferences.edit().putString("token", result.optString("token")).apply()
                        step = AuthStep.HOME
                    }
                }, modifier = Modifier.fillMaxWidth()) { Text("إكمال التسجيل") }
            }
            AuthStep.HOME -> {
                Text("تم تسجيل الدخول بنجاح", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                Spacer(Modifier.height(12.dp))
                Text("هذه أول شاشة أصلية بـ Kotlin. سيتم ترحيل بقية وظائف التطبيق إليها تدريجيًا.")
                Spacer(Modifier.height(20.dp))
                Button(onClick = { preferences.edit().remove("token").apply(); step = AuthStep.PHONE }, modifier = Modifier.fillMaxWidth()) { Text("تسجيل الخروج") }
            }
        }

        message?.let {
            Spacer(Modifier.height(16.dp))
            Text(it, color = MaterialTheme.colorScheme.error)
        }
    }
}
