/**
 * Changing a force: every button in the builder comes down to one of these. Each takes a force
 * and gives back a new one, cleaned, and leaves the old one as it was, which is what makes undo
 * a matter of keeping the old one.
 */
import {
  blankBranch,
  cleanForce,
  cloneForce,
  codes,
  gradeOf,
  MAX_BRANCHES,
  MAX_ELEMENTS,
  MAX_RANKS,
  maxCount,
  newId,
  type Branch,
  type BranchKind,
  type Code,
  type Element,
  type ElementKind,
  type Force,
  type Metal,
  type Rank,
} from './model';
import { usualInsignia, usualName } from './nato';

/** Branches to add beyond the first three, each with the cloth and metal it usually wears. */
export const branchPresets: { id: string; name: string; kind: BranchKind; cloth: string; metal: Metal; piping: string }[] = [
  { id: 'army', name: 'Army', kind: 'army', cloth: '#1d2b1f', metal: 'gold', piping: '' },
  { id: 'navy', name: 'Navy', kind: 'navy', cloth: '#14213d', metal: 'gold', piping: '' },
  { id: 'air', name: 'Air force', kind: 'air', cloth: '#3d5a80', metal: 'silver', piping: '' },
  { id: 'marines', name: 'Marines', kind: 'army', cloth: '#14213d', metal: 'gold', piping: '#9b1c1c' },
  { id: 'gendarmerie', name: 'Gendarmerie', kind: 'other', cloth: '#16181a', metal: 'silver', piping: '#9b1c1c' },
  { id: 'space', name: 'Space force', kind: 'air', cloth: '#16181a', metal: 'silver', piping: '#8fb4d6' },
  { id: 'coast', name: 'Coast guard', kind: 'navy', cloth: '#f2f2ee', metal: 'gold', piping: '#14213d' },
  { id: 'other', name: 'New branch', kind: 'other', cloth: '#5d6660', metal: 'silver', piping: '' },
];

const allIds = (force: Force): { branches: string[]; ranks: string[] } => ({ branches: force.branches.map((b) => b.id), ranks: force.branches.flatMap((b) => b.ranks.map((r) => r.id)) });

/** A full ladder for a branch of this kind: every NATO code, with its usual name and insignia. */
export function usualLadder(kind: BranchKind): Omit<Rank, 'id'>[] {
  return codes.map((code) => {
    const [name, abbr] = usualName(kind, code);
    return { name, abbr, code, grade: gradeOf(code), ...usualInsignia(kind, code) };
  });
}

/** A force to begin from: an army, a navy and an air force, each with the usual ladder. */
export function startForce(nation = ''): Force {
  return cleanForce({ nation, branches: (['army', 'navy', 'air'] as const).map((kind) => ({ ...blankBranch(kind), ranks: usualLadder(kind) })) });
}

export interface Added {
  force: Force;
  /** The id of what was added, or '' when nothing could be. */
  id: string;
}

const change = (force: Force, edit: (next: Force) => void): Force => {
  const next = cloneForce(force);
  edit(next);
  return cleanForce(next);
};

export const setNation = (force: Force, nation: string): Force => cleanForce({ ...cloneForce(force), nation });

/** Adds a branch from a preset, with the usual ladder for its kind. */
export function addBranch(force: Force, presetId: string): Added {
  const preset = branchPresets.find((p) => p.id === presetId) ?? branchPresets.at(-1)!;
  if (force.branches.length >= MAX_BRANCHES) return { force, id: '' };
  const id = newId('b', allIds(force).branches);
  const taken = new Set(force.branches.map((b) => b.name));
  let name = preset.name;
  for (let n = 2; taken.has(name); n++) name = `${preset.name} ${n}`;
  const next = cloneForce(force) as Force & { branches: unknown[] };
  next.branches.push({ id, name, kind: preset.kind, cloth: preset.cloth, metal: preset.metal, piping: preset.piping, ranks: usualLadder(preset.kind) });
  return { force: cleanForce(next), id };
}

export const removeBranch = (force: Force, id: string): Force => change(force, (next) => void (next.branches = next.branches.filter((b) => b.id !== id)));

export function updateBranch(force: Force, id: string, changes: Partial<Pick<Branch, 'name' | 'cloth' | 'metal' | 'piping'>>): Force {
  return change(force, (next) => {
    const at = next.branches.findIndex((b) => b.id === id);
    if (at >= 0) next.branches[at] = { ...next.branches[at]!, ...changes };
  });
}

/**
 * Adds a rank below the one named, or at the foot of the ladder. It takes the next code down
 * that the branch doesn't use yet, with that code's usual name and insignia.
 */
export function addRank(force: Force, branchId: string, belowRankId?: string): Added {
  const branch = force.branches.find((b) => b.id === branchId);
  if (!branch || branch.ranks.length >= MAX_RANKS) return { force, id: '' };
  const at = belowRankId === undefined ? -1 : branch.ranks.findIndex((r) => r.id === belowRankId);
  const above = at >= 0 ? branch.ranks[at] : branch.ranks.at(-1);
  const used = new Set(branch.ranks.map((r) => r.code));
  const from = above?.code ? codes.indexOf(above.code) + 1 : 0;
  const code: Code | '' = codes.slice(from).find((c) => !used.has(c)) ?? above?.code ?? 'OR-1';
  const id = newId('r', allIds(force).ranks);
  const rank: Rank = { id, name: 'New rank', abbr: '', code, grade: gradeOf(code), ...usualInsignia(branch.kind, code) };
  const next = change(force, (f) => {
    const ranks = f.branches.find((b) => b.id === branchId)!.ranks;
    ranks.splice(at >= 0 ? at + 1 : ranks.length, 0, rank);
  });
  return { force: next, id };
}

const withRank = (force: Force, branchId: string, rankId: string, edit: (rank: Rank, ranks: Rank[], at: number) => void): Force =>
  change(force, (next) => {
    const ranks = next.branches.find((b) => b.id === branchId)?.ranks;
    const at = ranks?.findIndex((r) => r.id === rankId) ?? -1;
    if (ranks && at >= 0) edit(ranks[at]!, ranks, at);
  });

/** Changes a rank. When the code changes, the grade follows it unless the grade had been set by hand. */
export function updateRank(force: Force, branchId: string, rankId: string, changes: Partial<Omit<Rank, 'id' | 'elements'>>): Force {
  return withRank(force, branchId, rankId, (rank) => {
    const followed = rank.grade === gradeOf(rank.code);
    Object.assign(rank, changes);
    if (changes.code !== undefined && changes.grade === undefined && followed) rank.grade = gradeOf(rank.code);
  });
}

export const removeRank = (force: Force, branchId: string, rankId: string): Force => withRank(force, branchId, rankId, (_rank, ranks, at) => void ranks.splice(at, 1));

/** Moves a rank one place up (-1) or down (1) the ladder. */
export function moveRank(force: Force, branchId: string, rankId: string, by: -1 | 1): Force {
  return withRank(force, branchId, rankId, (rank, ranks, at) => {
    const to = at + by;
    if (to < 0 || to >= ranks.length) return;
    ranks[at] = ranks[to]!;
    ranks[to] = rank;
  });
}

/** Adds an element to the foot of an insignia. Adding one already at the foot adds to its count instead. */
export function addElement(force: Force, branchId: string, rankId: string, kind: ElementKind): Force {
  return withRank(force, branchId, rankId, (rank) => {
    const last = rank.elements.at(-1);
    if (last?.kind === kind && !last.wide && last.count < maxCount[kind]) last.count += 1;
    else if (rank.elements.length < MAX_ELEMENTS) rank.elements.push({ kind, count: 1, ...(kind === 'chevron' && rank.elements.find((e) => e.kind === 'chevron')?.down ? { down: true } : {}) });
  });
}

export function updateElement(force: Force, branchId: string, rankId: string, index: number, changes: Partial<Omit<Element, 'kind'>>): Force {
  return withRank(force, branchId, rankId, (rank) => {
    const element = rank.elements[index];
    if (element) rank.elements[index] = { ...element, ...changes };
  });
}

export const removeElement = (force: Force, branchId: string, rankId: string, index: number): Force => withRank(force, branchId, rankId, (rank) => void rank.elements.splice(index, 1));

export function moveElement(force: Force, branchId: string, rankId: string, index: number, by: -1 | 1): Force {
  return withRank(force, branchId, rankId, (rank) => {
    const to = index + by;
    const element = rank.elements[index];
    if (!element || to < 0 || to >= rank.elements.length) return;
    rank.elements[index] = rank.elements[to]!;
    rank.elements[to] = element;
  });
}
