import { COOKIE_NAME, ONE_YEAR_MS, OAUTH_STATE_COOKIE, decodeOAuthState, encodeOAuthState } from "@shared/const";
import { parse as parseCookieHeader } from "cookie";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { ENV } from "./env";
import { randomUUID } from "node:crypto";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerOAuthRoutes(app: Express) {
  app.get("/api/oauth/start", (req: Request, res: Response) => {
    const returnTo = getQueryParam(req, "returnTo") || "/";
    const allowed = (process.env.CONTROL_CENTER_ORIGIN ?? "").split(",").map(value => value.trim()).filter(Boolean);
    let safeReturnTo = "/";
    try {
      const parsed = new URL(returnTo, `${req.protocol}://${req.get("host")}`);
      if (parsed.origin === `${req.protocol}://${req.get("host")}` || allowed.includes(parsed.origin)) safeReturnTo = parsed.toString();
    } catch { safeReturnTo = "/"; }
    const nonce = randomUUID();
    const redirectUri = `${req.protocol}://${req.get("host")}/api/oauth/callback`;
    const state = encodeOAuthState({ redirectUri, nonce, returnTo: safeReturnTo });
    res.cookie(OAUTH_STATE_COOKIE, nonce, { path: "/", maxAge: 10 * 60 * 1000, secure: true, sameSite: "none" });
    const portal = new URL(`${ENV.oAuthServerUrl.replace(/\/$/, "")}/app-auth`);
    portal.searchParams.set("appId", ENV.appId);
    portal.searchParams.set("redirectUri", redirectUri);
    portal.searchParams.set("state", state);
    portal.searchParams.set("type", "signIn");
    return res.redirect(302, portal.toString());
  });

  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    // CSRF guard: the nonce in `state` must match the one-time cookie that
    // startLogin set in the browser that began this login. An attacker can
    // forge `state`, but cannot plant this cookie in the victim's browser.
    const { nonce, returnTo } = decodeOAuthState(state);
    const expectedNonce = parseCookieHeader(req.headers.cookie ?? "")[OAUTH_STATE_COOKIE];
    if (!nonce || nonce !== expectedNonce) {
      res.status(403).json({ error: "invalid oauth state" });
      return;
    }
    res.clearCookie(OAUTH_STATE_COOKIE, { path: "/", secure: true, sameSite: "none" });

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.redirect(302, returnTo || "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}
