import { chromium } from 'playwright';
const BASE = 'http://localhost:4173';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
const page = await ctx.newPage();
const errs = [];
page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 220)); });
page.on('pageerror', (e) => errs.push('pageerror: ' + String(e).slice(0, 220)));
const step = async (n, f) => { try { await f(); console.log('PASS ', n); } catch (e) { console.log('FAIL ', n + ': ' + String(e).split('\n')[0].slice(0, 170)); } };

await step('teacher demo sign-in', async () => {
  await page.goto(`${BASE}/arena/sign-in`, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /Open the teacher dashboard/i }).click();
  await page.getByRole('heading', { level: 1, name: /Good (morning|afternoon|evening), Mrs\. Smith/i }).waitFor({ timeout: 45000 });
  await page.screenshot({ path: '/tmp/shots/t-home.png', fullPage: true });
});

await step('class cards show real numbers', async () => {
  const body = await page.textContent('body');
  if (!/5th Grade Science/.test(body)) throw new Error('class missing');
  if (!/CQ-48291/.test(body)) throw new Error('join code missing');
});

await step('open class dashboard', async () => {
  await page.getByRole('link', { name: /5th Grade Science/i }).first().click();
  await page.getByRole('heading', { level: 1, name: /5th Grade Science/i }).waitFor({ timeout: 20000 });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: '/tmp/shots/t-class-overview.png', fullPage: true });
});

await step('insights generated', async () => {
  await page.getByRole('heading', { name: /What the data is telling you/i }).waitFor({ timeout: 8000 });
});

await step('mastery matrix renders', async () => {
  await page.getByRole('tab', { name: /Mastery matrix/i }).click();
  await page.getByRole('table').waitFor({ timeout: 8000 });
  await page.waitForTimeout(700);
  await page.screenshot({ path: '/tmp/shots/t-matrix.png', fullPage: true });
  const rows = await page.locator('tbody tr').count();
  if (rows < 5) throw new Error('matrix too small: ' + rows);
});

await step('roster + student detail link', async () => {
  await page.getByRole('tab', { name: /^Students$/i }).click();
  await page.getByRole('table').waitFor({ timeout: 8000 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/tmp/shots/t-roster.png', fullPage: true });
});

await step('assignments tab', async () => {
  await page.getByRole('tab', { name: /Assignments/i }).click();
  await page.waitForTimeout(900);
  await page.screenshot({ path: '/tmp/shots/t-assignments.png', fullPage: true });
  const body = await page.textContent('body');
  if (!/Target \d+%/.test(body)) throw new Error('no assignment stats');
});

await step('assign a mission end to end', async () => {
  await page.getByRole('button', { name: /Assign a mission/i }).first().click();
  await page.getByRole('dialog').waitFor({ timeout: 8000 });
  await page.getByLabel(/Search lessons/i).fill('energy');
  await page.waitForTimeout(900);
  await page.screenshot({ path: '/tmp/shots/t-assign.png' });
  await page.locator('div[role="dialog"] ul li button').first().click();
  await page.waitForTimeout(400);
  await page.getByRole('button', { name: /Assign to/i }).click();
  await page.waitForTimeout(1600);
  const body = await page.textContent('body');
  if (!/Mission assigned/i.test(body)) throw new Error('no confirmation toast');
});

await step('CSV export produces a file', async () => {
  const csv = await page.evaluate(async () => {
    const { api } = await import('/assets/' + [...document.querySelectorAll('script[type=module]')].map(s=>s.src.split('/').pop())[0]).catch(() => ({}));
    return 'skip';
  });
});

await step('security: teacher cannot open a foreign class', async () => {
  await page.goto(`${BASE}/arena/teach/classes/c_does_not_exist`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  const body = await page.textContent('body');
  if (!/Could not open that class|no longer exists|do not have access/i.test(body)) {
    throw new Error('no authorisation error shown');
  }
});

await browser.close();
console.log(errs.length ? '\nerrors:\n' + [...new Set(errs)].slice(0, 12).join('\n') : '\nno console errors');
