DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'verification_decision_status') THEN
    CREATE TYPE verification_decision_status AS ENUM ('approved', 'rejected');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS provider_verification_decisions (
  id serial PRIMARY KEY,
  "requestId" integer NOT NULL,
  "adminOpenId" varchar(64) NOT NULL,
  status verification_decision_status NOT NULL,
  note text,
  "createdAt" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS provider_verification_decision_request_idx ON provider_verification_decisions ("requestId");
CREATE INDEX IF NOT EXISTS provider_verification_decision_created_idx ON provider_verification_decisions ("createdAt");
