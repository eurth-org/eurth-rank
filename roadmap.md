# Roadmap

Rank builds a fictional nation's military ranks and draws their insignia, at rank.eurth.org. It is door 11 of Eurth's 2026 advent calendar and opens on 20 December 2026 at 00:00 Europe/Brussels.

Three parts: what comes next, what each release added (newest first), and what's not planned.

## Where to pick up

**15 November 2026.** Version 0.1.0 is built: the engine, the four pages and the builder, with every export. Check, build, tests (126) and the accessibility check all pass locally. Nothing is deployed, and nothing will be until the launch workflow runs on 19 December. The next step is the first item under "Next".

Worth knowing before you start:

- Astro needs Node 22.23 or later. On Stijn's machine the default Node is older; `export PATH=/opt/homebrew/opt/node@26/bin:$PATH` first.
- `npm test` reads `dist/`, so run `npm run build` before it.

## Next

### Before the door opens

1. **Look at the Lighthouse numbers.** CI runs Lighthouse on `main`; it hasn't been looked at yet. The start page carries the ladder's pictures in its HTML (about 28 KB gzipped), which should be fine, but check.
2. **Try it by hand on a phone and with a screen reader.** The automated checks pass; nobody has used it yet.
3. **Propose Rank's extra keys to @eurth/profile**, so the schema describes them: on each rank `code`, `grade` and `abbr`; on the section `format` and `design`. The schema allows them already, so nothing is blocked.
4. **Stijn's two questions** (neither blocks the launch):
   - The wiki export is a plain wikitable per branch and one comparison table. If IIWiki has rank templates you would rather fill, say which.
   - The templates are "in the pattern of" (Commonwealth, American, Continental, Eastern) with invented nations and our own drawings. Say so if you want named real armies instead.
5. **Launch**: the workflow starts at 22:30 UTC on 19 December. If it hasn't started by 22:45 UTC, start it by hand. After the door, delete `launch.yml`.

### After launch

- A picture comparing the branches side by side by NATO code (the wikitext has this table already).
- More devices: crossed swords and batons, anchors, wings, an eagle; and diagonal sleeve stripes.
- A lighter way to keep the insignia in view while editing the ladder on a wide screen.
- Rank on headgear and on the chest, for forces that wear it there.

## Releases

### 0.1.0, 15 November 2026 (built, not yet live)

- **Branches**: an army, a navy and an air force to begin with, each with a full ladder; add marines, a gendarmerie, a space force, a coast guard or a branch of your own, up to twelve. Each has its cloth (twelve colours, plus your flag's), its metal (gold, silver or dark thread) and optional piping.
- **The ladder**: up to thirty ranks a branch, highest first, with names and abbreviations typed straight in, a NATO code (OR-1 to OR-9, OF-1 to OF-10, or none) as a reference column, and a grade (officers, non-commissioned officers, enlisted) that follows the code unless set by hand.
- **Insignia**: a shoulder board, a sleeve or a collar patch, carrying up to six elements: pips, stars, crowns, wreaths, bars, chevrons (point up or down), rockers, sleeve rings (plain, wide, or with a curl) and the nation's emblem. All drawn by us. Elements stack by rule and shrink to fit; metal gets an outline on cloth it would vanish into.
- **The ladder chart**: every rank of a branch side by side, grouped by grade, with code, name and abbreviation.
- **Save and load**: the whole force in the link (`?d=1.…`); the profile file's `rank` section, which keeps keys it doesn't know; a section with only names still gives a ladder. The profile's arms or flag becomes the emblem, and its flag colours are offered as cloth.
- **Exports**: SVG, PNG and WebP of one insignia or the ladder chart (the chart in the handbook's six sizes); a wikitext table per branch and a comparison by code; a zip of every insignia under the file names the wiki table uses; CSV; Copy link, Copy picture, Copy description and the Share dialog.
- **Checks**: a gentle note for two ranks with one name, two with the same insignia, codes out of order, a rank with no name, a branch with no ranks.
- **Templates**: five invented nations in the Commonwealth, American, Continental and Eastern patterns, plus a coast guard and a gendarmerie. Every template ladder exports to a complete wikitext table, and a test says so.
- **Guide and glossary**: how rank systems are built, how insignia show seniority, army and navy traditions compared, with sources; 46 terms.
- **Delight**: a new device snaps on with a glint (and a click once sound is on); a rank called "Supreme Emu Commander" swaps its stars for emus.
- **Undo**, for everything.

## Not planned

- **Real nations' insignia, copied.** Rank is for fiction. The templates follow real patterns so a ladder feels right, but the drawings are our own and the nations are invented.
- **Medals, ribbons, badges and uniforms.** Rank draws rank insignia only. They would each be a tool of their own.
- **Orders of battle and unit charts.** Who commands what is a different question from who outranks whom.
- **Accounts, or forces kept on a server.** A design lives in its link or its profile file; nothing is stored.
