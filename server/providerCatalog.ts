import type { Express } from "express";
import { and, desc, eq } from "drizzle-orm";
import { getDb } from "./db";
import { getAuthenticatedPhoneUser } from "./phoneSession";
import { notifications, phoneUsers, providerCategoryChangeRequests, providerVerificationDocuments, providerVerificationRequests } from "../drizzle/schema";

export const categories = [
  { id: 1, name: "سباكة", icon: "🔧", providerCount: 0, specialties: ["تمديدات مياه", "إصلاح تسربات", "تركيب مضخات", "صيانة سخانات"] },
  { id: 2, name: "كهرباء", icon: "⚡", providerCount: 0, specialties: ["تمديدات كهربائية", "لوحات كهرباء", "طاقة شمسية", "صيانة أعطال"] },
  { id: 3, name: "تكييف وتبريد", icon: "❄️", providerCount: 0, specialties: ["تركيب مكيفات", "صيانة مكيفات", "تنظيف مكيفات", "تبريد مركزي"] },
  { id: 4, name: "نجارة", icon: "🪚", providerCount: 0, specialties: ["أثاث منزلي", "مطابخ", "أبواب ونوافذ", "ديكور خشبي"] },
  { id: 5, name: "دهانات", icon: "🎨", providerCount: 0, specialties: ["دهان داخلي", "دهان خارجي", "ديكورات وجدران", "ترميم دهانات"] },
  { id: 6, name: "تنظيف", icon: "🧹", providerCount: 0, specialties: ["تنظيف منازل", "تنظيف مكاتب", "تنظيف سجاد", "مكافحة حشرات"] },
  { id: 7, name: "نقل أثاث", icon: "🚚", providerCount: 0, specialties: ["نقل داخل المدينة", "فك وتركيب", "تغليف أثاث", "نقل تجاري"] },
  { id: 8, name: "بناء ومقاولات", icon: "🏗️", providerCount: 0, specialties: ["أعمال خرسانة", "بناء وتشطيب", "بلاط وسيراميك", "حدادة وألمنيوم"] },
];

type CatalogQuery = {
  city?: string;
  district?: string;
  search?: string;
  specialty?: string;
  categoryId?: number;
  category?: string;
  minRating?: number;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  page: number;
  limit: number;
};

type ProviderRow = typeof phoneUsers.$inferSelect;

function positiveInteger(value: unknown, fallback: number, max?: number) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return fallback;
  return max ? Math.min(parsed, max) : parsed;
}

function finiteNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function queryString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function parseQuery(query: Record<string, unknown>): CatalogQuery {
  const categoryId = finiteNumber(query.categoryId);
  return {
    city: queryString(query.city),
    district: queryString(query.district),
    search: queryString(query.search),
    specialty: queryString(query.specialty),
    categoryId: categoryId === undefined ? undefined : Math.trunc(categoryId),
    category: queryString(query.category),
    minRating: finiteNumber(query.minRating),
    lat: finiteNumber(query.lat),
    lng: finiteNumber(query.lng),
    radiusKm: finiteNumber(query.radiusKm),
    page: positiveInteger(query.page, 1),
    limit: positiveInteger(query.limit, 20, 100),
  };
}

function normalize(value: string) {
  return value.trim().toLocaleLowerCase("ar");
}

function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const radians = Math.PI / 180;
  const dLat = (lat2 - lat1) * radians;
  const dLng = (lng2 - lng1) * radians;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * radians) * Math.cos(lat2 * radians) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function categoryFor(provider: ProviderRow) {
  return categories.find(category => category.id === provider.categoryId) ?? null;
}

function toSummary(provider: ProviderRow, query: CatalogQuery, approvedIds: Set<number>) {
  const lat = provider.latitude === null ? null : Number(provider.latitude);
  const lng = provider.longitude === null ? null : Number(provider.longitude);
  const hasCoordinates = lat !== null && lng !== null && Number.isFinite(lat) && Number.isFinite(lng);
  const distance = hasCoordinates && query.lat !== undefined && query.lng !== undefined
    ? Number(distanceKm(query.lat, query.lng, lat, lng).toFixed(2))
    : null;
  const category = categoryFor(provider);

  return {
    id: provider.id,
    name: provider.name,
    phone: provider.phone,
    whatsapp: provider.phone,
    avatarUrl: null,
    categoryId: provider.categoryId,
    categoryName: category?.name ?? "مقدم خدمة",
    categoryIcon: category?.icon ?? null,
    specialty: provider.specialty ?? "",
    bio: provider.bio ?? "",
    city: provider.city ?? "",
    district: provider.district ?? "",
    rating: 0,
    reviewCount: 0,
    completedJobs: 0,
    yearsExperience: provider.yearsExperience ?? 0,
    hourlyRate: null,
    isVerified: approvedIds.has(provider.id),
    isAvailable: provider.isAvailable,
    distanceKm: distance,
    lat: hasCoordinates ? lat : null,
    lng: hasCoordinates ? lng : null,
  };
}

async function activeProviders() {
  const db = await getDb();
  if (!db) return null;
  const [providers, verificationRequests] = await Promise.all([
    db.select().from(phoneUsers).where(and(eq(phoneUsers.role, "provider"), eq(phoneUsers.status, "active"))),
    db.select({ providerId: providerVerificationRequests.providerId, status: providerVerificationRequests.status })
      .from(providerVerificationRequests)
      .orderBy(desc(providerVerificationRequests.createdAt)),
  ]);
  const latestVerificationStatus = new Map<number, "pending" | "approved" | "rejected">();
  for (const request of verificationRequests) {
    if (!latestVerificationStatus.has(request.providerId)) latestVerificationStatus.set(request.providerId, request.status);
  }
  const now = Date.now();
  const eligible = providers.filter(provider =>
    provider.providerAccountStatus === "approved" &&
    provider.subscriptionExpiresAt !== null &&
    provider.subscriptionExpiresAt.getTime() > now,
  );
  const approvedIds = new Set(eligible
    .filter(provider => provider.providerAccountStatus === "approved" && latestVerificationStatus.get(provider.id) === "approved")
    .map(provider => provider.id));
  return { providers: eligible, approvedIds };
}

async function listProviders(query: CatalogQuery, sort: "name" | "distance" = "name") {
  const result = await activeProviders();
  if (result === null) return { providers: [], total: 0 };
  const search = query.search ? normalize(query.search) : "";
  const specialty = query.specialty ? normalize(query.specialty) : "";
  const category = query.category ? normalize(query.category) : "";
  const providers = result.providers.map(row => toSummary(row, query, result.approvedIds)).filter(provider => {
    if (query.categoryId !== undefined && provider.categoryId !== query.categoryId) return false;
    if (category && normalize(provider.categoryName) !== category) return false;
    if (specialty && normalize(provider.specialty) !== specialty) return false;
    if (query.city && provider.city !== query.city) return false;
    if (query.district && provider.district !== query.district) return false;
    if (query.minRating !== undefined && provider.rating < query.minRating) return false;
    if (search && ![provider.name, provider.city, provider.district, provider.categoryName, provider.specialty, provider.bio]
      .some(value => normalize(value).includes(search))) return false;
    if (query.radiusKm !== undefined && (provider.distanceKm === null || provider.distanceKm > query.radiusKm)) return false;
    return true;
  });
  providers.sort((a, b) => sort === "distance"
    ? (a.distanceKm ?? Number.POSITIVE_INFINITY) - (b.distanceKm ?? Number.POSITIVE_INFINITY)
    : a.name.localeCompare(b.name, "ar"));
  return { providers, total: providers.length };
}

async function portfolioForProvider(providerId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({
    id: providerVerificationDocuments.id,
    objectPath: providerVerificationDocuments.objectPath,
    description: providerVerificationDocuments.originalName,
    createdAt: providerVerificationDocuments.createdAt,
  }).from(providerVerificationDocuments)
    .innerJoin(providerVerificationRequests, eq(providerVerificationDocuments.requestId, providerVerificationRequests.id))
    .where(and(
      eq(providerVerificationRequests.providerId, providerId),
      eq(providerVerificationRequests.status, "approved"),
      eq(providerVerificationDocuments.type, "portfolio"),
    ));
  return rows.map(row => ({
    id: row.id,
    providerId,
    imageUrl: `/manus-storage/${row.objectPath.replace(/^\/+/, "")}`,
    description: row.description,
    createdAt: row.createdAt.toISOString(),
  }));
}

export function registerProviderCatalogRoutes(app: Express) {
  app.get("/api/categories", (_req, res) => res.json(categories));

  app.get("/api/home-feed", async (req, res) => {
    const query = parseQuery(req.query as Record<string, unknown>);
    const [nearbyResult, topRatedResult, mostRequestedResult] = await Promise.all([
      listProviders(query, query.lat !== undefined && query.lng !== undefined ? "distance" : "name"),
      listProviders(query, "name"),
      listProviders(query, "name"),
    ]);
    return res.json({
      categories,
      nearbyProviders: nearbyResult.providers.slice(0, 8),
      topRatedProviders: topRatedResult.providers.slice(0, 8),
      mostRequestedProviders: mostRequestedResult.providers.slice(0, 8),
      recentRequests: [],
    });
  });

  app.get("/api/providers/me", async (req, res) => {
    const db = await getDb();
    const provider = await getAuthenticatedPhoneUser(req);
    if (!db || !provider) return res.status(401).json({ error: "تحتاج إلى تسجيل الدخول" });
    if (!provider || provider.role !== "provider") return res.status(403).json({ error: "هذا المسار للمهنيين فقط" });
    const [verificationRequest] = await db.select().from(providerVerificationRequests)
      .where(eq(providerVerificationRequests.providerId, provider.id))
      .orderBy(desc(providerVerificationRequests.createdAt)).limit(1);
    const [categoryChangeRequest] = await db.select().from(providerCategoryChangeRequests)
      .where(eq(providerCategoryChangeRequests.providerId, provider.id))
      .orderBy(desc(providerCategoryChangeRequests.createdAt)).limit(1);
    const verified = provider.providerAccountStatus === "approved" && verificationRequest?.status === "approved";
    return res.json({
      ...toSummary(provider, parseQuery({}), new Set(verified ? [provider.id] : [])),
      subscriptionPlan: provider.subscriptionPlan,
      subscriptionExpiresAt: provider.subscriptionExpiresAt,
      providerAccountStatus: provider.providerAccountStatus,
      verificationStatus: verificationRequest?.status ?? null,
      verificationRejectionReason: verificationRequest?.rejectionReason ?? null,
      verificationSubmittedAt: verificationRequest?.submittedAt ?? null,
      nationalId: provider.nationalId,
      email: provider.email,
      country: provider.country,
      governorate: provider.governorate,
      whatsapp: provider.whatsapp,
      categoryChangeRequest: categoryChangeRequest ? {
        id: categoryChangeRequest.id,
        status: categoryChangeRequest.status,
        currentCategoryId: categoryChangeRequest.currentCategoryId,
        currentCategoryName: categories.find(item => item.id === categoryChangeRequest.currentCategoryId)?.name ?? "غير محدد",
        requestedCategoryId: categoryChangeRequest.requestedCategoryId,
        requestedCategoryName: categories.find(item => item.id === categoryChangeRequest.requestedCategoryId)?.name ?? "غير معروف",
        currentSpecialty: categoryChangeRequest.currentSpecialty,
        requestedSpecialty: categoryChangeRequest.requestedSpecialty,
        rejectionReason: categoryChangeRequest.rejectionReason,
        submittedAt: categoryChangeRequest.submittedAt,
        reviewedAt: categoryChangeRequest.reviewedAt,
      } : null,
    });
  });

  app.patch("/api/providers/me/profile", async (req, res) => {
    const db = await getDb();
    const provider = await getAuthenticatedPhoneUser(req);
    if (!db || !provider) return res.status(401).json({ error: "تحتاج إلى تسجيل الدخول" });
    if (!provider || provider.role !== "provider") return res.status(403).json({ error: "هذا المسار للمهنيين فقط" });

    const body = req.body && typeof req.body === "object" ? req.body as Record<string, unknown> : {};
    if (Object.prototype.hasOwnProperty.call(body, "name") || Object.prototype.hasOwnProperty.call(body, "phone")) {
      return res.status(403).json({ error: "لا يمكن تغيير اسم الحساب أو رقم تسجيل الدخول من هذا النموذج" });
    }

    const profileValues: Partial<typeof phoneUsers.$inferInsert> = { updatedAt: new Date() };
    const stringFields = [
      ["city", 120],
      ["governorate", 120],
      ["district", 120],
      ["bio", 1200],
    ] as const;
    for (const [field, maxLength] of stringFields) {
      if (!(field in body)) continue;
      if (typeof body[field] !== "string") return res.status(400).json({ error: `قيمة ${field} غير صالحة` });
      const value = (body[field] as string).trim();
      if (value.length > maxLength) return res.status(400).json({ error: `قيمة ${field} أطول من المسموح` });
      profileValues[field] = value || null;
    }
    if ("whatsapp" in body) {
      if (typeof body.whatsapp !== "string") return res.status(400).json({ error: "رقم واتساب غير صالح" });
      const value = body.whatsapp.trim();
      if (value && !/^\d{7,9}$/.test(value)) return res.status(400).json({ error: "أدخل رقم واتساب من 7 إلى 9 أرقام" });
      profileValues.whatsapp = value || null;
    }
    if ("yearsExperience" in body) {
      const years = Number(body.yearsExperience);
      if (!Number.isInteger(years) || years < 0 || years > 60) return res.status(400).json({ error: "عدد سنوات الخبرة غير صالح" });
      profileValues.yearsExperience = years;
    }

    let requestedCategory: (typeof categories)[number] | undefined;
    let requestedSpecialty: string | undefined;
    const hasCategoryInput = "categoryId" in body || "specialty" in body;
    if (hasCategoryInput) {
      const categoryId = Number(body.categoryId);
      requestedCategory = categories.find(category => category.id === categoryId);
      requestedSpecialty = typeof body.specialty === "string" ? body.specialty.trim() : "";
      if (!requestedCategory || !requestedSpecialty || requestedSpecialty.length > 160 || !requestedCategory.specialties.includes(requestedSpecialty)) {
        return res.status(400).json({ error: "اختر مجالاً وتخصصاً صحيحين من القائمة" });
      }
    }
    const categoryChangeRequested = Boolean(requestedCategory && requestedSpecialty && (
      requestedCategory.id !== provider.categoryId || requestedSpecialty !== (provider.specialty ?? "")
    ));
    if (categoryChangeRequested) {
      const existingPending = (await db.select({ id: providerCategoryChangeRequests.id })
        .from(providerCategoryChangeRequests)
        .where(and(eq(providerCategoryChangeRequests.providerId, provider.id), eq(providerCategoryChangeRequests.status, "pending")))
        .limit(1))[0];
      if (existingPending) return res.status(409).json({ error: "لديك طلب تغيير تخصص قيد المراجعة؛ انتظر قرار الإدارة أولاً" });
    }

    try {
      let categoryChangeRequest: typeof providerCategoryChangeRequests.$inferSelect | null = null;
      await db.transaction(async tx => {
        await tx.update(phoneUsers).set(profileValues).where(eq(phoneUsers.id, provider.id));
        if (categoryChangeRequested && requestedCategory && requestedSpecialty) {
          categoryChangeRequest = (await tx.insert(providerCategoryChangeRequests).values({
            providerId: provider.id,
            currentCategoryId: provider.categoryId,
            requestedCategoryId: requestedCategory.id,
            currentSpecialty: provider.specialty,
            requestedSpecialty,
            status: "pending",
          }).returning())[0];
          await tx.insert(notifications).values({
            userId: provider.id,
            type: "provider_category_change_pending",
            title: "طلب تغيير المجال والتخصص",
            body: "تم استلام طلبك. سيبقى تخصصك الحالي ظاهراً حتى تنتهي الإدارة من مراجعته.",
            relatedId: categoryChangeRequest.id,
          });
        }
      });
      return res.json({ success: true, categoryChangeRequest });
    } catch (error) {
      const databaseError = error as { code?: string; cause?: { code?: string } };
      if (databaseError.code === "23505" || databaseError.cause?.code === "23505") {
        return res.status(409).json({ error: "يوجد طلب تغيير تخصص قيد المراجعة بالفعل" });
      }
      console.error("[ProviderProfile] profile update failed", error);
      return res.status(500).json({ error: "تعذر حفظ الملف الشخصي حالياً" });
    }
  });

  app.get("/api/providers", async (req, res) => {
    const query = parseQuery(req.query as Record<string, unknown>);
    const result = await listProviders(query);
    const start = (query.page - 1) * query.limit;
    res.json({ providers: result.providers.slice(start, start + query.limit), total: result.total, page: query.page, limit: query.limit });
  });

  app.patch("/api/providers/:id", async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: "معرف المهني غير صالح" });
    const db = await getDb();
    if (!db) return res.status(503).json({ error: "قاعدة البيانات غير متاحة حالياً" });
    const provider = await getAuthenticatedPhoneUser(req);
    if (!provider) return res.status(401).json({ error: "تحتاج إلى تسجيل الدخول" });
    if (!provider || provider.role !== "provider" || provider.id !== id) return res.status(403).json({ error: "لا يمكنك تعديل هذا الملف" });
    if (typeof req.body?.isAvailable !== "boolean") return res.status(400).json({ error: "حالة الإتاحة غير صالحة" });
    const updated = (await db.update(phoneUsers).set({ isAvailable: req.body.isAvailable, updatedAt: new Date() }).where(eq(phoneUsers.id, id)).returning())[0];
    const approved = await db.select({ providerId: providerVerificationRequests.providerId }).from(providerVerificationRequests).where(and(eq(providerVerificationRequests.providerId, id), eq(providerVerificationRequests.status, "approved"))).limit(1);
    return res.json({ ...toSummary(updated, parseQuery({}), new Set(approved.map(row => row.providerId))), subscriptionPlan: updated.subscriptionPlan, subscriptionExpiresAt: updated.subscriptionExpiresAt, providerAccountStatus: updated.providerAccountStatus });
  });

  app.get("/api/providers/top-rated", async (req, res) => {
    const query = parseQuery(req.query as Record<string, unknown>);
    const result = await listProviders(query);
    res.json(result.providers.slice(0, query.limit));
  });

  app.get("/api/providers/most-requested", async (req, res) => {
    const query = parseQuery(req.query as Record<string, unknown>);
    const result = await listProviders(query);
    res.json(result.providers.slice(0, query.limit));
  });

  app.get("/api/providers/nearby", async (req, res) => {
    const query = parseQuery(req.query as Record<string, unknown>);
    if (query.lat === undefined || query.lng === undefined) return res.status(400).json({ error: "يجب تحديد خط العرض وخط الطول" });
    if (query.lat < -90 || query.lat > 90 || query.lng < -180 || query.lng > 180) return res.status(400).json({ error: "إحداثيات الموقع غير صالحة" });
    const result = await listProviders(query, "distance");
    res.json(result.providers.slice(0, query.limit));
  });

  app.get("/api/providers/:id", async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: "معرف المهني غير صالح" });
    const result = await listProviders(parseQuery({}));
    const provider = result.providers.find(item => item.id === id);
    if (!provider) return res.status(404).json({ error: "لم يتم العثور على المهني" });
    return res.json({ ...provider, isFavorited: false, createdAt: new Date().toISOString() });
  });

  app.get("/api/providers/:id/reviews", async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: "معرف المهني غير صالح" });
    const result = await listProviders(parseQuery({}));
    if (!result.providers.some(item => item.id === id)) return res.status(404).json({ error: "لم يتم العثور على المهني" });
    return res.json([]);
  });

  app.get("/api/providers/:id/portfolio", async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: "معرف المهني غير صالح" });
    const result = await listProviders(parseQuery({}));
    if (!result.providers.some(item => item.id === id)) return res.status(404).json({ error: "لم يتم العثور على المهني" });
    return res.json(await portfolioForProvider(id));
  });

  app.post("/api/providers/:id/contact-click", async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: "معرف المهني غير صالح" });
    const result = await listProviders(parseQuery({}));
    if (!result.providers.some(item => item.id === id)) return res.status(404).json({ error: "لم يتم العثور على المهني" });
    if (req.body?.kind !== "call" && req.body?.kind !== "whatsapp") return res.status(400).json({ error: "نوع الاتصال غير صالح" });
    return res.json({ success: true });
  });
}
