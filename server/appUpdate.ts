import type { Express } from "express";

const DEFAULT_UPDATE = {
  versionCode: 9,
  versionName: "1.4.0",
  downloadUrl: "https://github.com/absherbalsafar-debug/Fazaa-app-manua/releases/download/v1.4.0/FAZAAH-Android.apk",
  forceUpdate: false,
  title: "تحديث جديد يدعم الإشعارات الفورية",
  message: "تحديث 1.4.0 يتضمن تفعيل إشعارات القبول والرفض للمهنيين وربط Firebase Cloud Messaging.",
  releaseNotes: [
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
