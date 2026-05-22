-- 0009_reconciliation.sql
-- Reconciliation migration produced by the DB & Security Audit remediation.
-- Adds the additive DB objects the corrected service layer needs:
--   * document-number sequences (F1.4)                                  -> Finding 25
--   * append-only enforcement via triggers (role-independent)           -> Finding 17
--   * workflow enum values the state machine legitimately needs          -> Findings 5, 8
--   * ADJUSTED invoice status (F1.3)                                    -> Finding 10
--   * remove price.approve from INVENTORY_MANAGER (two-person rule)     -> Finding 20
-- This migration is idempotent and safe to re-run.

-- ============================================================
-- 1. DOCUMENT-NUMBER SEQUENCES  (Finding 25 / F1.4)
--    The service already calls nextval('order_number_seq') etc.;
--    these sequences must exist. Gap-tolerant by design.
-- ============================================================
CREATE SEQUENCE IF NOT EXISTS order_number_seq   START 1;
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1;
CREATE SEQUENCE IF NOT EXISTS payment_number_seq START 1;

-- ============================================================
-- 2. WORKFLOW ENUM EXTENSIONS  (Findings 5 & 8)
--    Align the DB CHECK lists with the (now corrected) state machine.
--    Inline CHECKs are auto-named <table>_<column>_check.
-- ============================================================
-- orders: add CLOSED (buyer confirm-receipt terminal state)
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check CHECK (status IN (
  'DRAFT','PENDING_APPROVAL','APPROVED','REJECTED','PROCESSING','READY_TO_SHIP',
  'DISPATCHED','DELIVERED','CLOSED','CANCELLED','RETURNED'));

-- rfqs: add UNDER_REVIEW, ACCEPTED, REJECTED (negotiation states)
ALTER TABLE rfqs DROP CONSTRAINT IF EXISTS rfqs_status_check;
ALTER TABLE rfqs ADD CONSTRAINT rfqs_status_check CHECK (status IN (
  'DRAFT','SUBMITTED','UNDER_REVIEW','QUOTED','ACCEPTED','REJECTED',
  'EXPIRED','DECLINED','CONVERTED'));

-- deliveries: add CONFIRMED (buyer confirmation)
ALTER TABLE deliveries DROP CONSTRAINT IF EXISTS deliveries_status_check;
ALTER TABLE deliveries ADD CONSTRAINT deliveries_status_check CHECK (status IN (
  'PENDING','ASSIGNED','DISPATCHED','IN_TRANSIT','DELIVERED','CONFIRMED','FAILED','CANCELLED'));

-- invoices: add ADJUSTED (RMA credit drives balance to 0 via adjustment, F1.3)
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_status_check;
ALTER TABLE invoices ADD CONSTRAINT invoices_status_check CHECK (status IN (
  'PENDING','PARTIALLY_PAID','PAID','OVERDUE','ADJUSTED','CANCELLED','VOID'));

-- ============================================================
-- 3. APPEND-ONLY ENFORCEMENT  (Finding 17)
--    REVOKE in 0008 only ran if a role named 'app_user' existed.
--    Triggers are role-independent and demo-provable.
-- ============================================================
CREATE OR REPLACE FUNCTION prevent_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Table % is append-only; % is not permitted', TG_TABLE_NAME, TG_OP;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_logs_append_only      ON audit_logs;
DROP TRIGGER IF EXISTS trg_stock_movements_append_only ON stock_movements;
DROP TRIGGER IF EXISTS trg_price_history_append_only   ON price_history;

CREATE TRIGGER trg_audit_logs_append_only
  BEFORE UPDATE OR DELETE ON audit_logs
  FOR EACH ROW EXECUTE FUNCTION prevent_mutation();
CREATE TRIGGER trg_stock_movements_append_only
  BEFORE UPDATE OR DELETE ON stock_movements
  FOR EACH ROW EXECUTE FUNCTION prevent_mutation();
CREATE TRIGGER trg_price_history_append_only
  BEFORE UPDATE OR DELETE ON price_history
  FOR EACH ROW EXECUTE FUNCTION prevent_mutation();

-- ============================================================
-- 4. RBAC CORRECTION  (Finding 20)
--    price.approve is ADMIN-only per the B6 matrix; revoke from INVENTORY_MANAGER.
-- ============================================================
DELETE FROM role_permissions
WHERE role_id = (SELECT id FROM roles WHERE name = 'INVENTORY_MANAGER')
  AND permission_id = (SELECT id FROM permissions WHERE code = 'price.approve');

-- ============================================================
-- 5. INDEXING GAPS  (Findings 27, 28, 30)
--    (Finding 26 = verify-only; Finding 29 GIN = deliberately deferred until
--     JSONB-content filtering is actually added — documented, no index now.)
-- ============================================================
-- Finding 27: weekly "Bloom engagements" tile filters by time
CREATE INDEX IF NOT EXISTS idx_bloom_events_time
  ON bloom_events(triggered_at DESC);
CREATE INDEX IF NOT EXISTS idx_bloom_events_product_time
  ON bloom_events(product_id, triggered_at DESC);

-- Finding 28: active-token lookups & expiry cleanup
CREATE INDEX IF NOT EXISTS idx_email_tokens_active
  ON email_tokens(user_id, purpose) WHERE used_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_email_tokens_expires
  ON email_tokens(expires_at);

-- Finding 30: admin supplier/category directory search
CREATE INDEX IF NOT EXISTS idx_suppliers_name_trgm
  ON suppliers USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_categories_name_trgm
  ON categories USING gin (name gin_trgm_ops);
