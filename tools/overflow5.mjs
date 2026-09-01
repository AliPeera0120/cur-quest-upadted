import { chromium } from 'playwright';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
await page.goto('http://localhost:4173/educators', { waitUntil: 'networkidle' });
await page.waitForTimeout(700);
const out = await page.evaluate(() => {
  const vw = window.innerWidth;
  const res = [];
  const clippedByAncestor = (el) => {
    let p = el.parentElement;
    while (p && p !== document.documentElement) {
      const ox = getComputedStyle(p).overflowX;
      if (ox === 'hidden' || ox === 'auto' || ox === 'scroll' || ox === 'clip') return true;
      p = p.parentElement;
    }
    return false;
  };
  document.querySelectorAll('*').forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.right > vw + 4 && r.width > 0 && !clippedByAncestor(el) && el.children.length === 0) {
      res.push({
        tag: el.tagName.toLowerCase(),
        cls: (el.className || '').toString().slice(0, 110),
        w: Math.round(r.width), left: Math.round(r.left), right: Math.round(r.right),
        text: (el.textContent || '').trim().slice(0, 50),
      });
    }
  });
  return res.slice(0, 15);
});
console.log(JSON.stringify(out, null, 1));
await browser.close();
