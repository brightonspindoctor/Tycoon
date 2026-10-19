// Card, enemy, item and modifier definitions for Oil, stage 1.

export type Family = 'Muscle' | 'Legal' | 'Fix' | 'Dirty' | 'Wages' | 'Water' | 'Production' | 'Defence' | 'Tempo' | 'Skim' | 'Junk'
export type Icon = 'derrick' | 'plot' | 'barrel' | 'barrels' | 'fire' | 'bucket' | 'cudgels' | 'deed' | 'shovels' | 'coins' | 'telegraph' | 'dynamite'

export type CardKey =
  | 'prospect' | 'well' | 'wildcat' | 'hiredHand' | 'lawyerUp' | 'shoreUp' | 'bucket' | 'fireBrigade'
  | 'improveGear' | 'hardGraft' | 'pettyCash' | 'payWages' | 'dynamite' | 'bribe' | 'telegram'
  | 'looseThread' | 'badBlood' | 'marginCall' | 'iou'

export interface CardDef {
  name: string
  ap: number | null // null = can't be played
  cost: number // $ paid when played
  uses: number | null // null = permanent
  family: Family
  power: number
  text: string
  flavour?: string
  icon: Icon
  price?: number // shop price
  rarity?: 'Common' | 'Uncommon' | 'Rare'
  forced?: boolean // must be played before other cards
  junk?: boolean
}

export const CARDS: Record<CardKey, CardDef> = {
  prospect: { name: 'Prospect', ap: 2, cost: 0, uses: null, family: 'Production', power: 0, icon: 'plot', price: 3,
    text: 'Claim 2 plots. Add 2 Well cards to your hand.', flavour: 'Somewhere under here.' },
  well: { name: 'Well', ap: 1, cost: 0, uses: 1, family: 'Production', power: 1, icon: 'derrick',
    text: '+1 oil a turn.', flavour: 'Black gold. A brighter future.' },
  wildcat: { name: 'Wildcat Well', ap: 1, cost: 0, uses: 1, family: 'Production', power: 2, icon: 'derrick', price: 6, rarity: 'Uncommon',
    text: '+2 oil a turn.', flavour: 'Drill deeper. Ask later.' },
  hiredHand: { name: 'Hired Hand', ap: 1, cost: 0, uses: null, family: 'Muscle', power: 2, icon: 'cudgels', price: 3, rarity: 'Common',
    text: 'Deal 2 Hold damage.', flavour: 'A firm word, and a firmer grip.' },
  lawyerUp: { name: 'Lawyer Up', ap: 1, cost: 2, uses: null, family: 'Legal', power: 4, icon: 'deed', price: 4, rarity: 'Common',
    text: 'Pay $2. Deal 4 Hold damage.', flavour: 'The paperwork always wins (eventually).' },
  shoreUp: { name: 'Shore Up', ap: 1, cost: 0, uses: null, family: 'Fix', power: 3, icon: 'shovels', price: 3, rarity: 'Common',
    text: 'Deal 3 Hold damage.', flavour: 'More timber. More rope.' },
  bucket: { name: 'Bucket of Water', ap: 1, cost: 0, uses: 2, family: 'Water', power: 1, icon: 'bucket',
    text: '−1 Fire.', flavour: "It won't stop the well, but it might buy a moment." },
  fireBrigade: { name: 'Fire Brigade', ap: 1, cost: 0, uses: null, family: 'Water', power: 3, icon: 'bucket', price: 4, rarity: 'Common',
    text: 'Put the fire out.', flavour: 'For a fee.' },
  improveGear: { name: 'Improve Gear', ap: 1, cost: 1, uses: null, family: 'Defence', power: 3, icon: 'shovels',
    text: 'Pay $1. +3 Cover this turn.', flavour: 'Stronger timber, fewer accidents.' },
  hardGraft: { name: 'Hard Graft', ap: 0, cost: 0, uses: 1, family: 'Tempo', power: 1, icon: 'cudgels',
    text: '+1 AP.', flavour: 'Sleep is for shareholders.' },
  pettyCash: { name: 'Petty Cash', ap: 0, cost: 0, uses: 3, family: 'Skim', power: 1, icon: 'coins',
    text: 'Skim 1 gold.', flavour: 'Necessary expenses.' },
  payWages: { name: 'Pay Wages', ap: 1, cost: 2, uses: null, family: 'Wages', power: 3, icon: 'coins', price: 3, rarity: 'Common',
    text: 'Pay $2. Deal 3 Hold damage to a Strike.', flavour: 'Just this once.' },
  dynamite: { name: 'Dynamite', ap: 1, cost: 0, uses: 1, family: 'Dirty', power: 6, icon: 'dynamite', price: 5, rarity: 'Uncommon',
    text: 'Deal 6 Hold damage. Adds Bad Blood.', flavour: 'An unfortunate accident.' },
  bribe: { name: 'Bribe the Sheriff', ap: 1, cost: 3, uses: null, family: 'Dirty', power: 3, icon: 'coins', price: 5, rarity: 'Uncommon',
    text: 'Pay $3. Deal 3 Hold damage. Adds Bad Blood.', flavour: 'A contribution to local order.' },
  telegram: { name: 'Send a Telegram', ap: 1, cost: 3, uses: 1, family: 'Tempo', power: 0, icon: 'telegraph', price: 3, rarity: 'Common',
    text: 'Pay $3. Add a random attack card to your hand.', flavour: 'STOP. SEND HELP. STOP.' },
  looseThread: { name: 'Loose Thread', ap: 1, cost: 1, uses: null, family: 'Junk', power: 0, icon: 'deed', forced: true, junk: true,
    text: 'Must play. Lose $1.', flavour: 'Someone kept a copy.' },
  badBlood: { name: 'Bad Blood', ap: null, cost: 0, uses: null, family: 'Junk', power: 0, icon: 'fire', junk: true,
    text: "Can't be played. In hand: 1 in 3 chance of Fire.", flavour: 'They remember.' },
  marginCall: { name: 'Margin Call', ap: 1, cost: 2, uses: 1, family: 'Junk', power: 0, icon: 'telegraph', forced: true, junk: true,
    text: 'Must play. Pay $2.', flavour: 'Payable on demand.' },
  iou: { name: 'IOU', ap: 1, cost: 1, uses: 1, family: 'Junk', power: 0, icon: 'deed', junk: true,
    text: '−$1 each turn it stays in hand. Pay $1 to clear it.', flavour: 'Signed in haste.' },
}

export const STARTER: CardKey[] = ['prospect', 'hiredHand', 'hiredHand', 'lawyerUp', 'shoreUp', 'bucket', 'bucket', 'improveGear', 'improveGear', 'hardGraft']
export const SHOP_POOL: CardKey[] = ['hiredHand', 'lawyerUp', 'shoreUp', 'fireBrigade', 'payWages', 'dynamite', 'bribe', 'wildcat', 'telegram']
export const ATTACK_CARDS: CardKey[] = ['hiredHand', 'lawyerUp', 'shoreUp', 'dynamite']

export type BonusKey = 'extraProspect' | 'threeOil' | 'pettyCash' | 'gearGraft'
export const BONUSES: Record<BonusKey, { name: string; text: string }> = {
  extraProspect: { name: 'Extra Prospect', text: 'A second Prospect card in your deck.' },
  threeOil: { name: '3 Oil', text: 'Start with 3 barrels in the stockpile.' },
  pettyCash: { name: 'Petty Cash', text: 'Skim 1 gold for 0 AP. Three uses.' },
  gearGraft: { name: 'Improve Gear + Hard Graft', text: 'One more of each in your deck.' },
}

export type ThreatKind = 'blowout' | 'strike' | 'inspector' | 'railroad' | 'claimJumper' | 'speculator' | 'baron'

export interface ThreatDef {
  name: string
  hold: number
  weak?: Family
  resist?: Family
  immune?: Family
  cycle: string[]
  round3?: string // extra step added in round 3
  movesFirst?: string
  whenBeaten?: string
  portrait: string
}

export const THREATS: Record<ThreatKind, ThreatDef> = {
  blowout: { name: 'The Blowout', hold: 5, weak: 'Fix', resist: 'Muscle', cycle: ['Rumble', 'Spray', 'Blow'], whenBeaten: 'Gusher: +3 oil', portrait: 'blowout' },
  strike: { name: 'The Strike', hold: 8, weak: 'Muscle', resist: 'Legal', cycle: ['Picket', 'Sabotage'], round3: 'Torch', movesFirst: 'Walkout', portrait: 'strike' },
  inspector: { name: 'The Bank Inspector', hold: 6, weak: 'Legal', immune: 'Muscle', cycle: ['Audit', 'Fine'], whenBeaten: '2 Loose Threads', portrait: 'inspector' },
  railroad: { name: 'The Railroad Agent', hold: 7, weak: 'Legal', resist: 'Muscle', cycle: ['Raise Rates', 'Refuse'], portrait: 'railroad' },
  claimJumper: { name: 'The Claim Jumper', hold: 6, weak: 'Muscle', resist: 'Legal', cycle: ['Jump', 'Scout'], movesFirst: 'Scout', whenBeaten: 'Fire (2)', portrait: 'claimJumper' },
  speculator: { name: 'The Speculator', hold: 6, weak: 'Legal', resist: 'Muscle', cycle: ['Short', 'Margin Call', 'Rumours'], round3: 'Paper Promise', whenBeaten: 'Price recovers', portrait: 'speculator' },
  baron: { name: 'The Rival Baron', hold: 20, weak: 'Dirty', resist: 'Legal', cycle: ['Sabotage', 'Lease', 'Arson'], movesFirst: 'Arson', portrait: 'baron' },
}

export const ROUND1_POOL: ThreatKind[] = ['blowout', 'strike', 'inspector', 'railroad']
export const ALL_POOL: ThreatKind[] = ['blowout', 'strike', 'inspector', 'railroad', 'claimJumper', 'speculator']

export type ModKey = 'drySeason' | 'glut' | 'hardRock' | 'bankSqueeze' | 'badWeather' | 'boomtown'
export const MODS: Record<ModKey, { name: string; text: string }> = {
  drySeason: { name: 'Dry Season', text: 'Fires start +1' },
  glut: { name: 'Glut', text: 'Oil sells −$1' },
  hardRock: { name: 'Hard Rock', text: 'Prospect costs +1 AP' },
  bankSqueeze: { name: 'Bank Squeeze', text: 'Debt +$1 a turn' },
  badWeather: { name: 'Bad Weather', text: 'Draw 1 fewer card' },
  boomtown: { name: 'Boomtown', text: 'Oil +$1, debt +$1' },
}

export type ItemKey = 'storageTank' | 'silo' | 'steamPump' | 'lookout'
export const ITEMS: Record<ItemKey, { name: string; text: string; price: number; repeatable?: boolean; icon: Icon }> = {
  storageTank: { name: 'Storage Tank', text: '+2 oil storage', price: 4, repeatable: true, icon: 'barrels' },
  silo: { name: 'Silo', text: '+4 oil storage', price: 7, icon: 'barrels' },
  steamPump: { name: 'Steam Pump', text: '+1 AP every turn', price: 10, icon: 'derrick' },
  lookout: { name: 'Lookout', text: 'Enemies lose their opening move', price: 5, icon: 'telegraph' },
}
