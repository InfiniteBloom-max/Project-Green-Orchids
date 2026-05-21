-- 0008_indexes_constraints.sql
-- Additional performance indexes, deferred FK, unique constraints, and grants

-- ============================================================
-- FK for invoice_adjustments.rma_id (deferred from 0006)
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_invoice_adjustments_rma'
  ) THEN
    ALTER TABLE invoice_adjustments
      ADD CONSTRAINT fk_invoice_adjustments_rma
      FOREIGN KEY (rma_id) REFERENCES rma_requests(id);
  END IF;
END
$$;

-- ============================================================
-- IDEMPOTENCY UNIQUE: payments(invoice_id, method, reference)
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_payments_idempotent'
  ) THEN
    ALTER TABLE payments
      ADD CONSTRAINT uq_payments_idempotent
      UNIQUE (invoice_id, method, reference);
  END IF;
EXCEPTION WHEN duplicate_table THEN
  -- constraint may already exist under a different name; skip
  NULL;
END
$$;

-- ============================================================
-- COMPOSITE / COVERING INDEXES
-- ============================================================

-- Products: fast lookup by status within category
CREATE INDEX IF NOT EXISTS idx_products_category_status
  ON products(category_id, status);

-- Products: text search on SKU
CREATE INDEX IF NOT EXISTS idx_products_sku_trgm
  ON products USING gin (sku gin_trgm_ops);

-- Orders: common query paths
CREATE INDEX IF NOT EXISTS idx_orders_created_at
  ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_source
  ON orders(source);

-- Invoices: buyer + status combined
CREATE INDEX IF NOT EXISTS idx_invoices_buyer_status
  ON invoices(buyer_id, status);

-- Payments: uniqueness guard (idempotency) already covered via uq_payments_idempotent
CREATE INDEX IF NOT EXISTS idx_payments_invoice_method
  ON payments(invoice_id, method);

-- RMA requests: common filter
CREATE INDEX IF NOT EXISTS idx_rma_requests_created
  ON rma_requests(created_at DESC);

-- Deliveries: dispatch windows
CREATE INDEX IF NOT EXISTS idx_deliveries_dispatch
  ON deliveries(dispatch_date) WHERE status IN ('DISPATCHED','IN_TRANSIT');

-- Stock alerts: unresolved alerts
CREATE INDEX IF NOT EXISTS idx_stock_alerts_open
  ON stock_alerts(product_id) WHERE status = 'OPEN';

-- Login history: recent failures per email for brute-force detection
CREATE INDEX IF NOT EXISTS idx_login_history_failures
  ON login_history(email_attempted, occurred_at DESC) WHERE success = false;

-- Auth sessions: active sessions by user
CREATE INDEX IF NOT EXISTS idx_auth_sessions_active
  ON auth_sessions(user_id) WHERE revoked_at IS NULL;

-- Bloom events: by session
CREATE INDEX IF NOT EXISTS idx_bloom_events_session
  ON bloom_events(session_anon_id) WHERE session_anon_id IS NOT NULL;

-- ============================================================
-- GRANTS & REVOKES
-- ============================================================

-- Revoke UPDATE and DELETE on audit_logs from regular application user.
-- The table is append-only by design.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_user') THEN
    REVOKE UPDATE, DELETE ON audit_logs FROM app_user;
    REVOKE UPDATE, DELETE ON stock_movements FROM app_user;
    REVOKE UPDATE, DELETE ON price_history FROM app_user;
  END IF;
END
$$;

-- ============================================================
-- SEED DEFAULT SETTINGS (idempotent)
-- ============================================================
INSERT INTO settings (key, value) VALUES
  ('rma_window_days',        '7'),
  ('session_cap',            '3'),
  ('lockout_threshold',      '5'),
  ('lockout_duration_min',   '15'),
  ('low_stock_default',      '10'),
  ('quote_default_expiry_days','7'),
  ('payment_timeout_days',   '5'),
  ('auto_cancel_days',       '10')
ON CONFLICT (key) DO NOTHING;
