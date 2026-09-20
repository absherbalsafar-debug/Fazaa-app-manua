import type { Express, Request, Response } from "express";
import { and, eq } from "drizzle-orm";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { getDb } from "./db";
import { phoneAuthSessions, phoneUsers, pushTokens } from "../drizzle/schema";

type AuthenticatedPhoneUser = typeof phoneUsers.$inferSelect;

type PushPayload = {
  title: string;
  body: string;
  type: string;
  relatedId?: number;
};

function jsonError(res: Response, status: number, error: string) {
  return res.status(status).json({ error });
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

function getFirebaseApp() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;
  try {
    const rawJson = JSON.parse(raw) as { project_id?: string; client_email?: string; private_key?: string };
    if (!rawJson.project_id || !rawJson.client_email || !rawJson.private_key) return null;
    return getApps()[0] ?? initializeApp({
      credential: cert({
        projectId: rawJson.project_id,
        clientEmail: rawJson.client_email,
        privateKey: rawJson.private_key,
      }),
    });
  } catch (error) {
    console.error("[Push] Invalid FIREBASE_SERVICE_ACCOUNT_JSON", error);
    return null;
  }
}

export async function sendPushToUser(userId: number, payload: PushPayload) {
  const db = await getDb();
  if (!db) return { sent: 0, skipped: "database-unavailable" };
  const rows = await db.select({ id: pushTokens.id, token: pushTokens.token })
    .from(pushTokens)
    .where(eq(pushTokens.userId, userId));
  if (!rows.length) return { sent: 0, skipped: "no-device-token" };
  const app = getFirebaseApp();
  if (!app) return { sent: 0, skipped: "firebase-not-configured" };

  const messaging = getMessaging(app);
  const response = await messaging.sendEachForMulticast({
    tokens: rows.map(row => row.token),
    notification: { title: payload.title, body: payload.body },
    data: {
      type: payload.type,
      ...(payload.relatedId ? { relatedId: String(payload.relatedId) } : {}),
    },
    android: {
      priority: "high",
      notification: {
        channelId: "fazaa_notifications_v2",
        sound: "fazaa_notification",
      },
    },
  });

  const invalidTokenIds = rows
    .filter((_, index) => {
      const errorCode = response.responses[index]?.error?.code ?? "";
      return errorCode.includes("registration-token-not-registered") || errorCode.includes("invalid-registration-token");
    })
    .map(row => row.id);
  await Promise.all(invalidTokenIds.map(id => db.delete(pushTokens).where(eq(pushTokens.id, id))));
  return { sent: response.successCount, failed: response.failureCount };
}

export function registerPushNotificationRoutes(app: Express) {
  app.post("/api/push-tokens", async (req, res) => {
    const user = await currentUser(req);
    if (!user) return jsonError(res, 401, "تحتاج إلى تسجيل الدخول");
    const body = readBody(req);
    const token = typeof body.token === "string" ? body.token.trim() : "";
    const platform = body.platform === "android" ? "android" : "web";
    if (token.length < 20 || token.length > 2048) return jsonError(res, 400, "رمز الإشعارات غير صالح");
    const db = await getDb();
    if (!db) return jsonError(res, 503, "قاعدة البيانات غير متاحة حالياً");
    await db.insert(pushTokens)
      .values({ userId: user.id, token, platform, updatedAt: new Date() })
      .onConflictDoUpdate({ target: pushTokens.token, set: { userId: user.id, platform, updatedAt: new Date() } });
    return res.status(201).json({ success: true });
  });

  app.delete("/api/push-tokens", async (req, res) => {
    const user = await currentUser(req);
    if (!user) return jsonError(res, 401, "تحتاج إلى تسجيل الدخول");
    const token = typeof readBody(req).token === "string" ? String(readBody(req).token).trim() : "";
    if (!token) return jsonError(res, 400, "رمز الإشعارات مطلوب");
    const db = await getDb();
    if (!db) return jsonError(res, 503, "قاعدة البيانات غير متاحة حالياً");
    await db.delete(pushTokens).where(and(eq(pushTokens.userId, user.id), eq(pushTokens.token, token)));
    return res.json({ success: true });
  });
}
