import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Client } from "pg";

let client: Client | undefined;

beforeAll(async () => {
  const connectionString = process.env.NEON_DATABASE_URL;
  if (!connectionString) throw new Error("NEON_DATABASE_URL is not configured");
  if (!/^postgres(?:ql)?:\/\//.test(connectionString)) throw new Error("NEON_DATABASE_URL must be a PostgreSQL connection string");
  client = new Client({ connectionString, connectionTimeoutMillis: 10000, ssl: { rejectUnauthorized: false } });
  await client.connect();
});

afterAll(async () => {
  await client?.end();
});

describe("Neon database connection", () => {
  it("connects without exposing credentials and runs a lightweight query", async () => {
    const result = await client!.query<{ connected: number }>("SELECT 1 AS connected");
    expect(result.rows[0]?.connected).toBe(1);
  });
});
