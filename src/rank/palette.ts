/**
 * The colours of a downloaded chart. A file can't use the stylesheet's custom properties, so
 * they are read from @eurth/style's tokens as plain values: the same names, the same colours.
 */
import { resolveColors } from '@eurth/style';
import tokens from '@eurth/style/tokens.json';

export type Theme = 'dark' | 'light';

export interface Palette {
  surface: string;
  surfaceRaised: string;
  ink: string;
  inkMuted: string;
  lineStrong: string;
}

/** Which token each part of the chart takes its colour from. */
export const paletteTokens: Record<keyof Palette, string> = {
  surface: 'surface',
  surfaceRaised: 'surface-raised',
  ink: 'ink',
  inkMuted: 'ink-muted',
  lineStrong: 'line-strong',
};

export function paletteFor(theme: Theme): Palette {
  const colours = resolveColors(tokens, theme);
  return Object.fromEntries(Object.entries(paletteTokens).map(([role, token]) => [role, colours[token]])) as unknown as Palette;
}

export const SANS: string = tokens.type.families.sans;
export const MONO: string = tokens.type.families.mono;
