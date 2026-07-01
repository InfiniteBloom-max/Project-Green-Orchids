const svc = require('./delivery.service');
const { publicUrl } = require('../../middleware/upload');

const list = async (req, res, next) => {
  try {
    const { status, assignedTo } = req.query;
    res.json(await svc.list({ assignedTo, status }));
  } catch (e) { next(e); }
};

const get = async (req, res, next) => {
  try { res.json(await svc.getById(Number(req.params.id))); }
  catch (e) { next(e); }
};

const getEvents = async (req, res, next) => {
  try { res.json(await svc.events(Number(req.params.id))); }
  catch (e) { next(e); }
};

const assign = async (req, res, next) => {
  try {
    const { assignedTo } = req.body;
    res.json(await svc.assign(Number(req.params.id), assignedTo, req.user.id));
  } catch (e) { next(e); }
};

const dispatch = async (req, res, next) => {
  try { res.json(await svc.transition(Number(req.params.id), 'DISPATCHED', { actorId: req.user.id })); }
  catch (e) { next(e); }
};

const inTransit = async (req, res, next) => {
  try { res.json(await svc.transition(Number(req.params.id), 'IN_TRANSIT', { actorId: req.user.id })); }
  catch (e) { next(e); }
};

const uploadPod = async (req, res, next) => {
  try {
    const podUrl = req.file ? publicUrl('pod', req.file.filename) : (req.body.podUrl || null);
    if (!podUrl) return res.status(400).json({ success: false, error: { code: 'POD_REQUIRED', message: 'A proof-of-delivery photo is required' } });
    res.json(await svc.transition(Number(req.params.id), 'DELIVERED', { podUrl, actorId: req.user.id }));
  } catch (e) { next(e); }
};

const fail = async (req, res, next) => {
  try {
    const { note } = req.body;
    res.json(await svc.transition(Number(req.params.id), 'FAILED', { note, actorId: req.user.id }));
  } catch (e) { next(e); }
};

const cancel = async (req, res, next) => {
  try { res.json(await svc.transition(Number(req.params.id), 'CANCELLED', { actorId: req.user.id })); }
  catch (e) { next(e); }
};

module.exports = { list, get, getEvents, assign, dispatch, inTransit, uploadPod, fail, cancel };
