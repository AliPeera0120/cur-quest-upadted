import { chromium } from 'playwright';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await (await browser.newContext({ viewport: { width: 1366, height: 900 } })).newPage();
page.on('console', (m) => console.log(`[${m.type()}]`, m.text().slice(0, 300)));
page.on('pageerror', (e) => console.log('[pageerror]', String(e).slice(0, 400)));
await page.goto('http://localhost:4173/arena/sign-in', { waitUntil: 'networkidle' });
await page.getByRole('button', { name: /Open a student account/i }).click();
await page.waitForTimeout(12000);
console.log('URL:', page.url());
console.log('H1:', await page.getByRole('heading', { level: 1 }).first().textContent().catch(() => 'none'));
const stored = await page.evaluate(() => {
  const raw = localStorage.getItem('cq_platform_v2');
  if (!raw) return 'no store';
  const d = JSON.parse(raw);
  return {
    session: d.session,
    profiles: Object.keys(d.profiles).length,
    usernames: Object.keys(d.usernames).slice(0, 6),
    attempts: Object.keys(d.attempts).length,
    responses: d.responses.length,
    seeded: d.meta.seeded,
  };
});
console.log('store:', JSON.stringify(stored));
await page.screenshot({ path: '/tmp/shots/debug1.png', fullPage: true });
await browser.close();
