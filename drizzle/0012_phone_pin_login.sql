ALTER TABLE phone_users
  ADD COLUMN IF NOT EXISTS "pinHash" varchar(256),
  ADD COLUMN IF NOT EXISTS "pinSetAt" timestamptz,
  ADD COLUMN IF NOT EXISTS "pinFailedAttempts" integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "pinLockedUntil" timestamptz;
