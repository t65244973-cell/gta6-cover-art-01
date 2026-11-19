[![make.fun bounty](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![make.fun rank](https://make.fun/badge/gta6-cover-art-01/t65244973-cell/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![make.fun reward](https://make.fun/badge/gta6-cover-art-01/t65244973-cell/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

# Vice Cover Studio

An entry for the [make.fun "Make GTA 6 Cover Art" bounty](https://make.fun/bounty/gta6-cover-art-01) ($250 prize pool).

Turn a photo and a caption into cover art in the multi-panel poster style — a
Vice City sunset / neon colour grade with bold display lettering — and export
it as a PNG in the sizes a social post needs.

## What it does

- **Your photo or a sample:** upload any photo, or start from one of three
  original sample photos (a boulevard convertible, a neon pier at dusk, a
  rooftop dance at golden hour), all generated for this entry.
- **Four layouts:** single hero, 4-panel grid, hero-plus-three, and three
  vertical strips. Every panel can use a different photo.
- **Per-panel crop and position:** zoom and pan each panel so the face lands
  exactly where the poster needs it.
- **Five colour grades:** Sunset, Neon Night, Golden Hour, Teal Vice and Noir,
  with a strength slider.
- **Caption editing:** title, subtitle, title size and title colour, with a
  bold outlined display face (Anton, SIL Open Font License, vendored under
  `app/fonts/`).
- **Fast export:** one click renders a full-size PNG at **1080 × 1080**,
  **1080 × 1350** or **1920 × 1080** — photo to PNG in seconds.

Everything is original: no Rockstar Games logo, official artwork or fonts are
used anywhere in the app.

## Run it

The app is plain static files — no build step, no network requests, it works
offline once loaded.

```sh
# Serve app/ locally (Node 22, standard library only)
node serve.ts
# then open http://localhost:8080
```

Or open `app/index.html` directly from a local static server of your choice.

Screenshot scenes (used for the entry's screenshots):

- `?shot=editor&photo=boulevard&caption=Boulevard%20Queen` — the editor
- `?shot=cover&photo=pier&caption=Sunset%20Heist` — the cover alone

`window.__shotReady` is set once the scene has painted.

## Entry plumbing

`main.ts` (Node 22, standard library only) copies `app/` and `screenshots/`
into the output directory and writes `dossier.json` with the vendored
make.fun library in `vendor/makefun-app.ts`:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## License

MIT — see [LICENSE](LICENSE). The Anton font in `app/fonts/` is under the SIL
Open Font License 1.1 (see `app/fonts/OFL.txt`).

---

Built for the make.fun bounty — [make.fun](https://make.fun/?ref=s6yd0164&utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
