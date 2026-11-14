/**
 * The drawings: every device an insignia can carry, as SVG of our own. Each is drawn around its
 * own centre in a box of a known size, so insignia.ts can stack them without knowing how they
 * are made.
 *
 * A device is one colour, the metal. Where metal and cloth are too alike to tell apart (silver
 * on white, dark thread on black) it gets a thin outline as well, so nothing vanishes.
 */

export interface Paint {
  /** The metal. */
  fill: string;
  /** An outline, when the metal alone would not show on the cloth. */
  outline?: string;
}

const n = (value: number): string => String(Math.round(value * 100) / 100);

/** Attributes for a filled shape. */
const filled = (paint: Paint): string => `fill="${paint.fill}"${paint.outline ? ` stroke="${paint.outline}" stroke-width="1.2" stroke-linejoin="round"` : ''}`;

/** A line of a given thickness, with a slightly thicker one beneath it when an outline is needed. */
function stroked(d: string, thickness: number, paint: Paint, join: 'miter' | 'round' = 'miter'): string {
  const line = (colour: string, width: number) => `<path d="${d}" fill="none" stroke="${colour}" stroke-width="${n(width)}" stroke-linejoin="${join}" stroke-linecap="butt"/>`;
  return (paint.outline ? line(paint.outline, thickness + 2.4) : '') + line(paint.fill, thickness);
}

const polygon = (points: [number, number][], paint: Paint): string => `<polygon points="${points.map(([x, y]) => `${n(x)},${n(y)}`).join(' ')}" ${filled(paint)}/>`;

/** Points round a centre, alternating between two distances: stars of any number of points. */
function starPoints(tips: number, outer: number, inner: number): [number, number][] {
  const points: [number, number][] = [];
  for (let i = 0; i < tips * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (Math.PI * i) / tips - Math.PI / 2;
    points.push([r * Math.cos(a), r * Math.sin(a)]);
  }
  return points;
}

export const PIP = 28;
/** A pip: a four-pointed star, the junior officer's device. */
export const pip = (paint: Paint): string => polygon(starPoints(4, 14, 6.8), paint) + `<circle r="3" fill="${paint.outline ?? paint.fill}" opacity="0.35"/>`;

export const STAR = 30;
/** A five-pointed star. */
export const star = (paint: Paint): string => polygon(starPoints(5, 15, 5.9), paint);

export const CROWN = { width: 42, height: 36 };
/** A crown: three points with a ball on each, on a band. */
export const crown = (paint: Paint): string =>
  `<g ${filled(paint)}><path d="M-17 7L-20 -7L-10 1L0 -12L10 1L20 -7L17 7Z"/><rect x="-17" y="10" width="34" height="6" rx="1.5"/><circle cx="-20" cy="-9.5" r="2.8"/><circle cy="-14.8" r="2.8"/><circle cx="20" cy="-9.5" r="2.8"/></g>`;

export const WREATH = { width: 58, height: 46 };
/** A wreath: two sprays of laurel, joined at the foot and open at the top. */
export function wreath(paint: Paint): string {
  const leaves: string[] = [];
  const radius = 19;
  for (const side of [-1, 1]) {
    for (let i = 0; i < 5; i++) {
      const t = ((24 + i * 31) * Math.PI) / 180;
      const x = side * radius * Math.sin(t);
      const y = radius * Math.cos(t) + 2;
      const turn = side * -(24 + i * 31 + 30);
      leaves.push(`<ellipse cx="${n(x)}" cy="${n(y)}" rx="8" ry="3.4" transform="rotate(${n(turn)} ${n(x)} ${n(y)})"/>`);
    }
  }
  return `<g ${filled(paint)}>${leaves.join('')}<circle cy="${n(radius + 2)}" r="3"/></g>`;
}

export const EMBLEM = 48;
/**
 * The nation's emblem: its arms or flag from the profile, inside a ring. Without one, a plain
 * disc stands in. The picture only ever arrives as a data address made by @eurth/profile, and is
 * shown as an image, never as markup.
 */
export function emblem(paint: Paint, image?: string): string {
  const ring = `<circle r="21" fill="none" stroke="${paint.fill}" stroke-width="3"/>`;
  const outline = paint.outline ? `<circle r="22.8" fill="none" stroke="${paint.outline}" stroke-width="1.2"/>` : '';
  const middle = image ? `<image x="-15" y="-15" width="30" height="30" preserveAspectRatio="xMidYMid meet" href="${image}"/>` : `<circle r="9" ${filled(paint)}/>`;
  return outline + ring + middle;
}

/** A bar: a stripe of a given width. */
export const bar = (width: number, height: number, paint: Paint): string => `<rect x="${n(-width / 2)}" y="${n(-height / 2)}" width="${n(width)}" height="${n(height)}" ${filled(paint)}/>`;

export const CHEVRON = { width: 76, thickness: 10, rise: 24, pitch: 17 };
/** A chevron, point up, or point down. Its box is the width by rise plus thickness. */
export function chevron(paint: Paint, down = false): string {
  const { width, thickness, rise } = CHEVRON;
  const half = width / 2 - thickness / 2;
  const top = -(rise + thickness) / 2 + thickness / 2;
  const d = down ? `M${n(-half)} ${n(top)}L0 ${n(top + rise)}L${n(half)} ${n(top)}` : `M${n(-half)} ${n(top + rise)}L0 ${n(top)}L${n(half)} ${n(top + rise)}`;
  return stroked(d, thickness, paint);
}

export const ROCKER = { width: 76, thickness: 9, sag: 14, pitch: 15 };
/** A rocker: the curved bar that sits under a sergeant's chevrons. */
export function rocker(paint: Paint): string {
  const { width, thickness, sag } = ROCKER;
  const half = width / 2 - thickness / 2;
  const top = -(sag + thickness) / 2 + thickness / 2;
  return stroked(`M${n(-half)} ${n(top)}Q0 ${n(top + sag * 2)} ${n(half)} ${n(top)}`, thickness, paint, 'round');
}

export const CURL = 24;
/** The loop on a navy officer's top ring. It stands on the ring, so its box ends where the ring begins. */
export function curl(thickness: number, paint: Paint): string {
  const width = Math.min(7, thickness * 0.6);
  const loop = (colour: string, w: number) => `<circle cy="1" r="${n(CURL / 2 - 1)}" fill="none" stroke="${colour}" stroke-width="${n(w)}"/>`;
  return (paint.outline ? loop(paint.outline, width + 2.4) : '') + loop(paint.fill, width);
}

export const EMU = 30;
/** An emu. Eurth has history with emus. */
export const emu = (paint: Paint): string =>
  `<g ${filled(paint)}><ellipse cx="3" cy="1" rx="9.5" ry="6.5"/><path d="M-4 -1L-9.5 -9L-7 -10.5L-0.5 -4Z"/><circle cx="-8.5" cy="-11" r="3.2"/><path d="M-11 -12L-15 -10.5L-11 -9.5Z"/></g>` +
  `<path d="M1 7L0 14H-3M6 7L7 14H4" fill="none" stroke="${paint.fill}" stroke-width="1.7" stroke-linejoin="round"/>`;
