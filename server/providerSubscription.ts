import type { Express, Request, Response } from "express";
import { and, desc, eq } from "drizzle-orm";
import { getDb } from "./db";
import { phoneAuthSessions, phoneUsers, providerSubscriptionPayments } from "../drizzle/schema";
import { sdk } from "./_core/sdk";

type Plan = "monthly" | "yearly";
function error(res: Response, status: number, message: string) { return res.status(status).json({ error: message }); }
function body(req: Request) { return req.body && typeof req.body === "object" ? req.body as Record<string, unknown> : {}; }
async function currentProvider(req: Request) {
  const token = (req.headers.authorization ?? "").replace(/^Bearer\s+/, "");
  const db = await getDb();
  if (!db || !token) return null;
  const session = (await db.select().from(phoneAuthSessions).where(eq(phoneAuthSessions.token, token)).limit(1))[0];
  if (!session || session.expiresAt.getTime() <= Date.now()) return null;
  const user = (await db.select().from(phoneUsers).where(eq(phoneUsers.phone, session.phone)).limit(1))[0];
  return user?.role === "provider" ? user : null;
}

export function registerProviderSubscriptionRoutes(app: Express) {
  app.get("/api/subscription-plans", (_req, res) => res.json({ plans: [
    { id: "monthly", title: "الباقة الشهرية", days: 30, amount: 30, description: "مرونة شهرية للبدء" },
    { id: "yearly", title: "الباقة السنوية", days: 365, amount: 300, description: "قيمة أفضل واستمرارية أطول" },
  ] }));

  app.get("/api/providers/me/subscription", async (req, res) => {
    const provider = await currentProvider(req);
    if (!provider) return error(res, 401, "تحتاج إلى تسجيل الدخول كمهني");
    const db = await getDb();
    if (!db) return error(res, 503, "قاعدة البيانات غير متاحة حالياً");
    const payments = await db.select().from(providerSubscriptionPayments).where(eq(providerSubscriptionPayments.providerId, provider.id)).orderBy(desc(providerSubscriptionPayments.createdAt));
    return res.json({ approved: provider.providerAccountStatus === "approved", plan: provider.subscriptionPlan, expiresAt: provider.subscriptionExpiresAt, active: Boolean(provider.subscriptionExpiresAt && provider.subscriptionExpiresAt.getTime() > Date.now()), payments });
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
    const inserted = await db.insert(providerSubscriptionPayments).values({ providerId: provider.id, plan: selected, amount }).returning({ id: providerSubscriptionPayments.id });
    return res.status(201).json({ success: true, paymentId: inserted[0]?.id, status: "pending", message: "تم تسجيل طلب الاشتراك، وسيتم تفعيله بعد تأكيد السداد." });
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
      const days = payment.plan === "monthly" ? 30 : 365;
      const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
      await db.update(phoneUsers).set({ subscriptionPlan: payment.plan, subscriptionExpiresAt: expires }).where(eq(phoneUsers.id, payment.providerId));
    }
    return res.json({ success: true, status });
  });
}
