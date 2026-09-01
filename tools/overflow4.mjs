import { chromium } from 'playwright';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
await page.goto('http://localhost:4173/educators', { waitUntil: 'networkidle' });
await page.waitForTimeout(700);
const chain = await page.evaluate(() => {
  const table = document.querySelector('.cq-table');
  const out = [];
  let el = table;
  while (el && el !== document.documentElement) {
    const cs = getComputedStyle(el);
    out.push({
      tag: el.tagName.toLowerCase(),
      cls: (el.className || '').toString().slice(0, 90),
      clientW: el.clientWidth,
      scrollW: el.scrollWidth,
      rectW: Math.round(el.getBoundingClientRect().width),
      overflowX: cs.overflowX,
      minWidth: cs.minWidth,
      display: cs.display,
    });
    el = el.parentElement;
  }
  return out;
});
console.log(JSON.stringify(chain.slice(0, 9), null, 1));
await browser.close();
