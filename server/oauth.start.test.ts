import express from "express";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { registerOAuthRoutes } from "./_core/oauth";

let baseUrl = "";
let server: ReturnType<import("node:http").Server>;

beforeAll(async () => {
  const app = express();
  registerOAuthRoutes(app);
  await new Promise<void>((resolve) => {
    server = app.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (address && typeof address !== "string") baseUrl = `http://127.0.0.1:${address.port}`;
      resolve();
    });
  });
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
});

describe("standalone control center OAuth start", () => {
  it("redirects to the OAuth portal and issues a state cookie", async () => {
    const response = await fetch(`${baseUrl}/api/oauth/start?returnTo=%2Fcontrol-center`, { redirect: "manual" });
    expect(response.status).toBe(302);
    const location = response.headers.get("location");
    expect(location).toBeTruthy();
    const portal = new URL(location!);
    expect(portal.pathname).toBe("/app-auth");
    expect(portal.searchParams.get("redirectUri")).toContain("/api/oauth/callback");
    expect(portal.searchParams.get("state")).toBeTruthy();
    expect(response.headers.get("set-cookie")).toContain("oauth_state=");
  });

  it("does not allow an external return URL", async () => {
    const response = await fetch(`${baseUrl}/api/oauth/start?returnTo=https%3A%2F%2Fevil.example`, { redirect: "manual" });
    const location = new URL(response.headers.get("location")!);
    expect(location.searchParams.get("redirectUri")).toContain("/api/oauth/callback");
    expect(location.searchParams.get("state")).toBeTruthy();
  });
});
