const path = require('path');
const puppeteer = require('puppeteer-core');

(async () => {
  const htmlPath = path.resolve(__dirname, 'session-snapshot.html');
  // __dirname is docs/snapshots/session-snapshot-source/ — one level up is docs/snapshots/,
  // where the rendered PDF actually lives.
  const outPath = path.resolve(__dirname, '..', 'PROJECT-GREEN-SESSION-SNAPSHOT-2026-07-03.pdf');

  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
  });
  const page = await browser.newPage();
  page.on('console', (msg) => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', (err) => console.log('PAGE ERROR:', err));
  await page.goto('file:///' + htmlPath.replace(/\\/g, '/'), { waitUntil: 'load', timeout: 60000 });
  await page.evaluateHandle('document.fonts.ready');
  await new Promise((r) => setTimeout(r, 1500));
  await page.pdf({
    path: outPath,
    printBackground: true,
    format: 'A4',
    margin: { top: 0, bottom: 0, left: 0, right: 0 },
    timeout: 120000,
  });
  await browser.close();
  console.log('Wrote', outPath);
})();
