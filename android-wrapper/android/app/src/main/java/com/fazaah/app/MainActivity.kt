package com.fazaah.app

import android.Manifest
import android.annotation.SuppressLint
import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Bundle
import android.webkit.CookieManager
import android.webkit.GeolocationPermissions
import android.webkit.PermissionRequest
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceError
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat

class MainActivity : ComponentActivity() {
    private lateinit var webView: WebView
    private var fileChooserCallback: ValueCallback<Array<Uri>>? = null
    private var pendingGeolocation: GeolocationPermissions.Callback? = null
    private var pendingGeolocationOrigin: String? = null
    private val fileChooserRequestCode = 4101
    private val locationPermissionLauncher = registerForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) { result ->
        val granted = result.values.any { it }
        pendingGeolocation?.invoke(pendingGeolocationOrigin, granted, false)
        pendingGeolocation = null
        pendingGeolocationOrigin = null
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.statusBarColor = 0xFF080B12.toInt()
        window.navigationBarColor = 0xFF080B12.toInt()

        webView = WebView(this).apply {
            setBackgroundColor(0xFFF7F8FA.toInt())
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
                override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                    val uri = request.url
                    return when (uri.scheme?.lowercase()) {
                        "http", "https" -> false
                        "tel", "sms", "mailto", "whatsapp" -> {
                            runCatching { startActivity(Intent(Intent.ACTION_VIEW, uri)) }
                            true
                        }
                        else -> true
                    }
                }

                @Deprecated("Deprecated in API 23")
                override fun shouldOverrideUrlLoading(view: WebView, url: String): Boolean {
                    return shouldOpenExternal(Uri.parse(url))
                }

                override fun onReceivedError(view: WebView, request: WebResourceRequest, error: WebResourceError) {
                    if (request.isForMainFrame) view.loadUrl(BuildConfig.WEB_APP_URL)
                }

                override fun onPageFinished(view: WebView, url: String) {
                    super.onPageFinished(view, url)
                    val js = """
                        (function() {
                            const selectors = ['[class*="manus-badge"]', '[id*="manus-badge"]', '[class*="made-with-manus"]', '[id*="made-with-manus"]', 'a[href*="manus.im"]', 'a[href*="manus.space"]'];
                            function clean() {
                                document.querySelectorAll(selectors.join(',')).forEach(e => e.remove());
                            }
                            clean();
                            new MutationObserver(clean).observe(document.documentElement, { childList: true, subtree: true });
                        })();
                    """.trimIndent()
                    view.evaluateJavascript(js, null)
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

        setContentView(webView)
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) webView.goBack() else finish()
            }
        })
    }

    private fun shouldOpenExternal(uri: Uri): Boolean {
        return when (uri.scheme?.lowercase()) {
            "http", "https" -> false
            "tel", "sms", "mailto", "whatsapp" -> { runCatching { startActivity(Intent(Intent.ACTION_VIEW, uri)) }; true }
            else -> true
        }
    }

    @Deprecated("Deprecated in API  Activity result API is used by the WebView contract")
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == fileChooserRequestCode) {
            val results = if (resultCode == Activity.RESULT_OK) WebChromeClient.FileChooserParams.parseResult(resultCode, data) else null
            fileChooserCallback?.onReceiveValue(results)
            fileChooserCallback = null
        }
    }

    override fun onDestroy() {
        fileChooserCallback?.onReceiveValue(null)
        fileChooserCallback = null
        webView.stopLoading()
        webView.webChromeClient = null
        webView.destroy()
        super.onDestroy()
    }
}
