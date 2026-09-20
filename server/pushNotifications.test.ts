import express from "express";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { registerPushNotificationRoutes } from "./pushNotifications";

let baseUrl = "";
let server: ReturnType<import("node:http").Server>;

beforeAll(async () => {
  const app = express();
  app.use(express.json());
  registerPushNotificationRoutes(app);
  await new Promise<void>((resolve) => {
    server = app.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (address && typeof address !== "string") baseUrl = `http://127.0.0.1:${address.port}`;
      resolve();
    });
  });
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
});

describe("FCM push token routes", () => {
  it("requires an authenticated phone session", async () => {
    const response = await fetch(`${baseUrl}/api/push-tokens`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token: "test-fcm-token-that-is-long-enough", platform: "android" }),
    });
    expect(response.status).toBe(401);
    expect((await response.json()).error).toBe("تحتاج إلى تسجيل الدخول");
  });
});
