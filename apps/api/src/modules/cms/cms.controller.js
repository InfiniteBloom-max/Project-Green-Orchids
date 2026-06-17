const s = require('./cms.service');
module.exports = {
  list: async (r, res, n) => { try { const d = await s.list(); res.json({ success: true, data: d }); } catch (e) { n(e); } },
  get: async (r, res, n) => { try { const d = await s.get(r.params.key); res.json({ success: true, data: d }); } catch (e) { n(e); } },
  create: async (r, res, n) => { try { const d = await s.create(r.body); res.status(201).json({ success: true, data: d }); } catch (e) { n(e); } },
  update: async (r, res, n) => { try { const d = await s.update(r.params.key, r.body); res.json({ success: true, data: d }); } catch (e) { n(e); } },
  togglePublish: async (r, res, n) => { try { const d = await s.togglePublish(r.params.key); res.json({ success: true, data: d }); } catch (e) { n(e); } },
};
