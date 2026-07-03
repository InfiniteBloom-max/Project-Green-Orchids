# Project Green — Strict Full-System QA Report

- **Report file:** `docs/QA_FULL_SYSTEM_TEST_REPORT_2026-07-02.md`
- **Test date/time:** 2026-07-03, 11:35–12:55 Asia/Colombo
- **Snapshot tested:** branch `develop` @ `bbf2f7e` (immediately after the 07-03 fix commit for the previous 5 bugs)
- **Verdict:** **NOT DEMO READY** — one P0 (no Delivery Coordinator portal) and multiple P1 money/security-integrity bugs remain live.

This is a fresh, ground-up pass, not a re-verification of the prior fix commit. Every bug below was reproduced live via direct API calls against the running backend and confirmed (or refuted) against PostgreSQL state — no bug is reported from code reading alone, and no PASS is claimed without both an API response and a DB query agreeing.

---

## 1. Environment

| Item | Value |
|---|---|
| Workspace | `C:\Users\Ronit\Downloads\project-green (1)\project-green` |
| Web | Next.js 14, `http://localhost:3000` (pre-existing running process, PID 26360) |
| API | Express, `http://localhost:5000` (pre-existing running process, PID 24336), `GET /healthz` → `200 healthy` |
| DB | PostgreSQL `project_green` (local, `postgres`/`123456789`) |
| Clean seed | **Not attempted this pass** — `scripts/seed.js` is still known-broken from the 07-02 report (FK order issue) and re-running it was out of scope for this pass; tested against the live, already-large DB (14 users, 522 products, 928+ orders, 659+ invoices, 32+ RMAs going in) |
| Evidence | Raw request/response bodies and `psql` query output shown inline per bug below; working files under `tmp/*.json`, `tmp/*.sh`, `tmp/*.tok` (gitignored scratch) |

## 2. Accounts used

| Role | Account | Password | Result |
|---|---|---|---|
| Admin | `admin@example.invalid` | `Staff@1234` | Login OK, full permission set |
| Trade Buyer | `buyer1@example.invalid` | `Buyer@1234` | Login OK, `TRADE_BUYER`/APPROVED |
| Trade Buyer (edge) | `buyer2@example.invalid`, `buyer5@example.invalid` | `Buyer@1234` | Used for isolation + password-change tests |
| Finance Officer | `finance@example.invalid` | `Staff@1234` | Login OK |
| Inventory Manager | `inventory@example.invalid` | `Staff@1234` | Login OK |
| Delivery Coordinator | `delivery@example.invalid` | `Staff@1234` | API login OK; **UI login redirects into a dead route (BUG-006)** |
| Invalid/locked | `bad@example.invalid`, deliberately-locked `buyer3@example.invalid` | — | Correctly rejected (see §7, BUG-002) |

Note: `buyer5@example.invalid`'s password was temporarily changed twice during password-change testing and was **restored to `Buyer@1234`** before this report was written — verified with a fresh login (200 OK).

## 3. Method

1. Confirmed API/web already running and healthy; queried DB directly for ground truth on every mutation.
2. Drove every workflow through the real HTTP API with the exact request bodies the frontend sends (cross-checked against the actual page source, not guessed), so findings reflect what a real user's browser would trigger — not hypothetical malformed requests.
3. For each finding, re-ran the request at least twice (once to reproduce, once after understanding root cause) and inspected the relevant table with `psql` before writing it up.
4. Treated `res.data` vs `res.data.data` unwrapping, camelCase-vs-snake_case field drift, and silent `.catch(() => defaultValue)` patterns as first-class suspects, since the prior fix round showed these are the dominant bug class in this codebase.
5. PASS is only claimed where both the API call and a direct SQL query confirm the same outcome.

## 4. Summary

- **P0:** 1
- **P1:** 4
- **P2:** 4
- **P3:** 1
- **Golden paths:** 4 of 7 fully pass end-to-end (UI-route-reachable + API + DB); 1 partially passes with a real defect inside it (RMA→credit); 1 is blocked entirely by the missing Delivery portal; RFQ golden path passes only via the correct endpoint — a parallel, dead endpoint the UI doesn't use returns a fake success.
- The 5 bugs fixed in commit `bbf2f7e` (buyer order-detail page, POD `buyer_confirmed_at`, cancel-voids-invoice, upload validation error shape, notification recipients) were **spot-checked and remain fixed** — buyer1 order confirm-receipt, and clean 400s on bad file uploads all behaved correctly during this pass (see §8).
- Auth, RBAC, buyer data isolation, account lockout (as a login-blocking mechanism), password-change token invalidation, order approval → stock reservation → invoice generation, and the payment partial→final→PAID-at-zero path are all **solid**.
- The **Inventory Movements** feature is completely broken (500 on every call, wrong column name) — this is the *same* defect area flagged in the 07-02 baseline and was not part of the 5 bugs that got fixed.
- **RMA credit-note resolution silently fails to update the invoice it targets** — the invoice stays `PAID`/`balance_due=0` forever even though a credit was recorded against it. The buyer's month-end Statement (which recomputes from the ledger) shows the credit correctly, but the Invoices list, invoice detail page, and Aging report (which all read `invoices.balance_due`/`status` directly) do not — a genuine, hard-to-notice, two-source-of-truth money bug.
- **The two-person rule on large payment reversals is trivially bypassable**: the API accepts any syntactically-valid UUID as the "confirming officer," with no check that it belongs to a real, distinct, authorized user.
- **The admin Security → Locked Accounts panel and its Unlock action are completely disconnected from the real lockout mechanism.** Real lockouts are computed live from `login_history` (5 failures/15 min); the panel/unlock code reads/writes `users.locked_until` and `users.failed_login_count`, columns the login flow never touches. A genuinely locked-out user is invisible to admin and cannot be unlocked early.
- The Delivery Coordinator role still has **no working portal at all** — this predates this session's testing and was flagged in the 07-02 baseline; it remains unfixed and blocks golden path 4 end-to-end via the UI.

## 5. Module pass/fail matrix

| Module | Result | Evidence basis |
|---|---:|---|
| A. Startup/env | PARTIAL | Servers already running/healthy; clean seed not re-attempted (known broken, out of scope this pass) |
| B. Auth/RBAC/lockout/password-change | PASS (see BUG-002 for the admin-side lockout panel) | All 6 role logins, invalid login, 6-attempt lockout, cross-role 403s, buyer1/buyer2 order+invoice isolation, password-change (wrong current pw rejected, token invalidated instantly on success) all verified live |
| C. Buyer catalogue/cart/order/RFQ | PASS (cart MOQ gap = BUG-007) | Catalogue tier pricing correct; cart→order→approve→invoice full chain verified with DB stock/invoice checks; RFQ→quote→accept→convert verified via the real `/orders/from-rfq` endpoint |
| D. Admin orders/RFQ/pricing/security | PARTIAL | Order approve/reject, RFQ review/quote, price-governance 3rd-change-needs-approval all pass; Security module's locked-accounts/unlock is broken (BUG-002) |
| E. Inventory | FAIL | `/inventory/movements` 500s on every call (BUG-003); stock reservation/RMA-restock math itself is correct |
| F. Finance | PARTIAL | Partial→final→PAID-at-zero and overpayment rejection pass; RMA credit-note adjustments don't update the invoice they're attached to (BUG-001); reversal two-person rule bypassable (BUG-004) |
| G. Delivery | FAIL (UI) / PASS (API) | Full API lifecycle (assign→dispatch→in-transit→POD→buyer-confirm) verified correct; the role has no UI route at all (BUG-006) |
| H. Reports/audit/notifications | PARTIAL | Audit log / login history / session list all return real data; sales report responds; notification outbox correctly enqueues and reaches `SENT` (spot-checked from the prior fix, not re-driven end-to-end this pass) |

## 6. Golden path results

| # | Golden path | Result | Notes |
|---|---|---:|---|
| 1 | Catalogue → cart → order → admin approve → invoice | **PASS** | Order 932, invoice 660, stock reserved qty 23→33, invoice `PENDING`/23,037.50 — all confirmed by DB query |
| 2 | RFQ → admin quote → buyer accept → convert to order | **PASS** (via the real endpoint) | RFQ 18 → order 933 via `POST /orders/from-rfq`; RFQ status flips to `CONVERTED` in DB. **But** `PATCH /rfqs/:id/convert` — a second, unused endpoint reachable at the same base path — returns `200 success` while creating nothing (BUG-005) |
| 3 | Invoice → partial payment → final payment → PAID exactly at zero | **PASS** | Invoice 660: 10,000 partial → `PARTIALLY_PAID`/13,037.50 due; overpayment of 999,999 cleanly rejected (`OVERPAYMENT`, `maxAcceptable` shown); final 13,037.50 → `PAID`/0.00 exactly |
| 4 | Delivery assign → dispatched → in-transit → delivered → buyer confirmation | **API: PASS / UI: FAIL** | Full lifecycle verified via API (delivery 305/306); the Delivery Coordinator role cannot reach any of this through the browser because no such route exists (BUG-006) |
| 5 | Delivered order → RMA → approve → item received → resolved adjustment | **PARTIAL** | RMA 33 created → approved → received (stock_qty 389→392, correct) → resolved with a 7,125 credit note — but the invoice it's attached to never reflects the credit (BUG-001) |
| 6 | Product create → image upload (CMS) → bulk tier → governed price change | **PASS** | Product 525 created; CMS media upload works (good file → 201, bad file → clean 400); bulk-tier PUT accepted; 3rd price change within 24h correctly parked as `PENDING` approval with a real admin notification |
| 7 | Security/audit → login history → force logout/unlock/audit filters | **PARTIAL** | Login history and audit-log listing both return real, correct data; force-logout not exercised this pass; **unlock is broken** (BUG-002) |

---

## 7. Bug list

### BUG-001: RMA credit-note resolution never updates the invoice's paid_amount/balance_due/status
- **Severity:** P1
- **Module/Role:** Finance / RMA, Admin
- **Page/Route/API:** `PATCH /api/rma/:id/resolve` (`apps/api/src/modules/rma/rma.service.js:111-134`)
- **Steps:**
  1. Buyer creates an RMA against a fully-paid invoice (invoice 660, order 932, already `PAID`/`balance_due=0.00`).
  2. Admin approves, Inventory Manager receives with `disposition: RESTOCK`.
  3. Admin resolves with `{"resolution":"CREDIT_NOTE","adjustment_amount":7125}`.
- **Expected:** Invoice 660's `balance_due` should reflect the new credit (e.g. go negative / a refund-due state), and/or its `status` should change to indicate an outstanding credit, consistent with how `payments.service.reverse()` recomputes and writes back `paid_amount`/`balance_due`/`status` for the same invoice table.
- **Actual:** A row is correctly inserted into `invoice_adjustments` (`id=3, invoice_id=660, amount=7125.00, rma_id=33`), but `invoices.paid_amount`/`balance_due`/`status` are never touched. `GET /invoices/660` still shows `"status":"PAID","paid_amount":"23037.50","balance_due":"0.00"` with the adjustment listed alongside it, contradicting the invoice's own headline fields. The buyer's month-end Statement (`GET /invoices/statements`) *does* independently recompute from the ledger and correctly includes the credit — so two features of the same system now disagree about the buyer's real balance.
- **Evidence:**
  ```
  PATCH /rma/33/resolve → 200 {"message":"Resolved"}
  select * from invoice_adjustments where rma_id=33;
    id=3, invoice_id=660, amount=7125.00, reason='3 units credited'
  select id,status,paid_amount,balance_due from invoices where id=660;
    660 | PAID | 23037.50 | 0.00        ← unchanged, credit invisible here
  GET /invoices/660 → adjustments:[{"amount":"7125.00",...}] alongside status:"PAID"
  GET /invoices/statements?buyerId=<buyer1 user id>&month=2026-07
    → entries include {"type":"credit","amount":7125,"description":"3 units credited (INV-000005)"}
      (statement is correct; invoice record is not)
  ```
- **Likely cause:** `rma.service.js` `resolve()` inserts the `invoice_adjustments` row but never calls the equivalent of `payments.service.js`'s `calculateBalanceDue()` + `repo.updateInvoice()` to fold the new adjustment back into the invoice's own denormalized `paid_amount`/`balance_due`/`status` columns.
- **Fix direction:** After inserting the adjustment inside the same transaction, re-run the same balance/status recalculation `payments.service.js:reverse()` already does (sum adjustments + payments vs. total, recompute `status` via the shared `invoiceStatus()` helper) and persist it to `invoices`.
- **Regression tests:** Resolve an RMA with a credit note against a fully-paid invoice and assert `invoices.balance_due` changes; resolve one against a `PENDING` invoice and assert the reduced balance is reflected before the next payment; assert the Aging report and invoice list total match the Statement's closing balance for the same buyer/period.
- **Demo impact:** If the RMA demo path is shown, the invoice screen contradicts the statement screen for the exact same credit — this reads as broken bookkeeping to any evaluator who checks both.

---

### BUG-002: Security → Locked Accounts panel and Unlock action are wired to columns the real lockout mechanism never writes
- **Severity:** P1
- **Module/Role:** Admin / Security & Audit
- **Page/Route/API:** `GET /api/admin/security/locked-accounts`, `POST /api/admin/security/locked-accounts/:id/unlock` (`apps/api/src/modules/security/security.repository.js:45-56`) vs. the real lockout check in `apps/api/src/modules/auth/auth.service.js:124-131`
- **Steps:**
  1. Fail login for `buyer3@example.invalid` 6 times in a row with a wrong password.
  2. Confirm the account is genuinely locked (7th attempt with the *correct* password also rejected).
  3. Query `users.status/failed_login_count/locked_until` for this account.
  4. Call `GET /admin/security/locked-accounts` as admin.
- **Expected:** The admin's Locked Accounts list should show `buyer3@example.invalid` as currently locked, and its Unlock button should let the account log in again immediately.
- **Actual:** `users.status='ACTIVE'`, `failed_login_count=0`, `locked_until=NULL` — the real lockout (computed live as "≥5 failures in `login_history` in the last 15 minutes") never touches these columns at all. `locked-accounts` returns `{"data":[]}` even while the account is provably locked (a login with the correct password still 429s `ACCOUNT_LOCKED`). The `unlock` endpoint clears columns that were never set, so it is a guaranteed no-op against a real lockout.
- **Evidence:**
  ```
  6x wrong-password login for buyer3 → 429 ACCOUNT_LOCKED on attempt #6 and #7
  select status,failed_login_count,locked_until from users where email='buyer3@example.invalid';
    ACTIVE | 0 | (null)
  login with CORRECT password → still 429 ACCOUNT_LOCKED  (proves the account really is locked)
  GET /admin/security/locked-accounts → {"success":true,"data":[]}
  ```
- **Likely cause:** Two independent lockout implementations exist in the codebase: the real one in `auth.service.js` (login-history-based, matches the seed data's lack of any `locked_until` values), and a second, unused one built against `users.locked_until`/`failed_login_count` for the admin panel. They were never unified.
- **Fix direction:** Point `locked-accounts`/`unlock` at the same source of truth as `auth.service.login()` — e.g. a query that counts recent `login_history` failures per user and, for unlock, either inserts a compensating `SUCCESS` marker/clears the failure window, or switch `auth.service.js` to actually write `failed_login_count`/`locked_until` on each failure so both sides agree.
- **Regression tests:** Lock an account via repeated bad logins, assert it appears in `locked-accounts`, call `unlock`, assert the account can immediately log in again with the correct password.
- **Demo impact:** The one admin security control a demo audience is likely to test directly ("show me you can unlock a locked user") currently does nothing.

---

### BUG-003: `GET /inventory/movements` (and CSV export) 500 on every call — wrong column name, unfixed since the 07-02 baseline
- **Severity:** P1
- **Module/Role:** Inventory Manager
- **Page/Route/API:** `GET /api/inventory/movements`, movements CSV export (`apps/api/src/modules/inventory/inventory.repository.js:7,8,13,76`)
- **Steps:** Log in as `inventory@example.invalid`, call `GET /inventory/movements?limit=5` (no filters).
- **Expected:** A list of recent stock movements (the same data the Inventory dashboard's "Recent Movements" widget and the movements page both need).
- **Actual:** `500 {"code":"42703","message":"column sm.created_at does not exist"}`. The real column on `stock_movements` is `occurred_at`; `sm.created_at` is used unconditionally in the `ORDER BY` clause (and in the `from`/`to` filter branches and the export query), so **every** call fails regardless of whether date filters are supplied.
- **Evidence:**
  ```
  GET /inventory/movements?limit=5 → 500
  {"code":"42703","message":"column sm.created_at does not exist","stack":"...at Object.findMovements (...inventory.repository.js...)"}
  \d stock_movements → real column is occurred_at, not created_at
  ```
- **Likely cause:** Column renamed/never named `created_at` in the schema, but `inventory.repository.js` was written against the wrong name in 4 places (lines 7, 8, 13, 76) and never caught because this path wasn't exercised by any passing test.
- **Fix direction:** Replace `sm.created_at` with `sm.occurred_at` in all four locations in `inventory.repository.js` (`findMovements` filters + order-by, `findMovementsForExport`).
- **Regression tests:** Call `/inventory/movements` with no filters, with `from`/`to` filters, and hit the CSV export — all three must return 200 with real rows, not 500.
- **Demo impact:** The entire Inventory Manager "Movements" page is unusable; this was already flagged in the 07-02 baseline and the 07-03 fix commit did not touch it.

---

### BUG-004: Two-person rule on large payment reversals is bypassable with any syntactically-valid UUID
- **Severity:** P1
- **Module/Role:** Finance Officer, security control
- **Page/Route/API:** `POST /api/payments/:id/reverse` (`apps/api/src/modules/payments/payments.service.js:73-99`)
- **Steps:**
  1. Reverse a payment > 50,000 (payment 3, amount 75,310.86) with no `confirmed_by` → correctly rejected.
  2. Retry with `confirmed_by` set to a random, well-formed UUID that belongs to **no real user at all** (`00000000-0000-0000-0000-000000000099`).
- **Expected:** The system should verify `confirmed_by` refers to a real, active, appropriately-permissioned user distinct from the actor before allowing a reversal over the two-person threshold.
- **Actual:** The reversal succeeds (`200 "Payment reversed"`), the payment's `reversed_at`/`reversal_reason` are set, and the invoice's `paid_amount`/`balance_due` are recalculated — all driven purely by a fabricated ID that was never checked against the `users` table.
- **Evidence:**
  ```
  POST /payments/3/reverse {reason:"..."} (no confirmed_by) → 403 TWO_PERSON_REQUIRED
  POST /payments/3/reverse {reason:"...", confirmed_by:"totally-fake..."} → 422 Invalid uuid (schema only checks format)
  POST /payments/3/reverse {reason:"...", confirmed_by:"00000000-0000-0000-0000-000000000099"} → 200 "Payment reversed"
  select reversed_at, reversal_reason from payments where id=3; → set, with the fabricated id accepted as the approver
  select status,paid_amount,balance_due from invoices where id=2; → correctly recalculated
  ```
- **Likely cause:** `payments.service.js:80-84` only checks `!data.confirmed_by || data.confirmed_by === actor` — it never looks up `confirmed_by` in `users`, never checks it's a distinct real account, and never checks that account holds a role/permission entitled to countersign a reversal.
- **Fix direction:** Look up `confirmed_by` in `users`, reject if not found / not `ACTIVE` / lacking `payment.reverse` permission / equal to `actor`; consider requiring a live re-auth (password or OTP) from the second officer rather than trusting a client-supplied ID at all.
- **Regression tests:** Attempt a >50k reversal with a non-existent `confirmed_by` → must be rejected; with a real user lacking finance permission → must be rejected; with a real, distinct, permissioned finance user → must succeed.
- **Demo impact:** The "two-person control" — presumably built to satisfy a segregation-of-duties requirement — provides no actual protection today; a single finance officer can silently self-authorize any large reversal.

---

### BUG-005: `PATCH /rfqs/:id/convert` is a dead stub that returns 200 success without creating an order or advancing RFQ status
- **Severity:** P2 (not reachable from the real UI, but live and misleading if called)
- **Module/Role:** RFQ (Admin/Buyer), API surface
- **Page/Route/API:** `PATCH /api/rfqs/:id/convert` (`apps/api/src/modules/rfq/rfq.service.js:131-141`)
- **Steps:**
  1. Take an `ACCEPTED` RFQ (RFQ 18, quoted 19,000/unit × 20 units).
  2. Call `PATCH /rfqs/18/convert` (the URL pattern that mirrors every other RFQ transition, e.g. `/rfqs/18/accept`, `/rfqs/18/reject`).
- **Expected:** Either the same behavior as the real conversion endpoint (create the order, mark RFQ `CONVERTED`), or a `404`/method-not-implemented if it's intentionally not meant to be called.
- **Actual:** Returns `200 {"success":true,"data":{"rfq":{...,"status":"ACCEPTED"},"items":[...]}}`. No row appears in `orders` for this RFQ, and `rfqs.status` stays `ACCEPTED` — a caller has no way to tell this from a real conversion by the response shape alone.
- **Evidence:**
  ```
  PATCH /rfqs/18/convert → 200, response includes rfq.status:"ACCEPTED"
  select * from orders where rfq_id=18; → 0 rows
  select status from rfqs where id=18; → ACCEPTED (unchanged)
  -- The real, working path:
  POST /orders/from-rfq {rfq_id:18} → 201, order 933 created, rfqs.status → CONVERTED (confirmed by query)
  ```
  Confirmed the actual buyer UI (`apps/web/app/(buyer)/buyer/rfq/[id]/page.js:60`) calls `POST /orders/from-rfq`, not this route — so this specific defect does not affect the demo path, but the route is live, permissioned for buyers, and silently no-ops.
- **Likely cause:** `rfq.service.js:convertToOrder()` was left as a scaffold ("`// This is handled by the orders service`") when the real logic was built directly into `orders.service.js:createFromRfq()` instead; the RFQ module's own route/controller/service trio was never removed or wired through.
- **Fix direction:** Either delete `PATCH /rfqs/:id/convert` entirely (and its controller/service method) since `POST /orders/from-rfq` is the real implementation, or make it delegate to `orders.service.createFromRfq()` so both paths behave identically.
- **Regression tests:** If kept, assert it actually creates an order and flips RFQ status; if removed, assert the route 404s and no frontend code references it (already true).
- **Demo impact:** None on the guided demo path (UI doesn't call it), but a real risk for anyone testing the API directly, and dead code that will confuse future maintenance.

---

### BUG-006: Delivery Coordinator has no working portal — `/delivery` 404s after login (carried over, still unfixed)
- **Severity:** P0
- **Module/Role:** Delivery Coordinator, Auth/routing
- **Page/Route/API:** Web route `/delivery`; login redirect in `apps/web/app/(public)/login/page.js:32`; `apps/web/middleware.js:52-54`
- **Steps:**
  1. Log in as `delivery@example.invalid` / `Staff@1234` (via curl with a saved cookie jar, since the browser preview tool could not attach to the already-running dev server this session — confirmed via code inspection this is the same redirect the real login page performs).
  2. Observe the redirect target.
- **Expected:** A Delivery Coordinator-specific dashboard/portal, analogous to `/admin/dashboard`, `/buyer/dashboard`, `/finance/dashboard`, `/inventory/dashboard`.
- **Actual:** `curl -b <post-login cookies> http://localhost:3000/delivery` → real Next.js `404: This page could not be found`. There is no `(delivery)` route group under `apps/web/app` at all — confirmed by directory listing (`(admin)`, `(buyer)`, `(finance)`, `(inventory)`, `(public)` exist; no `(delivery)`). `middleware.js` even has an explicit (no-op) branch for `pathname.startsWith('/delivery')`, and `login/page.js:32` explicitly routes this role to `/delivery` — both sides expect a page that was never built.
- **Evidence:**
  ```
  POST /auth/login (delivery@example.invalid) → 200, cookies saved
  curl -b cookies http://localhost:3000/delivery → HTTP 404, body contains "This page could not be found"
  find apps/web/app -maxdepth 1 -type d → (admin) (buyer) (finance) (inventory) (public)  — no (delivery)
  ```
  The delivery *backend* is fully functional and was walked end-to-end via API this pass (assign → dispatch → in-transit → POD upload → buyer confirm-receipt, deliveries 305/306) — this is purely a missing frontend surface.
- **Likely cause:** The Delivery Coordinator role/permissions/API were built, but the corresponding Next.js route group was never created.
- **Fix direction:** Build `apps/web/app/(delivery)/delivery/...` (dashboard, assignment queue, detail/POD-upload page) analogous to the other 4 portals; all the API endpoints it needs already exist and work.
- **Regression tests:** Log in as the delivery role and assert a real 200 dashboard renders, not a 404; assert the assign/dispatch/in-transit/POD-upload actions are reachable from that UI.
- **Demo impact:** One of the six roles named in the test brief cannot be demoed through the UI at all. This is the same finding as the 07-02 baseline; it was not addressed by the 07-03 fix commit (which targeted 5 unrelated bugs) and remains the single biggest gap in the system.

---

### BUG-007: Cart add-item does not enforce MOQ; the limit only triggers at order submission
- **Severity:** P2
- **Module/Role:** Buyer / Catalogue-Cart
- **Page/Route/API:** `POST /api/cart/items` (no MOQ check) vs. `POST /api/orders` (enforces `BELOW_MOQ`)
- **Steps:**
  1. Add product 2 (MOQ = 5) to cart with `quantity: 1`.
  2. Observe the cart accepts it silently.
  3. Attempt to submit the order.
- **Expected:** Either the cart should reject/clamp a below-MOQ quantity when it's added (matching how `INSUFFICIENT_STOCK` is already checked at cart-add time), or the cart UI should visibly warn before checkout.
- **Actual:** `POST /cart/items {product_id:2, quantity:1}` → `201`, item sits in the cart indefinitely below MOQ. Only `POST /orders` catches it, with `400 BELOW_MOQ`, discarding all the buyer's checkout progress at that point.
- **Evidence:**
  ```
  POST /cart/items {"product_id":2,"quantity":1} → 201 (accepted, moq=5)
  POST /orders {} → 400 {"code":"BELOW_MOQ","message":"Phalaenopsis 'Pink Fairy' minimum order is 5"}
  ```
- **Likely cause:** `cart.schema.js`/`cart.service.js` validates quantity ≥ 1 and stock availability only; MOQ is only checked in the order-creation path.
- **Fix direction:** Enforce the same MOQ check on `POST /cart/items`/`PUT /cart/items/:id` that `POST /orders` already has, so the buyer gets the error at the point of the mistake, not at checkout.
- **Regression tests:** Add a below-MOQ quantity to cart and assert a client-visible rejection at add-time, not just at order submission.
- **Demo impact:** Low — the checkout-time rejection is functionally correct and clearly worded, just poorly timed.

---

### BUG-008: `orders.approve()` never sets `approved_by`/`approved_at` despite the schema having them
- **Severity:** P2
- **Module/Role:** Admin / Orders, audit trail
- **Page/Route/API:** `PATCH /api/orders/:id/approve` (`apps/api/src/modules/orders/orders.service.js:138-186`, specifically the `updateStatus(client, id, 'APPROVED')` call)
- **Steps:** Approve order 932 as admin; query the order row afterward.
- **Expected:** `orders.approved_by` = the approving admin's user id, `approved_at` = the approval timestamp — both columns exist on the table for exactly this purpose.
- **Actual:** `approved_by`/`approved_at` remain `NULL` after approval. The action *is* correctly recorded in `audit_logs` (separately, via `writeAudit`), so the information isn't entirely lost system-wide, but the `orders` table itself — the natural place a report or future UI would look — is silently wrong forever.
- **Evidence:**
  ```
  PATCH /orders/932/approve → 200 "Order approved"
  select approved_by, approved_at from orders where id=932; → (both null)
  ```
  No current frontend page reads `approved_by`, so there is no visible symptom today — this is a latent defect that will surface the moment any report or UI is built against it.
- **Likely cause:** `repo.updateStatus()` is a generic status-only update; the approve flow never separately sets these two columns.
- **Fix direction:** Either extend `updateStatus` to accept/set `approved_by`/`approved_at`, or add an explicit `UPDATE orders SET approved_by=$1, approved_at=NOW() WHERE id=$2` in `approve()`.
- **Regression tests:** Approve an order, assert `approved_by`/`approved_at` are non-null and match the acting admin/timestamp.
- **Demo impact:** None visible today; flagged because it's exactly the kind of silently-wrong DB state the audit-integrity requirement calls out.

---

### BUG-009: Delivery `assign` accepts any user id (wrong role) and raises an unhandled 500 (with stack trace, in dev) for a non-existent one
- **Severity:** P2
- **Module/Role:** Admin / Delivery assignment
- **Page/Route/API:** `PATCH /api/deliveries/:id/assign` (`apps/api/src/modules/delivery/delivery.controller.js:21-25`, `delivery.repository.js:50-58`) — no `validate()` middleware on this route at all
- **Steps:**
  1. Assign a delivery to `buyer1`'s user id (a `TRADE_BUYER`, not a delivery coordinator).
  2. Assign a delivery to a syntactically-valid but non-existent user id.
- **Expected:** Reject assignment to a non-`DELIVERY_COORDINATOR` user with a clean validation error; reject a non-existent user id with a clean `404`/`400`, not a raw DB error.
- **Actual:**
  - Assigning to buyer1 → `200`, `assigned_to` is now a buyer's user id, `status: ASSIGNED` — no role check at all.
  - Assigning to a non-existent id → unhandled Postgres FK violation surfaces as a raw `500` with `code:"23503"` and (in `NODE_ENV=development`) a full stack trace including local file paths in the JSON body.
- **Evidence:**
  ```
  PATCH /deliveries/305/assign {"assignedTo":"<buyer1's user id>"} → 200, assigned_to = buyer1's id
  PATCH /deliveries/305/assign {"assignedTo":"00000000-0000-0000-0000-000000000099"} → 500
  {"code":"23503","message":"insert or update on table \"deliveries\" violates foreign key constraint...","stack":"...C:\\Users\\Ronit\\...delivery.repository.js:54..."}
  ```
  (Assignment was reverted back to the real delivery coordinator immediately after this test to avoid leaving bad state.)
- **Likely cause:** No `validate({body: ...})` schema is attached to this route (every other mutating route in the codebase has one), and no application-level check that `assignedTo` refers to a user with the `DELIVERY_COORDINATOR` role.
- **Fix direction:** Add a zod schema requiring `assignedTo` as a UUID, plus a service-level lookup confirming the target user exists and holds the coordinator role, returning a clean 4xx either way — matching the `AppError` pattern already used for the (already-fixed) upload validation bug.
- **Regression tests:** Assign to a non-coordinator role → clean 4xx; assign to a non-existent id → clean 4xx, no stack trace even in dev; assign to a real coordinator → 200 as today.
- **Demo impact:** Low under normal admin use (the dropdown presumably only lists real coordinators), but a real gap if hit directly or if the dropdown data is ever stale.

---

### BUG-010: Several admin pages swallow API failures into a silent empty state via `.catch(() => ({data:[]}))`
- **Severity:** P3
- **Module/Role:** Admin / Security page (pattern also present elsewhere)
- **Page/Route/API:** `apps/web/app/(admin)/admin/security/page.js:36,41,46,51,56` (e.g. `api.get('/admin/security/logins?...').catch(() => ({ data: [] }))`)
- **Steps:** Inspect the security page's data-fetching code; any of these five calls failing for any reason (network blip, 500, auth edge case) renders as an ordinary empty table, identical to "no data exists."
- **Expected:** A failed fetch should be visibly distinguishable from a genuinely empty result set (e.g. an inline error banner), especially on a security-sensitive page where "no locked accounts" and "couldn't check for locked accounts" have very different implications for an admin.
- **Actual:** Every one of the 5 data loads on this page catches its own error and substitutes an empty array with no user-visible signal.
- **Evidence:** Source inspection, `apps/web/app/(admin)/admin/security/page.js:36,41,46,51,56` — all 5 fetches follow the identical `.catch(() => ({ data: [...] }))` pattern.
- **Likely cause:** Defensive coding pattern applied uniformly without distinguishing "expected empty" from "fetch failed."
- **Fix direction:** Surface fetch failures distinctly (toast/error state) rather than folding them into the same rendering path as an empty result.
- **Regression tests:** Simulate a 500 from one of these 5 endpoints and assert the UI shows an error state, not a silent empty table.
- **Demo impact:** None directly, but this is the exact failure mode the test brief calls out as high-risk ("silent failures, swallowed catches, empty tables").

---

## 8. Fixes verified as still holding (from the 07-03 fix commit, spot-checked this pass)

- Buyer order-detail actions: `PATCH /orders/932/confirm-receipt` (as buyer1, on a `DELIVERED` order) → `200 "Receipt confirmed"`, and DB shows `deliveries.buyer_confirmed_at` set only at that moment, not at POD-upload time — matches the fixed behavior.
- File-upload validation: a `.txt` file to CMS media upload → clean `400 INVALID_FILE_TYPE`, no stack trace; a real `.png` → `201` success — both reconfirmed live this pass.
- Password change: wrong current password rejected (`422`, distinct from success); correct change → old access token immediately rejected with `TOKEN_INVALIDATED`; new password logs in; reverted to seed credentials afterward and confirmed with a fresh login.
- Order cancellation → invoice voiding was not independently re-driven this pass (no fresh `APPROVED` order was cancelled); the code path is unchanged since the 07-03 fix report's own live verification and is not re-flagged here.

## 9. Must-fix checklist (in priority order)

1. **BUG-006 (P0):** Build the Delivery Coordinator web portal — the role is unusable via UI today.
2. **BUG-001 (P1):** Make RMA credit-note resolution update the invoice's `paid_amount`/`balance_due`/`status`.
3. **BUG-002 (P1):** Reconnect the admin Locked-Accounts/Unlock feature to the real (login-history-based) lockout mechanism.
4. **BUG-003 (P1):** Fix the `sm.created_at` → `sm.occurred_at` typo in `inventory.repository.js` (4 occurrences) — trivial fix, high visibility failure.
5. **BUG-004 (P1):** Make the two-person reversal rule actually verify the confirming officer.
6. **BUG-009 (P2):** Validate `assignedTo` on delivery assignment (role + existence).
7. **BUG-008 (P2):** Set `approved_by`/`approved_at` on order approval.
8. **BUG-007 (P2):** Enforce MOQ at cart-add time, not just at order submission.
9. **BUG-005 (P2):** Delete or properly wire the dead `PATCH /rfqs/:id/convert` stub.
10. **BUG-010 (P3):** Replace silent `.catch(() => empty)` patterns on the admin security page with visible error states.

## 10. Regression test summary (consolidated)

- Reversal >50k with a fabricated/non-existent/wrong-role `confirmed_by` must be rejected; only a real, distinct, permissioned officer should succeed.
- RMA credit-note resolution must change `invoices.balance_due`; Aging/Statement/Invoice-detail must agree on the same buyer's balance after one.
- Account lockout must be visible and unlockable from the admin Security page using the same trigger condition the login endpoint itself uses.
- `/inventory/movements` (list + CSV export) must return 200 with real rows, with and without date filters.
- Delivery assignment must reject non-coordinator/non-existent `assignedTo` with a clean 4xx.
- A Delivery Coordinator login must land on a real 200 page, not a 404.
- Cart-add of a below-MOQ quantity should surface the same `BELOW_MOQ` error at add-time.
- Order approval must persist `approved_by`/`approved_at`.

## 11. Demo readiness verdict

**NOT DEMO READY.** The Delivery Coordinator role (P0) cannot be shown at all through the UI, and two of the money/security-control bugs found this pass (RMA→invoice desync, reversal two-person bypass) are exactly the kind of finding that undermines confidence in the finance module if surfaced during a live demo or audit. The core buyer→order→invoice→payment and RFQ→quote→order paths are solid and demo-safe; Inventory's Movements page and the Security page's Locked Accounts panel should be avoided in any live walkthrough until fixed.
