import { chromium } from 'playwright';
const BASE = 'http://localhost:4173';
const PUBLIC = ['/', '/explore', '/explore/experiments', '/explore/coding', '/explore/briefs',
  '/explore/careers', '/arena', '/programs', '/educators', '/about', '/get-involved', '/privacy',
  '/arena/sign-in', '/arena/join', '/arena/sign-up/teacher', '/nope-404',
  '/Home', '/AboutUs', '/ScienceArena', '/QuestPassport'];
const STUDENT = ['/arena/home', '/arena/explore', '/arena/assignments', '/arena/progress',
  '/arena/achievements', '/arena/profile', '/arena/lesson/quick.ecosystems'];
const TEACHER = ['/arena/teach', '/arena/teach/classes', '/arena/teach/classes/c_demo_5sci',
  '/arena/teach/assignments', '/arena/teach/library', '/arena/teach/quick',
  '/arena/teach/classes/c_demo_5sci/students/u_demo_a_0'];
const ADMIN = ['/arena/admin', '/arena/admin/lessons', '/arena/admin/skills', '/arena/admin/content',
  '/arena/admin/lessons/quick.ecosystems'];

const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  chromebook: { width: 1366, height: 768 },
  tablet: { width: 834, height: 1112 },
  mobile: { width: 390, height: 844 },
};

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const problems = [];
let checked = 0;

async function visit(page, path, vp, label) {
  const errs = [];
  const onC = (m) => { if (m.type() === 'error' && !/favicon|404 \(Not Found\)/.test(m.text())) errs.push(m.text().slice(0, 180)); };
  const onE = (e) => errs.push('THROW ' + String(e).slice(0, 180));
  page.on('console', onC); page.on('pageerror', onE);
  try {
    await page.goto(BASE + path, { waitUntil: 'networkidle', timeout: 25000 });
    await page.waitForTimeout(700);
    const body = await page.textContent('body');
    if (!body || body.trim().length < 60) errs.push('page rendered almost nothing');
    if (/Coming together|undefined|NaN%|\[object Object\]/.test(body)) {
      errs.push('placeholder or bad value in output: ' + (body.match(/Coming together|undefined|NaN%|\[object Object\]/) || [])[0]);
    }
    /* Horizontal overflow is the classic responsive break — but scrollWidth
       alone gives false positives, because Chromium folds a nested
       overflow-auto scroller's content width into its ancestors even when the
       root cannot scroll. So test the thing that actually matters: can the
       user drag the page sideways, and is any unclipped element off-screen. */
    const overflow = await page.evaluate(() => {
      const before = window.scrollX;
      window.scrollTo(600, 0);
      const canScroll = window.scrollX > before;
      window.scrollTo(0, 0);
      if (!canScroll) return 0;
      return document.documentElement.scrollWidth - window.innerWidth;
    });
    if (overflow > 4) errs.push(`page scrolls sideways by ${overflow}px`);
  } catch (e) {
    errs.push('NAV ' + String(e).split('\n')[0].slice(0, 150));
  }
  page.off('console', onC); page.off('pageerror', onE);
  checked += 1;
  if (errs.length) problems.push(`[${vp}] ${label}${path}\n    ${[...new Set(errs)].join('\n    ')}`);
}

for (const [vpName, viewport] of Object.entries(VIEWPORTS)) {
  const ctx = await browser.newContext({ viewport, reducedMotion: 'reduce' });
  const page = await ctx.newPage();

  for (const p of PUBLIC) await visit(page, p, vpName, '');

  // seed once and walk the student area
  await page.goto(`${BASE}/arena/sign-in`, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /Open a student account/i }).click().catch(() => {});
  await page.waitForTimeout(vpName === 'desktop' ? 12000 : 6000);
  for (const p of STUDENT) await visit(page, p, vpName, 'student ');

  // teacher
  await page.goto(`${BASE}/arena/home`, { waitUntil: 'networkidle' }).catch(() => {});
  await page.evaluate(() => {
    const d = JSON.parse(localStorage.getItem('cq_platform_v2'));
    d.session = { profileId: 'u_demo_teacher', startedAt: new Date().toISOString() };
    localStorage.setItem('cq_platform_v2', JSON.stringify(d));
  }).catch(() => {});
  for (const p of TEACHER) await visit(page, p, vpName, 'teacher ');

  // admin
  await page.evaluate(() => {
    const d = JSON.parse(localStorage.getItem('cq_platform_v2'));
    d.session = { profileId: 'u_demo_admin', startedAt: new Date().toISOString() };
    localStorage.setItem('cq_platform_v2', JSON.stringify(d));
  }).catch(() => {});
  for (const p of ADMIN) await visit(page, p, vpName, 'admin ');

  await ctx.close();
}
await browser.close();
console.log(`checked ${checked} page loads`);
if (problems.length) { console.log(`\n${problems.length} with problems:\n`); console.log(problems.join('\n')); }
else console.log('no problems found');
