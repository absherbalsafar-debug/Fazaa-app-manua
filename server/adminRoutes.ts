import type { Express, Request, Response } from "express";
import { and, desc, eq, ilike, or } from "drizzle-orm";
import { getDb } from "./db";
import {
  phoneUsers,
  providerVerificationDocuments,
  providerVerificationRequests,
  providerVerificationReviewHistory,
  notifications,
  users,
} from "../drizzle/schema";
import { storageGetSignedUrl } from "./storage";
import { sdk } from "./_core/sdk";
import { sendPushToUser } from "./pushNotifications";

async function currentAdmin(req: Request) {
  try {
    const user = await sdk.authenticateRequest(req);
    return user?.role === "admin" ? user : null;
  } catch {
    return null;
  }
}

function deny(res: Response, status = 403) {
  return res.status(status).json({ error: "صلاحية الإدارة مطلوبة" });
}

function dbUnavailable(res: Response) {
  return res.status(503).json({ error: "قاعدة البيانات غير متاحة حالياً" });
}

export function registerAdminRoutes(app: Express) {
  app.get("/api/admin/me", async (req, res) => {
    const admin = await currentAdmin(req);
    if (!admin) return deny(res);
    return res.json({ id: admin.id, name: admin.name, email: admin.email, role: admin.role });
  });

  app.get("/api/admin/stats", async (req, res) => {
    if (!(await currentAdmin(req))) return deny(res);
    const db = await getDb();
    if (!db) return dbUnavailable(res);
    const [oauthUsers, phone, pending] = await Promise.all([
      db.select({ id: users.id, role: users.role }).from(users),
      db.select({ id: phoneUsers.id, role: phoneUsers.role }).from(phoneUsers),
      db.select({ id: providerVerificationRequests.id })
        .from(providerVerificationRequests)
        .where(eq(providerVerificationRequests.status, "pending")),
    ]);
    return res.json({
      totalUsers: oauthUsers.length + phone.length,
      totalProviders: phone.filter(item => item.role === "provider").length,
      totalClients: phone.filter(item => item.role === "client").length,
      pendingProviders: pending.length,
      totalRequests: null,
      completedRequests: null,
    });
  });

  app.get("/api/admin/users", async (req, res) => {
    if (!(await currentAdmin(req))) return deny(res);
    const db = await getDb();
    if (!db) return dbUnavailable(res);
    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
    const role = typeof req.query.role === "string" ? req.query.role : "all";
    const oauthRows = await db.select().from(users).where(and(
      role === "admin" ? eq(users.role, "admin") : undefined,
      search ? or(ilike(users.name, `%${search}%`), ilike(users.email, `%${search}%`)) : undefined,
    )).orderBy(desc(users.createdAt));
    const phoneRows = await db.select().from(phoneUsers).where(and(
      role !== "all" && role !== "admin" ? eq(phoneUsers.role, role as "client" | "provider") : undefined,
      search ? or(ilike(phoneUsers.name, `%${search}%`), ilike(phoneUsers.phone, `%${search}%`)) : undefined,
    )).orderBy(desc(phoneUsers.createdAt));
    const result = [
      ...oauthRows.map(user => ({ id: user.id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt, lastSignedIn: user.lastSignedIn })),
      ...phoneRows.map(user => ({ id: user.id + 1_000_000, name: user.name, email: null, role: user.role, createdAt: user.createdAt, lastSignedIn: user.updatedAt })),
    ];
    return res.json({ users: result, total: result.length });
  });

  app.get("/api/admin/service-stats", async (req, res) => {
    if (!(await currentAdmin(req))) return deny(res);
    return res.json([]);
  });

  app.get("/api/admin/provider-verifications", async (req, res) => {
    if (!(await currentAdmin(req))) return deny(res);
    const db = await getDb();
    if (!db) return dbUnavailable(res);
    const rows = await db.select({ request: providerVerificationRequests, provider: phoneUsers })
      .from(providerVerificationRequests)
      .innerJoin(phoneUsers, eq(providerVerificationRequests.providerId, phoneUsers.id))
      .orderBy(desc(providerVerificationRequests.createdAt));
    const requests = await Promise.all(rows.map(async ({ request, provider }) => {
      const documents = await db.select({
        id: providerVerificationDocuments.id,
        type: providerVerificationDocuments.type,
        objectPath: providerVerificationDocuments.objectPath,
        originalName: providerVerificationDocuments.originalName,
      }).from(providerVerificationDocuments)
        .where(eq(providerVerificationDocuments.requestId, request.id));
      const history = await db.select().from(providerVerificationReviewHistory)
        .where(eq(providerVerificationReviewHistory.requestId, request.id))
        .orderBy(desc(providerVerificationReviewHistory.createdAt));
      const documentsWithUrls = await Promise.all(documents.map(async document => {
        try {
          return { id: document.id, type: document.type, originalName: document.originalName, url: await storageGetSignedUrl(document.objectPath) };
        } catch (error) {
          console.error("[Admin] Could not sign verification document URL", { requestId: request.id, documentId: document.id, error });
          return { id: document.id, type: document.type, originalName: document.originalName, url: null };
        }
      }));
      return {
        id: request.id,
        status: request.status,
        rejectionReason: request.rejectionReason,
        submittedAt: request.submittedAt,
        reviewedAt: request.reviewedAt,
        provider: {
          id: provider.id,
          name: provider.name,
          phone: provider.phone,
          whatsapp: provider.whatsapp,
          city: provider.city,
          country: provider.country,
          governorate: provider.governorate,
          district: provider.district,
          latitude: provider.latitude,
          longitude: provider.longitude,
          nationalId: provider.nationalId,
          categoryId: provider.categoryId,
          specialty: provider.specialty,
          bio: provider.bio,
          yearsExperience: provider.yearsExperience,
          createdAt: provider.createdAt,
        },
        documents: documentsWithUrls,
        history,
      };
    }));
    return res.json({ requests });
  });

  app.patch("/api/admin/provider-verifications/:id", async (req, res) => {
    const admin = await currentAdmin(req);
    if (!admin) return deny(res);
    const body = req.body && typeof req.body === "object" ? req.body as Record<string, unknown> : {};
    const status = body.status;
    const rejectionReason = typeof body.rejectionReason === "string" ? body.rejectionReason.trim().slice(0, 2000) : null;
    if (status !== "approved" && status !== "rejected" && status !== "pending") {
      return res.status(400).json({ error: "حالة التوثيق غير صالحة" });
    }
    if (status === "rejected" && !rejectionReason) {
      return res.status(400).json({ error: "يرجى إدخال سبب الرفض" });
    }
    const db = await getDb();
    if (!db) return dbUnavailable(res);
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: "رقم الطلب غير صالح" });
    const request = (await db.select({ providerId: providerVerificationRequests.providerId })
      .from(providerVerificationRequests)
      .where(eq(providerVerificationRequests.id, id)).limit(1))[0];
    if (!request) return res.status(404).json({ error: "طلب الاعتماد غير موجود" });
    const nextReviewDate = status === "pending" ? null : new Date();
    await db.transaction(async tx => {
      await tx.update(providerVerificationRequests).set({
        status,
        rejectionReason: status === "rejected" ? rejectionReason : null,
        reviewedAt: nextReviewDate,
        updatedAt: new Date(),
      }).where(eq(providerVerificationRequests.id, id));
      await tx.insert(providerVerificationReviewHistory).values({
        requestId: id,
        status,
        rejectionReason: status === "rejected" ? rejectionReason : null,
        adminOpenId: admin.openId,
        adminName: admin.name ?? null,
      });
      await tx.update(phoneUsers).set({ providerAccountStatus: status === "approved" ? "approved" : "pending", updatedAt: new Date() })
        .where(eq(phoneUsers.id, request.providerId));
    });
    if (status === "approved" || status === "rejected") {
      const title = status === "approved" ? "تم قبول طلب اعتمادك" : "تم رفض طلب اعتمادك";
      const body = status === "approved"
        ? "تهانينا، تمت الموافقة على اعتماد حسابك المهني ويمكنك الآن استقبال الطلبات."
        : `تمت مراجعة طلب اعتمادك ولم تتم الموافقة عليه.${rejectionReason ? ` السبب: ${rejectionReason}` : " افتح التطبيق لمعرفة التفاصيل."}`;
      await db.insert(notifications).values({ userId: request.providerId, type: `provider_verification_${status}`, title, body, relatedId: id });
      void sendPushToUser(request.providerId, { title, body, type: `provider_verification_${status}`, relatedId: id })
        .catch(error => console.error("[Push] provider verification notification failed", error));
    }
    return res.json({ success: true, status });
  });
}
