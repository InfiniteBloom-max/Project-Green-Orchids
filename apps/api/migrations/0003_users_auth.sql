-- 0003_users_auth.sql
-- Users, authentication sessions, login history, email tokens, role access windows

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email               CITEXT NOT NULL UNIQUE,
  password_hash       TEXT NOT NULL,
  full_name           TEXT NOT NULL,
  role_id             SMALLINT NOT NULL REFERENCES roles(id),
  status              TEXT NOT NULL DEFAULT 'ACTIVE'
                        CHECK (status IN ('ACTIVE','LOCKED','SUSPENDED','INACTIVE')),
  email_verified_at   TIMESTAMPTZ,
  failed_login_count  INT NOT NULL DEFAULT 0,
  locked_until        TIMESTAMPTZ,
  password_changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at       TIMESTAMPTZ,
  bloom_opt_in        BOOLEAN NOT NULL DEFAULT false,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- AUTH SESSIONS (refresh tokens)
-- ============================================================
CREATE TABLE IF NOT EXISTS auth_sessions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_token_hash  TEXT NOT NULL,
  ip                  INET,
  user_agent          TEXT,
  device_label        TEXT,
  issued_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at          TIMESTAMPTZ NOT NULL,
  rotated_from        UUID REFERENCES auth_sessions(id),
  revoked_at          TIMESTAMPTZ,
  revoke_reason       TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_user ON auth_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_hash  ON auth_sessions(refresh_token_hash);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires ON auth_sessions(expires_at)
  WHERE revoked_at IS NULL;

-- ============================================================
-- LOGIN HISTORY (for brute-force detection & auditing)
-- ============================================================
CREATE TABLE IF NOT EXISTS login_history (
  id              BIGSERIAL PRIMARY KEY,
  user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
  email_attempted CITEXT NOT NULL,
  success         BOOLEAN NOT NULL,
  failure_reason  TEXT,
  ip              INET,
  user_agent      TEXT,
  occurred_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_login_history_user   ON login_history(user_id);
CREATE INDEX IF NOT EXISTS idx_login_history_email  ON login_history(email_attempted);
CREATE INDEX IF NOT EXISTS idx_login_history_time   ON login_history(occurred_at DESC);

-- ============================================================
-- EMAIL TOKENS (verification, password reset, invitation)
-- ============================================================
CREATE TABLE IF NOT EXISTS email_tokens (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  purpose    TEXT NOT NULL CHECK (purpose IN ('email_verify','password_reset','invitation')),
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_tokens_user ON email_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_email_tokens_hash ON email_tokens(token_hash);

-- ============================================================
-- ROLE ACCESS WINDOWS (time-restricted role access per day)
-- ============================================================
CREATE TABLE IF NOT EXISTS role_access_windows (
  id          SERIAL PRIMARY KEY,
  role_id     SMALLINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time  TIME NOT NULL,
  end_time    TIME NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (start_time < end_time)
);

CREATE INDEX IF NOT EXISTS idx_role_access_windows_role ON role_access_windows(role_id);

-- Comments
COMMENT ON COLUMN users.bloom_opt_in IS 'Whether user opted into smile-triggered bloom events';
COMMENT ON TABLE auth_sessions IS 'Active & revoked refresh-token sessions';
COMMENT ON TABLE login_history IS 'All login attempts (success/failure) for security auditing';
COMMENT ON TABLE email_tokens IS 'One-time tokens for email verification, password reset, invitations';
COMMENT ON TABLE role_access_windows IS 'Optional: restrict role login to specific day/time windows';
