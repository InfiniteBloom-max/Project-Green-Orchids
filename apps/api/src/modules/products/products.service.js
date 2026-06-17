const { tx } = require('../../config/db');
const { AppError } = require('../../middleware/errors');
const { writeAudit } = require('../../middleware/audit');
const repo = require('./products.repository');
const { paginate } = require('../../utils/pagination');
const { enqueueEmail } = require('../../utils/outbox');

const service = {
  async list(q) {
    const o = paginate(q);
    const filters = { type: q.type, category: q.category, supplier_id: q.supplier_id, status: q.status, search: q.search, min_price: q.min_price, max_price: q.max_price };
    const { rows, total } = await repo.findAll(filters, o);
    return { data: rows, pagination: { page: o.page, limit: o.limit, total, pages: Math.ceil(total / o.limit) } };
  },

  async get(id) {
    const p = await repo.findById(id);
    if (!p) throw new AppError('NOT_FOUND', 'Product not found', 404);
    const images = await repo.findImages(id);
    const bulkTiers = await repo.findBulkTiers(id);
    return { ...p, images, bulk_tiers: bulkTiers };
  },

  async create(data, actor) {
    const p = await repo.create(data);
    await writeAudit({ actor, action: 'PRODUCT_CREATED', entity: 'products', entityId: p.id, after: { name: p.name, base_price: p.base_price } });
    return p;
  },

  async update(id, data, actor) {
    const before = await repo.findById(id);
    if (!before) throw new AppError('NOT_FOUND', 'Product not found', 404);
    const updated = await repo.update(id, data);
    await writeAudit({ actor, action: 'PRODUCT_UPDATED', entity: 'products', entityId: id, before: { name: before.name, base_price: before.base_price }, after: data });
    return updated;
  },

  async uploadImage(productId, file, actor) {
    const p = await repo.findById(productId);
    if (!p) throw new AppError('NOT_FOUND', 'Product not found', 404);
    const image = await repo.addImage(productId, { url: file.path || file.location || file.url, alt_text: file.originalname, is_primary: false, sort_order: 0 });
    return image;
  },

  async updateImage(productId, imageId, data) {
    await this.get(productId);
    const img = await repo.findImageById(imageId);
    if (!img || img.product_id !== productId) throw new AppError('NOT_FOUND', 'Image not found', 404);
    if (data.is_primary) { await repo.clearPrimaryImages(productId); }
    await repo.updateImage(imageId, data);
    return repo.findImageById(imageId);
  },

  async removeImage(productId, imageId) {
    await this.get(productId);
    const img = await repo.findImageById(imageId);
    if (!img || img.product_id !== productId) throw new AppError('NOT_FOUND', 'Image not found', 404);
    await repo.removeImage(imageId);
  },

  async adjustStock(productId, data, actor) {
    const p = await repo.findById(productId);
    if (!p) throw new AppError('NOT_FOUND', 'Product not found', 404);

    await tx(async (client) => {
      let newQty = p.stock_qty;
      switch (data.type) {
        case 'RECEIVE': case 'RESTOCK': newQty += data.quantity; break;
        case 'DEDUCT': case 'WRITE_OFF': case 'RESERVATION_CONVERT': newQty -= data.quantity; break;
      }
      if (newQty < 0) throw new AppError('INSUFFICIENT_STOCK', 'Stock cannot go below zero', 400);

      await repo.updateStock(client, productId, newQty);
      await repo.createStockMovement({
        product_id: productId, movement_type: data.type, quantity: data.quantity,
        quantity_before: p.stock_qty, quantity_after: newQty, note: data.note,
        reference_type: data.reference_type, reference_id: data.reference_id, created_by: actor,
      });
    });
  },

  async getPriceHistory(productId, q) {
    await this.get(productId);
    const o = paginate(q);
    const { rows, total } = await repo.getPriceHistory(productId, o);
    return { data: rows, pagination: { page: o.page, limit: o.limit, total, pages: Math.ceil(total / o.limit) } };
  },

  // Price governance (B7 / Findings 1 & 14):
  //  - lock the product row (FOR UPDATE) before deciding
  //  - rolling 24h count from price_history (the immutable audit trail), not a phantom table
  //  - same price is a no-op (doesn't burn a change slot)
  //  - <2 prior changes -> apply + write price_history(source='MANUAL') atomically
  //  - 3rd change -> create a price_change_request(PENDING) for a different admin
  async changePrice(productId, data, actor) {
    const { tx, query } = require('../../config/db');
    const newPrice = Number(data.new_price);
    let result;
    await tx(async (client) => {
      const lock = await client.query('SELECT id, name, base_price FROM products WHERE id = $1 FOR UPDATE', [productId]);
      if (!lock.rows.length) throw new AppError('NOT_FOUND', 'Product not found', 404);
      const p = lock.rows[0];
      if (Number(p.base_price) === newPrice) throw new AppError('NO_OP_CHANGE', 'Price is unchanged', 400);

      // Rolling 24h window counted from the immutable price_history (re-counted under lock)
      const cnt = await client.query(
        `SELECT COUNT(*) AS c FROM price_history WHERE product_id = $1 AND changed_at > NOW() - INTERVAL '24 hours'`,
        [productId]
      );
      const recent = parseInt(cnt.rows[0].c, 10);

      if (recent < 2) {
        await client.query('UPDATE products SET base_price = $1, updated_at = NOW() WHERE id = $2', [newPrice, productId]);
        await client.query(
          `INSERT INTO price_history (product_id, old_price, new_price, changed_by, source)
           VALUES ($1,$2,$3,$4,'MANUAL')`,
          [productId, p.base_price, newPrice, actor]
        );
        await writeAudit({ actor, action: 'PRICE_CHANGED', entityType: 'products', entityId: String(productId),
          before: { base_price: p.base_price }, after: { base_price: newPrice } }, client);
        result = { applied: true, needs_approval: false, new_price: newPrice };
      } else {
        await client.query(
          `INSERT INTO price_change_requests (product_id, requested_by, current_price, requested_price, reason, status)
           VALUES ($1,$2,$3,$4,$5,'PENDING')`,
          [productId, actor, p.base_price, newPrice, data.reason]
        );
        await enqueueEmail(client, { recipientEmail: null, template: 'price_approval_needed',
          payload: { productName: p.name, currentPrice: p.base_price, proposedPrice: newPrice, reason: data.reason } });
        result = { applied: false, needs_approval: true };
      }
    });
    return result;
  },
};

module.exports = service;
