/**
 * The NATO rank codes (STANAG 2116): a common scale that lets one force's ranks be read against
 * another's. OF is "officer", OR is "other ranks"; a higher number is a higher rank.
 *
 * The names beside each code are the usual English ones, not any one nation's: they are what a
 * new ladder starts from, and every one of them can be changed.
 */
import { codes, gradeOf, type BranchKind, type Code, type Element, type Grade, type Wear } from './model';
import { parseElements } from './codec';

export interface CodeInfo {
  code: Code;
  grade: Grade;
  /** What the level is, in a few words. */
  level: string;
  /** The usual name and abbreviation in an army, a navy and an air force. */
  army: [name: string, abbr: string];
  navy: [name: string, abbr: string];
  air: [name: string, abbr: string];
}

const row = (code: Code, level: string, army: [string, string], navy: [string, string], air: [string, string]): CodeInfo => ({ code, grade: gradeOf(code), level, army, navy, air });

export const nato: CodeInfo[] = [
  row('OF-10', 'The highest rank, often held only in wartime', ['Field marshal', 'FM'], ['Admiral of the fleet', 'AF'], ['Marshal of the air force', 'MAF']),
  row('OF-9', 'Commands a whole service or a theatre', ['General', 'Gen'], ['Admiral', 'Adm'], ['Air chief marshal', 'ACM']),
  row('OF-8', 'Commands a corps or a fleet', ['Lieutenant general', 'Lt Gen'], ['Vice admiral', 'VAdm'], ['Air marshal', 'AM']),
  row('OF-7', 'Commands a division', ['Major general', 'Maj Gen'], ['Rear admiral', 'RAdm'], ['Air vice-marshal', 'AVM']),
  row('OF-6', 'Commands a brigade or a squadron of ships', ['Brigadier', 'Brig'], ['Commodore', 'Cdre'], ['Air commodore', 'Air Cdre']),
  row('OF-5', 'Commands a regiment, a large ship or an air base', ['Colonel', 'Col'], ['Captain', 'Capt'], ['Group captain', 'Gp Capt']),
  row('OF-4', 'Commands a battalion, a ship or a wing', ['Lieutenant colonel', 'Lt Col'], ['Commander', 'Cdr'], ['Wing commander', 'Wg Cdr']),
  row('OF-3', 'Second in command of a battalion; commands a small ship or a squadron', ['Major', 'Maj'], ['Lieutenant commander', 'Lt Cdr'], ['Squadron leader', 'Sqn Ldr']),
  row('OF-2', 'Commands a company or a flight', ['Captain', 'Capt'], ['Lieutenant', 'Lt'], ['Flight lieutenant', 'Flt Lt']),
  row('OF-1', 'The first commissioned rank: leads a platoon', ['Lieutenant', 'Lt'], ['Sub-lieutenant', 'SLt'], ['Flying officer', 'Fg Off']),
  row('OR-9', 'The senior enlisted adviser of a unit', ['Sergeant major', 'SM'], ['Master chief petty officer', 'MCPO'], ['Chief master sergeant', 'CMSgt']),
  row('OR-8', 'Senior non-commissioned officer of a company', ['Master sergeant', 'MSgt'], ['Senior chief petty officer', 'SCPO'], ['Senior master sergeant', 'SMSgt']),
  row('OR-7', 'Second to a platoon’s officer', ['Sergeant first class', 'SFC'], ['Chief petty officer', 'CPO'], ['Master sergeant', 'MSgt']),
  row('OR-6', 'Leads a section and trains its soldiers', ['Staff sergeant', 'SSgt'], ['Petty officer first class', 'PO1'], ['Technical sergeant', 'TSgt']),
  row('OR-5', 'Leads a squad', ['Sergeant', 'Sgt'], ['Petty officer second class', 'PO2'], ['Staff sergeant', 'SSgt']),
  row('OR-4', 'Leads a small team', ['Corporal', 'Cpl'], ['Petty officer third class', 'PO3'], ['Senior airman', 'SrA']),
  row('OR-3', 'A trained and trusted soldier', ['Private first class', 'PFC'], ['Seaman', 'SN'], ['Airman first class', 'A1C']),
  row('OR-2', 'A trained soldier', ['Private', 'Pte'], ['Seaman apprentice', 'SA'], ['Airman', 'Amn']),
  row('OR-1', 'A recruit in training', ['Recruit', 'Rct'], ['Seaman recruit', 'SR'], ['Airman basic', 'AB']),
];

export const codeInfo = (code: Code): CodeInfo => nato[codes.indexOf(code)]!;

/** The usual name and abbreviation for a code in a branch of this kind. Other branches take the army's. */
export const usualName = (kind: BranchKind, code: Code): [name: string, abbr: string] => codeInfo(code)[kind === 'other' ? 'army' : kind];

// An insignia for every code, so a new rank never starts bare. Officers wear theirs on the
// shoulder (the navy on the sleeve, in rings); the rest wear chevrons on the sleeve.
const landOfficers: Record<string, string> = { 'OF-10': 'w1s5', 'OF-9': 's4', 'OF-8': 's3', 'OF-7': 's2', 'OF-6': 's1', 'OF-5': 'c1p2', 'OF-4': 'c1p1', 'OF-3': 'c1', 'OF-2': 'p3', 'OF-1': 'p2' };
const seaOfficers: Record<string, string> = { 'OF-10': 'r4C rW1', 'OF-9': 'r3C rW1', 'OF-8': 'r2C rW1', 'OF-7': 'r1C rW1', 'OF-6': 'rW1C', 'OF-5': 'r4C', 'OF-4': 'r3C', 'OF-3': 'r1C b1 r1', 'OF-2': 'r2C', 'OF-1': 'r1C' };
const others: Record<string, string> = { 'OR-9': 'v3s1k3', 'OR-8': 'v3k3', 'OR-7': 'v3k2', 'OR-6': 'v3k1', 'OR-5': 'v3', 'OR-4': 'v2', 'OR-3': 'v1k1', 'OR-2': 'v1', 'OR-1': '' };

/** Where a rank of this code is usually worn, and what it carries. */
export function usualInsignia(kind: BranchKind, code: Code | ''): { wear: Wear; elements: Element[] } {
  if (code === '') return { wear: 'sleeve', elements: [] };
  if (code.startsWith('OF')) {
    return kind === 'navy' ? { wear: 'sleeve', elements: parseElements(seaOfficers[code] ?? '') } : { wear: 'shoulder', elements: parseElements(landOfficers[code] ?? '') };
  }
  const text = others[code] ?? '';
  return { wear: 'sleeve', elements: parseElements(kind === 'navy' ? text.replace(/v(\d)/g, 'v$1D') : text) };
}
