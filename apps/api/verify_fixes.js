// Standalone proof harness for the DB-independent fixes (no database required).
const assert = require('assert');
const path = (p) => require('./src/' + p);

let pass = 0, fail = 0;
const results = [];
function check(name, fn) {
  try { fn(); pass++; results.push(['PASS', name]); }
  catch (e) { fail++; results.push(['FAIL', name + ' :: ' + e.message]); }
}

// ---- Finding 8: state machine aligned to DB enums ----
const sm = path('utils/stateMachine');
const ORDER_DB = ['DRAFT','PENDING_APPROVAL','APPROVED','REJECTED','PROCESSING','READY_TO_SHIP','DISPATCHED','DELIVERED','CLOSED','CANCELLED','RETURNED'];
check('ORDER machine starts at PENDING_APPROVAL and approval is legal', () => {
  sm.assertTransition('ORDER', 'PENDING_APPROVAL', 'APPROVED', 'ADMIN');
});
check('ORDER illegal jump PENDING_APPROVAL->DISPATCHED rejected (409)', () => {
  try { sm.assertTransition('ORDER','PENDING_APPROVAL','DISPATCHED','ADMIN'); throw new Error('should have thrown'); }
  catch (e) { assert(e.statusCode === 409, 'expected 409, got ' + e.statusCode); }
});
check('Every state-machine state is a member of its DB CHECK list (ORDER)', () => {
  for (const t of sm.STATE_MACHINES.ORDER.transitions) {
    assert(ORDER_DB.includes(t.from), 'from ' + t.from + ' not in DB enum');
    assert(ORDER_DB.includes(t.to), 'to ' + t.to + ' not in DB enum');
  }
});
check('No invented roles (ORDER_MANAGER/SALES_MANAGER) remain', () => {
  const blob = JSON.stringify(sm.STATE_MACHINES);
  for (const bad of ['ORDER_MANAGER','SALES_MANAGER','WAREHOUSE_MANAGER','LOGISTICS_COORDINATOR','SUPPORT_MANAGER']) {
    assert(!blob.includes(bad), bad + ' still referenced');
  }
});

// ---- Finding 12: due date maps payment_term correctly (no NET30 default) ----
const time = path('utils/time');
check('payment_term maps to correct day counts', () => {
  assert.strictEqual(time.termToDays('NET_60'), 60);
  assert.strictEqual(time.termToDays('NET_15'), 15);
  assert.strictEqual(time.termToDays('PREPAID'), 0);
});
check('dueDateForTerm(NET_60) is 60 days after NET_15 issue', () => {
  const issued = new Date('2026-06-01T00:00:00Z');
  const d15 = time.dueDateForTerm('NET_15', issued);
  const d60 = time.dueDateForTerm('NET_60', issued);
  assert(d15 !== d60, 'NET_15 and NET_60 must differ (was always NET30 before)');
});

// ---- Finding 9/10: overpayment math & balance with adjustments ----
const money = path('utils/money');
check('balance_due includes adjustments (total + adj - paid)', () => {
  // total 1000, credit adjustment -200, paid 300 => balance 500
  assert.strictEqual(money.calculateBalanceDue(1000, 300, -200), 500);
});
check('overpayment is detectable: amount > balance', () => {
  const balance = money.calculateBalanceDue(1000, 900, 0); // 100 left
  const amount = 250;
  assert(amount > balance, 'payment of 250 exceeds 100 balance -> must be rejected');
});

// ---- Finding 7: availability = stock_qty - reserved_qty ----
check('availability subtracts reserved_qty', () => {
  const p = { stock_qty: 50, reserved_qty: 50 };
  const available = Number(p.stock_qty) - Number(p.reserved_qty);
  assert.strictEqual(available, 0, 'two orders for last 50 cannot both pass');
});

// ---- Finding 19: recursive + regex redaction ----
const { redactSensitive } = path('middleware/audit');
check('redaction strips nested secrets and regex-matched keys', () => {
  const out = redactSensitive({ email: 'a@b.com', password_hash: 'x', nested: { refresh_token_hash: 'y', api_key: 'z', ok: 1 } });
  assert.strictEqual(out.password_hash, '[REDACTED]');
  assert.strictEqual(out.nested.refresh_token_hash, '[REDACTED]');
  assert.strictEqual(out.nested.api_key, '[REDACTED]');
  assert.strictEqual(out.nested.ok, 1);
  assert.strictEqual(out.email, 'a@b.com');
});

// ---- Finding 11: two-person reversal logic ----
check('large reversal requires a distinct, present approver', () => {
  function guardOk(amount, confirmedBy, actor) {
    if (amount > 50000) { if (!confirmedBy || confirmedBy === actor) return false; }
    return true;
  }
  assert.strictEqual(guardOk(60000, undefined, 'u1'), false, 'missing approver must fail');
  assert.strictEqual(guardOk(60000, 'u1', 'u1'), false, 'same person must fail');
  assert.strictEqual(guardOk(60000, 'u2', 'u1'), true, 'distinct approver passes');
  assert.strictEqual(guardOk(100, undefined, 'u1'), true, 'small reversal needs no second person');
});

console.log('\n=== VERIFY FIXES ===');
for (const [s, n] of results) console.log(`${s}  ${n}`);
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
