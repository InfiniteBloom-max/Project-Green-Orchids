-- 0002_roles_permissions.sql
-- RBAC: roles, permissions, and role-permission assignments

-- ============================================================
-- ROLES
-- ============================================================
CREATE TABLE IF NOT EXISTS roles (
  id          SMALLSERIAL PRIMARY KEY,
  name        TEXT NOT NULL UNIQUE,
  description TEXT
);

-- ============================================================
-- PERMISSIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS permissions (
  id          SMALLSERIAL PRIMARY KEY,
  code        TEXT NOT NULL UNIQUE,
  description TEXT
);

-- ============================================================
-- ROLE-PERMISSION JOIN
-- ============================================================
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id       SMALLINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id SMALLINT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- ============================================================
-- SEED DATA
-- ============================================================

-- Upsert roles -------------------------------------------------
INSERT INTO roles (name, description) VALUES
  ('ADMIN',                'Full system access'),
  ('TRADE_BUYER',          'Registered wholesale buyer'),
  ('INVENTORY_MANAGER',    'Product catalogue and inventory management'),
  ('FINANCE_OFFICER',      'Invoicing, payments, and financial reporting'),
  ('DELIVERY_COORDINATOR', 'Order dispatch and delivery tracking')
ON CONFLICT (name) DO UPDATE
  SET description = EXCLUDED.description;

-- Upsert permissions -------------------------------------------
INSERT INTO permissions (code, description) VALUES
  -- RFQ
  ('rfq.create',       'Create a Request for Quotation'),
  ('rfq.view.own',     'View own RFQs'),
  ('rfq.view.all',     'View all RFQs'),
  ('rfq.quote',        'Respond to an RFQ with a quote'),

  -- Orders
  ('order.create',     'Place an order'),
  ('order.view.own',   'View own orders'),
  ('order.view.all',   'View all orders'),
  ('order.approve',    'Approve or reject an order'),
  ('order.cancel',     'Cancel an order'),

  -- Invoices
  ('invoice.view.own', 'View own invoices'),
  ('invoice.view.all', 'View all invoices'),
  ('invoice.generate', 'Generate invoice from order'),
  ('invoice.download', 'Download invoice PDF'),

  -- Payments
  ('payment.record',   'Record a payment'),
  ('payment.reverse',  'Reverse a payment'),
  ('payment.view',     'View payments'),

  -- RMA
  ('rma.create',       'Create a return/refund request'),
  ('rma.decide',       'Approve or reject an RMA'),
  ('rma.view.own',     'View own RMA requests'),
  ('rma.view.all',     'View all RMA requests'),

  -- Products / Catalogue
  ('product.create',   'Create new product'),
  ('product.edit',     'Edit product details'),
  ('product.view',     'View products'),
  ('product.archive',  'Archive / discontinue product'),
  ('price.change',     'Change product price'),
  ('price.approve',    'Approve a price-change request'),

  -- Inventory
  ('stock.adjust',     'Adjust stock quantity'),
  ('stock.view',       'View stock levels'),
  ('alert.ack',        'Acknowledge stock alert'),
  ('alert.view',       'View stock alerts'),

  -- Delivery
  ('delivery.assign',  'Assign delivery to coordinator'),
  ('delivery.update',  'Update delivery status'),
  ('delivery.view',    'View delivery records'),
  ('pod.upload',        'Upload proof-of-delivery'),

  -- Reporting
  ('report.view',      'View reports and dashboards'),

  -- Credit
  ('credit.view',      'View buyer credit accounts'),

  -- CMS
  ('cms.edit',         'Edit CMS content'),

  -- Admin / Users
  ('user.manage',      'Create / edit / deactivate users'),
  ('user.view',        'View user accounts'),
  ('role.assign',      'Assign role to user'),
  ('audit.view',       'View audit logs'),

  -- Notifications (internal)
  ('notification.send','Send notifications'),

  -- Settings
  ('settings.edit',    'Edit platform settings'),
  ('settings.view',    'View platform settings')
ON CONFLICT (code) DO UPDATE
  SET description = EXCLUDED.description;

-- Upsert role-permission matrix --------------------------------
DO $$
DECLARE
  v_admin_id               SMALLINT;
  v_buyer_id               SMALLINT;
  v_inventory_id           SMALLINT;
  v_finance_id             SMALLINT;
  v_delivery_id            SMALLINT;
BEGIN
  SELECT id INTO v_admin_id     FROM roles WHERE name = 'ADMIN';
  SELECT id INTO v_buyer_id     FROM roles WHERE name = 'TRADE_BUYER';
  SELECT id INTO v_inventory_id FROM roles WHERE name = 'INVENTORY_MANAGER';
  SELECT id INTO v_finance_id   FROM roles WHERE name = 'FINANCE_OFFICER';
  SELECT id INTO v_delivery_id  FROM roles WHERE name = 'DELIVERY_COORDINATOR';

  -- ADMIN: ALL permissions
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT v_admin_id, id FROM permissions
  ON CONFLICT DO NOTHING;

  -- TRADE_BUYER: rfq.create, order.create, invoice.view.own, rma.create
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT v_buyer_id, id FROM permissions WHERE code IN (
    'rfq.create', 'rfq.view.own',
    'order.create', 'order.view.own',
    'invoice.view.own', 'invoice.download',
    'rma.create', 'rma.view.own',
    'product.view', 'stock.view', 'payment.view', 'delivery.view'
  )
  ON CONFLICT DO NOTHING;

  -- INVENTORY_MANAGER
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT v_inventory_id, id FROM permissions WHERE code IN (
    'product.create', 'product.edit', 'product.view', 'product.archive',
    'price.change', 'price.approve',
    'stock.adjust', 'stock.view',
    'alert.ack', 'alert.view',
    'report.view',
    'rfq.view.all', 'order.view.all', 'delivery.view',
    'settings.view'
  )
  ON CONFLICT DO NOTHING;

  -- FINANCE_OFFICER
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT v_finance_id, id FROM permissions WHERE code IN (
    'invoice.view.all', 'invoice.generate', 'invoice.download',
    'payment.record', 'payment.reverse', 'payment.view',
    'report.view',
    'credit.view',
    'order.view.all', 'rfq.view.all',
    'rma.view.all', 'rma.decide',
    'settings.view'
  )
  ON CONFLICT DO NOTHING;

  -- DELIVERY_COORDINATOR
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT v_delivery_id, id FROM permissions WHERE code IN (
    'delivery.assign', 'delivery.update', 'delivery.view',
    'pod.upload',
    'order.view.all',
    'stock.view', 'alert.view',
    'settings.view'
  )
  ON CONFLICT DO NOTHING;
END
$$;
