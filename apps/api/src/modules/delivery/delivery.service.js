const repo = require('./delivery.repository');
const { AppError } = require('../../middleware/errors');

const VALID_TRANSITIONS = {
  PENDING:    ['ASSIGNED', 'CANCELLED'],
  ASSIGNED:   ['DISPATCHED', 'CANCELLED'],
  DISPATCHED: ['IN_TRANSIT', 'FAILED'],
  IN_TRANSIT: ['DELIVERED', 'FAILED'],
  DELIVERED:  [],
  FAILED:     ['DISPATCHED'],
  CANCELLED:  [],
};

async function list(filters) { return repo.list(filters); }
async function getById(id) {
  const d = await repo.getById(id);
  if (!d) throw new AppError('Delivery not found', 404);
  return d;
}
async function getByOrder(orderId) { return repo.getByOrderId(orderId); }
async function createForOrder(orderId) { return repo.create(orderId); }

async function assign(id, assignedTo, actorId) {
  const d = await repo.getById(id);
  if (!d) throw new AppError('Delivery not found', 404);
  if (!['PENDING','ASSIGNED'].includes(d.status)) throw new AppError('Cannot reassign at this stage', 400);
  return repo.assign(id, assignedTo, actorId);
}

async function transition(id, status, opts) {
  const d = await repo.getById(id);
  if (!d) throw new AppError('Delivery not found', 404);
  const allowed = VALID_TRANSITIONS[d.status] || [];
  if (!allowed.includes(status)) {
    throw new AppError(`Cannot move from ${d.status} to ${status}`, 400);
  }
  return repo.transition(id, status, opts);
}

async function events(id) {
  await getById(id); // 404 check
  return repo.events(id);
}

module.exports = { list, getById, getByOrder, createForOrder, assign, transition, events };
