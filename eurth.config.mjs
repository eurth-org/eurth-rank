// What this tool is called and where it lives. Read at build time only: astro.config.mjs, the
// frontmatter of .astro pages, tests and tools/. Never import this from a Svelte component or a
// <script>: it pulls in the list of every Eurth tool, and browser code must not carry that
// (HANDBOOK.md, Launch). Hand the component what it needs as props instead.
import { defineSite } from '@eurth/style/build';

export const site = defineSite({
  // The subdomain, and the tool's id in @eurth/style's tools.json.
  id: 'rank',
  name: 'Rank',
  url: 'https://rank.eurth.org',
  // "<Name>: free online <thing> maker for worldbuilders"
  title: 'Rank: free online rank insignia maker for worldbuilders',
  description: 'A free online military rank and insignia maker for worldbuilders: build the rank ladder of your army, navy and air force and draw every shoulder board, chevron and sleeve ring. No account needed.',
  tagline: 'Rank insignia for your forces',
  pages: [
    { href: '/', label: 'Builder' },
    { href: '/templates/', label: 'Templates' },
    { href: '/guide/', label: 'Guide' },
    { href: '/glossary/', label: 'Glossary' },
  ],
  repo: 'https://github.com/eurth-org/eurth-rank',
  ogAlt: 'Rank, rank insignia for your forces, at rank.eurth.org: the Eurth yurt beside a shoulder board with a crown and two pips and a set of three chevrons.',
  // The pip's click is silent until the visitor switches sound on in the footer.
  sound: true,
});
