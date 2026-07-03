const { pool } = require('../../config/db');

async function list({ assignedTo, status } = {}) {
  const conds = [], vals = [];
  if (assignedTo) { conds.push(`d.assigned_to = $${vals.length+1}`); vals.push(assignedTo); }
  if (status)     { conds.push(`d.status = $${vals.length+1}`);      vals.push(status); }
  const where = conds.length ? 'WHERE ' + conds.join(' AND ') : '';
  const { rows } = await pool.query(`
    SELECT d.*, o.order_no AS reference_number, u.full_name AS assigned_name
    FROM deliveries d
    JOIN orders o ON o.id = d.order_id
    LEFT JOIN users u ON u.id = d.assigned_to
    ${where}
    ORDER BY d.updated_at DESC
    LIMIT 100
  `, vals);
  return rows;
}

async function getById(id) {
  const { rows } = await pool.query(`
    SELECT d.*, o.order_no AS reference_number, u.full_name AS assigned_name
    FROM deliveries d
    JOIN orders o ON o.id = d.order_id
    LEFT JOIN users u ON u.id = d.assigned_to
    WHERE d.id = $1
  `, [id]);
  return rows[0] || null;
}

async function getByOrderId(orderId) {
  const { rows } = await pool.query(
    `SELECT d.*, o.order_no AS reference_number FROM deliveries d
     JOIN orders o ON o.id = d.order_id WHERE d.order_id = $1`,
    [orderId],
  );
  return rows[0] || null;
}

async function create(orderId) {
  const { rows } = await pool.query(
    `INSERT INTO deliveries (order_id) VALUES ($1)
     ON CONFLICT (order_id) DO NOTHING
     RETURNING *`,
    [orderId],
  );
  return rows[0];
}

async function assign(id, assignedTo, actorId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `UPDATE deliveries SET assigned_to = $1, status = 'ASSIGNED', updated_at = NOW()
       WHERE id = $2 RETURNING *`,
      [assignedTo, id],
    );
    await client.query(
      `INSERT INTO delivery_events (delivery_id, status, note, actor_id)
       VALUES ($1, 'ASSIGNED', 'Assigned to staff', $2)`,
      [id, actorId],
    );
    await client.query('COMMIT');
    return rows[0];
  } catch (e) { await client.query('ROLLBACK'); throw e; }
  finally { client.release(); }
}

async function transition(id, status, { note, podUrl, actorId } = {}) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const sets = ['status = $1', 'updated_at = NOW()'];
    const vals = [status];
    if (status === 'DISPATCHED') { sets.push('dispatch_date = NOW()'); }
    if (podUrl) { vals.push(podUrl); sets.push(`pod_url = $${vals.length}`, 'pod_uploaded_at = NOW()'); }
    // buyer_confirmed_at is NOT set here — POD upload means "delivered", not
    // "the buyer confirmed it". That's a separate, buyer-initiated action
    // (see orders.service.js confirmReceipt(), which sets this field for real).
    if (note && status === 'FAILED') { vals.push(note); sets.push(`failure_note = $${vals.length}`); }
    vals.push(id);
    const { rows } = await client.query(
      `UPDATE deliveries SET ${sets.join(', ')} WHERE id = $${vals.length} RETURNING *`,
      vals,
    );
    await client.query(
      `INSERT INTO delivery_events (delivery_id, status, note, actor_id) VALUES ($1, $2, $3, $4)`,
      [id, status, note || null, actorId || null],
    );
    if (status === 'DISPATCHED' || status === 'DELIVERED') {
      await client.query(
        `UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2`,
        [status, rows[0].order_id],
      );
    }
    await client.query('COMMIT');
    return rows[0];
  } catch (e) { await client.query('ROLLBACK'); throw e; }
  finally { client.release(); }
}

async function events(deliveryId) {
  const { rows } = await pool.query(
    `SELECT de.*, u.full_name AS actor_name
     FROM delivery_events de
     LEFT JOIN users u ON u.id = de.actor_id
     WHERE de.delivery_id = $1
     ORDER BY de.occurred_at ASC`,
    [deliveryId],
  );
  return rows;
}

module.exports = { list, getById, getByOrderId, create, assign, transition, events };
