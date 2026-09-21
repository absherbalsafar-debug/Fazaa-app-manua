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
import { storagePut } from "./storage";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const allowedTypes = new Set(["selfie", "id_front", "id_back", "portfolio", "certificate"]);

function inferContentType(originalName: string): string | null {
  const extension = originalName.trim().toLowerCase().split(".").pop() ?? "";
  const types: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    jfif: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    gif: "image/gif",
    heic: "image/heic",
    heif: "image/heif",
    pdf: "application/pdf",
  };
  return types[extension] ?? null;
}

function normalizeContentType(contentType: string, originalName: string): string | null {
  const normalized = contentType.trim().toLowerCase();
  if (normalized === "image/jpg") return "image/jpeg";
  if (!normalized || normalized === "application/octet-stream") return inferContentType(originalName);
  return normalized;
}

function isAllowedContentType(contentType: string | null): contentType is string {
  return Boolean(contentType && (contentType === "application/pdf" || contentType.startsWith("image/")));
}

async function storagePutWithRetry(key: string, buffer: Buffer, contentType: string) {
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      return await storagePut(key, buffer, contentType);
    } catch (error) {
      lastError = error;
      if (attempt === 0) await new Promise(resolve => setTimeout(resolve, 350));
    }
  }
  throw lastError instanceof Error ? lastError : new Error("storage upload failed");
}

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
    const contentType = normalizeContentType(typeof body.contentType === "string" ? body.contentType : "", name);
    if (!Number.isFinite(size) || size <= 0 || size > MAX_FILE_SIZE) return jsonError(res, 400, "حجم الملف يجب ألا يتجاوز 10 ميجابايت");
    if (!isAllowedContentType(contentType)) return jsonError(res, 400, "يسمح بالصور أو ملفات PDF فقط");
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

  app.post("/api/providers/me/verification-documents/base64", async (req, res) => {
    const user = await currentUser(req);
    if (!user) return jsonError(res, 401, "تحتاج إلى تسجيل الدخول");
    if (user.role !== "provider") return jsonError(res, 403, "هذه الصفحة مخصصة للمهنيين");
    const body = readBody(req);
    const type = typeof body.type === "string" ? body.type : "";
    const originalName = typeof body.originalName === "string" ? body.originalName.trim().slice(0, 255) : "document.jpg";
    const contentType = normalizeContentType(typeof body.contentType === "string" ? body.contentType : "", originalName) ?? "image/jpeg";
    const encoded = typeof body.dataBase64 === "string" ? body.dataBase64.replace(/^data:[^;]+;base64,/, "") : "";
    if (!allowedTypes.has(type) || !isAllowedContentType(contentType) || !encoded) return jsonError(res, 400, "بيانات المستند غير صالحة");
    const buffer = Buffer.from(encoded, "base64");
    if (!buffer.length || buffer.length > MAX_FILE_SIZE) return jsonError(res, 400, "حجم الملف يجب ألا يتجاوز 10 ميجابايت");
    const db = await getDb();
    if (!db) return jsonError(res, 503, "قاعدة البيانات غير متاحة حالياً");
    try {
      const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-120) || `${type}.jpg`;
      const uploaded = await storagePutWithRetry(`provider-verification/${type}-${safeName}`, buffer, contentType);
      const pending = (await db.select().from(providerVerificationRequests)
        .where(and(eq(providerVerificationRequests.providerId, user.id), eq(providerVerificationRequests.status, "pending")))
        .orderBy(desc(providerVerificationRequests.createdAt)).limit(1))[0];
      let requestId = pending?.id;
      if (!requestId) requestId = (await db.insert(providerVerificationRequests).values({ providerId: user.id }).returning({ id: providerVerificationRequests.id }))[0]?.id;
      if (!requestId) return jsonError(res, 500, "تعذر إنشاء طلب التوثيق");
      await db.insert(providerVerificationDocuments).values({ requestId, type: type as "selfie" | "id_front" | "id_back" | "portfolio" | "certificate", objectPath: uploaded.key, originalName });
      return res.status(201).json({ success: true, requestId, objectPath: uploaded.key });
    } catch (cause) {
      console.error("[ProviderVerification] base64 upload failed", {
        type,
        contentType,
        originalName,
        bytes: buffer.length,
        error: cause instanceof Error ? cause.message : cause,
      });
      return jsonError(res, 503, "تعذر رفع المستند حالياً");
    }
  });
}
