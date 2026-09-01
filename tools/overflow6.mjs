import { chromium } from 'playwright';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
for (const p of ['/educators', '/']) {
  const page = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  await page.goto('http://localhost:4173' + p, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  const r = await page.evaluate(() => {
    const before = window.scrollX;
    window.scrollTo(600, 0);
    const after = window.scrollX;
    window.scrollTo(0, 0);
    return {
      docScrollW: document.documentElement.scrollWidth,
      bodyScrollW: document.body.scrollWidth,
      docClientW: document.documentElement.clientWidth,
      canScrollX: after > before,
      scrolledTo: after,
    };
  });
  console.log(p, JSON.stringify(r));
  await page.close();
}
await browser.close();
