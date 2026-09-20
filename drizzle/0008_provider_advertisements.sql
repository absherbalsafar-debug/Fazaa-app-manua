DO $$ BEGIN
  CREATE TYPE advertisement_plan AS ENUM ('standard', 'featured', 'homepage', 'vip');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE advertisement_status AS ENUM ('pending', 'active', 'rejected', 'expired');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS provider_advertisements (
  id serial PRIMARY KEY,
  "providerId" integer NOT NULL,
  title varchar(180) NOT NULL,
  description text NOT NULL DEFAULT '',
  city varchar(120) NOT NULL,
  district varchar(120) NOT NULL DEFAULT '',
  "targetAudience" text,
  "categoryId" integer,
  plan advertisement_plan NOT NULL,
  "durationDays" integer NOT NULL,
  budget integer NOT NULL,
  "imagePath" varchar(512),
  status advertisement_status NOT NULL DEFAULT 'pending',
  "reviewNote" text,
  "startsAt" timestamptz,
  "endsAt" timestamptz,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS provider_advertisement_provider_idx ON provider_advertisements ("providerId");
CREATE INDEX IF NOT EXISTS provider_advertisement_status_idx ON provider_advertisements (status);
