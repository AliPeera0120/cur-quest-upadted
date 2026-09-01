import { chromium } from 'playwright';

const BASE = 'http://127.0.0.1:4181';
const CLASS = 'c_demo_5sci';
const STUDENT = 'u_demo_a_0';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const errs = [];
page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 300)); });
page.on('pageerror', (e) => errs.push('pageerror: ' + String(e).slice(0, 300)));

const step = async (n, f) => {
  try { await f(); console.log('PASS  ' + n); }
  catch (e) { console.log('FAIL  ' + n + ': ' + String(e).split('\n')[0].slice(0, 200)); }
};

await step('sign in as demo teacher', async () => {
  await page.goto(`${BASE}/arena/sign-in`, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /Open the teacher dashboard/i }).click();
  await page.getByRole('heading', { level: 1, name: /Good (morning|afternoon|evening)/i }).waitFor({ timeout: 45000 });
});

await step('student detail', async () => {
  await page.goto(`${BASE}/arena/teach/classes/${CLASS}/students/${STUDENT}`, { waitUntil: 'networkidle' });
  await page.getByRole('heading', { level: 2, name: /Mastery by strand/i }).waitFor({ timeout: 20000 });
  await page.getByRole('heading', { level: 2, name: /Areas to review/i }).waitFor({ timeout: 8000 });
  await page.getByRole('heading', { level: 2, name: /Everything they have finished/i }).waitFor({ timeout: 8000 });
  await page.waitForTimeout(600);
  await page.screenshot({ path: '/tmp/shots/n-student.png', fullPage: true });
});

await step('student detail: assign a review lesson', async () => {
  const btn = page.getByRole('button', { name: /^Assign this$/ }).first();
  if (await btn.count()) {
    await btn.click();
    await page.getByText(/Assigned to the whole class/i).first().waitFor({ timeout: 10000 });
  }
});

await step('student detail: bad class id shows error', async () => {
  await page.goto(`${BASE}/arena/teach/classes/c_nope/students/${STUDENT}`, { waitUntil: 'networkidle' });
  await page.getByText(/Could not open that student/i).waitFor({ timeout: 15000 });
});

await step('assignments across classes', async () => {
  await page.goto(`${BASE}/arena/teach/assignments`, { waitUntil: 'networkidle' });
  await page.getByRole('heading', { level: 1, name: /^Assignments$/ }).waitFor({ timeout: 20000 });
  await page.getByLabel(/^Sort by$/).waitFor({ timeout: 10000 });
  const cards = await page.locator('main ul > li > div.cq-panel').count();
  if (cards < 1) throw new Error('no assignment cards: ' + cards);
  await page.selectOption('select#\\:r0\\:', { index: 0 }).catch(() => {});
  await page.waitForTimeout(400);
  await page.screenshot({ path: '/tmp/shots/n-assignments.png', fullPage: true });
});

await step('assignments: class filter + sort', async () => {
  await page.getByLabel(/^Sort by$/).selectOption('attention');
  await page.waitForTimeout(300);
  const opts = await page.getByLabel(/^Class$/).locator('option').count();
  if (opts < 2) throw new Error('class filter empty');
  await page.getByLabel(/^Class$/).selectOption({ index: 1 });
  await page.waitForTimeout(400);
});

await step('assignments: assign modal opens with class picker', async () => {
  await page.getByRole('button', { name: /Assign a mission/i }).first().click();
  await page.getByRole('dialog').waitFor({ timeout: 8000 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/tmp/shots/n-assign-modal.png' });
  await page.keyboard.press('Escape');
});

await step('library: facets, load more, answer key', async () => {
  await page.goto(`${BASE}/arena/teach/library`, { waitUntil: 'networkidle' });
  await page.getByRole('heading', { level: 1, name: /Lesson library/i }).waitFor({ timeout: 20000 });
  await page.getByRole('heading', { level: 2 }).first().waitFor({ timeout: 15000 });
  const first = await page.locator('main ul > li').count();
  if (first < 20) throw new Error('expected 24 rows, got ' + first);
  await page.getByRole('button', { name: /Show \d+ more/i }).click();
  await page.waitForTimeout(700);
  await page.screenshot({ path: '/tmp/shots/n-library.png', fullPage: false });
});

await step('library: strand chip filters', async () => {
  await page.getByRole('button', { name: /Life Science/i }).first().click();
  await page.waitForTimeout(700);
  const status = await page.locator('[role="status"]').first().textContent();
  if (!/lessons? match/.test(status || '')) throw new Error('status not updated: ' + status);
});

await step('library: details + preview questions with answers', async () => {
  await page.getByRole('button', { name: /Details/i }).first().click();
  await page.getByRole('button', { name: /Preview questions and answers/i }).waitFor({ timeout: 15000 });
  await page.waitForTimeout(400);
  await page.screenshot({ path: '/tmp/shots/n-library-detail.png', fullPage: false });
  await page.getByRole('button', { name: /Preview questions and answers/i }).click();
  await page.getByRole('dialog').waitFor({ timeout: 10000 });
  await page.getByText(/Correct answer/i).first().waitFor({ timeout: 10000 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/tmp/shots/n-answerkey.png' });
  await page.keyboard.press('Escape');
});

await step('quick play: exit ticket', async () => {
  await page.goto(`${BASE}/arena/teach/quick`, { waitUntil: 'networkidle' });
  await page.getByRole('heading', { level: 1, name: /Quick play/i }).waitFor({ timeout: 20000 });
  await page.getByRole('heading', { level: 2, name: /Pick a topic/i }).waitFor({ timeout: 15000 });
  const cards = await page.locator('section[aria-labelledby="exit-h"] ul > li').count();
  if (cards !== 16) throw new Error('expected 16 quick lessons, got ' + cards);
  await page.locator('section[aria-labelledby="exit-h"] button').first().click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: '/tmp/shots/n-quick.png', fullPage: true });
  await page.getByRole('button', { name: /^Assign to /i }).click();
  await page.getByText(/is set$/).waitFor({ timeout: 15000 });
  await page.waitForTimeout(800);
  await page.screenshot({ path: '/tmp/shots/n-quick-result.png' });
});

await step('quick play: pre/post + challenge tabs', async () => {
  await page.getByRole('tab', { name: /Pre & post check/i }).click();
  await page.getByRole('heading', { level: 2, name: /Measure a unit/i }).waitFor({ timeout: 10000 });
  const pairs = await page.locator('section[aria-labelledby="growth-h"] > ul > li').count();
  if (pairs !== 4) throw new Error('expected 4 subject pairs, got ' + pairs);
  await page.screenshot({ path: '/tmp/shots/n-quick-prepost.png', fullPage: true });
  await page.getByRole('tab', { name: /Whole-class challenge/i }).click();
  await page.getByRole('heading', { level: 2, name: /Put it on the board/i }).waitFor({ timeout: 10000 });
});

await step('classroom mode at 1920, immersive, private by default', async () => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto(`${BASE}/arena/teach/classroom/${CLASS}`, { waitUntil: 'networkidle' });
  await page.getByRole('heading', { level: 1, name: /5th Grade Science/i }).waitFor({ timeout: 20000 });
  await page.getByText('CQ-48291').waitFor({ timeout: 10000 });
  if (await page.locator('header a[href="/arena/home"]').count()) throw new Error('site header rendered');
  const sw = page.getByRole('switch', { name: /Show names/i });
  if (await sw.getAttribute('aria-checked') !== 'false') throw new Error('names ON by default');
  const body = await page.textContent('body');
  if (/Individual results are hidden/.test(body) === false) throw new Error('privacy note missing');
  await page.waitForTimeout(700);
  await page.screenshot({ path: '/tmp/shots/n-classroom-1920.png', fullPage: true });
});

await step('classroom mode: names toggle + focus picker + refresh', async () => {
  await page.getByRole('switch', { name: /Show names/i }).click();
  await page.getByText(/Names are on the board/i).waitFor({ timeout: 8000 });
  await page.screenshot({ path: '/tmp/shots/n-classroom-names.png', fullPage: true });
  await page.getByRole('button', { name: /Today’s focus|Today's focus/ }).click();
  await page.getByRole('dialog').waitFor({ timeout: 8000 });
  await page.waitForTimeout(600);
  await page.screenshot({ path: '/tmp/shots/n-classroom-focus.png' });
  await page.locator('[role="dialog"] button', { hasText: /finished/ }).first().click().catch(() => {});
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: /^Refresh$/ }).click();
  await page.waitForTimeout(800);
});

await step('classroom mode at 1024 (Chromebook)', async () => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.reload({ waitUntil: 'networkidle' });
  await page.getByText('CQ-48291').waitFor({ timeout: 15000 });
  await page.waitForTimeout(600);
  await page.screenshot({ path: '/tmp/shots/n-classroom-1024.png', fullPage: true });
});

await step('classroom mode: foreign class errors cleanly', async () => {
  await page.goto(`${BASE}/arena/teach/classroom/c_not_mine`, { waitUntil: 'networkidle' });
  await page.getByText(/Cannot project that class/i).waitFor({ timeout: 15000 });
});

console.log('\nconsole errors: ' + errs.length);
for (const e of [...new Set(errs)]) console.log('  · ' + e);
await browser.close();
