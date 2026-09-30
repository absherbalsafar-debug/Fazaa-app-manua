import type { Request } from "express";
import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { phoneAuthSessions, phoneUsers } from "../drizzle/schema";

export async function getAuthenticatedPhoneUser(req: Request) {
  const authorization = req.headers.authorization ?? "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
  if (!token) return null;

  const db = await getDb();
  if (!db) return null;
  const session = (await db.select().from(phoneAuthSessions)
    .where(eq(phoneAuthSessions.token, token)).limit(1))[0];
  if (!session || session.expiresAt.getTime() <= Date.now()) return null;

  const user = (await db.select().from(phoneUsers)
    .where(eq(phoneUsers.phone, session.phone)).limit(1))[0];
  if (!user || user.status !== "active") return null;
  return user;
}
