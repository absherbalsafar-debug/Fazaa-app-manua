import { createHash, randomUUID } from "node:crypto";
import type { Express, Request, Response } from "express";
import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { phoneAuthSessions, phoneUsers } from "../drizzle/schema";

const GOOGLE_TOKEN_INFO_URL = "https://oauth2.googleapis.com/tokeninfo";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

type GoogleTokenInfo = {
  sub?: string;
  aud?: string;
  email?: string;
  email_verified?: string | boolean;
  name?: string;
  picture?: string;
};

function jsonError(res: Response, status: number, error: string) {
  return res.status(status).json({ error });
}

function readBody(req: Request) {
  return req.body && typeof req.body === "object" ? req.body as Record<string, unknown> : {};
}

function googlePhoneId(sub: string) {
  return `g${createHash("sha256").update(sub).digest("hex").slice(0, 19)}`;
}

function toApiUser(user: typeof phoneUsers.$inferSelect) {
  return {
    id: user.id,
    name: user.name,
    phone: user.phone,
    email: user.email ?? null,
    role: user.role,
    status: user.status,
    avatarUrl: user.avatarUrl ?? null,
    phoneVerified: Boolean(user.phoneVerified),
    emailVerified: Boolean(user.emailVerified),
    city: user.city,
    country: user.country,
    governorate: user.governorate,
    district: user.district,
    latitude: user.latitude === null ? null : Number(user.latitude),
    longitude: user.longitude === null ? null : Number(user.longitude),
    nationalId: user.nationalId,
    whatsapp: user.whatsapp,
    categoryId: user.categoryId,
    specialty: user.specialty,
    bio: user.bio,
    yearsExperience: user.yearsExperience,
    providerAccountStatus: user.providerAccountStatus,
    subscriptionPlan: user.subscriptionPlan,
    subscriptionExpiresAt: user.subscriptionExpiresAt?.toISOString() ?? null,
    termsAcceptedAt: user.termsAcceptedAt?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
  };
}

async function verifyGoogleCredential(credential: string): Promise<GoogleTokenInfo | null> {
  const configuredClientId = process.env.GOOGLE_CLIENT_ID ?? process.env.VITE_GOOGLE_CLIENT_ID ?? "";
  if (!configuredClientId) throw new Error("GOOGLE_CLIENT_ID_NOT_CONFIGURED");
  const response = await fetch(`${GOOGLE_TOKEN_INFO_URL}?id_token=${encodeURIComponent(credential)}`);
  if (!response.ok) return null;
  const tokenInfo = await response.json() as GoogleTokenInfo;
  if (!tokenInfo.sub || tokenInfo.aud !== configuredClientId || !tokenInfo.email) return null;
  if (tokenInfo.email_verified !== true && tokenInfo.email_verified !== "true") return null;
  return tokenInfo;
}

export function registerGoogleAuthRoutes(app: Express) {
  app.post("/api/auth/google", async (req, res) => {
    const body = readBody(req);
    if (body.role === "provider") return jsonError(res, 403, "تسجيل الدخول بجوجل متاح لحسابات العملاء فقط");
    const credential = typeof body.credential === "string" ? body.credential : "";
    if (!credential) return jsonError(res, 400, "بيانات تسجيل Google غير مكتملة");

    let tokenInfo: GoogleTokenInfo | null;
    try {
      tokenInfo = await verifyGoogleCredential(credential);
    } catch (error) {
      if (error instanceof Error && error.message === "GOOGLE_CLIENT_ID_NOT_CONFIGURED") {
        return jsonError(res, 503, "تسجيل الدخول بجوجل غير مهيأ بعد في إعدادات المشروع");
      }
      console.error("[GoogleAuth] verification failed", error);
      return jsonError(res, 502, "تعذر التحقق من حساب Google حالياً");
    }
    if (!tokenInfo) return jsonError(res, 401, "تعذر التحقق من حساب Google");

    const db = await getDb();
    if (!db) return jsonError(res, 503, "قاعدة البيانات غير متاحة حالياً");

    let user = (await db.select().from(phoneUsers).where(eq(phoneUsers.googleId, tokenInfo.sub!)).limit(1))[0];
    if (!user) {
      const byEmail = (await db.select().from(phoneUsers).where(eq(phoneUsers.email, tokenInfo.email!)).limit(1))[0];
      if (byEmail?.role === "provider") return jsonError(res, 409, "هذا البريد مرتبط بحساب مهني، استخدم تسجيل الدخول الخاص بالمهني");
      if (byEmail) {
        user = (await db.update(phoneUsers).set({ googleId: tokenInfo.sub, avatarUrl: tokenInfo.picture ?? byEmail.avatarUrl, emailVerified: 1, updatedAt: new Date() }).where(eq(phoneUsers.id, byEmail.id)).returning())[0];
      }
    }
    if (!user) {
      user = (await db.insert(phoneUsers).values({
        phone: googlePhoneId(tokenInfo.sub!),
        name: tokenInfo.name?.trim() || tokenInfo.email!.split("@")[0],
        email: tokenInfo.email,
        googleId: tokenInfo.sub,
        avatarUrl: tokenInfo.picture ?? null,
        emailVerified: 1,
        role: "client",
        status: "active",
        phoneVerified: 1,
      }).returning())[0];
    }
    if (user.role !== "client") return jsonError(res, 403, "تسجيل الدخول بجوجل متاح لحسابات العملاء فقط");

    const sessionToken = `google_${randomUUID().replace(/-/g, "")}`;
    await db.insert(phoneAuthSessions).values({
      token: sessionToken,
      phone: user.phone,
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
    });
    return res.json({ token: sessionToken, user: toApiUser(user) });
  });
}
