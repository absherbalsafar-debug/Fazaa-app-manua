ALTER TABLE phone_users ALTER COLUMN phone TYPE varchar(320);
ALTER TABLE phone_users ADD COLUMN IF NOT EXISTS "passwordHash" varchar(255);
