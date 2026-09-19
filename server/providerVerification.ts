import type { Express, Request, Response } from "express";
import { and, desc, eq } from "drizzle-orm";
import { getDb } from "./db";
import {
  phoneAuthSessions,
  phoneUsers,
  providerVerificationDocuments,
  providerVerificationRequests,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const allowedTypes = new Set(["selfie", "id_front", "id_back", "portfolio", "certificate"]);
const allowedContentTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"]);

type AuthenticatedPhoneUser = typeof phoneUsers.$inferSelect;

function jsonError(res: Response, status: number, message: string) {
  return res.status(status).json({ error: message });
}

function readBody(req: Request) {
  return req.body && typeof req.body === "object" ? req.body as Record<string, unknown> : {};
}

async function currentUser(req: Request): Promise<AuthenticatedPhoneUser | null> {
  const authorization = req.headers.authorization ?? "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!token) return null;
  const db = await getDb();
  if (!db) return null;
  const session = (await db.select().from(phoneAuthSessions).where(eq(phoneAuthSessions.token, token)).limit(1))[0];
  if (!session || session.expiresAt.getTime() <= Date.now()) return null;
  return (await db.select().from(phoneUsers).where(eq(phoneUsers.phone, session.phone)).limit(1))[0] ?? null;
}

function storageConfig() {
  if (!ENV.forgeApiUrl || !ENV.forgeApiKey) throw new Error("Storage is not configured");
  return { url: ENV.forgeApiUrl.replace(/\/+$/, ""), key: ENV.forgeApiKey };
}

async function createUploadUrl(name: string) {
  const { url, key } = storageConfig();
  const safeName = name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-120) || "document";
  const objectPath = `provider-verification/${Date.now()}-${crypto.randomUUID()}-${safeName}`;
  const presign = new URL("v1/storage/presign/put", `${url}/`);
  presign.searchParams.set("path", objectPath);
  const response = await fetch(presign, { headers: { Authorization: `Bearer ${key}` } });
  if (!response.ok) throw new Error("presign failed");
  const result = await response.json() as { url?: string };
  if (!result.url) throw new Error("empty presign url");
  return { uploadURL: result.url, objectPath };
}

export function registerProviderVerificationRoutes(app: Express) {
  app.get("/api/providers/me/verification-status", async (req, res) => {
    const user = await currentUser(req);
    if (!user) return jsonError(res, 401, "تحتاج إلى تسجيل الدخول");
    if (user.role !== "provider") return jsonError(res, 403, "هذه الصفحة مخصصة للمهنيين");
    const db = await getDb();
    if (!db) return jsonError(res, 503, "قاعدة البيانات غير متاحة حالياً");
    const request = (await db.select().from(providerVerificationRequests)
      .where(eq(providerVerificationRequests.providerId, user.id))
      .orderBy(desc(providerVerificationRequests.createdAt)).limit(1))[0];
    if (!request) return res.json({ submitted: false, status: null, documents: [] });
    const documents = await db.select().from(providerVerificationDocuments)
      .where(eq(providerVerificationDocuments.requestId, request.id));
    return res.json({
      submitted: true,
      status: request.status,
      documents: documents.map(({ objectPath, type, originalName }) => ({ objectPath, type, originalName })),
    });
  });

  app.post("/api/storage/uploads/request-url", async (req, res) => {
    const user = await currentUser(req);
    if (!user) return jsonError(res, 401, "تحتاج إلى تسجيل الدخول");
    if (user.role !== "provider") return jsonError(res, 403, "رفع المستندات متاح للمهنيين فقط");
    const body = readBody(req);
    const name = typeof body.name === "string" ? body.name : "document";
    const size = Number(body.size);
    const contentType = typeof body.contentType === "string" ? body.contentType : "";
    if (!Number.isFinite(size) || size <= 0 || size > MAX_FILE_SIZE) return jsonError(res, 400, "حجم الملف يجب ألا يتجاوز 10 ميجابايت");
    if (!allowedContentTypes.has(contentType)) return jsonError(res, 400, "يسمح بالصور أو ملفات PDF فقط");
    try {
      return res.json({ ...(await createUploadUrl(name)), contentType });
    } catch (cause) {
      console.error("[ProviderVerification] upload presign failed", cause);
      return jsonError(res, 503, "خدمة التخزين غير متاحة حالياً");
    }
  });

  app.post("/api/providers/me/verification-documents", async (req, res) => {
    const user = await currentUser(req);
    if (!user) return jsonError(res, 401, "تحتاج إلى تسجيل الدخول");
    if (user.role !== "provider") return jsonError(res, 403, "هذه الصفحة مخصصة للمهنيين");
    const body = readBody(req);
    const type = typeof body.type === "string" ? body.type : "";
    const objectPath = typeof body.objectPath === "string" ? body.objectPath : "";
    const originalName = typeof body.originalName === "string" ? body.originalName.trim().slice(0, 255) : "";
    if (!allowedTypes.has(type) || !objectPath.startsWith("provider-verification/") || !originalName) return jsonError(res, 400, "بيانات المستند غير صالحة");
    const db = await getDb();
    if (!db) return jsonError(res, 503, "قاعدة البيانات غير متاحة حالياً");
    const pending = (await db.select().from(providerVerificationRequests)
      .where(and(eq(providerVerificationRequests.providerId, user.id), eq(providerVerificationRequests.status, "pending")))
      .orderBy(desc(providerVerificationRequests.createdAt)).limit(1))[0];
    let requestId = pending?.id;
    if (!requestId) {
      const inserted = await db.insert(providerVerificationRequests).values({ providerId: user.id }).returning({ id: providerVerificationRequests.id });
      requestId = inserted[0]?.id;
    }
    if (!requestId) return jsonError(res, 500, "تعذر إنشاء طلب التوثيق");
    await db.insert(providerVerificationDocuments).values({
      requestId,
      type: type as "selfie" | "id_front" | "id_back" | "portfolio" | "certificate",
      objectPath,
      originalName,
    });
    return res.status(201).json({ success: true, requestId });
  });
}
