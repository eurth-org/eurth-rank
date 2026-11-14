/**
 * The ladders as CSV, a row a rank, for spreadsheets. Cells are quoted as RFC 4180 asks, and a
 * cell that a spreadsheet would run as a formula (it starts with =, +, - or @) is given a
 * leading apostrophe, so a rank's name can never become a calculation.
 */
import { describeElements } from './describe';
import { gradeNames, wearNames, type Force } from './model';

export const CSV_HEADER = ['Branch', 'NATO code', 'Grade', 'Rank', 'Abbreviation', 'Worn on', 'Insignia'] as const;

export function csvCell(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export function toCsv(force: Force): string {
  const rows: string[][] = [[...CSV_HEADER]];
  for (const branch of force.branches) {
    for (const rank of branch.ranks) {
      rows.push([branch.name, rank.code, gradeNames[rank.grade], rank.name, rank.abbr, wearNames[rank.wear], rank.elements.length ? describeElements(rank) : 'none']);
    }
  }
  return `${rows.map((row) => row.map(csvCell).join(',')).join('\r\n')}\r\n`;
}
