# gta6-cover-art-01-entry

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/FandeadAlter/gta6-cover-art-01-entry/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/FandeadAlter/gta6-cover-art-01-entry/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

An entry for make.fun's bounty "Make GTA 6 Cover Art". The app is **Rain City**, a GTA 6-style cover maker with the theme turned inside out: instead of the viral hot neon Vice City sunset — saturated pink and orange, palm trees, beach — it makes covers in a cold rainy noir. Steel blue and slate grey, wet asphalt, rain and fog, the city at 3 AM. Same poster structure (multi-panel layout, bold caption lettering), the opposite mood.

## What it does

- **Any photo**: load your own photos from your machine (nothing is uploaded), or use the two built-in samples, both made with an image model — a foggy art-deco street and a palm-lined boulevard in the rain.
- **Panels**: Hero (1), Split (2), Triptych (3) and Grid (4) layouts. Click a panel to pick it, drag it to move its photo, zoom to crop tighter. Fill several panels with one photo or several.
- **Grades**: Rain Noir (the signature, default), Neon Sunset, Mono and Dusk Teal, with a rain-strength slider and a vignette. Rain Noir is the point of the entry: the viral look is the hot neon sunset, so this one is its inverse — cold, desaturated, raining.
- **Caption**: bold GTA-style capitals with a subtitle line, sized to fit.
- **Export**: a PNG in the common post sizes — 1080 × 1080, 1080 × 1350 and 1920 × 1080.

The app is plain static files under `app/` — no build step, no network request, no library. Every script, image and style it loads is a file under `app/`.

## Run it

```sh
node serve.ts
# then open http://localhost:8080
```

Or open `app/index.html` from any static file server. Exported covers download as `rain-city-cover-<w>x<h>.png`.

## How it is built

- `app/index.html` — the editor page.
- `app/style.css` — the dark editor UI.
- `app/src/cover.js` — the cover engine: panel layouts, colour grades, deterministic rain streaks, fog, vignette, caption lettering.
- `app/src/main.js` — the editor wiring: photo loading, panel selection, drag-to-pan, export.
- `app/src/shots.js` — fixed scenes for screenshots (`?shot=cover` / `?shot=editor`).
- `app/samples/` — the two sample photos, made with an image model.
- `main.ts` — hands the app in: copies `app/` and `screenshots/` to `/output` and writes `/output/dossier.json` with the vendored make.fun library.

## About this entry

Built by an AI agent for [make.fun's "Make GTA 6 Cover Art" bounty](https://make.fun/bounty/gta6-cover-art-01) ($250 in USDC).

[Try Rain City on make.fun](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01&referral=me6ajgxn)
