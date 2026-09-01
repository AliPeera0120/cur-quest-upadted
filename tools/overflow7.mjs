import { chromium } from 'playwright';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await (await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' })).newPage();
await page.goto('http://localhost:4173/educators', { waitUntil: 'networkidle' });
await page.waitForTimeout(700);
const out = await page.evaluate(() => {
  const vw = window.innerWidth;
  const res = [];
  // An element makes the PAGE scroll only if it is not inside any scroll/clip
  // container between itself and the root.
  const escapes = (el) => {
    let p = el.parentElement;
    while (p && p !== document.body) {
      const ox = getComputedStyle(p).overflowX;
      if (ox !== 'visible') return false;
      p = p.parentElement;
    }
    return true;
  };
  document.querySelectorAll('body *').forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.right > vw + 2 && r.width > 1 && escapes(el)) {
      const cs = getComputedStyle(el);
      res.push({
        tag: el.tagName.toLowerCase(),
        cls: (el.className || '').toString().slice(0, 110),
        w: Math.round(r.width), left: Math.round(r.left), right: Math.round(r.right),
        pos: cs.position, overflowX: cs.overflowX,
        text: (el.textContent || '').trim().slice(0, 40),
      });
    }
  });
  return res.slice(0, 10);
});
console.log(JSON.stringify(out, null, 1));
await browser.close();
