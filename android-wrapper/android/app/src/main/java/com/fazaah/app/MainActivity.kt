package com.fazaah.app

import android.Manifest
import android.annotation.SuppressLint
import android.app.Activity
import android.app.Dialog
import android.animation.AnimatorSet
import android.animation.ObjectAnimator
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Color as AndroidColor
import android.graphics.drawable.ColorDrawable
import android.graphics.drawable.GradientDrawable
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
import android.view.Gravity
import android.view.animation.DecelerateInterpolator
import android.view.animation.LinearInterpolator
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
import android.widget.Button
import android.widget.LinearLayout
import android.widget.FrameLayout
import android.widget.ImageView
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
    private var pendingWebPermissionRequest: PermissionRequest? = null
    private var pendingWebPermissionResources: Array<String> = emptyArray()
    private var startupOverlay: View? = null
    private var startupPulse: ObjectAnimator? = null
    private var backPressedOnce = false
    private var logoutInProgress = false
    private var logoutDialogVisible = false
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
    private val webMediaPermissionLauncher = registerForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) { result ->
        val request = pendingWebPermissionRequest
        val resources = pendingWebPermissionResources
        pendingWebPermissionRequest = null
        pendingWebPermissionResources = emptyArray()
        if (request == null) return@registerForActivityResult

        val allGranted = result.values.all { it }
        if (allGranted) request.grant(resources) else request.deny()
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.statusBarColor = AndroidColor.rgb(8, 11, 18)
        window.navigationBarColor = AndroidColor.rgb(8, 11, 18)
        clearWebSessionOnFirstInstall()
        setupWebView()
        setContentView(createStartupRoot())
        val welcomeSeen = getPreferences(MODE_PRIVATE).getBoolean("welcome_seen_v1", false)
        val initialUrl = if (welcomeSeen) {
            "${BuildConfig.WEB_APP_URL}/auth/phone?mode=login"
        } else {
            BuildConfig.WEB_APP_URL
        }
        webView.loadUrl(initialUrl)
        FazaaFirebaseMessagingService.ensureNotificationChannel(this)
        requestNotificationPermission()
        initializePushNotifications()
        checkForAppUpdate()

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (logoutInProgress || isPublicAuthPage(webView.url)) {
                    finish()
                    return
                }
                val history = webView.copyBackForwardList()
                val previousUrl = history.currentIndex
                    .takeIf { it > 0 }
                    ?.let { history.getItemAtIndex(it - 1).url }
                if (webView.canGoBack() && !isPublicAuthPage(previousUrl)) {
                    webView.goBack()
                    return
                }
                if (backPressedOnce) {
                    backPressedOnce = false
                    finish()
                } else {
                    backPressedOnce = true
                    Toast.makeText(this@MainActivity, "اضغط مرة أخرى للخروج من التطبيق", Toast.LENGTH_SHORT).show()
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
            dialog.window?.setBackgroundDrawable(roundedDialogBackground(AndroidColor.rgb(255, 253, 248), 22))
            dialog.window?.setDimAmount(0.72f)
            val titleId = resources.getIdentifier("alertTitle", "id", "android")
            dialog.findViewById<TextView>(titleId)?.setTextColor(AndroidColor.rgb(24, 45, 83))
            dialog.findViewById<TextView>(android.R.id.message)?.setTextColor(AndroidColor.rgb(76, 86, 101))
            dialog.getButton(AlertDialog.BUTTON_NEGATIVE)?.setTextColor(AndroidColor.rgb(24, 45, 83))
            dialog.getButton(AlertDialog.BUTTON_POSITIVE)?.setTextColor(AndroidColor.rgb(181, 125, 20))
        }
        dialog.show()
        // بعض إصدارات Android تعيد تطبيق خلفية الثيم بعد onShow؛ ثبّت الألوان بعد العرض أيضاً.
        dialog.window?.setBackgroundDrawable(roundedDialogBackground(AndroidColor.rgb(255, 253, 248), 22))
        dialog.findViewById<TextView>(resources.getIdentifier("alertTitle", "id", "android"))
            ?.setTextColor(AndroidColor.rgb(24, 45, 83))
        dialog.findViewById<TextView>(android.R.id.message)
            ?.setTextColor(AndroidColor.rgb(76, 86, 101))
        dialog.getButton(AlertDialog.BUTTON_NEGATIVE)?.setTextColor(AndroidColor.rgb(24, 45, 83))
        dialog.getButton(AlertDialog.BUTTON_POSITIVE)?.setTextColor(AndroidColor.rgb(181, 125, 20))
    }

    private fun roundedDialogBackground(color: Int, radius: Int): GradientDrawable =
        GradientDrawable().apply {
            setColor(color)
            cornerRadius = (radius * resources.displayMetrics.density)
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

    private inner class NativeLogoutBridge {
        @JavascriptInterface
        fun requestLogout() {
            runOnUiThread { showLogoutDialog() }
        }

        @JavascriptInterface
        fun markWelcomeSeen() {
            getPreferences(MODE_PRIVATE).edit().putBoolean("welcome_seen_v1", true).apply()
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
                cacheMode = WebSettings.LOAD_DEFAULT
                userAgentString = "$userAgentString FAZAAH-Android-WebView/1.0"
            }
            CookieManager.getInstance().setAcceptCookie(true)
            CookieManager.getInstance().setAcceptThirdPartyCookies(this, true)
            addJavascriptInterface(NativeLocationBridge(), "FazaaNativeLocation")
            addJavascriptInterface(NativeLogoutBridge(), "FazaaNativeLogout")
            webViewClient = object : WebViewClient() {
                override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean = shouldOpenExternal(request.url)

                @Deprecated("Deprecated in API 23")
                override fun shouldOverrideUrlLoading(view: WebView, url: String): Boolean = shouldOpenExternal(Uri.parse(url))

                override fun onReceivedError(view: WebView, request: WebResourceRequest, error: WebResourceError) {
                    if (request.isForMainFrame) {
                        hideStartupOverlay()
                    }
                }

                override fun onPageCommitVisible(view: WebView, url: String) {
                    super.onPageCommitVisible(view, url)
                    hideStartupOverlay()
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
                          if (location.pathname === '/welcome') window.FazaaNativeLogout?.markWelcomeSeen?.();
                        })();
                    """.trimIndent(), null)
                    hideStartupOverlay()
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
                        val appOrigin = Uri.parse(BuildConfig.WEB_APP_URL)
                        val requestOrigin = request.origin
                        val sameAppOrigin = requestOrigin.scheme == appOrigin.scheme && requestOrigin.host == appOrigin.host
                        if (allowed.isEmpty() || !sameAppOrigin) {
                            request.deny()
                            return@runOnUiThread
                        }

                        val requiredPermissions = buildList {
                            if (PermissionRequest.RESOURCE_AUDIO_CAPTURE in allowed &&
                                ContextCompat.checkSelfPermission(this@MainActivity, Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED
                            ) add(Manifest.permission.RECORD_AUDIO)
                            if (PermissionRequest.RESOURCE_VIDEO_CAPTURE in allowed &&
                                ContextCompat.checkSelfPermission(this@MainActivity, Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED
                            ) add(Manifest.permission.CAMERA)
                        }

                        if (requiredPermissions.isEmpty()) {
                            request.grant(allowed)
                        } else {
                            pendingWebPermissionRequest?.deny()
                            pendingWebPermissionRequest = request
                            pendingWebPermissionResources = allowed
                            webMediaPermissionLauncher.launch(requiredPermissions.toTypedArray())
                        }
                    }
                }
            }
            val cachePrefs = getSharedPreferences("fazaa_webview_cache", MODE_PRIVATE)
            if (cachePrefs.getInt("app_version_code", -1) != BuildConfig.VERSION_CODE) {
                clearCache(true)
                cachePrefs.edit().putInt("app_version_code", BuildConfig.VERSION_CODE).apply()
            }
        }
    }

    private fun createStartupRoot(): View {
        val root = FrameLayout(this).apply { setBackgroundColor(AndroidColor.rgb(8, 11, 18)) }
        root.addView(webView, FrameLayout.LayoutParams(-1, -1))
        val overlay = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            layoutDirection = View.LAYOUT_DIRECTION_RTL
            setBackgroundColor(AndroidColor.rgb(8, 11, 18))
        }
        val logo = ImageView(this).apply {
            setImageResource(R.drawable.fazaah_logo)
            scaleType = ImageView.ScaleType.CENTER_INSIDE
            alpha = 0f
            scaleX = 0.82f
            scaleY = 0.82f
        }
        val title = TextView(this).apply {
            text = "أهلاً بك في فزعة"
            textSize = 14f
            gravity = Gravity.CENTER
            typeface = android.graphics.Typeface.DEFAULT_BOLD
            setTextColor(AndroidColor.WHITE)
            alpha = 0f
            translationY = dp(10).toFloat()
            setPadding(0, dp(10), 0, 0)
        }
        val status = TextView(this).apply {
            text = "جارٍ تجهيز تجربتك"
            textSize = 12f
            gravity = Gravity.CENTER
            setTextColor(AndroidColor.rgb(178, 190, 209))
            alpha = 0f
            setPadding(0, dp(18), 0, 0)
        }
        val progress = android.widget.ProgressBar(this).apply {
            isIndeterminate = true
            indeterminateTintList = android.content.res.ColorStateList.valueOf(AndroidColor.rgb(242, 181, 68))
            alpha = 0f
        }
        overlay.addView(logo, LinearLayout.LayoutParams(dp(112), dp(112)))
        overlay.addView(title, LinearLayout.LayoutParams(-1, -2))
        overlay.addView(status, LinearLayout.LayoutParams(-1, -2))
        overlay.addView(progress, LinearLayout.LayoutParams(dp(32), dp(32)).apply { topMargin = dp(18) })
        root.addView(overlay, FrameLayout.LayoutParams(-1, -1))
        startupOverlay = overlay
        val statusMessages = listOf("جارٍ تجهيز تجربتك", "جارٍ تحميل خدمات فزعة", "لحظات ونبدأ معك")
        statusMessages.forEachIndexed { index, message ->
            Handler(Looper.getMainLooper()).postDelayed({
                if (startupOverlay != null) status.text = message
            }, (700L + index * 850L))
        }
        val easing = DecelerateInterpolator(1.7f)
        val logoEntrance = AnimatorSet().apply {
            playTogether(
                ObjectAnimator.ofFloat(logo, View.ALPHA, 0f, 1f),
                ObjectAnimator.ofFloat(logo, View.SCALE_X, 0.82f, 1f),
                ObjectAnimator.ofFloat(logo, View.SCALE_Y, 0.82f, 1f)
            )
            duration = 520L
            interpolator = easing
        }
        val titleEntrance = AnimatorSet().apply {
            playTogether(
                ObjectAnimator.ofFloat(title, View.ALPHA, 0f, 1f),
                ObjectAnimator.ofFloat(title, View.TRANSLATION_Y, dp(10).toFloat(), 0f)
            )
            duration = 420L
            startDelay = 150L
            interpolator = easing
        }
        val loadingEntrance = AnimatorSet().apply {
            playTogether(
                ObjectAnimator.ofFloat(status, View.ALPHA, 0f, 1f),
                ObjectAnimator.ofFloat(progress, View.ALPHA, 0f, 1f)
            )
            duration = 360L
            startDelay = 300L
            interpolator = easing
        }
        startupPulse = ObjectAnimator.ofFloat(status, View.ALPHA, 0.55f, 1f, 0.55f).apply {
            duration = 1200L
            repeatCount = ObjectAnimator.INFINITE
            interpolator = LinearInterpolator()
            startDelay = 700L
        }
        logoEntrance.start()
        titleEntrance.start()
        loadingEntrance.start()
        startupPulse?.start()
        // لا نحجب الواجهة أكثر من 3.5 ثوانٍ حتى عند بطء الشبكة أو تعذر حدث onPageFinished.
        Handler(Looper.getMainLooper()).postDelayed({ hideStartupOverlay() }, 3500L)
        return root
    }

    private fun hideStartupOverlay() {
        runOnUiThread {
            startupPulse?.cancel()
            startupPulse = null
            startupOverlay?.let { overlay ->
                overlay.animate().alpha(0f).setDuration(180L).withEndAction {
                    (overlay.parent as? android.view.ViewGroup)?.removeView(overlay)
                    startupOverlay = null
                }.start()
            }
        }
    }

    private fun dp(value: Int): Int = (value * resources.displayMetrics.density).toInt()

    private fun shouldOpenExternal(uri: Uri): Boolean = when (uri.scheme?.lowercase()) {
        "http", "https" -> false
        "tel", "sms", "mailto", "whatsapp" -> { runCatching { startActivity(Intent(Intent.ACTION_VIEW, uri)) }; true }
        else -> true
    }

    private fun isPublicAuthPage(url: String?): Boolean {
        val path = runCatching { Uri.parse(url ?: "").path.orEmpty() }.getOrDefault("")
        return path == "/welcome" || path == "/welcome-back" ||
            path == "/login" || path == "/register" || path.startsWith("/auth/")
    }

    private fun showLogoutDialog() {
        if (logoutDialogVisible || isFinishing || isDestroyed) return
        logoutDialogVisible = true
        val dialog = Dialog(this)
        val density = resources.displayMetrics.density
        fun dp(value: Int) = (value * density).toInt()
        fun rounded(color: Int, radius: Int, strokeColor: Int? = null): GradientDrawable =
            GradientDrawable().apply {
                setColor(color)
                cornerRadius = dp(radius).toFloat()
                strokeColor?.let { setStroke(dp(1), it) }
            }

        val content = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER_HORIZONTAL
            layoutDirection = View.LAYOUT_DIRECTION_RTL
            setPadding(dp(24), dp(24), dp(24), dp(18))
            background = rounded(AndroidColor.rgb(255, 253, 248), 24, AndroidColor.rgb(232, 224, 209))
        }
        val icon = TextView(this).apply {
            text = "↪"
            textSize = 28f
            gravity = Gravity.CENTER
            setTextColor(AndroidColor.rgb(24, 45, 83))
            background = rounded(AndroidColor.rgb(242, 181, 68), 18)
        }
        content.addView(icon, LinearLayout.LayoutParams(dp(58), dp(58)))
        val title = TextView(this).apply {
            text = "تسجيل الخروج"
            textSize = 22f
            typeface = android.graphics.Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER
            setTextColor(AndroidColor.rgb(24, 45, 83))
            setPadding(0, dp(14), 0, 0)
        }
        content.addView(title, LinearLayout.LayoutParams(-1, -2))
        val message = TextView(this).apply {
            text = "هل تريد تسجيل الخروج من حسابك؟\nستحتاج إلى تسجيل الدخول مرة أخرى عند استخدام التطبيق."
            textSize = 15f
            gravity = Gravity.CENTER
            setTextColor(AndroidColor.rgb(76, 86, 101))
            setLineSpacing(0f, 1.25f)
            setPadding(0, dp(10), 0, dp(20))
        }
        content.addView(message, LinearLayout.LayoutParams(-1, -2))
        val actions = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            layoutDirection = View.LAYOUT_DIRECTION_RTL
            gravity = Gravity.CENTER
        }
        val cancel = Button(this).apply {
            text = "إلغاء"
            textSize = 14f
            isAllCaps = false
            typeface = android.graphics.Typeface.DEFAULT_BOLD
            setTextColor(AndroidColor.rgb(24, 45, 83))
            background = rounded(AndroidColor.TRANSPARENT, 14, AndroidColor.rgb(194, 201, 211))
            setOnClickListener { dialog.dismiss() }
        }
        val logout = Button(this).apply {
            text = "تسجيل الخروج"
            textSize = 14f
            isAllCaps = false
            typeface = android.graphics.Typeface.DEFAULT_BOLD
            setTextColor(AndroidColor.WHITE)
            background = rounded(AndroidColor.rgb(24, 45, 83), 14)
            setOnClickListener {
                dialog.dismiss()
                logoutFromWebView()
            }
        }
        actions.addView(cancel, LinearLayout.LayoutParams(0, dp(50), 1f).apply { marginEnd = dp(8) })
        actions.addView(logout, LinearLayout.LayoutParams(0, dp(50), 1f))
        content.addView(actions, LinearLayout.LayoutParams(-1, -2))

        dialog.setContentView(content)
        dialog.setCanceledOnTouchOutside(true)
        dialog.setOnDismissListener { logoutDialogVisible = false }
        dialog.window?.setBackgroundDrawable(ColorDrawable(AndroidColor.TRANSPARENT))
        dialog.window?.addFlags(android.view.WindowManager.LayoutParams.FLAG_DIM_BEHIND)
        dialog.window?.setDimAmount(0.68f)
        dialog.setOnShowListener {
            dialog.window?.setLayout((resources.displayMetrics.widthPixels * 0.88f).toInt(), android.view.WindowManager.LayoutParams.WRAP_CONTENT)
        }
        dialog.show()
    }

    private fun logoutFromWebView() {
        logoutInProgress = true
        // امسح بيانات الجلسة والحساب فقط، واحتفظ بتفضيل الوضع النهاري/الليلي.
        // مسح WebStorage بالكامل هنا كان يعيد التطبيق إلى الوضع الافتراضي عند الخروج.
        webView.evaluateJavascript("""
            (function() {
              const theme = localStorage.getItem('fazaah-theme');
              Object.keys(localStorage).forEach((key) => localStorage.removeItem(key));
              if (theme) localStorage.setItem('fazaah-theme', theme);
              sessionStorage.clear();
            })();
        """.trimIndent(), null)
        CookieManager.getInstance().removeAllCookies(null)
        CookieManager.getInstance().flush()
        webView.clearHistory()
        webView.evaluateJavascript("localStorage.getItem('fazaah-theme');") {
            // لا نعيد تحميل WebView إلا بعد انتهاء عملية حفظ تفضيل الثيم.
            webView.clearHistory()
            logoutInProgress = false
            webView.loadUrl("${BuildConfig.WEB_APP_URL}/auth/phone?mode=login&loggedOut=1")
            Toast.makeText(this, "تم تسجيل الخروج", Toast.LENGTH_SHORT).show()
        }
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
