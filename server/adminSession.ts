import type { Express, Request, Response } from "express";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { sdk } from "./_core/sdk";

export function registerAdminSessionRoutes(app: Express) {
  app.get("/api/admin/session", async (req: Request, res: Response) => {
    try {
      const user = await sdk.authenticateRequest(req);
      if (user.role !== "admin") return res.status(403).json({ error: "صلاحية الإدارة مطلوبة" });
      return res.json({
        id: user.id,
        openId: user.openId,
        name: user.name,
        email: user.email,
        role: user.role,
        status: "active",
        createdAt: user.createdAt,
      });
    } catch {
      return res.status(401).json({ error: "تحتاج إلى تسجيل الدخول عبر OAuth" });
    }
  });

  app.post("/api/admin/logout", (req: Request, res: Response) => {
    res.clearCookie(COOKIE_NAME, getSessionCookieOptions(req));
    return res.json({ success: true });
  });
}
