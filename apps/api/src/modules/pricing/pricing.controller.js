const s = require('./pricing.service');
module.exports = {
  listRequests: async (r, res, n) => { try { const d = await s.listRequests(r.query); res.json({ success: true, ...d }); } catch (e) { n(e); } },
  approve: async (r, res, n) => { try { await s.approve(r.params.id, r.body, r.user.id); res.json({ success: true, data: { message: 'Approved' } }); } catch (e) { n(e); } },
  reject: async (r, res, n) => { try { await s.reject(r.params.id, r.body, r.user.id); res.json({ success: true, data: { message: 'Rejected' } }); } catch (e) { n(e); } },
  listHistory: async (r, res, n) => { try { const d = await s.listHistory(r.query); res.json({ success: true, ...d }); } catch (e) { n(e); } },
};
