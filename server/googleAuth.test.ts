import express from "express";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { registerGoogleAuthRoutes } from "./googleAuth";

let baseUrl = "";
let server: ReturnType<import("node:http").Server>;

beforeAll(async () => {
  const app = express();
  app.use(express.json());
  registerGoogleAuthRoutes(app);
  await new Promise<void>((resolve) => {
    server = app.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (address && typeof address !== "string") baseUrl = `http://127.0.0.1:${address.port}`;
      resolve();
    });
  });
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

describe("Google client-only authentication", () => {
  it("rejects the provider role before any Google verification", async () => {
    const response = await fetch(`${baseUrl}/api/auth/google`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ role: "provider", credential: "not-used" }),
    });
    expect(response.status).toBe(403);
    expect((await response.json()).error).toBe("تسجيل الدخول بجوجل متاح لحسابات العملاء فقط");
  });

  it("requires a Google credential for clients", async () => {
    const response = await fetch(`${baseUrl}/api/auth/google`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ role: "client" }),
    });
    expect(response.status).toBe(400);
    expect((await response.json()).error).toBe("بيانات تسجيل Google غير مكتملة");
  });
});
