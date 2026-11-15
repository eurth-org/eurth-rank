# Rank

> A friendly note: Rank is part of Eurth's advent calendar, and its door opens on 20 December 2026. The code is public, the site isn't yet. Please don't spoil the surprise before the door opens.

Rank builds a fictional nation's military ranks and draws their insignia: shoulder boards, sleeve stripes and chevrons, collar patches, for an army, a navy, an air force and any branch you add. It is one of the free worldbuilding tools by [Eurth](https://eurth.org), a worldbuilding and roleplay community since 2004, and will live at rank.eurth.org.

The rules every Eurth tool follows are in the handbook, [`node_modules/@eurth/style/HANDBOOK.md`](https://style.eurth.org/handbook/). On anything the tools share, the handbook wins. What's planned and what each release added is in the [roadmap](roadmap.md).

## Use

1. Name your nation and pick a branch. Each starts with a full ladder, one rank for every NATO code from OR-1 to OF-10, which you can rename, reorder, add to and cut down.
2. Choose a rank and build its insignia: where it is worn (shoulder board, sleeve or collar patch) and what is on it (pips, stars, crowns, wreaths, bars, chevrons, rockers, sleeve rings and your nation's emblem). The elements stack by themselves and never spill off the cloth.
3. Give the branch its cloth, its metal and its piping.
4. Take it with you:
   - **The link** holds the whole force. Copying it is saving it.
   - **Pictures**: one insignia or the whole ladder chart, as SVG, PNG or WebP.
   - **A wiki table**: wikitext with a row for every rank, and a zip of every insignia under exactly the file names the table points at.
   - **CSV**, and **Copy description** for the ladder in words.
   - **The profile file** (`<nation>.eurth.json`) carries your nation from one Eurth tool to the next. Rank writes the `rank` section and reads the arms and flag, which become the emblem and extra cloth colours.

Nothing is stored in the browser or on a server.

## Development

Node 22.23 or later (Astro asks for it; CI runs on Node 26).

```sh
npm install          # then commit package-lock.json
npm run dev          # the site while you work
npm run check        # types
npm run build        # the static site, into dist/
npm test             # the engine's tests and the suite's checks (they read dist/, so build first)
npm run axe          # accessibility: every page, both themes
npm run preview      # the built site with its real headers (wrangler dev)
npm run images       # icons and the sharing image, after changing them
```

- `eurth.config.mjs`: the tool's name, address, title and pages. Build time only.
- `src/rank/`: the engine, free of the page. Plain TypeScript, the same in the browser, at build time and in tests.
  - `model.ts` (a force, its branches, ranks and elements, and `cleanForce` for anything from outside), `nato.ts` (the codes and their usual names), `codec.ts` (an insignia in a few characters: `c1p2` is a crown above two pips).
  - `elements.ts` (the drawings), `insignia.ts` (one insignia), `chart.ts` (the ladder chart), `describe.ts` (everything in words), `validate.ts` (gentle notes, and the emus).
  - `link.ts` (the force in its link), `profile.ts` (the profile's `rank` section), `wikitext.ts`, `csv.ts`, `zip.ts`.
  - `edit.ts` (every change the builder makes, as a function from a force to a new force) and `templates.ts` (the ready-made ladders).
- `src/content/`: the glossary and the guide's figures, as data the tests check.
- `src/ui/Builder.svelte`: the builder itself. `src/pages/`: the builder, the templates, the guide, the glossary and the 404 page.
- `tests/`: `shell.test.js` runs the checks every Eurth tool shares; the others are Rank's own.
- `LAUNCH_AT`: the moment the door opens.

## Deployment

The site runs as a Cloudflare Worker serving static assets on its custom domain (`wrangler.jsonc`). Until the door opens it isn't deployed anywhere. The launch workflow (`.github/workflows/launch.yml`) starts at 22:30 UTC on 19 December 2026, builds the site as it will be at the door's time, waits for the time in `LAUNCH_AT` and deploys; if the scheduled run hasn't started by 22:45 UTC, start it by hand. After that, GitHub Actions deploys every push to `main` that passes, and a nightly run keeps `@eurth/style` and `@eurth/profile` up to date. Deploying uses the organisation secret `CLOUDFLARE_API_TOKEN`. Once the tool is live, delete the launch workflow.

## Licence

Apache 2.0, see [LICENSE](LICENSE).
