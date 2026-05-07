const { Pool } = require('pg');
const env = require('./env');

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 8,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ...(env.isProd ? { ssl: { rejectUnauthorized: false } } : {}),
});

pool.on('error', (err) => {
  console.error('Unexpected pool error:', err.message);
  if (err.code === '57P01') {
    console.error('Database connection terminated by admin. Attempting reconnect...');
  }
});

/**
 * Single query helper
 */
async function query(text, params) {
  const start = Date.now();
  const result = await pool.query(text, params);
  const duration = Date.now() - start;
  if (env.isDev && duration > 100) {
    console.log(`🐢 Slow query (${duration}ms):`, text.substring(0, 100));
  }
  return result;
}

/**
 * Transaction helper: acquires a client, runs callback with client as arg,
 * calls BEGIN/COMMIT/ROLLBACK automatically.
 */
async function tx(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { pool, query, tx };
