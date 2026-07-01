const { Router } = require('express');
const c = require('./products.controller');
const { requireAuth, optionalAuth } = require('../../middleware/auth');
const { requirePermission } = require('../../middleware/rbac');
const { validate } = require('../../middleware/validate');
const { createSchema, updateSchema, stockAdjustmentSchema, priceChangeSchema, bulkActionSchema } = require('./products.schema');
const r = Router();

// Public catalogue
r.get('/', optionalAuth, c.list);
r.get('/export/csv', requireAuth, requirePermission('product.edit'), c.exportCsv);
r.get('/:id', optionalAuth, c.get);

// Protected mutations
r.post('/', requireAuth, requirePermission('product.create'), validate({ body: createSchema }), c.create);
r.post('/bulk', requireAuth, requirePermission('product.edit'), validate({ body: bulkActionSchema }), c.bulkAction);
r.patch('/:id', requireAuth, requirePermission('product.edit'), validate({ body: updateSchema }), c.update);
r.delete('/:id', requireAuth, requirePermission('product.edit'), c.remove);
r.post('/:id/duplicate', requireAuth, requirePermission('product.create'), c.duplicate);
r.post('/:id/images', requireAuth, requirePermission('product.edit'), c.uploadImage);
r.patch('/:id/images/:imageId', requireAuth, requirePermission('product.edit'), c.updateImage);
r.delete('/:id/images/:imageId', requireAuth, requirePermission('product.edit'), c.removeImage);
r.post('/:id/stock-adjustment', requireAuth, requirePermission('stock.adjust'), validate({ body: stockAdjustmentSchema }), c.adjustStock);
r.get('/:id/price-history', requireAuth, c.priceHistory);
r.post('/:id/price-change', requireAuth, requirePermission('price.change'), validate({ body: priceChangeSchema }), c.changePrice);

module.exports = r;
