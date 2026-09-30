import type { Express, Request, Response } from "express";
import { and, desc, eq } from "drizzle-orm";
import { getDb } from "./db";
import {
  phoneUsers,
  providerVerificationDocuments,
  providerVerificationRequests,
} from "../drizzle/schema";
import { ENV } from "./_core/env";
import { storagePut } from "./storage";
import { getAuthenticatedPhoneUser } from "./phoneSession";

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
  return Boolean(contentType && new Set([
    "application/pdf", "image/jpeg", "image/png", "image/webp", "image/gif", "image/heic", "image/heif",
  ]).has(contentType));
}

function hasValidFileSignature(buffer: Buffer, contentType: string): boolean {
  if (contentType === "application/pdf") return buffer.subarray(0, 5).toString("ascii") === "%PDF-";
  if (contentType === "image/jpeg") return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (contentType === "image/png") return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (contentType === "image/gif") return buffer.subarray(0, 6).toString("ascii") === "GIF87a" || buffer.subarray(0, 6).toString("ascii") === "GIF89a";
  if (contentType === "image/webp") return buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP";
  if (contentType === "image/heic" || contentType === "image/heif") return buffer.subarray(4, 12).toString("ascii").includes("ftyp");
  return false;
}

function isStrictBase64(value: string): boolean {
  return value.length % 4 === 0 && /^[A-Za-z0-9+/]*={0,2}$/.test(value);
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
  return getAuthenticatedPhoneUser(req);
}

function storageConfig() {
  if (!ENV.forgeApiUrl || !ENV.forgeApiKey) throw new Error("Storage is not configured");
  return { url: ENV.forgeApiUrl.replace(/\/+$/, ""), key: ENV.forgeApiKey };
}

async function createUploadUrl(name: string, userId: number) {
  const { url, key } = storageConfig();
  const safeName = name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-120) || "document";
  const objectPath = `provider-verification/${userId}/${Date.now()}-${crypto.randomUUID()}-${safeName}`;
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
      rejectionReason: request.rejectionReason,
      submittedAt: request.submittedAt,
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
      return res.json({ ...(await createUploadUrl(name, user.id)), contentType });
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
    if (!allowedTypes.has(type) || !objectPath.startsWith(`provider-verification/${user.id}/`) || !originalName) return jsonError(res, 400, "بيانات المستند غير صالحة");
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
    if (!allowedTypes.has(type) || !isAllowedContentType(contentType) || !encoded || !isStrictBase64(encoded)) return jsonError(res, 400, "بيانات المستند غير صالحة");
    if (encoded.length > Math.ceil(MAX_FILE_SIZE / 3) * 4 + 4) return jsonError(res, 400, "حجم الملف يجب ألا يتجاوز 10 ميجابايت");
    const buffer = Buffer.from(encoded, "base64");
    if (!buffer.length || buffer.length > MAX_FILE_SIZE || !hasValidFileSignature(buffer, contentType)) return jsonError(res, 400, "محتوى الملف لا يطابق نوعه");
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
