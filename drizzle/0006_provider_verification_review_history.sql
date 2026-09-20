CREATE TABLE IF NOT EXISTS provider_verification_review_history (
  id serial PRIMARY KEY,
  "requestId" integer NOT NULL,
  status verification_status NOT NULL,
  "rejectionReason" text,
  "adminOpenId" varchar(64) NOT NULL,
  "adminName" varchar(160),
  "createdAt" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS provider_verification_history_request_idx
  ON provider_verification_review_history ("requestId");
