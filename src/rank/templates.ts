/**
 * Ready-made ladders to start from. Each follows a pattern real forces use, so it feels right,
 * but the nations are invented and every device is our own drawing: nothing here copies a real
 * nation's insignia line for line.
 *
 * A row is a rank: its NATO code, name, abbreviation, where it is worn (s for shoulder, l for
 * sleeve, c for collar) and its elements in the short form codec.ts reads ("c1p2": a crown above
 * two pips).
 */
import { parseElements } from './codec';
import { cleanForce, type BranchKind, type Code, type Force, type Metal, type Wear } from './model';

type Row = [code: Code | '', name: string, abbr: string, wear: 's' | 'l' | 'c', design: string];

const wearOf: Record<Row[3], Wear> = { s: 'shoulder', l: 'sleeve', c: 'collar' };

const branch = (name: string, kind: BranchKind, cloth: string, metal: Metal, piping: string, rows: Row[]) => ({
  name,
  kind,
  cloth,
  metal,
  piping,
  ranks: rows.map(([code, rankName, abbr, wear, design]) => ({ code, name: rankName, abbr, wear: wearOf[wear], elements: parseElements(design) })),
});

export interface Template {
  id: string;
  /** The pattern it follows: "Commonwealth pattern". */
  name: string;
  /** What marks the pattern out, in a sentence. */
  note: string;
  force: Force;
}

// Crowns and pips on the shoulder, chevrons point down, rings on a sailor's sleeve.
const aldermoor = cleanForce({
  nation: 'Aldermoor',
  branches: [
    branch('Army', 'army', '#4b5320', 'gold', '', [
      ['OF-10', 'Field Marshal', 'FM', 's', 'c1w1'],
      ['OF-9', 'General', 'Gen', 's', 'c1p1e1'],
      ['OF-8', 'Lieutenant General', 'Lt Gen', 's', 'c1e1'],
      ['OF-7', 'Major General', 'Maj Gen', 's', 'p1e1'],
      ['OF-6', 'Brigadier', 'Brig', 's', 'c1p3'],
      ['OF-5', 'Colonel', 'Col', 's', 'c1p2'],
      ['OF-4', 'Lieutenant Colonel', 'Lt Col', 's', 'c1p1'],
      ['OF-3', 'Major', 'Maj', 's', 'c1'],
      ['OF-2', 'Captain', 'Capt', 's', 'p3'],
      ['OF-1', 'Lieutenant', 'Lt', 's', 'p2'],
      ['OF-1', 'Second Lieutenant', '2Lt', 's', 'p1'],
      ['OR-9', 'Warrant Officer Class One', 'WO1', 'l', 'e1'],
      ['OR-8', 'Warrant Officer Class Two', 'WO2', 'l', 'c1'],
      ['OR-7', 'Staff Sergeant', 'SSgt', 'l', 'c1v3D'],
      ['OR-6', 'Sergeant', 'Sgt', 'l', 'v3D'],
      ['OR-4', 'Corporal', 'Cpl', 'l', 'v2D'],
      ['OR-3', 'Lance Corporal', 'LCpl', 'l', 'v1D'],
      ['OR-2', 'Private', 'Pte', 'l', ''],
    ]),
    branch('Navy', 'navy', '#14213d', 'gold', '', [
      ['OF-10', 'Admiral of the Fleet', 'AF', 'l', 'r4C rW1'],
      ['OF-9', 'Admiral', 'Adm', 'l', 'r3C rW1'],
      ['OF-8', 'Vice Admiral', 'VAdm', 'l', 'r2C rW1'],
      ['OF-7', 'Rear Admiral', 'RAdm', 'l', 'r1C rW1'],
      ['OF-6', 'Commodore', 'Cdre', 'l', 'rW1C'],
      ['OF-5', 'Captain', 'Capt', 'l', 'r4C'],
      ['OF-4', 'Commander', 'Cdr', 'l', 'r3C'],
      ['OF-3', 'Lieutenant Commander', 'Lt Cdr', 'l', 'r1C b1 r1'],
      ['OF-2', 'Lieutenant', 'Lt', 'l', 'r2C'],
      ['OF-1', 'Sub-Lieutenant', 'SLt', 'l', 'r1C'],
      ['OR-9', 'Warrant Officer', 'WO', 'l', 'c1w1'],
      ['OR-7', 'Chief Petty Officer', 'CPO', 'l', 'p3'],
      ['OR-6', 'Petty Officer', 'PO', 'l', 'c1e1'],
      ['OR-4', 'Leading Hand', 'LH', 'l', 'e1'],
      ['OR-2', 'Able Seaman', 'AB', 'l', ''],
    ]),
    branch('Air Force', 'air', '#3d5a80', 'silver', '', [
      ['OF-10', 'Marshal of the Air Force', 'MAF', 'l', 'r4 rW1'],
      ['OF-9', 'Air Chief Marshal', 'ACM', 'l', 'r3 rW1'],
      ['OF-8', 'Air Marshal', 'AM', 'l', 'r2 rW1'],
      ['OF-7', 'Air Vice-Marshal', 'AVM', 'l', 'r1 rW1'],
      ['OF-6', 'Air Commodore', 'Air Cdre', 'l', 'rW1'],
      ['OF-5', 'Group Captain', 'Gp Capt', 'l', 'r4'],
      ['OF-4', 'Wing Commander', 'Wg Cdr', 'l', 'r3'],
      ['OF-3', 'Squadron Leader', 'Sqn Ldr', 'l', 'r1 b1 r1'],
      ['OF-2', 'Flight Lieutenant', 'Flt Lt', 'l', 'r2'],
      ['OF-1', 'Flying Officer', 'Fg Off', 'l', 'r1'],
      ['OF-1', 'Pilot Officer', 'Plt Off', 'l', 'b1'],
      ['OR-9', 'Warrant Officer', 'WO', 'l', 'e1'],
      ['OR-7', 'Flight Sergeant', 'FS', 'l', 'c1v3D'],
      ['OR-6', 'Sergeant', 'Sgt', 'l', 'v3D'],
      ['OR-4', 'Corporal', 'Cpl', 'l', 'v2D'],
      ['OR-2', 'Aircraftman', 'AC', 'l', ''],
    ]),
  ],
});

// Bars, a leaf and an eagle (here a wreath and the national emblem), then stars; chevrons point up over rockers.
const calloway = cleanForce({
  nation: 'Calloway',
  branches: [
    branch('Army', 'army', '#1d2b1f', 'silver', '', [
      ['OF-10', 'General of the Army', 'GA', 's', 's5'],
      ['OF-9', 'General', 'GEN', 's', 's4'],
      ['OF-8', 'Lieutenant General', 'LTG', 's', 's3'],
      ['OF-7', 'Major General', 'MG', 's', 's2'],
      ['OF-6', 'Brigadier General', 'BG', 's', 's1'],
      ['OF-5', 'Colonel', 'COL', 's', 'e1'],
      ['OF-4', 'Lieutenant Colonel', 'LTC', 's', 'w1p1'],
      ['OF-3', 'Major', 'MAJ', 's', 'w1'],
      ['OF-2', 'Captain', 'CPT', 's', 'b2'],
      ['OF-1', 'First Lieutenant', '1LT', 's', 'bW1'],
      ['OF-1', 'Second Lieutenant', '2LT', 's', 'b1'],
      ['OR-9', 'Sergeant Major', 'SGM', 'l', 'v3s1k3'],
      ['OR-8', 'Master Sergeant', 'MSG', 'l', 'v3k3'],
      ['OR-7', 'Sergeant First Class', 'SFC', 'l', 'v3k2'],
      ['OR-6', 'Staff Sergeant', 'SSG', 'l', 'v3k1'],
      ['OR-5', 'Sergeant', 'SGT', 'l', 'v3'],
      ['OR-4', 'Corporal', 'CPL', 'l', 'v2'],
      ['OR-3', 'Private First Class', 'PFC', 'l', 'v1k1'],
      ['OR-2', 'Private', 'PV2', 'l', 'v1'],
      ['OR-1', 'Recruit', 'PVT', 'l', ''],
    ]),
    branch('Navy', 'navy', '#16181a', 'gold', '', [
      ['OF-10', 'Fleet Admiral', 'FADM', 'l', 's1 r4 rW1'],
      ['OF-9', 'Admiral', 'ADM', 'l', 's1 r3 rW1'],
      ['OF-8', 'Vice Admiral', 'VADM', 'l', 's1 r2 rW1'],
      ['OF-7', 'Rear Admiral', 'RADM', 'l', 's1 r1 rW1'],
      ['OF-6', 'Commodore', 'CDRE', 'l', 's1 rW1'],
      ['OF-5', 'Captain', 'CAPT', 'l', 's1 r4'],
      ['OF-4', 'Commander', 'CDR', 'l', 's1 r3'],
      ['OF-3', 'Lieutenant Commander', 'LCDR', 'l', 's1 r1 b1 r1'],
      ['OF-2', 'Lieutenant', 'LT', 'l', 's1 r2'],
      ['OF-1', 'Lieutenant Junior Grade', 'LTJG', 'l', 's1 r1 b1'],
      ['OF-1', 'Ensign', 'ENS', 'l', 's1 r1'],
      ['OR-9', 'Master Chief Petty Officer', 'MCPO', 'l', 's3 e1 v3D'],
      ['OR-8', 'Senior Chief Petty Officer', 'SCPO', 'l', 's2 e1 v3D'],
      ['OR-7', 'Chief Petty Officer', 'CPO', 'l', 's1 e1 v3D'],
      ['OR-6', 'Petty Officer First Class', 'PO1', 'l', 'e1 v3D'],
      ['OR-5', 'Petty Officer Second Class', 'PO2', 'l', 'e1 v2D'],
      ['OR-4', 'Petty Officer Third Class', 'PO3', 'l', 'e1 v1D'],
      ['OR-3', 'Seaman', 'SN', 'l', 'b3'],
      ['OR-2', 'Seaman Apprentice', 'SA', 'l', 'b2'],
      ['OR-1', 'Seaman Recruit', 'SR', 'l', ''],
    ]),
    branch('Air Force', 'air', '#3d5a80', 'silver', '', [
      ['OF-10', 'General of the Air Force', 'GAF', 's', 's5'],
      ['OF-9', 'General', 'Gen', 's', 's4'],
      ['OF-8', 'Lieutenant General', 'Lt Gen', 's', 's3'],
      ['OF-7', 'Major General', 'Maj Gen', 's', 's2'],
      ['OF-6', 'Brigadier General', 'Brig Gen', 's', 's1'],
      ['OF-5', 'Colonel', 'Col', 's', 'e1'],
      ['OF-4', 'Lieutenant Colonel', 'Lt Col', 's', 'w1p1'],
      ['OF-3', 'Major', 'Maj', 's', 'w1'],
      ['OF-2', 'Captain', 'Capt', 's', 'b2'],
      ['OF-1', 'First Lieutenant', '1st Lt', 's', 'bW1'],
      ['OF-1', 'Second Lieutenant', '2d Lt', 's', 'b1'],
      ['OR-9', 'Chief Master Sergeant', 'CMSgt', 'l', 'v3 s1 v4D'],
      ['OR-8', 'Senior Master Sergeant', 'SMSgt', 'l', 'v2 s1 v4D'],
      ['OR-7', 'Master Sergeant', 'MSgt', 'l', 'v1 s1 v4D'],
      ['OR-6', 'Technical Sergeant', 'TSgt', 'l', 's1 v4D'],
      ['OR-5', 'Staff Sergeant', 'SSgt', 'l', 's1 v3D'],
      ['OR-4', 'Senior Airman', 'SrA', 'l', 's1 v2D'],
      ['OR-3', 'Airman First Class', 'A1C', 'l', 's1 v1D'],
      ['OR-2', 'Airman', 'Amn', 'l', 's1'],
      ['OR-1', 'Airman Basic', 'AB', 'l', ''],
    ]),
  ],
});

// Stars over a wreath on braided shoulder boards; an air force that wears its rank on the collar.
const veldmark = cleanForce({
  nation: 'Veldmark',
  branches: [
    branch('Army', 'army', '#5d6660', 'silver', '#9b1c1c', [
      ['OF-9', 'General', 'Gen', 's', 's4w1bW1'],
      ['OF-8', 'Lieutenant General', 'LtGen', 's', 's3w1bW1'],
      ['OF-7', 'Major General', 'MajGen', 's', 's2w1bW1'],
      ['OF-6', 'Brigadier General', 'BrigGen', 's', 's1w1bW1'],
      ['OF-5', 'Colonel', 'Col', 's', 's3w1'],
      ['OF-4', 'Lieutenant Colonel', 'LtCol', 's', 's2w1'],
      ['OF-3', 'Major', 'Maj', 's', 's1w1'],
      ['OF-2', 'Captain', 'Capt', 's', 's3'],
      ['OF-1', 'First Lieutenant', '1Lt', 's', 's2'],
      ['OF-1', 'Lieutenant', 'Lt', 's', 's1'],
      ['OR-9', 'Chief Warrant Officer', 'CWO', 's', 'p1v3bW1'],
      ['OR-8', 'Warrant Officer', 'WO', 's', 'v3bW1'],
      ['OR-7', 'Sergeant Major', 'SgtMaj', 's', 'v2bW1'],
      ['OR-6', 'Staff Sergeant', 'SSgt', 's', 'v1bW1'],
      ['OR-5', 'Sergeant', 'Sgt', 's', 'bW1'],
      ['OR-4', 'Senior Corporal', 'SCpl', 's', 'b3'],
      ['OR-3', 'Corporal', 'Cpl', 's', 'b2'],
      ['OR-2', 'Private First Class', 'PFC', 's', 'b1'],
      ['OR-1', 'Private', 'Pvt', 's', ''],
    ]),
    branch('Navy', 'navy', '#14213d', 'gold', '', [
      ['OF-9', 'Admiral', 'Adm', 's', 's1 r3 rW1'],
      ['OF-8', 'Vice Admiral', 'VAdm', 's', 's1 r2 rW1'],
      ['OF-7', 'Rear Admiral', 'RAdm', 's', 's1 r1 rW1'],
      ['OF-6', 'Flotilla Admiral', 'FltAdm', 's', 's1 rW1'],
      ['OF-5', 'Captain', 'Capt', 's', 's1 r4'],
      ['OF-4', 'Frigate Captain', 'FrgCapt', 's', 's1 r3'],
      ['OF-3', 'Corvette Captain', 'CrvCapt', 's', 's1 r1 b1 r1'],
      ['OF-2', 'Lieutenant Captain', 'LtCapt', 's', 's1 r2'],
      ['OF-1', 'Lieutenant', 'Lt', 's', 's1 r1'],
      ['OR-8', 'Chief Boatswain', 'ChBtsn', 'l', 'e1 v3'],
      ['OR-6', 'Boatswain', 'Btsn', 'l', 'e1 v2'],
      ['OR-5', 'Mate', 'Mate', 'l', 'e1 v1'],
      ['OR-4', 'Leading Seaman', 'LdgSmn', 'l', 'b3'],
      ['OR-3', 'Able Seaman', 'AbSmn', 'l', 'b2'],
      ['OR-2', 'Seaman', 'Smn', 'l', 'b1'],
      ['OR-1', 'Recruit', 'Rct', 'l', ''],
    ]),
    branch('Air Force', 'air', '#3d5a80', 'silver', '#e8c46a', [
      ['OF-9', 'General', 'Gen', 'c', 'w1s4'],
      ['OF-8', 'Lieutenant General', 'LtGen', 'c', 'w1s3'],
      ['OF-7', 'Major General', 'MajGen', 'c', 'w1s2'],
      ['OF-6', 'Brigadier General', 'BrigGen', 'c', 'w1s1'],
      ['OF-5', 'Colonel', 'Col', 'c', 'w1p3'],
      ['OF-4', 'Lieutenant Colonel', 'LtCol', 'c', 'w1p2'],
      ['OF-3', 'Major', 'Maj', 'c', 'w1p1'],
      ['OF-2', 'Captain', 'Capt', 'c', 'p3'],
      ['OF-1', 'First Lieutenant', '1Lt', 'c', 'p2'],
      ['OF-1', 'Lieutenant', 'Lt', 'c', 'p1'],
      ['OR-9', 'Chief Master Sergeant', 'CMSgt', 'c', 'b1p4'],
      ['OR-7', 'Master Sergeant', 'MSgt', 'c', 'b1p3'],
      ['OR-6', 'Staff Sergeant', 'SSgt', 'c', 'b1p2'],
      ['OR-5', 'Sergeant', 'Sgt', 'c', 'b1p1'],
      ['OR-4', 'Corporal', 'Cpl', 'c', 'b3'],
      ['OR-3', 'Senior Airman', 'SrAmn', 'c', 'b2'],
      ['OR-2', 'Airman', 'Amn', 'c', 'b1'],
      ['OR-1', 'Recruit', 'Rct', 'c', ''],
    ]),
  ],
});

// Everything on the shoulder board: stripes across it for the grade, stars for the rank.
const eastern = (land: boolean): Row[] => [
  ['OF-9', land ? 'Army General' : 'General of Aviation', land ? 'ArmGen' : 'GenAv', 's', 's4'],
  ['OF-8', 'Colonel General', 'ColGen', 's', 's3'],
  ['OF-7', 'Lieutenant General', 'LtGen', 's', 's2'],
  ['OF-6', 'Major General', 'MajGen', 's', 's1'],
  ['OF-5', 'Colonel', 'Col', 's', 's3b2'],
  ['OF-4', 'Lieutenant Colonel', 'LtCol', 's', 's2b2'],
  ['OF-3', 'Major', 'Maj', 's', 's1b2'],
  ['OF-2', 'Captain', 'Capt', 's', 's4b1'],
  ['OF-1', 'Senior Lieutenant', 'SrLt', 's', 's3b1'],
  ['OF-1', 'Lieutenant', 'Lt', 's', 's2b1'],
  ['OF-1', 'Junior Lieutenant', 'JrLt', 's', 's1b1'],
  ['OR-9', 'Senior Warrant Officer', 'SrWO', 's', 'p3'],
  ['OR-8', 'Warrant Officer', 'WO', 's', 'p2'],
  ['OR-7', 'Master Sergeant', 'MSgt', 's', 'bW2'],
  ['OR-6', 'Senior Sergeant', 'SrSgt', 's', 'bW1'],
  ['OR-5', 'Sergeant', 'Sgt', 's', 'b3'],
  ['OR-4', 'Junior Sergeant', 'JrSgt', 's', 'b2'],
  ['OR-3', 'Lance Corporal', 'LCpl', 's', 'b1'],
  ['OR-1', 'Private', 'Pvt', 's', ''],
];

const korsava = cleanForce({
  nation: 'Korsava',
  branches: [
    branch('Ground Forces', 'army', '#4b5320', 'gold', '#9b1c1c', [['OF-10', 'Marshal', 'Mshl', 's', 's1e1'], ...eastern(true)]),
    branch('Navy', 'navy', '#16181a', 'gold', '', [
      ['OF-9', 'Admiral of the Fleet', 'AdmFlt', 's', 's1e1'],
      ['OF-8', 'Admiral', 'Adm', 's', 's3'],
      ['OF-7', 'Vice Admiral', 'VAdm', 's', 's2'],
      ['OF-6', 'Rear Admiral', 'RAdm', 's', 's1'],
      ['OF-5', 'Captain First Rank', 'Capt1', 's', 's3b2'],
      ['OF-4', 'Captain Second Rank', 'Capt2', 's', 's2b2'],
      ['OF-3', 'Captain Third Rank', 'Capt3', 's', 's1b2'],
      ['OF-2', 'Captain Lieutenant', 'CaptLt', 's', 's4b1'],
      ['OF-1', 'Senior Lieutenant', 'SrLt', 's', 's3b1'],
      ['OF-1', 'Lieutenant', 'Lt', 's', 's2b1'],
      ['OR-8', 'Midshipman', 'Mid', 's', 'p2'],
      ['OR-7', 'Chief Ship Petty Officer', 'ChShPO', 's', 'bW2'],
      ['OR-6', 'Chief Petty Officer', 'ChPO', 's', 'bW1'],
      ['OR-5', 'Petty Officer First Class', 'PO1', 's', 'b3'],
      ['OR-4', 'Petty Officer Second Class', 'PO2', 's', 'b2'],
      ['OR-3', 'Senior Seaman', 'SrSmn', 's', 'b1'],
      ['OR-1', 'Seaman', 'Smn', 's', ''],
    ]),
    branch('Air Force', 'air', '#3d5a80', 'gold', '#8fb4d6', [['OF-10', 'Marshal of Aviation', 'MshlAv', 's', 's1e1'], ...eastern(false)]),
  ],
});

// Two branches that aren't an army, a navy or an air force: a coast guard in white and a gendarmerie in braid.
const sanctuary = cleanForce({
  nation: 'Sanctuary Bay',
  branches: [
    branch('Coast Guard', 'navy', '#f2f2ee', 'gold', '#14213d', [
      ['OF-6', 'Commodore', 'Cdre', 's', 'e1 rW1'],
      ['OF-5', 'Captain', 'Capt', 's', 'e1 r4'],
      ['OF-4', 'Commander', 'Cdr', 's', 'e1 r3'],
      ['OF-2', 'Lieutenant', 'Lt', 's', 'e1 r2'],
      ['OF-1', 'Ensign', 'Ens', 's', 'e1 r1'],
      ['OR-7', 'Chief Petty Officer', 'CPO', 'l', 'e1 v3D'],
      ['OR-5', 'Petty Officer', 'PO', 'l', 'e1 v2D'],
      ['OR-3', 'Leading Seaman', 'LS', 'l', 'v1D'],
      ['OR-1', 'Seaman', 'Smn', 'l', ''],
    ]),
    branch('Gendarmerie', 'other', '#14213d', 'silver', '#9b1c1c', [
      ['OF-6', 'Inspector General', 'InspGen', 's', 's2w1'],
      ['OF-5', 'Colonel', 'Col', 's', 'bW1b2'],
      ['OF-3', 'Commandant', 'Cdt', 's', 'bW1b1'],
      ['OF-2', 'Captain', 'Capt', 's', 'b3'],
      ['OF-1', 'Lieutenant', 'Lt', 's', 'b2'],
      ['OF-1', 'Sub-Lieutenant', 'SLt', 's', 'b1'],
      ['OR-8', 'Adjutant', 'Adj', 's', 'bW1'],
      ['OR-6', 'Chief Sergeant', 'ChSgt', 'l', 'v3'],
      ['OR-5', 'Sergeant', 'Sgt', 'l', 'v2'],
      ['OR-2', 'Gendarme', 'Gend', 'l', 'v1'],
    ]),
  ],
});

/** The ladders on the Templates page, in the order they are shown. */
export const templates: Template[] = [
  { id: 'commonwealth', name: 'Commonwealth pattern', note: 'Crowns and pips on the shoulder, chevrons that point down, and gold rings with a curl on a naval officer’s sleeve.', force: aldermoor },
  { id: 'american', name: 'American pattern', note: 'Bars, then a leaf and an eagle (here a wreath and the national emblem), then stars; chevrons point up, with rockers beneath.', force: calloway },
  { id: 'continental', name: 'Continental pattern', note: 'Stars above a wreath on braided shoulder boards, and an air force that wears its rank on the collar.', force: veldmark },
  { id: 'eastern', name: 'Eastern pattern', note: 'Everything on the shoulder board: stripes across it for the grade, stars for the rank, and one big star for a marshal.', force: korsava },
  { id: 'small', name: 'A coast guard and a gendarmerie', note: 'Two branches that are neither army, navy nor air force, for a small state that needs neither tanks nor carriers.', force: sanctuary },
];

export const templateById = (id: string): Template | undefined => templates.find((template) => template.id === id);
