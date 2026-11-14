/**
 * An insignia's elements as a few characters: "c1p2" is a crown above two pips, "v3Dk1" three
 * chevrons point down above a rocker, "r2C rW1" two rings with a curl above a wide ring. The
 * link, the profile file and the templates all write designs this way.
 *
 * Each element is a letter, a count, and its flags: W (wide), D (down), C (curl). Spaces are
 * allowed between elements and mean nothing.
 */
import { cleanElement, MAX_ELEMENTS, type Element, type ElementKind } from './model';

const letters: Record<ElementKind, string> = { pip: 'p', star: 's', crown: 'c', wreath: 'w', bar: 'b', chevron: 'v', rocker: 'k', ring: 'r', emblem: 'e' };
const kinds = Object.fromEntries(Object.entries(letters).map(([kind, letter]) => [letter, kind])) as Record<string, ElementKind>;

export function elementsText(elements: readonly Element[]): string {
  return elements.map((e) => `${letters[e.kind]}${e.wide ? 'W' : ''}${e.count}${e.down ? 'D' : ''}${e.curl ? 'C' : ''}`).join('');
}

/** Reads elements back. Anything it doesn't know is skipped; it never throws. */
export function parseElements(text: unknown): Element[] {
  if (typeof text !== 'string' || text.length > 80) return [];
  const found: Element[] = [];
  for (const match of text.matchAll(/([a-z])(W?)(\d)?([DC]*)/g)) {
    const kind = kinds[match[1]!];
    if (!kind) continue;
    const element = cleanElement({ kind, count: match[3] === undefined ? 1 : Number(match[3]), wide: match[2] === 'W', down: match[4]!.includes('D'), curl: match[4]!.includes('C') });
    if (element) found.push(element);
    if (found.length === MAX_ELEMENTS) break;
  }
  return found;
}
