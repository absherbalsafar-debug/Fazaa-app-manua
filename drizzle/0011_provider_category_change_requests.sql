CREATE TABLE IF NOT EXISTS provider_category_change_requests (
  id serial PRIMARY KEY,
  "providerId" integer NOT NULL,
  "currentCategoryId" integer,
  "requestedCategoryId" integer NOT NULL,
  "currentSpecialty" varchar(160),
  "requestedSpecialty" varchar(160) NOT NULL,
  status verification_status NOT NULL DEFAULT 'pending',
  "rejectionReason" text,
  "adminOpenId" varchar(64),
  "adminName" varchar(160),
  "submittedAt" timestamptz NOT NULL DEFAULT now(),
  "reviewedAt" timestamptz,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS provider_category_change_provider_status_idx
  ON provider_category_change_requests ("providerId", status);

CREATE INDEX IF NOT EXISTS provider_category_change_status_created_idx
  ON provider_category_change_requests (status, "createdAt");

CREATE UNIQUE INDEX IF NOT EXISTS provider_category_change_one_pending_idx
  ON provider_category_change_requests ("providerId")
  WHERE status = 'pending';
