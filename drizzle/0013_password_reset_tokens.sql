CREATE TABLE IF NOT EXISTS "password_reset_tokens" (
  "tokenHash" varchar(128) PRIMARY KEY NOT NULL,
  "phone" varchar(320) NOT NULL,
  "expiresAt" timestamp with time zone NOT NULL,
  "attempts" integer DEFAULT 0 NOT NULL,
  "usedAt" timestamp with time zone,
  "createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "password_reset_phone_idx" ON "password_reset_tokens" ("phone");
CREATE INDEX IF NOT EXISTS "password_reset_expiry_idx" ON "password_reset_tokens" ("expiresAt");
