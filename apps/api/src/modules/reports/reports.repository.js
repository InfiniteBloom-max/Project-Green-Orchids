const { query } = require('../../config/db');
const repo = {
  async salesTrend(from, to) {
    let where = ''; const params = []; let p = 1;
    if (from) { where += ` AND o.created_at >= $${p++}`; params.push(from); }
    if (to) { where += ` AND o.created_at <= $${p++}`; params.push(to); }
    return (await query(
      `SELECT DATE_TRUNC('month', o.created_at) as month, COUNT(*) as order_count,
              COALESCE(SUM(o.total),0) as revenue
       FROM orders o WHERE o.status = 'APPROVED' ${where}
       GROUP BY month ORDER BY month DESC LIMIT 24`, params
    )).rows;
  },
  async categoryPerformance(from, to) {
    let where = ''; const params = []; let p = 1;
    if (from) { where += ` AND o.created_at >= $${p++}`; params.push(from); }
    if (to) { where += ` AND o.created_at <= $${p++}`; params.push(to); }
    return (await query(
      `SELECT c.name as category, COALESCE(SUM(oi.line_total),0) as revenue, COUNT(DISTINCT o.id) as order_count,
              COALESCE(SUM(oi.qty),0) as units_sold
       FROM order_items oi JOIN orders o ON o.id = oi.order_id
       JOIN products p ON p.id = oi.product_id
       JOIN categories c ON c.id = p.category_id
       WHERE o.status = 'APPROVED' ${where} GROUP BY c.name ORDER BY revenue DESC`, params
    )).rows;
  },
  async topProducts(from, to, limit = 10) {
    let where = ''; const params = []; let p = 1;
    if (from) { where += ` AND o.created_at >= $${p++}`; params.push(from); }
    if (to) { where += ` AND o.created_at <= $${p++}`; params.push(to); }
    return (await query(
      `SELECT p.id, p.name, COALESCE(SUM(oi.line_total),0) as revenue, COALESCE(SUM(oi.qty),0) as units_sold
       FROM order_items oi JOIN orders o ON o.id = oi.order_id
       JOIN products p ON p.id = oi.product_id
       WHERE o.status = 'APPROVED' ${where} GROUP BY p.id, p.name ORDER BY revenue DESC LIMIT $${p++}`, [...params, limit]
    )).rows;
  },
  async buyerBehaviour(from, to) {
    let where = ''; const params = []; let p = 1;
    if (from) { where += ` AND o.created_at >= $${p++}`; params.push(from); }
    if (to) { where += ` AND o.created_at <= $${p++}`; params.push(to); }
    return (await query(
      `SELECT ta.id as buyer_id, u.full_name as name, ta.business_name, COUNT(o.id) as order_count,
              COALESCE(SUM(o.total),0) as total_spend,
              COALESCE(AVG(o.total),0) as avg_order_value
       FROM orders o JOIN trade_accounts ta ON ta.id = o.buyer_id
       JOIN users u ON u.id = ta.user_id
       WHERE o.status = 'APPROVED' ${where} GROUP BY ta.id, u.full_name, ta.business_name ORDER BY total_spend DESC LIMIT 20`, params
    )).rows;
  },
  async creditRisk() {
    return (await query(
      `SELECT ta.id as buyer_id, u.full_name as name, ta.business_name, ta.credit_limit, ta.tier_id as tier,
              COALESCE(SUM(i.balance_due),0) as total_exposure,
              COALESCE(SUM(CASE WHEN i.due_date < NOW() - INTERVAL '90 days' THEN i.balance_due ELSE 0 END),0) as bucket_90plus,
              COALESCE(SUM(CASE WHEN i.due_date < NOW() - INTERVAL '60 days' AND i.due_date >= NOW() - INTERVAL '90 days' THEN i.balance_due ELSE 0 END),0) as bucket_60_90,
              COALESCE(SUM(CASE WHEN i.due_date < NOW() - INTERVAL '30 days' AND i.due_date >= NOW() - INTERVAL '60 days' THEN i.balance_due ELSE 0 END),0) as bucket_30_60,
              COUNT(CASE WHEN i.status = 'OVERDUE' THEN 1 END) as overdue_invoices
       FROM trade_accounts ta JOIN users u ON u.id = ta.user_id
       LEFT JOIN invoices i ON i.buyer_id = ta.id AND i.status IN ('PENDING','PARTIALLY_PAID','OVERDUE') AND i.balance_due > 0
       GROUP BY ta.id, u.full_name, ta.business_name, ta.credit_limit, ta.tier_id ORDER BY total_exposure DESC`
    )).rows;
  },
  async inventoryTurnover() {
    return (await query(
      `SELECT p.id, p.name, p.stock_qty as current_stock, p.reorder_level,
              COALESCE(sold.units_sold, 0) as units_sold_90d,
              CASE WHEN p.stock_qty <= 0 THEN 'DEAD'
                   WHEN COALESCE(sold.units_sold, 0) > p.stock_qty * 2 THEN 'FAST'
                   WHEN COALESCE(sold.units_sold, 0) > 0 THEN 'SLOW'
                   ELSE 'NO_MOVEMENT' END as turnover_category
       FROM products p LEFT JOIN (
         SELECT oi.product_id, SUM(oi.qty) as units_sold
         FROM order_items oi JOIN orders o ON o.id = oi.order_id
         WHERE o.status = 'APPROVED' AND o.created_at > NOW() - INTERVAL '90 days'
         GROUP BY oi.product_id
       ) sold ON sold.product_id = p.id
       ORDER BY p.stock_qty DESC`
    )).rows;
  },
  async supplierContribution(from, to) {
    let where = ''; const params = []; let p = 1;
    if (from) { where += ` AND o.created_at >= $${p++}`; params.push(from); }
    if (to) { where += ` AND o.created_at <= $${p++}`; params.push(to); }
    return (await query(
      `SELECT s.id as supplier_id, s.name, COUNT(DISTINCT oi.product_id) as products_ordered,
              COALESCE(SUM(oi.line_total),0) as revenue, COALESCE(SUM(oi.qty),0) as units_sold
       FROM order_items oi JOIN orders o ON o.id = oi.order_id
       JOIN products p ON p.id = oi.product_id LEFT JOIN suppliers s ON s.id = p.supplier_id
       WHERE o.status = 'APPROVED' ${where} GROUP BY s.id, s.name ORDER BY revenue DESC`, params
    )).rows;
  },
  async returnsAnalytics(from, to) {
    let where = ''; const params = []; let p = 1;
    if (from) { where += ` AND r.created_at >= $${p++}`; params.push(from); }
    if (to) { where += ` AND r.created_at <= $${p++}`; params.push(to); }
    return (await query(
      `SELECT r.reason_category, COUNT(*) as count, COALESCE(SUM(ri.qty),0) as total_qty,
              COUNT(CASE WHEN r.status = 'RESOLVED' THEN 1 END) as resolved
       FROM rma_requests r LEFT JOIN rma_items ri ON ri.rma_id = r.id
       ${where ? 'WHERE' + where.substring(4) : ''} GROUP BY r.reason_category ORDER BY count DESC`, params
    )).rows;
  },
  async summary() {
    const [revenue, payments] = await Promise.all([
      query(`SELECT COALESCE(SUM(total),0) AS total FROM orders
             WHERE status = 'APPROVED' AND created_at >= DATE_TRUNC('month', NOW())`),
      query(`SELECT COALESCE(SUM(amount),0) AS total FROM payments
             WHERE reversed_at IS NULL AND received_at >= DATE_TRUNC('month', NOW())`),
    ]);
    return {
      revenueThisMonth: Number(revenue.rows[0].total),
      paymentsThisMonth: Number(payments.rows[0].total),
    };
  },
};
module.exports = repo;
