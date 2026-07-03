#!/usr/bin/env node
/**
 * migrate.js – Run all SQL migration files in lexicographic order.
 *
 * Usage:
 *   DATABASE_URL=postgresql://... node scripts/migrate.js
 *
 * Default URL: postgresql://postgres:postgres@localhost:5432/project_green
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const DATABASE_URL = process.env.DATABASE_URL
  || 'postgresql://postgres:postgres@localhost:5432/project_green';

const MIGRATIONS_DIR = path.resolve(__dirname, '..', 'apps', 'api', 'migrations');

async function main() {
  const pool = new Pool({ connectionString: DATABASE_URL });

  // Ensure the target database exists
  const dbName = new URL(DATABASE_URL).pathname.replace(/^\//, '') || 'project_green';
  const adminPool = new Pool({
    connectionString: DATABASE_URL.replace(/\/[^/]+$/, '/postgres'),
  });
  try {
    const { rows } = await adminPool.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`, [dbName]
    );
    if (rows.length === 0) {
      await adminPool.query(`CREATE DATABASE "${dbName}"`);
      console.log(`✅ Created database "${dbName}"`);
    }
  } finally {
    await adminPool.end();
  }

  // Track applied migrations so re-running this script against an existing DB is a no-op for
  // files already applied, instead of re-executing non-idempotent DDL (e.g. CREATE TRIGGER)
  // and failing halfway through.
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  const { rows: appliedRows } = await pool.query('SELECT filename FROM schema_migrations');
  const applied = new Set(appliedRows.map(r => r.filename));

  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort();

  if (files.length === 0) {
    console.log('⚠️  No migration files found in', MIGRATIONS_DIR);
    await pool.end();
    return;
  }

  const pending = files.filter(f => !applied.has(f));
  if (pending.length === 0) {
    console.log(`✅ Nothing to do — all ${files.length} migration(s) already applied to ${dbName}.`);
    await pool.end();
    return;
  }

  console.log(`📦 Running ${pending.length} pending migration(s) of ${files.length} total against ${dbName}...\n`);

  for (const file of pending) {
    const filePath = path.join(MIGRATIONS_DIR, file);
    const sql = fs.readFileSync(filePath, 'utf8');
    console.log(`▶  ${file}`);
    try {
      await pool.query(sql);
      await pool.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
      console.log(`   ✅ OK`);
    } catch (err) {
      console.error(`   ❌ FAILED: ${err.message}`);
      await pool.end();
      process.exit(1);
    }
  }

  console.log('\n🎉 All migrations complete.');
  await pool.end();
}

main().catch((err) => {
  console.error('❌ Migration runner failed:', err.message);
  process.exit(1);
});
