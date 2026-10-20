// Card, enemy, item and modifier definitions for Oil, stages 1 and 2.
import { CONFIG } from './config'

export type Family = 'Legal' | 'Dirty' | 'Water' | 'Production' | 'Defence' | 'Tempo' | 'Skim' | 'Board' | 'Scrap' | 'Junk'
export type Icon = 'derrick' | 'plot' | 'barrel' | 'barrels' | 'fire' | 'bucket' | 'cudgels' | 'deed' | 'shovels' | 'coins' | 'telegraph' | 'dynamite' | 'gear' | 'timber' | 'hose' | 'envelope' | 'graft'
  | 'wages' | 'sheriff' | 'will' | 'shares' | 'cashbox' | 'redtape' | 'iou' | 'phone'

export type CardKey =
  | 'prospect' | 'well' | 'wildcat' | 'hiredHand' | 'lawyerUp' | 'shoreUp' | 'bucket' | 'fireBrigade'
  | 'improveGear' | 'hardGraft' | 'pettyCash' | 'payWages' | 'dynamite' | 'bribe' | 'telegram'
  | 'looseThread' | 'badBlood' | 'marginCall' | 'iou' | 'payOff' | 'inheritance' | 'dividends'
  // stage 2
  | 'survey' | 'oldProspect' | 'rotaryRig' | 'telegraphLine' | 'tickerTape' | 'nightShift' | 'efficiencyExpert'
  | 'streamline' | 'shredFiles' | 'scrapParts' | 'cleanHouse' | 'patentThicket' | 'espionage' | 'poachEngineer'
  | 'rdSprint' | 'payDividend' | 'personalLawyer' | 'ceaseDesist' | 'proxyBallot'
  | 'derrick' | 'extinguisher' | 'securityDetail' | 'insurance' | 'expenseAccount'

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
  stop?: boolean // stops one enemy's next move this turn
  oncePerRound?: boolean // after it's played it sits out until the next round
  badBlood?: boolean // puts a Bad Blood card in your discard pile when played
  gold?: number // paid from your own fortune when played
  chance?: number // chance the attack lands; if it fails you get Bad Blood
  junk?: boolean
  era?: number // the stage the card comes from; it keeps that look (default 1)
  plots?: number // Prospect cards: plots claimed
  wells?: number // Prospect cards: Well cards added to your hand
  cover?: number // Cover gained when played
  draw?: number // cards drawn when played
  exposure?: number // change to Board Exposure when played (stage 2 on)
  scrap?: 'one' | 'junk' // destroys a card in your hand (you choose), or every junk card in it
  apNext?: number // AP lost next turn
  goldBack?: number // $ gained when played (Scrap for Parts)
}

export const CARDS: Record<CardKey, CardDef> = {
  prospect: { name: 'Prospect', ap: 2, cost: 0, uses: 1, family: 'Production', power: 0, plots: 2, wells: 2, icon: 'plot', price: 3,
    text: 'Claim 2 plots. Add 2 Well cards to your hand.', flavour: 'Somewhere under here.' },
  well: { name: 'Well', ap: 1, cost: 0, uses: 1, family: 'Production', power: 1, icon: 'derrick',
    text: `+1 oil a turn. Runs dry after ${CONFIG.wellReserve}.`, flavour: 'Black gold. A brighter future.' },
  wildcat: { name: 'Wildcat Well', ap: 1, cost: 0, uses: 1, family: 'Production', power: 2, icon: 'derrick', price: 6, rarity: 'Uncommon',
    text: `+2 oil a turn. Runs dry after ${CONFIG.wildcatReserve}.`, flavour: 'Drill deeper. Ask later.' },
  hiredHand: { name: 'Hired Hand', ap: 1, cost: 0, uses: null, family: 'Dirty', power: 2, icon: 'cudgels', price: 3, rarity: 'Common',
    text: 'Remove 2 Hold.', flavour: 'A firm word, and a firmer grip.' },
  lawyerUp: { name: 'Lawyer Up', ap: 1, cost: 2, uses: null, family: 'Legal', power: 3, icon: 'deed', price: 4, rarity: 'Common',
    text: 'Pay $2. Remove 3 Hold.', flavour: 'The paperwork always wins (eventually).' },
  shoreUp: { name: 'Shore Up', ap: 1, cost: 0, uses: null, family: 'Defence', power: 0, stop: true, oncePerRound: true, icon: 'timber', price: 3, rarity: 'Common',
    text: "Stop one enemy's next move this turn. One Shore Up per round.", flavour: 'More timber. More rope.' },
  bucket: { name: 'Bucket of Water', ap: 1, cost: 0, uses: null, family: 'Water', power: 1, icon: 'bucket',
    text: 'Put out one fire.', flavour: "It won't stop the well, but it might buy a moment." },
  fireBrigade: { name: 'Fire Brigade', ap: 1, cost: 0, uses: null, family: 'Water', power: 3, icon: 'hose', price: 4, rarity: 'Common',
    text: 'Put out every fire.', flavour: 'For a fee.' },
  improveGear: { name: 'Improve Gear', ap: 1, cost: 1, uses: null, family: 'Defence', power: 0, cover: 3, icon: 'gear',
    text: 'Pay $1. +3 Cover this turn.', flavour: 'Stronger timber, fewer accidents.' },
  hardGraft: { name: 'Hard Graft', ap: 0, cost: 0, uses: null, oncePerRound: true, family: 'Tempo', power: 1, icon: 'graft', price: 4, rarity: 'Uncommon',
    text: '+1 AP. Once per round.', flavour: 'Sleep is for shareholders.' },
  pettyCash: { name: 'Petty Cash', ap: 0, cost: 0, uses: 3, family: 'Skim', power: 1, icon: 'cashbox',
    text: 'Skim 1 gold.', flavour: 'Necessary expenses.' },
  payWages: { name: 'Pay Wages', ap: 1, cost: 2, uses: null, family: 'Dirty', power: 4, icon: 'wages', price: 1, rarity: 'Common',
    text: 'Pay $2. Remove 4 Hold.', flavour: 'Loyalty, by the week.' },
  dynamite: { name: 'Dynamite', ap: 1, cost: 0, uses: 1, family: 'Dirty', badBlood: true, power: 6, icon: 'dynamite', price: 5, rarity: 'Uncommon',
    text: 'Remove 6 Hold. Adds Bad Blood to your discard pile.', flavour: 'An unfortunate accident.' },
  bribe: { name: 'Bribe the Sheriff', ap: 1, cost: 2, uses: null, family: 'Dirty', badBlood: true, power: 5, icon: 'sheriff', price: 5, rarity: 'Uncommon',
    text: 'Pay $2. Remove 5 Hold. Adds Bad Blood to your discard pile.', flavour: 'A contribution to local order.' },
  payOff: { name: 'Bribe', ap: 1, cost: 0, gold: CONFIG.bribeGold, chance: CONFIG.bribeChance, uses: null, family: 'Dirty', power: CONFIG.bribeDamage, icon: 'envelope', price: 4, rarity: 'Uncommon',
    text: `Pay ${CONFIG.bribeGold} gold. ${Math.round(CONFIG.bribeChance * 100)}% chance: remove ${CONFIG.bribeDamage} Hold. If refused: Bad Blood.`, flavour: 'Everyone has a price. Most of them remember it.' },
  inheritance: { name: 'Inheritance', ap: 0, cost: 0, uses: 1, family: 'Tempo', power: 0, icon: 'will',
    text: `+$${CONFIG.inheritance}. Then it's gone.`, flavour: 'Grandfather would have wanted you to have it.' },
  dividends: { name: 'Dividends', ap: 1, cost: 0, uses: null, family: 'Tempo', power: CONFIG.dividends, icon: 'shares',
    text: `+$${CONFIG.dividends}.`, flavour: 'Paid to the people who matter.' },
  telegram: { name: 'Send a Telegram', ap: 1, cost: 3, uses: 1, family: 'Tempo', power: 0, icon: 'telegraph', price: 3, rarity: 'Common',
    text: 'Pay $3. Add a random attack card to your hand. It costs no AP.', flavour: 'STOP. SEND HELP. STOP.' },
  looseThread: { name: 'Loose Thread', ap: 0, cost: 1, uses: null, family: 'Junk', power: 0, icon: 'redtape', forced: true, junk: true,
    text: 'Must play. Lose $1.', flavour: 'Someone kept a copy.' },
  badBlood: { name: 'Bad Blood', ap: 0, cost: 0, uses: 2, family: 'Junk', power: 0, icon: 'fire', forced: true, junk: true,
    text: 'Must play. 1 in 3 chance of a fire. Gone after 2 plays.', flavour: 'They remember. For a while.' },
  marginCall: { name: 'Margin Call', ap: 1, cost: 2, uses: 1, family: 'Junk', power: 0, icon: 'phone', forced: true, junk: true,
    text: 'Must play. Pay $2.', flavour: 'Payable on demand.' },
  iou: { name: 'IOU', ap: 1, cost: 1, uses: 1, family: 'Junk', power: 0, icon: 'iou', junk: true,
    text: '−$1 each turn it stays in hand. Pay $1 to clear it.', flavour: 'Signed in haste.' },

  // ---------------------------------------------------------------- stage 2 (Art Deco)
  survey: { name: 'Survey', era: 2, ap: 2, cost: 0, uses: 1, family: 'Production', power: 0, plots: 1, wells: 1, icon: 'plot', price: CONFIG.surveyPrice,
    text: 'Claim 1 plot. Add 1 Well card to your hand.', flavour: 'The easy oil is gone.' },
  oldProspect: { name: 'Worn Prospect', ap: 2, cost: 0, uses: 1, family: 'Production', power: 0, plots: 0, wells: 1, icon: 'plot',
    text: 'Add 1 Well card to your hand. No new land.', flavour: 'Every inch of it already drilled.' },
  rotaryRig: { name: 'Rotary Rig', era: 2, ap: 1, cost: 0, uses: 1, family: 'Production', power: 0, icon: 'gear', price: 4, rarity: 'Common',
    text: 'Turn your best Well into a Field. Fields never run dry.', flavour: 'Through rock the old rigs never reached.' },
  telegraphLine: { name: 'Telegraph Line', era: 2, ap: 0, cost: 0, uses: null, family: 'Tempo', power: 0, draw: 1, icon: 'telegraph', price: 5, rarity: 'Common',
    text: 'Draw 1 card.', flavour: 'Word travels. Yours first.' },
  tickerTape: { name: 'Ticker Tape', era: 2, ap: 1, cost: 0, uses: null, family: 'Tempo', power: 1, draw: 2, icon: 'shares', price: 6, rarity: 'Uncommon',
    text: 'Draw 2 cards. Oil sells +$1 this turn.', flavour: 'Buy on the rumour.' },
  nightShift: { name: 'Night Shift', era: 2, ap: 0, cost: 0, uses: null, family: 'Tempo', power: 2, apNext: 1, icon: 'graft', price: 5, rarity: 'Common',
    text: '+2 AP now. −1 AP next turn.', flavour: 'The lamps never go out.' },
  efficiencyExpert: { name: 'Efficiency Expert', era: 2, ap: 1, cost: 2, uses: null, family: 'Tempo', power: 0, draw: 3, icon: 'deed', price: 6, rarity: 'Common',
    text: 'Pay $2. Draw 3 cards.', flavour: 'He has timed your lunch.' },
  streamline: { name: 'Streamline', era: 2, ap: 1, cost: 0, uses: null, family: 'Scrap', power: 0, scrap: 'one', icon: 'redtape', price: 5, rarity: 'Common',
    text: 'Destroy a card in your hand.', flavour: 'Fewer moving parts.' },
  shredFiles: { name: 'Shred the Files', era: 2, ap: 0, cost: 0, uses: null, family: 'Scrap', power: 0, scrap: 'one', exposure: 1, icon: 'redtape', price: 4, rarity: 'Common',
    text: 'Destroy a card in your hand. +1 Board Exposure.', flavour: 'What files?' },
  scrapParts: { name: 'Scrap for Parts', era: 2, ap: 0, cost: 0, uses: null, family: 'Scrap', power: 0, scrap: 'one', goldBack: 2, icon: 'gear', price: 5, rarity: 'Common',
    text: 'Destroy a card in your hand. +$2.', flavour: 'Waste not.' },
  cleanHouse: { name: 'Clean House', era: 2, ap: 1, cost: 0, uses: null, family: 'Scrap', power: 0, scrap: 'junk', icon: 'bucket', price: 6, rarity: 'Uncommon',
    text: 'Destroy every junk card in your hand. Draw that many.', flavour: 'Under new management.' },
  patentThicket: { name: 'Patent Thicket', era: 2, ap: 1, cost: 2, uses: null, family: 'Legal', power: 7, icon: 'deed', price: 7, rarity: 'Common',
    text: 'Pay $2. Remove 7 Hold.', flavour: 'Forty patents. One invention.' },
  espionage: { name: 'Industrial Espionage', era: 2, ap: 1, cost: 0, uses: null, family: 'Dirty', power: 9, exposure: 1, icon: 'envelope', price: 8, rarity: 'Uncommon',
    text: 'Remove 9 Hold. +1 Board Exposure.', flavour: 'Their blueprints, your letterhead.' },
  poachEngineer: { name: 'Poach an Engineer', era: 2, ap: 1, cost: 0, uses: null, family: 'Dirty', power: 5, draw: 1, icon: 'wages', price: 6, rarity: 'Common',
    text: 'Remove 5 Hold. Draw 1 card.', flavour: 'Double the salary. Half the scruples.' },
  rdSprint: { name: 'R&D Sprint', era: 2, ap: 1, cost: 0, uses: null, family: 'Production', power: 1, icon: 'barrels', price: 6, rarity: 'Uncommon',
    text: '+1 oil from every Field now.', flavour: 'Results by Friday.' },
  payDividend: { name: 'Pay a Dividend', era: 2, ap: 1, cost: 3, uses: null, family: 'Board', power: 0, exposure: -1, icon: 'shares', price: 4, rarity: 'Common',
    text: 'Pay $3. −1 Board Exposure.', flavour: 'Gentlemen, a token of our esteem.' },
  personalLawyer: { name: 'Personal Lawyer', era: 2, ap: 1, cost: 0, uses: null, family: 'Defence', power: 0, icon: 'deed', price: 5, rarity: 'Common',
    text: 'Your fortune is safe this turn: the next gold an enemy takes is blocked.', flavour: 'Retained for the family.' },
  ceaseDesist: { name: 'Cease and Desist', era: 2, ap: 1, cost: 0, uses: 1, family: 'Junk', power: 0, icon: 'redtape', forced: true, junk: true,
    text: 'Must play. Does nothing.', flavour: 'Pursuant to patent No. 1,042,117.' },
  proxyBallot: { name: 'Proxy Ballot', era: 2, ap: 0, cost: 0, uses: 1, family: 'Junk', power: 0, exposure: 1, icon: 'envelope', forced: true, junk: true,
    text: 'Must play. +1 Board Exposure. Then it\'s gone.', flavour: 'Signed on behalf of a widow in Ohio.' },
  derrick: { name: 'Steel Derrick', era: 2, ap: 1, cost: 0, uses: 1, family: 'Production', power: 1, icon: 'derrick', price: CONFIG.derrickPrice,
    text: 'Build a Well: 1 oil a turn, never runs dry. Claims a plot if none is empty.', flavour: 'Riveted, not nailed.' },
  extinguisher: { name: 'Chemical Engine', era: 2, ap: 1, cost: 0, uses: null, family: 'Water', power: 2, icon: 'hose', price: CONFIG.bucketPrice2,
    text: 'Put out two fires.', flavour: 'Soda, acid, and a brass bell.' },
  securityDetail: { name: 'Security Detail', era: 2, ap: 1, cost: 0, uses: null, family: 'Defence', power: 0, stop: true, oncePerRound: true, cover: 2, icon: 'cudgels', price: 6, rarity: 'Common',
    text: "Stop one enemy's next move this turn. +2 Cover. One stop card per round.", flavour: 'Men in good suits, standing very still.' },
  insurance: { name: 'Insurance Policy', era: 2, ap: 1, cost: 1, uses: null, family: 'Defence', power: 0, cover: 5, icon: 'deed', price: 5, rarity: 'Common',
    text: 'Pay $1. +5 Cover this turn.', flavour: 'Acts of God excluded. Acts of you, also excluded.' },
  expenseAccount: { name: 'Expense Account', era: 2, ap: 0, cost: 0, uses: null, family: 'Skim', power: 1, exposure: 1, icon: 'cashbox', price: 5, rarity: 'Common',
    text: 'Skim: pay the rate, get 1 gold. +1 Board Exposure.', flavour: 'Entertaining clients. Some of them real.' },
}

/** Upgraded versions (bought in the shop from stage 2, or at incorporation). Name gets a +. */
export const UPGRADES: Partial<Record<CardKey, Partial<CardDef>>> = {
  prospect: { ap: 1, text: 'Claim 2 plots. Add 2 Well cards to your hand.' },
  oldProspect: { plots: 1, text: 'Claim 1 plot. Add 1 Well card to your hand.' },
  survey: { ap: 1, text: 'Claim 1 plot. Add 1 Well card to your hand.' },
  hiredHand: { power: 3, text: 'Remove 3 Hold.' },
  lawyerUp: { power: 5, text: 'Pay $2. Remove 5 Hold.' },
  shoreUp: { cover: 2, text: "Stop one enemy's next move this turn. +2 Cover. One Shore Up per round." },
  bucket: { power: 2, text: 'Put out two fires.' },
  fireBrigade: { ap: 0, text: 'Put out every fire. Costs no AP.' },
  improveGear: { cost: 0, cover: 4, text: '+4 Cover this turn.' },
  hardGraft: { power: 2, text: '+2 AP. Once per round.' },
  pettyCash: { exposure: 0, text: 'Skim 1 gold. The board never sees it.' },
  payWages: { power: 6, text: 'Pay $2. Remove 6 Hold.' },
  dynamite: { power: 9, text: 'Remove 9 Hold. Adds Bad Blood to your discard pile.' },
  bribe: { badBlood: false, text: 'Pay $2. Remove 5 Hold.' },
  payOff: { chance: 0.75, text: `Pay ${CONFIG.bribeGold} gold. 75% chance: remove ${CONFIG.bribeDamage} Hold. If refused: Bad Blood.` },
  dividends: { power: 5, text: '+$5.' },
  telegram: { cost: 1, text: 'Pay $1. Add a random attack card to your hand. It costs no AP.' },
  rotaryRig: { ap: 0, text: 'Turn your best Well into a Field. Fields never run dry. Costs no AP.' },
  telegraphLine: { draw: 2, text: 'Draw 2 cards.' },
  tickerTape: { draw: 3, text: 'Draw 3 cards. Oil sells +$1 this turn.' },
  nightShift: { power: 3, text: '+3 AP now. −1 AP next turn.' },
  efficiencyExpert: { cost: 0, text: 'Draw 3 cards.' },
  streamline: { ap: 0, text: 'Destroy a card in your hand. Costs no AP.' },
  shredFiles: { exposure: 0, text: 'Destroy a card in your hand.' },
  scrapParts: { goldBack: 3, text: 'Destroy a card in your hand. +$3.' },
  cleanHouse: { ap: 0, text: 'Destroy every junk card in your hand. Draw that many. Costs no AP.' },
  patentThicket: { power: 10, text: 'Pay $2. Remove 10 Hold.' },
  espionage: { power: 12, text: 'Remove 12 Hold. +1 Board Exposure.' },
  poachEngineer: { power: 7, text: 'Remove 7 Hold. Draw 1 card.' },
  rdSprint: { power: 2, text: '+2 oil from every Field now.' },
  payDividend: { exposure: -2, text: 'Pay $3. −2 Board Exposure.' },
  personalLawyer: { ap: 0, text: 'Your fortune is safe this turn: the next gold an enemy takes is blocked. Costs no AP.' },
  derrick: { ap: 0, text: 'Build a Well: 1 oil a turn, never runs dry. Claims a plot if none is empty. Costs no AP.' },
  extinguisher: { power: 3, text: 'Put out every fire.' },
  securityDetail: { cover: 4, text: "Stop one enemy's next move this turn. +4 Cover. One stop card per round." },
  insurance: { cost: 0, cover: 7, text: '+7 Cover this turn.' },
  expenseAccount: { exposure: 0, text: 'Skim: pay the rate, get 1 gold. The board never sees it.' },
}

export const STARTER: CardKey[] = ['prospect', 'hiredHand', 'hiredHand', 'lawyerUp', 'shoreUp', 'bucket', 'bucket', 'improveGear', 'hardGraft']
export const SHOP_POOL: CardKey[] = ['hiredHand', 'lawyerUp', 'shoreUp', 'fireBrigade', 'payWages', 'dynamite', 'bribe', 'wildcat', 'telegram', 'hardGraft', 'payOff']
// stage 2 sells only stage 2 cards: better than stage 1's, and dearer
export const SHOP_POOL_2: CardKey[] = ['telegraphLine', 'tickerTape', 'nightShift', 'efficiencyExpert', 'streamline', 'shredFiles', 'scrapParts', 'cleanHouse',
  'patentThicket', 'espionage', 'poachEngineer', 'rdSprint', 'payDividend', 'personalLawyer', 'securityDetail', 'insurance', 'expenseAccount']
export const shopPool = (stage: number): CardKey[] => (stage >= 2 ? SHOP_POOL_2 : SHOP_POOL)
/** The land card each stage's shop always stocks: a Prospect in stage 1, a Steel Derrick (a Well) from stage 2. */
export const PROSPECT_FOR: Record<number, CardKey> = { 1: 'prospect', 2: 'derrick' }
/** The fire card each stage's shop always stocks. */
export const WATER_FOR: Record<number, CardKey> = { 1: 'bucket', 2: 'extinguisher' }
export const PROSPECTS: CardKey[] = ['prospect', 'survey', 'oldProspect']
export const ATTACK_CARDS: CardKey[] = ['hiredHand', 'lawyerUp', 'dynamite']

export type BonusKey = 'extraProspect' | 'threeOil' | 'pettyCash' | 'gearGraft' | 'trustFund'
export const BONUSES: Record<BonusKey, { name: string; text: string }> = {
  extraProspect: { name: 'Extra Prospect', text: 'A second Prospect card in your deck.' },
  threeOil: { name: '3 Oil', text: 'Start with 3 barrels in the stockpile.' },
  pettyCash: { name: 'Petty Cash', text: 'Skim 1 gold for 0 AP. Three uses.' },
  gearGraft: { name: 'Improve Gear + Hard Graft', text: 'One more of each in your deck.' },
  trustFund: { name: 'Trust Fund', text: 'No Bank Debt in stage 1. Father has taken care of it.' },
}

export type ThreatKind = 'blowout' | 'strike' | 'inspector' | 'railroad' | 'claimJumper' | 'speculator' | 'baron'
  | 'muckraker' | 'combine' | 'clawback' | 'patentHolder' | 'saboteur' | 'commission' | 'proxyFight'

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
  blowout: { role: 'engine', name: 'The Blowout', hold: 5, immune: 'Legal', cycle: ['Rumble', 'Spray', 'Blow'], whenBeaten: 'Gusher: +3 oil', portrait: 'blowout' },
  strike: { role: 'engine', name: 'The Strike', hold: 8, weak: 'Dirty', cycle: ['Picket', 'Sabotage'], round3: 'Torch', movesFirst: 'Walkout', portrait: 'strike' },
  inspector: { role: 'cash', name: 'The Bank Inspector', hold: 6, weak: 'Legal', immune: 'Dirty', cycle: ['Audit', 'Fine'], whenBeaten: '2 Loose Threads', portrait: 'inspector' },
  railroad: { role: 'cash', name: 'The Railroad Agent', hold: 7, resist: 'Legal', cycle: ['Raise Rates', 'Refuse'], portrait: 'railroad' },
  claimJumper: { role: 'engine', name: 'The Claim Jumper', hold: 6, weak: 'Dirty', cycle: ['Jump', 'Scout'], movesFirst: 'Scout', whenBeaten: 'Starts 2 fires', portrait: 'claimJumper' },
  speculator: { role: 'cash', name: 'The Speculator', hold: 7, weak: 'Legal', cycle: ['Short', 'Margin Call', 'Rumours'], round3: 'Paper Promise', whenBeaten: 'Price recovers', portrait: 'speculator' },
  baron: { role: 'boss', name: 'The Rival Baron', hold: 20, weak: 'Dirty', resist: 'Legal', cycle: ['Sabotage', 'Lease', 'Arson'], movesFirst: 'Arson', portrait: 'baron' },
  // stage 2
  muckraker: { role: 'cash', name: 'The Muckraker', hold: 9, weak: 'Legal', cycle: ['Dig', 'Expose', 'Headline'], round3: 'Front Page', whenBeaten: 'Retraction: −1 Board Exposure', portrait: 'muckraker' },
  combine: { role: 'cash', name: 'The Combine', hold: 9, resist: 'Legal', cycle: ['Price War', 'Rebate', 'Squeeze'], whenBeaten: 'Prices and freight recover', portrait: 'combine' },
  clawback: { role: 'cash', name: 'The Clawback Committee', hold: 8, weak: 'Dirty', cycle: ['Clawback', 'Minutes'], movesFirst: 'Minutes', whenBeaten: '−1 Board Exposure', portrait: 'clawback' },
  patentHolder: { role: 'engine', name: 'The Patent Holder', hold: 10, weak: 'Legal', cycle: ['Cease and Desist', 'Royalty'], round3: 'Injunction', portrait: 'patentHolder' },
  saboteur: { role: 'engine', name: 'The Saboteur', hold: 8, weak: 'Dirty', cycle: ['Wreck', 'Infiltrate'], movesFirst: 'Infiltrate', whenBeaten: 'Starts a fire', portrait: 'saboteur' },
  commission: { role: 'engine', name: 'The Railroad Commission', hold: 10, weak: 'Dirty', cycle: ['Proration', 'Inspection'], round3: 'Shut-in', portrait: 'commission' },
  proxyFight: { role: 'boss', name: 'The Proxy Fight', hold: 24, weak: 'Legal', resist: 'Dirty', cycle: ['Hostile Bid', 'Proxy Ballot', 'The Vote'], movesFirst: 'Canvass', portrait: 'proxyFight' },
}

// Round 1 takes your cash, round 2 breaks your engine, round 3 sends one of each.
export const CASH_POOL: ThreatKind[] = ['inspector', 'railroad', 'speculator']
export const ENGINE_POOL: ThreatKind[] = ['blowout', 'strike', 'claimJumper']
export const CASH_POOLS: Record<number, ThreatKind[]> = { 1: CASH_POOL, 2: ['muckraker', 'combine', 'clawback'] }
export const ENGINE_POOLS: Record<number, ThreatKind[]> = { 1: ENGINE_POOL, 2: ['patentHolder', 'saboteur', 'commission'] }
export const BOSS: Record<number, ThreatKind> = { 1: 'baron', 2: 'proxyFight' }
export const ROLE_LABEL: Record<ThreatRole, string> = { cash: 'Takes your cash', engine: 'Breaks your engine', boss: 'Boss' }

export type ModKey = 'drySeason' | 'glut' | 'hardRock' | 'bankSqueeze' | 'badWeather' | 'boomtown' | 'scandal'
export const MODS: Record<ModKey, { name: string; text: string; stages?: number[] }> = {
  drySeason: { name: 'Dry Season', text: 'Every outbreak starts 1 extra fire', stages: [1] },
  scandal: { name: 'Scandal', text: '+1 Board Exposure as the round begins', stages: [2] },
  glut: { name: 'Glut', text: 'Oil sells −$1' },
  hardRock: { name: 'Hard Rock', text: 'Prospect costs +1 AP' },
  bankSqueeze: { name: 'Bank Squeeze', text: 'Debt +$1 a turn' },
  badWeather: { name: 'Bad Weather', text: 'Draw 1 fewer card' },
  boomtown: { name: 'Boomtown', text: 'Oil +$1, debt +$1' },
}

export type ItemKey = 'storageTank' | 'silo' | 'steamPump' | 'lookout' | 'accountant' | 'refinery' | 'pipeline' | 'offshore' | 'boardGrudge' | 'loyalDirectors'
// stages: which stages' shops sell it (all if unset); never: a residue item, only ever given
export const ITEMS: Record<ItemKey, { name: string; text: string; price: number; repeatable?: boolean; icon: Icon; stages?: number[]; never?: boolean; negative?: boolean }> = {
  storageTank: { name: 'Storage Tank', text: '+2 oil storage', price: 4, repeatable: true, icon: 'barrels' },
  silo: { name: 'Silo', text: '+4 oil storage', price: 7, icon: 'barrels' },
  steamPump: { name: 'Steam Pump', text: '+1 AP every turn', price: 10, icon: 'derrick' },
  lookout: { name: 'Lookout', text: 'Enemies lose their opening move', price: 5, icon: 'telegraph' },
  accountant: { name: 'Accountant', text: 'Cover you don\'t use carries over to the next turn', price: 4, icon: 'deed' },
  refinery: { name: 'Refinery', text: 'Oil sells +$1', price: 8, icon: 'barrels', stages: [2] },
  pipeline: { name: 'Pipeline', text: 'No freight charges', price: 6, icon: 'barrels', stages: [2] },
  offshore: { name: 'Offshore Account', text: 'Enemies take 1 less gold from your fortune', price: 5, icon: 'cashbox', stages: [2] },
  boardGrudge: { name: 'Board Grudge', text: 'The board takes $1 every shop visit', price: 0, icon: 'redtape', never: true, negative: true },
  loyalDirectors: { name: 'Loyal Directors', text: '+1 AP in boss fights', price: 0, icon: 'shares', never: true },
}

// Before the boss: one small, single-use item, bought with gold. Beat the boss: a
// bigger, lasting one of a different type.
export type BoonType = 'ap' | 'wells' | 'fire' | 'cash' | 'storage'
export type BoonKey = 'spareHand' | 'spareRigs' | 'fireBrigade' | 'inheritance' | 'tempSilo'
export const BOONS: Record<BoonKey, { name: string; text: string; type: BoonType; icon: Icon }> = {
  spareHand: { name: 'A Spare Hand', text: '+1 AP on your first turn against the boss.', type: 'ap', icon: 'cudgels' },
  spareRigs: { name: 'Spare Rigs', text: '2 Well cards in your first hand against the boss.', type: 'wells', icon: 'derrick' },
  fireBrigade: { name: 'Fire Brigade', text: 'A Fire Brigade card for your deck.', type: 'fire', icon: 'hose' },
  inheritance: { name: 'Inheritance', text: `A card that gives $${CONFIG.inheritance} once, then is gone.`, type: 'cash', icon: 'will' },
  tempSilo: { name: 'Temporary Silo', text: `+${CONFIG.tempSilo} oil storage for the boss fight.`, type: 'storage', icon: 'barrels' },
}
export type RewardKey = 'steamPump' | 'dividends' | 'silo' | 'wildcatRights'
export const REWARDS: Record<RewardKey, { name: string; text: string; type: BoonType; icon: Icon }> = {
  steamPump: { name: 'Steam Pump', text: '+1 AP every turn.', type: 'ap', icon: 'derrick' },
  dividends: { name: 'Dividends', text: `A card that gives $${CONFIG.dividends} every time you play it.`, type: 'cash', icon: 'shares' },
  silo: { name: 'Silo', text: '+4 oil storage, for good.', type: 'storage', icon: 'barrels' },
  wildcatRights: { name: 'Wildcat Rights', text: '2 Wildcat Well cards for your deck.', type: 'wells', icon: 'derrick' },
}
