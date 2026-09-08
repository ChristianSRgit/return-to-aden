# Return to Aden — PWA

Mobile-first, turn-based RPG built on **real Lineage II (Interlude) data** from
`l2api.dev`. Installable, offline-first Progressive Web App. No login, no
backend — progress saves to the browser's `localStorage`.

Migrated from the original single-file HTML build (`../return-to-aden.html`) to
Vite + Preact + TypeScript + `vite-plugin-pwa`.

## Develop

```bash
npm install
npm run data      # fetch the l2api.dev snapshot → src/data/generated/ + public/icons/
npm run icons     # regenerate the PWA app icons (one-off, already committed)
npm run dev       # http://localhost:5173
npm run build     # → dist/  (static, deploy anywhere)
npm run preview    # serve the production build
npm run typecheck
```

## Architecture

```
scripts/
  fetch-data.mjs     build-time snapshot of l2api.dev (monsters + drops, items,
  manifest.mjs       classes, locations) → src/data/generated/*.json + icons
  make-icons.mjs     PWA icons from the in-game crest

src/data/
  generated/*.json   the API snapshot (real names, stats, icons, drop chances)
  curated.ts         authored game tuning (zones, class curves, skill effects,
                     gear bonuses, shop stock, balance constants)
  index.ts           merges snapshot + curated → runtime ITEMS/MOBS/SKILLS/...
  refresh.ts         optional runtime revalidation (needs a CORS proxy — see below)

src/art/             pixel-art engine: 12 monster painters, hero + gear
                     layering, backdrops, town-hub art
src/game/            state + persistence (v1→v4 save migration), combat engine
                     (hit-stop, damage-scaled shake, particle sparks, ghost HP
                     bars), expeditions, loot, milestones, audio, particles,
                     settings (motion/onboarding)
src/ui/  src/screens/ Preact components — one screen per game pane
```

**Content:** 21 real Interlude monsters across 10 hunting zones (level 1-38),
each with its real drop table (auto-curated to the 4 likeliest drops, or a
hand-picked subset). A Bestiary screen tracks kills and shows real stats.
`npm run data` re-fetches everything; add ids to `scripts/manifest.mjs` and a
`MOB_TUNE` entry (sprite + optional `dropIds`) in `src/data/curated.ts` to add
more.

Names of skills / items / monsters always come from the API, in English.
UI copy is Spanish. Display settings (sound, combat speed, animations) live in
the Character screen and persist separately from the save.

## Data refresh at runtime

`l2api.dev` does not send CORS headers for browser requests from arbitrary
origins, so the game ships the build-time snapshot and treats it as the source
of truth. To enable background revalidation against the live API, set
`VITE_DATA_PROXY` to a CORS-friendly proxy of `https://l2api.dev/api/interlude`
(e.g. a Cloudflare Worker on the deploy origin) — `src/data/refresh.ts` will
then patch names / stats / prices in place on boot.

## Deploy

`npm run build` produces a fully static `dist/`. Drop it on Netlify / GitHub
Pages / Cloudflare Pages / Vercel. The service worker precaches the app shell +
all icons, so it works offline after the first load.
