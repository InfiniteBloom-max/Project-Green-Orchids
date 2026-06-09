const { tx, query } = require('../../config/db');
const { AppError } = require('../../middleware/errors');
const { writeAudit } = require('../../middleware/audit');
const repo = require('./pricing.repository');
const { paginate } = require('../../utils/pagination');

const service = {
  async listRequests(q) {
    const o = paginate(q);
    const { rows, total } = await repo.findAllRequests({ ...o, status: q.status });
    return { data: rows, pagination: { page: o.page, limit: o.limit, total, pages: Math.ceil(total / o.limit) } };
  },

  // Approval executes the change at approval time, re-running the lock, no-op and stale checks,
  // and writes price_history(source='PRICE_REQUEST') (Findings 1 & 14 / B7).
  async approve(id, data, actor) {
    const r = await repo.findRequestById(id);
    if (!r) throw new AppError('NOT_FOUND', 'Request not found', 404);
    if (r.status !== 'PENDING') throw new AppError('INVALID_STATE', 'Request is not pending', 409);
    if (r.requested_by === actor) throw new AppError('SELF_APPROVAL', 'Cannot approve own request', 403);

    await tx(async (client) => {
      const lock = await client.query('SELECT base_price FROM products WHERE id = $1 FOR UPDATE', [r.product_id]);
      if (!lock.rows.length) throw new AppError('NOT_FOUND', 'Product not found', 404);
      // Stale check: if the live price no longer matches the price the request was raised against
      if (Number(lock.rows[0].base_price) !== Number(r.current_price)) {
        throw new AppError('STALE_REQUEST', 'Product price changed since the request; re-review required', 409);
      }
      await client.query('UPDATE products SET base_price = $1, updated_at = NOW() WHERE id = $2', [r.requested_price, r.product_id]);
      await client.query(
        `INSERT INTO price_history (product_id, old_price, new_price, changed_by, source)
         VALUES ($1,$2,$3,$4,'PRICE_REQUEST')`,
        [r.product_id, r.current_price, r.requested_price, actor]
      );
      await repo.approve(client, id, actor, data.note);
      await writeAudit({ actor, action: 'PRICE_REQUEST_APPROVED', entityType: 'price_change_requests', entityId: String(id),
        before: { base_price: r.current_price }, after: { base_price: r.requested_price } }, client);
    });
  },

  async reject(id, data, actor) {
    const r = await repo.findRequestById(id);
    if (!r) throw new AppError('NOT_FOUND', 'Request not found', 404);
    if (r.status !== 'PENDING') throw new AppError('INVALID_STATE', 'Request is not pending', 409);
    await tx(async (client) => {
      await repo.reject(client, id, actor, data.note);
      await writeAudit({ actor, action: 'PRICE_REQUEST_REJECTED', entityType: 'price_change_requests', entityId: String(id),
        after: { note: data.note } }, client);
    });
  },

  async listHistory(q) {
    const o = paginate(q);
    const filters = { product_id: q.product_id, changed_by: q.changed_by };
    const { rows, total } = await repo.findAllHistory(filters, o);
    return { data: rows, pagination: { page: o.page, limit: o.limit, total, pages: Math.ceil(total / o.limit) } };
  },
};
module.exports = service;
