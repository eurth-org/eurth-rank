import { describe, expect, it } from 'vitest';
import { figureById, figureRanks, figures } from '../src/content/figures';
import { glossary, termById } from '../src/content/glossary';
import { describeInsignia } from '../src/rank/describe';
import { insigniaSvg } from '../src/rank/insignia';
import { crc32, zip, zipName } from '../src/rank/zip';

describe('the guide’s figures', () => {
  it('each resolve to real ranks, and draw', () => {
    expect(figures.length).toBeGreaterThanOrEqual(8);
    expect(new Set(figures.map((f) => f.id)).size).toBe(figures.length);
    for (const figure of figures) {
      const shown = figureRanks(figure);
      expect(shown.length, figure.id).toBe(figure.from.reduce((n, part) => n + part.ranks.length, 0));
      expect(figure.caption.length, figure.id).toBeGreaterThan(30);
      for (const { force, branch, rank } of shown) {
        expect(insigniaSvg(force, branch, rank)).toContain('</svg>');
        expect(describeInsignia(force, branch, rank)).toContain(rank.name);
      }
    }
  });

  it('show what their captions say', () => {
    const elements = (id: string) => figureRanks(figureById(id)).map(({ rank }) => rank.elements);
    expect(elements('more').map((e) => e[0]!.count)).toEqual([1, 2, 3]);
    expect(elements('better').map((e) => e[0]!.kind)).toEqual(['pip', 'crown', 'crown', 'crown']);
    expect(elements('wider').slice(3).every((e) => e.some((x) => x.wide))).toBe(true);
    expect(figureRanks(figureById('captains')).map(({ rank }) => rank.code)).toEqual(['OF-2', 'OF-5']);
    expect(figureRanks(figureById('collar')).every(({ rank }) => rank.wear === 'collar')).toBe(true);
    expect(() => figureById('nope')).toThrow();
    expect(() => figureRanks({ id: 'x', caption: '', from: [{ template: 'commonwealth', branch: 'Army', ranks: ['Grand Poobah'] }] })).toThrow(/Grand Poobah/);
  });
});

describe('the glossary', () => {
  it('has about forty terms, in order, each a sentence or two', () => {
    expect(glossary.length).toBeGreaterThanOrEqual(40);
    expect(new Set(glossary.map((t) => t.id)).size).toBe(glossary.length);
    expect(glossary.map((t) => t.term)).toEqual([...glossary.map((t) => t.term)].sort((a, b) => a.localeCompare(b, 'en')));
    for (const entry of glossary) {
      expect(entry.id, entry.term).toMatch(/^[a-z][a-z-]*$/);
      expect(entry.definition.length, entry.term).toBeGreaterThan(40);
      expect(entry.definition.length, entry.term).toBeLessThan(330);
      expect(entry.definition.endsWith('.'), entry.term).toBe(true);
    }
  });

  it('only points at terms that exist', () => {
    for (const entry of glossary) for (const id of entry.see ?? []) expect(termById(id), `${entry.id} → ${id}`).toBeDefined();
  });
});

describe('the zip of every insignia', () => {
  it('is a zip a computer will open', () => {
    const bytes = zip([{ name: 'a.svg', text: '<svg/>' }, { name: 'Ünïcode name.svg', text: 'héllo' }]);
    const view = new DataView(bytes.buffer);
    expect(view.getUint32(0, true)).toBe(0x04034b50);
    expect(view.getUint32(bytes.length - 22, true)).toBe(0x06054b50);
    expect(view.getUint16(bytes.length - 12, true)).toBe(2);
    const directory = view.getUint32(bytes.length - 6, true);
    expect(view.getUint32(directory, true)).toBe(0x02014b50);
    expect(new TextDecoder().decode(bytes.slice(30, 35))).toBe('a.svg');
    expect(new TextDecoder().decode(bytes.slice(35, 41))).toBe('<svg/>');
    expect(view.getUint32(14, true)).toBe(crc32(new TextEncoder().encode('<svg/>')));
    expect(zip([{ name: 'a.svg', text: '<svg/>' }])).toEqual(zip([{ name: 'a.svg', text: '<svg/>' }]));
    expect(zip([])).toHaveLength(22);
  });

  it('knows the usual checksum, and keeps names safe and apart', () => {
    expect(crc32(new TextEncoder().encode('123456789'))).toBe(0xcbf43926);
    expect(zipName('../../etc/passwd')).toBe('.. .. etc passwd');
    expect(zipName('')).toBe('file');
    const names = (files: { name: string; text: string }[]) => {
      const bytes = zip(files);
      const view = new DataView(bytes.buffer);
      const found: string[] = [];
      let at = view.getUint32(bytes.length - 6, true);
      for (let i = 0; i < files.length; i++) {
        const length = view.getUint16(at + 28, true);
        found.push(new TextDecoder().decode(bytes.slice(at + 46, at + 46 + length)));
        at += 46 + length;
      }
      return found;
    };
    expect(names([{ name: 'Colonel.svg', text: 'a' }, { name: 'colonel.svg', text: 'b' }, { name: 'Colonel.svg', text: 'c' }])).toEqual(['Colonel.svg', 'colonel 2.svg', 'Colonel 3.svg']);
  });
});
