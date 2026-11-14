You're building Rank (rank.eurth.org), a builder for a fictional nation's military ranks and their insignia, one of Eurth's free worldbuilding tools. Eurth (eurth.org) is a worldbuilding and roleplay community since 2004, where armed forces are a big part of nation roleplay. The attached repo is eurth-org/eurth-rank.

Working order (Foundations and many other tools are being built at the same time tonight):
1. Save this brief as CLAUDE.md.
2. If the repo named above doesn't exist on GitHub yet, create it as a public, empty repo in eurth-org with the gh CLI and connect this folder; if you can't, ask me.
3. Read what already exists of github.com/eurth-org/eurth-style (HANDBOOK.md) and github.com/eurth-org/eurth-profile; they may still be in progress. Write the plan and show it to me.
4. Build the tool's core logic as plain TypeScript modules with thorough tests, and its content and data (guide text, presets, examples, data snapshots). None of that needs eurth-style.
5. Only once @eurth/style 1.0.0 is released (check the releases of github.com/eurth-org/eurth-style), start the site from its starter template and carry on to the end of this brief. Until then, don't scaffold the site, pages or styles.
6. Commit and push after every finished step, and keep roadmap.md up to date with exactly where to pick up, so a new session can continue if this one stops.

Background for every step: Read HANDBOOK.md in github.com/eurth-org/eurth-style and start from its starter template; read the profile schema in github.com/eurth-org/eurth-profile (if it has no "rank" section yet, propose one as a pull request there first); look at github.com/eurth-org/eurth-flag, the reference build. The handbook wins over this brief on everything shared. Then write a plan and show it to me before you build.

Mock-up: the shoulder board and chevrons on the "bank.eurth.org, banknotes" board on https://claude.ai/artifact/32RKDdVTtCfHsL6Qc6LxV6.

Pages: Builder, Guide, Glossary, Templates.

The builder, v1
- Branches: army, navy, air force, and any the user adds (marines, gendarmerie, space force).
- A rank ladder per branch: enlisted, non-commissioned and officer grades, each mapped to the NATO codes (OR-1 to OR-9, OF-1 to OF-10) as a reference column, with names the user can change.
- Insignia per rank: shoulder board, sleeve stripes and chevrons, collar pips, in the branch's colours and metals; elements drawn as SVG of our own (pips, stars, crowns, wreaths, bars, chevrons, sleeve rings), plus the nation's arms or emblem from the profile.
- The ladder chart: every rank of a branch side by side, as the familiar comparison table.

Guide: how rank systems are structured, how insignia show seniority, naval and army traditions compared, with sources. Glossary of terms.

Profile section "rank": branches, ladders and insignia designs. It reads arms and flag.

Exports: SVG, PNG and WebP of one insignia or the whole ladder chart, a wikitext rank table, CSV, Copy description.

Signature touch: a new pip snaps on with a tiny glint. Easter egg: a rank called "Supreme Emu Commander" swaps the stars for emus.

Done when the handbook's checklist passes and every template ladder exports to a complete wikitext table.
