ALTER TABLE phone_users ADD COLUMN IF NOT EXISTS email varchar(320);
ALTER TABLE phone_users ADD COLUMN IF NOT EXISTS "googleId" varchar(255);
ALTER TABLE phone_users ADD COLUMN IF NOT EXISTS "avatarUrl" varchar(512);
ALTER TABLE phone_users ADD COLUMN IF NOT EXISTS "emailVerified" integer NOT NULL DEFAULT 0;
CREATE UNIQUE INDEX IF NOT EXISTS phone_users_google_id_unique_idx ON phone_users ("googleId") WHERE "googleId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS phone_users_email_idx ON phone_users (email);
