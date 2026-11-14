/**
 * The ladder as wikitext, for IIWiki or any MediaWiki: a table per branch with a row a rank
 * (NATO code, insignia, rank, abbreviation), and one table that sets the branches side by side
 * by code.
 *
 * The insignia cell points at a file by name. The tool downloads each insignia under exactly
 * that name, so uploading the files to the wiki fills the table in.
 */
import { describeElements } from './describe';
import { branchTitle, codes, gradeNames, grades, type Branch, type Force, type Rank } from './model';

/** Text made safe for a wiki table cell: nothing a person typed can open a link, a template or a new cell. */
export function wikiEscape(text: string): string {
  return text.replace(/[&|[\]{}<>'=!]/g, (c) => `&#${c.charCodeAt(0)};`);
}

/** A file name a wiki will take: no characters MediaWiki forbids in titles, single spaces. */
export function fileStem(force: Force, branch: Branch, rank: Rank): string {
  const text = [force.nation, branch.name, rank.code, rank.name || 'Unnamed rank']
    .filter(Boolean)
    .join(' ')
    .replace(/[#<>[\]|{}/:\\?*"%+&=']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return text || 'Rank insignia';
}

export const fileName = (force: Force, branch: Branch, rank: Rank): string => `${fileStem(force, branch, rank)}.svg`;

/** One branch's ladder as a wikitable: every rank a row, grouped by grade. */
export function ladderTable(force: Force, branch: Branch): string {
  const lines = [
    '{| class="wikitable" style="text-align:center"',
    `|+ Ranks and insignia of the ${wikiEscape(branchTitle(force, branch))}`,
    '! scope="col" | NATO code',
    '! scope="col" | Insignia',
    '! scope="col" | Rank',
    '! scope="col" | Abbreviation',
  ];
  for (const grade of grades) {
    const ranks = branch.ranks.filter((r) => r.grade === grade);
    if (!ranks.length) continue;
    lines.push('|-', `! colspan="4" | ${gradeNames[grade]}`);
    for (const rank of ranks) {
      const name = rank.name || 'Unnamed rank';
      const alt = rank.elements.length ? `${name}: ${describeElements(rank)}` : `${name}: no insignia`;
      lines.push('|-', `| ${rank.code || '—'} || [[File:${fileName(force, branch, rank)}|60px|alt=${wikiEscape(alt)}]] || ${wikiEscape(name)} || ${rank.abbr ? wikiEscape(rank.abbr) : '—'}`);
    }
  }
  lines.push('|}');
  return lines.join('\n');
}

/** The branches side by side: a row for each NATO code in use, a column a branch. */
export function comparisonTable(force: Force): string {
  const lines = ['{| class="wikitable" style="text-align:center"', `|+ Ranks of ${wikiEscape(force.nation || 'the armed forces')} compared`, '! scope="col" | NATO code'];
  for (const branch of force.branches) lines.push(`! scope="col" | ${wikiEscape(branch.name)}`);
  for (const code of codes) {
    const cells = force.branches.map((b) => b.ranks.filter((r) => r.code === code));
    if (!cells.some((c) => c.length)) continue;
    lines.push('|-', `! scope="row" | ${code}`);
    for (const ranks of cells) lines.push(`| ${ranks.length ? ranks.map((r) => wikiEscape(r.name || 'Unnamed rank')).join('<br>') : '—'}`);
  }
  lines.push('|}');
  return lines.join('\n');
}

/** Everything for the wiki page: a section a branch, and the comparison when there is more than one. */
export function toWikitext(force: Force): string {
  const parts = ['== Ranks and insignia =='];
  for (const branch of force.branches) parts.push(`=== ${wikiEscape(branch.name)} ===`, ladderTable(force, branch));
  if (force.branches.length > 1) parts.push('=== Comparison ===', comparisonTable(force));
  return `${parts.join('\n\n')}\n`;
}
