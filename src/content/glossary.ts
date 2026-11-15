/**
 * The glossary: the words of ranks and insignia, a sentence or two each. The glossary page shows
 * them and gives the set to search engines; the guide links to them by id.
 */
export interface Term {
  id: string;
  term: string;
  definition: string;
  /** Related terms, by id. */
  see?: string[];
}

export const glossary: Term[] = [
  { id: 'acting-rank', term: 'Acting rank', definition: 'A rank held for as long as a job needs it, and given up afterwards. The holder wears the insignia but keeps the pay and seniority of the rank beneath, or gains them only for the time being.', see: ['substantive-rank', 'brevet'] },
  { id: 'aiguillette', term: 'Aiguillette', definition: 'A braided cord looped from the shoulder and ending in metal tags. It marks an aide or an appointment, not a rank.', see: ['appointment'] },
  { id: 'appointment', term: 'Appointment', definition: 'A job, as distinct from a rank. A regimental sergeant major is an appointment held by a warrant officer; a commodore was for centuries an appointment held by a captain.', see: ['rank'] },
  { id: 'arm-of-service-colour', term: 'Arm-of-service colour', definition: 'A colour that says which corps someone belongs to: red for artillery, say, or green for rifles. It usually appears as piping or as the ground of a collar patch, and leaves the rank to the devices.', see: ['piping', 'collar-patch'] },
  { id: 'bar', term: 'Bar', definition: 'A straight stripe. On a shoulder board it runs across; as a metal device it is a junior officer’s mark in the American pattern.', see: ['sleeve-ring', 'lace'] },
  { id: 'branch', term: 'Branch', definition: 'One of the services that make up the armed forces: an army, a navy, an air force, and whatever else the nation keeps, from marines to a space force. Each has a ladder of its own.', see: ['ladder'] },
  { id: 'brevet', term: 'Brevet', definition: 'A higher rank given as an honour, without the pay or the command that would normally go with it.', see: ['acting-rank'] },
  { id: 'chevron', term: 'Chevron', definition: 'A V-shaped stripe, the usual mark of corporals and sergeants. British chevrons point down; American ones have pointed up since 1902. More chevrons mean more rank.', see: ['rocker', 'non-commissioned-officer'] },
  { id: 'cloth', term: 'Cloth', definition: 'In this tool, the colour of the board, sleeve or patch an insignia is worn on. It usually matches the uniform.', see: ['metal'] },
  { id: 'collar-patch', term: 'Collar patch', definition: 'A piece of cloth on the collar that carries rank, the arm of service, or both. Also called a gorget patch.', see: ['gorget', 'arm-of-service-colour'] },
  { id: 'commission', term: 'Commission', definition: 'The document by which a head of state gives an officer authority to command. Holding one is what separates an officer from everyone else.', see: ['commissioned-officer', 'warrant-officer'] },
  { id: 'commissioned-officer', term: 'Commissioned officer', definition: 'Someone who holds a commission: from the most junior lieutenant to the field marshal. The NATO codes OF-1 to OF-10.', see: ['commission', 'nato-code'] },
  { id: 'crown', term: 'Crown', definition: 'In monarchies, a device that marks field officers and above: a major wears a crown where a captain wears pips. Republics replace it with a star, a wreath or the state emblem.', see: ['pip', 'device'] },
  { id: 'cuff', term: 'Cuff', definition: 'The end of the sleeve, where navies and many air forces put their rings.', see: ['sleeve-ring'] },
  { id: 'curl', term: 'Curl', definition: 'The loop on the top ring of a naval officer’s sleeve lace, worn in the Royal Navy since 1856 and copied by many navies since. Also called the executive curl or Elliot’s eye.', see: ['sleeve-ring', 'lace'] },
  { id: 'device', term: 'Device', definition: 'A single emblem on an insignia: a pip, a star, a crown, an anchor.', see: ['insignia'] },
  { id: 'emblem', term: 'Emblem', definition: 'The nation’s own mark on an insignia: its arms, a badge, an eagle, an anchor. Here it is taken from the arms or flag in your nation’s profile.', see: ['device'] },
  { id: 'enlisted', term: 'Enlisted', definition: 'Everyone who is not an officer. In this tool the word covers the junior ranks only (OR-1 to OR-4), with non-commissioned officers counted apart.', see: ['other-ranks', 'non-commissioned-officer'] },
  { id: 'epaulette', term: 'Epaulette', definition: 'An ornamental shoulder piece, often with a fringe of bullion. Epaulettes carried officers’ rank in the eighteenth and nineteenth centuries; the plain shoulder board is their descendant.', see: ['shoulder-board'] },
  { id: 'field-officer', term: 'Field officer', definition: 'A major, lieutenant colonel or colonel: the officers who command battalions and regiments. The NATO codes OF-3 to OF-5.', see: ['general-officer', 'junior-officer'] },
  { id: 'flag-officer', term: 'Flag officer', definition: 'An admiral of any grade, so called because they may fly a flag from their ship to show where they are. The naval counterpart of a general officer.', see: ['general-officer'] },
  { id: 'general-officer', term: 'General officer', definition: 'An officer above colonel: a brigadier general, major general, lieutenant general or general. The NATO codes OF-6 to OF-10.', see: ['flag-officer', 'field-officer'] },
  { id: 'gorget', term: 'Gorget', definition: 'Armour for the throat, which shrank over the centuries into a small crescent worn by officers as a badge of rank. It lives on in the name of the gorget patch.', see: ['collar-patch'] },
  { id: 'grade', term: 'Grade', definition: 'A step on the pay scale, or a broad level of the ladder. This tool uses three: officers, non-commissioned officers and enlisted.', see: ['rank', 'nato-code'] },
  { id: 'insignia', term: 'Insignia', definition: 'The marks that show a rank: what is worn on the shoulder, the sleeve or the collar. The word is used for one mark and for many.', see: ['device', 'shoulder-board'] },
  { id: 'junior-officer', term: 'Junior officer', definition: 'A lieutenant or captain: the officers who lead platoons and companies. Also called company officers; lieutenants alone are subalterns. The NATO codes OF-1 and OF-2.', see: ['field-officer'] },
  { id: 'lace', term: 'Lace', definition: 'Flat gold or silver braid. Sewn round a cuff it makes a sleeve ring; sewn along a shoulder board it marks a senior officer.', see: ['sleeve-ring', 'curl'] },
  { id: 'ladder', term: 'Ladder', definition: 'In this tool, all the ranks of one branch in order, highest first.', see: ['branch', 'rank'] },
  { id: 'metal', term: 'Metal', definition: 'In this tool, the colour the devices are made in: gold, silver, or dark thread for field uniforms. Many forces use one metal for the whole branch; some switch metal to tell neighbouring ranks apart.', see: ['cloth', 'device'] },
  { id: 'nato-code', term: 'NATO code', definition: 'A label from the NATO agreement STANAG 2116 that lets one force’s ranks be read against another’s: OF-1 to OF-10 for officers, OR-1 to OR-9 for other ranks. A higher number is a higher rank.', see: ['commissioned-officer', 'other-ranks'] },
  { id: 'non-commissioned-officer', term: 'Non-commissioned officer', definition: 'A corporal or sergeant: someone promoted from the ranks to lead, without a commission. NCOs run the daily life of a unit. In NATO’s scheme, OR-5 to OR-9.', see: ['petty-officer', 'warrant-officer'] },
  { id: 'officer-cadet', term: 'Officer cadet', definition: 'Someone training to become an officer, who holds no commission yet. A navy’s equivalent is the midshipman.', see: ['commission'] },
  { id: 'other-ranks', term: 'Other ranks', definition: 'The Commonwealth term for everyone who is not an officer, and the OR of the NATO codes.', see: ['enlisted', 'nato-code'] },
  { id: 'petty-officer', term: 'Petty officer', definition: 'A navy’s non-commissioned officer, equal to an army sergeant. From the French petit, small: an officer in a small way.', see: ['non-commissioned-officer', 'rating'] },
  { id: 'pip', term: 'Pip', definition: 'The small four-pointed star on a British-pattern officer’s shoulder: one for a second lieutenant, two for a lieutenant, three for a captain. Properly a star of the Order of the Bath.', see: ['crown', 'star'] },
  { id: 'piping', term: 'Piping', definition: 'A narrow edging in a second colour, round a shoulder board or a collar patch. It often carries the arm-of-service colour.', see: ['arm-of-service-colour'] },
  { id: 'rank', term: 'Rank', definition: 'A person’s place in the chain of command: who they may give orders to, and whose orders they take.', see: ['grade', 'appointment', 'seniority'] },
  { id: 'rating', term: 'Rating', definition: 'In Commonwealth navies, a sailor who is not an officer. In the United States Navy, a sailor’s trade; their rank is their rate.', see: ['petty-officer', 'other-ranks'] },
  { id: 'rocker', term: 'Rocker', definition: 'A curved bar beneath a set of chevrons, which marks the senior sergeants in the American pattern. Each rocker is a step up.', see: ['chevron'] },
  { id: 'seniority', term: 'Seniority', definition: 'Who comes first among people of the same rank, usually settled by the date each was promoted. Insignia show rank; seniority is in the paperwork.', see: ['rank'] },
  { id: 'shoulder-board', term: 'Shoulder board', definition: 'A stiff, detachable board worn on the shoulder, buttoned near the collar, that carries rank. A soft loop slipped over a shoulder strap does the same job and is called a slide.', see: ['epaulette', 'insignia'] },
  { id: 'sleeve-ring', term: 'Sleeve ring', definition: 'A band of lace round the cuff. Navies count rank in rings: one for the most junior officer, four for a captain, and a broad ring for an admiral.', see: ['curl', 'lace', 'cuff'] },
  { id: 'star', term: 'Star', definition: 'The five-pointed star, used almost everywhere for something: an American general’s rank, an Eastern-pattern officer’s grade, a line officer’s sleeve in many navies.', see: ['pip', 'general-officer'] },
  { id: 'substantive-rank', term: 'Substantive rank', definition: 'The rank a person actually holds, with its pay and seniority, as opposed to an acting or honorary one.', see: ['acting-rank', 'brevet'] },
  { id: 'warrant-officer', term: 'Warrant officer', definition: 'Someone who holds rank by warrant, not by commission: senior to every sergeant, junior to every officer. Usually a specialist or the senior soldier of a unit.', see: ['commission', 'non-commissioned-officer'] },
  { id: 'wreath', term: 'Wreath', definition: 'A ring of laurel or oak leaves round or beneath another device. It marks the senior ranks: field officers in the Continental pattern, marshals and admirals of the fleet almost everywhere.', see: ['device', 'general-officer'] },
];

export const termById = (id: string): Term | undefined => glossary.find((entry) => entry.id === id);
