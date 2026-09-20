import type { Express } from "express";

const DEFAULT_UPDATE = {
  versionCode: 10,
  versionName: "1.5.0",
  downloadUrl: "https://github.com/absherbalsafar-debug/Fazaa-app-manua/releases/download/v1.5.0/FAZAAH-v1.5.0-provider-ux-fix.apk",
  forceUpdate: false,
  title: "تحديث جديد في تطبيق فزعة",
  message: "تحديث 1.5.0 يحسن تسجيل المهني والوضع الليلي ويصلح شاشة الاشتراك والإعلانات.",
  releaseNotes: [
    "إخفاء نموذج البيانات بعد إرسال طلب اعتماد المهني بنجاح",
    "تحسين ترتيب وتباين شاشة الترحيب واللوحة في الوضع الليلي",
    "إصلاح تحميل شاشة الاشتراك والإعلانات ومساراتها الخلفية",
    "تفعيل الإشعارات الفورية الحقيقية عبر Firebase Cloud Messaging",
    "إشعار فوري وتنبيه للمهني عند قبول أو رفض طلب الاعتماد",
    "تحسين تجربة تسجيل المهني ورفع المستندات",
    "إضافة رسالة نجاح طلب الاعتماد مع رقم الطلب",
    "تحسين الاستقرار والتوافق مع الواجهة المنشورة",
  ],
};

function readVersionCode() {
  const value = Number(process.env.ANDROID_LATEST_VERSION_CODE);
  return Number.isInteger(value) && value > 0 ? value : DEFAULT_UPDATE.versionCode;
}

export function registerAppUpdateRoutes(app: Express) {
  app.get("/api/app-version", (_req, res) => {
    res.setHeader("Cache-Control", "no-store");
    return res.json({
      ...DEFAULT_UPDATE,
      versionCode: readVersionCode(),
      versionName: process.env.ANDROID_LATEST_VERSION_NAME || DEFAULT_UPDATE.versionName,
      downloadUrl: process.env.ANDROID_DOWNLOAD_URL || DEFAULT_UPDATE.downloadUrl,
      forceUpdate: process.env.ANDROID_FORCE_UPDATE === "true",
    });
  });
}
