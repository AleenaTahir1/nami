-- Migration: Add notification settings to profiles table
-- Created: 2025-12-27
-- Description: Adds notification preferences for users

-- Add notification settings columns
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS notification_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notification_sound BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notification_preview BOOLEAN DEFAULT true;

-- Add comment for documentation
COMMENT ON COLUMN profiles.notification_enabled IS 'Whether user has notifications enabled';
COMMENT ON COLUMN profiles.notification_sound IS 'Whether to play sound with notifications';
COMMENT ON COLUMN profiles.notification_preview IS 'Whether to show message preview in notifications';

-- Create index for faster queries (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_profiles_notifications 
ON profiles(notification_enabled) 
WHERE notification_enabled = true;
