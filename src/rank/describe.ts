/**
 * Insignia and ladders in words: for screen readers, for "Copy description", for the profile's
 * summary and for a picture's alternative text. Every result has a written description.
 */
import { branchTitle, cloths, elementNames, gradeNames, grades, metalColours, metalNames, rankCount, type Branch, type Element, type Force, type Rank, type Wear } from './model';
import { isEmuCommander } from './validate';

const numbers = ['no', 'one', 'two', 'three', 'four', 'five', 'six'];
const article = (word: string): string => (/^[aeiou]/i.test(word) ? 'an' : 'a');

const sentenceList = (items: string[]): string => (items.length <= 1 ? (items[0] ?? '') : `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`);

/** A colour in a word or two: the cloth's own name where it has one, a plain description otherwise. */
export function colourName(hex: string): string {
  const known = cloths.find((c) => c.hex === hex.toLowerCase());
  if (known) return known.name;
  if (hex.toLowerCase() === metalColours.gold) return 'gold';
  if (hex.toLowerCase() === metalColours.silver) return 'silver';
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255) as [number, number, number];
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const light = (max + min) / 2;
  const spread = max - min;
  if (spread < 0.08) return light > 0.85 ? 'white' : light < 0.15 ? 'black' : light > 0.5 ? 'light grey' : 'dark grey';
  let hue = max === r ? ((g - b) / spread) % 6 : max === g ? (b - r) / spread + 2 : (r - g) / spread + 4;
  hue = (hue * 60 + 360) % 360;
  const name = hue < 15 || hue >= 345 ? 'red' : hue < 45 ? 'orange' : hue < 70 ? 'yellow' : hue < 165 ? 'green' : hue < 200 ? 'teal' : hue < 255 ? 'blue' : hue < 290 ? 'purple' : 'pink';
  return `${light > 0.65 ? 'light ' : light < 0.3 ? 'dark ' : ''}${name}`;
}

/** One element in words: "two pips", "three chevrons, point down", "a wide ring with a curl". */
export function describeElement(element: Element, emus = false): string {
  const { kind, count } = element;
  if (kind === 'emblem') return 'the national emblem';
  const [one, many] = kind === 'star' && emus ? ['emu', 'emus'] : elementNames[kind];
  const wide = element.wide ? 'wide ' : '';
  let text = count === 1 ? `${article(wide || one)} ${wide}${one}` : `${numbers[count] ?? count} ${wide}${many}`;
  if (element.down) text += count === 1 ? ', point down' : ', points down';
  if (element.curl) text += count === 1 ? ' with a curl' : ', the top one with a curl';
  return text;
}

const wearWords: Record<Wear, string> = { shoulder: 'shoulder board', sleeve: 'sleeve', collar: 'collar patch' };

/** What an insignia carries, top to bottom or side to side: "a crown above two pips". */
export function describeElements(rank: Rank): string {
  const emus = isEmuCommander(rank.name);
  return rank.elements.map((e) => describeElement(e, emus)).join(rank.wear === 'collar' ? ' beside ' : ' above ');
}

const rankLabel = (rank: Rank): string => `${rank.name || 'Unnamed rank'}${rank.code ? ` (${rank.code})` : ''}`;

/** One insignia in a sentence: "Colonel (OF-5), Army of Orioni: a shoulder board in dark green with a crown above two pips, in gold." */
export function describeInsignia(force: Force, branch: Branch, rank: Rank): string {
  const where = `${article(wearWords[rank.wear])} ${wearWords[rank.wear]} in ${colourName(branch.cloth)}${branch.piping ? `, edged in ${colourName(branch.piping)}` : ''}`;
  const what = rank.elements.length ? `${where} with ${describeElements(rank)}, in ${metalNames[branch.metal]}` : `${where}, plain`;
  return `${rankLabel(rank)}, ${branchTitle(force, branch)}: ${what}.`;
}

/** A ladder in a paragraph: what a picture of the chart shows. */
export function summariseLadder(force: Force, branch: Branch): string {
  const count = branch.ranks.length;
  if (!count) return `${branchTitle(force, branch)}: no ranks yet.`;
  const parts = [`Rank insignia of the ${branchTitle(force, branch)}: ${count} ${count === 1 ? 'rank' : 'ranks'}, highest first, in ${metalNames[branch.metal]} on ${colourName(branch.cloth)}.`];
  for (const grade of grades) {
    const ranks = branch.ranks.filter((r) => r.grade === grade);
    if (ranks.length) parts.push(`${gradeNames[grade]}: ${sentenceList(ranks.map(rankLabel))}.`);
  }
  return parts.join(' ');
}

/** A ladder as text, a line a rank, for copying into a post or a wiki page. */
export function describeLadder(force: Force, branch: Branch): string {
  const lines = [`${branchTitle(force, branch)}: ${branch.ranks.length} ${branch.ranks.length === 1 ? 'rank' : 'ranks'}, highest first. Insignia in ${metalNames[branch.metal]} on ${colourName(branch.cloth)}.`];
  for (const grade of grades) {
    const ranks = branch.ranks.filter((r) => r.grade === grade);
    if (!ranks.length) continue;
    lines.push('', gradeNames[grade]);
    for (const rank of ranks) {
      const worn = rank.elements.length ? `${wearWords[rank.wear]}, ${describeElements(rank)}` : `${wearWords[rank.wear]}, plain`;
      lines.push(`${rankLabel(rank)}${rank.abbr ? `, ${rank.abbr}` : ''}: ${worn}.`);
    }
  }
  return lines.join('\n');
}

/** One paragraph for the profile file and for sharing, 600 characters at most. */
export function summarise(force: Force): string {
  const whose = force.nation ? `The armed forces of ${force.nation}` : 'These armed forces';
  if (!force.branches.length) return `${whose} have no branches yet.`;
  const branches = force.branches.map((b) => {
    const top = b.ranks[0];
    return `${b.name} (${b.ranks.length} ${b.ranks.length === 1 ? 'rank' : 'ranks'}${top?.name ? `, led by ${article(top.name)} ${top.name}` : ''})`;
  });
  const text = `${whose} have ${numbers[force.branches.length] ?? force.branches.length} ${force.branches.length === 1 ? 'branch' : 'branches'} and ${rankCount(force)} ranks: ${sentenceList(branches)}.`;
  return text.length <= 600 ? text : `${text.slice(0, 599).trimEnd()}…`;
}
