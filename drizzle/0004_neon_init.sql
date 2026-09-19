DO $$ BEGIN CREATE TYPE "user_role" AS ENUM ('user', 'admin'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "phone_role" AS ENUM ('client', 'provider'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "phone_status" AS ENUM ('active', 'suspended'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "verification_status" AS ENUM ('pending', 'approved', 'rejected'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "document_type" AS ENUM ('selfie', 'id_front', 'id_back', 'portfolio', 'certificate'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "users" (
  "id" serial PRIMARY KEY,
  "openId" varchar(64) NOT NULL UNIQUE,
  "name" text,
  "email" varchar(320),
  "loginMethod" varchar(64),
  "role" "user_role" NOT NULL DEFAULT 'user',
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  "lastSignedIn" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "phone_users" (
  "id" serial PRIMARY KEY,
  "phone" varchar(20) NOT NULL UNIQUE,
  "name" varchar(160) NOT NULL,
  "role" "phone_role" NOT NULL DEFAULT 'client',
  "status" "phone_status" NOT NULL DEFAULT 'active',
  "city" varchar(120),
  "country" varchar(120),
  "governorate" varchar(120),
  "district" varchar(120),
  "latitude" varchar(32),
  "longitude" varchar(32),
  "categoryId" integer,
  "specialty" varchar(160),
  "bio" text,
  "yearsExperience" integer,
  "phoneVerified" integer NOT NULL DEFAULT 1,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE "phone_users" ADD COLUMN IF NOT EXISTS "categoryId" integer;
ALTER TABLE "phone_users" ADD COLUMN IF NOT EXISTS "specialty" varchar(160);
ALTER TABLE "phone_users" ADD COLUMN IF NOT EXISTS "bio" text;
ALTER TABLE "phone_users" ADD COLUMN IF NOT EXISTS "yearsExperience" integer;

CREATE TABLE IF NOT EXISTS "phone_otp_codes" (
  "phone" varchar(20) PRIMARY KEY,
  "codeHash" varchar(128) NOT NULL,
  "expiresAt" timestamptz NOT NULL,
  "attempts" integer NOT NULL DEFAULT 0,
  "createdAt" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "phone_otp_expires_idx" ON "phone_otp_codes" ("expiresAt");

CREATE TABLE IF NOT EXISTS "phone_auth_sessions" (
  "token" varchar(128) PRIMARY KEY,
  "phone" varchar(20) NOT NULL,
  "expiresAt" timestamptz NOT NULL,
  "createdAt" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "phone_session_phone_idx" ON "phone_auth_sessions" ("phone");
CREATE INDEX IF NOT EXISTS "phone_session_expires_idx" ON "phone_auth_sessions" ("expiresAt");

CREATE TABLE IF NOT EXISTS "provider_verification_requests" (
  "id" serial PRIMARY KEY,
  "providerId" integer NOT NULL,
  "status" "verification_status" NOT NULL DEFAULT 'pending',
  "rejectionReason" text,
  "submittedAt" timestamptz NOT NULL DEFAULT now(),
  "reviewedAt" timestamptz,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "provider_verification_provider_idx" ON "provider_verification_requests" ("providerId");
CREATE INDEX IF NOT EXISTS "provider_verification_status_idx" ON "provider_verification_requests" ("status");

CREATE TABLE IF NOT EXISTS "provider_verification_documents" (
  "id" serial PRIMARY KEY,
  "requestId" integer NOT NULL,
  "type" "document_type" NOT NULL,
  "objectPath" varchar(512) NOT NULL,
  "originalName" varchar(255) NOT NULL,
  "createdAt" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "provider_verification_document_request_idx" ON "provider_verification_documents" ("requestId");
