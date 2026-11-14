import { contrast } from '@eurth/style';
import { describe, expect, it } from 'vitest';
import { CELL_WIDTH, ladderChart, PER_ROW, wrapName } from '../src/rank/chart';
import { parseElements } from '../src/rank/codec';
import { csvCell, CSV_HEADER, toCsv } from '../src/rank/csv';
import { colourName, describeElement, describeElements, describeInsignia, describeLadder, summarise, summariseLadder } from '../src/rank/describe';
import { startForce } from '../src/rank/edit';
import { cloth, drawInsignia, escapeXml, insigniaSvg, paintFor } from '../src/rank/insignia';
import { decodeForce, encodeForce, fitsInLink, forceFromSearch, forceLink, LINK_VERSION, MAX_STATE, packForce, unpackForce, withPlainIds } from '../src/rank/link';
import { cleanForce, cloths, metalColours, metals, rankCount, type Branch, type Force, type Rank } from '../src/rank/model';
import { paletteFor } from '../src/rank/palette';
import { DESIGN_FORMAT, fromSection, hasDesign, kindFromName, toSection } from '../src/rank/profile';
import { templateById, templates } from '../src/rank/templates';
import { comparisonTable, fileName, ladderTable, toWikitext, wikiEscape } from '../src/rank/wikitext';

const aldermoor = templateById('commonwealth')!.force;
const army = aldermoor.branches[0]!;
const navy = aldermoor.branches[1]!;
const rank = (branch: Branch, name: string): Rank => branch.ranks.find((r) => r.name === name)!;
const made = (wear: Rank['wear'], design: string, name = 'Test'): Rank => ({ id: 'r1', name, abbr: '', code: 'OF-5', grade: 'officer', wear, elements: parseElements(design) });

describe('an insignia', () => {
  it('is drawn on its cloth, in its metal', () => {
    const svg = insigniaSvg(aldermoor, army, rank(army, 'Colonel'));
    expect(svg).toMatch(/^<svg xmlns="http:\/\/www.w3.org\/2000\/svg" viewBox="0 0 140 320"/);
    expect(svg).toContain(`fill="${army.cloth}"`);
    expect(svg).toContain(`fill="${metalColours.gold}"`);
    expect(svg).toContain('<title id="rank-title">Colonel, OF-5</title>');
    expect(svg).toContain('a shoulder board in olive with a crown above two pips, in gold.');
    expect(svg.endsWith('</svg>')).toBe(true);
  });

  it('never lets the stack spill off the cloth', () => {
    const reach = (r: Rank) => {
      const drawn = drawInsignia(army, r);
      const c = cloth[r.wear];
      for (const centre of drawn.centres) {
        const half = Math.max(c.fullWidth, c.roomWidth) / 2;
        expect(centre.x, `${r.wear} x`).toBeGreaterThanOrEqual(c.cx - half - 0.01);
        expect(centre.x, `${r.wear} x`).toBeLessThanOrEqual(c.cx + half + 0.01);
        expect(centre.y, `${r.wear} y`).toBeGreaterThanOrEqual(c.top - 0.01);
        expect(centre.y, `${r.wear} y`).toBeLessThanOrEqual(c.top + c.roomHeight + 0.01);
      }
      return drawn;
    };
    for (const wear of ['shoulder', 'sleeve', 'collar'] as const) {
      reach(made(wear, 'p4s5c2w1r4CrW4'));
      reach(made(wear, 'v4v4Dk3bW4b4e1'));
      expect(reach(made(wear, 'p1')).centres).toHaveLength(1);
      expect(reach(made(wear, '')).centres).toHaveLength(0);
    }
    // A tall stack is drawn smaller; a short one at full size.
    expect(drawInsignia(army, made('shoulder', 'p4s5c2')).body).toMatch(/scale\(0\.\d+\)/);
    expect(drawInsignia(army, made('shoulder', 'p2')).body).toContain('scale(1)');
  });

  it('says where each device sits, in the order they were added', () => {
    const drawn = drawInsignia(army, made('shoulder', 'c1p2'));
    expect(drawn.centres.map((c) => c.element)).toEqual([0, 1, 1]);
    expect(drawn.centres[0]!.y).toBeLessThan(drawn.centres[1]!.y);
    expect(drawn.centres[1]!.y).toBeLessThan(drawn.centres[2]!.y);
    const row = drawInsignia(army, made('collar', 'p3'));
    expect(row.centres[0]!.x).toBeLessThan(row.centres[2]!.x);
    expect(row.centres[0]!.y).toBeCloseTo(row.centres[2]!.y);
  });

  it('gives metal an outline where it would vanish into the cloth', () => {
    for (const { hex } of cloths) {
      for (const metal of metals) {
        const paint = paintFor({ cloth: hex, metal });
        const seen = Math.max(contrast(paint.fill, hex), paint.outline ? contrast(paint.outline, hex) : 0);
        expect(seen, `${metal} on ${hex}`).toBeGreaterThanOrEqual(3);
      }
    }
    expect(paintFor({ cloth: '#1d2b1f', metal: 'gold' }).outline).toBeUndefined();
    expect(paintFor({ cloth: '#f2f2ee', metal: 'silver' }).outline).toBe('#16181a');
    expect(paintFor({ cloth: '#16181a', metal: 'dark' }).outline).toBe('#f2f2ee');
  });

  it('shows the nation’s emblem as an image, never as markup', () => {
    const data = 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=';
    const svg = insigniaSvg(aldermoor, army, made('shoulder', 'e1'), { emblem: data });
    expect(svg).toContain(`<image x="-15" y="-15" width="30" height="30" preserveAspectRatio="xMidYMid meet" href="${data}"/>`);
    expect(insigniaSvg(aldermoor, army, made('shoulder', 'e1'))).not.toContain('<image');
  });

  it('escapes whatever was typed', () => {
    expect(escapeXml(`<a href="x">Tom & 'Jerry'</a>`)).toBe('&lt;a href=&quot;x&quot;&gt;Tom &amp; &#39;Jerry&#39;&lt;/a&gt;');
    const force: Force = { nation: 'A & B', branches: [{ ...army, name: 'O"Hara\'s Own' }] };
    const svg = insigniaSvg(force, force.branches[0]!, { ...made('shoulder', 'p1'), name: 'Chief & "Boss"' });
    expect(svg).toContain('Chief &amp; &quot;Boss&quot;');
    expect(svg).not.toContain('"Boss"');
    expect(svg).toContain('O&quot;Hara&#39;s Own of A &amp; B');
  });

  it('swaps the stars of the Supreme Emu Commander for emus', () => {
    const usual = drawInsignia(army, made('shoulder', 's3', 'General')).body;
    const emus = drawInsignia(army, made('shoulder', 's3', 'Supreme Emu Commander')).body;
    expect(usual).toContain('<polygon');
    expect(emus).not.toContain('<polygon');
    expect(emus.match(/<ellipse/g)).toHaveLength(3);
    expect(describeElements(made('shoulder', 's3', 'Supreme Emu Commander'))).toBe('three emus');
  });
});

describe('the description', () => {
  it('puts each element in words', () => {
    expect(describeElement({ kind: 'pip', count: 1 })).toBe('a pip');
    expect(describeElement({ kind: 'emblem', count: 1 })).toBe('the national emblem');
    expect(describeElement({ kind: 'chevron', count: 3, down: true })).toBe('three chevrons, points down');
    expect(describeElement({ kind: 'chevron', count: 1, down: true })).toBe('a chevron, point down');
    expect(describeElement({ kind: 'ring', count: 1, wide: true, curl: true })).toBe('a wide ring with a curl');
    expect(describeElement({ kind: 'ring', count: 3, curl: true })).toBe('three rings, the top one with a curl');
    expect(describeElement({ kind: 'bar', count: 2, wide: true })).toBe('two wide bars');
  });

  it('describes an insignia in a sentence', () => {
    expect(describeInsignia(aldermoor, army, rank(army, 'Colonel'))).toBe('Colonel (OF-5), Army of Aldermoor: a shoulder board in olive with a crown above two pips, in gold.');
    expect(describeInsignia(aldermoor, navy, rank(navy, 'Lieutenant Commander'))).toBe('Lieutenant Commander (OF-3), Navy of Aldermoor: a sleeve in navy blue with a ring with a curl above a bar above a ring, in gold.');
    expect(describeInsignia(aldermoor, army, rank(army, 'Private'))).toBe('Private (OR-2), Army of Aldermoor: a sleeve in olive, plain.');
    const veldmark = templateById('continental')!.force;
    const air = veldmark.branches[2]!;
    expect(describeInsignia(veldmark, air, rank(air, 'Major'))).toBe('Major (OF-3), Air Force of Veldmark: a collar patch in air force blue, edged in gold with a wreath beside a pip, in silver.');
  });

  it('names colours it has never seen', () => {
    expect(colourName('#14213d')).toBe('navy blue');
    expect(colourName('#E8C46A')).toBe('gold');
    expect(colourName('#ff0000')).toBe('red');
    expect(colourName('#003300')).toBe('dark green');
    expect(colourName('#cce0ff')).toBe('light blue');
    expect(colourName('#808080')).toBe('light grey');
    expect(colourName('#ffffff')).toBe('white');
    expect(colourName('#050505')).toBe('black');
  });

  it('describes a ladder, as a paragraph and line by line', () => {
    expect(summariseLadder(aldermoor, navy)).toMatch(/^Rank insignia of the Navy of Aldermoor: 15 ranks, highest first, in gold on navy blue\. Officers: Admiral of the Fleet \(OF-10\), /);
    const lines = describeLadder(aldermoor, army).split('\n');
    expect(lines[0]).toBe('Army of Aldermoor: 18 ranks, highest first. Insignia in gold on olive.');
    expect(lines).toContain('Officers');
    expect(lines).toContain('Colonel (OF-5), Col: shoulder board, a crown above two pips.');
    expect(lines).toContain('Private (OR-2), Pte: sleeve, plain.');
    expect(summarise(aldermoor)).toBe('The armed forces of Aldermoor have three branches and 49 ranks: Army (18 ranks, led by a Field Marshal), Navy (15 ranks, led by an Admiral of the Fleet) and Air Force (16 ranks, led by a Marshal of the Air Force).');
    expect(summarise(cleanForce({}))).toBe('These armed forces have no branches yet.');
    expect(summarise(cleanForce({ nation: 'x'.repeat(60), branches: Array.from({ length: 12 }, () => ({ name: 'y'.repeat(60), ranks: [{ name: 'z'.repeat(60) }] })) })).length).toBeLessThanOrEqual(600);
  });
});

describe('the ladder chart', () => {
  it('shows every rank, grouped by grade', () => {
    const chart = ladderChart(aldermoor, army);
    expect(chart.svg).toContain('<title id="ladder-title">Ranks and insignia of the Army of Aldermoor</title>');
    for (const r of army.ranks) for (const line of wrapName(r.name)) expect(chart.svg).toContain(`>${escapeXml(line)}</text>`);
    expect(chart.svg).toContain('>OFFICERS<');
    expect(chart.svg).toContain('>NON-COMMISSIONED OFFICERS<');
    expect(chart.svg).toContain('>ENLISTED<');
    expect(chart.width).toBe(48 + PER_ROW * CELL_WIDTH);
    expect(chart.svg.match(/<svg x=/g)).toHaveLength(army.ranks.length);
  });

  it('uses only the colours it is given, the cloth and the metal', () => {
    for (const theme of ['dark', 'light'] as const) {
      const palette = paletteFor(theme);
      const allowed = new Set([...Object.values(palette), army.cloth, metalColours[army.metal]].map((c) => c.toLowerCase()));
      const used = new Set([...ladderChart(aldermoor, army, { palette }).svg.matchAll(/#[0-9a-f]{6}\b/gi)].map((m) => m[0].toLowerCase()));
      for (const colour of used) expect(allowed.has(colour), `${theme} ${colour}`).toBe(true);
      expect(used.has(palette.surface.toLowerCase())).toBe(true);
    }
  });

  it('copes with an empty ladder and can leave its heading off', () => {
    const empty = cleanForce({ nation: 'Nowhere', branches: [{ name: 'Army', kind: 'army' }] });
    const chart = ladderChart(empty, empty.branches[0]!);
    expect(chart.svg).toContain('No ranks yet.');
    const bare = ladderChart(aldermoor, army, { heading: false, idPrefix: 'guide-1' });
    expect(bare.height).toBe(ladderChart(aldermoor, army).height - 84);
    expect(bare.svg).toContain('aria-labelledby="guide-1-title guide-1-desc"');
  });

  it('wraps long names onto two lines and cuts what is left', () => {
    expect(wrapName('Colonel')).toEqual(['Colonel']);
    expect(wrapName('Warrant Officer Class One')).toEqual(['Warrant Officer', 'Class One']);
    expect(wrapName('Supercalifragilisticexpialidocious Commander of Everything Else')).toEqual(['Supercalifragilis…', 'Commander of Ever…']);
  });
});

describe('a force in its link', () => {
  it('comes back as it went in', () => {
    for (const { id, force } of templates) {
      expect(decodeForce(encodeForce(force)), id).toEqual(force);
      expect(withPlainIds(force), id).toEqual(force);
    }
    const start = startForce('Orioni');
    expect(decodeForce(encodeForce(start))).toEqual(start);
  });

  it('keeps a grade set by hand, and a rank with no code', () => {
    const force = cleanForce({ nation: 'N', branches: [{ name: 'Guard', kind: 'other', piping: '#9b1c1c', ranks: [{ name: 'Elder', code: '', grade: 'officer', wear: 'collar', elements: [{ kind: 'wreath', count: 1 }] }, { name: 'Odd', code: 'OF-3', grade: 'enlisted' }] }] });
    expect(decodeForce(encodeForce(force))).toEqual(force);
  });

  it('is small enough for every template', () => {
    for (const { id, force } of templates) {
      expect(fitsInLink(force), `${id}: ${encodeForce(force).length}`).toBe(true);
      const link = forceLink(force)!;
      expect(link.startsWith('https://rank.eurth.org/?d=1.')).toBe(true);
      expect(forceFromSearch(new URL(link).search)).toEqual(force);
    }
    expect(forceLink(aldermoor, 'http://localhost:4321/?x=1#y')).toMatch(/^http:\/\/localhost:4321\/\?d=1\./);
  });

  it('says when a force is too big for one', () => {
    const big = cleanForce({ nation: 'Big', branches: Array.from({ length: 12 }, (_, i) => ({ name: `Branch number ${i}`, kind: 'army', ranks: Array.from({ length: 30 }, (_, j) => ({ name: `A rather long rank name ${j}`, abbr: 'ABBR', code: 'OF-5', elements: parseElements('c1p2s3') })) })) });
    expect(fitsInLink(big)).toBe(false);
    expect(forceLink(big)).toBeNull();
    expect(encodeForce(big).length).toBeGreaterThan(MAX_STATE);
  });

  it('never throws on a link that is not one', () => {
    for (const junk of [null, undefined, '', 'hello', '1.', '1.!!!', '2.W10', `1.${'A'.repeat(20000)}`, '1.eyJhIjoxfQ', '1.W1tdXQ']) {
      expect(() => decodeForce(junk)).not.toThrow();
    }
    expect(decodeForce('hello')).toBeNull();
    expect(decodeForce(`${LINK_VERSION + 1}.${encodeForce(aldermoor).slice(2)}`)).toBeNull();
    expect(unpackForce({ a: 1 })).toBeNull();
    expect(unpackForce(['<b>N</b>', [['A', 99, 'zzzzzz', -1, 5, [['R', 7, 'x', 12, 44, 9], null, 'x']], 'junk', null]])).toMatchObject({ nation: 'b N /b', branches: [{ name: 'A', kind: 'other', metal: 'silver', ranks: [{ name: 'R', abbr: '', code: '', wear: 'shoulder', elements: [] }] }] });
    expect(packForce(cleanForce({}))).toEqual(['', []]);
  });
});

describe('the profile’s rank section', () => {
  it('carries names for other tools and the design for coming back', () => {
    const section = toSection(aldermoor);
    expect(section.branches).toEqual(['Army', 'Navy', 'Air Force']);
    expect(section.ranks).toHaveLength(rankCount(aldermoor));
    expect(section.ranks![0]).toEqual({ name: 'Field Marshal', branch: 'Army', code: 'OF-10', grade: 'officer', abbr: 'FM' });
    expect(section.format).toBe(DESIGN_FORMAT);
    expect(section.link).toBe(forceLink(aldermoor));
    expect(section.summary).toMatch(/^The armed forces of Aldermoor have three branches/);
    expect(section).not.toHaveProperty('updated');
    expect(hasDesign(section)).toBe(true);
    expect(fromSection(section)).toEqual(aldermoor);
    expect(fromSection(JSON.parse(JSON.stringify(section)))).toEqual(aldermoor);
  });

  it('keeps keys it does not know, and uses the address it is given', () => {
    const section = toSection(aldermoor, { base: 'http://localhost:4321/', previous: { motto: 'Hold fast', link: 'https://old.example/', updated: '2020-01-01', design: ['old'] } });
    expect(section.motto).toBe('Hold fast');
    expect(section.link).toBeUndefined();
    expect(section).not.toHaveProperty('updated');
    expect(fromSection(section)).toEqual(aldermoor);
  });

  it('falls back to the tool’s own address when the force is too big for a link', () => {
    const big = cleanForce({ nation: 'Big', branches: Array.from({ length: 12 }, (_, i) => ({ name: `Branch ${i}`, kind: 'army', ranks: Array.from({ length: 30 }, (_, j) => ({ name: `A rather long rank name ${j}`, code: 'OF-5', elements: parseElements('c1p2s3') })) })) });
    const section = toSection(big);
    expect(section.link).toBe('https://rank.eurth.org/');
    expect(section.ranks).toHaveLength(200);
    expect(fromSection(section)).toEqual(big);
  });

  it('makes a ladder from a section that only has names', () => {
    const force = fromSection({ branches: ['Royal Navy', 'Sky Guard'], ranks: [{ name: 'Admiral', branch: 'Royal Navy', code: 'OF-9' }, { name: 'Deckhand', branch: 'Royal Navy' }, { name: 'Wing Lord', branch: 'Sky Guard', code: 'nonsense' }, { name: 'Stray', branch: 'Home Guard' }, 7, null] }, 'Teland')!;
    expect(force.nation).toBe('Teland');
    expect(force.branches.map((b) => [b.name, b.kind])).toEqual([['Royal Navy', 'navy'], ['Sky Guard', 'air'], ['Home Guard', 'army']]);
    expect(force.branches[0]!.ranks[0]).toMatchObject({ name: 'Admiral', code: 'OF-9', grade: 'officer', wear: 'sleeve' });
    expect(force.branches[0]!.ranks[0]!.elements.length).toBeGreaterThan(0);
    expect(force.branches[0]!.ranks[1]).toMatchObject({ name: 'Deckhand', code: '', elements: [] });
    expect(force.branches[1]!.ranks[0]).toMatchObject({ name: 'Wing Lord', code: '' });
    expect(kindFromName('Gendarmerie')).toBe('other');
  });

  it('reads nothing from nothing, and nothing from a design made by a later version', () => {
    for (const junk of [null, undefined, 'x', [], {}, { branches: [] }, { ranks: 'x' }]) expect(fromSection(junk)).toBeNull();
    expect(fromSection({ format: DESIGN_FORMAT + 1, design: packForce(aldermoor) })).toBeNull();
    expect(fromSection({ ranks: [{ name: 'Lone' }] })!.branches[0]).toMatchObject({ name: 'Armed forces', ranks: [{ name: 'Lone' }] });
  });
});

describe('the wiki table', () => {
  it('is complete for every template ladder: every rank a row, every row four cells', () => {
    for (const { id, force } of templates) {
      for (const branch of force.branches) {
        const where = `${id} ${branch.name}`;
        const table = ladderTable(force, branch);
        const lines = table.split('\n');
        expect(lines[0], where).toBe('{| class="wikitable" style="text-align:center"');
        expect(lines.at(-1), where).toBe('|}');
        expect(lines.filter((l) => l.startsWith('! scope="col"')), where).toHaveLength(4);
        const rows = lines.filter((l) => l.startsWith('| '));
        expect(rows, where).toHaveLength(branch.ranks.length);
        rows.forEach((row, i) => {
          // Rows come grouped by grade, which is also the ladder's own order in every template.
          const r = branch.ranks[i]!;
          const cells = row.slice(2).split(' || ');
          expect(cells, `${where} ${r.name}`).toHaveLength(4);
          expect(cells[0]).toBe(r.code);
          expect(cells[1]).toBe(`[[File:${fileName(force, branch, r)}|60px|alt=${wikiEscape(r.elements.length ? `${r.name}: ${describeElements(r)}` : `${r.name}: no insignia`)}]]`);
          expect(cells[2]).toBe(wikiEscape(r.name));
          expect(cells[3]).toBe(wikiEscape(r.abbr));
          for (const cell of cells) expect(cell.trim().length, `${where} ${r.name}`).toBeGreaterThan(0);
        });
        // Each grade that has ranks gets its heading, and every row is opened by a row mark.
        expect(lines.filter((l) => l === '|-'), where).toHaveLength(branch.ranks.length + new Set(branch.ranks.map((r) => r.grade)).size);
        expect(new Set(branch.ranks.map((r) => fileName(force, branch, r))).size, where).toBe(branch.ranks.length);
      }
      const page = toWikitext(force);
      expect(page.startsWith('== Ranks and insignia ==\n\n=== ')).toBe(true);
      expect(page.match(/^\{\|/gm)).toHaveLength(force.branches.length + 1);
      expect(page.match(/^\|\}$/gm)).toHaveLength(force.branches.length + 1);
    }
  });

  it('sets the branches side by side by code', () => {
    const table = comparisonTable(aldermoor).split('\n');
    expect(table[1]).toBe('|+ Ranks of Aldermoor compared');
    expect(table.slice(2, 6)).toEqual(['! scope="col" | NATO code', '! scope="col" | Army', '! scope="col" | Navy', '! scope="col" | Air Force']);
    const at = table.indexOf('! scope="row" | OF-1');
    expect(table.slice(at + 1, at + 4)).toEqual(['| Lieutenant<br>Second Lieutenant', '| Sub-Lieutenant', '| Flying Officer<br>Pilot Officer']);
    const or8 = table.indexOf('! scope="row" | OR-8');
    expect(table.slice(or8 + 1, or8 + 4)).toEqual(['| Warrant Officer Class Two', '| —', '| —']);
    expect(table).not.toContain('! scope="row" | OR-5');
    expect(toWikitext(cleanForce({ branches: [{ name: 'Army', kind: 'army' }] }))).not.toContain('Comparison');
  });

  it('lets nothing typed become wiki markup or break a file name', () => {
    expect(wikiEscape("[[x]] {{y}} | ''z'' = <!")).toBe('&#91;&#91;x&#93;&#93; &#123;&#123;y&#125;&#125; &#124; &#39;&#39;z&#39;&#39; &#61; &#60;&#33;');
    const force = cleanForce({ nation: 'A|B', branches: [{ name: 'Army [1]', kind: 'army', ranks: [{ name: "Chief {{Evil}} || ''x''", abbr: '=1', code: 'OF-5' }, { name: '' }] }] });
    const branch = force.branches[0]!;
    expect(fileName(force, branch, branch.ranks[0]!)).toBe('A B Army 1 OF-5 Chief Evil x.svg');
    expect(fileName(force, branch, branch.ranks[1]!)).toBe('A B Army 1 Unnamed rank.svg');
    const rows = ladderTable(force, branch).split('\n').filter((l) => l.startsWith('| '));
    expect(rows[0]!.split(' || ')).toHaveLength(4);
    expect(rows[0]).not.toContain('{{');
    expect(rows[0]).not.toContain("''");
    expect(rows[1]).toBe('| — || [[File:A B Army 1 Unnamed rank.svg|60px|alt=Unnamed rank: no insignia]] || Unnamed rank || —');
  });
});

describe('the CSV', () => {
  it('has a row a rank under one header', () => {
    const lines = toCsv(aldermoor).split('\r\n');
    expect(lines[0]).toBe(CSV_HEADER.join(','));
    expect(lines).toHaveLength(rankCount(aldermoor) + 2);
    expect(lines.at(-1)).toBe('');
    expect(lines).toContain('Army,OF-5,Officers,Colonel,Col,Shoulder board,a crown above two pips');
    expect(lines).toContain('Navy,OF-3,Officers,Lieutenant Commander,Lt Cdr,Sleeve,a ring with a curl above a bar above a ring');
    expect(lines).toContain('"Army,OR-6,Non-commissioned officers,Sergeant,Sgt,Sleeve,""three chevrons, points down"""'.slice(1, -1).replace(/""/g, '"'));
    expect(lines).toContain('Army,OR-2,Enlisted,Private,Pte,Sleeve,none');
  });

  it('quotes what needs quoting and disarms formulas', () => {
    expect(csvCell('plain')).toBe('plain');
    expect(csvCell('a, b')).toBe('"a, b"');
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
    expect(csvCell('=SUM(A1)')).toBe("'=SUM(A1)");
    expect(csvCell('+1')).toBe("'+1");
    expect(csvCell('-1')).toBe("'-1");
    expect(csvCell('@x')).toBe("'@x");
    expect(csvCell('Vice-Admiral')).toBe('Vice-Admiral');
  });
});

describe('the templates', () => {
  it('are whole: named, coded, in order, and free of anything the checks would flag', async () => {
    const { checkForce } = await import('../src/rank/validate');
    expect(templates.map((t) => t.id)).toEqual(['commonwealth', 'american', 'continental', 'eastern', 'small']);
    for (const { id, force, name, note } of templates) {
      expect(name.length).toBeGreaterThan(5);
      expect(note.length).toBeGreaterThan(40);
      expect(force.nation.length, id).toBeGreaterThan(3);
      expect(checkForce(force), id).toEqual([]);
      for (const branch of force.branches) {
        expect(branch.ranks.length, `${id} ${branch.name}`).toBeGreaterThanOrEqual(9);
        for (const r of branch.ranks) {
          expect(r.name && r.abbr && r.code, `${id} ${branch.name} ${r.name}`).toBeTruthy();
          expect(r.abbr.length, r.name).toBeLessThanOrEqual(12);
        }
        // Grades run officers, then non-commissioned, then enlisted, as the chart and the wiki table group them.
        const order = branch.ranks.map((r) => ['officer', 'nco', 'enlisted'].indexOf(r.grade));
        expect([...order].sort((a, b) => a - b), `${id} ${branch.name}`).toEqual(order);
      }
    }
    expect(templateById('nope')).toBeUndefined();
  });

  it('draw, every one', () => {
    for (const { id, force } of templates) {
      for (const branch of force.branches) {
        const chart = ladderChart(force, branch);
        expect(chart.svg.match(/<svg x=/g), `${id} ${branch.name}`).toHaveLength(branch.ranks.length);
        expect(chart.svg).not.toContain('NaN');
        expect(chart.svg).not.toContain('undefined');
      }
    }
  });
});
