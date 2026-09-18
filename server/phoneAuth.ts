import { createHash, randomUUID } from "node:crypto";
import type { Express, Request, Response } from "express";
import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { phoneAuthSessions, phoneOtpCodes, phoneUsers } from "../drizzle/schema";

type RegistrationRole = "client" | "provider";
type PhoneUser = {
  id: number;
  name: string;
  phone: string;
  email: null;
  role: RegistrationRole;
  status: "active" | "suspended";
  avatarUrl: null;
  phoneVerified: boolean;
  emailVerified: false;
  city: string | null;
  country: string | null;
  governorate: string | null;
  district: string | null;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
};
type OtpRecord = { codeHash: string; expiresAt: number; attempts: number };

// Local-only fallback used by unit tests when DATABASE_URL is intentionally absent.
const localOtpRecords = new Map<string, OtpRecord>();
const localUsers = new Map<string, PhoneUser>();
const localSessions = new Map<string, { user: PhoneUser; expiresAt: number }>();

const OTP_TTL_MS = 10 * 60 * 1000;
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export function normalizePhone(value: string): string {
  const compact = value.trim().replace(/[\s()-]/g, "");
  if (compact.startsWith("00")) return `+${compact.slice(2)}`;
  if (compact.startsWith("+")) return compact;
  if (/^7\d{8}$/.test(compact)) return `+967${compact}`;
  return `+${compact}`;
}

function hashCode(code: string) {
  return createHash("sha256").update(code).digest("hex");
}

function jsonError(res: Response, status: number, error: string) {
  return res.status(status).json({ error });
}

function readBody(req: Request): Record<string, unknown> {
  return req.body && typeof req.body === "object" ? req.body as Record<string, unknown> : {};
}

function toApiUser(user: typeof phoneUsers.$inferSelect): PhoneUser {
  return {
    id: user.id,
    name: user.name,
    phone: user.phone,
    email: null,
    role: user.role,
    status: user.status,
    avatarUrl: null,
    phoneVerified: Boolean(user.phoneVerified),
    emailVerified: false,
    city: user.city,
    country: user.country,
    governorate: user.governorate,
    district: user.district,
    latitude: user.latitude === null ? null : Number(user.latitude),
    longitude: user.longitude === null ? null : Number(user.longitude),
    createdAt: user.createdAt.toISOString(),
  };
}

function isTestFallback() {
  return process.env.NODE_ENV === "test" && process.env.PHONE_AUTH_USE_DB !== "true";
}

async function getAuthDb() {
  return isTestFallback() ? null : getDb();
}

export function registerPhoneAuthRoutes(app: Express) {
  app.post("/api/auth/send-otp", async (req, res) => {
    const body = readBody(req);
    const rawPhone = typeof body.phone === "string" ? body.phone : "";
    const phone = normalizePhone(rawPhone);
    if (!/^\+\d{8,15}$/.test(phone)) return jsonError(res, 400, "أدخل رقم هاتف صحيحاً");

    const code = "123456";
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);
    const codeHash = hashCode(code);
    const db = await getAuthDb();

    if (db) {
      await db.insert(phoneOtpCodes).values({ phone, codeHash, expiresAt, attempts: 0 }).onDuplicateKeyUpdate({
        set: { codeHash, expiresAt, attempts: 0 },
      });
    } else if (isTestFallback()) {
      localOtpRecords.set(phone, { codeHash, expiresAt: expiresAt.getTime(), attempts: 0 });
    } else {
      return jsonError(res, 503, "خدمة قاعدة البيانات غير متاحة حالياً");
    }

    return res.json({
      success: true,
      phone,
      expiresInSeconds: OTP_TTL_MS / 1000,
      // Replace with a real SMS provider before production launch.
      otp: code,
    });
  });

  app.post("/api/auth/verify-otp", async (req, res) => {
    const body = readBody(req);
    const rawPhone = typeof body.phone === "string" ? body.phone : "";
    const phone = normalizePhone(rawPhone);
    const code = typeof body.code === "string" ? body.code.trim() : "";
    const db = await getAuthDb();
    let valid = false;

    if (db) {
      const rows = await db.select().from(phoneOtpCodes).where(eq(phoneOtpCodes.phone, phone)).limit(1);
      const record = rows[0];
      if (!record || record.expiresAt.getTime() <= Date.now()) return jsonError(res, 400, "انتهت صلاحية الرمز. أرسل رمزاً جديداً");
      if (record.attempts >= 5) return jsonError(res, 429, "تجاوزت عدد المحاولات. أرسل رمزاً جديداً");
      valid = /^\d{6}$/.test(code) && hashCode(code) === record.codeHash;
      if (!valid) {
        await db.update(phoneOtpCodes).set({ attempts: record.attempts + 1 }).where(eq(phoneOtpCodes.phone, phone));
        return jsonError(res, 400, "رمز التحقق غير صحيح");
      }
    } else if (isTestFallback()) {
      const record = localOtpRecords.get(phone);
      if (!record || record.expiresAt <= Date.now()) return jsonError(res, 400, "انتهت صلاحية الرمز. أرسل رمزاً جديداً");
      if (record.attempts >= 5) return jsonError(res, 429, "تجاوزت عدد المحاولات. أرسل رمزاً جديداً");
      valid = /^\d{6}$/.test(code) && hashCode(code) === record.codeHash;
      if (!valid) {
        record.attempts += 1;
        return jsonError(res, 400, "رمز التحقق غير صحيح");
      }
    } else {
      return jsonError(res, 503, "خدمة قاعدة البيانات غير متاحة حالياً");
    }

    if (!valid) return jsonError(res, 400, "رمز التحقق غير صحيح");

    let user: PhoneUser | undefined;
    if (db) {
      const existing = (await db.select().from(phoneUsers).where(eq(phoneUsers.phone, phone)).limit(1))[0];
      if (!existing && typeof body.name !== "string") return res.json({ needsRegistration: true });
      const role: RegistrationRole = body.role === "provider" ? "provider" : "client";
      const nameParts = typeof body.name === "string" ? body.name.trim().split(/\s+/).filter(Boolean) : [];
      const latitude = typeof body.latitude === "number" ? body.latitude : Number(body.latitude);
      const longitude = typeof body.longitude === "number" ? body.longitude : Number(body.longitude);
      if (!existing && role === "client" && nameParts.length < 4) {
        return jsonError(res, 400, "يرجى إدخال الاسم الرباعي كاملاً");
      }
      if (!existing && role === "client" && (!Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180)) {
        return jsonError(res, 400, "يجب تحديد موقعك للعثور على المهنيين القريبين منك");
      }
      if (existing) {
        user = toApiUser(existing);
      } else {
        await db.insert(phoneUsers).values({
          phone,
          name: typeof body.name === "string" && body.name.trim() ? body.name.trim() : "مستخدم فزعة",
          role,
          city: typeof body.city === "string" ? body.city : null,
          country: typeof body.country === "string" ? body.country : null,
          governorate: typeof body.governorate === "string" ? body.governorate : null,
          district: typeof body.district === "string" ? body.district : null,
          latitude: Number.isFinite(latitude) ? String(latitude) : null,
          longitude: Number.isFinite(longitude) ? String(longitude) : null,
          phoneVerified: 1,
        });
        const created = (await db.select().from(phoneUsers).where(eq(phoneUsers.phone, phone)).limit(1))[0];
        if (!created) return jsonError(res, 500, "تعذر إنشاء حساب المستخدم");
        user = toApiUser(created);
      }
    } else {
      const existing = localUsers.get(phone);
      const role: RegistrationRole = body.role === "provider" ? "provider" : "client";
      const nameParts = typeof body.name === "string" ? body.name.trim().split(/\s+/).filter(Boolean) : [];
      const latitude = Number(body.latitude);
      const longitude = Number(body.longitude);
      if (!existing && typeof body.name !== "string") return res.json({ needsRegistration: true });
      if (!existing && role === "client" && nameParts.length < 4) return jsonError(res, 400, "يرجى إدخال الاسم الرباعي كاملاً");
      if (!existing && role === "client" && (!Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180)) {
        return jsonError(res, 400, "يجب تحديد موقعك للعثور على المهنيين القريبين منك");
      }
      user = existing ?? {
        id: localUsers.size + 1,
        name: typeof body.name === "string" && body.name.trim() ? body.name.trim() : "مستخدم فزعة",
        phone,
        email: null,
        role,
        status: "active",
        avatarUrl: null,
        phoneVerified: true,
        emailVerified: false,
        city: typeof body.city === "string" ? body.city : null,
        country: typeof body.country === "string" ? body.country : null,
        governorate: typeof body.governorate === "string" ? body.governorate : null,
        district: typeof body.district === "string" ? body.district : null,
        latitude: Number.isFinite(Number(body.latitude)) ? Number(body.latitude) : null,
        longitude: Number.isFinite(Number(body.longitude)) ? Number(body.longitude) : null,
        createdAt: new Date().toISOString(),
      };
      localUsers.set(phone, user);
    }

    if (!user) return jsonError(res, 500, "تعذر تجهيز حساب المستخدم");
    if (db) await db.delete(phoneOtpCodes).where(eq(phoneOtpCodes.phone, phone));
    else localOtpRecords.delete(phone);
    const token = `phone_${randomUUID()}`;
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
    if (db) {
      await db.insert(phoneAuthSessions).values({ token, phone, expiresAt });
    } else {
      localSessions.set(token, { user, expiresAt: expiresAt.getTime() });
    }
    return res.json({ token, user, needsRegistration: false });
  });

  app.get("/api/auth/me", async (req, res) => {
    const header = req.headers.authorization ?? "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";
    const db = await getAuthDb();
    if (db) {
      const session = (await db.select().from(phoneAuthSessions).where(eq(phoneAuthSessions.token, token)).limit(1))[0];
      if (!session || session.expiresAt.getTime() <= Date.now()) return jsonError(res, 401, "تحتاج إلى تسجيل الدخول");
      const user = (await db.select().from(phoneUsers).where(eq(phoneUsers.phone, session.phone)).limit(1))[0];
      if (!user) return jsonError(res, 401, "المستخدم غير موجود");
      return res.json(toApiUser(user));
    }
    const session = localSessions.get(token);
    if (!session || session.expiresAt <= Date.now()) return jsonError(res, 401, "تحتاج إلى تسجيل الدخول");
    return res.json(session.user);
  });

  app.post("/api/auth/logout-all", async (req, res) => {
    const header = req.headers.authorization ?? "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";
    const db = await getAuthDb();
    if (db) await db.delete(phoneAuthSessions).where(eq(phoneAuthSessions.token, token));
    else localSessions.delete(token);
    return res.json({ success: true });
  });
}
