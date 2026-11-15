/**
 * One insignia as a picture: a shoulder board, a sleeve or a collar patch in the branch's cloth,
 * carrying the rank's elements in the branch's metal.
 *
 * Elements are placed by rule, never by hand. On a shoulder board and a sleeve they stack from
 * the collar end down; on a collar patch they sit in a row. If the stack is too tall or too wide
 * for the cloth, the whole stack is drawn smaller, so six pips can never spill off a board.
 *
 * The picture stands on its own (a title, a description, no outside fonts or files) and whatever
 * a person typed is escaped before it goes in.
 */
import { contrast } from '@eurth/style';
import { describeInsignia } from './describe';
import { bar, chevron, CHEVRON, crown, CROWN, curl, CURL, emblem, EMBLEM, emblemImage, emu, EMU, pip, PIP, rocker, ROCKER, star, STAR, wreath, WREATH, type Paint } from './elements';
import { metalColours, type Branch, type Element, type Force, type Rank, type Wear } from './model';
import { isEmuCommander } from './validate';

export const escapeXml = (text: string): string => text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c);

const n = (value: number): string => String(Math.round(value * 100) / 100);

/** The cloth each insignia is drawn on: its size, its outline, and the room the elements have. */
interface Cloth {
  width: number;
  height: number;
  /** The outline of the cloth. */
  path: string;
  /** Where elements go: the centre line, the top, and how much room there is. */
  cx: number;
  top: number;
  roomWidth: number;
  roomHeight: number;
  /** How wide a bar or ring runs: from edge to edge of the cloth. */
  fullWidth: number;
  flow: 'down' | 'across';
}

export const cloth: Record<Wear, Cloth> = {
  shoulder: { width: 140, height: 320, path: 'M22 308V58Q22 12 70 12Q118 12 118 58V308Z', cx: 70, top: 74, roomWidth: 78, roomHeight: 222, fullWidth: 96, flow: 'down' },
  sleeve: { width: 220, height: 240, path: 'M20 10H200V230H20Z', cx: 110, top: 24, roomWidth: 150, roomHeight: 176, fullWidth: 180, flow: 'down' },
  collar: { width: 220, height: 130, path: 'M28 16H192Q200 16 200 24V106Q200 114 192 114H28Q20 114 20 106V24Q20 16 28 16Z', cx: 110, top: 26, roomWidth: 156, roomHeight: 78, fullWidth: 44, flow: 'across' },
};

const GAP = 10;

/** One element's share of the stack: how big it is, and how to draw it with its top left at 0,0. */
interface Block {
  width: number;
  height: number;
  /** A bar or ring: as wide as the cloth, whatever the stack's scale. */
  full: boolean;
  /** Draws the block centred on x = 0, starting at y = 0. `width` is the width a full block takes. */
  draw: (paint: Paint, width: number) => string;
  /** The centre of each device in the block, for the glint that greets a new pip. */
  centres: [number, number][];
}

const at = (x: number, y: number, body: string): string => `<g transform="translate(${n(x)} ${n(y)})">${body}</g>`;

/** A device repeated: down the cloth, or across it. */
function repeated(count: number, width: number, height: number, across: boolean, draw: (paint: Paint) => string): Block {
  const gap = 5;
  const centres: [number, number][] = [];
  for (let i = 0; i < count; i++) {
    centres.push(across ? [(i - (count - 1) / 2) * (width + gap), height / 2] : [0, height / 2 + i * (height + gap)]);
  }
  return {
    width: across ? count * width + (count - 1) * gap : width,
    height: across ? height : count * height + (count - 1) * gap,
    full: false,
    draw: (paint) => centres.map(([x, y]) => at(x, y, draw(paint))).join(''),
    centres,
  };
}

function block(element: Element, across: boolean, emblemId: string | undefined, emus: boolean): Block {
  const { kind, count } = element;
  switch (kind) {
    case 'pip':
      return repeated(count, PIP, PIP, across, pip);
    case 'star':
      return emus ? repeated(count, EMU, EMU, across, emu) : repeated(count, STAR, STAR, across, star);
    case 'crown':
      return repeated(count, CROWN.width, CROWN.height, across, crown);
    case 'wreath':
      return repeated(count, WREATH.width, WREATH.height, across, wreath);
    case 'emblem':
      return repeated(count, EMBLEM, EMBLEM, across, (paint) => emblem(paint, emblemId));
    case 'bar':
    case 'ring': {
      const each = kind === 'ring' ? (element.wide ? 30 : 12) : element.wide ? 14 : 7;
      const gap = kind === 'ring' ? 8 : 6;
      const loop = kind === 'ring' && element.curl === true ? CURL : 0;
      const centres: [number, number][] = [];
      for (let i = 0; i < count; i++) centres.push([0, loop + each / 2 + i * (each + gap)]);
      return {
        width: 0,
        height: loop + count * each + (count - 1) * gap,
        full: true,
        draw: (paint, width) => (loop ? at(0, loop / 2, curl(each, paint)) : '') + centres.map(([x, y]) => at(x, y, bar(width, each, paint))).join(''),
        centres,
      };
    }
    case 'chevron':
    case 'rocker': {
      const shape = kind === 'chevron' ? { ...CHEVRON, height: CHEVRON.rise + CHEVRON.thickness } : { ...ROCKER, height: ROCKER.sag + ROCKER.thickness };
      const centres: [number, number][] = [];
      for (let i = 0; i < count; i++) centres.push([0, shape.height / 2 + i * shape.pitch]);
      return {
        width: shape.width,
        height: shape.height + (count - 1) * shape.pitch,
        full: false,
        draw: (paint) => centres.map(([x, y]) => at(x, y, kind === 'chevron' ? chevron(paint, element.down) : rocker(paint))).join(''),
        centres,
      };
    }
  }
}

export interface InsigniaOptions {
  /** The nation's arms or flag, as a data address from @eurth/profile's svgDataUrl(). */
  emblem?: string;
  /** For a drawing inside a bigger one: the id of an emblem image the bigger one has defined. */
  emblemId?: string;
  /** The colour of the cloth's edge when the branch has no piping. */
  edge?: string;
  /** Put before the ids of the title and description, when a page or picture holds several. */
  idPrefix?: string;
}

export interface Drawn {
  width: number;
  height: number;
  /** The drawing without its outer svg element, for the chart to place. */
  body: string;
  /** Where each device sits, in the drawing's own units, in the order they were added. */
  centres: { element: number; x: number; y: number }[];
}

/** The metal as it shows on this cloth: with an outline when the two are too alike. */
export function paintFor(branch: Pick<Branch, 'cloth' | 'metal'>): Paint {
  const fill = metalColours[branch.metal];
  if (contrast(fill, branch.cloth) >= 3) return { fill };
  return { fill, outline: contrast('#16181a', branch.cloth) >= contrast('#f2f2ee', branch.cloth) ? '#16181a' : '#f2f2ee' };
}

/** Draws a rank's insignia. Pure: the same rank and branch always give the same picture. */
export function drawInsignia(branch: Branch, rank: Rank, options: InsigniaOptions = {}): Drawn {
  const c = cloth[rank.wear];
  const across = c.flow === 'across';
  const paint = paintFor(branch);
  const emus = isEmuCommander(rank.name);
  const blocks = rank.elements.map((element) => block(element, across, options.emblemId, emus));

  // How long the stack is, how thick it is, and so how much smaller it must be drawn to fit.
  const along = blocks.reduce((sum, b) => sum + (across ? (b.full ? c.fullWidth : b.width) : b.height), 0) + GAP * Math.max(0, blocks.length - 1);
  const thick = Math.max(0, ...blocks.map((b) => (across ? b.height : b.full ? 0 : b.width)));
  const room = across ? [c.roomWidth, c.roomHeight] : [c.roomHeight, c.roomWidth];
  const scale = Math.min(1, along ? room[0]! / along : 1, thick ? room[1]! / thick : 1);

  const parts: string[] = [];
  const edge = branch.piping || options.edge || '#798c88';
  parts.push(`<path d="${c.path}" fill="${branch.cloth}" stroke="${edge}" stroke-width="${branch.piping ? 4 : 1.5}" stroke-linejoin="round"/>`);
  // The button that holds a shoulder board down.
  if (rank.wear === 'shoulder') parts.push(at(70, 44, `<circle r="9" fill="${paint.fill}"${paint.outline ? ` stroke="${paint.outline}" stroke-width="1.2"` : ''}/>`));

  const centres: Drawn['centres'] = [];
  let cursor = (across ? c.cx - (along * scale) / 2 : c.top + (c.roomHeight - along * scale) / 2) / scale;
  blocks.forEach((b, i) => {
    const size = across ? (b.full ? c.fullWidth : b.width) : b.height;
    // In the stack's own units, so that a full-width bar still reaches the edges once scaled.
    const x = across ? cursor + size / 2 : c.cx / scale;
    const y = across ? (c.top + c.roomHeight / 2) / scale - b.height / 2 : cursor;
    const width = b.full ? (across ? c.fullWidth : c.fullWidth / scale) : b.width;
    parts.push(`<g transform="scale(${n(scale)}) translate(${n(x)} ${n(y)})">${b.draw(paint, width)}</g>`);
    for (const [dx, dy] of b.centres) centres.push({ element: i, x: (x + dx) * scale, y: (y + dy) * scale });
    cursor += size + GAP;
  });

  return { width: c.width, height: c.height, body: parts.join(''), centres };
}

/** One insignia as a file: an SVG with a clear ground, ready for a wiki or a document. */
export function insigniaSvg(force: Force, branch: Branch, rank: Rank, options: InsigniaOptions = {}): string {
  const ids = options.idPrefix ?? 'rank';
  const carries = options.emblem !== undefined && rank.elements.some((e) => e.kind === 'emblem');
  const drawn = drawInsignia(branch, rank, { ...options, emblemId: carries ? `${ids}-emblem` : undefined });
  const title = [rank.name || 'Unnamed rank', rank.code].filter(Boolean).join(', ');
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${drawn.width} ${drawn.height}" width="${drawn.width}" height="${drawn.height}" role="img" aria-labelledby="${ids}-title ${ids}-desc">` +
    `<title id="${ids}-title">${escapeXml(title)}</title><desc id="${ids}-desc">${escapeXml(describeInsignia(force, branch, rank))}</desc>${carries ? emblemImage(`${ids}-emblem`, escapeXml(options.emblem!)) : ''}${drawn.body}</svg>`
  );
}
