import { describe, expect, it } from "vitest";
import pg from "pg";

describe("password reset Neon connection", () => {
  it("connects and can read the reset-token table metadata", async () => {
    const connectionString = process.env.NEON_DATABASE_URL;
    if (!connectionString) return;
    const pool = new pg.Pool({ connectionString, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 10_000 });
    try {
      const result = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'password_reset_tokens'");
      expect(result.rows).toHaveLength(1);
    } finally {
      await pool.end();
    }
  }, 20_000);
});
