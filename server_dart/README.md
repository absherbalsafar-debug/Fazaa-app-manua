# Fazaa Dart API scaffold

خدمة HTTP أولية مستقلة باستخدام مكتبات Dart القياسية، تستمع على `0.0.0.0` عبر `PORT` أو `8080`، وتوفر `GET /health` و`GET /api/health` فقط.

```bash
dart pub get
dart analyze
PORT=8080 dart run bin/server.dart
curl http://127.0.0.1:8080/api/health
```

هذا ليس بديلًا لخادم Express الحالي ولا يحتوي مصادقة أو صلاحيات أو API التطبيق أو اتصال قاعدة بيانات. لا تُوجّه إليه بيانات حقيقية. يُنقل أي endpoint لاحقًا بعد توثيق العقد وإضافة اختبارات وتخطيط ترحيل مستقل.
