const { query } = require('../../config/db');
const repo = {
  async findAllRequests({ limit, offset, status }) {
    let where = 'WHERE 1=1'; const params = []; let p = 1;
    if (status) { where += ` AND r.status = $${p++}`; params.push(status); }
    const ct = await query(`SELECT COUNT(*) FROM price_change_requests r ${where}`, params);
    const total = parseInt(ct.rows[0].count, 10);
    const r = await query(
      `SELECT r.*, p.name as product_name, u.full_name as requested_by_name
       FROM price_change_requests r
       LEFT JOIN products p ON p.id = r.product_id
       LEFT JOIN users u ON u.id = r.requested_by ${where}
       ORDER BY r.created_at DESC LIMIT $${p++} OFFSET $${p++}`,
      [...params, limit, offset]
    );
    return { rows: r.rows, total };
  },
  async findRequestById(id) {
    const r = await query('SELECT * FROM price_change_requests WHERE id = $1', [id]);
    return r.rows[0] || null;
  },
  async approve(client, id, decidedBy, note) {
    await (client ? client.query.bind(client) : query)('UPDATE price_change_requests SET status=$1, decided_by=$2, decided_at=NOW(), decision_note=$3 WHERE id=$4', ['APPROVED', decidedBy, note, id]);
  },
  async reject(client, id, decidedBy, note) {
    await (client ? client.query.bind(client) : query)('UPDATE price_change_requests SET status=$1, decided_by=$2, decided_at=NOW(), decision_note=$3 WHERE id=$4', ['REJECTED', decidedBy, note, id]);
  },
  async findAllHistory(filters, { limit, offset }) {
    let where = 'WHERE 1=1'; const params = []; let p = 1;
    if (filters.product_id) { where += ` AND pc.product_id = $${p++}`; params.push(filters.product_id); }
    if (filters.changed_by) { where += ` AND pc.changed_by = $${p++}`; params.push(filters.changed_by); }
    const ct = await query(`SELECT COUNT(*) FROM price_history pc ${where}`, params);
    const total = parseInt(ct.rows[0].count, 10);
    const r = await query(
      `SELECT pc.*, p.name as product_name, u.full_name as changed_by_name FROM price_history pc
       LEFT JOIN products p ON p.id = pc.product_id LEFT JOIN users u ON u.id = pc.changed_by ${where}
       ORDER BY pc.changed_at DESC LIMIT $${p++} OFFSET $${p++}`,
      [...params, limit, offset]
    );
    return { rows: r.rows, total };
  },
};
module.exports = repo;
