import { chromium } from 'playwright';
import fs from 'node:fs';

const BASE = process.env.BASE || 'http://localhost:4173';
const OUT = process.env.OUT || '/tmp/shots';
const VIEWPORTS = {
  desktop:    { width: 1440, height: 1000 },
  chromebook: { width: 1366, height: 768 },
  tablet:     { width: 834,  height: 1112 },
  mobile:     { width: 390,  height: 844 },
};

const targets = JSON.parse(process.env.TARGETS || '[]');
const only = (process.env.VIEWPORTS || 'desktop').split(',');

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
fs.mkdirSync(OUT, { recursive: true });
const errors = [];

for (const vpName of only) {
  const ctx = await browser.newContext({
    viewport: VIEWPORTS[vpName],
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
  });
  const page = await ctx.newPage();
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`[${vpName}] console: ${m.text().slice(0, 300)}`); });
  page.on('pageerror', (e) => errors.push(`[${vpName}] pageerror: ${String(e).slice(0, 300)}`));

  for (const t of targets) {
    const url = `${BASE}${t.path}`;
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      if (t.setup) await page.evaluate(t.setup);
      if (t.wait) await page.waitForTimeout(t.wait);
      // Reveal-on-scroll elements need a pass to become visible before a full-page shot.
      await page.evaluate(async () => {
        const h = document.body.scrollHeight;
        for (let y = 0; y < h; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 40)); }
        window.scrollTo(0, 0);
        await new Promise((r) => setTimeout(r, 200));
      });
      const file = `${OUT}/${t.name}.${vpName}.png`;
      await page.screenshot({ path: file, fullPage: t.full !== false });
      console.log(`ok  ${t.name} ${vpName}  ${(fs.statSync(file).size / 1024).toFixed(0)}KB`);
    } catch (err) {
      console.log(`ERR ${t.name} ${vpName}: ${String(err).slice(0, 200)}`);
      errors.push(`[${vpName}] ${t.path}: ${String(err).slice(0, 200)}`);
    }
  }
  await ctx.close();
}
await browser.close();
if (errors.length) {
  console.log('\n--- issues ---');
  console.log([...new Set(errors)].slice(0, 40).join('\n'));
}
