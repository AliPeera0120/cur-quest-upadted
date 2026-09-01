import { chromium } from 'playwright';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
await page.goto('http://localhost:4173/educators', { waitUntil: 'networkidle' });
await page.waitForTimeout(800);
const culprits = await page.evaluate(() => {
  const vw = window.innerWidth;
  const out = [];
  document.querySelectorAll('*').forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.width > vw + 4 || r.right > vw + 4) {
      out.push({
        tag: el.tagName.toLowerCase(),
        cls: (el.className || '').toString().slice(0, 160),
        w: Math.round(r.width), right: Math.round(r.right),
        text: (el.textContent || '').trim().slice(0, 60),
      });
    }
  });
  // keep only the outermost few offenders
  return out.slice(0, 12);
});
console.log(JSON.stringify(culprits, null, 1));
await browser.close();
