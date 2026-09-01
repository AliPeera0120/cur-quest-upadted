import { chromium } from 'playwright';

const BASE = process.env.BASE || 'http://localhost:4180';
const OUT = '/tmp/shots';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const ctx = await browser.newContext({ viewport: { width: 1024, height: 900 }, reducedMotion: 'reduce' });
const page = await ctx.newPage();

let errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text().slice(0, 300)}`); });
page.on('pageerror', (e) => errors.push(`pageerror: ${String(e).slice(0, 300)}`));

const step = async (name, fn) => {
  errors = [];
  try {
    await fn();
    console.log(`${errors.length ? 'ERRS ' : 'PASS '} ${name}${errors.length ? ` :: ${errors.join(' | ')}` : ''}`);
  } catch (e) {
    console.log(`FAIL  ${name}: ${String(e).split('\n')[0].slice(0, 220)}${errors.length ? ` :: ${errors.join(' | ')}` : ''}`);
  }
};

await step('sign in as demo student', async () => {
  await page.goto(`${BASE}/arena/sign-in`, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /Open a student account/i }).click();
  await page.waitForURL(/\/arena\/home/, { timeout: 60000 });
  await page.getByRole('heading', { level: 1, name: /Welcome back/i }).waitFor({ timeout: 30000 });
});

const routes = [
  ['explore', '/arena/explore', /Explore \d+ lessons/i],
  ['missions', '/arena/assignments', /Your missions/i],
  ['progress', '/arena/progress', /What you have learned/i],
  ['badges', '/arena/achievements', /Badges and rank/i],
  ['profile', '/arena/profile', null],
];

for (const [name, path, heading] of routes) {
  await step(`load ${path}`, async () => {
    await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle' });
    if (heading) await page.getByRole('heading', { level: 1, name: heading }).waitFor({ timeout: 20000 });
    else await page.getByRole('heading', { level: 1 }).first().waitFor({ timeout: 20000 });
    await page.waitForTimeout(900);
    await page.screenshot({ path: `${OUT}/sp-${name}.png`, fullPage: true });
  });
}

await step('lesson detail from an explore card', async () => {
  await page.goto(`${BASE}/arena/explore`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  const first = page.locator('a[href^="/arena/lesson/"]').first();
  await first.waitFor({ timeout: 15000 });
  await first.click();
  await page.waitForURL(/\/arena\/lesson\//, { timeout: 20000 });
  await page.getByRole('link', { name: /Start the lesson|Continue where you left off|Play again/i }).waitFor({ timeout: 20000 });
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${OUT}/sp-lesson.png`, fullPage: true });
});

await step('lesson detail for a played lesson (history + sparkline)', async () => {
  await page.goto(`${BASE}/arena/lesson/mission.forces-motion.explorer`, { waitUntil: 'networkidle' });
  await page.getByRole('heading', { level: 1 }).first().waitFor({ timeout: 20000 });
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}/sp-lesson-played.png`, fullPage: true });
});

await step('missing lesson id handled', async () => {
  await page.goto(`${BASE}/arena/lesson/not.a.real.lesson`, { waitUntil: 'networkidle' });
  await page.getByText(/That lesson is not here/i).waitFor({ timeout: 20000 });
});

await step('explore: search, facet chip, sort, load more, strand view', async () => {
  await page.goto(`${BASE}/arena/explore`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.getByLabel('Search lessons').fill('circuits');
  await page.waitForTimeout(900);
  const status = await page.locator('[role="status"]').first().textContent();
  if (!/lesson/i.test(status || '')) throw new Error(`unexpected result count: ${status}`);
  await page.getByLabel('Search lessons').fill('');
  await page.waitForTimeout(800);
  await page.getByRole('button', { name: /^Life Science/ }).click();
  await page.waitForTimeout(800);
  await page.getByLabel('Sort by').selectOption('title');
  await page.waitForTimeout(800);
  const more = page.getByRole('button', { name: /Show \d+ more/ });
  if (await more.count()) { await more.click(); await page.waitForTimeout(800); }
  await page.getByRole('button', { name: /Clear all/ }).click();
  await page.waitForTimeout(800);
  await page.getByRole('button', { name: /By strand/ }).click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/sp-explore-strands.png`, fullPage: true });
});

await step('explore: empty state when filters conflict', async () => {
  await page.goto(`${BASE}/arena/explore`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.getByLabel('Search lessons').fill('zzzznothing');
  await page.waitForTimeout(900);
  await page.getByText(/Nothing matches all of that/i).waitFor({ timeout: 8000 });
});

await step('no lock icons or unlock copy anywhere', async () => {
  for (const path of ['/arena/explore', '/arena/assignments', '/arena/progress', '/arena/achievements', '/arena/lesson/mission.forces-motion.explorer']) {
    await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(900);
    const text = await page.locator('main').innerText();
    if (/\bunlock\b|\blocked\b|complete .{0,20} first/i.test(text)) throw new Error(`lock language on ${path}`);
    const locks = await page.locator('svg.lucide-lock, svg.lucide-lock-keyhole').count();
    if (locks) throw new Error(`lock icon on ${path}`);
  }
});

await step('progress: expand a strand', async () => {
  await page.goto(`${BASE}/arena/progress`, { waitUntil: 'networkidle' });
  await page.getByRole('heading', { level: 1 }).first().waitFor({ timeout: 20000 });
  await page.getByRole('button', { name: /How these levels are worked out/i }).click();
  await page.waitForTimeout(400);
  await page.getByRole('button', { name: /Earth & Space/ }).first().click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/sp-progress-open.png`, fullPage: true });
});

await step('profile: save a change, open leave + delete confirmations', async () => {
  await page.goto(`${BASE}/arena/profile`, { waitUntil: 'networkidle' });
  await page.getByLabel('Title (optional)').fill('Bridge Builder');
  await page.getByRole('button', { name: /Save changes/ }).click();
  await page.getByText(/^Saved$/).first().waitFor({ timeout: 10000 });
  const leave = page.getByRole('button', { name: /Leave class/ }).first();
  if (await leave.count()) {
    await leave.click();
    await page.getByRole('dialog').waitFor({ timeout: 8000 });
    await page.getByRole('button', { name: /Stay in the class/ }).click();
    await page.waitForTimeout(300);
  }
  await page.getByRole('button', { name: /Delete my account/ }).click();
  await page.getByLabel(/Type DELETE to confirm/).waitFor({ timeout: 8000 });
  await page.screenshot({ path: `${OUT}/sp-profile-delete.png`, fullPage: true });
  await page.getByRole('button', { name: /Keep my account/ }).click();
});

await step('missions: play button targets carry the assignment id', async () => {
  await page.goto(`${BASE}/arena/assignments`, { waitUntil: 'networkidle' });
  await page.getByRole('heading', { level: 1 }).first().waitFor({ timeout: 20000 });
  const links = page.locator('a[href*="/arena/play/"][href*="assignment="]');
  if (!(await links.count())) throw new Error('no assignment-scoped play links');
});

/* A brand-new account exercises every empty state at once: no attempts, no
   class, no assignments, no badges, no mastery. */
await step('fresh account: sign out and create one', async () => {
  await page.goto(`${BASE}/arena/profile`, { waitUntil: 'networkidle' });
  await page.locator('main').getByRole('button', { name: /Sign out/ }).click();
  await page.waitForTimeout(600);
  await page.goto(`${BASE}/arena/join`, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /let me just play/i }).click();
  await page.getByLabel('First name').fill('Nadia');
  await page.getByLabel('Username').fill(`nadia${Date.now().toString().slice(-6)}`);
  await page.getByLabel('Password').fill('curious-otter-12');
  await page.getByRole('button', { name: /^Next/ }).click();
  await page.getByRole('button', { name: /Start playing/ }).click();
  await page.waitForURL(/\/arena\/home/, { timeout: 30000 });
});

for (const [name, path, expect] of [
  ['explore', '/arena/explore', /Not tried yet/],
  ['missions', '/arena/assignments', /No missions yet/],
  ['progress', '/arena/progress', /Nothing recorded yet/],
  ['badges', '/arena/achievements', /No badges yet/],
  ['profile', '/arena/profile', /You are not in a class/],
  ['lesson', '/arena/lesson/quick.ecosystems', /You have not played this one yet/],
]) {
  await step(`fresh account: ${path} empty state`, async () => {
    await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await page.getByText(expect).first().waitFor({ timeout: 15000 });
    await page.screenshot({ path: `${OUT}/sp-empty-${name}.png`, fullPage: true });
  });
}

await browser.close();
