import express from "express";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import pg from "pg";
import { registerProviderCatalogRoutes } from "./providerCatalog";

const phone = `+9677${String(Date.now()).slice(-8)}`;
let pool: pg.Pool;
let server: ReturnType<import("node:http").Server>;
let baseUrl = "";
const neonConfigured = Boolean(process.env.NEON_DATABASE_URL);

beforeAll(async () => {
  const connectionString = process.env.NEON_DATABASE_URL;
  if (!connectionString) return;
  pool = new pg.Pool({ connectionString, ssl: { rejectUnauthorized: false } });
  const provider = await pool.query<{ id: number }>(
    `INSERT INTO phone_users (phone, name, role, status, city, "categoryId", specialty, bio, "yearsExperience", "providerAccountStatus", "subscriptionPlan", "subscriptionExpiresAt")
     VALUES ($1, $2, 'provider', 'active', $3, $4, $5, $6, $7, 'approved', 'monthly', now() + interval '30 days') RETURNING id`,
    [phone, "مهني اختبار Neon", "صنعاء", 1, "تمديدات", "مهني لاختبار كتالوج فزعة", 7],
  );
  await pool.query(
    `INSERT INTO provider_verification_requests ("providerId", status) VALUES ($1, 'approved')`,
    [provider.rows[0].id],
  );
  const app = express();
  app.use(express.json());
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
  if (!pool) return;
  await pool.query(`DELETE FROM provider_verification_requests WHERE "providerId" IN (SELECT id FROM phone_users WHERE phone = $1)`, [phone]);
  await pool.query(`DELETE FROM phone_users WHERE phone = $1`, [phone]);
  await pool.end();
  if (server) await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

describe.skipIf(!neonConfigured)("provider catalog Neon integration", () => {
  it("returns a saved provider and filters by category and specialty", async () => {
    const response = await fetch(`${baseUrl}/api/providers?categoryId=1&specialty=%D8%AA%D9%85%D8%AF%D9%8A%D8%AF%D8%A7%D8%AA&search=%D8%AA%D9%85%D8%AF%D9%8A%D8%AF%D8%A7%D8%AA`);
    expect(response.status).toBe(200);
    const body = await response.json() as { providers: Array<{ phone: string; categoryId: number; specialty: string; yearsExperience: number }> };
    expect(body.providers).toEqual(expect.arrayContaining([
      expect.objectContaining({ phone, categoryId: 1, specialty: "تمديدات", yearsExperience: 7 }),
    ]));
  });

  it("returns provider details, an empty review state, and contact success", async () => {
    const listResponse = await fetch(`${baseUrl}/api/providers?search=${encodeURIComponent("مهني اختبار Neon")}`);
    const listBody = await listResponse.json() as { providers: Array<{ id: number; phone: string }> };
    const provider = listBody.providers.find(item => item.phone === phone);
    expect(provider).toBeDefined();
    const details = await fetch(`${baseUrl}/api/providers/${provider!.id}`);
    expect(details.status).toBe(200);
    expect((await details.json()) as { phone: string; whatsapp: string }).toEqual(expect.objectContaining({ phone, whatsapp: phone }));
    const reviews = await fetch(`${baseUrl}/api/providers/${provider!.id}/reviews`);
    expect(reviews.status).toBe(200);
    expect(await reviews.json()).toEqual([]);
    const contact = await fetch(`${baseUrl}/api/providers/${provider!.id}/contact-click`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ kind: "whatsapp" }),
    });
    expect(contact.status).toBe(200);
  });
});
