# CuriosityQuest

Free hands-on STEM activities, experiments, and learning resources for curious young minds. Live at [curiosity-quest.org](https://curiosity-quest.org).

Built with React, Vite, Tailwind CSS, and shadcn/ui. Fully static — no backend required. All content (experiments, virtual activities, careers, STEM posts) lives in `src/data/*.json`.

## Local development

```
npm install
npm run dev
```

## Editing content

Edit the JSON files in `src/data/`:

- `experiments.json` — hands-on experiments (Activities page)
- `virtualActivities.json` — coding lessons (Activities page)
- `careers.json` — career profiles (Careers page)
- `stemPosts.json` — weekly posts (5 Minutes of STEM page); the newest `week_date` is featured
- `stemWords.json` — STEM vocabulary words

Events and team members are edited directly in `src/pages/Events.jsx` and `src/components/home/OurTeam.jsx`.

## Contact form

The Make an Impact form opens the visitor's email app (mailto) addressed to curiosity.quest25@gmail.com.

## Images

Some images are still hosted on Base44/Supabase URLs. To make the site fully self-contained, run once from the repo root:

```
bash scripts/localize-images.sh
```

This downloads them into `public/images/` and rewrites the code to use local paths. Commit the result.

## Deployment

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds the site and deploys `dist/` to GitHub Pages. The custom domain is set via `public/CNAME`. A `404.html` copy of `index.html` is created at build time so client-side routes work on direct navigation.
