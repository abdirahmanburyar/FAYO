-- Safe migration to create FcmToken table only
-- This won't affect existing data or add constraints to other tables

-- Create the fcm_tokens table in the users schema
CREATE TABLE IF NOT EXISTS users.fcm_tokens (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  "deviceId" TEXT,
  platform TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT fcm_tokens_userId_fkey FOREIGN KEY ("userId") REFERENCES users.users(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS fcm_tokens_userId_idx ON users.fcm_tokens("userId");
CREATE INDEX IF NOT EXISTS fcm_tokens_token_idx ON users.fcm_tokens(token);

-- Add comment
COMMENT ON TABLE users.fcm_tokens IS 'Firebase Cloud Messaging tokens for push notifications';

