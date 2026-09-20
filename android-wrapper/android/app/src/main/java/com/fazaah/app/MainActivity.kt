package com.fazaah.app

import android.Manifest
import android.annotation.SuppressLint
import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Color as AndroidColor
import android.graphics.drawable.ColorDrawable
import android.location.Criteria
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.net.Uri
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.os.Build
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import android.view.View
import android.webkit.CookieManager
import android.webkit.GeolocationPermissions
import android.webkit.JavascriptInterface
import android.webkit.PermissionRequest
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebStorage
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.TextView
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AlertDialog
import androidx.core.content.ContextCompat
import com.google.firebase.messaging.FirebaseMessaging

class MainActivity : ComponentActivity() {
    private lateinit var webView: WebView
    private var fileChooserCallback: ValueCallback<Array<Uri>>? = null
    private var pendingGeolocation: GeolocationPermissions.Callback? = null
    private var pendingGeolocationOrigin: String? = null
    private var pendingNativeLocation = false
    private var nativeLocationListener: LocationListener? = null
    private var fcmToken: String? = null
    private var backPressedOnce = false
    private val backHandler = Handler(Looper.getMainLooper())
    private val fileChooserRequestCode = 4101
    private val locationPermissionLauncher = registerForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) { result ->
        val granted = result.values.any { it }
        if (pendingNativeLocation) {
            pendingNativeLocation = false
            if (granted) requestNativeLocation() else sendNativeLocationError("تم رفض إذن الموقع")
        } else {
            pendingGeolocation?.invoke(pendingGeolocationOrigin, granted, false)
            pendingGeolocation = null
            pendingGeolocationOrigin = null
        }
    }
    private val notificationPermissionLauncher = registerForActivityResult(ActivityResultContracts.RequestPermission()) { }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.statusBarColor = AndroidColor.rgb(8, 11, 18)
        window.navigationBarColor = AndroidColor.rgb(8, 11, 18)
        clearWebSessionOnFirstInstall()
        setupWebView()
        setContentView(webView)
        FazaaFirebaseMessagingService.ensureNotificationChannel(this)
        requestNotificationPermission()
        initializePushNotifications()
        checkForAppUpdate()

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) {
                    webView.goBack()
                    return
                }
                if (backPressedOnce) {
                    backPressedOnce = false
                    showLogoutDialog()
                } else {
                    backPressedOnce = true
                    Toast.makeText(this@MainActivity, "اضغط مرة أخرى لتسجيل الخروج", Toast.LENGTH_SHORT).show()
                    backHandler.postDelayed({ backPressedOnce = false }, 2200L)
                }
            }
        })
    }

    private fun requestNotificationPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
            ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
        ) {
            notificationPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
        }
    }

    private fun initializePushNotifications() {
        FirebaseMessaging.getInstance().token.addOnCompleteListener { task ->
            if (!task.isSuccessful) return@addOnCompleteListener
            fcmToken = task.result
            getSharedPreferences(FazaaFirebaseMessagingService.PREFS, MODE_PRIVATE)
                .edit()
                .putString(FazaaFirebaseMessagingService.FCM_TOKEN_KEY, task.result)
                .apply()
            registerPushTokenInWebView()
        }
    }

    private fun registerPushTokenInWebView() {
        val token = fcmToken ?: return
        val quotedToken = JSONObject.quote(token)
        webView.post { webView.evaluateJavascript("window.FazaaNativePushToken=$quotedToken; window.FazaaRegisterPushToken?.($quotedToken)", null) }
    }

    private fun checkForAppUpdate() {
        Thread {
            val connection = runCatching { URL("${BuildConfig.API_BASE_URL}/app-version").openConnection() as HttpURLConnection }.getOrNull()
            if (connection == null) return@Thread
            try {
                connection.connectTimeout = 7000
                connection.readTimeout = 7000
                connection.requestMethod = "GET"
                if (connection.responseCode !in 200..299) return@Thread
                val payload = connection.inputStream.bufferedReader().use { it.readText() }
                val update = JSONObject(payload)
                val latestVersionCode = update.optInt("versionCode", BuildConfig.VERSION_CODE)
                if (latestVersionCode <= BuildConfig.VERSION_CODE) return@Thread
                val versionName = update.optString("versionName", "أحدث إصدار")
                val downloadUrl = update.optString("downloadUrl", BuildConfig.WEB_APP_URL)
                val title = update.optString("title", "هناك تحديث جديد في التطبيق")
                val message = update.optString("message", "نزّل أحدث نسخة من تطبيق فزعة للاستفادة من التحسينات الجديدة.")
                val forceUpdate = update.optBoolean("forceUpdate", false)
                runOnUiThread { showUpdateDialog(title, message, versionName, downloadUrl, forceUpdate) }
            } catch (_: Exception) {
                // فشل الفحص لا يمنع تشغيل التطبيق أو استخدام الموقع.
            } finally {
                connection.disconnect()
            }
        }.start()
    }

    private fun showUpdateDialog(title: String, message: String, versionName: String, downloadUrl: String, forceUpdate: Boolean) {
        if (isFinishing || isDestroyed) return
        val dialog = AlertDialog.Builder(this)
            .setTitle(title)
            .setMessage("$message\n\nالإصدار المتاح: $versionName")
            .setPositiveButton("تنزيل أحدث نسخة") { _, _ ->
                runCatching { startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(downloadUrl))) }
                    .onFailure { Toast.makeText(this, "تعذر فتح رابط التنزيل", Toast.LENGTH_SHORT).show() }
            }
            .create()
        if (!forceUpdate) dialog.setButton(AlertDialog.BUTTON_NEGATIVE, "لاحقاً", null as android.content.DialogInterface.OnClickListener?)
        dialog.setCancelable(!forceUpdate)
        dialog.setOnShowListener {
            dialog.window?.setBackgroundDrawable(ColorDrawable(AndroidColor.rgb(21, 27, 41)))
            dialog.window?.setDimAmount(0.72f)
            val titleId = resources.getIdentifier("alertTitle", "id", "android")
            dialog.findViewById<TextView>(titleId)?.setTextColor(AndroidColor.WHITE)
            dialog.findViewById<TextView>(android.R.id.message)?.setTextColor(AndroidColor.rgb(220, 226, 236))
            dialog.getButton(AlertDialog.BUTTON_NEGATIVE)?.setTextColor(AndroidColor.rgb(155, 170, 193))
            dialog.getButton(AlertDialog.BUTTON_POSITIVE)?.setTextColor(AndroidColor.rgb(242, 181, 68))
        }
        dialog.show()
    }

    private fun clearWebSessionOnFirstInstall() {
        val preferences = getPreferences(MODE_PRIVATE)
        if (!preferences.getBoolean("install_initialized_v2", false)) {
            WebStorage.getInstance().deleteAllData()
            CookieManager.getInstance().removeAllCookies(null)
            CookieManager.getInstance().flush()
            preferences.edit().putBoolean("install_initialized_v2", true).apply()
        }
    }

    private fun hasLocationPermission(): Boolean =
        ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED ||
            ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED

    private inner class NativeLocationBridge {
        @JavascriptInterface
        fun requestLocation() {
            runOnUiThread { requestNativeLocation() }
        }
    }

    private fun requestNativeLocation() {
        if (!hasLocationPermission()) {
            pendingNativeLocation = true
            locationPermissionLauncher.launch(arrayOf(Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION))
            return
        }
        val manager = getSystemService(LOCATION_SERVICE) as LocationManager
        val criteria = Criteria().apply {
            accuracy = Criteria.ACCURACY_FINE
            powerRequirement = Criteria.POWER_HIGH
        }
        val provider = manager.getBestProvider(criteria, true)
            ?: listOf(LocationManager.GPS_PROVIDER, LocationManager.NETWORK_PROVIDER).firstOrNull { manager.isProviderEnabled(it) }
        if (provider == null) {
            sendNativeLocationError("فعّل خدمة الموقع في إعدادات الهاتف ثم حاول مرة أخرى")
            return
        }
        val last = runCatching { manager.getLastKnownLocation(provider) }.getOrNull()
        if (last != null && System.currentTimeMillis() - last.time < 5 * 60 * 1000L) {
            sendNativeLocation(last)
            return
        }
        nativeLocationListener?.let { runCatching { manager.removeUpdates(it) } }
        val listener = object : LocationListener {
            override fun onLocationChanged(location: Location) {
                nativeLocationListener = null
                runCatching { manager.removeUpdates(this) }
                sendNativeLocation(location)
            }
        }
        nativeLocationListener = listener
        runCatching {
            manager.requestLocationUpdates(provider, 0L, 0f, listener, Looper.getMainLooper())
            backHandler.postDelayed({
                if (nativeLocationListener === listener) {
                    nativeLocationListener = null
                    runCatching { manager.removeUpdates(listener) }
                    sendNativeLocationError("تعذر الحصول على موقعك الحالي، حاول مرة أخرى")
                }
            }, 15000L)
        }.onFailure { sendNativeLocationError("تعذر تشغيل خدمة الموقع") }
    }

    private fun sendNativeLocation(location: Location) {
        webView.post { webView.evaluateJavascript("window.FazaaNativeLocationCallback?.(${location.latitude},${location.longitude},null)", null) }
    }

    private fun sendNativeLocationError(message: String) {
        val safe = message.replace("\\", "\\\\").replace("'", "\\'")
        webView.post { webView.evaluateJavascript("window.FazaaNativeLocationCallback?.(null,null,'$safe')", null) }
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView() {
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
            addJavascriptInterface(NativeLocationBridge(), "FazaaNativeLocation")
            webViewClient = object : WebViewClient() {
                override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean = shouldOpenExternal(request.url)

                @Deprecated("Deprecated in API 23")
                override fun shouldOverrideUrlLoading(view: WebView, url: String): Boolean = shouldOpenExternal(Uri.parse(url))

                override fun onReceivedError(view: WebView, request: WebResourceRequest, error: WebResourceError) {
                    if (request.isForMainFrame) view.loadUrl(BuildConfig.WEB_APP_URL)
                }

                override fun onPageFinished(view: WebView, url: String) {
                    super.onPageFinished(view, url)
                    val storedPushToken = fcmToken
                        ?: getSharedPreferences(FazaaFirebaseMessagingService.PREFS, MODE_PRIVATE).getString(FazaaFirebaseMessagingService.FCM_TOKEN_KEY, null)
                    val pushTokenScript = storedPushToken?.let { "window.FazaaNativePushToken=${JSONObject.quote(it)};" } ?: ""
                    view.evaluateJavascript("""
                        (function() {
                          $pushTokenScript
                          const selectors = ['[class*="manus-badge"]','[id*="manus-badge"]','[class*="made-with-manus"]','[id*="made-with-manus"]','a[href*="manus.im"]','a[href*="manus.space"]'];
                          function clean(){ document.querySelectorAll(selectors.join(',')).forEach(e => e.remove()); }
                          clean(); new MutationObserver(clean).observe(document.documentElement,{childList:true,subtree:true});
                          window.FazaaRegisterPushToken = function(pushToken) {
                            const authToken = localStorage.getItem('fazaah_token');
                            if (!authToken || !pushToken) return;
                            fetch('/api/push-tokens', {method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+authToken}, body:JSON.stringify({token:pushToken,platform:'android'})}).catch(()=>{});
                          };
                          const originalSetItem = localStorage.setItem.bind(localStorage);
                          localStorage.setItem = function(key, value) {
                            originalSetItem(key, value);
                            if (key === 'fazaah_token' && window.FazaaNativePushToken) window.FazaaRegisterPushToken(window.FazaaNativePushToken);
                          };
                          if (localStorage.getItem('fazaah_token') && window.FazaaNativePushToken) window.FazaaRegisterPushToken(window.FazaaNativePushToken);
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
                    if (hasLocationPermission()) {
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
        val dialog = AlertDialog.Builder(this)
            .setTitle("تسجيل الخروج")
            .setMessage("هل تريد تسجيل الخروج من حسابك؟")
            .setNegativeButton("إلغاء", null)
            .setPositiveButton("تسجيل الخروج") { _, _ -> logoutFromWebView() }
            .create()

        dialog.setOnShowListener {
            dialog.window?.setBackgroundDrawable(ColorDrawable(AndroidColor.rgb(21, 27, 41)))
            dialog.window?.setDimAmount(0.72f)
            val titleId = resources.getIdentifier("alertTitle", "id", "android")
            dialog.findViewById<TextView>(titleId)?.setTextColor(AndroidColor.WHITE)
            dialog.findViewById<TextView>(android.R.id.message)?.setTextColor(AndroidColor.rgb(220, 226, 236))
            dialog.getButton(AlertDialog.BUTTON_NEGATIVE)?.setTextColor(AndroidColor.rgb(155, 170, 193))
            dialog.getButton(AlertDialog.BUTTON_POSITIVE)?.setTextColor(AndroidColor.rgb(242, 181, 68))
        }
        dialog.show()
    }

    private fun logoutFromWebView() {
        webView.evaluateJavascript("localStorage.clear(); sessionStorage.clear();", null)
        WebStorage.getInstance().deleteAllData()
        CookieManager.getInstance().removeAllCookies(null)
        CookieManager.getInstance().flush()
        webView.clearCache(true)
        webView.clearHistory()
        webView.loadUrl(BuildConfig.WEB_APP_URL)
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
        fileChooserCallback?.onReceiveValue(null)
        fileChooserCallback = null
        nativeLocationListener?.let { listener ->
            val manager = getSystemService(LOCATION_SERVICE) as LocationManager
            runCatching { manager.removeUpdates(listener) }
        }
        nativeLocationListener = null
        webView.stopLoading()
        webView.webChromeClient = null
        webView.destroy()
        super.onDestroy()
    }
}
