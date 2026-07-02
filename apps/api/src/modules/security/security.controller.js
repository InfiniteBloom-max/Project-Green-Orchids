const s = require('./security.service');
module.exports = {
  logins: async (r, res, n) => { try { const d = await s.listLogins(r.query); res.json({ success: true, ...d }); } catch (e) { n(e); } },
  sessions: async (r, res, n) => { try { const d = await s.listSessions(); res.json({ success: true, data: d }); } catch (e) { n(e); } },
  forceLogout: async (r, res, n) => { try { await s.forceLogout(r.params.id, r.user.id); res.json({ success: true, data: { message: 'Session terminated' } }); } catch (e) { n(e); } },
  lockedAccounts: async (r, res, n) => { try { const d = await s.listLockedAccounts(); res.json({ success: true, data: d }); } catch (e) { n(e); } },
  unlock: async (r, res, n) => { try { await s.unlockAccount(r.params.id, r.user.id); res.json({ success: true, data: { message: 'Account unlocked' } }); } catch (e) { n(e); } },
  auditLogs: async (r, res, n) => { try { const d = await s.listAuditLogs(r.query); res.json({ success: true, ...d }); } catch (e) { n(e); } },
  getAccessWindows: async (r, res, n) => { try { const d = await s.getAccessWindowSettings(); res.json({ success: true, data: d }); } catch (e) { n(e); } },
  saveAccessWindows: async (r, res, n) => { try { const d = await s.saveAccessWindowSettings(r.body, r.user.id); res.json({ success: true, data: d }); } catch (e) { n(e); } },
};
