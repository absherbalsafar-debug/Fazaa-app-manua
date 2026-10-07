# Fazaa Flutter client

العميل التمهيدي لفزعة على Flutter، معدّ للويب وAndroid، بواجهة عربية RTL وخيارات دخول العميل والمهني.

## المتطلبات والتشغيل

- Flutter SDK مستقر (تم إنشاء الهيكل والتحقق باستخدام Flutter 3.47.6 وDart 3.13.5).
- لا يحتاج بناء الويب إلى Android SDK.

```bash
flutter pub get
flutter analyze
flutter test
flutter run -d chrome
flutter build web --release
```

تُنتج ملفات الويب في `build/web`. يجب تقديم المجلد عبر HTTP؛ لا تفتح `index.html` باستخدام `file://`.

## حالة التكامل

هذه واجهة تأسيسية فقط. لم تُنقل المصادقة أو API أو بيانات الإنتاج بعد. يبقى تطبيق React والخادم الحاليان دون تغيير. عنوان API المستقبلي يُمرر عبر `--dart-define=FAZAA_API_BASE_URL=...` ولا تُخزن أسرار في تطبيق الويب.
