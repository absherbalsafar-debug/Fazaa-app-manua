# فزعة Android APK

هذا المجلد يحتوي غلاف Capacitor لتطبيق فزعة. التطبيق يفتح النسخة الدائمة من الموقع عبر الرابط الموجود في `capacitor.config.json`، لذلك أي تحديث للواجهة أو الخادم وقاعدة Neon يظهر للمستخدم بعد النشر دون إعادة بناء الغلاف.

## المتطلبات

- Node.js و pnpm
- Java 21
- Android SDK مع `platforms;android-35` و `build-tools;35.0.0`

## البناء

```bash
pnpm install
pnpm exec cap sync android
cd android
export ANDROID_HOME=/path/to/android-sdk
export ANDROID_SDK_ROOT=$ANDROID_HOME
export JAVA_HOME=/path/to/jdk-21
./gradlew assembleDebug
```

ينتج الملف في `android/app/build/outputs/apk/debug/app-debug.apk`.

لا تضع رابط Neon أو أي سر في هذا المجلد. رابط قاعدة البيانات يُدار في بيئة WebDev عبر المتغير السري `NEON_DATABASE_URL`.
