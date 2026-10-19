// Card, enemy, item and modifier definitions for Oil, stage 1.
import { CONFIG } from './config'

export type Family = 'Legal' | 'Dirty' | 'Water' | 'Production' | 'Defence' | 'Tempo' | 'Skim' | 'Junk'
export type Icon = 'derrick' | 'plot' | 'barrel' | 'barrels' | 'fire' | 'bucket' | 'cudgels' | 'deed' | 'shovels' | 'coins' | 'telegraph' | 'dynamite' | 'gear' | 'timber' | 'hose' | 'envelope'

export type CardKey =
  | 'prospect' | 'well' | 'wildcat' | 'hiredHand' | 'lawyerUp' | 'shoreUp' | 'bucket' | 'fireBrigade'
  | 'improveGear' | 'hardGraft' | 'pettyCash' | 'payWages' | 'dynamite' | 'bribe' | 'telegram'
  | 'looseThread' | 'badBlood' | 'marginCall' | 'iou' | 'payOff' | 'inheritance' | 'dividends'

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
  cover?: number // attack cards that also give Cover this turn
  badBlood?: boolean // puts a Bad Blood card in your discard pile when played
  gold?: number // paid from your own fortune when played
  chance?: number // chance the attack lands; if it fails you get Bad Blood
  junk?: boolean
}

export const CARDS: Record<CardKey, CardDef> = {
  prospect: { name: 'Prospect', ap: 2, cost: 0, uses: 1, family: 'Production', power: 0, icon: 'plot', price: 3,
    text: 'Claim 2 plots. Add 2 Well cards to your hand.', flavour: 'Somewhere under here.' },
  well: { name: 'Well', ap: 1, cost: 0, uses: 1, family: 'Production', power: 1, icon: 'derrick',
    text: `+1 oil a turn. Runs dry after ${CONFIG.wellReserve}.`, flavour: 'Black gold. A brighter future.' },
  wildcat: { name: 'Wildcat Well', ap: 1, cost: 0, uses: 1, family: 'Production', power: 2, icon: 'derrick', price: 6, rarity: 'Uncommon',
    text: `+2 oil a turn. Runs dry after ${CONFIG.wildcatReserve}.`, flavour: 'Drill deeper. Ask later.' },
  hiredHand: { name: 'Hired Hand', ap: 1, cost: 0, uses: null, family: 'Dirty', power: 2, icon: 'cudgels', price: 3, rarity: 'Common',
    text: 'Deal 2 Hold damage.', flavour: 'A firm word, and a firmer grip.' },
  lawyerUp: { name: 'Lawyer Up', ap: 1, cost: 2, uses: null, family: 'Legal', power: 3, icon: 'deed', price: 4, rarity: 'Common',
    text: 'Pay $2. Deal 3 Hold damage.', flavour: 'The paperwork always wins (eventually).' },
  shoreUp: { name: 'Shore Up', ap: 1, cost: 0, uses: null, family: 'Dirty', power: 1, cover: CONFIG.shoreUpCover, icon: 'timber', price: 3, rarity: 'Common',
    text: `Deal 1 Hold damage. +${CONFIG.shoreUpCover} Cover this turn.`, flavour: 'More timber. More rope.' },
  bucket: { name: 'Bucket of Water', ap: 1, cost: 0, uses: null, family: 'Water', power: 1, icon: 'bucket',
    text: 'Put out one fire.', flavour: "It won't stop the well, but it might buy a moment." },
  fireBrigade: { name: 'Fire Brigade', ap: 1, cost: 0, uses: null, family: 'Water', power: 3, icon: 'hose', price: 4, rarity: 'Common',
    text: 'Put out every fire.', flavour: 'For a fee.' },
  improveGear: { name: 'Improve Gear', ap: 1, cost: 1, uses: null, family: 'Defence', power: 3, icon: 'gear',
    text: 'Pay $1. +3 Cover this turn.', flavour: 'Stronger timber, fewer accidents.' },
  hardGraft: { name: 'Hard Graft', ap: 0, cost: 0, uses: 1, family: 'Tempo', power: 1, icon: 'cudgels', price: 4, rarity: 'Uncommon',
    text: '+1 AP.', flavour: 'Sleep is for shareholders.' },
  pettyCash: { name: 'Petty Cash', ap: 0, cost: 0, uses: 3, family: 'Skim', power: 1, icon: 'coins',
    text: 'Skim 1 gold.', flavour: 'Necessary expenses.' },
  payWages: { name: 'Pay Wages', ap: 1, cost: 2, uses: null, family: 'Dirty', power: 4, icon: 'coins', price: 1, rarity: 'Common',
    text: 'Pay $2. Deal 4 Hold damage.', flavour: 'Loyalty, by the week.' },
  dynamite: { name: 'Dynamite', ap: 1, cost: 0, uses: 1, family: 'Dirty', badBlood: true, power: 6, icon: 'dynamite', price: 5, rarity: 'Uncommon',
    text: 'Deal 6 Hold damage. Adds Bad Blood to your discard pile.', flavour: 'An unfortunate accident.' },
  bribe: { name: 'Bribe the Sheriff', ap: 1, cost: 2, uses: null, family: 'Dirty', badBlood: true, power: 5, icon: 'coins', price: 5, rarity: 'Uncommon',
    text: 'Pay $2. Deal 5 Hold damage. Adds Bad Blood to your discard pile.', flavour: 'A contribution to local order.' },
  payOff: { name: 'Bribe', ap: 1, cost: 0, gold: CONFIG.bribeGold, chance: CONFIG.bribeChance, uses: null, family: 'Dirty', power: CONFIG.bribeDamage, icon: 'envelope', price: 4, rarity: 'Uncommon',
    text: `Pay ${CONFIG.bribeGold} gold. ${Math.round(CONFIG.bribeChance * 100)}% chance: deal ${CONFIG.bribeDamage} Hold damage. If refused: Bad Blood.`, flavour: 'Everyone has a price. Most of them remember it.' },
  inheritance: { name: 'Inheritance', ap: 0, cost: 0, uses: 1, family: 'Tempo', power: 0, icon: 'coins',
    text: `+$${CONFIG.inheritance}. Then it's gone.`, flavour: 'Grandfather would have wanted you to have it.' },
  dividends: { name: 'Dividends', ap: 1, cost: 0, uses: null, family: 'Tempo', power: 0, icon: 'coins',
    text: `+$${CONFIG.dividends}.`, flavour: 'Paid to the people who matter.' },
  telegram: { name: 'Send a Telegram', ap: 1, cost: 3, uses: 1, family: 'Tempo', power: 0, icon: 'telegraph', price: 3, rarity: 'Common',
    text: 'Pay $3. Add a random attack card to your hand.', flavour: 'STOP. SEND HELP. STOP.' },
  looseThread: { name: 'Loose Thread', ap: 0, cost: 1, uses: null, family: 'Junk', power: 0, icon: 'deed', forced: true, junk: true,
    text: 'Must play. Lose $1.', flavour: 'Someone kept a copy.' },
  badBlood: { name: 'Bad Blood', ap: 0, cost: 0, uses: null, family: 'Junk', power: 0, icon: 'fire', forced: true, junk: true,
    text: 'Must play. 1 in 3 chance of a fire.', flavour: 'They remember.' },
  marginCall: { name: 'Margin Call', ap: 1, cost: 2, uses: 1, family: 'Junk', power: 0, icon: 'telegraph', forced: true, junk: true,
    text: 'Must play. Pay $2.', flavour: 'Payable on demand.' },
  iou: { name: 'IOU', ap: 1, cost: 1, uses: 1, family: 'Junk', power: 0, icon: 'deed', junk: true,
    text: '−$1 each turn it stays in hand. Pay $1 to clear it.', flavour: 'Signed in haste.' },
}

export const STARTER: CardKey[] = ['prospect', 'hiredHand', 'hiredHand', 'lawyerUp', 'shoreUp', 'bucket', 'bucket', 'improveGear', 'hardGraft']
export const SHOP_POOL: CardKey[] = ['hiredHand', 'lawyerUp', 'shoreUp', 'fireBrigade', 'payWages', 'dynamite', 'bribe', 'wildcat', 'telegram', 'hardGraft', 'payOff']
export const ATTACK_CARDS: CardKey[] = ['hiredHand', 'lawyerUp', 'shoreUp', 'dynamite']

export type BonusKey = 'extraProspect' | 'threeOil' | 'pettyCash' | 'gearGraft' | 'trustFund'
export const BONUSES: Record<BonusKey, { name: string; text: string }> = {
  extraProspect: { name: 'Extra Prospect', text: 'A second Prospect card in your deck.' },
  threeOil: { name: '3 Oil', text: 'Start with 3 barrels in the stockpile.' },
  pettyCash: { name: 'Petty Cash', text: 'Skim 1 gold for 0 AP. Three uses.' },
  gearGraft: { name: 'Improve Gear + Hard Graft', text: 'One more of each in your deck.' },
  trustFund: { name: 'Trust Fund', text: 'No Bank Debt in stage 1. Father has taken care of it.' },
}

export type ThreatKind = 'blowout' | 'strike' | 'inspector' | 'railroad' | 'claimJumper' | 'speculator' | 'baron'

export type ThreatRole = 'cash' | 'engine' | 'boss'

export interface ThreatDef {
  name: string
  role: ThreatRole // cash: drains your money · engine: breaks your Wells, cards or turns
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
  blowout: { role: 'engine', name: 'The Blowout', hold: 5, resist: 'Legal', cycle: ['Rumble', 'Spray', 'Blow'], whenBeaten: 'Gusher: +3 oil', portrait: 'blowout' },
  strike: { role: 'engine', name: 'The Strike', hold: 8, weak: 'Dirty', resist: 'Legal', cycle: ['Picket', 'Sabotage'], round3: 'Torch', movesFirst: 'Walkout', portrait: 'strike' },
  inspector: { role: 'cash', name: 'The Bank Inspector', hold: 6, weak: 'Legal', immune: 'Dirty', cycle: ['Audit', 'Fine'], whenBeaten: '2 Loose Threads', portrait: 'inspector' },
  railroad: { role: 'cash', name: 'The Railroad Agent', hold: 7, resist: 'Legal', cycle: ['Raise Rates', 'Refuse'], portrait: 'railroad' },
  claimJumper: { role: 'engine', name: 'The Claim Jumper', hold: 6, weak: 'Dirty', resist: 'Legal', cycle: ['Jump', 'Scout'], movesFirst: 'Scout', whenBeaten: 'Starts 2 fires', portrait: 'claimJumper' },
  speculator: { role: 'cash', name: 'The Speculator', hold: 7, weak: 'Legal', resist: 'Dirty', cycle: ['Short', 'Margin Call', 'Rumours'], round3: 'Paper Promise', whenBeaten: 'Price recovers', portrait: 'speculator' },
  baron: { role: 'boss', name: 'The Rival Baron', hold: 20, weak: 'Dirty', resist: 'Legal', cycle: ['Sabotage', 'Lease', 'Arson'], movesFirst: 'Arson', portrait: 'baron' },
}

// Round 1 takes your cash, round 2 breaks your engine, round 3 sends one of each.
export const CASH_POOL: ThreatKind[] = ['inspector', 'railroad', 'speculator']
export const ENGINE_POOL: ThreatKind[] = ['blowout', 'strike', 'claimJumper']
export const ROLE_LABEL: Record<ThreatRole, string> = { cash: 'Takes your cash', engine: 'Breaks your engine', boss: 'Boss' }

export type ModKey = 'drySeason' | 'glut' | 'hardRock' | 'bankSqueeze' | 'badWeather' | 'boomtown'
export const MODS: Record<ModKey, { name: string; text: string }> = {
  drySeason: { name: 'Dry Season', text: 'Every outbreak starts 1 extra fire' },
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

// Before the boss: one small, single-use item, bought with gold. Beat the boss: a
// bigger, lasting one of a different type.
export type BoonType = 'ap' | 'wells' | 'fire' | 'cash' | 'storage'
export type BoonKey = 'spareHand' | 'spareRigs' | 'fireBrigade' | 'inheritance' | 'tempSilo'
export const BOONS: Record<BoonKey, { name: string; text: string; type: BoonType; icon: Icon }> = {
  spareHand: { name: 'A Spare Hand', text: '+1 AP on your first turn against the Baron.', type: 'ap', icon: 'cudgels' },
  spareRigs: { name: 'Spare Rigs', text: '2 Well cards in your first hand against the Baron.', type: 'wells', icon: 'derrick' },
  fireBrigade: { name: 'Fire Brigade', text: 'A Fire Brigade card for your deck.', type: 'fire', icon: 'hose' },
  inheritance: { name: 'Inheritance', text: `A card that gives $${CONFIG.inheritance} once, then is gone.`, type: 'cash', icon: 'coins' },
  tempSilo: { name: 'Temporary Silo', text: `+${CONFIG.tempSilo} oil storage for the fight with the Baron.`, type: 'storage', icon: 'barrels' },
}
export type RewardKey = 'steamPump' | 'dividends' | 'silo' | 'wildcatRights'
export const REWARDS: Record<RewardKey, { name: string; text: string; type: BoonType; icon: Icon }> = {
  steamPump: { name: 'Steam Pump', text: '+1 AP every turn.', type: 'ap', icon: 'derrick' },
  dividends: { name: 'Dividends', text: `A card that gives $${CONFIG.dividends} every time you play it.`, type: 'cash', icon: 'coins' },
  silo: { name: 'Silo', text: '+4 oil storage, for good.', type: 'storage', icon: 'barrels' },
  wildcatRights: { name: 'Wildcat Rights', text: '2 Wildcat Well cards for your deck.', type: 'wells', icon: 'derrick' },
}
