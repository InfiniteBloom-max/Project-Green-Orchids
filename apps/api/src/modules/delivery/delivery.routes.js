const { Router } = require('express');
const c = require('./delivery.controller');
const { requireAuth } = require('../../middleware/auth');
const { requirePermission } = require('../../middleware/rbac');

const r = Router();
r.use(requireAuth);

r.get('/',           requirePermission('delivery.view'), c.list);
r.get('/:id',        requirePermission('delivery.view'), c.get);
r.get('/:id/events', requirePermission('delivery.view'), c.getEvents);

r.patch('/:id/assign',     requirePermission('delivery.assign'), c.assign);
r.patch('/:id/dispatch',   requirePermission('delivery.update'), c.dispatch);
r.patch('/:id/in-transit', requirePermission('delivery.update'), c.inTransit);
r.patch('/:id/pod',        requirePermission('pod.upload'), c.uploadPod);
r.patch('/:id/fail',       requirePermission('delivery.update'), c.fail);
r.patch('/:id/cancel',     requirePermission('delivery.update'), c.cancel);

module.exports = r;
