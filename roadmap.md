# Roadmap

Rank builds a fictional nation's military ranks and draws their insignia, at rank.eurth.org. It is door 11 of Eurth's 2026 advent calendar and opens on 20 December 2026 at 00:00 Europe/Brussels.

Three parts: what comes next, what each release added (newest first), and what's not planned.

## Where to pick up

**14 November 2026.** The brief is saved, the repository exists, and this plan is written. Nothing is built. The plan is waiting for Stijn's go-ahead; the next step is Phase 1, step 1.

What the plan was written against:

- **@eurth/style 1.0.1** is released (handbook, starter template, reusable workflows), so Phase 2 can follow Phase 1 without waiting. Rank is already in its `tools.json`: id `rank`, door 11, launch `2026-12-20T00:00:00+01:00`, pitch "Rank insignia for your forces".
- **@eurth/profile 1.0.0** is released and already has a `rank` section: `branches` (names) and `ranks` (`name`, `branch`, highest first), plus `link`, `summary` and `updated`. No pull request is needed before building. The section allows keys of its own, so Rank will add each rank's NATO code and grade there, and keep the insignia designs under a key of its own (Phase 1, step 9). To propose to @eurth/profile afterwards, so the schema describes them.

Open questions for Stijn (none blocks Phase 1):

- **The wiki table.** The plan exports a plain wikitable per branch (code, insignia file name, rank, abbreviation) and one comparison table across branches. If IIWiki has rank templates of its own that you would rather fill, say which.
- **Real-world patterns.** The templates are "in the pattern of" (Commonwealth, American, Continental, Eastern, and so on) with fictional names for the nations, and every element is our own drawing. No real nation's insignia is copied line for line. Say so if you want named real armies instead.

## Next

### Phase 1: the engine and the words (needs nothing from @eurth/style)

Plain TypeScript in `src/rank/`, content in `src/content/`, tests in `tests/`, as Flagwright keeps its engine in `src/flag/`. Only TypeScript and Vitest are installed. Commit and push after each step.

1. **Model** (`model.ts`): a force is a nation's name, its branches and their ladders.
   - Branch: name, kind (army, navy, air force, or one the user adds: marines, gendarmerie, space force), cloth colour, metal (gold or silver), piping colour.
   - Rank: name, abbreviation, NATO code (OR-1 to OR-9, OF-1 to OF-10, or none), and the grade it belongs to (enlisted, non-commissioned, officer), which follows from the code unless the user says otherwise. Two ranks may share a code; a code may be left empty.
   - Insignia design per rank: where it is worn (shoulder board, sleeve, collar) and its elements in order (pips, stars, crowns, wreaths, bars, chevrons, sleeve rings, the nation's emblem), each with a count and a size.
   - Everything that arrives from a link or a file is checked and clamped: 12 branches, 30 ranks a branch, text lengths capped, colours as hex only, unknown values dropped.
2. **NATO codes** (`nato.ts`): the reference column. Each code with what it means and the usual army, navy and air force names for it, so a new ladder starts sensible and the guide can cite it.
3. **Elements** (`elements.ts`): the drawings, all our own, as SVG paths on a common grid: pip, five-pointed star, crown, wreath, bar, chevron (point up or down), rocker, sleeve ring (plain or with a curl), and a plain disc where the nation's emblem goes. Also the emu, for later.
4. **Insignia** (`insignia.ts`): one pure function from a rank's design and its branch's colours to an SVG: the shoulder board as on the mock-up (elements stacked from the button down), the sleeve (rings or chevrons on a cuff), and the collar patch. Elements are placed by rule, so six pips never spill off a board. The picture carries its own title and description.
5. **Ladder chart** (`chart.ts`): every rank of a branch side by side, highest first, each with its code, name and insignia: the familiar comparison table as one SVG. And the comparison across branches, lined up by NATO code.
6. **Description** (`describe.ts`): one insignia in words ("Colonel, OF-5: a shoulder board in dark green with a crown above two pips, in gold"), and a whole ladder as text, for Copy description and for screen readers.
7. **Checks** (`validate.ts`): things worth a gentle word, none of which stops the tool: two ranks with one name, a ladder whose codes run out of order, a junior rank with more on its shoulder than its senior. Also spots the rank called "Supreme Emu Commander".
8. **Link** (`link.ts`): the whole force in the query string, compact and versioned, in @eurth/style's form (`?d=1.…`). Past a set length the tool says so and offers the profile file instead.
9. **Profile** (`profile.ts`): the `rank` section. What other tools read: `branches`, and `ranks` with `name` and `branch`, plus each rank's `code` and `grade`. What brings the designs back for editing: the branch colours and the insignia designs, under keys of Rank's own. It reads `arms` and `flag` and never writes them: the arms or flag becomes the emblem element (shown only through an image, as the handbook asks), and the flag's colours are offered for the branches.
10. **Wiki table** (`wikitext.ts`): for each branch a wikitable with a row per rank (code, insignia file name, rank, abbreviation), and one table comparing the branches by code. Names are escaped for wikitext.
11. **CSV** (`csv.ts`): branch, code, grade, rank, abbreviation and the insignia in words, a row per rank.
12. **Templates** (`templates.ts`): ready-made ladders, each with army, navy and air force: Commonwealth pattern (crowns and pips, chevrons point down), American pattern (bars, leaves swapped for our own devices, stars; chevrons point up), Continental pattern (stars and braid), Eastern pattern (stars on striped boards), a small coast guard, and a deliberately odd one. Fictional nations throughout. A test exports every template ladder to wikitext and checks the table is complete: that is the brief's "done".
13. **Guide and glossary** (`src/content/`): how rank systems are built (the three grades, commissions, warrant officers, why NATO made its codes), how insignia show seniority (more, bigger, higher, shinier), naval and army traditions compared (rings and curls against pips and crowns; why a navy captain outranks an army one), with sources and a last-updated date; a glossary of about 40 terms. The guide's examples are data, and the tests draw every one.

### Phase 2: the site

14. Start from the starter template in eurth-style; read HANDBOOK.md first, and where it differs from this plan, the handbook wins. `LAUNCH_AT` is `2026-12-20T00:00:00+01:00`.
15. Pages: Builder, Templates, Guide, Glossary, with titles, descriptions, canonical links, JSON-LD, sitemap.xml, robots.txt, llms.txt and Open Graph images.
16. The builder, as a Svelte 5 island: branches with their colours and metal; the ladder as a table with the NATO code as a reference column and names typed straight in; the insignia editor for the chosen rank (where it is worn, add and remove elements); the ladder chart underneath, live.
17. Save and load: the link, the profile file (file picker and drag and drop, from @eurth/profile), and the emblem and colours read from the profile's arms and flag.
18. Exports: SVG, PNG and WebP of one insignia or of the whole ladder chart in the handbook's sizes, the wikitext table, CSV, Copy link, Copy picture, Copy description, and the Share dialog.
19. Delight: a new pip snaps on with a tiny glint (still for reduced motion, a soft click only once sound is switched on); a rank called "Supreme Emu Commander" swaps its stars for emus; the suite's own touches from @eurth/style.
20. Offline, install, security headers, axe and Lighthouse checks, as the handbook asks.
21. CI, nightly and the launch workflow: the scheduled run starts at 22:30 UTC on 19 December, and it also runs by hand. No custom domain and no workers.dev deploy before then.
22. README (use, development, deployment), docs/feedback-log.md, and the handbook's checklist.

## Releases

None yet.

## Not planned

- **Real nations' insignia, copied.** Rank is for fiction. The templates follow real patterns so a ladder feels right, but the drawings are our own and the nations are invented.
- **Medals, ribbons, badges and uniforms.** Rank draws rank insignia only. They would each be a tool of their own.
- **Orders of battle and unit charts.** Who commands what is a different question from who outranks whom.
- **Accounts, or forces kept on a server.** A design lives in its link or its profile file; nothing is stored.
