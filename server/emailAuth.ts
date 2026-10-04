import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import type { Express, Request, Response } from "express";
import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { phoneAuthSessions, phoneUsers } from "../drizzle/schema";

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
function error(res: Response, status: number, message: string) { return res.status(status).json({ error: message }); }
function body(req: Request) { return req.body && typeof req.body === "object" ? req.body as Record<string, unknown> : {}; }
function hashPassword(password: string) { const salt = randomBytes(16).toString("hex"); return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`; }
function checkPassword(password: string, stored: string | null) {
  if (!stored || !stored.includes(":")) return false;
  const [salt, hash] = stored.split(":"); const candidate = scryptSync(password, salt, 64); const expected = Buffer.from(hash, "hex");
  return expected.length === candidate.length && timingSafeEqual(candidate, expected);
}
function apiUser(user: typeof phoneUsers.$inferSelect) {
  return { id: user.id, name: user.name, phone: user.phone, email: user.email ?? null, role: user.role, status: user.status, avatarUrl: user.avatarUrl ?? null, phoneVerified: Boolean(user.phoneVerified), emailVerified: Boolean(user.emailVerified), city: user.city, country: user.country, governorate: user.governorate, district: user.district, latitude: user.latitude === null ? null : Number(user.latitude), longitude: user.longitude === null ? null : Number(user.longitude), nationalId: user.nationalId, whatsapp: user.whatsapp, categoryId: user.categoryId, specialty: user.specialty, bio: user.bio, yearsExperience: user.yearsExperience, providerAccountStatus: user.providerAccountStatus, subscriptionPlan: user.subscriptionPlan, subscriptionExpiresAt: user.subscriptionExpiresAt?.toISOString() ?? null, termsAcceptedAt: user.termsAcceptedAt?.toISOString() ?? null, createdAt: user.createdAt.toISOString() };
}
function syntheticPhone(email: string) { return `email:${Buffer.from(email).toString("base64url").slice(0, 300)}`; }

export function registerEmailAuthRoutes(app: Express) {
  app.post("/api/auth/register/email", async (req, res) => {
    const input = body(req); const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : ""; const name = typeof input.name === "string" ? input.name.trim() : ""; const password = typeof input.password === "string" ? input.password : "";
    if (!/^\S+@\S+\.\S+$/.test(email)) return error(res, 400, "أدخل بريدًا إلكترونيًا صحيحًا");
    if (name.split(/\s+/).filter(Boolean).length < 4) return error(res, 400, "يرجى إدخال الاسم الرباعي كاملاً");
    if (password.length < 6) return error(res, 400, "كلمة المرور يجب أن تتكون من 6 أحرف أو أرقام على الأقل");
    const db = await getDb(); if (!db) return error(res, 503, "خدمة قاعدة البيانات غير متاحة حالياً");
    const existing = (await db.select().from(phoneUsers).where(eq(phoneUsers.email, email)).limit(1))[0]; if (existing) return error(res, 409, "هذا البريد مسجل من قبل، استخدم بريدًا آخر أو سجّل الدخول");
    const phone = syntheticPhone(email); const created = (await db.insert(phoneUsers).values({ phone, email, passwordHash: hashPassword(password), name, role: "client", emailVerified: 0, phoneVerified: 0, providerAccountStatus: "pending" }).returning())[0];
    if (!created) return error(res, 500, "تعذر إنشاء الحساب");
    const token = `email_${randomUUID()}`; await db.insert(phoneAuthSessions).values({ token, phone, expiresAt: new Date(Date.now() + SESSION_TTL_MS) }); return res.json({ token, user: apiUser(created) });
  });

  app.post("/api/auth/login/email", async (req, res) => {
    const input = body(req); const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : ""; const password = typeof input.password === "string" ? input.password : ""; const db = await getDb(); if (!db) return error(res, 503, "خدمة قاعدة البيانات غير متاحة حالياً");
    const user = (await db.select().from(phoneUsers).where(eq(phoneUsers.email, email)).limit(1))[0]; if (!user || !checkPassword(password, user.passwordHash)) return error(res, 401, "البريد الإلكتروني أو كلمة المرور غير صحيحة"); if (user.status !== "active") return error(res, 403, "هذا الحساب موقوف حالياً");
    const token = `email_${randomUUID()}`; await db.insert(phoneAuthSessions).values({ token, phone: user.phone, expiresAt: new Date(Date.now() + SESSION_TTL_MS) }); return res.json({ token, user: apiUser(user) });
  });
}
