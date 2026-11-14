/**
 * A force: a nation's armed forces as branches, each with a ladder of ranks, each rank with the
 * insignia that shows it.
 *
 * Everything here is plain data, so a force can travel in a link or in the profile file and come
 * back the same. Whatever arrives from outside goes through cleanForce first: a link or a file
 * is someone else's input.
 */

export const branchKinds = ['army', 'navy', 'air', 'other'] as const;
export type BranchKind = (typeof branchKinds)[number];

export const metals = ['gold', 'silver', 'dark'] as const;
export type Metal = (typeof metals)[number];

/** Where an insignia is worn. */
export const wears = ['shoulder', 'sleeve', 'collar'] as const;
export type Wear = (typeof wears)[number];

export const wearNames: Record<Wear, string> = { shoulder: 'Shoulder board', sleeve: 'Sleeve', collar: 'Collar patch' };

export const elementKinds = ['pip', 'star', 'crown', 'wreath', 'bar', 'chevron', 'rocker', 'ring', 'emblem'] as const;
export type ElementKind = (typeof elementKinds)[number];

export const elementNames: Record<ElementKind, [one: string, many: string]> = {
  pip: ['pip', 'pips'],
  star: ['star', 'stars'],
  crown: ['crown', 'crowns'],
  wreath: ['wreath', 'wreaths'],
  bar: ['bar', 'bars'],
  chevron: ['chevron', 'chevrons'],
  rocker: ['rocker', 'rockers'],
  ring: ['ring', 'rings'],
  emblem: ['emblem', 'emblems'],
};

/** The most of one element an insignia can carry before it stops reading as a rank. */
export const maxCount: Record<ElementKind, number> = { pip: 4, star: 5, crown: 2, wreath: 1, bar: 4, chevron: 4, rocker: 3, ring: 4, emblem: 1 };

export interface Element {
  kind: ElementKind;
  count: number;
  /** A broad bar or ring: the flag officer's band. */
  wide?: boolean;
  /** Chevrons that point down. */
  down?: boolean;
  /** A loop on the top ring, as executive officers wear in many navies. */
  curl?: boolean;
}

export const grades = ['officer', 'nco', 'enlisted'] as const;
export type Grade = (typeof grades)[number];

export const gradeNames: Record<Grade, string> = { officer: 'Officers', nco: 'Non-commissioned officers', enlisted: 'Enlisted' };

/** The NATO codes, highest first: the reference column. */
export const codes = ['OF-10', 'OF-9', 'OF-8', 'OF-7', 'OF-6', 'OF-5', 'OF-4', 'OF-3', 'OF-2', 'OF-1', 'OR-9', 'OR-8', 'OR-7', 'OR-6', 'OR-5', 'OR-4', 'OR-3', 'OR-2', 'OR-1'] as const;
export type Code = (typeof codes)[number];

export interface Rank {
  id: string;
  name: string;
  abbr: string;
  /** The NATO code it compares to, or '' for a rank with no equivalent. */
  code: Code | '';
  grade: Grade;
  wear: Wear;
  /** What the insignia carries, nearest the collar first. */
  elements: Element[];
}

export interface Branch {
  id: string;
  name: string;
  kind: BranchKind;
  /** The colour of the cloth, as #rrggbb. */
  cloth: string;
  metal: Metal;
  /** The colour of the edging, or '' for none. */
  piping: string;
  /** The ladder, highest rank first. */
  ranks: Rank[];
}

export interface Force {
  nation: string;
  branches: Branch[];
}

export const MAX_BRANCHES = 12;
export const MAX_RANKS = 30;
export const MAX_ELEMENTS = 6;
export const MAX_NATION = 60;
export const MAX_NAME = 60;
export const MAX_ABBR = 12;

/** Cloth colours to pick from. A tool whose subject is colour carries its colours as data. */
export const cloths = [
  { name: 'dark green', hex: '#1d2b1f' },
  { name: 'olive', hex: '#4b5320' },
  { name: 'field grey', hex: '#5d6660' },
  { name: 'khaki', hex: '#b9a36b' },
  { name: 'sand', hex: '#d2c29a' },
  { name: 'navy blue', hex: '#14213d' },
  { name: 'black', hex: '#16181a' },
  { name: 'air force blue', hex: '#3d5a80' },
  { name: 'sky blue', hex: '#8fb4d6' },
  { name: 'scarlet', hex: '#9b1c1c' },
  { name: 'maroon', hex: '#5b1a28' },
  { name: 'white', hex: '#f2f2ee' },
] as const;

export const metalColours: Record<Metal, string> = { gold: '#e8c46a', silver: '#d6dadc', dark: '#20262a' };
export const metalNames: Record<Metal, string> = { gold: 'gold', silver: 'silver', dark: 'dark thread' };

export const kindNames: Record<BranchKind, string> = { army: 'Army', navy: 'Navy', air: 'Air force', other: 'Other' };
const kindCloth: Record<BranchKind, string> = { army: '#1d2b1f', navy: '#14213d', air: '#3d5a80', other: '#5d6660' };
const kindMetal: Record<BranchKind, Metal> = { army: 'gold', navy: 'gold', air: 'silver', other: 'silver' };

// ---------------------------------------------------------------------------------------------
// Cleaning: nothing from a link or a file is trusted.
// ---------------------------------------------------------------------------------------------

/** Plain text on one line: no markup, no control characters, cut to length. */
export function cleanText(value: unknown, max: number): string {
  if (typeof value !== 'string') return '';
  return value
    .replace(/[<>\u0000-\u001f\u007f\u2028\u2029]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max)
    .trim();
}

/** A colour as #rrggbb in lower case, or the fallback for anything else. */
export function cleanColour(value: unknown, fallback: string): string {
  return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value) ? value.toLowerCase() : fallback;
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const list = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);
const oneOf = <T extends string>(options: readonly T[], value: unknown, fallback: T): T => (options.includes(value as T) ? (value as T) : fallback);

/** The grade a code belongs to: officers, then non-commissioned officers from OR-5 up, then the rest. */
export function gradeOf(code: Code | ''): Grade {
  if (code.startsWith('OF')) return 'officer';
  if (code === '') return 'enlisted';
  return Number(code.slice(3)) >= 5 ? 'nco' : 'enlisted';
}

export function cleanElement(value: unknown): Element | null {
  if (!isRecord(value) || !elementKinds.includes(value.kind as ElementKind)) return null;
  const kind = value.kind as ElementKind;
  const n = typeof value.count === 'number' && Number.isFinite(value.count) ? Math.round(value.count) : 1;
  const element: Element = { kind, count: Math.min(maxCount[kind], Math.max(1, n)) };
  if (value.wide === true && (kind === 'bar' || kind === 'ring')) element.wide = true;
  if (value.down === true && kind === 'chevron') element.down = true;
  if (value.curl === true && kind === 'ring') element.curl = true;
  return element;
}

export const cleanElements = (value: unknown): Element[] =>
  list(value)
    .map(cleanElement)
    .filter((e): e is Element => e !== null)
    .slice(0, MAX_ELEMENTS);

/** An id not yet in use: b1, b2, … or r1, r2, … */
export function newId(prefix: 'b' | 'r', taken: Iterable<string>): string {
  const used = new Set(taken);
  for (let n = used.size + 1; ; n++) {
    const id = `${prefix}${n}`;
    if (!used.has(id)) return id;
  }
}

const ID = /^[a-z][a-z0-9]{0,7}$/;

/**
 * Turns anything into a force the rest of the code can rely on: known fields only, text cut to
 * length, colours as hex, ids unique. What can't be mended is dropped. It never throws.
 */
export function cleanForce(input: unknown): Force {
  const source = isRecord(input) ? input : {};
  const branchIds = new Set<string>();
  const rankIds = new Set<string>();
  const branches: Branch[] = [];

  for (const raw of list(source.branches).slice(0, MAX_BRANCHES)) {
    if (!isRecord(raw)) continue;
    const kind = oneOf(branchKinds, raw.kind, 'other');
    const id = typeof raw.id === 'string' && ID.test(raw.id) && !branchIds.has(raw.id) ? raw.id : newId('b', branchIds);
    branchIds.add(id);
    const ranks: Rank[] = [];
    for (const item of list(raw.ranks).slice(0, MAX_RANKS)) {
      if (!isRecord(item)) continue;
      const rankId = typeof item.id === 'string' && ID.test(item.id) && !rankIds.has(item.id) ? item.id : newId('r', rankIds);
      rankIds.add(rankId);
      const code = oneOf([...codes, ''] as const, item.code, '');
      ranks.push({
        id: rankId,
        name: cleanText(item.name, MAX_NAME),
        abbr: cleanText(item.abbr, MAX_ABBR),
        code,
        grade: oneOf(grades, item.grade, gradeOf(code)),
        wear: oneOf(wears, item.wear, 'shoulder'),
        elements: cleanElements(item.elements),
      });
    }
    branches.push({
      id,
      name: cleanText(raw.name, MAX_NAME) || kindNames[kind],
      kind,
      cloth: cleanColour(raw.cloth, kindCloth[kind]),
      metal: oneOf(metals, raw.metal, kindMetal[kind]),
      piping: raw.piping === '' || raw.piping === undefined ? '' : cleanColour(raw.piping, ''),
      ranks,
    });
  }
  return { nation: cleanText(source.nation, MAX_NATION), branches };
}

/** A copy that shares nothing with the original, so one can be changed without the other. */
export const cloneForce = (force: Force): Force => ({
  nation: force.nation,
  branches: force.branches.map((b) => ({ ...b, ranks: b.ranks.map((r) => ({ ...r, elements: r.elements.map((e) => ({ ...e })) })) })),
});

/** A branch as it starts out, before any ranks: the usual cloth and metal for its kind. */
export const blankBranch = (kind: BranchKind, name: string = kindNames[kind]): Omit<Branch, 'id'> => ({
  name,
  kind,
  cloth: kindCloth[kind],
  metal: kindMetal[kind],
  piping: '',
  ranks: [],
});

export const rankCount = (force: Force): number => force.branches.reduce((n, b) => n + b.ranks.length, 0);

/** A rank's place among the codes: 0 for OF-10, 18 for OR-1, and after them all for no code. */
export const codeOrder = (code: Code | ''): number => (code === '' ? codes.length : codes.indexOf(code));

/** "Army of Orioni", or just "Army" for a nation with no name yet. */
export const branchTitle = (force: Force, branch: Branch): string => (force.nation ? `${branch.name} of ${force.nation}` : branch.name);
