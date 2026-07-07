-- 0015_user_avatar.sql
-- Profile-picture (avatar) support for user accounts, all roles.

ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;

COMMENT ON COLUMN users.avatar_url IS 'Public URL of the uploaded profile picture, NULL when using initials fallback';
