const { query } = require('../config/db');

async function sessionSweep() {
  console.log('🧹 Running session sweep...');
  try {
    // Purge expired auth sessions
    const sessionResult = await query(
      `DELETE FROM auth_sessions WHERE expires_at < NOW() OR revoked_at IS NOT NULL AND revoked_at < NOW() - INTERVAL '30 days'`
    );
    console.log(`Purged expired sessions`);

    // Expire stale price change requests (>48h pending)
    const priceResult = await query(
      `UPDATE price_change_requests SET status = 'EXPIRED', updated_at = NOW()
       WHERE status = 'PENDING' AND created_at < NOW() - INTERVAL '48 hours'
       RETURNING id`
    );
    if (priceResult.rows.length > 0) {
      console.log(`Expired ${priceResult.rows.length} stale price change requests`);
    }

    // Unpublish ended CMS banners
    const cmsResult = await query(
      `UPDATE cms_blocks SET is_published = false, updated_at = NOW()
       WHERE is_published = true AND end_date IS NOT NULL AND end_date < NOW()
       RETURNING key`
    );
    if (cmsResult.rows.length > 0) {
      console.log(`Unpublished ${cmsResult.rows.length} ended CMS banners`);
    }
  } catch (err) {
    console.error('Session sweep error:', err.message);
  }
}

module.exports = sessionSweep;
