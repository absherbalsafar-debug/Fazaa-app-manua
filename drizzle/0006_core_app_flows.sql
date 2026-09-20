DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'service_request_status') THEN
    CREATE TYPE service_request_status AS ENUM ('pending', 'accepted', 'rejected', 'in_progress', 'completed', 'cancelled');
  END IF;
END $$;

ALTER TABLE phone_users ADD COLUMN IF NOT EXISTS "isAvailable" boolean NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS service_requests (
  id serial PRIMARY KEY,
  "clientId" integer NOT NULL,
  "providerId" integer NOT NULL,
  status service_request_status NOT NULL DEFAULT 'pending',
  "serviceType" varchar(160) NOT NULL,
  description text NOT NULL,
  city varchar(120) NOT NULL,
  district varchar(120) NOT NULL DEFAULT '',
  latitude varchar(32),
  longitude varchar(32),
  "scheduledAt" timestamptz,
  "completedAt" timestamptz,
  "isImmediate" boolean NOT NULL DEFAULT true,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS service_request_client_idx ON service_requests ("clientId");
CREATE INDEX IF NOT EXISTS service_request_provider_idx ON service_requests ("providerId");
CREATE INDEX IF NOT EXISTS service_request_status_idx ON service_requests (status);

CREATE TABLE IF NOT EXISTS notifications (
  id serial PRIMARY KEY,
  "userId" integer NOT NULL,
  type varchar(64) NOT NULL,
  title varchar(180) NOT NULL,
  body text NOT NULL,
  "isRead" boolean NOT NULL DEFAULT false,
  "relatedId" integer,
  "createdAt" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS notification_user_idx ON notifications ("userId");
CREATE INDEX IF NOT EXISTS notification_read_idx ON notifications ("isRead");

CREATE TABLE IF NOT EXISTS provider_favorites (
  id serial PRIMARY KEY,
  "clientId" integer NOT NULL,
  "providerId" integer NOT NULL,
  "createdAt" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS provider_favorite_client_idx ON provider_favorites ("clientId");
CREATE UNIQUE INDEX IF NOT EXISTS provider_favorite_unique_idx ON provider_favorites ("clientId", "providerId");
