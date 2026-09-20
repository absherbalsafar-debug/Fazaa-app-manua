DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'provider_account_status') THEN
    CREATE TYPE provider_account_status AS ENUM ('pending', 'approved');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_plan') THEN
    CREATE TYPE subscription_plan AS ENUM ('monthly', 'yearly');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_payment_status') THEN
    CREATE TYPE subscription_payment_status AS ENUM ('pending', 'approved', 'rejected');
  END IF;
END $$;

ALTER TABLE phone_users ADD COLUMN IF NOT EXISTS "nationalId" varchar(11);
ALTER TABLE phone_users ADD COLUMN IF NOT EXISTS "whatsapp" varchar(9);
ALTER TABLE phone_users ADD COLUMN IF NOT EXISTS "providerAccountStatus" provider_account_status NOT NULL DEFAULT 'pending';
ALTER TABLE phone_users ADD COLUMN IF NOT EXISTS "subscriptionPlan" subscription_plan;
ALTER TABLE phone_users ADD COLUMN IF NOT EXISTS "subscriptionExpiresAt" timestamptz;
ALTER TABLE phone_users ADD COLUMN IF NOT EXISTS "termsAcceptedAt" timestamptz;

CREATE TABLE IF NOT EXISTS provider_subscription_payments (
  id serial PRIMARY KEY,
  "providerId" integer NOT NULL,
  plan subscription_plan NOT NULL,
  amount integer NOT NULL,
  status subscription_payment_status NOT NULL DEFAULT 'pending',
  "proofPath" varchar(512),
  "submittedAt" timestamptz NOT NULL DEFAULT now(),
  "reviewedAt" timestamptz,
  "createdAt" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS provider_subscription_payment_provider_idx ON provider_subscription_payments ("providerId");
CREATE INDEX IF NOT EXISTS provider_subscription_payment_status_idx ON provider_subscription_payments (status);
