-- 0006_invoices_payments_rma_delivery.sql
-- Invoices, payments, adjustments, RMA, deliveries

-- ============================================================
-- INVOICES
-- ============================================================
CREATE TABLE IF NOT EXISTS invoices (
  id            SERIAL PRIMARY KEY,
  invoice_no    TEXT NOT NULL UNIQUE,
  order_id      INT NOT NULL UNIQUE REFERENCES orders(id),
  buyer_id      UUID NOT NULL REFERENCES trade_accounts(id),
  total_amount  NUMERIC(14,2) NOT NULL CHECK (total_amount > 0),
  paid_amount   NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (paid_amount >= 0),
  balance_due   NUMERIC(14,2) NOT NULL DEFAULT 0,
  due_date      DATE NOT NULL,
  status        TEXT NOT NULL DEFAULT 'PENDING'
                  CHECK (status IN ('PENDING','PARTIALLY_PAID','PAID','OVERDUE','CANCELLED','VOID')),
  pdf_url       TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS idx_invoices_order  ON invoices(order_id);
CREATE INDEX IF NOT EXISTS idx_invoices_buyer  ON invoices(buyer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due    ON invoices(due_date) WHERE status IN ('PENDING','PARTIALLY_PAID','OVERDUE');

-- ============================================================
-- PAYMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS payments (
  id               SERIAL PRIMARY KEY,
  payment_no       TEXT NOT NULL UNIQUE,
  invoice_id       INT NOT NULL REFERENCES invoices(id),
  buyer_id         UUID NOT NULL REFERENCES trade_accounts(id),
  amount           NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  method           TEXT NOT NULL CHECK (method IN ('BANK_TRANSFER','CHEQUE','CASH','ONLINE','CREDIT_NOTE')),
  reference        TEXT,
  recorded_by      UUID NOT NULL REFERENCES users(id),
  received_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reversed_at      TIMESTAMPTZ,
  reversal_reason  TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_buyer   ON payments(buyer_id);
CREATE INDEX IF NOT EXISTS idx_payments_received ON payments(received_at);

-- ============================================================
-- INVOICE ADJUSTMENTS (debit/credit notes, RMA-driven)
-- ============================================================
CREATE TABLE IF NOT EXISTS invoice_adjustments (
  id         SERIAL PRIMARY KEY,
  invoice_id INT NOT NULL REFERENCES invoices(id),
  amount     NUMERIC(14,2) NOT NULL,
  reason     TEXT NOT NULL,
  rma_id     INT, -- FK added in 0008 after rma_requests exists
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoice_adjustments_invoice ON invoice_adjustments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_adjustments_rma     ON invoice_adjustments(rma_id);

-- ============================================================
-- RMA REQUESTS (Return Merchandise Authorisation)
-- ============================================================
CREATE TABLE IF NOT EXISTS rma_requests (
  id                       SERIAL PRIMARY KEY,
  rma_no                   TEXT NOT NULL UNIQUE,
  order_id                 INT NOT NULL REFERENCES orders(id),
  buyer_id                 UUID NOT NULL REFERENCES trade_accounts(id),
  status                   TEXT NOT NULL DEFAULT 'PENDING'
                             CHECK (status IN ('PENDING','APPROVED','REJECTED','RESOLVED','CANCELLED')),
  reason_category          TEXT NOT NULL
                             CHECK (reason_category IN (
                               'DAMAGED','WRONG_ITEM','QUALITY_ISSUE','SHORT_SHIPPED',
                               'LATE_DELIVERY','BUYER_REMORSE','OTHER'
                             )),
  reason_detail            TEXT,
  evidence_urls            TEXT[],
  decided_by               UUID REFERENCES users(id),
  decided_at               TIMESTAMPTZ,
  resolution               TEXT,
  inventory_adjustment_note TEXT,
  invoice_adjustment_note  TEXT,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_rma_requests_updated_at
  BEFORE UPDATE ON rma_requests
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS idx_rma_requests_order  ON rma_requests(order_id);
CREATE INDEX IF NOT EXISTS idx_rma_requests_buyer  ON rma_requests(buyer_id);
CREATE INDEX IF NOT EXISTS idx_rma_requests_status ON rma_requests(status);

-- ============================================================
-- RMA ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS rma_items (
  id            SERIAL PRIMARY KEY,
  rma_id        INT NOT NULL REFERENCES rma_requests(id) ON DELETE CASCADE,
  order_item_id INT NOT NULL REFERENCES order_items(id),
  qty           INT NOT NULL CHECK (qty > 0),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rma_items_rma        ON rma_items(rma_id);
CREATE INDEX IF NOT EXISTS idx_rma_items_order_item ON rma_items(order_item_id);

-- ============================================================
-- DELIVERIES (one per order)
-- ============================================================
CREATE TABLE IF NOT EXISTS deliveries (
  id                  SERIAL PRIMARY KEY,
  order_id            INT NOT NULL UNIQUE REFERENCES orders(id),
  assigned_to         UUID REFERENCES users(id),
  status              TEXT NOT NULL DEFAULT 'PENDING'
                        CHECK (status IN (
                          'PENDING','ASSIGNED','DISPATCHED','IN_TRANSIT',
                          'DELIVERED','FAILED','CANCELLED'
                        )),
  dispatch_date       TIMESTAMPTZ,
  pod_url             TEXT,
  pod_uploaded_at     TIMESTAMPTZ,
  buyer_confirmed_at  TIMESTAMPTZ,
  failure_note        TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_deliveries_updated_at
  BEFORE UPDATE ON deliveries
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS idx_deliveries_order    ON deliveries(order_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_assigned ON deliveries(assigned_to);
CREATE INDEX IF NOT EXISTS idx_deliveries_status   ON deliveries(status);

-- ============================================================
-- DELIVERY EVENTS (status-change log)
-- ============================================================
CREATE TABLE IF NOT EXISTS delivery_events (
  id          SERIAL PRIMARY KEY,
  delivery_id INT NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
  status      TEXT NOT NULL,
  note        TEXT,
  actor_id    UUID REFERENCES users(id),
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_delivery_events_delivery ON delivery_events(delivery_id);
