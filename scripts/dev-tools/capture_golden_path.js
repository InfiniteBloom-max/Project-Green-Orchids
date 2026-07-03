// Golden-path demo recording: register -> admin approve -> catalogue -> cart ->
// order -> admin approve order -> invoice -> two partial payments -> PAID ->
// RFQ quote -> buyer convert. Each phase is recorded as its own clip (robust to
// a single phase failing) then concatenated into one continuous video by the
// caller (see scripts/concat_golden_path.js).
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

// Registration gates login behind an emailed OTP (real security feature, can't
// be scripted from the browser side). For this demo recording only, mirror
// exactly what auth.repository.js's verifyEmail does after a correct OTP.
async function markEmailVerified(email) {
  const client = new Client({ connectionString: 'postgresql://postgres:123456789@localhost:5432/project_green' });
  await client.connect();
  await client.query(`UPDATE users SET status = 'ACTIVE', email_verified_at = NOW() WHERE email = $1`, [email]);
  await client.end();
}

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'output', 'videos', 'golden-path');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE = 'http://localhost:3000';
fs.mkdirSync(OUT, { recursive: true });

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function typeSlow(el, value) { await el.click({ clickCount: 3 }); await el.type(value, { delay: 35 }); }

async function open(browser, route) {
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });
  await page.goto(BASE + route, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await wait(1500);
  return { context, page };
}
async function record(page, filename) {
  return page.screencast({ path: path.join(OUT, filename), format: 'mp4', fps: 15, quality: 35, scale: 0.85 });
}
async function login(page, email, password, expectedPathPrefix) {
  await page.waitForSelector('input[type="email"]', { timeout: 60000 });
  await typeSlow(await page.$('input[type="email"]'), email);
  await typeSlow(await page.$('input[type="password"]'), password);
  await page.click('button[type="submit"]');
  await page.waitForFunction((p) => location.pathname.startsWith(p), { timeout: 60000 }, expectedPathPrefix);
  await wait(2000);
}
async function finish(context, page, recorder) {
  try { await page.mouse.move(1180, 760, { steps: 10 }); } catch {}
  await wait(800);
  try { await recorder.stop(); } catch {}
  await context.close();
}
async function runClip(name, fn) {
  console.log(`\n=== [${name}] starting ===`);
  const t0 = Date.now();
  try {
    await Promise.race([fn(), wait(150000).then(() => { throw new Error('clip timeout'); })]);
    console.log(`=== [${name}] OK (${((Date.now() - t0) / 1000).toFixed(1)}s) ===`);
    return true;
  } catch (e) {
    console.log(`=== [${name}] SKIPPED: ${e.message} ===`);
    return false;
  }
}

const STAMP = Date.now();
const NEW_BUYER_EMAIL = `demo.buyer.${STAMP}@example.invalid`;
const BUSINESS_NAME = 'Golden Path Demo Florals';

// 01: landing page
async function c01_landing(browser) {
  const { context, page } = await open(browser, '/');
  const rec = await record(page, '01_landing.mp4');
  await page.evaluate(() => window.scrollTo({ top: 500, behavior: 'smooth' }));
  await wait(2000);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  await wait(1500);
  await finish(context, page, rec);
}

// 02: register a new trade buyer
async function c02_register(browser) {
  const { context, page } = await open(browser, '/register');
  const rec = await record(page, '02_register.mp4');
  const val = (label, value) => page.evaluate((l, v) => {
    const lab = [...document.querySelectorAll('label')].find(x => x.textContent.trim().toLowerCase().startsWith(l.toLowerCase()));
    const input = lab?.querySelector('input,textarea');
    if (!input) return false;
    const proto = input.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(input, v);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    return true;
  }, label, value);
  await val('Business name', 'Golden Path Demo Florals');
  await val('Business registration', 'PV 00123456');
  await val('Phone', '0771234567');
  await val('Email', NEW_BUYER_EMAIL);
  await val('Address', '12 Demo Lane, Colombo');
  await val('Password', 'Golden@Path123');
  await val('Confirm password', 'Golden@Path123');
  await wait(1500);
  const submitted = await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find((b) => /submit application/i.test(b.textContent));
    if (btn) { btn.click(); return true; }
    return false;
  });
  if (!submitted) throw new Error('Submit application button not found');
  await wait(3000);
  await finish(context, page, rec);
  await markEmailVerified(NEW_BUYER_EMAIL);
}

// 03: admin approves the new buyer
async function c03_adminApprove(browser) {
  const { context, page } = await open(browser, '/login');
  await login(page, 'admin@example.invalid', 'Staff@1234', '/admin');
  await page.goto(BASE + '/admin/buyers', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => document.body.innerText.toLowerCase().includes('buyer'), { timeout: 60000 });
  await wait(1500);
  const rec = await record(page, '03_admin_approve_buyer.mp4');
  await page.evaluate(() => {
    const tab = [...document.querySelectorAll('button,div,a')].find((x) => /pending/i.test(x.textContent.trim()) && x.textContent.trim().length < 30);
    if (tab) tab.click();
  });
  await wait(1500);
  const clicked = await page.evaluate((email) => {
    const row = [...document.querySelectorAll('tr')].find((r) => r.textContent.includes(email));
    const scope = row || document;
    const btn = [...scope.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Approve');
    if (btn) { btn.click(); return true; }
    return false;
  }, NEW_BUYER_EMAIL);
  if (!clicked) throw new Error('Approve button not found for demo buyer');
  await wait(1500);
  await page.evaluate(() => {
    // The row's "Approve" trigger button stays in the DOM while its modal is
    // open, and the modal's own confirm button is also labelled "Approve" —
    // the modal's is always the LAST match in DOM order.
    const btns = [...document.querySelectorAll('button')].filter((b) => b.textContent.trim() === 'Approve');
    const btn = btns[btns.length - 1];
    if (btn) btn.click();
  });
  await wait(3000);
  await finish(context, page, rec);
}

// 04: buyer logs in, browses catalogue, adds to cart, places an order
async function c04_catalogueToOrder(browser) {
  const { context, page } = await open(browser, '/login');
  const rec = await record(page, '04_catalogue_cart_order.mp4');
  await login(page, NEW_BUYER_EMAIL, 'Golden@Path123', '/buyer');
  await page.goto(BASE + '/buyer/catalogue', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => document.querySelectorAll('h4').length > 0, { timeout: 60000 });
  await wait(1500);
  const clicked = await page.evaluate(() => {
    const btns = [...document.querySelectorAll('button')].filter((b) => b.textContent.trim() === 'Add');
    if (btns.length) { btns[0].click(); return true; }
    return false;
  });
  if (!clicked) throw new Error('Add-to-cart button not found');
  await wait(1500);
  await page.goto(BASE + '/buyer/cart', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => document.body.innerText.toLowerCase().includes('cart'), { timeout: 60000 });
  await wait(1500);
  const openedCheckout = await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find((b) => /proceed to checkout/i.test(b.textContent));
    if (btn) { btn.click(); return true; }
    return false;
  });
  await wait(1200);
  if (openedCheckout) {
    await page.evaluate(() => {
      const btn = [...document.querySelectorAll('button')].find((b) => /^place order$/i.test(b.textContent.trim()));
      if (btn) btn.click();
    });
    await wait(3000);
    await page.waitForFunction(() => location.pathname.includes('/buyer/orders'), { timeout: 20000 }).catch(() => {});
    await wait(1500);
  }
  await finish(context, page, rec);
}

// 05: admin approves the order (stock reservation transaction)
async function c05_adminApproveOrder(browser) {
  const { context, page } = await open(browser, '/login');
  await login(page, 'admin@example.invalid', 'Staff@1234', '/admin');
  await page.goto(BASE + '/admin/orders', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => document.body.innerText.toLowerCase().includes('order'), { timeout: 60000 });
  await wait(1500);
  const navigated = await page.evaluate((businessName) => {
    // Rows have no click handler; navigation is via a hover-reveal "View" link
    // in the last cell (opacity-0 until hover, but still clickable via JS).
    // The orders table shows the buyer's business name, not their email.
    const rows = [...document.querySelectorAll('tbody tr')];
    const row = rows.find((r) => r.textContent.includes(businessName)) || rows[0];
    const link = row?.querySelector('a[href*="/admin/orders/"]');
    if (link) { link.click(); return true; }
    return false;
  }, BUSINESS_NAME);
  if (!navigated) throw new Error('No order row found');
  await page.waitForFunction(() => location.pathname.match(/\/admin\/orders\/.+/), { timeout: 30000 });
  await wait(1500);
  const rec = await record(page, '05_admin_approve_order.mp4');
  const clickedApprove = await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find((b) => /approve order/i.test(b.textContent));
    if (btn) { btn.click(); return true; }
    return false;
  });
  if (clickedApprove) {
    await wait(1000);
    await page.evaluate(() => {
      const btn = [...document.querySelectorAll('button')].find((b) => /^approve$/i.test(b.textContent.trim()));
      if (btn) btn.click();
    });
    await wait(3000);
  } else {
    await wait(2000);
  }
  await finish(context, page, rec);
}

// 06: finance records two partial payments -> invoice flips to PAID
async function c06_financePartialPayments(browser) {
  const { context, page } = await open(browser, '/login');
  await login(page, 'finance@example.invalid', 'Staff@1234', '/finance');
  await page.goto(BASE + '/finance/invoices', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => document.body.innerText.toLowerCase().includes('invoice'), { timeout: 60000 });
  await wait(1500);
  const navigated = await page.evaluate((businessName) => {
    const rows = [...document.querySelectorAll('tbody tr')];
    const row = rows.find((r) => r.textContent.includes(businessName)) || rows[0];
    if (row) { row.click(); return true; }
    return false;
  }, BUSINESS_NAME);
  if (!navigated) throw new Error('No invoice row found');
  await page.waitForFunction(() => location.pathname.match(/\/finance\/invoices\/.+/), { timeout: 30000 });
  await wait(1500);
  const rec = await record(page, '06_finance_partial_payments.mp4');

  async function recordPayment(amount) {
    const opened = await page.evaluate(() => {
      const btn = [...document.querySelectorAll('button')].find((b) => /record payment/i.test(b.textContent));
      if (btn) { btn.click(); return true; }
      return false;
    });
    if (!opened) return false;
    await wait(800);
    await page.evaluate((amt) => {
      const input = [...document.querySelectorAll('input[type=number]')][0];
      if (input) {
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, amt);
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }, amount);
    await wait(500);
    await page.evaluate(() => {
      const btn = [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Record');
      if (btn) btn.click();
    });
    await wait(2500);
    return true;
  }

  const balanceText = await page.evaluate(() => document.body.innerText.match(/Balance[^\d]*([\d,]+\.\d{2})/i)?.[1] || null);
  const balance = balanceText ? Number(balanceText.replace(/,/g, '')) : null;
  if (balance) {
    const half = Math.floor((balance / 2) * 100) / 100;
    await recordPayment(half);
    await recordPayment(balance - half);
  } else {
    await recordPayment(1);
  }
  await wait(2000);
  await finish(context, page, rec);
}

// 07: admin quotes the pre-seeded RFQ for buyer1
async function c07_adminQuoteRfq(browser) {
  const { context, page } = await open(browser, '/login');
  await login(page, 'admin@example.invalid', 'Staff@1234', '/admin');
  await page.goto(BASE + '/admin/rfqs', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => document.body.innerText.toLowerCase().includes('rfq'), { timeout: 60000 });
  await wait(1500);
  const navigated = await page.evaluate(() => {
    const rows = [...document.querySelectorAll('tbody tr')];
    const row = rows.find((r) => /RFQ-000009|submitted/i.test(r.textContent)) || rows[0];
    if (row) { row.click(); return true; }
    return false;
  });
  if (!navigated) throw new Error('No RFQ row found');
  await page.waitForFunction(() => location.pathname.match(/\/admin\/rfqs\/.+/), { timeout: 30000 });
  await wait(1500);
  const rec = await record(page, '07_admin_quote_rfq.mp4');
  await page.evaluate(() => {
    const inputs = [...document.querySelectorAll('input[type=number]')];
    inputs.forEach((inp) => {
      if (!inp.value || Number(inp.value) === 0) {
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(inp, '1050');
        inp.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
  });
  await wait(1200);
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find((b) => /send quote/i.test(b.textContent));
    if (btn) btn.click();
  });
  await wait(3000);
  await finish(context, page, rec);
}

// 08: buyer1 accepts the quote and converts it to an order
async function c08_buyerConvertRfq(browser) {
  const { context, page } = await open(browser, '/login');
  await login(page, 'buyer1@example.invalid', 'Buyer@1234', '/buyer');
  await page.goto(BASE + '/buyer/rfq', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => document.body.innerText.toLowerCase().includes('rfq'), { timeout: 60000 });
  await wait(1500);
  const navigated = await page.evaluate(() => {
    const rows = [...document.querySelectorAll('tbody tr')];
    const row = rows.find((r) => /quoted/i.test(r.textContent)) || rows[0];
    if (row) { row.click(); return true; }
    return false;
  });
  if (!navigated) throw new Error('No quoted RFQ row found');
  await page.waitForFunction(() => location.pathname.match(/\/buyer\/rfq\/.+/), { timeout: 30000 });
  await wait(1500);
  const rec = await record(page, '08_buyer_convert_rfq.mp4');
  // Step 1: "Accept Quote" opens a ConfirmDialog with its own "Accept quote" button.
  const openedAccept = await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find((b) => /^accept quote$/i.test(b.textContent.trim()));
    if (btn) { btn.click(); return true; }
    return false;
  });
  if (openedAccept) {
    await wait(1000);
    await page.evaluate(() => {
      // Both the page trigger and the dialog's own confirm button match this
      // text while the dialog is open (it's rendered inline, not a portal) —
      // the dialog's is always the LAST one in DOM order.
      const btns = [...document.querySelectorAll('button')].filter((b) => /^accept quote$/i.test(b.textContent.trim()));
      const btn = btns[btns.length - 1];
      if (btn) btn.click();
    });
    await wait(2500);
    // Step 2: after acceptance, a separate "Convert to Order" button appears.
    await page.evaluate(() => {
      const btn = [...document.querySelectorAll('button')].find((b) => /convert to order/i.test(b.textContent));
      if (btn) btn.click();
    });
    await wait(3000);
  } else {
    // Already accepted in a prior run — just convert.
    await page.evaluate(() => {
      const btn = [...document.querySelectorAll('button')].find((b) => /convert to order/i.test(b.textContent));
      if (btn) btn.click();
    });
    await wait(3000);
  }
  await finish(context, page, rec);
}

(async () => {
  const only = process.argv[2];
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--window-size=1280,800'],
    protocolTimeout: 180000,
  });

  const clips = [
    ['01_landing', c01_landing],
    ['02_register', c02_register],
    ['03_admin_approve_buyer', c03_adminApprove],
    ['04_catalogue_cart_order', c04_catalogueToOrder],
    ['05_admin_approve_order', c05_adminApproveOrder],
    ['06_finance_partial_payments', c06_financePartialPayments],
    ['07_admin_quote_rfq', c07_adminQuoteRfq],
    ['08_buyer_convert_rfq', c08_buyerConvertRfq],
  ];

  const results = {};
  for (const [name, fn] of clips) {
    if (only && only !== 'all' && only !== name) continue;
    results[name] = await runClip(name, () => fn(browser));
  }

  await browser.close();
  console.log('\n\n=== SUMMARY ===');
  for (const [name, ok] of Object.entries(results)) console.log(`${ok ? 'OK  ' : 'SKIP'}  ${name}`);
  console.log(`\nDemo buyer email used: ${NEW_BUYER_EMAIL}`);
})().catch((e) => { console.error('FATAL', e); process.exit(1); });
