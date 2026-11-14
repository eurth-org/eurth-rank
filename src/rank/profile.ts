/**
 * The "rank" section of the Eurth profile file (<nation>.eurth.json), the file that carries a
 * nation from one Eurth tool to the next. Rank owns this one section and touches no other;
 * reading, checking, merging and saving the file itself is @eurth/profile's work.
 *
 * The section has two halves:
 *
 * - What the other tools read, as @eurth/profile defines it: `branches` (names) and `ranks`
 *   (`name` and `branch`, highest first), with `link` and `summary`. Rank adds each rank's
 *   `code`, `grade` and `abbr` beside its name.
 * - The design itself, so the file can bring it back for editing: `format` and `design`, the
 *   same compact form the link carries. The profile schema lets a section carry keys of its own,
 *   and these are Rank's.
 *
 * Keys in the section that this version doesn't know are kept as they were.
 */
import { summarise } from './describe';
import { forceLink, packForce, unpackForce } from './link';
import { blankBranch, cleanForce, cleanText, codes, grades, MAX_NAME, type BranchKind, type Code, type Force, type Grade } from './model';
import { usualInsignia } from './nato';

/** The version of the design's shape inside the section. */
export const DESIGN_FORMAT = 1;

export interface RankEntry {
  name: string;
  branch?: string;
  code?: Code;
  grade?: Grade;
  abbr?: string;
  [key: string]: unknown;
}

export interface RankSection {
  link?: string;
  summary?: string;
  updated?: string;
  /** The branches, by name. */
  branches?: string[];
  /** The ranks, highest first within each branch: 200 at most. */
  ranks?: RankEntry[];
  /** The version of `design`. */
  format?: number;
  /** The whole design, packed as the link packs it. */
  design?: unknown[];
  [key: string]: unknown;
}

const OWN_KEYS = ['link', 'summary', 'branches', 'ranks', 'format', 'design'] as const;

export interface SectionOptions {
  /** The address of the tool, to make the link from. Defaults to rank.eurth.org. */
  base?: string;
  /** The section already in the file, so keys this version doesn't know are kept. */
  previous?: unknown;
}

/**
 * The section for a force. `updated` is left to @eurth/profile's setSection, which stamps it.
 * The link holds the whole design when it is small enough, and is the tool's address when not.
 */
export function toSection(force: Force, options: SectionOptions = {}): RankSection {
  const kept: Record<string, unknown> = {};
  if (typeof options.previous === 'object' && options.previous !== null && !Array.isArray(options.previous)) {
    for (const [key, value] of Object.entries(options.previous)) {
      if (!(OWN_KEYS as readonly string[]).includes(key) && key !== 'updated') kept[key] = value;
    }
  }
  const base = options.base ?? 'https://rank.eurth.org/';
  const link = forceLink(force, base) ?? base;
  const section: RankSection = { ...kept };
  if (/^https:\/\/[!-~]+$/.test(link) && link.length <= 4000) section.link = link;
  section.summary = summarise(force);
  section.branches = force.branches.map((b) => b.name);
  section.ranks = force.branches
    .flatMap((b) =>
      b.ranks.map((r) => ({
        name: r.name || 'Unnamed rank',
        branch: b.name,
        ...(r.code ? { code: r.code } : {}),
        grade: r.grade,
        ...(r.abbr ? { abbr: r.abbr } : {}),
      })),
    )
    .slice(0, 200);
  section.format = DESIGN_FORMAT;
  section.design = packForce(force);
  return section;
}

/** Whether a section carries a design, and not only the names the other tools read. */
export function hasDesign(section: unknown): boolean {
  return typeof section === 'object' && section !== null && Array.isArray((section as RankSection).design);
}

/** What kind of branch a name suggests, for a section that only has names. */
export function kindFromName(name: string): BranchKind {
  if (/nav|fleet|marine|coast|sea/i.test(name)) return 'navy';
  if (/air|sky|aviation|space/i.test(name)) return 'air';
  if (/army|land|ground|guard|legion|infantry/i.test(name)) return 'army';
  return 'other';
}

/**
 * The force in a section, or null when there is nothing to read. A section with a design gives
 * the design back. One with only names (written by hand, say, or by another tool) still gives a
 * ladder: the names in their branches, each with the usual insignia for its code. Whatever is
 * there is cleaned like any other input.
 */
export function fromSection(section: unknown, nation = ''): Force | null {
  if (typeof section !== 'object' || section === null || Array.isArray(section)) return null;
  const s = section as RankSection;
  if (hasDesign(s) && !(typeof s.format === 'number' && s.format > DESIGN_FORMAT)) {
    const force = unpackForce(s.design);
    if (force) return force.nation ? force : { ...force, nation: cleanText(nation, 60) };
  }
  const names = Array.isArray(s.branches) ? s.branches.filter((b): b is string => typeof b === 'string') : [];
  const entries = Array.isArray(s.ranks) ? s.ranks.filter((r): r is RankEntry => typeof r === 'object' && r !== null && typeof r.name === 'string') : [];
  for (const entry of entries) if (typeof entry.branch === 'string' && entry.branch && !names.includes(entry.branch)) names.push(entry.branch);
  if (!names.length && entries.length) names.push('Armed forces');
  if (!names.length) return null;
  return cleanForce({
    nation,
    branches: names.map((name, i) => {
      const kind = kindFromName(name);
      const mine = entries.filter((r) => (typeof r.branch === 'string' && r.branch ? r.branch === name : i === 0));
      return {
        ...blankBranch(kind, cleanText(name, MAX_NAME)),
        ranks: mine.map((r) => {
          const code = codes.includes(r.code as Code) ? (r.code as Code) : '';
          return { name: r.name, abbr: r.abbr, code, grade: grades.includes(r.grade as Grade) ? r.grade : undefined, ...usualInsignia(kind, code) };
        }),
      };
    }),
  });
}
