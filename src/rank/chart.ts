/**
 * The ladder chart: every rank of a branch side by side, highest first, each with its insignia,
 * its NATO code, its name and its abbreviation. The familiar comparison table, as one SVG that
 * stands on its own.
 *
 * Ranks are grouped by grade (officers, non-commissioned officers, enlisted), each group on its
 * own rows, so a long ladder stays readable instead of running off the side.
 */
import { summariseLadder } from './describe';
import { emblemImage } from './elements';
import { drawInsignia, escapeXml, type InsigniaOptions } from './insignia';
import { branchTitle, gradeNames, grades, type Branch, type Force, type Rank } from './model';
import { MONO, paletteFor, SANS, type Palette } from './palette';

export const CELL_WIDTH = 150;
export const CELL_HEIGHT = 262;
export const PER_ROW = 8;
const MARGIN = 24;
const HEADING = 84;
const GROUP_LABEL = 34;
const ART = { width: 126, height: 156 };
const NAME_CHARS = 18;

/** A name on one or two lines of a cell, cut with an ellipsis if it still doesn't fit. */
export function wrapName(text: string, max = NAME_CHARS): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(' ').filter(Boolean)) {
    if (!line) line = word;
    else if (`${line} ${word}`.length <= max) line = `${line} ${word}`;
    else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  const cut = (value: string): string => (value.length > max ? `${value.slice(0, max - 1)}…` : value);
  if (lines.length <= 2) return lines.map(cut);
  return [cut(lines[0]!), cut(`${lines[1]} ${lines.slice(2).join(' ')}`)];
}

export interface ChartOptions extends InsigniaOptions {
  /** The colours of the ground and the lettering. Night's, when not given. */
  palette?: Palette;
  /** The branch's name and nation above the chart. On by default. */
  heading?: boolean;
}

export interface Chart {
  width: number;
  height: number;
  svg: string;
}

function cell(branch: Branch, rank: Rank, x: number, y: number, palette: Palette, options: ChartOptions): string {
  const drawn = drawInsignia(branch, rank, { ...options, edge: palette.lineStrong });
  const fit = Math.min(ART.width / drawn.width, ART.height / drawn.height);
  const w = drawn.width * fit;
  const h = drawn.height * fit;
  const cx = x + CELL_WIDTH / 2;
  const out: string[] = [];
  out.push(`<svg x="${cx - w / 2}" y="${y + (ART.height - h) / 2}" width="${w}" height="${h}" viewBox="0 0 ${drawn.width} ${drawn.height}">${drawn.body}</svg>`);
  let line = y + ART.height + 24;
  if (rank.code) out.push(`<text x="${cx}" y="${line}" text-anchor="middle" font-family="${escapeXml(MONO)}" font-size="13" fill="${palette.inkMuted}">${rank.code}</text>`);
  line += 22;
  for (const part of wrapName(rank.name || 'Unnamed rank')) {
    out.push(`<text x="${cx}" y="${line}" text-anchor="middle" font-family="${escapeXml(SANS)}" font-size="15" font-weight="700" fill="${palette.ink}">${escapeXml(part)}</text>`);
    line += 19;
  }
  if (rank.abbr) out.push(`<text x="${cx}" y="${line + 1}" text-anchor="middle" font-family="${escapeXml(MONO)}" font-size="13" fill="${palette.inkMuted}">${escapeXml(rank.abbr)}</text>`);
  return out.join('');
}

/** Draws a branch's ladder. Pure: the same branch always gives the same chart. */
export function ladderChart(force: Force, branch: Branch, options: ChartOptions = {}): Chart {
  const palette = options.palette ?? paletteFor('dark');
  const heading = options.heading !== false;
  const ids = options.idPrefix ?? 'ladder';
  const groups = grades.map((grade) => ({ grade, ranks: branch.ranks.filter((r) => r.grade === grade) })).filter((g) => g.ranks.length);
  const widest = Math.max(1, ...groups.map((g) => Math.min(PER_ROW, g.ranks.length)));
  const width = MARGIN * 2 + Math.max(widest, 3) * CELL_WIDTH;

  // The emblem's picture is defined once and used by every rank that carries it.
  const carries = options.emblem !== undefined && branch.ranks.some((r) => r.elements.some((e) => e.kind === 'emblem'));
  const cells: ChartOptions = { ...options, emblemId: carries ? `${ids}-emblem` : undefined };

  const body: string[] = [];
  let y = MARGIN + (heading ? HEADING : 0);
  if (!groups.length) {
    body.push(`<text x="${MARGIN}" y="${y + 20}" font-family="${escapeXml(SANS)}" font-size="15" fill="${palette.inkMuted}">No ranks yet.</text>`);
    y += 48;
  }
  for (const group of groups) {
    body.push(`<text x="${MARGIN}" y="${y + 16}" font-family="${escapeXml(SANS)}" font-size="13" font-weight="700" letter-spacing="1.04" fill="${palette.inkMuted}">${escapeXml(gradeNames[group.grade].toUpperCase())}</text>`);
    body.push(`<path d="M${MARGIN} ${y + 24}H${width - MARGIN}" stroke="${palette.lineStrong}" stroke-width="1"/>`);
    y += GROUP_LABEL;
    group.ranks.forEach((rank, i) => {
      const column = i % PER_ROW;
      const row = Math.floor(i / PER_ROW);
      body.push(cell(branch, rank, MARGIN + column * CELL_WIDTH, y + row * CELL_HEIGHT, palette, cells));
    });
    y += Math.ceil(group.ranks.length / PER_ROW) * CELL_HEIGHT + 8;
  }
  const height = y + MARGIN - 8;

  const out: string[] = [];
  out.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-labelledby="${ids}-title ${ids}-desc">`);
  out.push(`<title id="${ids}-title">${escapeXml(`Ranks and insignia of the ${branchTitle(force, branch)}`)}</title>`);
  out.push(`<desc id="${ids}-desc">${escapeXml(summariseLadder(force, branch))}</desc>`);
  if (carries) out.push(emblemImage(`${ids}-emblem`, escapeXml(options.emblem!)));
  out.push(`<rect width="${width}" height="${height}" fill="${palette.surface}"/>`);
  if (heading) {
    out.push(`<text x="${MARGIN}" y="${MARGIN + 30}" font-family="${escapeXml(SANS)}" font-size="28" font-weight="700" fill="${palette.ink}">${escapeXml(branch.name)}</text>`);
    out.push(`<text x="${MARGIN}" y="${MARGIN + 56}" font-family="${escapeXml(SANS)}" font-size="15" fill="${palette.inkMuted}">${escapeXml([force.nation, 'Ranks and insignia'].filter(Boolean).join(' · '))}</text>`);
  }
  out.push(...body, '</svg>');
  return { width, height, svg: out.join('') };
}
