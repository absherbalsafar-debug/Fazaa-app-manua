package com.fazaah.app

import android.Manifest
import android.annotation.SuppressLint
import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Color as AndroidColor
import android.net.Uri
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.widget.Toast
import android.webkit.CookieManager
import android.webkit.GeolocationPermissions
import android.webkit.PermissionRequest
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.runtime.CompositionLocalProvider
import androidx.core.content.ContextCompat

private val Navy = Color(0xFF0C1830)
private val NavyCard = Color(0xFF152746)
private val Blue = Color(0xFF2F80D0)
private val Gold = Color(0xFFF2B544)
private val Muted = Color(0xFF9BAAC1)

class MainActivity : ComponentActivity() {
    private lateinit var webView: WebView
    private var webViewReady = false
    private var onboardingPage = 0
    private var fileChooserCallback: ValueCallback<Array<Uri>>? = null
    private var pendingGeolocation: GeolocationPermissions.Callback? = null
    private var pendingGeolocationOrigin: String? = null
    private var backPressedOnce = false
    private val backHandler = Handler(Looper.getMainLooper())
    private val fileChooserRequestCode = 4101
    private val locationPermissionLauncher = registerForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) { result ->
        val granted = result.values.any { it }
        pendingGeolocation?.invoke(pendingGeolocationOrigin, granted, false)
        pendingGeolocation = null
        pendingGeolocationOrigin = null
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.statusBarColor = AndroidColor.rgb(8, 11, 18)
        window.navigationBarColor = AndroidColor.rgb(8, 11, 18)
        val seen = getPreferences(MODE_PRIVATE).getBoolean("welcome_seen", false)
        if (seen) showWebView() else showOnboarding()

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (!webViewReady) {
                    if (onboardingPage > 0) {
                        onboardingPage = 0
                        showOnboarding()
                    } else finish()
                } else if (webView.canGoBack()) {
                    webView.goBack()
                } else {
                    if (backPressedOnce) {
                        backPressedOnce = false
                        showLogoutDialog()
                    } else {
                        backPressedOnce = true
                        Toast.makeText(this@MainActivity, "اضغط مرة أخرى لتسجيل الخروج", Toast.LENGTH_SHORT).show()
                        backHandler.postDelayed({ backPressedOnce = false }, 2200L)
                    }
                }
            }
        })
    }

    private fun showOnboarding() {
        webViewReady = false
        setContent {
            var page by rememberSaveable { mutableStateOf(onboardingPage) }
            WelcomeSlides(
                page = page,
                onSkip = {
                    getPreferences(MODE_PRIVATE).edit().putBoolean("welcome_seen", true).apply()
                    showWebView()
                },
                onNext = {
                    if (page == 0) {
                        page = 1
                        onboardingPage = 1
                    } else {
                        getPreferences(MODE_PRIVATE).edit().putBoolean("welcome_seen", true).apply()
                        showWebView()
                    }
                },
            )
        }
    }

    private fun showWebView() {
        webViewReady = true
        setupWebView()
        setContentView(webView)
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView() {
        if (::webView.isInitialized) return
        webView = WebView(this).apply {
            setBackgroundColor(AndroidColor.rgb(247, 248, 250))
            isFocusable = true
            isFocusableInTouchMode = true
            settings.apply {
                javaScriptEnabled = true
                domStorageEnabled = true
                databaseEnabled = true
                allowFileAccess = true
                allowContentAccess = true
                builtInZoomControls = false
                displayZoomControls = false
                loadsImagesAutomatically = true
                javaScriptCanOpenWindowsAutomatically = true
                mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
                userAgentString = "$userAgentString FAZAAH-Android-WebView/1.0"
            }
            CookieManager.getInstance().setAcceptCookie(true)
            CookieManager.getInstance().setAcceptThirdPartyCookies(this, true)
            webViewClient = object : WebViewClient() {
                override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean = shouldOpenExternal(request.url)

                @Deprecated("Deprecated in API 23")
                override fun shouldOverrideUrlLoading(view: WebView, url: String): Boolean = shouldOpenExternal(Uri.parse(url))

                override fun onReceivedError(view: WebView, request: WebResourceRequest, error: WebResourceError) {
                    if (request.isForMainFrame) view.loadUrl(BuildConfig.WEB_APP_URL)
                }

                override fun onPageFinished(view: WebView, url: String) {
                    super.onPageFinished(view, url)
                    view.evaluateJavascript("""
                        (function() {
                          const selectors = ['[class*="manus-badge"]','[id*="manus-badge"]','[class*="made-with-manus"]','[id*="made-with-manus"]','a[href*="manus.im"]','a[href*="manus.space"]'];
                          function clean(){ document.querySelectorAll(selectors.join(',')).forEach(e => e.remove()); }
                          clean(); new MutationObserver(clean).observe(document.documentElement,{childList:true,subtree:true});
                        })();
                    """.trimIndent(), null)
                }
            }
            webChromeClient = object : WebChromeClient() {
                override fun onShowFileChooser(webView: WebView, callback: ValueCallback<Array<Uri>>, params: FileChooserParams): Boolean {
                    fileChooserCallback?.onReceiveValue(null)
                    fileChooserCallback = callback
                    val intent = params.createIntent().apply {
                        addCategory(Intent.CATEGORY_OPENABLE)
                        type = params.acceptTypes.firstOrNull { it.isNotBlank() } ?: "image/*"
                    }
                    return runCatching { startActivityForResult(intent, fileChooserRequestCode) }.isSuccess
                }

                override fun onGeolocationPermissionsShowPrompt(origin: String, callback: GeolocationPermissions.Callback) {
                    if (ContextCompat.checkSelfPermission(this@MainActivity, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED) {
                        callback.invoke(origin, true, false)
                    } else {
                        pendingGeolocationOrigin = origin
                        pendingGeolocation = callback
                        locationPermissionLauncher.launch(arrayOf(Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION))
                    }
                }

                override fun onPermissionRequest(request: PermissionRequest) {
                    runOnUiThread {
                        val allowed = request.resources.filter { it == PermissionRequest.RESOURCE_VIDEO_CAPTURE || it == PermissionRequest.RESOURCE_AUDIO_CAPTURE }.toTypedArray()
                        if (allowed.isEmpty()) request.deny() else request.grant(allowed)
                    }
                }
            }
            loadUrl(BuildConfig.WEB_APP_URL)
        }
    }

    private fun shouldOpenExternal(uri: Uri): Boolean = when (uri.scheme?.lowercase()) {
        "http", "https" -> false
        "tel", "sms", "mailto", "whatsapp" -> { runCatching { startActivity(Intent(Intent.ACTION_VIEW, uri)) }; true }
        else -> true
    }

    private fun showLogoutDialog() {
        androidx.appcompat.app.AlertDialog.Builder(this)
            .setTitle("تسجيل الخروج")
            .setMessage("هل تريد تسجيل الخروج من حسابك؟")
            .setNegativeButton("إلغاء", null)
            .setPositiveButton("تسجيل الخروج") { _, _ -> logoutFromWebView() }
            .show()
    }

    private fun logoutFromWebView() {
        if (::webView.isInitialized) {
            webView.evaluateJavascript("localStorage.removeItem('fazaah_token'); sessionStorage.clear(); location.href='/welcome';", null)
            CookieManager.getInstance().flush()
        }
        Toast.makeText(this, "تم تسجيل الخروج", Toast.LENGTH_SHORT).show()
    }

    @Deprecated("Use Activity Result API")
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == fileChooserRequestCode) {
            val results = if (resultCode == Activity.RESULT_OK) WebChromeClient.FileChooserParams.parseResult(resultCode, data) else null
            fileChooserCallback?.onReceiveValue(results)
            fileChooserCallback = null
        }
    }

    override fun onDestroy() {
        if (::webView.isInitialized) {
            fileChooserCallback?.onReceiveValue(null)
            fileChooserCallback = null
            webView.stopLoading()
            webView.webChromeClient = null
            webView.destroy()
        }
        super.onDestroy()
    }
}

@Composable
private fun WelcomeSlides(page: Int, onSkip: () -> Unit, onNext: () -> Unit) {
    CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Rtl) {
        Surface(modifier = Modifier.fillMaxSize(), color = Navy) {
            Box(modifier = Modifier.fillMaxSize()) {
                Box(modifier = Modifier.size(280.dp).align(Alignment.TopStart).alpha(0.12f).background(Blue, CircleShape))
                Box(modifier = Modifier.size(220.dp).align(Alignment.BottomEnd).alpha(0.12f).background(Gold, CircleShape))
                Column(modifier = Modifier.fillMaxSize().padding(horizontal = 24.dp, vertical = 22.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                        Text(text = "فزعة", color = Gold, fontSize = 15.sp, fontWeight = FontWeight.Bold)
                        TextButton(onClick = onSkip) { Text("تخطي", color = Muted, fontSize = 14.sp) }
                    }
                    Spacer(Modifier.height(24.dp))
                    Image(painter = painterResource(R.drawable.fazaah_logo), contentDescription = "شعار فزعة", modifier = Modifier.size(118.dp), contentScale = ContentScale.Fit)
                    Spacer(Modifier.height(26.dp))
                    Box(modifier = Modifier.size(84.dp).background(Gold.copy(alpha = 0.14f), RoundedCornerShape(28.dp)), contentAlignment = Alignment.Center) {
                        Icon(if (page == 0) Icons.Default.Phone else Icons.Default.CheckCircle, contentDescription = null, tint = Gold, modifier = Modifier.size(42.dp))
                    }
                    Spacer(Modifier.height(26.dp))
                    Text(if (page == 0) "أهلاً بك في فزعة" else "خدماتك أقرب مما تتخيل", color = Color.White, fontSize = 29.sp, fontWeight = FontWeight.ExtraBold)
                    Spacer(Modifier.height(12.dp))
                    Text(if (page == 0) "منصة موثوقة توصلك بالمهني المناسب لإنجاز احتياجاتك بسهولة وأمان." else "اختر الخدمة، حدّد موقعك، وتواصل مع مهنيين موثوقين في وقت قياسي.", color = Muted, fontSize = 16.sp, lineHeight = 27.sp, textAlign = androidx.compose.ui.text.style.TextAlign.Center)
                    Spacer(Modifier.height(28.dp))
                    if (page == 0) FeatureCard(Icons.Default.Star, "مهنيون موثوقون", "خدمات من أشخاص موثوقين ومعتمدين") else FeatureCard(Icons.Default.LocationOn, "الوصول الأسرع", "نوصلك بالشخص المناسب في الوقت المناسب")
                    Spacer(Modifier.height(12.dp))
                    if (page == 0) FeatureCard(Icons.Default.LocationOn, "تحديد دقيق", "اعثر على الخدمات القريبة منك بسهولة") else FeatureCard(Icons.Default.Phone, "تواصل مباشر", "تواصل سريع وواضح مع مقدم الخدمة")
                    Spacer(Modifier.weight(1f))
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        repeat(2) { index -> Box(modifier = Modifier.width(if (index == page) 28.dp else 8.dp).height(8.dp).background(if (index == page) Gold else Muted.copy(alpha = 0.45f), RoundedCornerShape(10.dp))) }
                    }
                    Spacer(Modifier.height(20.dp))
                    Button(onClick = onNext, modifier = Modifier.fillMaxWidth().height(56.dp).shadow(12.dp, RoundedCornerShape(18.dp)), shape = RoundedCornerShape(18.dp), colors = ButtonDefaults.buttonColors(containerColor = Gold, contentColor = Navy)) {
                        Text(if (page == 0) "التالي" else "ابدأ الآن", fontSize = 17.sp, fontWeight = FontWeight.ExtraBold)
                        Spacer(Modifier.width(9.dp))
                        if (page == 0) Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = null, modifier = Modifier.size(20.dp)) else Icon(Icons.Default.Check, contentDescription = null, modifier = Modifier.size(20.dp))
                    }
                }
            }
        }
    }
}

@Composable
private fun FeatureCard(icon: androidx.compose.ui.graphics.vector.ImageVector, title: String, description: String) {
    Card(modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(20.dp), colors = CardDefaults.cardColors(containerColor = NavyCard.copy(alpha = 0.92f)), border = androidx.compose.foundation.BorderStroke(1.dp, Color.White.copy(alpha = 0.08f))) {
        Row(modifier = Modifier.fillMaxWidth().padding(15.dp), verticalAlignment = Alignment.CenterVertically) {
            Box(modifier = Modifier.size(45.dp).background(Gold.copy(alpha = 0.14f), RoundedCornerShape(14.dp)), contentAlignment = Alignment.Center) { Icon(icon, contentDescription = null, tint = Gold, modifier = Modifier.size(23.dp)) }
            Spacer(Modifier.width(13.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(title, color = Color.White, fontSize = 15.sp, fontWeight = FontWeight.Bold)
                Spacer(Modifier.height(3.dp))
                Text(description, color = Muted, fontSize = 12.sp, lineHeight = 18.sp)
            }
        }
    }
}
