/**
 * The guide's figures. Each is a handful of ranks picked from the templates, shown side by side
 * to make one point. The guide draws them from here, and tests/content.test.ts checks every one
 * resolves to a real rank, so the page can never show something the tool doesn't draw.
 */
import type { Branch, Force, Rank } from '../rank/model';
import { templateById } from '../rank/templates';

export interface Figure {
  id: string;
  /** What the figure shows, as the guide puts it. */
  caption: string;
  /** Where each rank comes from: a template, a branch by name, and the ranks by name, in order. */
  from: { template: string; branch: string; ranks: string[] }[];
}

export const figures: Figure[] = [
  {
    id: 'more',
    caption: 'More of the same thing: one, two and three pips for a second lieutenant, a lieutenant and a captain.',
    from: [{ template: 'commonwealth', branch: 'Army', ranks: ['Second Lieutenant', 'Lieutenant', 'Captain'] }],
  },
  {
    id: 'better',
    caption: 'A better thing: a captain’s three pips give way to a major’s single crown, and then the pips begin again beneath it.',
    from: [{ template: 'commonwealth', branch: 'Army', ranks: ['Captain', 'Major', 'Lieutenant Colonel', 'Colonel'] }],
  },
  {
    id: 'ladder-of-devices',
    caption: 'A ladder of devices in the American pattern: bars for company officers, a wreath and the emblem for field officers, stars for generals.',
    from: [{ template: 'american', branch: 'Army', ranks: ['Second Lieutenant', 'Captain', 'Major', 'Colonel', 'Brigadier General', 'General'] }],
  },
  {
    id: 'wider',
    caption: 'Wider: a naval captain’s four rings, then the broad ring that marks every admiral.',
    from: [{ template: 'commonwealth', branch: 'Navy', ranks: ['Lieutenant', 'Commander', 'Captain', 'Commodore', 'Vice Admiral'] }],
  },
  {
    id: 'chevrons',
    caption: 'Chevrons count upwards for the other ranks, and a rocker beneath marks each step among the senior sergeants.',
    from: [{ template: 'american', branch: 'Army', ranks: ['Private', 'Corporal', 'Sergeant', 'Staff Sergeant', 'Master Sergeant', 'Sergeant Major'] }],
  },
  {
    id: 'grade-and-rank',
    caption: 'The Eastern pattern splits the job in two: the stripes say which grade, the stars say which rank within it.',
    from: [{ template: 'eastern', branch: 'Ground Forces', ranks: ['Lieutenant', 'Captain', 'Major', 'Colonel', 'Major General'] }],
  },
  {
    id: 'captains',
    caption: 'Two captains who are not equals: the army’s is an OF-2 and commands a company; the navy’s is an OF-5 and commands a ship.',
    from: [
      { template: 'commonwealth', branch: 'Army', ranks: ['Captain'] },
      { template: 'commonwealth', branch: 'Navy', ranks: ['Captain'] },
    ],
  },
  {
    id: 'collar',
    caption: 'Rank on the collar: pips in a row, with a wreath for the field officers.',
    from: [{ template: 'continental', branch: 'Air Force', ranks: ['Lieutenant', 'Captain', 'Major', 'Colonel'] }],
  },
];

export interface Shown {
  force: Force;
  branch: Branch;
  rank: Rank;
}

/** The ranks a figure shows. Throws when a name doesn't resolve, so a typo fails the build. */
export function figureRanks(figure: Figure): Shown[] {
  return figure.from.flatMap(({ template, branch: branchName, ranks }) => {
    const force = templateById(template)?.force;
    const branch = force?.branches.find((b) => b.name === branchName);
    if (!force || !branch) throw new Error(`Figure "${figure.id}": no ${branchName} in ${template}`);
    return ranks.map((name) => {
      const rank = branch.ranks.find((r) => r.name === name);
      if (!rank) throw new Error(`Figure "${figure.id}": no rank called ${name} in ${branchName}`);
      return { force, branch, rank };
    });
  });
}

export const figureById = (id: string): Figure => {
  const found = figures.find((figure) => figure.id === id);
  if (!found) throw new Error(`No figure called "${id}"`);
  return found;
};
