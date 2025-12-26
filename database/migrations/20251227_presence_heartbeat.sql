-- Migration: Add connection tracking and heartbeat timeout to user_presence
-- Date: 2025-12-27
-- Description: Adds connection_id field and creates functions for automatic presence expiration

-- Step 1: Add connection_id column to user_presence table
ALTER TABLE user_presence
ADD COLUMN IF NOT EXISTS connection_id TEXT;

-- Step 2: Create or replace the update_user_presence function with connection tracking
CREATE OR REPLACE FUNCTION update_user_presence(
  p_user_id UUID,
  p_online BOOLEAN,
  p_connection_id TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  INSERT INTO user_presence (user_id, online, last_seen, updated_at, connection_id)
  VALUES (p_user_id, p_online, NOW(), NOW(), p_connection_id)
  ON CONFLICT (user_id)
  DO UPDATE SET
    online = p_online,
    last_seen = NOW(),
    updated_at = NOW(),
    connection_id = COALESCE(p_connection_id, user_presence.connection_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Create function to expire stale presence (users who haven't sent heartbeat in 2 minutes)
CREATE OR REPLACE FUNCTION expire_stale_presence() RETURNS VOID AS $$
BEGIN
  UPDATE user_presence
  SET online = FALSE
  WHERE online = TRUE
    AND updated_at < NOW() - INTERVAL '2 minutes';
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create a cron job to run expire_stale_presence every minute
-- NOTE: This requires pg_cron extension. If not available, you'll need to:
-- 1. Enable pg_cron in Supabase Dashboard (Database > Extensions)
-- 2. Or implement client-side polling as fallback

-- First, enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the cron job (runs every minute)
SELECT cron.schedule(
  'expire-stale-presence',
  '*/1 * * * *',
  'SELECT expire_stale_presence()'
);

-- Step 5: Verify the migration
-- Run these queries to test:
-- SELECT * FROM user_presence;
-- SELECT * FROM cron.job;
