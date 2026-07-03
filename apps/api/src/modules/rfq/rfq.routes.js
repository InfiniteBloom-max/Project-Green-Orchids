const { Router } = require('express');
const c = require('./rfq.controller');
const { requireAuth, requireApprovedBuyer } = require('../../middleware/auth');
const { requirePermission } = require('../../middleware/rbac');
const { validate } = require('../../middleware/validate');
const { createSchema, reviewSchema, quoteSchema, declineSchema } = require('./rfq.schema');
const r = Router();
r.use(requireAuth);
r.post('/', requireApprovedBuyer, validate({ body: createSchema }), c.create);
r.get('/', c.list);
r.get('/:id', c.get);
r.patch('/:id/review', requirePermission('rfq.quote'), validate({ body: reviewSchema }), c.review);
r.patch('/:id/quote', requirePermission('rfq.quote'), validate({ body: quoteSchema }), c.quote);
r.patch('/:id/decline', requirePermission('rfq.quote'), validate({ body: declineSchema }), c.decline);
r.patch('/:id/accept', requireApprovedBuyer, c.accept);
r.patch('/:id/reject', requireApprovedBuyer, c.reject);
// Converting an accepted RFQ into a real order is handled by
// POST /orders/from-rfq (orders.service.createFromRfq) — that's the only
// path the buyer UI ever calls. A duplicate /rfqs/:id/convert route used to
// live here as an unfinished scaffold that returned a fake 200 without
// creating anything; removed rather than kept as a second, divergent
// implementation of the same action.
module.exports = r;
