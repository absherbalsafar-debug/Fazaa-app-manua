# خطة تنفيذ FAZAAH Control Center

## النطاق

إنشاء مشروع WebDev مستقل باسم **FAZAAH Control Center** من فرع GitHub `feat/standalone-control-center` في المستودع `absherbalsafar-debug/Fazaa-app-manua`. المشروع لا يغيّر أو يحذف `fazaa-staging`، ولا يضم لوحة الإدارة داخل تطبيق Android أو واجهة المستخدمين الأساسية.

## المعمارية

- **الواجهة:** React/Vite CSR عربية RTL، وتعرض فقط مسارات مركز الإدارة تحت `/control-center`.
- **الخادم:** Express داخل نفس التطبيق، ويخدم OAuth وواجهات `/api/admin/*` والملفات المبنية من `dist/public`.
- **المصادقة:** OAuth الحالي عبر `/api/oauth/start` و`/api/oauth/callback`، مع جلسة HttpOnly موقعة على الخادم. الجلسة الإدارية تُقرأ من `/api/admin/session`، وكل واجهة إدارية وكل API إداري يتحقق من دور `admin`.
- **قاعدة البيانات:** PostgreSQL/Neon الحالية عبر `NEON_DATABASE_URL` كسر محمي. `DATABASE_URL` يبقى fallback للتوافق فقط، ولا تُرسل أي قيمة سرية إلى المتصفح.
- **التخزين:** خدمة التخزين الحالية عبر `BUILT_IN_FORGE_API_URL` و`BUILT_IN_FORGE_API_KEY` لفتح مستندات التحقق عبر proxy خادمي.
- **البيانات الإدارية:** طلبات اعتماد المهنيين، المستندات، والقرارات الحالية؛ ويضاف جدول `provider_verification_decisions` لتسجيل كل قبول أو رفض مع المدير والملاحظة والتاريخ.

## التصفح والمسارات

- `/` و`/control-center/login`: شاشة دخول OAuth.
- `/control-center`: مؤشرات مركز الإدارة.
- `/control-center/users`: المستخدمون.
- `/control-center/providers`: طلبات اعتماد المهنيين، المستندات، وسجل القرارات.
- `/control-center/business`: الاشتراكات والإعلانات.
- `/control-center/complaints`: الشكاوى والنزاعات.
- `/control-center/taxonomy`: التخصصات والخدمات.
- `/healthz`: فحص صحة عام غير محمي.
- `/manus-routes.json`: manifest للمسارات فقط، دون APIs أو assets.

## النشر والتخزين المؤقت

سيُبنى المشروع داخل Dockerfile باستخدام `pnpm install --frozen-lockfile` ثم `pnpm build`، ويُشغّل بـ `pnpm start` على `PORT`. لأن المشروع يحتوي خادماً وبيانات خاصة، سيُعلن `features.server=true` و`deploy.healthPath=/healthz`، مع `build` للملفات الثابتة إلى `dist/public`. استجابات API والصفحات الشخصية لا تُخزّن في cache مشترك؛ assets ذات البصمة تُخزّن طويلاً، وHTML يعاد التحقق منه.

## التحقق

سيُشغّل بالترتيب: `pnpm install --frozen-lockfile`، `pnpm check`، `pnpm test`، `pnpm build`، ثم `pnpm start` مع فحص `/healthz` و`/manus-routes.json`. بعد نجاح checkpoint والنشر تُستخدم نتيجة النشر الرسمية فقط للإبلاغ عن الرابط العام.

## المزامنة

سيُحفظ مصدر المشروع في WebDev كنسخة مستقلة. ربط GitHub موجود لا يبرّر تغيير `fazaa-staging` أو دمج الفرع في تطبيق Android. النشر التلقائي المستقبلي مرتبط بتفضيل النشر التلقائي في WebDev/لوحة المشروع؛ لا تُخفى حدود المنصة إذا كان Push إلى فرع GitHub المستخدم لا يرقّي checkpoint الرئيسي تلقائياً.
