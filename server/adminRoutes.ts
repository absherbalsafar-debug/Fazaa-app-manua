import type { Express, Request, Response } from "express";
import { and, desc, eq, ilike, or } from "drizzle-orm";
import { getDb } from "./db";
import { phoneUsers, providerVerificationRequests, users } from "../drizzle/schema";
import { sdk } from "./_core/sdk";

async function currentAdmin(req: Request) {
  try {
    const user = await sdk.authenticateRequest(req);
    return user?.role === "admin" ? user : null;
  } catch {
    return null;
  }
}
function deny(res: Response, status = 403) { return res.status(status).json({ error: "صلاحية الإدارة مطلوبة" }); }

export function registerAdminRoutes(app: Express) {
  app.get("/api/admin/me", async (req, res) => {
    const admin = await currentAdmin(req);
    if (!admin) return deny(res);
    return res.json({ id: admin.id, name: admin.name, email: admin.email, role: admin.role });
  });

  app.get("/api/admin/stats", async (req, res) => {
    if (!(await currentAdmin(req))) return deny(res);
    const db = await getDb();
    if (!db) return res.status(503).json({ error: "قاعدة البيانات غير متاحة حالياً" });
    const [oauthUsers, phone, verification] = await Promise.all([
      db.select({ id: users.id, role: users.role }).from(users),
      db.select({ id: phoneUsers.id, role: phoneUsers.role }).from(phoneUsers),
      db.select({ id: providerVerificationRequests.id }).from(providerVerificationRequests).where(eq(providerVerificationRequests.status, "pending")),
    ]);
    const totalProviders = phone.filter(item => item.role === "provider").length;
    const totalClients = phone.filter(item => item.role === "client").length;
    return res.json({ totalUsers: oauthUsers.length + phone.length, totalProviders, totalClients, pendingProviders: verification.length, totalRequests: null, completedRequests: null });
  });

  app.get("/api/admin/users", async (req, res) => {
    if (!(await currentAdmin(req))) return deny(res);
    const db = await getDb();
    if (!db) return res.status(503).json({ error: "قاعدة البيانات غير متاحة حالياً" });
    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
    const role = typeof req.query.role === "string" ? req.query.role : "all";
    const oauthRows = await db.select().from(users).where(and(role === "admin" ? eq(users.role, "admin") : undefined, search ? or(ilike(users.name, `%${search}%`), ilike(users.email, `%${search}%`)) : undefined)).orderBy(desc(users.createdAt));
    const phoneRows = await db.select().from(phoneUsers).where(and(role !== "all" && role !== "admin" ? eq(phoneUsers.role, role as "client" | "provider") : undefined, search ? or(ilike(phoneUsers.name, `%${search}%`), ilike(phoneUsers.phone, `%${search}%`)) : undefined)).orderBy(desc(phoneUsers.createdAt));
    const result = [
      ...oauthRows.map(user => ({ id: user.id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt, lastSignedIn: user.lastSignedIn })),
      ...phoneRows.map(user => ({ id: user.id + 1000000, name: user.name, email: null, role: user.role, createdAt: user.createdAt, lastSignedIn: user.updatedAt })),
    ];
    return res.json({ users: result, total: result.length });
  });

  app.get("/api/admin/service-stats", async (req, res) => {
    if (!(await currentAdmin(req))) return deny(res);
    // The current schema does not contain service/category tables. Return an empty
    // real-data result instead of inventing chart values.
    return res.json([]);
  });
}
