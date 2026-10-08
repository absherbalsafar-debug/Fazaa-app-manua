# خدمة Fazaa API بـDart

خدمة HTTP مستقلة بـDart تستمع إلى `0.0.0.0:$PORT` (الافتراضي `8080`) وتوفر:

- `GET /health` و`GET /api/health` لفحص الجاهزية واتصال PostgreSQL؛ يعيدان `503` عند غياب إعداد Neon أو تعذر الاتصال.
- `POST /api/auth/login/email`, `POST /api/auth/send-otp`, `POST /api/auth/verify-otp`.
- `GET /api/auth/me`, `POST /api/auth/logout`.
- `GET /api/dashboard`, `GET /api/categories`.
- `PATCH /api/providers/me/availability`.

## التشغيل

```bash
dart pub get
dart analyze
dart test
PORT=8080 dart run bin/server.dart
curl http://127.0.0.1:8080/api/health
```

اختبارات المصادقة واللوحة تعمل على مخزن وهمي، ولا تتصل بـNeon الإنتاجية. عند التشغيل المحلي من دون سر Neon يفشل فحص الصحة عمدًا بدل إعلان خدمة غير جاهزة.

## إعداد قاعدة البيانات

مرّر `NEON_DATABASE_URL` كسرّ وقت التشغيل من مزود الاستضافة. يستخدم الخادم مخطط `phone_users` و`phone_auth_sessions` و`phone_otp_codes` و`service_requests` و`provider_favorites` الموجود؛ لا ينفذ migrations تلقائيًا. كتالوج التصنيفات يأتي من البيانات الثابتة المطابقة لـAPI الحالي. في مخطط Neon الإنتاجي، عمود `phone_auth_sessions.phone` محدود بـ20 حرفًا؛ لذلك تخزن جلسات البريد القيمة `uid:<id>` وتُحل إلى المستخدم عبر معرّفه، بينما تواصل جلسات OTP استخدام رقم الهاتف. لا تضع قيمة الاتصال في المستودع أو في متغيرات بناء Flutter.

عند استضافة الواجهة على أصل مختلف، أضف أصولها إلى `CORS_ALLOWED_ORIGINS` مفصولة بفواصل. عند الأصل نفسه، مسارات `/api` لا تحتاج إلى CORS إضافي.

## OTP

إرسال SMS غير مهيأ. يبقى OTP التطويري مغلقًا في الإنتاج؛ لا تفعّله إلا في بيئة تطوير معزولة باستخدام `APP_ENV=development` و`ALLOW_DEV_OTP=true`. أضف مزوّد رسائل واختبره قبل قبول تسجيل الهاتف الحقيقي.
