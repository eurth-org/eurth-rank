import { describe, expect, it } from 'vitest';
import { elementsText, parseElements } from '../src/rank/codec';
import { addBranch, addElement, addRank, branchPresets, moveElement, moveRank, removeBranch, removeElement, removeRank, setNation, startForce, updateBranch, updateElement, updateRank, usualLadder } from '../src/rank/edit';
import { cleanColour, cleanElement, cleanForce, cleanText, codeOrder, codes, gradeOf, MAX_BRANCHES, MAX_ELEMENTS, MAX_RANKS, maxCount, newId, rankCount } from '../src/rank/model';
import { codeInfo, nato, usualInsignia, usualName } from '../src/rank/nato';
import { checkForce, isEmuCommander } from '../src/rank/validate';

describe('cleaning: a link or a file is someone else’s input', () => {
  it('never throws, whatever it is given', () => {
    for (const junk of [null, undefined, 7, 'x', [], { branches: 'no' }, { branches: [null, 3, { ranks: [null, 'x', { elements: 'p9' }] }] }]) {
      expect(() => cleanForce(junk)).not.toThrow();
    }
    expect(cleanForce(null)).toEqual({ nation: '', branches: [] });
  });

  it('keeps known fields only, and cuts text to length', () => {
    const force = cleanForce({
      nation: `<b>Orioni</b>\n${'x'.repeat(200)}`,
      evil: true,
      branches: [{ name: '  Grand   Army ', kind: 'army', cloth: '#ABCDEF', metal: 'platinum', piping: 'red', onclick: 'x', ranks: [{ name: 'Colonel', abbr: 'x'.repeat(40), code: 'OF-5', wear: 'hat', elements: [{ kind: 'pip', count: 99 }, { kind: 'laser' }] }] }],
    });
    expect(force.nation.length).toBe(60);
    expect(force.nation).not.toMatch(/[<>\n]/);
    expect(Object.keys(force)).toEqual(['nation', 'branches']);
    const branch = force.branches[0]!;
    expect(branch).toMatchObject({ id: 'b1', name: 'Grand Army', cloth: '#abcdef', metal: 'gold', piping: '' });
    expect(Object.keys(branch).sort()).toEqual(['cloth', 'id', 'kind', 'metal', 'name', 'piping', 'ranks']);
    expect(branch.ranks[0]).toMatchObject({ id: 'r1', code: 'OF-5', grade: 'officer', wear: 'shoulder', elements: [{ kind: 'pip', count: maxCount.pip }] });
    expect(branch.ranks[0]!.abbr.length).toBe(12);
  });

  it('clamps how much there can be', () => {
    const rank = { name: 'R', elements: Array.from({ length: 20 }, () => ({ kind: 'star', count: 1 })) };
    const branch = { kind: 'army', ranks: Array.from({ length: 80 }, () => rank) };
    const force = cleanForce({ branches: Array.from({ length: 40 }, () => branch) });
    expect(force.branches).toHaveLength(MAX_BRANCHES);
    expect(force.branches[0]!.ranks).toHaveLength(MAX_RANKS);
    expect(force.branches[0]!.ranks[0]!.elements).toHaveLength(MAX_ELEMENTS);
    expect(new Set(force.branches.flatMap((b) => b.ranks.map((r) => r.id))).size).toBe(rankCount(force));
  });

  it('gives duplicate or odd ids fresh ones', () => {
    const force = cleanForce({ branches: [{ id: 'b1', ranks: [{ id: 'r1' }, { id: 'r1' }, { id: 'DROP TABLE' }] }, { id: 'b1' }] });
    expect(force.branches.map((b) => b.id)).toEqual(['b1', 'b2']);
    expect(new Set(force.branches[0]!.ranks.map((r) => r.id)).size).toBe(3);
  });

  it('only keeps flags where they mean something', () => {
    expect(cleanElement({ kind: 'pip', count: 2, wide: true, down: true, curl: true })).toEqual({ kind: 'pip', count: 2 });
    expect(cleanElement({ kind: 'ring', count: 0, wide: true, curl: true })).toEqual({ kind: 'ring', count: 1, wide: true, curl: true });
    expect(cleanElement({ kind: 'chevron', count: 2.6, down: true })).toEqual({ kind: 'chevron', count: 3, down: true });
    expect(cleanElement({ kind: 'bar', count: Number.NaN })).toEqual({ kind: 'bar', count: 1 });
    expect(cleanElement('pip')).toBeNull();
  });

  it('cleans text and colours', () => {
    expect(cleanText(' a\u0000b  <i>c</i> ', 20)).toBe('a b i c /i');
    expect(cleanText(12, 5)).toBe('');
    expect(cleanColour('#FFAA00', '#000000')).toBe('#ffaa00');
    expect(cleanColour('red', '#000000')).toBe('#000000');
    expect(cleanColour('#fff', '#000000')).toBe('#000000');
  });

  it('makes ids that are not taken', () => {
    expect(newId('r', [])).toBe('r1');
    expect(newId('r', ['r1', 'r2', 'r4'])).toBe('r5');
    expect(newId('b', ['b2'])).toBe('b3');
  });
});

describe('the NATO codes', () => {
  it('run from OF-10 down to OR-1, with a grade each', () => {
    expect(codes).toHaveLength(19);
    expect(nato.map((row) => row.code)).toEqual([...codes]);
    expect(gradeOf('OF-1')).toBe('officer');
    expect(gradeOf('OR-9')).toBe('nco');
    expect(gradeOf('OR-5')).toBe('nco');
    expect(gradeOf('OR-4')).toBe('enlisted');
    expect(gradeOf('')).toBe('enlisted');
    expect(codeOrder('OF-10')).toBe(0);
    expect(codeOrder('OR-1')).toBe(18);
    expect(codeOrder('')).toBe(19);
  });

  it('give every code a usual name in each service', () => {
    for (const code of codes) {
      for (const kind of ['army', 'navy', 'air', 'other'] as const) {
        const [name, abbr] = usualName(kind, code);
        expect(name.length, `${kind} ${code}`).toBeGreaterThan(2);
        expect(abbr.length, `${kind} ${code}`).toBeLessThanOrEqual(12);
      }
      expect(codeInfo(code).level.length).toBeGreaterThan(10);
    }
    expect(usualName('navy', 'OF-5')).toEqual(['Captain', 'Capt']);
    expect(usualName('army', 'OF-2')).toEqual(['Captain', 'Capt']);
    expect(usualName('other', 'OF-5')[0]).toBe('Colonel');
  });

  it('give every code an insignia, and no two ranks of a usual ladder the same one', () => {
    for (const kind of ['army', 'navy', 'air', 'other'] as const) {
      const seen = new Set<string>();
      for (const code of codes) {
        const { wear, elements } = usualInsignia(kind, code);
        if (code !== 'OR-1') expect(elements.length, `${kind} ${code}`).toBeGreaterThan(0);
        const look = `${wear}:${elementsText(elements)}`;
        expect(seen.has(look), `${kind} ${code} ${look}`).toBe(false);
        seen.add(look);
      }
    }
    expect(usualInsignia('navy', 'OF-5')).toEqual({ wear: 'sleeve', elements: [{ kind: 'ring', count: 4, curl: true }] });
    expect(usualInsignia('navy', 'OR-5').elements).toEqual([{ kind: 'chevron', count: 3, down: true }]);
    expect(usualInsignia('army', '')).toEqual({ wear: 'sleeve', elements: [] });
  });
});

describe('elements in a few characters', () => {
  it('reads what it writes', () => {
    for (const text of ['c1p2', 'v3Dk1', 'r2CrW1', 'bW1b2', 's5', 'w1e1', '']) {
      expect(elementsText(parseElements(text))).toBe(text);
    }
    expect(parseElements('r1C b1 r1')).toEqual([{ kind: 'ring', count: 1, curl: true }, { kind: 'bar', count: 1 }, { kind: 'ring', count: 1 }]);
  });

  it('skips what it does not know, and never throws', () => {
    expect(parseElements('z9p2!!x')).toEqual([{ kind: 'pip', count: 2 }]);
    expect(parseElements('p')).toEqual([{ kind: 'pip', count: 1 }]);
    expect(parseElements('p9')).toEqual([{ kind: 'pip', count: maxCount.pip }]);
    expect(parseElements(null)).toEqual([]);
    expect(parseElements('p1'.repeat(100))).toEqual([]);
    expect(parseElements('p1s1c1w1b1v1k1r1e1')).toHaveLength(MAX_ELEMENTS);
  });
});

describe('editing', () => {
  const start = startForce('Orioni');
  const army = start.branches[0]!;

  it('starts with an army, a navy and an air force, each with the full usual ladder', () => {
    expect(start.nation).toBe('Orioni');
    expect(start.branches.map((b) => b.kind)).toEqual(['army', 'navy', 'air']);
    for (const branch of start.branches) expect(branch.ranks.map((r) => r.code)).toEqual([...codes]);
    expect(usualLadder('navy')[5]).toMatchObject({ name: 'Captain', code: 'OF-5', grade: 'officer', wear: 'sleeve' });
    expect(checkForce(start)).toEqual([]);
  });

  it('never changes the force it is given', () => {
    const before = JSON.stringify(start);
    addBranch(start, 'marines');
    updateBranch(start, army.id, { name: 'Legion' });
    addRank(start, army.id);
    updateRank(start, army.id, army.ranks[0]!.id, { name: 'Warlord' });
    addElement(start, army.id, army.ranks[0]!.id, 'pip');
    removeRank(start, army.id, army.ranks[0]!.id);
    expect(JSON.stringify(start)).toBe(before);
  });

  it('adds and removes branches', () => {
    const added = addBranch(start, 'marines');
    expect(added.id).toBe('b4');
    expect(added.force.branches[3]).toMatchObject({ name: 'Marines', kind: 'army', piping: '#9b1c1c' });
    expect(added.force.branches[3]!.ranks).toHaveLength(19);
    expect(addBranch(added.force, 'marines').force.branches[4]!.name).toBe('Marines 2');
    expect(addBranch(start, 'nonsense').force.branches[3]!.name).toBe('New branch');
    expect(removeBranch(added.force, added.id).branches).toHaveLength(3);
    let full = start;
    for (let i = 0; i < 20; i++) full = addBranch(full, 'other').force;
    expect(full.branches).toHaveLength(MAX_BRANCHES);
    expect(addBranch(full, 'other').id).toBe('');
    expect(branchPresets.map((p) => p.id)).toContain('gendarmerie');
    expect(setNation(start, ' <Teland> ').nation).toBe('Teland');
  });

  it('changes a branch', () => {
    const next = updateBranch(start, army.id, { name: 'Legion', cloth: '#9B1C1C', metal: 'silver', piping: '#f2f2ee' });
    expect(next.branches[0]).toMatchObject({ name: 'Legion', cloth: '#9b1c1c', metal: 'silver', piping: '#f2f2ee' });
    expect(updateBranch(start, army.id, { name: '' }).branches[0]!.name).toBe('Army');
    expect(updateBranch(start, 'nope', { name: 'x' })).toEqual(start);
  });

  it('adds a rank below another with the next free code', () => {
    const trimmed = removeRank(start, army.id, army.ranks[3]!.id); // OF-7 gone
    const added = addRank(trimmed, army.id, army.ranks[2]!.id);
    const ranks = added.force.branches[0]!.ranks;
    expect(ranks[3]).toMatchObject({ id: added.id, name: 'New rank', code: 'OF-7', grade: 'officer' });
    expect(ranks[3]!.elements.length).toBeGreaterThan(0);
    const foot = addRank(start, army.id);
    expect(foot.force.branches[0]!.ranks.at(-1)).toMatchObject({ id: foot.id, code: 'OR-1' });
    expect(addRank(start, 'nope').id).toBe('');
  });

  it('lets the grade follow the code unless it was set by hand', () => {
    const id = army.ranks[9]!.id; // OF-1
    const moved = updateRank(start, army.id, id, { code: 'OR-9' });
    expect(moved.branches[0]!.ranks[9]).toMatchObject({ code: 'OR-9', grade: 'nco' });
    const byHand = updateRank(start, army.id, id, { grade: 'enlisted' });
    expect(updateRank(byHand, army.id, id, { code: 'OF-3' }).branches[0]!.ranks[9]).toMatchObject({ code: 'OF-3', grade: 'enlisted' });
    expect(updateRank(start, army.id, id, { name: 'Ensign', abbr: 'Ens', wear: 'collar' }).branches[0]!.ranks[9]).toMatchObject({ name: 'Ensign', abbr: 'Ens', wear: 'collar' });
  });

  it('moves and removes ranks', () => {
    const first = army.ranks[0]!.id;
    expect(moveRank(start, army.id, first, 1).branches[0]!.ranks[1]!.id).toBe(first);
    expect(moveRank(start, army.id, first, -1)).toEqual(start);
    expect(removeRank(start, army.id, first).branches[0]!.ranks).toHaveLength(18);
  });

  it('builds an insignia element by element', () => {
    const id = army.ranks.at(-1)!.id; // OR-1, bare
    let force = addElement(start, army.id, id, 'pip');
    force = addElement(force, army.id, id, 'pip');
    force = addElement(force, army.id, id, 'crown');
    const elements = () => force.branches[0]!.ranks.at(-1)!.elements;
    expect(elements()).toEqual([{ kind: 'pip', count: 2 }, { kind: 'crown', count: 1 }]);
    force = moveElement(force, army.id, id, 1, -1);
    expect(elements().map((e) => e.kind)).toEqual(['crown', 'pip']);
    force = updateElement(force, army.id, id, 1, { count: 9 });
    expect(elements()[1]).toEqual({ kind: 'pip', count: maxCount.pip });
    force = addElement(force, army.id, id, 'pip');
    expect(elements()).toHaveLength(3);
    force = removeElement(force, army.id, id, 0);
    expect(elements().map((e) => e.kind)).toEqual(['pip', 'pip']);
    for (let i = 0; i < 12; i++) force = addElement(force, army.id, id, i % 2 ? 'crown' : 'wreath');
    expect(elements()).toHaveLength(MAX_ELEMENTS);
  });
});

describe('the checks', () => {
  it('point out what contradicts itself', () => {
    const force = cleanForce({
      branches: [
        {
          name: 'Army',
          kind: 'army',
          ranks: [
            { name: 'Major', code: 'OF-3', elements: [{ kind: 'crown', count: 1 }] },
            { name: 'Colonel', code: 'OF-5', elements: [{ kind: 'crown', count: 1 }] },
            { name: 'major', code: 'OR-2' },
            { name: '' },
          ],
        },
        { name: 'Navy', kind: 'navy' },
      ],
    });
    const notes = checkForce(force);
    expect(notes.map((n) => n.code)).toEqual(['same-name', 'same-insignia', 'out-of-order', 'unnamed', 'no-ranks']);
    expect(notes[2]!.text).toBe('Army: Colonel (OF-5) sits below Major (OF-3), though its code is the higher one.');
    expect(notes[1]!.text).toContain('Major and Colonel wear the same insignia');
    expect(notes.at(-1)).toMatchObject({ kind: 'hint', branch: 'b2' });
  });

  it('know the Supreme Emu Commander', () => {
    expect(isEmuCommander('Supreme Emu Commander')).toBe(true);
    expect(isEmuCommander('  supreme   EMU commander ')).toBe(true);
    expect(isEmuCommander('Supreme Commander')).toBe(false);
  });
});
