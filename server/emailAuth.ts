import { createHash, randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import type { Express, Request, Response } from "express";
import { and, eq, isNull } from "drizzle-orm";
import { getDb } from "./db";
import { passwordResetTokens, phoneAuthSessions, phoneUsers } from "../drizzle/schema";

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const RESET_TTL_MS = 15 * 60 * 1000;
const RESET_MAX_ATTEMPTS = 5;

function error(res: Response, status: number, message: string) {
  return res.status(status).json({ error: message });
}
function body(req: Request) {
  return req.body && typeof req.body === "object" ? req.body as Record<string, unknown> : {};
}
function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}
function checkPassword(password: string, stored: string | null) {
  if (!stored || !stored.includes(":")) return false;
  const [salt, hash] = stored.split(":");
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return expected.length === candidate.length && timingSafeEqual(candidate, expected);
}
function apiUser(user: typeof phoneUsers.$inferSelect) {
  return { id: user.id, name: user.name, phone: user.phone, email: user.email ?? null, role: user.role, status: user.status, avatarUrl: user.avatarUrl ?? null, phoneVerified: Boolean(user.phoneVerified), emailVerified: Boolean(user.emailVerified), city: user.city, country: user.country, governorate: user.governorate, district: user.district, latitude: user.latitude === null ? null : Number(user.latitude), longitude: user.longitude === null ? null : Number(user.longitude), nationalId: user.nationalId, whatsapp: user.whatsapp, categoryId: user.categoryId, specialty: user.specialty, bio: user.bio, yearsExperience: user.yearsExperience, providerAccountStatus: user.providerAccountStatus, subscriptionPlan: user.subscriptionPlan, subscriptionExpiresAt: user.subscriptionExpiresAt?.toISOString() ?? null, termsAcceptedAt: user.termsAcceptedAt?.toISOString() ?? null, createdAt: user.createdAt.toISOString() };
}
function syntheticPhone(email: string) { return `email:${Buffer.from(email).toString("base64url").slice(0, 300)}`; }
function hashResetToken(token: string) { return createHash("sha256").update(token).digest("hex"); }
function validEmail(value: unknown): value is string { return typeof value === "string" && /^\S+@\S+\.\S+$/.test(value.trim()); }
function validPassword(value: unknown): value is string { return typeof value === "string" && value.length >= 6 && value.length <= 128; }

export function registerEmailAuthRoutes(app: Express) {
  app.post("/api/auth/register/email", async (req, res) => {
    const input = body(req);
    const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
    const name = typeof input.name === "string" ? input.name.trim() : "";
    const password = typeof input.password === "string" ? input.password : "";
    if (!validEmail(email)) return error(res, 400, "أدخل بريدًا إلكترونيًا صحيحًا");
    if (name.split(/\s+/).filter(Boolean).length < 4) return error(res, 400, "يرجى إدخال الاسم الرباعي كاملاً");
    if (!validPassword(password)) return error(res, 400, "كلمة المرور يجب أن تتكون من 6 أحرف أو أرقام على الأقل");
    const db = await getDb();
    if (!db) return error(res, 503, "خدمة قاعدة البيانات غير متاحة حالياً");
    const existing = (await db.select().from(phoneUsers).where(eq(phoneUsers.email, email)).limit(1))[0];
    if (existing) return error(res, 409, "هذا البريد مسجل من قبل، استخدم بريدًا آخر أو سجّل الدخول");
    const phone = syntheticPhone(email);
    const created = (await db.insert(phoneUsers).values({ phone, email, passwordHash: hashPassword(password), name, role: "client", emailVerified: 0, phoneVerified: 0, providerAccountStatus: "pending" }).returning())[0];
    if (!created) return error(res, 500, "تعذر إنشاء الحساب");
    const token = `email_${randomUUID()}`;
    await db.insert(phoneAuthSessions).values({ token, phone, expiresAt: new Date(Date.now() + SESSION_TTL_MS) });
    return res.json({ token, user: apiUser(created) });
  });

  app.post("/api/auth/login/email", async (req, res) => {
    const input = body(req);
    const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
    const password = typeof input.password === "string" ? input.password : "";
    const db = await getDb();
    if (!db) return error(res, 503, "خدمة قاعدة البيانات غير متاحة حالياً");
    const user = (await db.select().from(phoneUsers).where(eq(phoneUsers.email, email)).limit(1))[0];
    if (!user || !checkPassword(password, user.passwordHash)) return error(res, 401, "البريد الإلكتروني أو كلمة المرور غير صحيحة");
    if (user.role !== "client") return error(res, 403, "تسجيل الدخول بالبريد الإلكتروني متاح للعملاء فقط");
    if (user.status !== "active") return error(res, 403, "هذا الحساب موقوف حالياً");
    const token = `email_${randomUUID()}`;
    await db.insert(phoneAuthSessions).values({ token, phone: user.phone, expiresAt: new Date(Date.now() + SESSION_TTL_MS) });
    return res.json({ token, user: apiUser(user) });
  });

  app.post("/api/auth/forgot-password", async (req, res) => {
    const input = body(req);
    const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
    if (!validEmail(email)) return error(res, 400, "أدخل بريدًا إلكترونيًا صحيحًا");
    const db = await getDb();
    if (!db) return error(res, 503, "خدمة قاعدة البيانات غير متاحة حالياً");
    const user = (await db.select().from(phoneUsers).where(and(eq(phoneUsers.email, email), eq(phoneUsers.role, "client"))).limit(1))[0];
    const response: { success: true; message: string; resetToken?: string; expiresInSeconds: number } = { success: true, message: "إذا كان البريد مسجلاً ستصلك تعليمات الاستعادة", expiresInSeconds: RESET_TTL_MS / 1000 };
    if (!user) return res.json(response);
    const rawToken = randomBytes(32).toString("hex");
    await db.insert(passwordResetTokens).values({ tokenHash: hashResetToken(rawToken), phone: user.phone, expiresAt: new Date(Date.now() + RESET_TTL_MS), attempts: 0 });
    // Until an SMTP/SMS provider is configured, expose the one-time token only in development.
    if (process.env.NODE_ENV !== "production") response.resetToken = rawToken;
    return res.json(response);
  });

  app.post("/api/auth/reset-password", async (req, res) => {
    const input = body(req);
    const token = typeof input.token === "string" ? input.token.trim() : "";
    const password = input.password;
    if (!/^[a-f0-9]{64}$/i.test(token)) return error(res, 400, "رمز الاستعادة غير صحيح أو منتهي الصلاحية");
    if (!validPassword(password)) return error(res, 400, "كلمة المرور يجب أن تتكون من 6 أحرف أو أرقام على الأقل");
    const db = await getDb();
    if (!db) return error(res, 503, "خدمة قاعدة البيانات غير متاحة حالياً");
    const tokenHash = hashResetToken(token);
    const record = (await db.select().from(passwordResetTokens).where(and(eq(passwordResetTokens.tokenHash, tokenHash), isNull(passwordResetTokens.usedAt))).limit(1))[0];
    if (!record || record.expiresAt.getTime() <= Date.now()) return error(res, 400, "رمز الاستعادة غير صحيح أو منتهي الصلاحية");
    if (record.attempts >= RESET_MAX_ATTEMPTS) return error(res, 429, "تجاوزت عدد المحاولات. اطلب رمز استعادة جديداً");
    const user = (await db.select().from(phoneUsers).where(and(eq(phoneUsers.phone, record.phone), eq(phoneUsers.role, "client"))).limit(1))[0];
    if (!user) return error(res, 400, "لا يمكن استعادة هذا الحساب");
    await db.update(phoneUsers).set({ passwordHash: hashPassword(password), updatedAt: new Date() }).where(eq(phoneUsers.phone, user.phone));
    await db.update(passwordResetTokens).set({ usedAt: new Date() }).where(eq(passwordResetTokens.tokenHash, tokenHash));
    return res.json({ success: true, message: "تم تغيير كلمة المرور بنجاح" });
  });
}
