// Card, enemy, item and modifier definitions for Oil, stages 1 to 4.
import { CONFIG } from './config'

export type Family = 'Legal' | 'Dirty' | 'Bury' | 'Lobby' | 'Water' | 'Production' | 'Defence' | 'Tempo' | 'Skim' | 'Fortune' | 'Board' | 'Scrap' | 'Junk'
export type Icon = 'derrick' | 'plot' | 'barrels' | 'fire' | 'bucket' | 'cudgels' | 'deed' | 'telegraph' | 'dynamite' | 'gear' | 'timber' | 'hose' | 'envelope' | 'graft'
  | 'wages' | 'sheriff' | 'will' | 'shares' | 'cashbox' | 'redtape' | 'iou' | 'phone' | 'infiltrate'
  // stage 2 (Art Deco)
  | 'telegraphLine' | 'tickerTape' | 'nightShift' | 'efficiencyExpert' | 'streamline' | 'shredFiles' | 'scrapParts' | 'cleanHouse' | 'patentThicket' | 'espionage' | 'poachEngineer' | 'rdSprint' | 'payDividend' | 'personalLawyer' | 'securityDetail' | 'insurance' | 'expenseAccount' | 'refinery' | 'offshore' | 'pumpingStation' | 'pressOffice' | 'fillingStations' | 'auditingFirm'
  // stage 3 (1970s): icons still to be drawn fall back to these names, so keep them listed
  | 'embargoRumours' | 'queuesAtPump' | 'telex' | 'memo' | 'restructure' | 'personalGuarantee' | 'dipTrust' | 'buryEvidence' | 'lobbyCongress'
  | 'thinkTank' | 'bribeOfficial' | 'retainCounsel' | 'deadWeight' | 'dryLease' | 'draftDeclaration' | 'rolodex' | 'paperShredder' | 'supertanker' | 'rig'
  | 'advertorial' | 'buyOut' | 'oilShock' | 'cleanImage' | 'onFile'
  // era-correct art for older stock: stage 1 items, stage 2 junk and the Steel Derrick, stage 3 boons
  | 'steamPump' | 'storageTank' | 'steelDerrick' | 'ceaseDesist' | 'patentClaim' | 'proxyBallot' | 'spareHand3' | 'inheritance3' | 'tempSilo3'
  // stage 4 (2010s): items without their own art yet borrow one through src/ui/icons.ts
  | 'recycling' | 'propaganda' | 'onThePayroll' | 'climateBreakdown' | 'astroturfing' | 'carbonFootprint' | 'influencers' | 'ecoRebrand'
  | 'sustainabilityReport' | 'bridgeFuel' | 'netZero' | 'greenProject' | 'worldBank' | 'rig4' | 'compensationClaim'
  | 'lobbyist' | 'strategicReserve' | 'prAgency' | 'fossilSubsidy' | 'offshoreTrust' | 'carbonOffsets' | 'carbonCapture' | 'slushFund'

export type CardKey =
  | 'prospect' | 'well' | 'wildcat' | 'hiredHand' | 'lawyerUp' | 'shoreUp' | 'bucket' | 'fireBrigade'
  | 'improveGear' | 'hardGraft' | 'pettyCash' | 'payWages' | 'dynamite' | 'bribe' | 'telegram'
  | 'looseThread' | 'badBlood' | 'badBloodLate' | 'marginCall' | 'iou' | 'payOff' | 'infiltrate' | 'inheritance' | 'dividends'
  // stage 2
  | 'oldProspect' | 'telegraphLine' | 'tickerTape' | 'nightShift' | 'efficiencyExpert'
  | 'streamline' | 'shredFiles' | 'scrapParts' | 'cleanHouse' | 'patentThicket' | 'espionage' | 'poachEngineer'
  | 'rdSprint' | 'payDividend' | 'personalLawyer' | 'ceaseDesist' | 'proxyBallot'
  | 'derrick' | 'securityDetail' | 'insurance' | 'expenseAccount' | 'patentClaim'
  // stage 3
  | 'embargoRumours' | 'queuesAtPump' | 'telex' | 'memo' | 'restructure' | 'personalGuarantee' | 'dipTrust'
  | 'buryEvidence' | 'lobbyCongress' | 'thinkTank' | 'bribeOfficial' | 'retainCounsel' | 'deadWeight' | 'dryLease' | 'draftDeclaration'
  | 'advertorial' | 'buyOut' | 'oilShock' | 'rig'
  // stage 4
  | 'recycling' | 'propaganda' | 'onThePayroll' | 'climateBreakdown' | 'astroturfing' | 'sustainabilityReport' | 'carbonCapture'
  | 'bridgeFuel' | 'carbonOffsets' | 'influencers' | 'greenProject' | 'compensationClaim'

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
  heat?: number // change to Heat when played (stage 3)
  roundBoost?: number // oil sells this much more for the rest of the round (Queues at the Pump)
  memo?: boolean // discard the rest of your hand, draw that many +1
  doubleSale?: boolean // your next oil sale this turn pays double (the Oil Shock)
  poison?: number[] // more damage of the same family as each of your next turns ends (Infiltrate)
  clock?: number // stage 4: moves the Truth clock (−1: back an hour)
  apBack?: number // AP gained when played (On the Payroll)
  recycle?: boolean // shuffles your discard pile into your draw pile (Recycling)
  amplify?: boolean // the next card's Hold damage or Cover is doubled (Influencers)
  sticky?: boolean // stays in your hand from turn to turn until you play it (Green Project)
  backfire?: number // chance a clock card does the opposite (Carbon Offsets)
  capture?: boolean // the next move that would move the clock on doesn't (Carbon Capture)
  unique?: boolean // only one in the game: can't be duplicated, and never offered again once yours
}

export const CARDS: Record<CardKey, CardDef> = {
  prospect: { name: 'Prospect', ap: 2, cost: 0, uses: 1, family: 'Production', power: 0, plots: 2, wells: 2, icon: 'plot', price: 3,
    text: 'Claim 2 plots. 2 Well cards to your hand.', flavour: 'Somewhere under here.' },
  well: { name: 'Well', ap: 1, cost: 0, uses: 1, family: 'Production', power: 1, icon: 'derrick',
    text: `+1 oil a turn. Runs dry after ${CONFIG.wellReserve}.`, flavour: 'Black gold. A brighter future.' },
  wildcat: { name: 'Wildcat Well', ap: 1, cost: 0, uses: 1, family: 'Production', power: 2, icon: 'derrick', price: 6, rarity: 'Uncommon',
    text: `+2 oil a turn. Runs dry after ${CONFIG.wildcatReserve}.`, flavour: 'Drill deeper. Ask later.' },
  hiredHand: { name: 'Hired Hand', ap: 1, cost: 0, uses: null, family: 'Dirty', power: 2, icon: 'cudgels', price: 3, rarity: 'Common',
    text: 'Remove 2 Hold.', flavour: 'A firm word, and a firmer grip.' },
  lawyerUp: { name: 'Lawyer Up', ap: 1, cost: 2, uses: null, family: 'Legal', power: 3, icon: 'deed', price: 4, rarity: 'Common',
    text: 'Pay $2. Remove 3 Hold.', flavour: 'The paperwork always wins (eventually).' },
  shoreUp: { name: 'Shore Up', ap: 1, cost: 0, uses: null, family: 'Defence', power: 0, stop: true, oncePerRound: true, icon: 'timber', price: 3, rarity: 'Common',
    text: 'Block one enemy move.', flavour: 'More timber. More rope.' },
  bucket: { name: 'Bucket of Water', ap: 1, cost: 0, uses: null, family: 'Water', power: 1, icon: 'bucket',
    text: 'Put out one fire.', flavour: "It won't stop the well, but it might buy a moment." },
  fireBrigade: { name: 'Fire Brigade', ap: 1, cost: 0, uses: null, family: 'Water', power: 3, icon: 'hose', price: 4, rarity: 'Common',
    text: 'Put out every fire.', flavour: 'For a fee.' },
  improveGear: { name: 'Improve Gear', ap: 1, cost: 1, uses: null, family: 'Defence', power: 0, cover: 4, icon: 'gear',
    text: 'Pay $1. +4 Cover this turn.', flavour: 'Stronger timber, fewer accidents.' },
  hardGraft: { name: 'Hard Graft', ap: 0, cost: 0, uses: null, oncePerRound: true, family: 'Tempo', power: 1, icon: 'graft', price: 4, rarity: 'Uncommon',
    text: '+1 AP. Once per fight.', flavour: 'Sleep is for shareholders.' },
  pettyCash: { name: 'Petty Cash', ap: 0, cost: 0, uses: 3, family: 'Skim', power: 1, icon: 'cashbox',
    text: 'Skim 1 gold.', flavour: 'Necessary expenses.' },
  payWages: { name: 'Pay Wages', ap: 1, cost: 2, uses: null, family: 'Dirty', power: 4, icon: 'wages', price: 1, rarity: 'Common',
    text: 'Pay $2. Remove 4 Hold.', flavour: 'Loyalty, by the week.' },
  dynamite: { name: 'Dynamite', ap: 1, cost: 0, uses: 1, family: 'Dirty', badBlood: true, power: 6, icon: 'dynamite', price: 5, rarity: 'Uncommon',
    text: 'Remove 6 Hold. Adds Bad Blood.', flavour: 'An unfortunate accident.' },
  bribe: { name: 'Bribe the Sheriff', ap: 1, cost: 2, uses: null, family: 'Dirty', badBlood: true, power: 5, icon: 'sheriff', price: 5, rarity: 'Uncommon',
    text: 'Pay $2. Remove 5 Hold. Adds Bad Blood.', flavour: 'A contribution to local order.' },
  payOff: { name: 'Grease a Palm', ap: 1, cost: 0, gold: CONFIG.bribeGold, chance: CONFIG.bribeChance, uses: null, family: 'Dirty', power: CONFIG.bribeDamage, icon: 'envelope', price: 4, rarity: 'Uncommon',
    text: `Pay ${CONFIG.bribeGold} gold. ${Math.round(CONFIG.bribeChance * 100)}%: remove ${CONFIG.bribeDamage} Hold. Else Bad Blood.`, flavour: 'Everyone has a price. Most of them remember it.' },
  infiltrate: { name: 'Infiltrate', ap: 2, cost: 0, uses: null, family: 'Dirty', power: 3, poison: [2, 1], icon: 'infiltrate', price: 4, rarity: 'Common',
    text: 'Remove 3 Hold. 2 more next turn, then 1.', flavour: 'A new man on the payroll. Theirs, then ours.' },
  inheritance: { name: 'Inheritance', ap: 0, cost: 0, uses: 1, family: 'Tempo', power: 0, icon: 'will',
    text: `+$${CONFIG.inheritance}. Then it's gone.`, flavour: 'Grandfather would have wanted you to have it.' },
  dividends: { name: 'Dividends', ap: 1, cost: 0, uses: null, family: 'Tempo', power: CONFIG.dividends, icon: 'shares',
    text: `+$${CONFIG.dividends}.`, flavour: 'Paid to the people who matter.' },
  telegram: { name: 'Send a Telegram', ap: 1, cost: 3, uses: 1, family: 'Tempo', power: 0, icon: 'telegraph', price: 3, rarity: 'Common',
    text: 'Pay $3. A random attack card, free to play.', flavour: 'STOP. SEND HELP. STOP.' },
  looseThread: { name: 'Loose Thread', ap: 0, cost: 1, uses: null, family: 'Junk', power: 0, icon: 'redtape', forced: true, junk: true,
    text: 'Must play. Lose $1.', flavour: 'Someone kept a copy.' },
  // from stage 3 there are no fires: Bad Blood costs you money instead
  badBloodLate: { name: 'Bad Blood', ap: 0, cost: CONFIG.badBloodCost, uses: 2, family: 'Junk', power: 0, icon: 'redtape', forced: true, junk: true,
    text: `Must play. Pay $${CONFIG.badBloodCost}.`, flavour: 'They remember. They send invoices.' },
  badBlood: { name: 'Bad Blood', ap: 0, cost: 0, uses: 2, family: 'Junk', power: 0, icon: 'fire', forced: true, junk: true,
    text: 'Must play. 1 in 3 chance of a fire.', flavour: 'They remember. For a while.' },
  marginCall: { name: 'Margin Call', ap: 1, cost: 2, uses: 1, family: 'Junk', power: 0, icon: 'phone', forced: true, junk: true,
    text: 'Must play. Pay $2.', flavour: 'Payable on demand.' },
  iou: { name: 'IOU', ap: 1, cost: 1, uses: 1, family: 'Junk', power: 0, icon: 'iou', junk: true,
    text: '−$1 a turn while held. Pay $1 to clear it.', flavour: 'Signed in haste.' },

  // ---------------------------------------------------------------- stage 2 (Art Deco)
  oldProspect: { name: 'Worn Prospect', ap: 2, cost: 0, uses: 1, family: 'Production', power: 0, plots: 0, wells: 1, icon: 'plot',
    text: '1 Well card to your hand. No new land.', flavour: 'Every inch of it already drilled.' },
  telegraphLine: { name: 'Telegraph Line', era: 2, ap: 0, cost: 0, uses: null, family: 'Tempo', power: 0, draw: 1, icon: 'telegraphLine', price: 5, rarity: 'Common',
    text: 'Draw 1 card.', flavour: 'Word travels. Yours first.' },
  tickerTape: { name: 'Ticker Tape', era: 2, ap: 1, cost: 0, uses: null, family: 'Tempo', power: 1, draw: 2, icon: 'tickerTape', price: 6, rarity: 'Uncommon',
    text: 'Draw 2 cards. Oil sells +$1 this turn.', flavour: 'Buy on the rumour.' },
  nightShift: { name: 'Night Shift', era: 2, ap: 0, cost: 0, uses: null, family: 'Tempo', power: 2, apNext: 1, icon: 'nightShift', price: 5, rarity: 'Common',
    text: '+2 AP now. −1 AP next turn.', flavour: 'The lamps never go out.' },
  efficiencyExpert: { name: 'Efficiency Expert', era: 2, ap: 1, cost: 2, uses: null, family: 'Tempo', power: 0, draw: 3, icon: 'efficiencyExpert', price: 6, rarity: 'Common',
    text: 'Pay $2. Draw 3 cards.', flavour: 'He has timed your lunch.' },
  streamline: { name: 'Streamline', era: 2, ap: 1, cost: 0, uses: null, family: 'Scrap', power: 0, scrap: 'one', icon: 'streamline', price: 5, rarity: 'Common',
    text: 'Destroy a card in hand.', flavour: 'Fewer moving parts.' },
  shredFiles: { name: 'Shred the Files', era: 2, ap: 0, cost: 0, uses: null, family: 'Scrap', power: 0, scrap: 'one', exposure: 1, icon: 'shredFiles', price: 4, rarity: 'Common',
    text: 'Destroy a card in hand. +1 Board Exposure.', flavour: 'What files?' },
  scrapParts: { name: 'Scrap for Parts', era: 2, ap: 0, cost: 0, uses: null, family: 'Scrap', power: 0, scrap: 'one', goldBack: 2, icon: 'scrapParts', price: 5, rarity: 'Common',
    text: 'Destroy a card in hand. +$2.', flavour: 'Waste not.' },
  cleanHouse: { name: 'Clean House', era: 2, ap: 1, cost: 0, uses: null, family: 'Scrap', power: 0, scrap: 'junk', icon: 'cleanHouse', price: 6, rarity: 'Uncommon',
    text: 'Destroy all junk in your hand. Draw that many.', flavour: 'Under new management.' },
  patentThicket: { name: 'Patent Thicket', era: 2, ap: 1, cost: 2, uses: null, family: 'Legal', power: 7, icon: 'patentThicket', price: 7, rarity: 'Common',
    text: 'Pay $2. Remove 7 Hold.', flavour: 'Forty patents. One invention.' },
  espionage: { name: 'Industrial Espionage', era: 2, ap: 1, cost: 0, uses: null, family: 'Dirty', power: 9, exposure: 1, icon: 'espionage', price: 8, rarity: 'Uncommon',
    text: 'Remove 9 Hold. +1 Board Exposure.', flavour: 'Their blueprints, your letterhead.' },
  poachEngineer: { name: 'Poach an Engineer', era: 2, ap: 1, cost: 0, uses: null, family: 'Dirty', power: 5, draw: 1, icon: 'poachEngineer', price: 6, rarity: 'Common',
    text: 'Remove 5 Hold. Draw 1 card.', flavour: 'Double the salary. Half the scruples.' },
  rdSprint: { name: 'R&D Sprint', era: 2, ap: 1, cost: 0, uses: null, family: 'Production', power: 1, icon: 'rdSprint', price: 6, rarity: 'Uncommon',
    text: '+1 oil from every Well and Field now.', flavour: 'Results by Friday.' },
  payDividend: { name: 'Pay a Dividend', era: 2, ap: 1, cost: 3, uses: null, family: 'Board', power: 0, exposure: -1, icon: 'payDividend', price: 4, rarity: 'Common',
    text: 'Pay $3. −1 Board Exposure.', flavour: 'Gentlemen, a token of our esteem.' },
  personalLawyer: { name: 'Personal Lawyer', era: 2, ap: 1, cost: 0, uses: null, family: 'Defence', power: 0, icon: 'personalLawyer', price: 5, rarity: 'Common',
    text: 'Blocks the next gold an enemy takes this turn.', flavour: 'Retained for the family.' },
  ceaseDesist: { name: 'Cease and Desist', era: 2, ap: 1, cost: 0, uses: 1, family: 'Junk', power: 0, icon: 'ceaseDesist', forced: true, junk: true,
    text: 'Must play. Does nothing.', flavour: 'Pursuant to patent No. 1,042,117.' },
  proxyBallot: { name: 'Proxy Ballot', era: 2, ap: 0, cost: 0, uses: 1, family: 'Junk', power: 0, exposure: 1, icon: 'proxyBallot', forced: true, junk: true,
    text: 'Must play. +1 Board Exposure. Then it\'s gone.', flavour: 'Signed on behalf of a widow in Ohio.' },
  patentClaim: { name: 'New Patent Claim', era: 2, ap: null, cost: 0, uses: 1, family: 'Junk', power: 0, icon: 'patentClaim', junk: true,
    text: "Can't be played. Gone at the end of the turn.", flavour: 'Patent pending. Everything pending.' },
  derrick: { name: 'Steel Derrick', era: 2, ap: 1, cost: 0, uses: 1, family: 'Production', power: 1, icon: 'steelDerrick', price: CONFIG.derrickPrice,
    text: 'Build a Well: 1 oil a turn, never dry.', flavour: 'Riveted, not nailed.' },
  securityDetail: { name: 'Security Detail', era: 2, ap: 1, cost: 0, uses: null, family: 'Defence', power: 0, stop: true, oncePerRound: true, cover: 2, icon: 'securityDetail', price: 6, rarity: 'Common',
    text: 'Block one enemy move. +2 Cover.', flavour: 'Men in good suits, standing very still.' },
  insurance: { name: 'Insurance Policy', era: 2, ap: 1, cost: 1, uses: null, family: 'Defence', power: 0, cover: 5, icon: 'insurance', price: 5, rarity: 'Common',
    text: 'Pay $1. +5 Cover this turn.', flavour: 'Acts of God excluded. Acts of you, also excluded.' },
  expenseAccount: { name: 'Expense Account', era: 2, ap: 0, cost: 0, uses: null, family: 'Skim', power: 1, exposure: 1, icon: 'expenseAccount', price: 5, rarity: 'Common',
    text: 'Skim 1 gold at the rate. +1 Board Exposure.', flavour: 'Entertaining clients. Some of them real.' },

  // ---------------------------------------------------------------- stage 3 (1970s)
  embargoRumours: { name: 'Embargo Rumours', era: 3, ap: 1, cost: 0, uses: null, family: 'Tempo', power: 1, icon: 'embargoRumours', price: 15, rarity: 'Common',
    text: 'Oil sells +$1 this turn.', flavour: 'A source close to the ministry.' },
  queuesAtPump: { name: 'Queues at the Pump', era: 3, ap: 2, cost: 0, uses: null, family: 'Tempo', power: 0, roundBoost: 2, icon: 'queuesAtPump', price: 22, rarity: 'Uncommon',
    text: 'Oil sells +$2 for the rest of the round.', flavour: 'Odd plates on Mondays.' },
  telex: { name: 'Telex', era: 3, ap: 1, cost: 0, uses: null, family: 'Tempo', power: 0, draw: 3, icon: 'telex', price: 18, rarity: 'Common',
    text: 'Draw 3 cards.', flavour: 'URGENT URGENT URGENT.' },
  memo: { name: 'Memo', era: 3, ap: 1, cost: 0, uses: null, family: 'Tempo', power: 0, memo: true, icon: 'memo', price: 15, rarity: 'Common',
    text: 'Discard your hand. Draw that many, plus 1.', flavour: 'Per my last memo.' },
  restructure: { name: 'Restructure', era: 3, ap: 1, cost: 0, uses: null, family: 'Scrap', power: 0, scrap: 'one', draw: 1, icon: 'restructure', price: 15, rarity: 'Common',
    text: 'Destroy a card in hand. Draw 1 card.', flavour: 'Synergies have been identified.' },
  personalGuarantee: { name: 'Personal Guarantee', era: 3, ap: 1, cost: 0, gold: 1, uses: null, family: 'Fortune', power: CONFIG.personalGuaranteeCash, icon: 'personalGuarantee', price: 12, rarity: 'Common',
    text: `Pay 1 gold. +$${CONFIG.personalGuaranteeCash}.`, flavour: 'Your word. Your house.' },
  dipTrust: { name: 'Dip into the Trust', era: 3, ap: 0, cost: 0, gold: CONFIG.dipTrustGold, uses: 1, family: 'Fortune', power: CONFIG.dipTrustCash, icon: 'dipTrust', price: 15, rarity: 'Uncommon',
    text: `Pay ${CONFIG.dipTrustGold} gold. +$${CONFIG.dipTrustCash}. Then it's gone.`, flavour: 'The children will understand.' },
  buryEvidence: { name: 'Bury Evidence', era: 3, ap: 1, cost: 0, uses: null, family: 'Bury', power: 6, icon: 'buryEvidence', price: 18, rarity: 'Common',
    text: 'Remove 6 Hold.', flavour: 'Filed under Miscellaneous.' },
  lobbyCongress: { name: 'Lobby Congress', era: 3, ap: 1, cost: 6, uses: null, family: 'Lobby', power: 9, heat: -6, icon: 'lobbyCongress', price: 20, rarity: 'Common',
    text: 'Pay $6. Remove 9 Hold. −6 Heat.', flavour: 'Dinner, then a quiet word.' },
  thinkTank: { name: 'Fund a Think Tank', era: 3, ap: 1, cost: 5, uses: null, family: 'Lobby', power: 0, heat: -10, icon: 'thinkTank', price: 22, rarity: 'Uncommon',
    text: 'Pay $5. −10 Heat.', flavour: 'Independent research, independently funded by us.' },
  bribeOfficial: { name: 'Bribe an Official', era: 3, ap: 1, cost: 3, uses: null, family: 'Dirty', power: 8, icon: 'bribeOfficial', price: 18, rarity: 'Common',
    text: `Pay $3. Remove 8 Hold. Scandal +${CONFIG.bribeFeedsScandal} Hold.`, flavour: 'A consultancy fee.' },
  retainCounsel: { name: 'Retain Counsel', era: 3, ap: 1, cost: 2, uses: null, family: 'Legal', power: 7, icon: 'retainCounsel', price: 18, rarity: 'Common',
    text: 'Pay $2. Remove 7 Hold.', flavour: 'Billed in six-minute units.' },
  advertorial: { name: 'Advertorial', era: 3, ap: 1, cost: 4, uses: null, family: 'Defence', power: 0, cover: 6, icon: 'advertorial', price: 15, rarity: 'Common',
    text: 'Pay $4. +6 Cover this turn. Blocks Heat too.', flavour: 'Paid opinion, opposite the editorial page.' },
  buyOut: { name: 'Buy Out', era: 3, ap: 1, cost: 8, uses: null, family: 'Legal', power: 14, icon: 'buyOut', price: 20, rarity: 'Uncommon',
    text: 'Pay $8. Remove 14 Hold.', flavour: 'Everyone has a number.' },
  oilShock: { name: 'Oil Shock', era: 3, ap: 0, cost: 0, uses: 1, family: 'Tempo', power: 0, doubleSale: true, icon: 'oilShock', price: 15, rarity: 'Rare',
    text: "Your next sale this turn pays double. Once a run.", flavour: 'October 1973. Thank you, gentlemen.' },
  rig: { name: 'Offshore Rig', era: 3, ap: 1, cost: 0, uses: 1, family: 'Production', power: CONFIG.rigOutput, icon: 'rig',
    text: `Build a Rig: ${CONFIG.rigOutput} oil a turn, never dry.`, flavour: 'Out where nobody can see.' },
  // ---------------------------------------------------------------- stage 4 (2010s)
  recycling: { name: 'Recycling', era: 4, ap: 1, cost: 0, uses: null, family: 'Tempo', power: 0, recycle: true, draw: 2, icon: 'recycling', price: 25, rarity: 'Common',
    text: 'Shuffle your discard pile into your draw pile. Draw 2 cards.', flavour: 'It goes somewhere.' },
  propaganda: { name: 'Propaganda', era: 4, ap: 1, cost: 0, uses: null, family: 'Lobby', power: 10, draw: 1, icon: 'propaganda', price: 28, rarity: 'Common',
    text: 'Remove 10 Hold. Draw 1 card.', flavour: 'Sponsored content.' },
  onThePayroll: { name: 'On the Payroll', era: 4, ap: 1, cost: 4, uses: null, family: 'Legal', power: 10, apBack: 1, icon: 'onThePayroll', price: 30, rarity: 'Common',
    text: 'Pay $4. Remove 10 Hold. +1 AP.', flavour: 'A friend in committee.' },
  climateBreakdown: { name: 'Climate Breakdown', era: 4, ap: 1, cost: 0, uses: null, family: 'Dirty', power: 12, roundBoost: 2, icon: 'climateBreakdown', price: 30, rarity: 'Uncommon',
    text: 'Remove 12 Hold. Oil sells +$2 for the rest of the round.', flavour: 'Scarcity is a market opportunity.' },
  astroturfing: { name: 'Astroturfing', era: 4, ap: 1, cost: 0, uses: null, family: 'Dirty', power: 7, cover: 4, icon: 'astroturfing', price: 25, rarity: 'Common',
    text: 'Remove 7 Hold. +4 Cover.', flavour: 'Concerned Citizens for Energy Freedom.' },
  sustainabilityReport: { name: 'Sustainability Report', era: 4, ap: 1, cost: 0, uses: null, family: 'Bury', power: 9, draw: 1, icon: 'sustainabilityReport', price: 25, rarity: 'Common',
    text: 'Remove 9 Hold. Draw 1 card.', flavour: 'Forty pages. Mostly photographs.' },
  carbonCapture: { name: 'Carbon Capture', era: 4, ap: 1, cost: 5, uses: null, capture: true, family: 'Defence', power: 0, icon: 'carbonCapture', price: 30, rarity: 'Common',
    text: "Pay $5. The next move that would move the clock on doesn't.", flavour: 'Pilot scheme. Results expected in 2050.' },
  carbonOffsets: { name: 'Carbon Offsets', era: 4, ap: 1, cost: 4, uses: null, clock: -1, backfire: 0.25, family: 'Tempo', power: 0, icon: 'carbonOffsets', price: 30, rarity: 'Uncommon',
    text: 'Pay $4. The clock goes back 1 hour. 1 in 4: the forest burns down, and it goes on 1 instead.', flavour: 'A tree for every tanker.' },
  bridgeFuel: { name: 'Bridge Fuel', era: 4, ap: 0, cost: 0, uses: null, oncePerRound: true, family: 'Tempo', power: 2, icon: 'bridgeFuel', price: 30, rarity: 'Common',
    text: '+2 AP. Once per fight.', flavour: 'A bridge to a cleaner future. Toll applies.' },
  influencers: { name: 'Influencers', era: 4, ap: 0, cost: 3, uses: null, unique: true, amplify: true, family: 'Tempo', power: 0, icon: 'influencers', price: 35, rarity: 'Rare',
    text: "Pay $3. Your next card's Hold damage or Cover is doubled. Only one in the game.", flavour: '#ad #sponsored #blessed' },
  greenProject: { name: 'Green Project', era: 4, ap: 1, cost: 0, uses: 1, sticky: true, family: 'Junk', power: 0, junk: true, icon: 'greenProject',
    text: "Does nothing. Stays in your hand until you play it. Then it's gone.", flavour: 'Coming soon.' },
  compensationClaim: { name: 'Compensation Claim', era: 4, ap: 0, cost: CONFIG.claimCost, uses: 1, family: 'Junk', power: 0, forced: true, junk: true, icon: 'compensationClaim',
    text: `Must play. Pay $${CONFIG.claimCost}.`, flavour: 'Class action.' },
  deadWeight: { name: 'Dead Weight', era: 3, ap: null, cost: 0, uses: null, family: 'Junk', power: 0, junk: true, icon: 'deadWeight',
    text: "Can't be played. Does nothing.", flavour: 'It worked in its day.' },
  dryLease: { name: 'Dry Lease', era: 3, ap: 1, cost: 0, uses: 1, family: 'Junk', power: 0, junk: true, icon: 'dryLease',
    text: "Does nothing. Then it's gone.", flavour: 'The land is still yours. The oil is not.' },
  draftDeclaration: { name: 'Draft Declaration', era: 3, ap: 1, cost: 0, uses: 1, family: 'Junk', power: 0, forced: true, junk: true, icon: 'draftDeclaration',
    text: "Must play. Does nothing. Then it's gone.", flavour: 'Paragraph 4, sub-clause (c), bracketed.' },
}

/** Old cards fade at the start of stage 3: attacks remove 1 Hold, Cover cards give 1. */
export function fadedDef(d: CardDef): CardDef {
  const attack = ['Legal', 'Dirty'].includes(d.family) && d.power > 0
  const pay = `${d.gold ? `Pay ${d.gold} gold. ` : ''}${d.cost ? `Pay $${d.cost}. ` : ''}`
  if (attack) return { ...d, power: 1, chance: undefined, badBlood: false, draw: undefined, text: `${pay}Remove 1 Hold.` }
  if (d.cover) return { ...d, cover: 1, text: `${pay}${d.stop ? 'Block one enemy move. ' : ''}+1 Cover this turn.` }
  if (d.family === 'Tempo' && d.icon === 'shares') return { ...d, power: 1, text: '+$1.' } // Dividends
  return d
}

/** Upgraded versions (bought in the shop from stage 2, or at incorporation). Name gets a +. */
export const UPGRADES: Partial<Record<CardKey, Partial<CardDef>>> = {
  prospect: { ap: 1, text: 'Claim 2 plots. 2 Well cards to your hand.' },
  oldProspect: { plots: 1, text: 'Claim 1 plot. 1 Well card to your hand.' },
  hiredHand: { power: 3, text: 'Remove 3 Hold.' },
  infiltrate: { power: 4, poison: [3, 2], text: 'Remove 4 Hold. 3 more next turn, then 2.' },
  lawyerUp: { power: 5, text: 'Pay $2. Remove 5 Hold.' },
  shoreUp: { cover: 2, text: 'Block one enemy move. +2 Cover.' },
  bucket: { power: 2, text: 'Put out two fires.' },
  fireBrigade: { ap: 0, text: 'Put out every fire.' },
  improveGear: { cost: 0, cover: 5, text: '+5 Cover this turn.' },
  hardGraft: { power: 2, text: '+2 AP. Once per fight.' },
  pettyCash: { exposure: 0, text: 'Skim 1 gold. The board never sees it.' },
  payWages: { power: 6, text: 'Pay $2. Remove 6 Hold.' },
  dynamite: { power: 9, text: 'Remove 9 Hold. Adds Bad Blood.' },
  bribe: { badBlood: false, text: 'Pay $2. Remove 5 Hold.' },
  payOff: { chance: 0.75, text: `Pay ${CONFIG.bribeGold} gold. 75%: remove ${CONFIG.bribeDamage} Hold. Else Bad Blood.` },
  dividends: { power: 5, text: '+$5.' },
  telegram: { cost: 1, text: 'Pay $1. A random attack card, free to play.' },
  telegraphLine: { draw: 2, text: 'Draw 2 cards.' },
  tickerTape: { draw: 3, text: 'Draw 3 cards. Oil sells +$1 this turn.' },
  nightShift: { power: 3, text: '+3 AP now. −1 AP next turn.' },
  efficiencyExpert: { cost: 0, text: 'Draw 3 cards.' },
  streamline: { ap: 0, text: 'Destroy a card in hand.' },
  shredFiles: { exposure: 0, text: 'Destroy a card in hand.' },
  scrapParts: { goldBack: 3, text: 'Destroy a card in hand. +$3.' },
  cleanHouse: { ap: 0, text: 'Destroy all junk in your hand. Draw that many.' },
  patentThicket: { power: 10, text: 'Pay $2. Remove 10 Hold.' },
  espionage: { power: 12, text: 'Remove 12 Hold. +1 Board Exposure.' },
  poachEngineer: { power: 7, text: 'Remove 7 Hold. Draw 1 card.' },
  rdSprint: { power: 2, text: '+2 oil from every Well and Field now.' },
  payDividend: { exposure: -2, text: 'Pay $3. −2 Board Exposure.' },
  personalLawyer: { ap: 0, text: 'Blocks the next gold an enemy takes this turn.' },
  derrick: { ap: 0, text: 'Build a Well: 1 oil a turn, never dry.' },
  securityDetail: { cover: 4, text: 'Block one enemy move. +4 Cover.' },
  insurance: { cost: 0, cover: 7, text: '+7 Cover this turn.' },
  expenseAccount: { exposure: 0, text: 'Skim 1 gold at the rate. The board never sees it.' },
  // stage 3
  embargoRumours: { ap: 0, text: 'Oil sells +$1 this turn.' },
  queuesAtPump: { ap: 1, text: 'Oil sells +$2 for the rest of the round.' },
  telex: { draw: 4, text: 'Draw 4 cards.' },
  memo: { ap: 0, text: 'Discard your hand. Draw that many, plus 1.' },
  restructure: { name: 'Write It Off', goldBack: 2, text: 'Destroy a card in hand. Draw 1 card. +$2.' },
  personalGuarantee: { power: 8, text: 'Pay 1 gold. +$8.' },
  buryEvidence: { power: 9, text: 'Remove 9 Hold.' },
  lobbyCongress: { heat: -9, text: 'Pay $6. Remove 9 Hold. −9 Heat.' },
  advertorial: { cover: 9, text: 'Pay $4. +9 Cover this turn. Blocks Heat too.' },
  buyOut: { power: 18, text: 'Pay $8. Remove 18 Hold.' },
  thinkTank: { cost: 3, heat: -14, text: 'Pay $3. −14 Heat.' },
  bribeOfficial: { power: 11, text: `Pay $3. Remove 11 Hold. Scandal +${CONFIG.bribeFeedsScandal} Hold.` },
  retainCounsel: { power: 10, text: 'Pay $2. Remove 10 Hold.' },
  // stage 4
  recycling: { ap: 0, text: 'Shuffle your discard pile into your draw pile. Draw 2 cards.' },
  propaganda: { power: 13, text: 'Remove 13 Hold. Draw 1 card.' },
  onThePayroll: { power: 13, text: 'Pay $4. Remove 13 Hold. +1 AP.' },
  climateBreakdown: { power: 15, text: 'Remove 15 Hold. Oil sells +$2 for the rest of the round.' },
  astroturfing: { power: 9, cover: 6, text: 'Remove 9 Hold. +6 Cover.' },
  sustainabilityReport: { power: 12, text: 'Remove 12 Hold. Draw 1 card.' },
  carbonCapture: { cost: 2, text: "Pay $2. The next move that would move the clock on doesn't." },
  bridgeFuel: { power: 3, text: '+3 AP. Once per fight.' },
  carbonOffsets: { clock: -2, text: 'Pay $4. The clock goes back 2 hours. 1 in 4: the forest burns down, and it goes on 1 instead.' },
}

export const STARTER: CardKey[] = ['prospect', 'hiredHand', 'hiredHand', 'lawyerUp', 'shoreUp', 'bucket', 'bucket', 'improveGear', 'hardGraft']
export const SHOP_POOL: CardKey[] = ['hiredHand', 'lawyerUp', 'shoreUp', 'fireBrigade', 'payWages', 'dynamite', 'bribe', 'wildcat', 'telegram', 'hardGraft', 'payOff', 'infiltrate']
// stage 2 sells only stage 2 cards: better than stage 1's, and dearer
export const SHOP_POOL_2: CardKey[] = ['telegraphLine', 'tickerTape', 'nightShift', 'efficiencyExpert', 'streamline', 'shredFiles', 'scrapParts', 'cleanHouse',
  'patentThicket', 'espionage', 'poachEngineer', 'rdSprint', 'payDividend', 'personalLawyer', 'securityDetail', 'insurance', 'expenseAccount']
// stage 3: oil price boosts, faster cycling, destroying cards, gold into Capital, and the new defences
export const SHOP_POOL_3: CardKey[] = ['embargoRumours', 'queuesAtPump', 'telex', 'memo', 'tickerTape', 'restructure', 'personalGuarantee', 'dipTrust',
  'buryEvidence', 'lobbyCongress', 'thinkTank', 'bribeOfficial', 'retainCounsel', 'advertorial', 'buyOut', 'oilShock']
/** Stage 2 incorporation: pick incorporatePicks of these; the rest go on sale at the first Exchange visit. */
export const INCORPORATE_OFFER_2: CardKey[] = ['derrick', 'payDividend', 'patentThicket', 'tickerTape']
// stage 4: Big Oil's own stock, heavy on AP and draw
export const SHOP_POOL_4: CardKey[] = ['recycling', 'propaganda', 'onThePayroll', 'climateBreakdown', 'astroturfing', 'sustainabilityReport', 'carbonCapture',
  'bridgeFuel', 'carbonOffsets', 'influencers']
export const shopPool = (stage: number): CardKey[] => (stage >= 4 ? SHOP_POOL_4 : stage >= 3 ? SHOP_POOL_3 : stage >= 2 ? SHOP_POOL_2 : SHOP_POOL)
/** Going multinational: pick incorporatePicks of these; the rest go on sale at the first Trading Floor visit. */
export const INCORPORATE_OFFER_3: CardKey[] = ['buryEvidence', 'lobbyCongress', 'buyOut', 'advertorial']
/** Becoming Big Oil: pick incorporatePicks of these, one of each damage type; the rest go on sale at the first Investor Portal visit. */
/** Bad Blood: a fire risk in stages 1 and 2, a $5 bill from stage 3 (no fires). */
export const badBloodFor = (stage: number): CardKey => (stage >= 3 ? 'badBloodLate' : 'badBlood')
export const INCORPORATE_OFFER_4: CardKey[] = ['propaganda', 'onThePayroll', 'sustainabilityReport', 'astroturfing']
/** Old cards that are useless in stage 3: land cards become Dry Leases; fire and board cards, Dead Weight. Shore Up carries over, like Security Detail. */
export const TO_DRY_LEASE: CardKey[] = ['prospect', 'oldProspect', 'derrick', 'well', 'wildcat']
export const TO_DEAD_WEIGHT: CardKey[] = ['bucket', 'fireBrigade', 'payDividend']
/** Bribes: each one played feeds a Bribery Scandal. */
export const BRIBES: CardKey[] = ['bribe', 'payOff', 'bribeOfficial']
/** The land card each stage's shop always stocks: a Prospect in stage 1, a Steel Derrick (a Well) in stage 2. Stage 3 builds a Rig outright. */
export const PROSPECT_FOR: Record<number, CardKey> = { 1: 'prospect', 2: 'derrick' }
/** The fire card each stage's shop always stocks. */
export const WATER_FOR: Record<number, CardKey> = { 1: 'bucket' }
export const PROSPECTS: CardKey[] = ['prospect', 'oldProspect']
export const ATTACK_CARDS: CardKey[] = ['hiredHand', 'lawyerUp', 'dynamite']

export type BonusKey = 'extraProspect' | 'threeOil' | 'pettyCash' | 'gearGraft' | 'trustFund' | 'oldFaithful' | 'slushFund'
export const BONUSES: Record<BonusKey, { name: string; text: string }> = {
  extraProspect: { name: 'Extra Prospect', text: 'A second Prospect card in your deck.' },
  threeOil: { name: '3 Oil', text: 'Start with 3 barrels in the stockpile.' },
  pettyCash: { name: 'Petty Cash', text: 'Skim 1 gold for 0 AP. Three uses.' },
  gearGraft: { name: 'Improve Gear + Hard Graft', text: 'One more of each in your deck.' },
  trustFund: { name: 'Trust Fund', text: 'No Bank Debt in stage 1. Father has taken care of it.' },
  slushFund: { name: 'Slush Fund', text: `An item for the whole run: +${CONFIG.slushFundCover} Cover every turn.` },
  oldFaithful: { name: 'Old Faithful', text: 'Start with a Well that never runs dry and nothing can touch. It stops in a fire.' },
}

export type ThreatKind = 'blowout' | 'strike' | 'inspector' | 'railroad' | 'claimJumper' | 'speculator' | 'baron'
  | 'muckraker' | 'combine' | 'clawback' | 'patentHolder' | 'saboteur' | 'commission' | 'proxyFight'
  | 'spill' | 'rivals' | 'climateScience' | 'diversified' | 'briberyScandal' | 'geneva'
  | 'fracking' | 'greenAlternatives' | 'deepwaterDisaster' | 'spilledTanker' | 'greenPoliticians' | 'war' | 'truth'

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
  cover?: number // Cover it gets each turn: blocks that much of your damage (doesn't stack)
  whenBeaten?: string
  rule?: string // a standing rule shown on its panel (the Bank Inspector's reserves)
  chip?: number // stage 3: $ every move also takes, on top of what the move does (Cover blocks it)
  ticks?: number[] // stage 4: the moves in its cycle (0-based) that move the Truth clock on an hour
  portrait: string
}

export const THREATS: Record<ThreatKind, ThreatDef> = {
  blowout: { role: 'engine', name: 'The Blowout', hold: 5, immune: 'Legal', cycle: ['Rumble', 'Spray', 'Blow'], whenBeaten: 'Gusher: +3 oil', portrait: 'blowout' },
  strike: { role: 'engine', name: 'The Strike', hold: 8, weak: 'Dirty', cycle: ['Picket', 'Sabotage'], round3: 'Torch', movesFirst: 'Walkout', portrait: 'strike' },
  inspector: { role: 'cash', name: 'The Bank Inspector', hold: 6, weak: 'Legal', immune: 'Dirty', cycle: ['Audit', 'Fine'], whenBeaten: '2 Loose Threads in your deck (must play, −$1 each)', portrait: 'inspector',
    rule: `End a turn with $${CONFIG.inspectorReserve} or more and he loses ${CONFIG.inspectorReserveDamage} Hold.` },
  railroad: { role: 'cash', name: 'The Railroad Agent', hold: 7, resist: 'Legal', cycle: ['Raise Rates', 'Refuse'], portrait: 'railroad' },
  claimJumper: { role: 'engine', name: 'The Claim Jumper', hold: 6, weak: 'Dirty', cycle: ['Jump', 'Scout'], movesFirst: 'Scout', whenBeaten: 'Starts a fire', portrait: 'claimJumper' },
  speculator: { role: 'cash', name: 'The Speculator', hold: 7, weak: 'Legal', cycle: ['Short', 'Margin Call', 'Rumours'], round3: 'Paper Promise', whenBeaten: 'Price recovers', portrait: 'speculator' },
  baron: { role: 'boss', name: 'The Rival Baron', hold: 20, weak: 'Dirty', resist: 'Legal', cycle: ['Sabotage', 'Lease', 'Arson'], movesFirst: 'Arson', portrait: 'baron' },
  // stage 2
  muckraker: { role: 'cash', name: 'The Muckraker', hold: 11, weak: 'Legal', cycle: ['Dig', 'Expose', 'Headline'], round3: 'Front Page', whenBeaten: 'Retraction: −1 Board Exposure', portrait: 'muckraker' },
  combine: { role: 'cash', name: 'The Combine', hold: 11, resist: 'Legal', cycle: ['Price War', 'Rail Deal', 'Squeeze', 'Hired Muscle'], whenBeaten: 'Prices and freight recover', portrait: 'combine' },
  clawback: { role: 'cash', name: 'The Clawback Committee', hold: 10, weak: 'Dirty', cover: 2, cycle: ['Clawback', 'Clawback', 'Minutes'], whenBeaten: '−1 Board Exposure', portrait: 'clawback' },
  patentHolder: { role: 'engine', name: 'The Patent Holder', hold: 12, weak: 'Legal', cycle: ['Cease and Desist', 'New Patent Claim', 'Royalty'], portrait: 'patentHolder' },
  saboteur: { role: 'engine', name: 'The Saboteur', hold: 10, weak: 'Dirty', cycle: ['Wreck', 'Lit Fuse', 'Infiltrate'], movesFirst: 'Infiltrate', whenBeaten: 'Starts a fire', portrait: 'saboteur' },
  commission: { role: 'engine', name: 'The Railroad Commission', hold: 8, weak: 'Dirty', cycle: ['Proration', 'Inspection', 'Leaky Tanks'], portrait: 'commission' },
  proxyFight: { role: 'boss', name: 'The Proxy Fight', hold: 46, weak: 'Legal', resist: 'Dirty', cycle: ['Hostile Bid', 'Proxy Meeting', 'The Vote'], movesFirst: 'Canvass', portrait: 'proxyFight' },
  // stage 3
  spill: { role: 'engine', name: 'The Spill', hold: 29, weak: 'Bury', resist: 'Legal', chip: 2, cycle: ['Slick', 'Shut Down', 'Clean-up Bill'], portrait: 'spill' },
  climateScience: { role: 'engine', name: 'Climate Science', hold: 31, weak: 'Bury', resist: 'Dirty', chip: 1, cycle: ['Measure', 'Publish', 'Peer Review'], round3: 'Consensus', portrait: 'climateScience' },
  rivals: { role: 'cash', name: 'Rival Companies', hold: 30, weak: 'Legal', resist: 'Dirty', chip: 3, cycle: ['Price War', 'Undercut', 'Poach Contracts'], whenBeaten: 'Prices recover', portrait: 'rivals' },
  diversified: { role: 'cash', name: 'Diversified Assets', hold: 27, weak: 'Legal', chip: 3, cycle: ['Running Costs', 'Bad Quarter', 'Write-down'], portrait: 'diversified' },
  briberyScandal: { role: 'cash', name: 'The Bribery Scandal', hold: 28, weak: 'Legal', resist: 'Lobby', chip: 2, cycle: ['Leak', 'Hearing', 'Exposé'], round3: 'Indictment', portrait: 'briberyScandal' },
  // stage 4: four of these, one at a time, never the same one twice; each one's 2nd and 5th moves move the clock on
  fracking: { role: 'engine', name: 'Fracking', hold: 58, weak: 'Legal', resist: 'Dirty', chip: CONFIG.chip4, ticks: [1, 4], cycle: ['Cheap Gas', 'Earthquake Swarm', 'Tremors', 'Moratorium', 'Flaming Taps'], portrait: 'fracking' },
  greenAlternatives: { role: 'cash', name: 'Green Alternatives', hold: 60, weak: 'Lobby', resist: 'Legal', chip: 5, ticks: [1, 4], cycle: ['Subsidies', 'Price Parity', 'Undercut', 'Grid Deal', 'Cheaper Every Year'], portrait: 'greenAlternatives' },
  deepwaterDisaster: { role: 'cash', name: 'Deepwater Disaster', hold: 62, weak: 'Bury', resist: 'Lobby', cover: 4, chip: 5, ticks: [1, 4], cycle: ['Blowout', 'Live Footage', 'Containment Fails', 'Clean-up Bill', 'Inquiry'], portrait: 'deepwaterDisaster' },
  spilledTanker: { role: 'engine', name: 'Spilled Tanker', hold: 56, weak: 'Bury', resist: 'Dirty', chip: CONFIG.chip4, ticks: [1, 4], cycle: ['Oiled Seabirds', 'Beach Closures', 'Claims Pile Up', 'Lost Cargo', 'Documentary'], portrait: 'spilledTanker' },
  greenPoliticians: { role: 'cash', name: 'Green Politicians', hold: 56, weak: 'Dirty', resist: 'Lobby', chip: CONFIG.chip4, ticks: [1, 4], cycle: ['Windfall Tax', 'Hearings', 'Subpoena', 'Asset Freeze', 'Climate Bill'], portrait: 'greenPoliticians' },
  war: { role: 'engine', name: 'War', hold: 54, weak: 'Legal', resist: 'Bury', chip: 5, ticks: [1, 4], cycle: ['Requisition', 'Refugee Crisis', 'Pipeline Strike', 'Profiteering Probe', 'Ceasefire Talks'], whenBeaten: 'Prices and output recover', portrait: 'war' },
  truth: { role: 'boss', name: 'The Truth', hold: CONFIG.truthPhaseHold, cycle: ['Sea Level Rise', 'Childhood Asthma', 'Water Pollution', 'Suppressed Development', 'Wildfire Season', 'Crop Failure'], portrait: 'theTruth' },
  geneva: { role: 'boss', name: 'The Geneva Climate Summit', hold: 47, resist: 'Dirty', chip: 3, cycle: ['Expert Testimony', 'Draft Declaration', 'Resolution'], movesFirst: 'Opening Session', portrait: 'geneva' },
}

// Round 1 takes your cash, round 2 breaks your engine, round 3 sends one of each.
export const CASH_POOL: ThreatKind[] = ['inspector', 'railroad', 'speculator']
export const ENGINE_POOL: ThreatKind[] = ['blowout', 'strike', 'claimJumper']
export const CASH_POOLS: Record<number, ThreatKind[]> = { 1: CASH_POOL, 2: ['muckraker', 'combine', 'clawback'], 3: ['rivals', 'diversified', 'briberyScandal'] }
export const ENGINE_POOLS: Record<number, ThreatKind[]> = { 1: ENGINE_POOL, 2: ['patentHolder', 'saboteur', 'commission'], 3: ['spill', 'climateScience'] }
export const BOSS: Record<number, ThreatKind> = { 1: 'baron', 2: 'proxyFight', 3: 'geneva', 4: 'truth' }
/** Stage 4's enemies: four are met, one per round, never the same one twice in a run. */
export const STAGE4_POOL: ThreatKind[] = ['fracking', 'greenAlternatives', 'deepwaterDisaster', 'spilledTanker', 'greenPoliticians', 'war']
/** The Truth fights in four phases, one after another, each weak to one damage type. Nothing resists. */
export const TRUTH_PHASES: { name: string; weak: Family }[] = [
  { name: 'Consensus Report', weak: 'Dirty' }, { name: 'Lawsuits', weak: 'Legal' }, { name: 'Whistleblower', weak: 'Bury' }, { name: 'Breakthrough', weak: 'Lobby' },
]
/** The round the boss arrives: round 4, or round 5 in stage 4. */
export const bossRound = (stage: number) => (stage >= 4 ? CONFIG.stage4Fights : 4)
export const ROLE_LABEL: Record<ThreatRole, string> = { cash: 'Takes your cash', engine: 'Breaks your engine', boss: 'Boss' }

export type ModKey = 'drySeason' | 'glut' | 'hardRock' | 'bankSqueeze' | 'badWeather' | 'boomtown' | 'scandal' | 'embargo' | 'earthDay'
export const MODS: Record<ModKey, { name: string; text: string; stages?: number[] }> = {
  drySeason: { name: 'Dry Season', text: 'Every outbreak starts 1 extra fire', stages: [1] },
  scandal: { name: 'Scandal', text: '+1 Board Exposure as the round begins', stages: [2] },
  glut: { name: 'Glut', text: 'Oil sells −$1' },
  hardRock: { name: 'Hard Rock', text: 'Prospect costs +1 AP', stages: [1, 2] },
  bankSqueeze: { name: 'Bank Squeeze', text: 'Debt +$1 a turn', stages: [1, 2] },
  badWeather: { name: 'Bad Weather', text: 'Draw 1 fewer card' },
  boomtown: { name: 'Boomtown', text: 'Oil +$1, debt +$1', stages: [1, 2] },
  embargo: { name: 'OPEC Embargo', text: 'Oil sells +$2', stages: [3] },
  earthDay: { name: 'Earth Day', text: `+${CONFIG.earthDayHeat} Heat as the round begins`, stages: [3] },
}

export type ItemKey = 'storageTank' | 'silo' | 'steamPump' | 'accountant' | 'refinery' | 'offshore' | 'boardGrudge' | 'loyalDirectors'
  | 'pressOffice' | 'fillingStations' | 'auditingFirm'
  | 'rolodex' | 'paperShredder' | 'supertanker' | 'thinkTankItem' | 'furtherResearch' | 'regulators'
  | 'lobbyist' | 'strategicReserve' | 'prAgency' | 'fossilSubsidy' | 'offshoreTrust' | 'slushFund'
// stages: which stages' shops sell it (all if unset); never: a residue item, only ever given
export const ITEMS: Record<ItemKey, { name: string; text: string; price: number; repeatable?: boolean; icon: Icon; stages?: number[]; never?: boolean; negative?: boolean }> = {
  storageTank: { name: 'Storage Tank', text: '+2 oil storage', price: 4, repeatable: true, icon: 'storageTank', stages: [1] },
  silo: { name: 'Silo', text: `+${CONFIG.siloStorage} oil storage`, price: 7, icon: 'barrels', stages: [1] },
  steamPump: { name: 'Steam Pump', text: '+1 AP every turn', price: 10, icon: 'steamPump', stages: [1] },
  accountant: { name: 'Accountant', text: 'Cover you don\'t use carries over to the next turn', price: 4, icon: 'deed', stages: [1] },
  refinery: { name: 'Refinery', text: 'Oil sells +$1', price: 22, icon: 'refinery', stages: [3] },
  offshore: { name: 'Offshore Account', text: 'Enemies take 1 less gold from your fortune', price: 5, icon: 'offshore', stages: [2] },
  pressOffice: { name: 'Press Office', text: 'Board Exposure −1 as each round begins', price: 9, icon: 'pressOffice', stages: [2] },
  fillingStations: { name: 'Filling Stations', text: '+$1 every turn', price: 8, icon: 'fillingStations', stages: [2] },
  auditingFirm: { name: 'Auditing Firm', text: `+${CONFIG.auditingFirmCover} Cover every turn`, price: 6, icon: 'auditingFirm', stages: [2] },
  boardGrudge: { name: 'Board Grudge', text: `Every shop item costs $${CONFIG.grudgeMarkup} more`, price: 0, icon: 'redtape', never: true, negative: true },
  loyalDirectors: { name: 'Loyal Directors', text: '+1 AP in boss fights', price: 0, icon: 'shares', never: true },
  // stage 3
  rolodex: { name: 'Rolodex', text: `+1 hand size (up to ${CONFIG.handMax})`, price: 20, repeatable: true, icon: 'rolodex', stages: [3] },
  paperShredder: { name: 'Paper Shredder', text: 'Once a fight, destroy a card in your hand for free', price: CONFIG.paperShredderPrice, icon: 'paperShredder', stages: [3] },
  supertanker: { name: 'Supertanker', text: `+${CONFIG.supertanker} oil storage (up to ${CONFIG.maxStorage}). Oil sells $${CONFIG.supertankerCut} less`, price: CONFIG.supertankerPrice, repeatable: true, icon: 'supertanker', stages: [3] },
  thinkTankItem: { name: 'Think Tank', text: `+${CONFIG.thinkTankCover} Cover every turn`, price: 15, icon: 'thinkTank', stages: [3] },
  furtherResearch: { name: 'Clean Image', text: `A free Think Tank: +${CONFIG.thinkTankCover} Cover every turn`, price: 0, icon: 'cleanImage', never: true },
  slushFund: { name: 'Slush Fund', text: `+${CONFIG.slushFundCover} Cover every turn`, price: 0, icon: 'slushFund', never: true },
  regulators: { name: 'On File', text: 'Stage 4: the Truth clock starts an hour later', price: 0, icon: 'onFile', never: true, negative: true },
  // stage 4
  lobbyist: { name: 'Lobbyist on Retainer', text: `+${CONFIG.lobbyistAP} AP every turn`, price: 40, icon: 'lobbyist', stages: [4] },
  strategicReserve: { name: 'Strategic Reserve', text: `+${CONFIG.strategicReserve} oil storage (up to ${CONFIG.maxStorage4})`, price: 30, repeatable: true, icon: 'strategicReserve', stages: [4] },
  prAgency: { name: 'PR Agency', text: `+${CONFIG.prAgencyCover} Cover every turn`, price: 30, icon: 'prAgency', stages: [4] },
  fossilSubsidy: { name: 'Fossil Fuel Subsidy', text: `+$${CONFIG.subsidyCash} every turn`, price: 30, icon: 'fossilSubsidy', stages: [4] },
  offshoreTrust: { name: 'Offshore Trust', text: 'Enemies take 1 less gold from your fortune', price: 25, icon: 'offshoreTrust', stages: [4] },
}

// Before the boss: one small, single-use item, bought with gold. Beat the boss: a
// bigger, lasting one of a different type.
export type BoonType = 'ap' | 'wells' | 'fire' | 'cash' | 'storage' // a 'fire' boon is never offered in stage 3: there are no fires
export type BoonKey = 'spareHand' | 'spareRigs' | 'fireBrigade' | 'inheritance' | 'tempSilo'
export const BOONS: Record<BoonKey, { name: string; text: string; type: BoonType; icon: Icon }> = {
  spareHand: { name: 'A Spare Hand', text: '+1 AP on your first turn against the boss.', type: 'ap', icon: 'cudgels' },
  spareRigs: { name: 'Spare Wells', text: '2 Well cards in your first hand against the boss.', type: 'wells', icon: 'derrick' },
  fireBrigade: { name: 'Fire Brigade', text: 'A Fire Brigade card for your deck.', type: 'fire', icon: 'hose' },
  inheritance: { name: 'Inheritance', text: `A card that gives $${CONFIG.inheritance} once, then is gone.`, type: 'cash', icon: 'will' },
  tempSilo: { name: 'Temporary Silo', text: `+${CONFIG.tempSilo} oil storage for the boss fight.`, type: 'storage', icon: 'barrels' },
}
export type RewardKey = 'steamPump' | 'dividends' | 'silo' | 'drillingRights'
export const REWARDS: Record<RewardKey, { name: string; text: string; type: BoonType; icon: Icon }> = {
  steamPump: { name: 'Steam Pump', text: '+1 AP every turn.', type: 'ap', icon: 'steamPump' },
  dividends: { name: 'Dividends', text: `A card that gives $${CONFIG.dividends} every time you play it.`, type: 'cash', icon: 'shares' },
  silo: { name: 'Silo', text: '+4 oil storage, for good.', type: 'storage', icon: 'barrels' },
  drillingRights: { name: 'Drilling Rights', text: '2 Well cards for your deck.', type: 'wells', icon: 'derrick' },
}
/** From stage 3 the land cards are Rigs: the same boon and reward, renamed. Rewards are given at the end of a stage, so from stage 2 they're Rigs for the stage ahead. */
const RIG_BOON = { name: 'Spare Rigs', text: '2 Rig cards in your first hand against the boss.', icon: 'rig' as Icon }
const RIG_REWARD = { text: '2 Rig cards for your deck.', icon: 'rig' as Icon }
const BOON_ICON_3: Partial<Record<BoonKey, Icon>> = { spareHand: 'spareHand3', inheritance: 'inheritance3', tempSilo: 'tempSilo3' }
export const boonInfo = (k: BoonKey, stage: number) => (stage < 3 ? BOONS[k] : k === 'spareRigs' ? { ...BOONS[k], ...RIG_BOON } : { ...BOONS[k], icon: BOON_ICON_3[k] ?? BOONS[k].icon })
export const rewardInfo = (k: RewardKey, stage: number) => (k === 'drillingRights' && stage >= 2 ? { ...REWARDS[k], ...RIG_REWARD } : REWARDS[k])
/** The card a boon or reward hands out: Rigs once stage 3 is (or is next) the stage. */
export const landCardFor = (stage: number): CardKey => (stage >= 3 ? 'rig' : 'well')
