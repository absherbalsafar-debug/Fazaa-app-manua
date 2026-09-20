import express from "express";
import { describe, expect, it } from "vitest";
import { registerAppUpdateRoutes } from "./appUpdate";

describe("app update route", () => {
  it("returns the latest Android version and download information", async () => {
    const app = express();
    registerAppUpdateRoutes(app);
    const server = app.listen(0, "127.0.0.1");
    await new Promise<void>((resolve) => server.once("listening", () => resolve()));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("test server did not start");
    const response = await fetch(`http://127.0.0.1:${address.port}/api/app-version`);
    const body = await response.json() as { versionCode: number; versionName: string; downloadUrl: string; title: string };
    server.close();
    expect(response.status).toBe(200);
    expect(body.versionCode).toBeGreaterThan(0);
    expect(body.versionName).toBeTruthy();
    expect(body.downloadUrl).toContain("github.com");
    expect(body.title).toBe("هناك تحديث جديد في التطبيق");
  });
});
