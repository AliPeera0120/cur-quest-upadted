import { chromium } from 'playwright';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await (await browser.newContext({ viewport: { width: 1366, height: 768 } })).newPage();
const bad = new Set();
page.on('response', (r) => { if (r.status() >= 400) bad.add(`${r.status()} ${r.url()}`); });
for (const p of ['/', '/arena', '/about', '/educators', '/arena/sign-in']) {
  await page.goto('http://localhost:4173' + p, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
}
console.log(bad.size ? [...bad].join('\n') : 'no failing requests');
await browser.close();
