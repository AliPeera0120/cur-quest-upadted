# Pre-rebuild source, kept deliberately

Nothing in this folder is imported by the application. It is the original
Base44-generated implementation, moved aside rather than deleted so that no
existing work is lost and any decision made here can be checked against what
came before.

What is in here:

| Path | What it was |
|---|---|
| `Layout.jsx`, `pages.config.js` | the old shell and its route table (bare page names like `/ScienceArena`) |
| `AboutUs.jsx` … `ThisWeekInSTEM.jsx` | the eleven original page components |
| `ui/` | the unused shadcn/ui component set the generator installed |
| `home/`, `stem/`, `careers/`, `activities/`, `events/` | the original section components |
| `quest.jsx` | the original localStorage progress store ("Quest Passport") |
| `utils/`, `hooks/` | `createPageUrl()` and a viewport hook, both superseded |

**The content is not in here.** Every experiment, coding lesson, quiz question,
Arena level and newsletter issue lives in `src/data/*.json`, which is still the
source of truth — `scripts/build-content.mjs` reads those files and generates
`src/content/`. Nothing was rewritten by hand.

Two things were lifted out of this folder rather than rebuilt:

- `components/arena/ArenaSprites.jsx` — the hand-drawn battle sprites, still
  used by the new battle activity. It lives in `src/components/arena/`.
- The XP total from the old browser passport, which the new local backend reads
  once on first sign-up so a returning visitor keeps their points. See
  `readLegacyPassport()` in `src/platform/store.js`.

Safe to delete this whole folder once you are happy with the rebuild.
