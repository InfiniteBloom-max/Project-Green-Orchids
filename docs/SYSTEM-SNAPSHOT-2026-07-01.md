# System Snapshot — 2026-07-01 01:00 AM

Session scope: wire up real outbound email, close out the last K-branding references, fix a real seed-data bug that silently blocked the order-approval demo path, do a design consistency pass on list/detail pages, add a one-click local launcher, and cut this snapshot. This document covers **only what changed in this session** — earlier sessions already fixed the RBAC permission bug, transaction-client bug, SQL column-name bugs, the delivery module, and the initial K-branding pass (see `docs/BUGFIX_PROOF.md` for that history).

## Bugs fixed this session (5)

1. **Mailer never sent real email outside `NODE_ENV=production`** — [`apps/api/src/config/mailer.js:41`](../apps/api/src/config/mailer.js#L41). `getTransporter()` gated the real `nodemailer` transport on `env.isProd`; in dev it always fell back to the console-log transport even with valid SMTP credentials configured. Changed the gate to `env.SMTP_USER && env.SMTP_PASS`, so any environment with real credentials sends real mail. Verified with a live send to `ronithrashmikara@gmail.com` (SMTP accepted, message-id returned).

2. **Seed order-aging formula was inverted** — [`scripts/seed.js:526`](../scripts/seed.js#L526). Order lifecycle stage was computed as `Math.floor((DAYS_OF_ORDERS - day) / 12)` where `day` is "days ago" (from `daysAgo(day)`, `d.setDate(d.getDate() - days)`). That formula gives orders placed **yesterday** the highest stage index (DELIVERED, fully paid) and orders placed **90 days ago** the lowest (DRAFT) — backwards. Recently-placed orders were showing up already delivered/paid instead of sitting in `PENDING_APPROVAL`, and 90-day-old orders never left DRAFT. Fixed to `Math.floor(day / 12)` so older orders progress further, newer orders are earlier in the flow. This is what makes the admin "approve order" action have anything realistic to act on.

3. **Buyer credit caps were unrealistic relative to seeded order volume** — [`scripts/seed.js:223-226`](../scripts/seed.js#L223-L226). Tier `credit_cap` values (SILVER 500k / GOLD 1M / PLATINUM 2.5M LKR) were an order of magnitude below the outstanding balances the 90-day/5-buyer order volume actually generates (~20-27M LKR observed outstanding per active buyer). Every buyer's live `approve()` credit check (`apps/api/src/modules/orders/orders.repository.js:165-176`, `outstanding + orderTotal <= credit_limit`) would fail for effectively all pending orders. Raised caps to 40M / 60M / 90M LKR. After re-seeding: all 6 active buyers have outstanding + full pending-order total comfortably under their cap (verified via direct query — 125 `PENDING_APPROVAL` orders across 6 buyers, largest single buyer exposure ~50M of 90M limit).

4. **Duplicate/conflicting keys in `apps/api/.env`** — the file had `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `CORS_ORIGIN`, `PORT`, and `ENABLE_CRON` each defined twice with different values (dotenv silently uses the first occurrence, so the second block was dead). Rewrote the file as a single clean block; added `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`, and set `ENABLE_CRON=true`.

5. **Redundant/dead double-confirmation on payment reversal** — [`apps/web/app/(finance)/finance/invoices/[id]/page.js:47`](../apps/web/app/(finance)/finance/invoices/[id]/page.js#L47) called `handleReversePayment` from inside an already-explicit `Modal` confirmation step, but the handler *also* called the browser's native `confirm()` — a leftover double gate. Removed the redundant `confirm()`.

## Rough edges cleaned up (not correctness bugs, but real)

- **K-branding**: last "K ORCHIDS"/"K Orchids" references removed from 26 email templates (`apps/api/src/templates/*.hbs`) and `LICENSE`. Left untouched: `catalogue-products.csv` and `apps/api/.env`'s Cloudinary references to cloud name `k-orchids` — those are functional asset/API identifiers, not branding copy, and renaming them would break existing image URLs.
- **Raw `window.confirm()` calls replaced with the app's `ConfirmDialog` component** for a consistent dark-glass confirmation UI instead of the native browser dialog:
  - `apps/web/app/(admin)/admin/tiers/page.js` (delete-tier action)
  - `apps/web/app/(buyer)/buyer/orders/[id]/page.js` (cancel-order action)
- **`admin/tiers` page brought up to the rest of the app's visual standard** — was still on an older, plainer layout (bare `<h1>`, a flat `bg-yellow-50` warning `<div>`) while every other admin page had already been redesigned. Restyled the warning banner to the app's `rounded-2xl border-amber-100 bg-amber-50 text-amber-700` convention.
- **New shared `PageHeader` component** (`apps/web/src/components/domain/DashboardUI.jsx`) — same visual language as the existing `DashboardHero` (used on the 4 main dashboards) but sized for list/detail pages: eyebrow/title/description, optional `back` link, optional `actions` slot, tone-matched per portal (admin=emerald, buyer=violet, finance=sky, inventory=amber).
- **Rolled `PageHeader` out to 34 list/detail pages** across all four portals (admin: buyers, buyers/[id], pricing/approvals, products, reports, rfqs, rfqs/[id], rma, rma/[id], security, suppliers, tiers, users; buyer: account, cart, catalogue, invoices, invoices/[id], orders, orders/[id], returns, returns/new, returns/[id], rfq, rfq/new, rfq/[id], statements; finance: aging, credit, invoices, invoices/[id], payments, statements; inventory: alerts, movements, products), replacing plain `<h1 className="text-2xl font-bold">` headers with the consistent component. `buyer/catalogue/[id]` was deliberately left alone — its `<h1>` is the product name in the PDP layout, not a page header. All 37 touched files were parsed with `@babel/parser` (JSX plugin) after editing to confirm no syntax breakage; a full `next build` was not run (see "Known gaps" — this box OOMs on `next dev`/cold builds without the documented memory workaround).
- **`start.bat`** added at the repo root — starts the API (`node src/index.js`), builds+starts the web app with `NODE_OPTIONS=--max-old-space-size=4096` (per the documented dev-server OOM workaround — `next dev` cannot compile all ~50 routes on this box), polls port 3000, then opens the browser.

## Module status

| Module | Status | Notes |
|---|---|---|
| Auth (login/register/refresh) | Working end-to-end | Unchanged this session |
| Admin — buyers, products, orders, RFQs, RMA, suppliers, users, security | Working end-to-end | Design-consistency pass applied |
| Admin — tiers | Working end-to-end | Fixed native-confirm + banner styling this session |
| Buyer portal (catalogue, cart, orders, RFQ, returns, invoices, statements, account) | Working end-to-end | Design-consistency pass applied |
| Finance (invoices, payments, aging, credit, statements) | Working end-to-end | Payment-reversal double-confirm bug fixed |
| Inventory (products, alerts, movements) | Working end-to-end | Design-consistency pass applied |
| Delivery module | Working (merged prior session) | Not touched this session |
| Order approval flow (credit check) | **Now demoable** | Was silently blocked for ~all pending orders before this session's seed fixes |
| Outbound email (order/RFQ/RMA/payment notifications, cron digests) | **Now real** | Was console-log-only outside `NODE_ENV=production`; live SMTP confirmed working via Gmail app-password auth |
| CMS | Working | Not touched this session |

## Known gaps

- `next build`/`next dev` were not run to completion in this session (documented OOM risk on this box — see `start.bat`'s comment and the project runbook). The 34 edited pages were syntax-checked with `@babel/parser`, not type/runtime-verified in a browser. Recommend running `start.bat` and clicking through each portal once before considering the design pass fully verified.
- The design pass covered dashboards (already polished from an earlier session) and headers on list/detail pages. It did **not** touch table density, filter bar styling, form layouts, or in-page card contents on those pages — scope was header/empty/loading-state consistency, not a full visual rebuild of every screen.
- `ENABLE_CRON=true` is now set, but the cron job's actual schedule/behavior (`apps/api/src/jobs/stockCheck.js` and any digest jobs) was not independently re-verified beyond confirming the API boots cleanly with it on.
- Credit caps (40M/60M/90M LKR) were sized to comfortably clear the *current* seeded volume with headroom, not derived from a real-world benchmark — if `DAYS_OF_ORDERS`/`ORDERS_PER_DAY_*` in `scripts/seed.js` are changed later, these caps should be re-checked against the new outstanding-balance totals.
- Two SMTP env values are real secrets committed to `apps/api/.env` (a gitignored file, not tracked in this repo's history) — flagging for awareness, not a code bug.
