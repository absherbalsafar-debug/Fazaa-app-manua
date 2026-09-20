import { readFile } from "node:fs/promises";
import pg from "pg";

const connectionString = process.env.NEON_DATABASE_URL;
if (!connectionString) throw new Error("NEON_DATABASE_URL is not configured");
const pool = new pg.Pool({ connectionString, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 10000 });
try {
  const baseSql = await readFile(new URL("../drizzle/0004_neon_init.sql", import.meta.url), "utf8");
  const providerSql = await readFile(new URL("../drizzle/0005_provider_onboarding.sql", import.meta.url), "utf8");
  const appFlowsSql = await readFile(new URL("../drizzle/0006_core_app_flows.sql", import.meta.url), "utf8");
  const pushNotificationsSql = await readFile(new URL("../drizzle/0007_push_notifications.sql", import.meta.url), "utf8");
  await pool.query(baseSql);
  await pool.query(providerSql);
  await pool.query(appFlowsSql);
  await pool.query(pushNotificationsSql);
  const result = await pool.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name IN ('users','phone_users','phone_otp_codes','phone_auth_sessions','provider_verification_requests','provider_verification_documents','service_requests','notifications','provider_favorites','push_tokens')
    ORDER BY table_name
  `);
  console.log(`Neon migration applied; verified ${result.rows.length} tables: ${result.rows.map(row => row.table_name).join(", ")}`);
} finally {
  await pool.end();
}
