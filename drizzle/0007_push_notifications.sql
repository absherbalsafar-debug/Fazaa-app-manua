CREATE TABLE IF NOT EXISTS push_tokens (
  id serial PRIMARY KEY,
  "userId" integer NOT NULL,
  token varchar(2048) NOT NULL UNIQUE,
  platform varchar(16) NOT NULL DEFAULT 'android',
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS push_token_user_idx ON push_tokens ("userId");

ALTER TABLE notifications ADD COLUMN IF NOT EXISTS "relatedId" integer;
