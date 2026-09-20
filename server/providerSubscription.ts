import type { Express, Request, Response } from "express";
import { desc, eq } from "drizzle-orm";
import { getDb } from "./db";
import { phoneAuthSessions, phoneUsers, providerAdvertisements, providerSubscriptionPayments, serviceRequests } from "../drizzle/schema";
import { sdk } from "./_core/sdk";

const AD_DURATIONS = { standard: 7, featured: 14, homepage: 30, vip: 60 } as const;
type Plan = "monthly" | "yearly";
type AdvertisementPlan = keyof typeof AD_DURATIONS;

function error(res: Response, status: number, message: string) {
  return res.status(status).json({ error: message });
}

function body(req: Request) {
  return req.body && typeof req.body === "object" ? req.body as Record<string, unknown> : {};
}

async function currentProvider(req: Request) {
  const token = (req.headers.authorization ?? "").replace(/^Bearer\s+/, "");
  const db = await getDb();
  if (!db || !token) return null;
  const session = (await db.select().from(phoneAuthSessions).where(eq(phoneAuthSessions.token, token)).limit(1))[0];
  if (!session || session.expiresAt.getTime() <= Date.now()) return null;
  const user = (await db.select().from(phoneUsers).where(eq(phoneUsers.phone, session.phone)).limit(1))[0];
  return user?.role === "provider" ? user : null;
}

function planDays(plan: Plan) {
  return plan === "monthly" ? 30 : 365;
}

function advertisementUrl(path: string | null) {
  if (!path) return null;
  return path.startsWith("/") ? path : `/manus-storage/${path}`;
}

function toAdvertisement(row: typeof providerAdvertisements.$inferSelect) {
  return {
    id: row.id,
    providerId: row.providerId,
    title: row.title,
    description: row.description,
    city: row.city,
    district: row.district,
    targetAudience: row.targetAudience,
    categoryId: row.categoryId,
    plan: row.plan,
    durationDays: row.durationDays,
    budget: row.budget,
    imageUrl: advertisementUrl(row.imagePath),
    status: row.status,
    reviewNote: row.reviewNote,
    startsAt: row.startsAt,
    endsAt: row.endsAt,
    createdAt: row.createdAt,
  };
}

const paymentWallets = [
  { wallet: "jeeb", displayName: "جيب", logoUrl: "/manus-storage/jaib-wallet_4b6eaa95.jpg", description: "محفظة جيب · تأكيد الدفع من الإدارة", usage: "both", sortOrder: 1, merchantName: "فزعة", merchantAccount: "", instructions: "أرسل رقم العملية للإدارة بعد التحويل.", isActive: true },
  { wallet: "floosk", displayName: "فلوسك", logoUrl: "/manus-storage/floosak-wallet_cf142dd8.png", description: "محفظة فلوسك · تأكيد الدفع من الإدارة", usage: "both", sortOrder: 2, merchantName: "فزعة", merchantAccount: "", instructions: "أرسل رقم العملية للإدارة بعد التحويل.", isActive: true },
  { wallet: "jawali", displayName: "جوالي", logoUrl: null, description: "تأكيد يدوي من الإدارة", usage: "both", sortOrder: 3, merchantName: "فزعة", merchantAccount: "", instructions: "أرسل رقم العملية للإدارة بعد التحويل.", isActive: true },
  { wallet: "cash", displayName: "كاش", logoUrl: null, description: "تأكيد يدوي من الإدارة", usage: "both", sortOrder: 4, merchantName: "فزعة", merchantAccount: "", instructions: "تواصل مع الإدارة لتأكيد الدفع.", isActive: true },
];

export function registerProviderSubscriptionRoutes(app: Express) {
  app.get("/api/subscription-plans", (_req, res) => res.json([
    { id: "free", name: "المقعد المجاني", monthlyPrice: 0, yearlyPrice: 0, title: "المقعد المجاني", days: 0, amount: 0, description: "متاح للمقاعد المجانية عند توفرها", benefits: ["ظهور أساسي في البحث"] },
    { id: "monthly", name: "الباقة الشهرية", monthlyPrice: 30, yearlyPrice: 30, title: "الباقة الشهرية", days: 30, amount: 30, description: "مرونة شهرية للبدء", benefits: ["ظهور الملف المهني", "استقبال طلبات العملاء"] },
    { id: "yearly", name: "الباقة السنوية", monthlyPrice: 25, yearlyPrice: 300, title: "الباقة السنوية", days: 365, amount: 300, description: "قيمة أفضل واستمرارية أطول", benefits: ["ظهور مستمر", "قيمة أفضل طوال العام"] },
  ]));

  app.get("/api/payment-wallets", (_req, res) => res.json(paymentWallets));
  app.get("/api/commercial-plans", (req, res) => {
    if (req.query.kind !== "advertisement") return res.json([]);
    return res.json(Object.entries(AD_DURATIONS).map(([code, durationDays]) => ({
      code,
      name: code === "standard" ? "إعلان عادي" : code === "featured" ? "إعلان مميز" : code === "homepage" ? "إعلان رئيسي" : "إعلان VIP",
      description: code === "standard" ? "ظهور أساسي داخل نتائج الفئة" : code === "featured" ? "ترتيب أعلى وشارة مميز" : code === "homepage" ? "ظهور في الصفحة الرئيسية والفئة" : "أعلى أولوية وظهور",
      durationDays,
    })));
  });

  app.get("/api/providers/me/subscription", async (req, res) => {
    const provider = await currentProvider(req);
    if (!provider) return error(res, 401, "تحتاج إلى تسجيل الدخول كمهني");
    const db = await getDb();
    if (!db) return error(res, 503, "قاعدة البيانات غير متاحة حالياً");
    const payments = await db.select().from(providerSubscriptionPayments).where(eq(providerSubscriptionPayments.providerId, provider.id)).orderBy(desc(providerSubscriptionPayments.createdAt));
    return res.json({ approved: provider.providerAccountStatus === "approved", plan: provider.subscriptionPlan, expiresAt: provider.subscriptionExpiresAt, active: Boolean(provider.subscriptionExpiresAt && provider.subscriptionExpiresAt.getTime() > Date.now()), payments });
  });

  app.get("/api/providers/me/business", async (req, res) => {
    const provider = await currentProvider(req);
    if (!provider) return error(res, 401, "تحتاج إلى تسجيل الدخول كمهني");
    const db = await getDb();
    if (!db) return error(res, 503, "قاعدة البيانات غير متاحة حالياً");
    const requests = await db.select().from(serviceRequests).where(eq(serviceRequests.providerId, provider.id));
    const active = Boolean(provider.subscriptionExpiresAt && provider.subscriptionExpiresAt.getTime() > Date.now());
    return res.json({
      subscription: {
        id: provider.subscriptionPlan ? provider.id : 0,
        plan: provider.subscriptionPlan ?? "monthly",
        status: active ? "active" : provider.subscriptionPlan ? "expired" : "pending",
        freeSlotNumber: null,
        startsAt: provider.subscriptionPlan ? provider.createdAt : null,
        endsAt: provider.subscriptionExpiresAt,
        createdAt: provider.createdAt,
      },
      metrics: { profileViews: 0, callClicks: 0, whatsappClicks: 0, serviceRequests: requests.length },
      freeSlotsRemaining: 300,
    });
  });

  app.get("/api/providers/me/payments", async (req, res) => {
    const provider = await currentProvider(req);
    if (!provider) return error(res, 401, "تحتاج إلى تسجيل الدخول كمهني");
    const db = await getDb();
    if (!db) return error(res, 503, "قاعدة البيانات غير متاحة حالياً");
    const rows = await db.select().from(providerSubscriptionPayments).where(eq(providerSubscriptionPayments.providerId, provider.id)).orderBy(desc(providerSubscriptionPayments.createdAt));
    return res.json(rows.map(row => ({ id: row.id, providerId: row.providerId, plan: row.plan, wallet: "manual", transactionReference: String(row.id), receiptUrl: row.proofPath, status: row.status, createdAt: row.createdAt, reviewedAt: row.reviewedAt })));
  });

  app.post("/api/subscriptions/checkout", async (req, res) => {
    const provider = await currentProvider(req);
    if (!provider) return error(res, 401, "تحتاج إلى تسجيل الدخول كمهني");
    if (provider.providerAccountStatus !== "approved") return error(res, 403, "لا يمكنك الاشتراك قبل اعتماد حسابك");
    const selected = body(req).plan;
    if (selected !== "monthly" && selected !== "yearly") return error(res, 400, "اختر باقة صحيحة");
    const db = await getDb();
    if (!db) return error(res, 503, "قاعدة البيانات غير متاحة حالياً");
    const amount = selected === "monthly" ? 30 : 300;
    const proofPath = typeof body(req).receiptUrl === "string" ? String(body(req).receiptUrl) : null;
    const payment = await db.insert(providerSubscriptionPayments).values({
      providerId: provider.id,
      plan: selected,
      amount,
      proofPath,
    }).returning();
    return res.status(201).json({ ...(payment[0] ?? {}), success: true, paymentId: payment[0]?.id, status: "pending", message: "تم تسجيل طلب الاشتراك، وسيتم تفعيله بعد تأكيد السداد." });
  });

  app.get("/api/ads/mine", async (req, res) => {
    const provider = await currentProvider(req);
    if (!provider) return error(res, 401, "تحتاج إلى تسجيل الدخول كمهني");
    const db = await getDb();
    if (!db) return error(res, 503, "قاعدة البيانات غير متاحة حالياً");
    const rows = await db.select().from(providerAdvertisements).where(eq(providerAdvertisements.providerId, provider.id)).orderBy(desc(providerAdvertisements.createdAt));
    return res.json(rows.map(toAdvertisement));
  });

  app.post("/api/ads", async (req, res) => {
    const provider = await currentProvider(req);
    if (!provider) return error(res, 401, "تحتاج إلى تسجيل الدخول كمهني");
    if (provider.providerAccountStatus !== "approved") return error(res, 403, "لا يمكنك نشر إعلان قبل اعتماد حسابك");
    const input = body(req);
    const title = typeof input.title === "string" ? input.title.trim() : "";
    const city = typeof input.city === "string" ? input.city.trim() : "";
    const plan = input.plan;
    const budget = Number(input.budget);
    if (title.length < 4 || !city || !Number.isFinite(budget) || budget <= 0 || typeof plan !== "string" || !(plan in AD_DURATIONS)) return error(res, 400, "أكمل بيانات الإعلان بصورة صحيحة");
    const db = await getDb();
    if (!db) return error(res, 503, "قاعدة البيانات غير متاحة حالياً");
    const inserted = await db.insert(providerAdvertisements).values({
      providerId: provider.id,
      title,
      description: typeof input.description === "string" ? input.description.trim() : "",
      city,
      district: typeof input.district === "string" ? input.district.trim() : "",
      targetAudience: typeof input.targetAudience === "string" ? input.targetAudience : null,
      categoryId: typeof input.categoryId === "number" && Number.isInteger(input.categoryId) ? input.categoryId : null,
      plan: plan as AdvertisementPlan,
      durationDays: AD_DURATIONS[plan as AdvertisementPlan],
      budget: Math.round(budget),
      imagePath: typeof input.imageUrl === "string" ? input.imageUrl : null,
    }).returning();
    return res.status(201).json(toAdvertisement(inserted[0]));
  });

  app.get("/api/admin/subscription-payments", async (req, res) => {
    try { const admin = await sdk.authenticateRequest(req); if (admin?.role !== "admin") return error(res, 403, "صلاحية الإدارة مطلوبة"); } catch { return error(res, 403, "صلاحية الإدارة مطلوبة"); }
    const db = await getDb();
    if (!db) return error(res, 503, "قاعدة البيانات غير متاحة حالياً");
    const rows = await db.select({ payment: providerSubscriptionPayments, provider: phoneUsers }).from(providerSubscriptionPayments).innerJoin(phoneUsers, eq(providerSubscriptionPayments.providerId, phoneUsers.id)).orderBy(desc(providerSubscriptionPayments.createdAt));
    return res.json({ payments: rows });
  });

  app.patch("/api/admin/subscription-payments/:id/review", async (req, res) => {
    try { const admin = await sdk.authenticateRequest(req); if (admin?.role !== "admin") return error(res, 403, "صلاحية الإدارة مطلوبة"); } catch { return error(res, 403, "صلاحية الإدارة مطلوبة"); }
    const status = body(req).status;
    if (status !== "approved" && status !== "rejected") return error(res, 400, "حالة الدفع غير صالحة");
    const db = await getDb();
    if (!db) return error(res, 503, "قاعدة البيانات غير متاحة حالياً");
    const id = Number(req.params.id);
    const payment = (await db.select().from(providerSubscriptionPayments).where(eq(providerSubscriptionPayments.id, id)).limit(1))[0];
    if (!payment) return error(res, 404, "طلب الدفع غير موجود");
    await db.update(providerSubscriptionPayments).set({ status, reviewedAt: new Date() }).where(eq(providerSubscriptionPayments.id, id));
    if (status === "approved") {
      const expires = new Date(Date.now() + planDays(payment.plan) * 24 * 60 * 60 * 1000);
      await db.update(phoneUsers).set({ subscriptionPlan: payment.plan, subscriptionExpiresAt: expires }).where(eq(phoneUsers.id, payment.providerId));
    }
    return res.json({ success: true, status });
  });
}
