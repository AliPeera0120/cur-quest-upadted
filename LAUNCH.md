# Launching CuriosityQuest v2

Two separate things: **previewing it on your Mac**, and **publishing it to
curiosity-quest.org**. Do the preview first.

---

## 1. Preview it locally

Open Terminal and run:

```bash
cd ~/Documents/GitHub/cur-quest-upadted
git checkout redesign/curiosityquest-v2
npm install
npm run dev
```

`npm install` is required even though `node_modules/` already exists — a few
packages (the two variable fonts and the Supabase client) are new and their
folders are currently empty.

Vite prints a local URL (usually `http://localhost:5173`). Open it.

To stop the server: `Ctrl-C`.

### What to click through

| URL | What you should see |
| --- | --- |
| `/` | New homepage, original logo, four tabs: Home / About Us / Activities / Interactive Play |
| `/explore` | All 204 lessons, nothing locked |
| `/arena` | Science Arena entry |
| `/arena/join` | Student sign-in / class-code join |
| `/educators` | Teacher pitch + the class-by-skill mastery matrix |

Demo data is seeded into your browser on first visit, so the student and
teacher dashboards have real numbers to look at. Sign-in details are printed
on `/arena/join`.

### If you want a production check

```bash
npm run build
npm run preview
```

This is the exact build GitHub Actions runs. It should end with `✓ built in …`
and no errors.

---

## 2. Publish to curiosity-quest.org

The repo already deploys through GitHub Actions: any push to `main` triggers
`.github/workflows/deploy.yml`, which runs `npm ci`, `npm run build`, copies
`index.html` to `404.html` (so client-side routes work), and publishes `dist/`
to GitHub Pages. `public/CNAME` carries the custom domain, so the domain
survives every deploy. **You do not need to change any GitHub setting.**

### Step 1 — push the branch

```bash
cd ~/Documents/GitHub/cur-quest-upadted
git push --force-with-lease -u origin redesign/curiosityquest-v2
```

`--force-with-lease` is needed because the last commit was amended after the
branch was first pushed. It is safe: it refuses to run if someone else pushed
to that branch in the meantime.

### Step 2 — open a pull request (recommended)

```bash
gh pr create --base main --head redesign/curiosityquest-v2 \
  --title "Rebuild CuriosityQuest: new design system + Science Arena platform" \
  --body "Full redesign. Legacy source preserved in src/_legacy/."
```

No `gh`? Open the repo on github.com — it offers a "Compare & pull request"
button for the newly pushed branch.

Reviewing the PR is worth it: GitHub shows you every file that changed.

### Step 3 — merge, which deploys

Merge the PR (or, if you'd rather skip the PR: `git checkout main && git merge
redesign/curiosityquest-v2 && git push`).

Merging to `main` starts the deploy. Watch it under the repo's **Actions** tab —
it takes roughly 2–3 minutes. When the `deploy` job goes green,
curiosity-quest.org is serving the new site.

Browsers cache aggressively. Hard-reload (`Cmd-Shift-R`) if you still see the
old site.

---

## 3. Rolling back

Nothing is destroyed. `main` still points at the old site until you merge, and
after merging you can revert:

```bash
git revert -m 1 <merge-commit-sha>
git push
```

That redeploys the previous site within a few minutes.

---

## 4. Optional: turn on real accounts

Right now accounts, classes and progress live in each browser's own storage —
enough to demo, and no student data leaves the device. To make accounts real
and shared across devices, point the app at Supabase:

1. Create a free project at supabase.com.
2. In the Supabase SQL editor, run `supabase/migrations/0001_init.sql`. It
   creates the schema **and** the row-level-security policies that stop one
   teacher reading another teacher's students.
3. Add a `.env` file in the repo root:

   ```
   VITE_SUPABASE_URL=https://<project>.supabase.co
   VITE_SUPABASE_ANON_KEY=<anon key>
   ```

4. For the deployed site, add the same two values as repository secrets and
   reference them in the build step of `deploy.yml`.

The app auto-detects the env vars and switches backends. No code changes.
Answer grading stays server-side, so the answer key never reaches a student's
browser. See `PLATFORM.md`.

---

## 5. Housekeeping in your folder

Safe to delete whenever you like — none of it is used by the build:

- `_to_delete/` — scratch from this rebuild (also git-ignored)
- `curiosityquest-main/` — empty leftover folder
- `dist/` — build output, regenerated every time

`src/_legacy/` is **not** junk: it's the entire pre-rebuild source, kept so
nothing was lost. `src/data/*.json` is still the content source of truth —
`npm run content` regenerates `src/content/` from it.
