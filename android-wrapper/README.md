# فزعة Android الأصلي

يحتوي هذا المجلد على أول مرحلة من إعادة كتابة تطبيق Android باستخدام **Kotlin وJetpack Compose** بدل Capacitor/WebView.

## الحالة الحالية

تتضمن النسخة الأصلية شاشة رقم الهاتف، اختيار نوع الحساب، إرسال والتحقق من OTP عبر API الخادم الحالي، إكمالًا أوليًا لملف العميل، حفظ الجلسة محليًا، وشاشة نجاح وتسجيل خروج. سيتم ترحيل بقية شاشات ووظائف التطبيق تدريجيًا مع إبقاء الخادم وقاعدة البيانات الحاليين.

## المتطلبات

- Android Studio حديث.
- Android SDK 35 مع `platforms;android-35` و`build-tools;35.0.0`.
- JDK 17 أو أحدث.

## البناء

من مجلد `android-wrapper/android`:

```bash
./gradlew assembleDebug
```

ينتج APK في `android/app/build/outputs/apk/debug/app-debug.apk`.

لا تضف `local.properties` إلى Git لأنه يحتوي على مسار Android SDK المحلي. عنوان API مضبوط في `app/build.gradle` عبر `BuildConfig.API_BASE_URL`، ويجب نقله إلى إعدادات build variants قبل الإنتاج.
