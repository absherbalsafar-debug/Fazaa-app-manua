import express from "express";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { registerProviderCatalogRoutes } from "./providerCatalog";

let baseUrl = "";
let server: ReturnType<import("node:http").Server>;

beforeAll(async () => {
  const app = express();
  registerProviderCatalogRoutes(app);
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

describe("provider catalog routes", () => {
  it("returns JSON categories and an empty provider page instead of the SPA HTML fallback", async () => {
    const categories = await fetch(`${baseUrl}/api/categories`);
    expect(categories.status).toBe(200);
    expect(categories.headers.get("content-type")).toContain("application/json");
    expect(Array.isArray(await categories.json())).toBe(true);

    const providers = await fetch(`${baseUrl}/api/providers?page=2&limit=10`);
    expect(providers.status).toBe(200);
    expect(providers.headers.get("content-type")).toContain("application/json");
    expect(await providers.json()).toEqual({ providers: [], total: 0, page: 2, limit: 10 });
  });
});
