const s = require('./products.service');
module.exports = {
  list: async (r, res, n) => { try { const d = await s.list(r.query); res.json({ success: true, ...d }); } catch (e) { n(e); } },
  get: async (r, res, n) => { try { const d = await s.get(r.params.id, r.user?.id); res.json({ success: true, data: d }); } catch (e) { n(e); } },
  create: async (r, res, n) => { try { const d = await s.create(r.body, r.user.id); res.status(201).json({ success: true, data: d }); } catch (e) { n(e); } },
  update: async (r, res, n) => { try { const d = await s.update(r.params.id, r.body, r.user.id); res.json({ success: true, data: d }); } catch (e) { n(e); } },
  uploadImage: async (r, res, n) => { try { const d = await s.uploadImage(r.params.id, r.file, r.user.id); res.status(201).json({ success: true, data: d }); } catch (e) { n(e); } },
  updateImage: async (r, res, n) => { try { const d = await s.updateImage(r.params.id, r.params.imageId, r.body); res.json({ success: true, data: d }); } catch (e) { n(e); } },
  removeImage: async (r, res, n) => { try { await s.removeImage(r.params.id, r.params.imageId); res.json({ success: true, data: { message: 'Image removed' } }); } catch (e) { n(e); } },
  adjustStock: async (r, res, n) => { try { await s.adjustStock(r.params.id, r.body, r.user.id); res.json({ success: true, data: { message: 'Stock adjusted' } }); } catch (e) { n(e); } },
  priceHistory: async (r, res, n) => { try { const d = await s.getPriceHistory(r.params.id, r.query); res.json({ success: true, ...d }); } catch (e) { n(e); } },
  changePrice: async (r, res, n) => { try { const d = await s.changePrice(r.params.id, r.body, r.user.id); res.json({ success: true, data: d }); } catch (e) { n(e); } },
  bulkAction: async (r, res, n) => { try { const d = await s.bulkAction(r.body.ids, r.body.action, r.user.id); res.json({ success: true, data: d }); } catch (e) { n(e); } },
  exportCsv: async (r, res, n) => {
    try {
      const csv = await s.exportCsv(r.query);
      res.header('Content-Type', 'text/csv').header('Content-Disposition', 'attachment; filename=products.csv').send(csv);
    } catch (e) { n(e); }
  },
  duplicate: async (r, res, n) => { try { const d = await s.duplicate(r.params.id, r.user.id); res.status(201).json({ success: true, data: d }); } catch (e) { n(e); } },
  remove: async (r, res, n) => { try { await s.remove(r.params.id, r.user.id); res.json({ success: true, data: { message: 'Product discontinued' } }); } catch (e) { n(e); } },
};
