/**
 * A force in its link: the whole design, packed small, in the query string.
 *
 *   https://rank.eurth.org/?d=1.WyJPcmlvbmkiLFtbIkFybXki…
 *
 * The form is the one @eurth/style gives every tool ("<version>.<compact JSON, base64url>"),
 * written and read with its helpers. A big force may not fit: past MAX_STATE the tool says so
 * and offers the profile file instead.
 *
 * What arrives in a link is someone else's input. decodeForce never throws, and everything it
 * reads goes through cleanForce before it is used.
 */
import { decodeState, encodeState } from '@eurth/style';
import { elementsText, parseElements } from './codec';
import { branchKinds, cleanForce, codes, gradeOf, grades, metals, wears, type Force } from './model';

export const LINK_VERSION = 1;
export const LINK_PARAM = 'd';
export const SITE = 'https://rank.eurth.org/';
/** The longest state a link may carry, so that the whole link fits the profile file's 4,000 characters. */
export const MAX_STATE = 3900;

/** Drops the empty values off the end of a list: most ranks need no more than a name and a design. */
function trim(values: (string | number)[]): (string | number)[] {
  let end = values.length;
  while (end > 0 && (values[end - 1] === '' || values[end - 1] === 0)) end--;
  return values.slice(0, end);
}

/**
 * The force as nested lists, with places in a list instead of names: a code is its number in
 * `codes` plus one (0 for none), and a grade is only written when it isn't the code's own.
 */
export function packForce(force: Force): unknown[] {
  return [
    force.nation,
    force.branches.map((b) => [
      b.name,
      branchKinds.indexOf(b.kind),
      b.cloth.slice(1),
      metals.indexOf(b.metal),
      b.piping.slice(1),
      b.ranks.map((r) =>
        trim([r.name, r.abbr, r.code === '' ? 0 : codes.indexOf(r.code) + 1, elementsText(r.elements), wears.indexOf(r.wear), r.grade === gradeOf(r.code) ? 0 : grades.indexOf(r.grade) + 1]),
      ),
    ]),
  ];
}

const at = <T>(options: readonly T[], index: unknown): T | undefined => (typeof index === 'number' && Number.isInteger(index) ? options[index] : undefined);

/** Reads the nested lists back into a force, cleaned. Null for anything that isn't one. */
export function unpackForce(value: unknown): Force | null {
  if (!Array.isArray(value) || !Array.isArray(value[1])) return null;
  const branches = (value[1] as unknown[]).map((b) => {
    if (!Array.isArray(b)) return null;
    const ranks = Array.isArray(b[5]) ? (b[5] as unknown[]) : [];
    return {
      name: b[0],
      kind: at(branchKinds, b[1]),
      cloth: typeof b[2] === 'string' ? `#${b[2]}` : undefined,
      metal: at(metals, b[3]),
      piping: typeof b[4] === 'string' && b[4] ? `#${b[4]}` : '',
      ranks: ranks.map((r) => {
        if (!Array.isArray(r)) return null;
        const code = typeof r[2] === 'number' && r[2] > 0 ? at(codes, r[2] - 1) : '';
        return {
          name: r[0],
          abbr: r[1],
          code,
          elements: parseElements(r[3]),
          wear: at(wears, r[4] ?? 0),
          grade: typeof r[5] === 'number' && r[5] > 0 ? at(grades, r[5] - 1) : undefined,
        };
      }),
    };
  });
  return cleanForce({ nation: value[0], branches });
}

/** The force as the value of the link's query parameter. */
export function encodeForce(force: Force): string {
  return encodeState(packForce(force), LINK_VERSION);
}

/** Reads a force back. Null for anything that isn't one: too long, malformed, a version from the future. */
export function decodeForce(text: string | null | undefined): Force | null {
  const state = decodeState(text, { maxLength: MAX_STATE * 2 });
  return state && state.version === LINK_VERSION ? unpackForce(state.value) : null;
}

/** Whether the force is small enough to travel in a link. */
export const fitsInLink = (force: Force): boolean => encodeForce(force).length <= MAX_STATE;

/** The link for a force, or null when the force is too big for one. */
export function forceLink(force: Force, base: string = SITE): string | null {
  const state = encodeForce(force);
  if (state.length > MAX_STATE) return null;
  const url = new URL(base);
  url.search = '';
  url.hash = '';
  url.searchParams.set(LINK_PARAM, state);
  return url.toString();
}

/** The force in a page address ("?d=1.…"), if there is one. */
export function forceFromSearch(search: string): Force | null {
  return decodeForce(new URLSearchParams(search).get(LINK_PARAM));
}

/** The same force with its branches and ranks numbered afresh, as a link gives it back. */
export function withPlainIds(force: Force): Force {
  return unpackForce(packForce(force)) ?? cleanForce({});
}
