# CuriosityQuest

The public site and **Science Arena**, a classroom STEM learning platform, for
CuriosityQuest — a student-founded nonprofit making hands-on STEM free.

Live at [curiosity-quest.org](https://curiosity-quest.org). Deployed to GitHub
Pages from `main`.

---

## Run it

```bash
npm install
npm run content     # generates src/content/ from src/data/ (run after editing data)
npm run dev
```

`npm run build` runs the content build first, so CI never ships a stale catalog.

There is no backend to start. The platform runs entirely in the browser by
default — see **Backends** below.

To look around with realistic data: go to `/arena/sign-in` and use one of the
demo buttons. That seeds a full school (two classes, twenty students with real
answer histories, assignments in mixed states, one student who never signed in)
and signs you in as a teacher, a student, or an admin.

---

## What is here

```
src/
  design/          tokens.css, base.css, system.css — the whole visual identity
  components/
    cq/            the component library every screen is built from
    marketing/     public-site section primitives
    player/        lesson activity renderers (quiz, battle, read, build, reflect)
    arena/         the original hand-drawn battle sprites, preserved
    teacher/       assign-a-mission modal
  platform/        the product's engine — see below
  content/         GENERATED. Do not edit by hand.
  data/            the original content. This is the source of truth.
  pages/           one file per route
  shell/           layouts, header, footer, error boundary
  _legacy/         the pre-rebuild source, moved aside rather than deleted
scripts/
  taxonomy.mjs     six strands, sixteen topics, forty-eight skills, and the
                   keyword rules that assign every question to one of them
  build-content.mjs migrates src/data/*.json into src/content/*.json
supabase/
  migrations/      the Postgres schema and its row-level-security policies
DESIGN.md          the design system: tokens, components, non-negotiables
PLATFORM.md        the data API every screen talks to
```

`DESIGN.md` and `PLATFORM.md` are the two files to read before changing
anything.

---

## The product, in one paragraph

A student can open **any** of the 204 lessons at any time. Nothing is locked
behind finishing something else. Underneath, every answer is tagged to one of
48 science skills and accumulates as evidence, so the platform can tell a
teacher what a student actually understands rather than which games they
clicked. Assignments are a due date and a target, not a gate. That single
idea — *access is never the reward* — is what the whole architecture exists to
support, and it is why there is no `unlocked` column anywhere in the schema.

---

## The mastery model

`src/platform/mastery.js` is a pure module: data in, data out, no React and no
storage, so the rules can be reasoned about and unit-tested.

A skill's level comes from evidence, not from a single result:

| Level | Requires |
|---|---|
| Not started | no evidence |
| Beginning | some evidence, under 45% |
| Developing | 45% |
| Proficient | 70%, and ≥ 5 scored questions |
| Mastered | 85%, ≥ 8 questions, ≥ 4 *distinct* questions, across ≥ 2 sittings, with both recent sittings ≥ 75% |

Three deliberate properties:

- **A lucky 100% is not mastery.** Four perfect answers in one sitting reads as
  Developing, because the evidence floor has not been met.
- **Improvement counts, regression counts too.** The figure is the kinder of a
  recency-weighted mean and the mean of the last two sittings, so 60 → 80 → 90
  reaches Mastered, while 90 → 90 → 50 falls back to Proficient.
- **Replaying two questions cannot farm a level.** Only the three most recent
  answers to any one question count, and Mastered needs four distinct
  questions. Skills backed by a thin question bank therefore cap at
  Proficient — the admin overview flags exactly which ones and why.

Strand roll-ups additionally gate on **coverage**: 100% across two of a
strand's ten skills is not "Proficient in Earth & Space", and the UI shows the
fraction next to the figure so the number is never mysterious.

---

## Content

Nothing was rewritten by hand. `scripts/build-content.mjs` reads the original
`src/data/*.json` and generates the catalog, asserting on the way through that
every legacy item survives and that no lesson references a missing skill or
question. It fails the build rather than shipping a gap.

What comes out:

| | |
|---|---|
| 204 lessons | 32 topic missions, 16 five-minute challenges, 12 Arena battles, 72 hands-on experiments, 50 coding lessons, 8 pre/post assessments, 14 newsletter briefs |
| 234 questions | tagged to a skill and a difficulty |
| 502 activities | intro, explain, build, quiz, battle, reflect |
| 48 skills | across 6 strands |

Three output files, loaded at three different moments so a visitor reading the
homepage never downloads the lesson bank:

- `summary.json` (~6 KB) — bundled; real counts and sample questions for the
  public site
- `catalog.json` (~254 KB) — lazy; fetched on entering the Arena
- `bank.json` (~381 KB) — lazy; fetched when a lesson is opened

Admins can author lessons in the browser (`/arena/admin`). Those edits are
stored as overrides and exported as JSON to be committed back — the export page
explains the round trip, including that until you commit it the work exists on
one device only.

---

## Backends

Every screen talks to `api` from `src/platform/api.js` and nothing else. Two
implementations satisfy the same interface.

### `local` (default)

Browser storage. No infrastructure. Everything works — accounts, classes, class
codes, assignments, mastery, dashboards, CSV export. Passwords are salted and
stretched with PBKDF2-SHA-256 rather than stored in plain text, and the
authorisation guards are written as if they were server-side, so the shapes do
not change when they become server-side.

Its limit is honest and stated in the UI: data lives on one device and one
browser profile.

### `supabase`

Postgres with row-level security. Same interface, real cross-device accounts,
and authorisation enforced by the database rather than by the interface — a
crafted request cannot reach another student's rows. Answers are graded by a
`SECURITY DEFINER` function, so the answer key never reaches the browser.

To switch a deployment over:

1. Create a Supabase project and run `supabase/migrations/0001_init.sql`.
2. Load the content tables from `src/content/`.
3. Set `VITE_CQ_BACKEND=supabase`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
4. Deploy. The frontend stays static, so GitHub Pages still works.

Student sign-in stays username-based either way. Supabase auth needs an email,
so a username maps to `<username>@students.curiosity-quest.org`, which is never
displayed, never mailed, and never treated as a contact address.

---

## Child privacy

A student account holds a first name, a username, a password hash, an avatar
choice, an optional coarse grade band, and their learning record. It does not
hold an email address, a surname, a birthdate, a school, an address, a photo, or
a free-text profile. There is no advertising, no third-party analytics, and no
tracking; fonts are self-hosted so loading a page tells nobody else you visited.

Reflection notes a student writes are stored in their own attempt and are never
shown to a teacher.

`/privacy` says all of this to parents and administrators, including what we
cannot promise.

---

## Accessibility

- Every input goes through a wrapper that guarantees a visible label.
- Mastery is never colour alone — always a glyph, a word, and a colour, with a
  legend beside every matrix.
- Touch targets are ≥ 44px, and ≥ 52px inside the lesson player.
- `prefers-reduced-motion` is honoured globally.
- Charts encode one measure with a single-hue ramp; "no data" is a hatch
  texture, not a colour. The palette was checked with a contrast validator
  rather than by eye, and the ratios are noted in `tokens.css`.
- The battle narrates its state to a live region, so it exists for a screen
  reader and not only as pixels.
- `cb` (1024px) is the primary desktop breakpoint, because the classroom
  default is a Chromebook.

---

## Testing

`tools/` holds Playwright scripts run against `vite preview`:

```bash
npm run build
npx vite preview --port 4173 --strictPort &
node tools/sweep.mjs            # every route × 4 viewports, console errors, overflow
node tools/journey.mjs          # student: sign in → play a quiz → battle → result
node tools/teacher-journey.mjs  # teacher: class → matrix → roster → assign a mission
```

The sweep covers 156 page loads across desktop, Chromebook, tablet and mobile.

---

## Deploying

Push to `main`. `.github/workflows/deploy.yml` builds and publishes to GitHub
Pages, and copies `index.html` to `404.html` so client-side routes resolve.

Old URLs from the previous site (`/ScienceArena`, `/QuestPassport`, `/AboutUs`
and the rest) are redirected in `src/routes.jsx`, so nothing already linked or
bookmarked breaks.
