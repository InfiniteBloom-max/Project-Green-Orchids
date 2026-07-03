# Project Green — Final Presentation Strategy & Focus Plan

**Prepared:** 2 July 2026 · **Final deliverable window:** per Progress Report 02 (04–12 July)
**Goal:** maximise the Final 60% by focusing on what examiners actually grade, not on building more features.

---

## 1. How the final 60% is actually earned

| Component | Weight | What it really tests |
|---|---|---|
| Report Submission | 10% | Professional documentation, honest scope, evidence |
| Demonstration | 15% | A **smooth, rehearsed** golden path — not feature count |
| **Code Evaluation & Modification** | **25%** | Can each member **navigate, explain, and change the code live** |
| Individual Contribution (Git) | 10% | Per-member commit history that maps to owned modules |

**The single most important fact in this plan:** Code Evaluation & Modification (25%) is worth
*more than the demo itself*. A grand project that nobody can modify live scores worse than a
smaller project where every member can open the right file in 20 seconds and change it.
Section 5 is therefore the longest section here — treat it as the core of your prep.

Second fact: Demo (15%) + Report (10%) are presentation-layer marks. Poor UI and a stumbling
demo will drag *both* down even if the code is good — which is exactly your instinct. Section 4
covers the UI revamp.

---

## 2. Feature priority — what to polish vs. what to leave

Ranked by (a) what the panel already asked about, (b) what an industry-minded lecturer probes,
(c) demo impact per hour of work.

### Tier 1 — The panel already asked. These MUST be flawless.

#### 2.1 Regex / input validation (asked directly last month)

**Current honest state:** the backend already validates with zod regex —
`apps/api/src/modules/auth/auth.schema.js` has the password policy
(≥10 chars, uppercase, digit, symbol via three `.regex()` rules) and the 6-digit OTP rule
(`/^\d{6}$/`). **But the frontend has no client-side regex validation at all**, so during a demo
the examiner never *sees* validation working — it looks absent even though it exists.

Work to do (highest marks-per-hour item in this whole plan):

1. **Add live inline validation to the register / profile / product forms** — validate on blur,
   red border + specific message under the field. Mirror the exact server rules so client and
   server never disagree:
   - Email: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
   - Sri Lankan phone: `/^(?:\+94|0)?7\d{8}$/` (mobile) — a *local* regex is an easy
     "industry thinking" point
   - Business reg no: `/^(PV|HS|SP|GA)?\s?\d{3,7}$/i` style pattern
   - Postal code: `/^\d{5}$/`
   - SKU (admin product form): `/^[A-Z]{2,4}-\d{3,5}$/`
2. **Password strength meter** on register — visually shows each regex rule turning green as
   it's satisfied. This is the single most *demonstrable* validation UI that exists; examiners
   love it because it makes the invisible rule visible.
3. **Prepare the two-layer defence answer:** "Client-side regex gives instant feedback (UX);
   the same rules re-run server-side in zod schemas because the client can be bypassed —
   here is the schema file." Then open `auth.schema.js` on screen. That answer + that file
   is exactly what they were fishing for last month.

#### 2.2 Delete / destructive-action confirmation (asked directly last month)

**Current honest state: mostly done.** `apps/web/src/components/ui/ConfirmDialog.jsx` exists
and is already wired into ~12 pages (admin products, tiers, suppliers, users, CMS, buyers,
orders, RMA, deliveries; buyer orders and RFQ). Commit `49356df` covers it.

Remaining polish (small, high perceived value):

1. **Type-to-confirm for the highest-stakes deletes** (delete product, delete user, delete
   supplier): user must type the record name or "DELETE" before the button enables — this is
   the pattern GitHub/AWS use, and saying so in the viva lands well.
2. **Show consequences in the dialog** ("This supplier has 14 linked products") instead of a
   generic "Are you sure?" — you already block tier deletion on FK; surface that message
   nicely rather than as a raw error.
3. **Prefer soft-delete language where true** — products are `DISCONTINUED`/`HIDDEN`, not
   erased. Industry answer: "we never hard-delete records with financial history; we
   deactivate, and the audit log keeps the trail."

### Tier 2 — The golden demo path (the 15% demo lives or dies here)

Test end-to-end daily; fix breaks here before doing anything else:

1. **Login + role-based redirect** (all 5 roles) — first thing shown, must be instant.
2. **Public + buyer catalogue** — search, filters, product images (see Section 4), MOQ chip,
   tier price. This is the screen with the most on-screen time.
3. **Cart → order submit → admin approval with stock reservation** — the "this is B2B, not a
   shop" proof. Have the credit-limit-exceeded rejection ready to show on purpose.
4. **Invoice + partial payment → balance and status update** — record two partial payments
   live and show the invoice flip to PAID at exactly zero.
5. **RFQ → quote → convert to order** — the flagship differentiator; even if only the happy
   path works, rehearse that one path until it's boring.

### Tier 3 — Show only if asked (working ≠ rehearsed)

- Admin security panel / audit logs / login history — a killer *answer* to security questions,
  not a scripted segment.
- Price-change governance and price history.
- Reports dashboard — show 2–3 populated charts, never scroll into an empty one.

### Deliberately out of the demo script

- Bloom Reaction, delivery POD upload flow, RMA edge automation, email cron breadth.
  If they exist, fine; do **not** spend the remaining days fixing them. Frame anything
  unfinished with the implementation plan's language: "deferred to Phase 4, documented" —
  a deliberate cut reads as engineering judgement; a broken demo reads as failure.

---

## 3. Why these are the "industry" features (the lens your lecturers use)

When a lecturer says "industry-based", they are checking whether you understand what
production systems must never get wrong. Map your features to those instincts and *say the
mapping out loud* in the presentation:

| Examiner instinct | Your feature | One-line defence |
|---|---|---|
| "Garbage in destroys databases" | Regex validation, both layers | "Client for UX, zod server-side because clients lie" |
| "Users fat-finger destructive actions" | ConfirmDialog + type-to-confirm | "Same pattern as GitHub repo deletion" |
| "Money must balance to the cent" | Partial payments, balance_due | "PAID only at exactly 0.00; corrections are reversals, never edits" |
| "Two users, one last item in stock" | FOR UPDATE + reserved_qty | "Second transaction waits, re-reads, rolls back — no oversell" |
| "Who changed this and when?" | Audit log, price history | "Append-only at the DB grant level — even admins can't edit history" |
| "Can users see each other's data?" | Buyer-scoped queries | "buyer_id is a mandatory repository filter — IDOR impossible by construction" |

That table is effectively your Q&A cheat sheet. Every member should memorise the one-liners.

---

## 4. UI revamp — assets you already own, wired in cleverly

You are right that a plain UI silently caps the demo mark. The good news: **the assets already
exist and are sitting unused.** `docs/image-assets/generated-image-assets/` holds 40+ production-quality
images (10 catalogue product shots, 8 product-detail gallery shots, 5 hero/landing, 5 about,
5 blog, 5 contact) while `apps/web/public/` contains only 3 files, and `ProductCard.jsx`
falls back to a 🌿 emoji whenever `imageUrl` is missing — which is most products.

### 4.1 Asset wiring (one focused day of work)

1. Copy the asset folders into `apps/web/public/images/` (products, hero, about, gallery).
2. **Seed the 10 named orchid products with their matching catalogue images**
   (`01-phalaenopsis-moth-white.png` → the Phalaenopsis White product, etc.) so the first
   catalogue page the panel sees is fully illustrated. For the remaining seeded products,
   assign gallery/category images round-robin — no emoji fallbacks visible on page one.
3. Landing page: use `01-hero-orchid-greenhouse.png` (or keep `hero.mp4` with
   `hero-poster.jpg`) + 2–3 of the home-landing images as section backgrounds.
4. Product detail page: wire the 8 `product-detail-gallery` images as a real thumbnail
   gallery on the flagship demo product.

### 4.2 Polish checklist (the "x.com showcase" feel comes from these, not from more features)

- **Consistency beats decoration:** one accent colour, one border radius, one shadow level,
  consistent paddings. Audit every demo-path screen against the same spacing scale.
- **No dead states on screen:** loading skeletons (not spinners) on the catalogue and
  dashboards; designed empty states with an illustration + CTA instead of blank tables.
- **Micro-interactions:** hover lift on product cards (already there), button loading states,
  toast on every mutation success. Cheap, high perceived quality.
- **Status chips everywhere** — coloured order/invoice/RFQ status badges make screens read
  as "a real system" in screenshots and on the projector.
- **Projector test:** run the demo once on a low-contrast projector profile; bump font sizes
  and contrast where anything squints. Also: favicon + page titles ("ORCHIDS — Admin"), no
  browser console errors visible if they ask you to open devtools.
- **Screenshot pass for the report:** after the polish, recapture every report screenshot in
  one session so the report and the live demo look identical (mismatched screenshots invite
  "is this real?" questions).

What NOT to do: no new pages, no animation libraries, no redesign of working layouts. Reskinning
risk is regression risk in the final week.

---

## 5. Code Evaluation & Modification — the 25% (your biggest single mark)

Your worry is correct: the system is large (a monorepo with ~17 API modules and 5 role
portals), and "large" is a liability in a live modification exam *unless you prepare a map*.
Examiners in this format typically do three things:

1. **"Show me where X happens"** — locate code under time pressure.
2. **"Explain why you did it this way"** — defend a design decision.
3. **"Change it"** — a small live modification: add a field, change a rule, add a filter.

### 5.1 The codebase map (make this a one-page handout every member memorises)

```
apps/api/src/
  middleware/    auth.js rbac.js validate.js rateLimit.js audit.js errors.js upload.js
  modules/<name>/  *.routes.js → *.controller.js → *.service.js → *.repository.js + *.schema.js
  (17 modules: auth, users, buyers, suppliers, products, pricing, rfq, cart, orders,
   invoices, payments, rma, delivery, inventory, reports, notifications, cms, compat)
apps/web/
  app/(public|buyer|admin|finance|inventory)/...   ← one folder per role portal
  src/components/ui/       Button, Table, Modal, ConfirmDialog, FileUpload, ...
  src/components/domain/   ProductCard, StatusBadge, ...
  src/lib/                  api client, auth context
```

The narrative that turns size into a strength: *"Every module has the same five files —
routes, controller, service, repository, schema. If you can modify one module you can modify
all seventeen."* Say this sentence before they ask.

### 5.2 Modification drills — rehearse these 10 (2 per member, plus swaps)

Each member should perform their drills live at least twice this week, cold-start, timed to
under 10 minutes each:

| # | Likely exam task | Files touched |
|---|---|---|
| 1 | Add a regex rule (e.g. min length on `business_reg_no`) | `auth.schema.js` + register form |
| 2 | Add a field to the product form (e.g. `care_notes`) | migration, `products.schema/service/repository`, admin product form |
| 3 | Change password policy to 12 chars | `auth.schema.js` + frontend mirror + strength meter |
| 4 | Add a status filter to the admin orders table | orders `repository` (WHERE clause) + orders page filter chip |
| 5 | Change the lockout threshold from 5 to 3 | auth service (+ settings if externalised) |
| 6 | Add a confirmation dialog to an action that lacks one | the page + `ConfirmDialog.jsx` (import pattern) |
| 7 | Add a column to a report / new KPI card | reports `service` SQL + dashboard page |
| 8 | Change MOQ behaviour (e.g. error copy or clamp rule) | cart/orders service + product detail stepper |
| 9 | Add an audit-log entry to an unaudited action | the module's service + `middleware/audit.js` pattern |
| 10 | Rename/limit a rate limit tier | `middleware/rateLimit.js` |

Rule for the drills: **speak while navigating** ("this is the orders module, the WHERE clause
lives in the repository layer, so…"). Half the mark is the explanation, not the diff.

### 5.3 Code hygiene sweep before evaluation day

- Delete or clearly quarantine dead code — the `compat` module especially: if it's still
  needed, add a README line inside it saying why; if not, remove it. An examiner opening a
  folder of confusing shims is the worst possible first impression.
- No commented-out blocks in the demo-path files; consistent naming; every module's five
  files present and non-empty.
- `README.md` at root must contain a 60-second "run it locally" that actually works
  (`start.bat` path) — examiners sometimes clone and run.

### 5.4 Member ↔ module ownership (feeds the Git 10% too)

Assign explicitly and put it in the report — this doubles as the individual-contribution story:

| Member | Owns (can explain + modify live) | Backup |
|---|---|---|
| Ronith (PM) | auth, users, middleware (RBAC/audit), settings | Sithum |
| Nadeera (SE) | orders, cart, invoices, payments (the money path) | Sithum |
| Sithum (BE/QA) | products, pricing, inventory, rma + test scripts | Nadeera |
| Yasali (FE/QA) | all buyer + finance portal pages, ui components | Rashandi |
| Rashandi (UI/UX/Docs) | public pages, cms, admin portal polish, report + assets | Yasali |

**Git evidence rules from today until submission:** every member commits to their own modules
from their own account; small commits with `module: what changed` messages; no bulk
"final fixes" commit from one person. If historical commits are lopsided, the *final two weeks*
of clean per-member history plus the ownership table is your recovery story.

---

## 6. Demo script skeleton (15%) — plan the 20 minutes, not the features

1. **60-second framing:** the grading table's language — "B2B wholesale platform: RFQ
   negotiation, credit terms, tiered pricing — five workflows consumer e-commerce doesn't have."
2. **Golden path (10 min):** register (show the strength meter + a regex rejection **on
   purpose**) → admin approves buyer → catalogue (images!) → cart → order → admin approval →
   invoice → two partial payments → PAID.
3. **Panel-bait moments (3 min):** delete a product → type-to-confirm dialog; open the audit
   log showing the actions you just performed. These directly answer last month's questions
   before they're re-asked.
4. **Each member presents their own module for ~2 minutes** — matches the ownership table and
   visibly feeds the individual-contribution mark.
5. **Honest close:** the Phase-4 deferred list, presented as engineering judgement.

**Risk register (do all of these):** seed the demo DB from a pinned dump the night before;
rehearse the full script twice, once on the venue projector or worst laptop available; record a
backup screen-capture of the golden path in case the live run breaks; know the recovery line
for any failure ("that path degrades to the manual workflow — let me show the manual recording").

---

## 7. The next ~10 days, in priority order

| Days | Work | Grading target |
|---|---|---|
| 1–2 | Frontend regex validation + strength meter; type-to-confirm dialogs | Code eval + demo (the two asked questions) |
| 2–3 | Wire image assets into catalogue/landing/product-detail; polish pass on demo-path screens | Demo 15% |
| 3–5 | Stabilise golden path end-to-end; fix only bugs on that path | Demo 15% |
| 4–7 | Modification drills ×10, each member timed; code hygiene sweep; codebase map handout | **Code eval 25%** |
| 6–8 | Per-member commits to owned modules; ownership table into report | Git 10% |
| 8–10 | Report screenshots recaptured post-polish; demo rehearsal ×2; backup capture; pinned demo DB dump | Report 10% + Demo 15% |

**One sentence to keep the team honest:** every hour spent on a feature that is not in the
golden path or the drill list is an hour taken from the 25%.
