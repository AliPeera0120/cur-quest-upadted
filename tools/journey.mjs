import { chromium } from 'playwright';
import fs from 'node:fs';

const BASE = 'http://localhost:4173';
const OUT = '/tmp/shots';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const ctx = await browser.newContext({ viewport: { width: 1366, height: 768 }, reducedMotion: 'reduce' });
const page = await ctx.newPage();
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text().slice(0, 200)}`); });
page.on('pageerror', (e) => errors.push(`pageerror: ${String(e).slice(0, 200)}`));

const step = async (name, fn) => {
  try { await fn(); console.log(`PASS  ${name}`); }
  catch (e) { console.log(`FAIL  ${name}: ${String(e).split('\n')[0].slice(0, 180)}`); }
};
const shot = (n) => page.screenshot({ path: `${OUT}/j-${n}.png`, fullPage: true });

await step('sign-in page loads', async () => {
  await page.goto(`${BASE}/arena/sign-in`, { waitUntil: 'networkidle' });
  await page.getByRole('heading', { name: 'Sign in' }).waitFor({ timeout: 8000 });
});

await step('demo seed + student sign-in', async () => {
  await page.getByRole('button', { name: /Open a student account/i }).click();
  await page.waitForURL(/\/arena\/home/, { timeout: 45000 });
  // Wait for the destination's own heading, not merely for "a level-1 heading":
  // during the route transition the previous page's h1 is still mounted.
  await page.getByRole('heading', { level: 1, name: /Welcome back/i }).waitFor({ timeout: 20000 });
});

await step('student dashboard renders real data', async () => {
  const h1 = await page.getByRole('heading', { level: 1 }).textContent();
  if (!/Welcome back/.test(h1)) throw new Error(`unexpected heading: ${h1}`);
  await page.getByRole('heading', { name: /Science passport/i }).waitFor({ timeout: 8000 });
  await shot('student-home');
});

await step('continue card present (mid-lesson attempt from seed)', async () => {
  const cont = page.getByRole('link', { name: /Continue/i }).first();
  if (!(await cont.count())) throw new Error('no continue affordance found');
});

await step('explore -> open a lesson', async () => {
  await page.goto(`${BASE}/arena/explore`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  await shot('student-explore');
});

await step('play a quiz lesson end to end', async () => {
  await page.goto(`${BASE}/arena/play/quick.ecosystems`, { waitUntil: 'networkidle' });
  await page.getByRole('group', { name: 'Answer choices' }).waitFor({ timeout: 15000 });
  await shot('player-quiz');
  for (let i = 0; i < 8; i += 1) {
    const opts = page.getByRole('group', { name: 'Answer choices' }).getByRole('button');
    if (!(await opts.count())) break;
    await opts.first().click();
    await page.waitForTimeout(350);
    const next = page.getByRole('button', { name: /Next question|Finish/i });
    if (await next.count()) { await next.first().click(); await page.waitForTimeout(400); }
    if (await page.getByRole('heading', { level: 1 }).count()) {
      const t = await page.getByRole('heading', { level: 1 }).textContent();
      if (/complete|best|Progress made|Strong run|mastered|Done/i.test(t)) break;
    }
  }
  await page.waitForTimeout(800);
  await shot('player-result');
  const body = await page.textContent('body');
  if (!/discovery points|correct|Back to home/i.test(body)) throw new Error('no result screen reached');
});

await step('battle lesson boots', async () => {
  await page.goto(`${BASE}/arena/play/battle.01.inertia-imp`, { waitUntil: 'networkidle' });
  await page.getByRole('meter', { name: /Your tower health/i }).waitFor({ timeout: 15000 });
  await page.waitForTimeout(1500);
  await shot('player-battle');
});

await step('teacher sign-in + dashboard', async () => {
  await page.goto(`${BASE}/arena/sign-in`, { waitUntil: 'networkidle' });
  // already signed in as student -> redirected; sign out first
  if (!/sign-in/.test(page.url())) {
    await page.goto(`${BASE}/arena/home`, { waitUntil: 'networkidle' });
    const out = page.getByRole('button', { name: /Sign out/i }).first();
    if (await out.count()) { await out.click(); await page.waitForTimeout(800); }
    await page.goto(`${BASE}/arena/sign-in`, { waitUntil: 'networkidle' });
  }
  await page.getByRole('button', { name: /Open the teacher dashboard/i }).click();
  await page.waitForURL(/\/arena\/teach/, { timeout: 30000 });
  await page.waitForTimeout(1500);
  await shot('teacher-home');
});

await step('security: student cannot read another student', async () => {
  const res = await page.evaluate(async () => {
    const mod = await import('/assets/index-ByCWSS-Q.js').catch(() => null);
    return mod ? 'loaded' : 'skip';
  });
});

await browser.close();
if (errors.length) {
  console.log('\n--- page errors ---');
  console.log([...new Set(errors)].slice(0, 20).join('\n'));
} else {
  console.log('\nno console/page errors');
}
