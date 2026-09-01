import { chromium } from 'playwright';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const PATHS = ['/', '/explore', '/explore/experiments', '/explore/coding', '/explore/briefs',
  '/explore/careers', '/arena', '/programs', '/educators', '/about', '/get-involved', '/privacy'];
const VPS = { mobile: { width: 390, height: 844 }, chromebook: { width: 1366, height: 768 } };
let bad = 0;
for (const [name, viewport] of Object.entries(VPS)) {
  const ctx = await browser.newContext({ viewport, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  for (const p of PATHS) {
    await page.goto('http://localhost:4173' + p, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    const o = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    if (o > 4) { console.log(`OVERFLOW ${name} ${p}: ${o}px`); bad += 1; }
  }
  await ctx.close();
}
console.log(bad ? `${bad} overflowing` : 'no overflow on any public page');
await browser.close();
