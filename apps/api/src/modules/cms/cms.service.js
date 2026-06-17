const { AppError } = require('../../middleware/errors');
const repo = require('./cms.repository');

const service = {
  async list() { return repo.findAll(); },
  async get(key) { const b = await repo.findByKey(key); if (!b) throw new AppError('NOT_FOUND', 'CMS block not found', 404); return b; },
  async create(data) { const existing = await repo.findByKey(data.key); if (existing) throw new AppError('KEY_EXISTS', 'CMS block with this key already exists', 409); return repo.create(data); },
  async update(key, data) { await this.get(key); return repo.update(key, data); },
  async togglePublish(key) { const b = await this.get(key); await repo.togglePublish(key, !b.is_published); return repo.findByKey(key); },
};
module.exports = service;
