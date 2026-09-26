import type { Express } from "express";

const DEFAULT_UPDATE = {
  versionCode: 12,
  versionName: "1.6.1",
  downloadUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663972124676/VbqkDkAOvqUNmbqG.apk",
  forceUpdate: false,
  title: "تحديث جديد في تطبيق فزعة",
  message: "تحديث 1.6.1 يضيف حركة بدء احترافية ويحسن حالات التحميل.",
  releaseNotes: [
    "إضافة حركة دخول سلسة لشعار شاشة البدء",
    "تحسين عرض حالة التحميل أثناء تجهيز التطبيق",
    "الحفاظ على كاش WebView لتسريع التشغيل بعد تسجيل الخروج",
    "تحميل الخريطة عند الحاجة فقط وتقليل طلبات الخطوط",
    "تحسين ترتيب وتباين شاشة الترحيب واللوحة في الوضع الليلي",
    "إصلاح تحميل شاشة الاشتراك والإعلانات ومساراتها الخلفية",
    "تفعيل الإشعارات الفورية الحقيقية عبر Firebase Cloud Messaging",
    "إشعار فوري وتنبيه للمهني عند قبول أو رفض طلب الاعتماد",
    "تحسين تجربة تسجيل المهني ورفع المستندات",
    "إضافة رسالة نجاح طلب الاعتماد مع رقم الطلب",
    "تحسين الاستقرار والتوافق مع الواجهة المنشورة",
  ],
};

export function registerAppUpdateRoutes(app: Express) {
  app.get("/api/app-version", (_req, res) => {
    const configuredVersionCode = Number(process.env.ANDROID_LATEST_VERSION_CODE);
    const useEnvironmentRelease = Number.isInteger(configuredVersionCode) && configuredVersionCode >= DEFAULT_UPDATE.versionCode;
    res.setHeader("Cache-Control", "no-store");
    return res.json({
      ...DEFAULT_UPDATE,
      versionCode: useEnvironmentRelease ? configuredVersionCode : DEFAULT_UPDATE.versionCode,
      versionName: useEnvironmentRelease ? (process.env.ANDROID_LATEST_VERSION_NAME || DEFAULT_UPDATE.versionName) : DEFAULT_UPDATE.versionName,
      downloadUrl: useEnvironmentRelease ? (process.env.ANDROID_DOWNLOAD_URL || DEFAULT_UPDATE.downloadUrl) : DEFAULT_UPDATE.downloadUrl,
      forceUpdate: process.env.ANDROID_FORCE_UPDATE === "true",
    });
  });
}
