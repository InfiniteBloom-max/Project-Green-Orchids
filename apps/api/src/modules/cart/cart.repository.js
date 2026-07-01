const { query } = require('../../config/db');
const repo = {
  async accountIdForUser(userId) {
    const r = await query(`SELECT id FROM trade_accounts WHERE user_id = $1`, [userId]);
    return r.rows[0] || null;
  },
  async tierDiscountForAccount(buyerId) {
    const r = await query(
      `SELECT COALESCE(bt.discount_rate,0) AS discount_rate
       FROM trade_accounts ta LEFT JOIN buyer_tiers bt ON bt.id = ta.tier_id
       WHERE ta.id = $1`,
      [buyerId]
    );
    return Number(r.rows[0]?.discount_rate || 0);
  },
  async getOrCreateCartId(buyerId) {
    const existing = await query('SELECT id FROM carts WHERE buyer_id = $1', [buyerId]);
    if (existing.rows.length) return existing.rows[0].id;
    const created = await query('INSERT INTO carts (buyer_id) VALUES ($1) RETURNING id', [buyerId]);
    return created.rows[0].id;
  },
  async findCartItems(buyerId) {
    const r = await query(
      `SELECT ci.id, ci.product_id, ci.qty AS quantity, p.name, p.base_price, p.stock_qty, p.reserved_qty,
              p.moq, p.status, p.unit_size,
              (SELECT url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) as image_url
       FROM cart_items ci
       INNER JOIN carts c ON c.id = ci.cart_id
       INNER JOIN products p ON p.id = ci.product_id
       WHERE c.buyer_id = $1 ORDER BY ci.created_at`,
      [buyerId]
    );
    return r.rows;
  },
  async findCartItem(buyerId, productId) {
    const r = await query(
      `SELECT ci.* FROM cart_items ci INNER JOIN carts c ON c.id = ci.cart_id
       WHERE c.buyer_id = $1 AND ci.product_id = $2`,
      [buyerId, productId]
    );
    return r.rows[0] || null;
  },
  async addOrUpdate(buyerId, productId, quantity) {
    const cartId = await this.getOrCreateCartId(buyerId);
    const r = await query(
      `INSERT INTO cart_items (cart_id, product_id, qty) VALUES ($1,$2,$3)
       ON CONFLICT (cart_id, product_id) DO UPDATE SET qty = cart_items.qty + $3
       RETURNING *`,
      [cartId, productId, quantity]
    );
    return r.rows[0];
  },
  async setQuantity(buyerId, productId, quantity) {
    const r = await query(
      `UPDATE cart_items SET qty = $1
       WHERE product_id = $2 AND cart_id = (SELECT id FROM carts WHERE buyer_id = $3)
       RETURNING *`,
      [quantity, productId, buyerId]
    );
    return r.rows[0] || null;
  },
  async remove(buyerId, productId) {
    await query(
      `DELETE FROM cart_items WHERE product_id = $1 AND cart_id = (SELECT id FROM carts WHERE buyer_id = $2)`,
      [productId, buyerId]
    );
  },
  async clear(buyerId) {
    await query(`DELETE FROM cart_items WHERE cart_id = (SELECT id FROM carts WHERE buyer_id = $1)`, [buyerId]);
  },
};
module.exports = repo;
