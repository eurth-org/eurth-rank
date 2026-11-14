/**
 * Things worth a gentle word: two ranks with one name, a ladder whose codes run out of order,
 * two ranks nobody could tell apart. None of them stops the tool; a fictional army is allowed
 * its oddities.
 */
import { elementsText } from './codec';
import { codeOrder, type Force } from './model';

/** The rank that swaps its stars for emus. */
export const isEmuCommander = (name: string): boolean => /^\s*supreme\s+emu\s+commander\s*$/i.test(name);

export const EMU_TOAST = 'The emus accept your surrender.';

export type NoteCode = 'no-ranks' | 'unnamed' | 'same-name' | 'out-of-order' | 'same-insignia';

export interface Note {
  code: NoteCode;
  /** "problem": the ladder contradicts itself. "hint": something is missing that the tool could use. */
  kind: 'problem' | 'hint';
  branch: string;
  /** The ranks the note is about, to select them from it. */
  ranks: string[];
  text: string;
}

/** Everything worth pointing out about a force, problems first. */
export function checkForce(force: Force): Note[] {
  const problems: Note[] = [];
  const hints: Note[] = [];
  for (const branch of force.branches) {
    const where = branch.name;
    if (!branch.ranks.length) {
      hints.push({ code: 'no-ranks', kind: 'hint', branch: branch.id, ranks: [], text: `${where} has no ranks yet. Add one, or start from a template.` });
      continue;
    }
    const unnamed = branch.ranks.filter((r) => !r.name);
    if (unnamed.length) {
      hints.push({ code: 'unnamed', kind: 'hint', branch: branch.id, ranks: unnamed.map((r) => r.id), text: `${where}: ${unnamed.length === 1 ? 'one rank has' : `${unnamed.length} ranks have`} no name yet.` });
    }

    const byName = new Map<string, string[]>();
    const byLook = new Map<string, string[]>();
    for (const rank of branch.ranks) {
      if (rank.name) byName.set(rank.name.toLowerCase(), [...(byName.get(rank.name.toLowerCase()) ?? []), rank.id]);
      if (rank.elements.length) {
        const look = `${rank.wear}:${elementsText(rank.elements)}`;
        byLook.set(look, [...(byLook.get(look) ?? []), rank.id]);
      }
    }
    const name = (id: string): string => branch.ranks.find((r) => r.id === id)?.name || 'an unnamed rank';
    for (const ids of byName.values()) {
      if (ids.length > 1) problems.push({ code: 'same-name', kind: 'problem', branch: branch.id, ranks: ids, text: `${where} has ${ids.length} ranks called ${name(ids[0]!)}.` });
    }
    for (const ids of byLook.values()) {
      if (ids.length > 1) {
        problems.push({ code: 'same-insignia', kind: 'problem', branch: branch.id, ranks: ids, text: `${where}: ${ids.map(name).join(' and ')} wear the same insignia, so nobody could tell them apart.` });
      }
    }

    // The ladder runs highest first, so each coded rank should sit at or below the one before it.
    let above: (typeof branch.ranks)[number] | undefined;
    for (const rank of branch.ranks) {
      if (rank.code === '') continue;
      if (above && codeOrder(rank.code) < codeOrder(above.code)) {
        problems.push({
          code: 'out-of-order',
          kind: 'problem',
          branch: branch.id,
          ranks: [above.id, rank.id],
          text: `${where}: ${rank.name || 'A rank'} (${rank.code}) sits below ${name(above.id)} (${above.code}), though its code is the higher one.`,
        });
      }
      above = rank;
    }
  }
  return [...problems, ...hints];
}
