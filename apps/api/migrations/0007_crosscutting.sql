-- 0007_crosscutting.sql
-- Audit, alerts, notifications, CMS, bloom events, job runs, settings

-- ============================================================
-- AUDIT LOGS (immutable, append-only)
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id          BIGSERIAL PRIMARY KEY,
  actor_id    UUID REFERENCES users(id) ON DELETE SET NULL,
  actor_role  TEXT,
  action      TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id   TEXT NOT NULL,
  before      JSONB,
  after       JSONB,
  ip          INET,
  user_agent  TEXT,
  request_id  TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor  ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_time   ON audit_logs(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- ============================================================
-- STOCK ALERTS
-- ============================================================
CREATE TABLE IF NOT EXISTS stock_alerts (
  id              SERIAL PRIMARY KEY,
  product_id      INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  alert_type      TEXT NOT NULL CHECK (alert_type IN ('LOW_STOCK','OUT_OF_STOCK','OVERSTOCK','REORDER')),
  threshold_value INT,
  generated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status          TEXT NOT NULL DEFAULT 'OPEN'
                    CHECK (status IN ('OPEN','ACKNOWLEDGED','RESOLVED')),
  acknowledged_by UUID REFERENCES users(id),
  acknowledged_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_alerts_product ON stock_alerts(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_alerts_status  ON stock_alerts(status);

-- ============================================================
-- NOTIFICATIONS OUTBOX (transactional-outbox pattern)
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications_outbox (
  id                BIGSERIAL PRIMARY KEY,
  recipient_email   TEXT,
  recipient_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  template          TEXT NOT NULL,
  payload           JSONB NOT NULL,
  status            TEXT NOT NULL DEFAULT 'PENDING'
                      CHECK (status IN ('PENDING','SENDING','SENT','FAILED')),
  attempts          INT NOT NULL DEFAULT 0,
  next_attempt_at   TIMESTAMPTZ,
  last_error        TEXT,
  sent_at           TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_outbox_status ON notifications_outbox(status, next_attempt_at)
  WHERE status IN ('PENDING','FAILED');

-- ============================================================
-- CMS BLOCKS (headless CMS content snippets)
-- ============================================================
CREATE TABLE IF NOT EXISTS cms_blocks (
  id           SERIAL PRIMARY KEY,
  key          TEXT NOT NULL UNIQUE,
  type         TEXT NOT NULL CHECK (type IN ('HERO','BANNER','TEXT','HTML','MARKDOWN','JSON')),
  content      JSONB NOT NULL,
  is_published BOOLEAN NOT NULL DEFAULT false,
  updated_by   UUID REFERENCES users(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_cms_blocks_updated_at
  BEFORE UPDATE ON cms_blocks
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- BLOOM EVENTS (smile-triggered / interactive)
-- ============================================================
CREATE TABLE IF NOT EXISTS bloom_events (
  id               BIGSERIAL PRIMARY KEY,
  user_id          UUID REFERENCES users(id) ON DELETE SET NULL,
  product_id       INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  session_anon_id  TEXT,
  smile_score      NUMERIC(3,2),
  triggered_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bloom_events_product ON bloom_events(product_id);
CREATE INDEX IF NOT EXISTS idx_bloom_events_user    ON bloom_events(user_id);

-- ============================================================
-- JOB RUNS (cron / background job tracking)
-- ============================================================
CREATE TABLE IF NOT EXISTS job_runs (
  id          BIGSERIAL PRIMARY KEY,
  job_name    TEXT NOT NULL,
  started_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  outcome     TEXT,
  meta        JSONB
);

CREATE INDEX IF NOT EXISTS idx_job_runs_name ON job_runs(job_name);
CREATE INDEX IF NOT EXISTS idx_job_runs_start ON job_runs(started_at DESC);

-- ============================================================
-- SETTINGS (key-value config store)
-- ============================================================
CREATE TABLE IF NOT EXISTS settings (
  key        TEXT PRIMARY KEY,
  value      JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
