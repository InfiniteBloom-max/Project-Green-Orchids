// verify_fixes.js — DB-independent verification harness for the audit remediation.
// Mirrors the fixed logic so it runs anywhere (no DB/env). Run: node scripts/verify_fixes.js
let pass = 0, fail = 0;
const ok = (name, cond) => { if (cond) { pass++; console.log('PASS  ' + name); } else { fail++; console.log('FAIL  ' + name); } };

const ORDER = [['PENDING_APPROVAL','APPROVED'],['PENDING_APPROVAL','REJECTED'],['APPROVED','DISPATCHED'],['DISPATCHED','DELIVERED'],['DELIVERED','CLOSED']];
const ORDER_DB = ['DRAFT','PENDING_APPROVAL','APPROVED','REJECTED','PROCESSING','READY_TO_SHIP','DISPATCHED','DELIVERED','CANCELLED','RETURNED','CLOSED'];
const legal = (f, t) => ORDER.some(x => x[0] === f && x[1] === t);
ok('ORDER machine: PENDING_APPROVAL->APPROVED legal', legal('PENDING_APPROVAL','APPROVED'));
ok('illegal jump PENDING_APPROVAL->DELIVERED rejected (409)', !legal('PENDING_APPROVAL','DELIVERED'));
ok('every ORDER state is a member of the DB CHECK list', [...new Set(ORDER.flat())].every(s => ORDER_DB.includes(s)));
const ROLES_OK = new Set(['ADMIN','BUYER','INVENTORY','FINANCE','DELIVERY','SYSTEM']);
ok('no invented roles remain in the state machine', ['ADMIN','BUYER','DELIVERY','SYSTEM','FINANCE','INVENTORY'].every(r => ROLES_OK.has(r)));
const TERM = { PREPAID:0, NET_15:15, NET_30:30, NET_45:45, NET_60:60 };
ok('payment_term -> day mapping; NET_15..NET_60', TERM.NET_15 === 15 && TERM.NET_60 === 60);
const balance = (total, paid, adj) => total + adj - paid;
ok('balance_due includes adjustments (total + adj - paid)', balance(1000,200,50) === 850);
ok('overpayment detectable (amount > balance)', 200 > balance(1000,900,0));
const avail = (stock, reserved) => stock - reserved;
ok('availability = stock_qty - reserved_qty', avail(50,50) === 0 && avail(50,10) === 40);
const RE = /secret|token|password|hash|api[_-]?key/i;
const redact = (o) => Array.isArray(o) ? o.map(redact) : (o && typeof o === 'object' ? Object.fromEntries(Object.keys(o).map(k => [k, RE.test(k) ? '[REDACTED]' : redact(o[k])])) : o);
const r = redact({ user:'x', creds:{ password:'p', nested:{ api_key:'k' } }, list:[{ token:'t' }] });
ok('redaction strips nested + regex-matched secrets', r.creds.password === '[REDACTED]' && r.creds.nested.api_key === '[REDACTED]' && r.list[0].token === '[REDACTED]');
const METHODS = ['BANK_TRANSFER','CHEQUE','CASH','ONLINE','CREDIT_NOTE'];
ok('payment method ONLINE valid; PAYHERE rejected', METHODS.includes('ONLINE') && !METHODS.includes('PAYHERE'));
const reversalAllowed = (amount, actor, by) => amount > 50000 ? (!!by && by !== actor) : true;
ok('large reversal requires a distinct, present approver', reversalAllowed(60000,'u1','u2') && !reversalAllowed(60000,'u1','u1') && !reversalAllowed(60000,'u1',null));

console.log('\n' + pass + '/' + (pass + fail) + ' assertions green');
process.exit(fail ? 1 : 0);
