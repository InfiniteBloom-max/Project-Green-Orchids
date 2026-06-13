const cron = require('node-cron');

const dispatchOutbox = require('./outboxDispatch');
const stockCheck = require('./stockCheck');
const invoiceAging = require('./invoiceAging');
const quoteExpiry = require('./quoteExpiry');
const sessionSweep = require('./sessionSweep');

function registerJobs() {
  // Every 30 seconds: email outbox dispatch
  cron.schedule('*/30 * * * * *', dispatchOutbox);

  // Daily 07:00: stock check
  cron.schedule('0 7 * * *', stockCheck, { timezone: 'Asia/Colombo' });

  // Daily 08:00: invoice aging
  cron.schedule('0 8 * * *', invoiceAging, { timezone: 'Asia/Colombo' });

  // Daily 08:00: quote expiry
  cron.schedule('0 8 * * *', quoteExpiry, { timezone: 'Asia/Colombo' });

  // Daily 02:00: session sweep
  cron.schedule('0 2 * * *', sessionSweep, { timezone: 'Asia/Colombo' });

  console.log('📅 Cron jobs registered');
}

// Export individual runners for manual/external triggering
module.exports = {
  registerJobs,
  dispatchOutbox,
  stockCheck,
  invoiceAging,
  quoteExpiry,
  sessionSweep,
};
