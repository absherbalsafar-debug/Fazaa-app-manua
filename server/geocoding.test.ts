import express from "express";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { registerGeocodingRoutes } from "./geocoding";

let baseUrl = "";
let server: ReturnType<import("node:http").Server>;

beforeAll(async () => {
  const app = express();
  registerGeocodingRoutes(app);
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

describe("reverse geocoding", () => {
  it("rejects invalid coordinates before contacting the geocoder", async () => {
    const response = await fetch(`${baseUrl}/api/geocode/reverse?lat=999&lon=44`);
    expect(response.status).toBe(400);
    expect((await response.json()).error).toBe("إحداثيات الموقع غير صالحة");
  });
});
