const { query } = require('../../config/db');
const repo = {
  async findAll() { return (await query('SELECT * FROM cms_blocks ORDER BY updated_at DESC')).rows; },
  async findByKey(key) { const r = await query('SELECT * FROM cms_blocks WHERE key = $1', [key]); return r.rows[0] || null; },
  async create(data) { const r = await query('INSERT INTO cms_blocks (key, title, content, block_type, image_url, link_url, start_date, end_date, is_published, meta) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *', [data.key, data.title, data.content, data.block_type, data.image_url, data.link_url, data.start_date, data.end_date, data.is_published || false, data.meta]); return r.rows[0]; },
  async update(key, data) {
    const keys = Object.keys(data); if (!keys.length) return null;
    const sets = keys.map((k,i)=>`${k}=$${i+2}`); const vals = keys.map(k=>data[k]);
    const r = await query(`UPDATE cms_blocks SET ${sets.join(',')},updated_at=NOW() WHERE key=$1 RETURNING *`, [key, ...vals]);
    return r.rows[0];
  },
  async togglePublish(key, isPublished) {
    await query('UPDATE cms_blocks SET is_published=$1,updated_at=NOW() WHERE key=$2', [isPublished, key]);
  },
};
module.exports = repo;
