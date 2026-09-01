import { chromium } from 'playwright';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
await page.goto('http://localhost:4173/educators', { waitUntil: 'networkidle' });
await page.waitForTimeout(700);
const info = await page.evaluate(() => {
  // Walk down from body; report each element that is itself wider than its
  // parent's content box AND whose own overflow is visible (so it actually
  // pushes the layout rather than being clipped or scrolled).
  const out = [];
  const walk = (el, depth) => {
    if (depth > 22) return;
    for (const child of el.children) {
      const cs = getComputedStyle(child);
      const parentW = el.clientWidth;
      const childW = child.scrollWidth;
      const clipped = cs.overflowX === 'auto' || cs.overflowX === 'scroll' || cs.overflowX === 'hidden' || cs.overflowX === 'clip';
      if (childW > parentW + 4 && !clipped && depth >= 4) {
        out.push({
          d: depth, tag: child.tagName.toLowerCase(),
          cls: (child.className || '').toString().slice(0, 120),
          childW, parentW, overflowX: cs.overflowX,
          text: (child.textContent || '').trim().slice(0, 45),
        });
      }
      walk(child, depth + 1);
    }
  };
  walk(document.body, 0);
  return { docScroll: document.documentElement.scrollWidth, vw: window.innerWidth, out: out.slice(-8) };
});
console.log(JSON.stringify(info, null, 1));
await browser.close();
