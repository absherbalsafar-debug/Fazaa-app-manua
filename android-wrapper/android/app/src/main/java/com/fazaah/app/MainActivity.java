package com.fazaah.app;

import android.os.Bundle;
import android.webkit.WebView;
import android.widget.Toast;

import androidx.activity.OnBackPressedCallback;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static final long DOUBLE_BACK_WINDOW_MS = 2000L;
    private long lastBackPressedAt = 0L;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                handleBackPress();
            }
        });
    }

    private void handleBackPress() {
        final WebView webView = getBridge().getWebView();
        if (webView == null) {
            finish();
            return;
        }

        webView.evaluateJavascript(
            "(function(){return JSON.stringify({path:location.pathname,history:window.history.length});})()",
            rawValue -> {
                String value = rawValue == null ? "" : rawValue.replace("\\\"", "\"");
                boolean isHome = value.contains("\"path\":\"/\"");
                boolean hasPreviousPage = value.matches(".*\\\"history\\\":([2-9][0-9]*|[1-9][0-9]+).*" );

                if (!isHome) {
                    if (hasPreviousPage) {
                        webView.evaluateJavascript("window.history.back();", null);
                    } else {
                        webView.evaluateJavascript("window.location.replace('/');", null);
                    }
                    return;
                }

                confirmExitOnHome(webView);
            }
        );
    }

    private void confirmExitOnHome(WebView webView) {
        long now = System.currentTimeMillis();
        if (now - lastBackPressedAt > DOUBLE_BACK_WINDOW_MS) {
            lastBackPressedAt = now;
            Toast.makeText(this, "اضغط مرة أخرى للخروج", Toast.LENGTH_SHORT).show();
            return;
        }

        lastBackPressedAt = 0L;
        new androidx.appcompat.app.AlertDialog.Builder(this)
            .setTitle("هل تريد تسجيل الخروج؟")
            .setMessage("سيتم إنهاء جلستك والعودة إلى شاشة الدخول.")
            .setNegativeButton("إلغاء", null)
            .setPositiveButton("تسجيل الخروج", (dialog, which) ->
                webView.evaluateJavascript("window.dispatchEvent(new Event('native-logout'));", null)
            )
            .show();
    }
}
