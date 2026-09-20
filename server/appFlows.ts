import type { Express, Request, Response } from "express";
import { and, desc, eq, inArray } from "drizzle-orm";
import { getDb } from "./db";
import {
  notifications,
  phoneAuthSessions,
  phoneUsers,
  providerFavorites,
  serviceRequests,
} from "../drizzle/schema";

type PhoneUserRow = typeof phoneUsers.$inferSelect;
type RequestRow = typeof serviceRequests.$inferSelect;

const categoryNames: Record<number, string> = {
  1: "سباكة", 2: "كهرباء", 3: "تكييف وتبريد", 4: "نجارة",
  5: "دهانات", 6: "تنظيف", 7: "نقل أثاث", 8: "بناء ومقاولات",
};

function jsonError(res: Response, status: number, error: string) {
  return res.status(status).json({ error });
}

async function authenticatedUser(req: Request): Promise<PhoneUserRow | null> {
  const token = (req.headers.authorization ?? "").replace(/^Bearer\s+/, "");
  if (!token) return null;
  const db = await getDb();
  if (!db) return null;
  const session = (await db.select().from(phoneAuthSessions).where(eq(phoneAuthSessions.token, token)).limit(1))[0];
  if (!session || session.expiresAt.getTime() <= Date.now()) return null;
  return (await db.select().from(phoneUsers).where(eq(phoneUsers.phone, session.phone)).limit(1))[0] ?? null;
}

function asNumber(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function requestResponse(row: RequestRow, users: Map<number, PhoneUserRow>) {
  const client = users.get(row.clientId);
  const provider = users.get(row.providerId);
  return {
    id: row.id,
    clientId: row.clientId,
    clientName: client?.name ?? null,
    clientAvatarUrl: null,
    providerId: row.providerId,
    providerName: provider?.name ?? null,
    providerAvatarUrl: null,
    providerCategoryName: provider?.categoryId ? categoryNames[provider.categoryId] ?? "مقدم خدمة" : "مقدم خدمة",
    status: row.status,
    serviceType: row.serviceType,
    description: row.description,
    city: row.city,
    district: row.district,
    lat: row.latitude === null ? null : Number(row.latitude),
    lng: row.longitude === null ? null : Number(row.longitude),
    scheduledAt: row.scheduledAt?.toISOString() ?? null,
    completedAt: row.completedAt?.toISOString() ?? null,
    isImmediate: row.isImmediate,
    createdAt: row.createdAt.toISOString(),
  };
}

async function requestResponses(rows: RequestRow[]) {
  const db = await getDb();
  if (!db || rows.length === 0) return rows.map(row => requestResponse(row, new Map()));
  const ids = Array.from(new Set(rows.flatMap(row => [row.clientId, row.providerId])));
  const users = await db.select().from(phoneUsers).where(inArray(phoneUsers.id, ids));
  return rows.map(row => requestResponse(row, new Map(users.map(user => [user.id, user]))));
}

export function registerAppFlowRoutes(app: Express) {
  app.get("/api/requests", async (req, res) => {
    const db = await getDb();
    if (!db) return jsonError(res, 503, "قاعدة البيانات غير متاحة حالياً");
    const user = await authenticatedUser(req);
    if (!user) return jsonError(res, 401, "تحتاج إلى تسجيل الدخول");
    const rows = await db.select().from(serviceRequests)
      .where(user.role === "provider" ? eq(serviceRequests.providerId, user.id) : eq(serviceRequests.clientId, user.id))
      .orderBy(desc(serviceRequests.createdAt));
    return res.json(await requestResponses(rows));
  });

  app.post("/api/requests", async (req, res) => {
    const db = await getDb();
    if (!db) return jsonError(res, 503, "قاعدة البيانات غير متاحة حالياً");
    const user = await authenticatedUser(req);
    if (!user) return jsonError(res, 401, "تحتاج إلى تسجيل الدخول");
    if (user.role !== "client") return jsonError(res, 403, "إنشاء الطلبات متاح للعملاء فقط");
    const providerId = Number(req.body?.providerId);
    const serviceType = typeof req.body?.serviceType === "string" ? req.body.serviceType.trim() : "";
    const description = typeof req.body?.description === "string" ? req.body.description.trim() : "";
    const city = typeof req.body?.city === "string" ? req.body.city.trim() : "";
    const district = typeof req.body?.district === "string" ? req.body.district.trim() : "";
    if (!Number.isInteger(providerId) || providerId <= 0) return jsonError(res, 400, "اختر مهنياً صحيحاً");
    if (serviceType.length < 2 || description.length < 10 || city.length < 2) return jsonError(res, 400, "أكمل بيانات طلب الخدمة");
    const provider = (await db.select().from(phoneUsers).where(and(eq(phoneUsers.id, providerId), eq(phoneUsers.role, "provider"))).limit(1))[0];
    if (!provider) return jsonError(res, 404, "لم يتم العثور على المهني");
    const row = (await db.insert(serviceRequests).values({
      clientId: user.id,
      providerId,
      serviceType,
      description,
      city,
      district,
      latitude: asNumber(req.body?.lat)?.toString() ?? null,
      longitude: asNumber(req.body?.lng)?.toString() ?? null,
      scheduledAt: typeof req.body?.scheduledAt === "string" && req.body.scheduledAt ? new Date(req.body.scheduledAt) : null,
      isImmediate: req.body?.isImmediate !== false,
    }).returning())[0];
    await db.insert(notifications).values({ userId: providerId, type: "request_created", title: "طلب خدمة جديد", body: `طلب ${serviceType} جديد من ${user.name}`, relatedId: row.id });
    return res.status(201).json((await requestResponses([row]))[0]);
  });

  app.get("/api/requests/:id", async (req, res) => {
    const db = await getDb();
    if (!db) return jsonError(res, 503, "قاعدة البيانات غير متاحة حالياً");
    const user = await authenticatedUser(req);
    if (!user) return jsonError(res, 401, "تحتاج إلى تسجيل الدخول");
    const id = Number(req.params.id);
    const row = (await db.select().from(serviceRequests).where(eq(serviceRequests.id, id)).limit(1))[0];
    if (!row || (row.clientId !== user.id && row.providerId !== user.id)) return jsonError(res, 404, "الطلب غير موجود");
    return res.json((await requestResponses([row]))[0]);
  });

  app.patch("/api/requests/:id", async (req, res) => {
    const db = await getDb();
    if (!db) return jsonError(res, 503, "قاعدة البيانات غير متاحة حالياً");
    const user = await authenticatedUser(req);
    if (!user) return jsonError(res, 401, "تحتاج إلى تسجيل الدخول");
    const id = Number(req.params.id);
    const row = (await db.select().from(serviceRequests).where(eq(serviceRequests.id, id)).limit(1))[0];
    if (!row || (row.clientId !== user.id && row.providerId !== user.id)) return jsonError(res, 404, "الطلب غير موجود");
    const status = req.body?.status as RequestRow["status"];
    const providerTransitions: Record<string, string[]> = { pending: ["accepted", "rejected"], accepted: ["in_progress"], in_progress: ["completed"] };
    const clientCanCancel = user.id === row.clientId && ["pending", "accepted"].includes(row.status) && status === "cancelled";
    const providerCanUpdate = user.id === row.providerId && (providerTransitions[row.status]?.includes(status) ?? false);
    if (!clientCanCancel && !providerCanUpdate) return jsonError(res, 400, "لا يمكن تغيير حالة الطلب بهذه الطريقة");
    const updated = (await db.update(serviceRequests).set({ status, completedAt: status === "completed" ? new Date() : row.completedAt, updatedAt: new Date() }).where(eq(serviceRequests.id, id)).returning())[0];
    const targetId = user.id === row.providerId ? row.clientId : row.providerId;
    await db.insert(notifications).values({ userId: targetId, type: "request_status", title: "تحديث حالة الطلب", body: `تم تحديث حالة طلب ${row.serviceType}`, relatedId: row.id });
    return res.json((await requestResponses([updated]))[0]);
  });

  app.get("/api/notifications", async (req, res) => {
    const db = await getDb();
    if (!db) return jsonError(res, 503, "قاعدة البيانات غير متاحة حالياً");
    const user = await authenticatedUser(req);
    if (!user) return jsonError(res, 401, "تحتاج إلى تسجيل الدخول");
    const rows = await db.select().from(notifications).where(eq(notifications.userId, user.id)).orderBy(desc(notifications.createdAt));
    return res.json(rows.map(row => ({ ...row, createdAt: row.createdAt.toISOString() })));
  });

  app.patch("/api/notifications", async (req, res) => {
    const db = await getDb();
    if (!db) return jsonError(res, 503, "قاعدة البيانات غير متاحة حالياً");
    const user = await authenticatedUser(req);
    if (!user) return jsonError(res, 401, "تحتاج إلى تسجيل الدخول");
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, user.id));
    return res.json({ success: true });
  });

  app.get("/api/favorites", async (req, res) => {
    const db = await getDb();
    if (!db) return jsonError(res, 503, "قاعدة البيانات غير متاحة حالياً");
    const user = await authenticatedUser(req);
    if (!user) return jsonError(res, 401, "تحتاج إلى تسجيل الدخول");
    const favorites = await db.select().from(providerFavorites).where(eq(providerFavorites.clientId, user.id)).orderBy(desc(providerFavorites.createdAt));
    if (!favorites.length) return res.json([]);
    const providers = await db.select().from(phoneUsers).where(inArray(phoneUsers.id, favorites.map(item => item.providerId)));
    return res.json(providers.map(provider => ({
      id: provider.id, name: provider.name, phone: provider.phone,
      categoryName: provider.categoryId ? categoryNames[provider.categoryId] ?? "مقدم خدمة" : "مقدم خدمة",
      specialty: provider.specialty ?? "", bio: provider.bio ?? "", city: provider.city ?? "", district: provider.district ?? "",
      rating: 0, reviewCount: 0, yearsExperience: provider.yearsExperience ?? 0,
      isVerified: provider.providerAccountStatus === "approved", isAvailable: provider.status === "active", isFavorited: true,
    })));
  });

  app.post("/api/favorites/:providerId", async (req, res) => {
    const db = await getDb();
    if (!db) return jsonError(res, 503, "قاعدة البيانات غير متاحة حالياً");
    const user = await authenticatedUser(req);
    if (!user) return jsonError(res, 401, "تحتاج إلى تسجيل الدخول");
    const providerId = Number(req.params.providerId);
    await db.insert(providerFavorites).values({ clientId: user.id, providerId }).onConflictDoNothing();
    return res.json({ success: true });
  });

  app.delete("/api/favorites/:providerId", async (req, res) => {
    const db = await getDb();
    if (!db) return jsonError(res, 503, "قاعدة البيانات غير متاحة حالياً");
    const user = await authenticatedUser(req);
    if (!user) return jsonError(res, 401, "تحتاج إلى تسجيل الدخول");
    const providerId = Number(req.params.providerId);
    await db.delete(providerFavorites).where(and(eq(providerFavorites.clientId, user.id), eq(providerFavorites.providerId, providerId)));
    return res.json({ success: true });
  });
}
