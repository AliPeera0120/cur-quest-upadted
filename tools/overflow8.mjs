import { chromium } from 'playwright';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await (await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' })).newPage();
await page.goto('http://localhost:4173/educators', { waitUntil: 'networkidle' });
await page.waitForTimeout(700);
const r = await page.evaluate(() => {
  const before = window.scrollX;
  window.scrollTo(600, 0);
  const after = window.scrollX;
  const res = {
    canScroll: after > before, scrolledTo: after,
    docScrollW: document.documentElement.scrollWidth,
    bodyScrollW: document.body.scrollWidth,
    htmlOverflowX: getComputedStyle(document.documentElement).overflowX,
    bodyOverflowX: getComputedStyle(document.body).overflowX,
  };
  window.scrollTo(0, 0);
  return res;
});
console.log(JSON.stringify(r, null, 1));
// Now try neutralising the matrix scroller to confirm it is the cause
const r2 = await page.evaluate(() => {
  document.querySelectorAll('.cq-table').forEach((t) => { t.style.display = 'none'; });
  const before = window.scrollX;
  window.scrollTo(600, 0);
  const after = window.scrollX;
  window.scrollTo(0, 0);
  return { canScrollWithoutTable: after > before, docScrollW: document.documentElement.scrollWidth };
});
console.log(JSON.stringify(r2, null, 1));
await browser.close();
