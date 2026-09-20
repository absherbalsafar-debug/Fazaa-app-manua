# تطبيق فزعة Android الأصلي

هذا المجلد يحتوي على تطبيق Android أصلي مكتوب بـ **Kotlin وJetpack Compose**، مع الإبقاء على الخادم وقاعدة البيانات وواجهات API الحالية المشتركة مع منصة الويب.

## البنية الحالية

```text
android/app/src/main/java/com/fazaah/app/
├── data/
│   ├── api/          # Retrofit وOkHttp وعقود API
│   ├── local/        # DataStore والجلسة المحلية
│   └── repository/   # عزل مصادر البيانات عن الواجهة
├── domain/model/     # نماذج المجال وطلبات المصادقة
├── presentation/
│   ├── auth/         # AuthViewModel وحالة واجهة المصادقة
│   └── navigation/   # مسارات التطبيق الأصلية
├── ui/
│   ├── components/   # مكونات Compose المشتركة
│   └── theme/        # مساحة هوية وتصميم التطبيق
├── AppContainer.kt   # حاوية الاعتماديات
└── MainActivity.kt   # نقطة التشغيل الحالية وتركيب Compose
```

## المكتبات الأساسية

- Kotlin وJetpack Compose وMaterial 3.
- Retrofit وGson للاتصال بواجهات API.
- OkHttp مع Interceptor لإرسال جلسة Bearer.
- Kotlin Coroutines.
- Navigation Compose للمرحلة التالية من نقل الشاشات.
- DataStore Preferences للجلسة المحلية.
- ViewModel وLifecycle Compose.

## الحالة الحالية

تتضمن النسخة الحالية تسجيل الدخول برقم الهاتف، إرسال والتحقق من OTP، إنشاء الملف الأساسي، حفظ الجلسة، وتسجيل الخروج. كما أضيفت شاشة العرض الرئيسية، شاشة الخدمات والتخصصات، قائمة المهنيين مع البحث والتصفية، وصفحة تفاصيل المهني، وشاشة الملف الشخصي وإدارة الحساب مع تحديث الاسم والموقع وأرقام التواصل. تعمل هذه الشاشات من خلال واجهات الخادم الحقيقية. تم فصل اتصال الشبكة إلى `FazaaApi` و`AuthRepository` و`CatalogRepository`، كما أصبحت حالة المصادقة والكتالوج والحساب داخل ViewModels، وأصبح Compose مسؤولًا عن العرض فقط.

## المتطلبات

- Android SDK 35 مع `platforms;android-35` و`build-tools;35.0.0`.
- JDK 17 أو أحدث.
- Android Studio حديث.

## البناء

من مجلد `android-wrapper/android`:

```bash
./gradlew clean assembleDebug
```

ينتج APK في:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

لا تضف `local.properties` إلى Git لأنه يحتوي على مسار Android SDK المحلي. عنوان API مضبوط في `app/build.gradle` عبر `BuildConfig.API_BASE_URL`، ويجب نقله إلى إعدادات build variants قبل إصدار Production.
