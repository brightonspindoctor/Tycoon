// The Oil rules, stages 1 and 2. Pure functions over a plain-object Run, so the same code
// drives the game screens, the tests and the balance simulator.
import { CONFIG } from './config'
import {
  ATTACK_CARDS, BOSS, CARDS, CASH_POOLS, ENGINE_POOLS, ITEMS, MODS, PROSPECTS, PROSPECT_FOR, WATER_FOR, STARTER, THREATS, UPGRADES, shopPool,
  BOONS, REWARDS, type BoonKey, type RewardKey, type BonusKey, type CardDef, type CardKey, type Family, type ItemKey, type ModKey, type ThreatKind,
} from './data'
import { next, pick, shuffle } from './rng'

export interface Card { id: number; key: CardKey; uses: number | null; temp?: boolean; free?: boolean; up?: boolean } // free: costs no AP · up: upgraded
export interface Well { output: number; reserve: number; unstable?: boolean; field?: boolean; lasting?: boolean } // a Field (an old Well) and a stage 2 Well (lasting) never run dry
export const neverDry = (w: Well) => !!(w.field || w.lasting)
export interface Threat { id: number; kind: ThreatKind; hold: number; maxHold: number; step: number; cycle: number; round3: boolean; beaten: boolean; opened?: string; stopped?: boolean; cover?: number }
export interface LedgerLine { label: string; amount: number }
/** One line of the end-of-turn report, played back on the ticker tape. */
export interface Beat { kind: 'enemy' | 'fire' | 'money' | 'cards' | 'shuffle' | 'oil' | 'info' | 'board' | 'gold'; title: string; text: string; who?: number }
export type Phase = 'shop' | 'turn' | 'roundWon' | 'lost' | 'stageComplete' | 'incorporate'
export type LossReason = 'bankrupt' | 'stalemate' | 'ousted' | 'ruined'

export interface ShopOffer {
  cards: (CardKey | null)[]
  item: ItemKey | null
  loanTaken: boolean
  prospectSold: boolean // one Prospect per visit
  bucketSold: boolean // one Bucket of Water per visit
  boon: BoonKey | null // before the boss: one small item for gold
  dividendPaid: boolean // the shop's dividend, once per visit (stage 2 on)
  siloSold?: boolean // the Exchange's Silo, once per visit
}

export interface Run {
  seed: number
  rng: number
  bonus: BonusKey
  phase: Phase
  stage: number
  round: number // 0 = before round 1
  turn: number
  capital: number
  gold: number
  debt: number
  ap: number
  cover: number
  nextId: number
  deck: Card[]
  draw: Card[]
  hand: Card[]
  discard: Card[]
  plots: (Well | null)[]
  oil: number
  storage: number
  fire: number
  marked: number | null
  threats: Threat[]
  modifier: ModKey | null
  short: number
  freight: number
  pending: { ap: number; audit: boolean; refuse: boolean; margin: number; cease: number; prorate: boolean; claims?: number }
  current: { audit: boolean; refuse: boolean; prorate: boolean }
  items: ItemKey[]
  destroyCost: number
  prospectPrice: number
  shop: ShopOffer
  ledger: LedgerLine[]
  events: string[]
  stats: { oilSold: number; earned: number; spent: number; wellsBuilt: number; wellsBurnt: number; wellsStolen: number; wellsLost: number; wellsDry: number; skims: number }
  loss?: { reason: LossReason; by: string[] }
  roundStart: Snapshot
  boon: BoonKey | null // bought before the boss
  reward: RewardKey | null // given for beating the boss
  tempStorage: number // storage that only lasts for the boss round
  spoils: CardKey | null // the card offered after a round is won
  report: Beat[] // what happened since you last acted, in order
  reportSeq: number // goes up each time a new report starts
  shoredUp: boolean // a Shore Up has been played this round (only one per round, however many you own)
  exposure: number // Board Exposure, 0 to exposureMax (stage 2 only)
  goldShield: boolean // a Personal Lawyer is guarding your fortune this turn
  boost: number // oil sells this much more this turn (Ticker Tape)
  upgradeCost: number
  residue: ItemKey | null // left behind by the stage's meter
  stageGold: number // gold at the start of this stage
  admin?: boolean // a playtest run started from admin mode: never recorded
}

export type AdminOp = 'cash' | 'gold' | 'exposureUp' | 'exposureDown' | 'ap' | 'winRound' | 'addCard' | 'hold20'

export interface Snapshot { capital: number; gold: number; wells: number; oil: number; deck: number; exposure: number }
export const snapshot = (r: Run): Snapshot => ({ capital: r.capital, gold: r.gold, wells: wellCount(r), oil: r.oil, deck: r.deck.length, exposure: r.exposure ?? 0 })

export type Action =
  | { type: 'play'; cardId: number; target?: number }
  | { type: 'sellOil' }
  | { type: 'sellWell'; plot: number }
  | { type: 'firebreak' }
  | { type: 'endTurn' }
  | { type: 'buyCard'; slot: number }
  | { type: 'buyProspect' }
  | { type: 'buyBucket' }
  | { type: 'buyBoon' }
  | { type: 'takeSpoils' }
  | { type: 'sellSpoils' }
  | { type: 'buyItem' }
  | { type: 'takeLoan' }
  | { type: 'destroyCard'; cardId: number }
  | { type: 'reroll' }
  | { type: 'skim'; gold: number }
  | { type: 'upgradeCard'; cardId: number }
  | { type: 'payDividends' }
  | { type: 'buySilo' }
  | { type: 'admin'; op: AdminOp; card?: CardKey; target?: number }
  | { type: 'leaveShop' }
  | { type: 'continue' }

// ------------------------------------------------------------------ helpers
const clone = <T,>(x: T): T => structuredClone(x)
const card = (r: Run, key: CardKey, temp = false): Card => ({ id: r.nextId++, key, uses: CARDS[key].uses, temp })

/** What a card does, upgrade included. */
export function cardDef(c: { key: CardKey; up?: boolean }): CardDef {
  const d = CARDS[c.key]
  if (!c.up) return d
  return { ...d, ...UPGRADES[c.key], name: `${d.name}+` }
}
export const canUpgrade = (c: Card) => !c.up && !c.temp && !!UPGRADES[c.key]
export const isProspect = (k: CardKey) => PROSPECTS.includes(k)

export const waterPrice = (r: Run) => (r.stage >= 2 ? CONFIG.bucketPrice2 : CONFIG.bucketPrice)
/** Can a Well card be built? Stage 1 needs an empty plot; from stage 2 a Well claims a new plot if there's none. */
export const canBuild = (r: Run) => freePlot(r) >= 0 || (r.stage >= 2 && r.plots.length < CONFIG.maxPlots)
const BUILDS: CardKey[] = ['well', 'wildcat', 'derrick']

export function skimRate(r: Run): number {
  const table = r.stage >= 2 ? CONFIG.skimRate2 : CONFIG.skimRate
  return table[r.round] ?? table[4]
}

export function price(r: Run): number {
  let p = (r.stage >= 2 ? CONFIG.oilPrice2 : CONFIG.oilPrice) - r.short + r.boost + (r.items.includes('refinery') ? 1 : 0)
  if (r.modifier === 'glut') p -= 1
  if (r.modifier === 'boomtown') p += 1
  return Math.max(CONFIG.oilFloor, p)
}
/** What you get per barrel after freight; never below the floor. */
export const netPrice = (r: Run) => Math.max(CONFIG.oilFloor, price(r) - freight(r))
export const freight = (r: Run) => (r.items.includes('pipeline') ? 0 : r.freight)

export function debtPerTurn(r: Run): number {
  let d = r.debt
  if (r.bonus === 'trustFund' && r.stage > 1) d += CONFIG.startDebt // Father's money only covers stage 1
  if (r.modifier === 'bankSqueeze' || r.modifier === 'boomtown') d += 1
  return d
}

export const prospectAP = (r: Run, c?: Card) => (c ? cardDef(c).ap! : CARDS.prospect.ap!) + (r.modifier === 'hardRock' ? 1 : 0)
export const apCost = (r: Run, c: Card) => (c.free ? 0 : isProspect(c.key) ? prospectAP(r, c) : cardDef(c).ap ?? 0)
export const freePlot = (r: Run) => r.plots.findIndex(p => p === null)
export const highestWell = (r: Run) => { for (let i = r.plots.length - 1; i >= 0; i--) if (r.plots[i]) return i; return -1 }
/** Where a Rumble lands: your highest stable Well, or if every Well is already unstable, the highest one. */
export const rumbleTarget = (r: Run) => { for (let i = r.plots.length - 1; i >= 0; i--) if (r.plots[i] && !r.plots[i]!.unstable) return i; return highestWell(r) }
export const liveThreats = (r: Run) => r.threats.filter(t => !t.beaten)
export const wellCount = (r: Run) => r.plots.filter(Boolean).length
const pumps = (w: Well | null) => (w && !w.unstable ? (neverDry(w) ? w.output : Math.min(w.output, w.reserve)) : 0)
export const production = (r: Run) => {
  if (r.fire) return 0
  const made = r.plots.reduce((s, w) => s + pumps(w), 0)
  return r.current.prorate ? Math.min(CONFIG.prorationCap, made) : made
}
export const fieldCount = (r: Run) => r.plots.filter(w => w?.field).length

function money(r: Run, label: string, amount: number) {
  if (amount === 0) return
  r.capital += amount
  r.ledger.push({ label, amount })
  if (amount > 0) r.stats.earned += amount; else r.stats.spent -= amount
}
let captured: string[] | null = null // messages from the move being resolved, for the turn report
function say(r: Run, msg: string) { r.events.unshift(msg); r.events = r.events.slice(0, 6); captured?.push(msg) }
function beat(r: Run, kind: Beat['kind'], title: string, text: string, who?: number) { r.report.push({ kind, title, text, who }) }
function newReport(r: Run) { r.report = []; r.reportSeq += 1 }

/** Checked after things that can end the run, past TypeScript's narrowing of phase. */
const isLost = (r: Run) => r.phase === 'lost'
export const exposureHigh = (r: Run) => r.exposure >= CONFIG.exposureHigh
/** Moves Board Exposure (stage 2 on). At the top you're ousted. */
function expose(r: Run, n: number, why: string, who?: number) {
  if (r.stage < 2 || n === 0) return
  const before = r.exposure
  r.exposure = Math.max(0, Math.min(CONFIG.exposureMax, r.exposure + n))
  if (r.exposure === before) return
  const msg = `${why}: Board Exposure ${n > 0 ? '+' : '−'}${Math.abs(r.exposure - before)} (${r.exposure}/${CONFIG.exposureMax}).`
  say(r, msg)
  if (!captured) beat(r, 'board', 'Board Exposure', msg, who)
  if (r.exposure >= CONFIG.exposureMax && r.phase !== 'lost') {
    r.phase = 'lost'
    r.loss = { reason: 'ousted', by: liveThreats(r).map(t => THREATS[t.kind].name) }
  }
}
/** An enemy takes gold from your own fortune. Below 0 gold, you're ruined. */
function takeGold(r: Run, n: number, who: string) {
  if (r.goldShield) { r.goldShield = false; say(r, `Your Personal Lawyer kept ${who} away from your fortune.`); return }
  const amount = Math.max(0, n - (r.items.includes('offshore') ? 1 : 0))
  if (!amount) { say(r, `Your Offshore Account kept your fortune out of reach.`); return }
  r.gold -= amount
  say(r, `${who} took ${amount} gold from your fortune.`)
  if (r.gold < 0 && r.phase !== 'lost') {
    r.phase = 'lost'
    r.loss = { reason: 'ruined', by: [who] }
  }
}

export function damageFor(family: Family, power: number, kind: ThreatKind): number {
  const t = THREATS[kind]
  if (t.immune === family) return 0
  if (t.weak === family) return power * 2
  if (t.resist === family) return Math.floor(power / 2)
  return power
}
/** Hold an attack would actually remove from this enemy now, after its Cover. */
export const damageOn = (t: Threat, family: Family, power: number) => Math.max(0, damageFor(family, power, t.kind) - (t.cover ?? 0))
export const isAttack = (key: CardKey) => ['Legal', 'Dirty'].includes(CARDS[key].family)

export const fires = (n: number) => `${n} fire${n === 1 ? '' : 's'}`
/** Starts `count` new fires (Fire is the number of fires burning, up to fireMax). */
function startFire(r: Run, count: number) {
  const bonus = r.modifier === 'drySeason' ? 1 : 0
  r.fire = Math.min(CONFIG.fireMax, r.fire + count + bonus)
  say(r, `Fire! ${fires(r.fire)} burning. Pumps stopped.`)
}

/** Destroys a card in your hand for good (a temporary card just goes). */
function destroyInHand(r: Run, c: Card) {
  r.hand = r.hand.filter(x => x.id !== c.id)
  if (!c.temp) removeFromDeck(r, c)
}
function removeFromDeck(r: Run, c: Card) {
  r.deck = r.deck.filter(x => x.id !== c.id)
  r.draw = r.draw.filter(x => x.id !== c.id)
  r.discard = r.discard.filter(x => x.id !== c.id)
  r.hand = r.hand.filter(x => x.id !== c.id)
}
/** Adds a junk card: shuffled into the draw pile (enemies), or onto the discard pile (your own cards). */
function addJunk(r: Run, key: CardKey, where: 'draw' | 'discard' = 'draw') {
  const c = card(r, key)
  r.deck.push(c)
  if (where === 'discard') r.discard.push(c)
  else r.draw.splice(Math.floor(next(r) * (r.draw.length + 1)), 0, c)
}

/** Bad Blood, played (or forced at end of turn): 1 in 3 chance of a fire. */
function badBloodRoll(r: Run): boolean {
  if (next(r) < CONFIG.badBloodFireChance) { say(r, 'Bad Blood: someone set a fire.'); startFire(r, 1); return true }
  say(r, 'Bad Blood: nothing happened. This time.')
  return false
}
function loseWell(r: Run, i: number, how: 'burnt' | 'stolen' | 'lost' | 'dry') {
  if (!r.plots[i]) return
  r.plots[i] = null
  if (r.marked === i) r.marked = null
  if (how === 'burnt') r.stats.wellsBurnt++
  else if (how === 'stolen') r.stats.wellsStolen++
  else if (how === 'dry') r.stats.wellsDry++
  else r.stats.wellsLost++
}

// ---------------------------------------------------------------- new run
export function newRun(seed: number, bonus: BonusKey): Run {
  const r: Run = {
    seed, rng: seed, bonus, phase: 'shop', stage: 1, round: 0, turn: 0,
    capital: CONFIG.startCapital, gold: 0, debt: bonus === 'trustFund' ? CONFIG.trustFundDebt : CONFIG.startDebt, ap: 0, cover: 0, nextId: 1,
    deck: [], draw: [], hand: [], discard: [], plots: [], oil: bonus === 'threeOil' ? 3 : 0,
    storage: CONFIG.startStorage, fire: 0, marked: null, threats: [], modifier: null,
    short: 0, freight: 0, pending: { ap: 0, audit: false, refuse: false, margin: 0, cease: 0, prorate: false }, current: { audit: false, refuse: false, prorate: false },
    items: [], destroyCost: CONFIG.destroyCost, prospectPrice: CONFIG.prospectPrice,
    shop: { cards: [], item: null, loanTaken: false, prospectSold: false, bucketSold: false, boon: null, dividendPaid: false }, ledger: [], events: [],
    stats: { oilSold: 0, earned: 0, spent: 0, wellsBuilt: 0, wellsBurnt: 0, wellsStolen: 0, wellsLost: 0, wellsDry: 0, skims: 0 },
    roundStart: { capital: CONFIG.startCapital, gold: 0, wells: 0, oil: 0, deck: 0, exposure: 0 },
    boon: null, reward: null, tempStorage: 0, spoils: null, report: [], reportSeq: 0, shoredUp: false,
    exposure: 0, goldShield: false, boost: 0, upgradeCost: CONFIG.upgradeCost, residue: null, stageGold: 0,
  }
  r.deck = STARTER.map(k => card(r, k))
  if (bonus === 'extraProspect') r.deck.push(card(r, 'prospect'))
  if (bonus === 'pettyCash') r.deck.push(card(r, 'pettyCash'))
  if (bonus === 'gearGraft') r.deck.push(card(r, 'improveGear'), card(r, 'hardGraft'))
  startRound(r, 1) // straight into the first fight; the Land Office opens after it
  return r
}

// ------------------------------------------------------------------- shop
const WEIGHTS = { Common: 6, Uncommon: 3, Rare: 1 } as const
function weightedCard(r: Run, pool: CardKey[]): CardKey {
  const total = pool.reduce((s, k) => s + WEIGHTS[CARDS[k].rarity ?? 'Common'], 0)
  let roll = next(r) * total
  return pool.find(k => (roll -= WEIGHTS[CARDS[k].rarity ?? 'Common']) < 0) ?? pool[0]
}

function stockShop(r: Run) {
  const pool = [...shopPool(r.stage)]
  const picks: CardKey[] = []
  while (picks.length < 3 && pool.length) {
    const k = weightedCard(r, pool)
    picks.push(k); pool.splice(pool.indexOf(k), 1)
  }
  const items = (Object.keys(ITEMS) as ItemKey[]).filter(i => !ITEMS[i].never && (!ITEMS[i].stages || ITEMS[i].stages!.includes(r.stage)) && (ITEMS[i].repeatable || !r.items.includes(i)))
  r.shop = { ...r.shop, cards: picks, item: items.length ? pick(r, items) : null }
}

/** Opening the Land Office after a round: fresh stock, and before the boss, one small item for gold. */
function openShop(r: Run) {
  r.shop = { cards: [], item: null, loanTaken: false, prospectSold: false, bucketSold: false, boon: null, dividendPaid: false }
  stockShop(r)
  if (r.items.includes('boardGrudge') && r.stage >= 3) money(r, 'Board Grudge', -1)
  if (r.round === 3) r.shop.boon = pick(r, Object.keys(BOONS) as BoonKey[])
}

function pay(r: Run, amount: number, label: string): boolean {
  if (r.capital - amount < 1) { say(r, "You can't spend your last dollar."); return false }
  money(r, label, -amount)
  return true
}

function shopAction(r: Run, a: Action) {
  switch (a.type) {
    case 'buyCard': {
      const key = r.shop.cards[a.slot]
      if (!key || !pay(r, CARDS[key].price!, CARDS[key].name)) return
      r.deck.push(card(r, key)); r.shop.cards[a.slot] = null
      return
    }
    case 'buyBucket': {
      const k = WATER_FOR[r.stage] ?? 'extinguisher'
      if (r.shop.bucketSold || !pay(r, waterPrice(r), CARDS[k].name)) return
      r.deck.push(card(r, k)); r.shop.bucketSold = true
      return
    }
    case 'buyProspect': {
      const k = PROSPECT_FOR[r.stage] ?? 'survey'
      if (r.shop.prospectSold || !pay(r, r.prospectPrice, CARDS[k].name)) return
      r.deck.push(card(r, k)); r.prospectPrice += r.stage >= 2 ? CONFIG.derrickStep : 1; r.shop.prospectSold = true
      return
    }
    case 'buyBoon': {
      const b = r.shop.boon
      if (!b || r.gold < CONFIG.boonGold) return
      r.gold -= CONFIG.boonGold; r.boon = b; r.shop.boon = null
      if (b === 'fireBrigade') r.deck.push(card(r, 'fireBrigade'))
      if (b === 'inheritance') r.deck.push(card(r, 'inheritance'))
      say(r, `${BOONS[b].name}: yours for ${CONFIG.boonGold} gold.`)
      return
    }
    case 'buyItem': {
      const it = r.shop.item
      if (!it || !pay(r, ITEMS[it].price, ITEMS[it].name)) return
      r.items.push(it)
      if (it === 'storageTank') r.storage += 2
      if (it === 'silo') r.storage += 4
      r.shop.item = null
      return
    }
    case 'takeLoan':
      if (r.shop.loanTaken) return
      if (r.phase === 'incorporate') { money(r, 'Incorporation loan', CONFIG.stage2Loan); r.debt += CONFIG.stage2LoanDebt }
      else { money(r, 'Cheap Loan', 8); r.debt += 1 }
      r.shop.loanTaken = true
      say(r, `Bank Debt is now −${r.debt} a turn.`)
      return
    case 'upgradeCard': {
      const c = r.deck.find(x => x.id === a.cardId)
      if (!c || !canUpgrade(c) || r.stage < 2 || !pay(r, r.upgradeCost, `Upgrade ${CARDS[c.key].name}`)) return
      c.up = true; r.upgradeCost += 1
      say(r, `${cardDef(c).name}: upgraded.`)
      return
    }
    case 'buySilo':
      if (r.stage < 2 || r.phase !== 'shop' || r.shop.siloSold || !pay(r, CONFIG.silo2Price, 'Silo')) return
      r.storage += CONFIG.silo2Storage; r.shop.siloSold = true
      say(r, `Silo built: storage for ${r.storage} oil.`)
      return
    case 'payDividends':
      if (r.stage < 2 || r.phase !== 'shop' || r.shop.dividendPaid || r.exposure === 0 || !pay(r, CONFIG.dividendCost, 'Dividends to the board')) return
      r.shop.dividendPaid = true
      expose(r, -CONFIG.dividendDrop, 'Dividends paid')
      return
    case 'destroyCard': {
      const c = r.deck.find(x => x.id === a.cardId)
      if (!c || !pay(r, r.destroyCost, `Destroy ${CARDS[c.key].name}`)) return
      removeFromDeck(r, c); r.destroyCost += 1
      return
    }
    case 'reroll':
      if (!pay(r, 1, 'Reroll')) return
      stockShop(r)
      return
    case 'skim': {
      if (r.phase !== 'shop') return
      if (r.stage >= 2) { say(r, 'Skim with an Expense Account card.'); return } // from stage 2, skimming is a card
      const cost = a.gold * skimRate(r)
      if (a.gold < 1 || r.capital - cost < 1) { say(r, "The company can't spare that much."); return }
      if (r.stage >= 2 && r.exposure + 1 >= CONFIG.exposureMax) { say(r, 'The board is watching too closely to skim.'); return }
      money(r, `Skim ${a.gold} gold`, -cost); r.gold += a.gold; r.stats.skims += a.gold
      expose(r, 1, 'Skimming')
      return
    }
    case 'leaveShop':
      if (r.phase === 'incorporate') { r.phase = 'shop'; startRound(r, 1); return }
      startRound(r, r.round + 1)
      return
  }
}

// ------------------------------------------------------------------ rounds
function startRound(r: Run, round: number) {
  r.roundStart = snapshot(r)
  r.round = round
  r.turn = 0
  r.modifier = null
  let kinds: ThreatKind[]
  const cash = CASH_POOLS[r.stage] ?? CASH_POOLS[2], engine = ENGINE_POOLS[r.stage] ?? ENGINE_POOLS[2]
  if (round === 1) kinds = [pick(r, cash)]
  else if (round === 2) { kinds = [pick(r, engine)]; r.modifier = pick(r, (Object.keys(MODS) as ModKey[]).filter(m => !MODS[m].stages || MODS[m].stages!.includes(r.stage))) }
  else if (round === 3) kinds = [pick(r, cash), pick(r, engine)]
  else kinds = [BOSS[r.stage] ?? BOSS[2]]
  r.threats = kinds.map(k => ({ id: r.nextId++, kind: k, hold: THREATS[k].hold, maxHold: THREATS[k].hold, step: 0, cycle: 0, round3: round === 3, beaten: false }))
  if (!CONFIG.oilCarriesOver) r.oil = 0
  r.short = 0
  r.freight = r.threats.some(t => t.kind === 'railroad') ? 1 : 0
  r.boost = 0
  r.goldShield = false
  r.fire = 0
  r.marked = null
  r.plots.forEach(w => w && (w.unstable = false))
  r.pending = { ap: 0, audit: false, refuse: false, margin: 0, cease: 0, prorate: false }
  r.current = { audit: false, refuse: false, prorate: false }
  r.hand = []
  r.discard = []
  r.draw = shuffle(r, [...r.deck])
  // a Prospect, if you own one, is always in the round's opening hand (cards are drawn from the end)
  const best = PROSPECTS.find(k => r.draw.some(c => c.key === k)) // the freshest one, if you own several kinds
  const p = r.draw.findIndex(c => c.key === best)
  if (p >= 0) r.draw.push(...r.draw.splice(p, 1))
  r.phase = 'turn'
  r.events = []
  r.cover = 0
  r.shoredUp = false
  newReport(r)
  for (const t of r.threats) { say(r, `${THREATS[t.kind].name} arrives.`); beat(r, 'enemy', `Round ${round}`, `${THREATS[t.kind].name} arrives.`, t.id) }
  if (r.modifier) { say(r, `${MODS[r.modifier].name}: ${MODS[r.modifier].text}.`); beat(r, 'info', MODS[r.modifier].name, `${MODS[r.modifier].text}.`) }
  if (r.modifier === 'scandal') expose(r, 1, 'Scandal')
  // opening moves
  if (!r.items.includes('lookout')) {
    for (const t of r.threats) {
      const op = THREATS[t.kind].movesFirst
      if (op === 'Walkout') { r.pending.ap += 1; t.opened = 'Walkout: −1 AP this turn.'; say(r, 'Walkout: −1 AP on your first turn.'); beat(r, 'enemy', `${THREATS[t.kind].name} · Walkout`, '−1 AP on your first turn.', t.id) }
      if (op === 'Scout') {
        const i = highestWell(r); r.marked = i >= 0 ? i : null
        t.opened = i >= 0 ? `Scout: marked Well No. ${i + 1}.` : 'Scout: found no Well to mark.'
        if (i >= 0) say(r, `The Claim Jumper has marked Well No. ${i + 1}.`)
        beat(r, 'enemy', `${THREATS[t.kind].name} · Scout`, i >= 0 ? `Marked Well No. ${i + 1}.` : 'Found no Well to mark.', t.id)
      }
      if (op === 'Arson') { startFire(r, 1); t.opened = 'Arson: started a fire.'; beat(r, 'enemy', `${THREATS[t.kind].name} · Arson`, 'Started a fire.', t.id) }
      if (op === 'Canvass' || op === 'Minutes') {
        beat(r, 'enemy', `${THREATS[t.kind].name} · ${op}`, '+1 Board Exposure.', t.id)
        captured = []; expose(r, 1, op); captured = null
        t.opened = `${op}: +1 Board Exposure.`
      }
      if (op === 'Infiltrate') {
        const i = infiltrateTarget(r); r.marked = i >= 0 ? i : null
        t.opened = i >= 0 ? `Infiltrate: marked ${plotName(r, i)}.` : 'Infiltrate: found nothing to mark.'
        beat(r, 'enemy', `${THREATS[t.kind].name} · Infiltrate`, i >= 0 ? `Marked ${plotName(r, i)}.` : 'Found nothing to mark.', t.id)
      }
    }
  }
  if (round === 4 && r.boon) {
    if (r.boon === 'spareHand') r.pending.ap -= 1
    if (r.boon === 'tempSilo') { r.storage += CONFIG.tempSilo; r.tempStorage = CONFIG.tempSilo }
  }
  if (isLost(r)) return
  beginTurn(r)
  if (round === 4 && r.boon === 'spareRigs' && r.turn === 1) {
    for (let i = 0; i < 2; i++) { const w = card(r, 'well'); r.deck.push(w); r.hand.push(w) }
  }
}

function beginTurn(r: Run) {
  r.turn += 1
  r.ledger = [{ label: 'Brought forward', amount: r.capital }]
  if (!r.items.includes('accountant')) r.cover = 0
  r.current = { audit: r.pending.audit, refuse: r.pending.refuse, prorate: r.pending.prorate }
  const apPenalty = r.pending.ap
  const margins = r.pending.margin
  const ceases = r.pending.cease
  const claims = r.pending.claims ?? 0
  r.pending = { ap: 0, audit: false, refuse: false, margin: 0, cease: 0, prorate: false }
  for (const t of liveThreats(r)) t.cover = THREATS[t.kind].cover // enemy Cover: fresh each turn, never stacks
  r.boost = 0
  r.goldShield = false
  const d = debtPerTurn(r) * (r.current.audit ? 2 : 1)
  money(r, r.current.audit ? 'Bank debt (audited)' : 'Bank debt', -d)
  if (d && r.turn > 1) beat(r, 'money', r.current.audit ? 'Bank debt · audited' : 'Bank debt', `−$${d}.`)
  const ious = r.hand.filter(c => c.key === 'iou').length
  if (ious) { money(r, 'IOU', -ious); beat(r, 'money', 'IOU', `−$${ious}.`) }
  if (checkBankrupt(r)) return
  const made = production(r)
  if (made) {
    r.plots.forEach((w, i) => {
      if (!w || neverDry(w)) return
      w.reserve -= pumps(w)
      if (w.reserve <= 0) { loseWell(r, i, 'dry'); say(r, `Well No. ${i + 1} has run dry.`); beat(r, 'oil', `Well No. ${i + 1}`, 'Has run dry.') }
    })
    const room = r.storage - r.oil
    r.oil += Math.min(room, made)
    if (made > room) say(r, `Storage full: ${made - room} oil lost.`)
    beat(r, 'oil', r.current.prorate ? 'Pumps · prorated' : 'Pumps', made <= room ? `+${made} oil.` : room > 0 ? `+${room} oil. Storage full: ${made - room} lost.` : `Storage full: ${made} oil lost.`)
  }
  for (let i = 0; i < margins; i++) r.hand.push(card(r, 'marginCall', true))
  if (margins) beat(r, 'cards', 'Margin Call', `${margins > 1 ? `${margins} Margin Calls` : 'A Margin Call'} in your hand.`)
  for (let i = 0; i < ceases; i++) r.hand.push(card(r, 'ceaseDesist', true))
  for (let i = 0; i < claims; i++) r.hand.push(card(r, 'patentClaim', true))
  if (claims) beat(r, 'cards', 'New Patent Claim', 'A New Patent Claim is clogging your hand.')
  if (ceases) beat(r, 'cards', 'Cease and Desist', `${ceases > 1 ? `${ceases} Cease and Desist letters` : 'A Cease and Desist letter'} in your hand.`)
  const n = CONFIG.handSize - (r.modifier === 'badWeather' ? 1 : 0)
  drawUpTo(r, n)
  const loyal = r.round === 4 && r.items.includes('loyalDirectors') ? 1 : 0
  r.ap = Math.max(0, CONFIG.baseAP + (r.items.includes('steamPump') ? 1 : 0) + loyal - apPenalty)
}

function drawOne(r: Run): boolean {
  if (!r.draw.length && r.discard.length) { r.draw = shuffle(r, r.discard); beat(r, 'shuffle', 'Reshuffle', `Your discard pile is your new deck: ${r.discard.length} cards.`); r.discard = [] }
  const c = r.draw.pop()
  if (!c) return false
  r.hand.push(c)
  return true
}
/** Draws back up to a full hand. */
function drawUpTo(r: Run, n: number) { while (r.hand.length < n && drawOne(r)); }
/** Draws extra cards (Telegraph Line and friends). */
function drawCards(r: Run, n: number): number { let got = 0; for (let i = 0; i < n && drawOne(r); i++) got++; return got }

/** "Well No. 2" or "Field No. 2". */
export const plotName = (r: Run, i: number) => `${r.plots[i]?.field ? 'Field' : 'Well'} No. ${i + 1}`
/** What the Saboteur goes for: your best Field, or your best Well if you have none. */
export function infiltrateTarget(r: Run): number {
  let best = -1
  r.plots.forEach((w, i) => {
    const b = best >= 0 ? r.plots[best]! : null
    const score = (x: Well) => (x.field ? 100 : 0) + x.output * 10 + Math.min(9, x.reserve)
    if (w && (!b || score(w) > score(b))) best = i
  })
  return best
}
/** Where a Rotary Rig goes: your best Well that isn't already a Field. */
export function rigTarget(r: Run): number {
  let best = -1
  r.plots.forEach((w, i) => {
    const b = best >= 0 ? r.plots[best]! : null
    if (w && !w.field && (!b || w.output > b.output || (w.output === b.output && w.reserve > b.reserve))) best = i
  })
  return best
}

function checkBankrupt(r: Run): boolean {
  if (r.phase === 'lost') return true // ousted or ruined already
  if (r.capital > 0) return false
  r.phase = 'lost'
  r.loss = { reason: 'bankrupt', by: liveThreats(r).map(t => THREATS[t.kind].name) }
  return true
}

function threatBeaten(r: Run, t: Threat) {
  t.beaten = true
  t.hold = 0
  say(r, `${THREATS[t.kind].name} is beaten.`)
  switch (t.kind) {
    case 'inspector': addJunk(r, 'looseThread'); addJunk(r, 'looseThread'); say(r, 'He filed his report: 2 Loose Threads added to your deck.'); break
    case 'claimJumper': startFire(r, 2); break
    case 'blowout': r.oil = Math.min(r.storage, r.oil + 3); say(r, 'Gusher! +3 oil.'); break
    case 'speculator': r.short = 0; break
    case 'railroad': r.freight = 0; break
    case 'muckraker': expose(r, -1, 'Retraction'); break
    case 'clawback': expose(r, -1, 'The committee is satisfied'); break
    case 'combine': r.short = 0; r.freight = 0; say(r, 'The Combine folds. Prices and freight recover.'); break
    case 'saboteur': startFire(r, 1); say(r, 'The Saboteur left a parting gift.'); break
  }
  if (!liveThreats(r).length && r.phase !== 'lost') {
    // a quick win impresses the board, the boss included
    if (r.stage >= 2 && r.turn <= CONFIG.quickWinTurns) expose(r, -CONFIG.quickWinDrop, `Won in ${r.turn} turn${r.turn === 1 ? '' : 's'}`)
    // the board reads the quarter: Capital up, Exposure falls; Capital down, it rises (not after the boss)
    if (r.stage >= 2 && r.round < 4) {
      if (r.capital > r.roundStart.capital) expose(r, -1, 'A good quarter')
      else if (r.capital < r.roundStart.capital) expose(r, 1, 'A bad quarter')
      if (isLost(r)) return
    }
    r.phase = r.round >= 4 ? 'stageComplete' : 'roundWon'
    if (r.phase === 'stageComplete') grantReward(r)
    else r.spoils = weightedCard(r, [...shopPool(r.stage)]) // a card to take, or turn down for cash
    r.plots.forEach(w => w && (w.unstable = false))
  }
}

function grantReward(r: Run) {
  if (r.tempStorage) { r.storage -= r.tempStorage; r.tempStorage = 0; r.oil = Math.min(r.oil, r.storage) } // the temporary silo is dismantled; what doesn't fit is sold off with it
  r.gold += CONFIG.bossGold
  say(r, `${CONFIG.bossGold} gold for you.`)
  if (r.stage >= 2) { // the meter leaves its mark
    r.residue = r.exposure >= CONFIG.exposureHigh ? 'boardGrudge' : r.exposure <= CONFIG.exposureLow ? 'loyalDirectors' : null
    if (r.residue) r.items.push(r.residue)
  }
  const avoid = r.boon ? BOONS[r.boon].type : null
  const options = (Object.keys(REWARDS) as RewardKey[]).filter(k => REWARDS[k].type !== avoid && !(k === 'steamPump' && r.items.includes('steamPump')) && !(k === 'silo' && r.items.includes('silo')))
  const k = pick(r, options)
  r.reward = k
  if (k === 'steamPump') r.items.push('steamPump')
  if (k === 'silo') { r.items.push('silo'); r.storage += 4 }
  if (k === 'dividends') r.deck.push(card(r, 'dividends'))
  if (k === 'wildcatRights') r.deck.push(card(r, 'wildcat'), card(r, 'wildcat'))
}

/** Damage to an enemy. Cards marked badBlood put a Bad Blood card in your discard pile. */
function hit(r: Run, t: Threat, dmg: number, badBlood = false, ignoreCover = false) {
  if (t.cover && !ignoreCover) { const blocked = Math.min(t.cover, dmg); t.cover -= blocked; dmg -= blocked; if (blocked) say(r, `${THREATS[t.kind].name}'s Cover blocked ${blocked}.`) }
  t.hold -= dmg
  if (badBlood) { addJunk(r, 'badBlood', 'discard'); say(r, 'Bad Blood added to your discard pile.') }
  if (t.hold <= 0) threatBeaten(r, t)
}

// ------------------------------------------------------------- turn actions
/** The enemies a card can be aimed at: ones an attack can hurt, or ones not yet stopped. */
export function targetsFor(r: Run, c: Card): Threat[] {
  const d = cardDef(c)
  if (d.stop) return liveThreats(r).filter(t => !t.stopped)
  if (isAttack(c.key)) return liveThreats(r).filter(t => damageFor(d.family, d.power, t.kind) > 0)
  return []
}
/** The cards in your hand a destroy card (Streamline, Shred the Files, Scrap for Parts) can be used on. */
export function handTargetsFor(r: Run, c: Card): Card[] {
  return cardDef(c).scrap === 'one' ? r.hand.filter(x => x.id !== c.id) : []
}

export function canPlay(r: Run, c: Card): { ok: boolean; why?: string } {
  const d = cardDef(c)
  if (r.phase !== 'turn') return { ok: false }
  if (d.ap === null) return { ok: false, why: "Can't be played" }
  const forced = r.hand.some(x => x.id !== c.id && CARDS[x.key].forced && apCost(r, x) <= r.ap)
  // destroy cards can be used on a Must play card, so they skip the queue
  if (forced && !d.forced && !d.scrap) return { ok: false, why: 'Play your Must play cards first' }
  if (apCost(r, c) > r.ap) return { ok: false, why: 'Not enough AP' }
  if (d.cost && r.capital - d.cost < 1 && !d.forced) return { ok: false, why: 'Not enough Capital' }
  if (d.gold && r.gold < d.gold) return { ok: false, why: 'Not enough gold' }
  if (isProspect(c.key) && (d.plots ?? 0) > 0 && r.plots.length >= CONFIG.maxPlots && freePlot(r) < 0) return { ok: false, why: 'No land left to claim' }
  if (isProspect(c.key) && !d.plots && !canBuild(r)) return { ok: false, why: 'No empty plot' }
  if (c.key === 'rotaryRig' && rigTarget(r) < 0) return { ok: false, why: 'No Well to convert' }
  if (c.key === 'rdSprint' && !fieldCount(r)) return { ok: false, why: 'No Fields' }
  if (d.scrap === 'one' && !handTargetsFor(r, c).length) return { ok: false, why: 'Nothing to destroy' }
  if (d.scrap === 'junk' && !r.hand.some(x => x.id !== c.id && CARDS[x.key].junk)) return { ok: false, why: 'No junk in hand' }
  if (c.key === 'payDividend' && r.exposure === 0) return { ok: false, why: 'The board is happy' }
  if (c.key === 'personalLawyer' && r.goldShield) return { ok: false, why: 'Already retained' }
  if (BUILDS.includes(c.key) && !canBuild(r)) return { ok: false, why: 'No free plot' }
  if ((c.key === 'bucket' || c.key === 'fireBrigade' || c.key === 'extinguisher') && !r.fire) return { ok: false, why: 'No fire' }
  if (d.family === 'Skim' && r.capital - skimRate(r) < 1) return { ok: false, why: 'Not enough Capital' }
  if (d.stop && r.shoredUp) return { ok: false, why: 'Once per round' }
  if (d.stop && !targetsFor(r, c).length) return { ok: false, why: 'Every move is already stopped' }
  if (c.key === 'pettyCash' && r.capital - skimRate(r) < 1) return { ok: false, why: 'Not enough Capital' }
  if (isAttack(c.key) && !liveThreats(r).some(t => damageFor(d.family, d.power, t.kind) > 0)) return { ok: false, why: 'No effect on these enemies' }
  return { ok: true }
}

function spendCard(r: Run, c: Card) {
  r.hand = r.hand.filter(x => x.id !== c.id)
  if (c.temp) return
  if (cardDef(c).oncePerRound) return // sits out until the next round's shuffle
  if (c.uses !== null) {
    c.uses -= 1
    const master = r.deck.find(x => x.id === c.id)
    if (master) master.uses = c.uses
    if (c.uses <= 0) { r.deck = r.deck.filter(x => x.id !== c.id); return }
  }
  r.discard.push(c)
}

function play(r: Run, cardId: number, target?: number) {
  const c = r.hand.find(x => x.id === cardId)
  if (!c || !canPlay(r, c).ok) return
  const d = cardDef(c)
  r.ap -= apCost(r, c)
  if (d.cost) money(r, d.name, -d.cost)
  if (isAttack(c.key)) {
    const live = liveThreats(r)
    const best = live.reduce((a, b) => (damageFor(d.family, d.power, b.kind) > damageFor(d.family, d.power, a.kind) ? b : a))
    const chosen = live.find(x => x.id === target)
    const t = chosen && damageFor(d.family, d.power, chosen.kind) > 0 ? chosen : best
    const dmg = damageFor(d.family, d.power, t.kind)
    spendCard(r, c)
    if (d.gold) r.gold -= d.gold
    if (d.chance !== undefined) {
      // a gamble: it either lands cleanly or backfires with Bad Blood
      if (next(r) < d.chance) { say(r, `${d.name} taken: ${THREATS[t.kind].name} −${dmg} Hold.`); hit(r, t, dmg) }
      else { addJunk(r, 'badBlood', 'discard'); say(r, `${THREATS[t.kind].name} refused the bribe. Bad Blood added to your discard pile.`) }
    } else {
      say(r, `${d.name}: ${THREATS[t.kind].name} −${dmg} Hold.`)
      hit(r, t, dmg, !!d.badBlood)
    }
    if (r.phase === 'turn' && d.draw) drawCards(r, d.draw)
    if (d.exposure) expose(r, d.exposure, d.name)
  } else if (d.stop) {
    const options = targetsFor(r, c)
    const t = options.find(x => x.id === target) ?? options[0]
    spendCard(r, c)
    r.shoredUp = true
    t.stopped = true
    if (d.cover) r.cover += d.cover
    say(r, `${d.name}: ${THREATS[t.kind].name}'s ${intent(r, t)} is stopped this turn.`)
  } else if (d.scrap) {
    spendCard(r, c)
    if (d.scrap === 'one') {
      const options = r.hand.filter(x => x.id !== c.id)
      const victim = options.find(x => x.id === target) ?? options.find(x => CARDS[x.key].junk) ?? options[0]
      if (victim) { destroyInHand(r, victim); say(r, `${d.name}: ${cardDef(victim).name} destroyed.`) }
      if (d.goldBack) money(r, d.name, d.goldBack)
      if (d.exposure) expose(r, d.exposure, d.name)
    } else {
      const junk = r.hand.filter(x => CARDS[x.key].junk)
      for (const j of junk) destroyInHand(r, j)
      const got = drawCards(r, junk.length)
      say(r, `${d.name}: ${junk.length} junk card${junk.length === 1 ? '' : 's'} destroyed, ${got} drawn.`)
    }
  } else {
    spendCard(r, c)
    if (d.cover) r.cover += d.cover
    if (d.draw) drawCards(r, d.draw)
    if (d.apNext) r.pending.ap += d.apNext
    if (d.exposure !== undefined && d.exposure !== 0 && d.family !== 'Skim') expose(r, d.exposure, d.name)
    switch (c.key) {
      case 'prospect': case 'survey': case 'oldProspect': {
        const add = Math.min(d.plots ?? 0, CONFIG.maxPlots - r.plots.length)
        for (let i = 0; i < add; i++) r.plots.push(null)
        const wells = d.wells ?? 1
        for (let i = 0; i < wells; i++) { const w = card(r, 'well'); r.deck.push(w); r.hand.push(w) }
        say(r, add ? `Claimed ${add} plot${add > 1 ? 's' : ''}.` : `No new land. ${wells} Well card${wells > 1 ? 's' : ''} drawn.`)
        break
      }
      case 'rotaryRig': { const i = rigTarget(r); if (i >= 0) { r.plots[i]!.field = true; say(r, `Rotary Rig: Well No. ${i + 1} is now a Field.`) } break }
      case 'rdSprint': {
        const made = fieldCount(r) * d.power
        const got = Math.min(made, r.storage - r.oil)
        r.oil += got
        say(r, got < made ? `R&D Sprint: +${got} oil. Storage full: ${made - got} lost.` : `R&D Sprint: +${got} oil.`)
        break
      }
      case 'tickerTape': r.boost += d.power; break
      case 'nightShift': r.ap += d.power; break
      case 'payDividend': break
      case 'personalLawyer': r.goldShield = true; say(r, 'Your Personal Lawyer is on retainer this turn.'); break
      case 'ceaseDesist': case 'proxyBallot': break
      case 'well': case 'wildcat': case 'derrick': {
        if (freePlot(r) < 0) r.plots.push(null) // stage 2: a Well claims its own plot
        const i = freePlot(r)
        r.plots[i] = r.stage >= 2
          ? { output: CONFIG.stage2Output, reserve: 0, lasting: true } // every stage 2 Well pumps 1 and never runs dry
          : { output: d.power, reserve: c.key === 'wildcat' ? CONFIG.wildcatReserve : CONFIG.wellReserve }
        r.stats.wellsBuilt++
        say(r, `Well No. ${i + 1} built.`)
        break
      }
      case 'extinguisher':
      case 'bucket': r.fire = Math.max(0, r.fire - d.power); say(r, r.fire ? `${d.power > 1 ? 'Two fires' : 'One fire'} out. ${fires(r.fire)} still burning.` : 'Fire out. Pumps restart next turn.'); break
      case 'fireBrigade': r.fire = 0; say(r, 'Every fire is out. Pumps restart next turn.'); break
      case 'improveGear': break
      case 'hardGraft': r.ap += d.power; break
      case 'pettyCash': case 'expenseAccount': {
        const rate = skimRate(r)
        if (r.capital - rate >= 1) { money(r, `${d.name} (skim)`, -rate); r.gold += 1; r.stats.skims++; expose(r, d.exposure ?? 1, d.name) }
        break
      }
      case 'inheritance': money(r, 'Inheritance', CONFIG.inheritance); break
      case 'dividends': money(r, 'Dividends', d.power); break
      case 'telegram': { const help = card(r, pick(r, ATTACK_CARDS), true); help.free = true; r.hand.push(help); say(r, `Help is on its way: ${CARDS[help.key].name}, free to play.`); break }
      case 'telegraphLine': case 'efficiencyExpert': break
      case 'badBlood': badBloodRoll(r); break
      case 'looseThread': case 'marginCall': case 'iou': break
    }
  }
  checkBankrupt(r)
}

function sellOil(r: Run) {
  if (r.ap < 1 || r.oil < 1 || r.current.refuse) return
  r.ap -= 1
  const n = r.oil
  const each = netPrice(r)
  r.oil = 0
  r.stats.oilSold += n
  money(r, `Sold ${n} oil @ $${each}`, n * each)
}

/** What a Well sells for: $1 for every barrel still in it. */
export const wellValue = (w: Well) => (w.field ? CONFIG.fieldValue : w.reserve * CONFIG.sellPerBarrel)

function sellWell(r: Run, plot: number) {
  const w = r.plots[plot]
  if (r.ap < 1 || !w) return
  r.ap -= 1
  const value = wellValue(w)
  loseWell(r, plot, 'lost')
  money(r, w.field ? `Sold Field No. ${plot + 1}` : `Sold Well No. ${plot + 1} (${w.reserve} bbl left)`, value)
}

/** The Well a Firebreak costs you: the lowest output, then the fewest barrels left. */
export function weakestWell(r: Run): number {
  let best = -1
  r.plots.forEach((w, i) => {
    const b = best >= 0 ? r.plots[best]! : null
    if (w && (!b || w.output < b.output || (w.output === b.output && w.reserve < b.reserve))) best = i
  })
  return best
}

function firebreak(r: Run) {
  const i = weakestWell(r)
  if (!r.fire || r.ap < CONFIG.firebreakAP || i < 0) return
  r.ap -= CONFIG.firebreakAP
  loseWell(r, i, 'lost')
  r.fire = 0
  say(r, `Firebreak: Well No. ${i + 1} sacrificed. Every fire is out.`)
}

/** What the Baron's Lease takes: your most valuable card by shop price (never junk). */
export function mostValuable(r: Run): Card | null {
  const value = (c: Card) => CARDS[c.key].price ?? 0
  const real = r.deck.filter(c => !CARDS[c.key].junk && value(c) > 0)
  if (!real.length) return null
  return real.reduce((a, b) => (value(b) > value(a) ? b : a))
}

// --------------------------------------------------------------- end turn
export function intent(_r: Run, t: Threat): string {
  const d = THREATS[t.kind]
  const seq = [...d.cycle, ...(t.round3 && d.round3 ? [d.round3] : [])]
  return seq[t.step % seq.length]
}

export function intentText(r: Run, t: Threat): string {
  const a = intent(r, t)
  const hw = highestWell(r)
  const c = t.cycle
  switch (a) {
    case 'Rumble': { const i = rumbleTarget(r); return i < 0 ? 'The ground rumbles.' : r.plots[i]!.unstable ? `Well No. ${i + 1} shakes again.` : `Well No. ${i + 1} becomes Unstable.` }
    case 'Spray': return 'Lose $2 and 1 oil.'
    case 'Blow': { const u = r.plots.findIndex(w => w?.unstable); return u >= 0 ? `Well No. ${u + 1} is destroyed.` : 'Pressure builds.' }
    case 'Picket': return 'Lose $2.'
    case 'Sabotage': return wellCount(r) ? 'Destroys a random Well.' : 'Looks for a Well to wreck.'
    case 'Torch': return 'Starts a fire.'
    case 'Audit': return 'Your debt doubles next turn.'
    case 'Fine': return 'Lose $3.'
    case 'Raise Rates': return `Raises her freight charge: you get $1 less for every barrel you sell.`
    case 'Refuse': return "Won't carry your oil: you can't sell next turn."
    case 'Jump': return r.marked !== null && r.plots[r.marked] ? `Steals Well No. ${r.marked + 1}.` : 'Looks for a Well to steal.'
    case 'Scout': return hw >= 0 ? `Marks Well No. ${hw + 1}.` : 'Watches your claim.'
    case 'Short': return 'Oil price −$1.'
    case 'Margin Call': return 'Adds a Margin Call to your next hand.'
    case 'Rumours': return 'Adds Bad Blood to your deck.'
    case 'Paper Promise': return 'Adds an IOU to your hand.'
    case 'Lease': { const v = mostValuable(r); return v ? `Takes your ${CARDS[v.key].name} for good.` : 'Looks for something to take.' }
    case 'Arson': return `Starts ${fires(Math.min(CONFIG.fireMax, 2 + c))}.`
    // stage 2
    case 'Dig': return '+1 Board Exposure.'
    case 'Expose': return `Takes ${CONFIG.muckrakerGold} gold from your fortune.`
    case 'Headline': return 'Lose $4.'
    case 'Front Page': return '+2 Board Exposure.'
    case 'Price War': return 'Oil price −$1.'
    case 'Rail Deal': return r.items.includes('pipeline') ? 'A secret deal with the railway. Your Pipeline makes it pointless.' : 'A secret deal with the railway: you get $1 less for every barrel you sell.'
    case 'Squeeze': return 'Lose $3.'
    case 'Minutes': return '+1 Board Exposure.'
    case 'Clawback': return exposureHigh(r) ? `Exposure is high: takes ${CONFIG.clawbackGold} gold from your fortune.` : `Lose $4. (At ${CONFIG.exposureHigh}+ Exposure, takes ${CONFIG.clawbackGold} gold instead.)`
    case 'Cease and Desist': return 'Adds a Cease and Desist to your next hand: must play, 1 AP, does nothing.'
    case 'Royalty': return `Lose $1 for each Well and Field you own (${royalty(r)}).`
    case 'Injunction': return '−1 AP next turn.'
    case 'New Patent Claim': return "Adds a New Patent Claim to your next hand: it can't be played and takes a slot."
    case 'Leaky Tanks': return `Lose all your stored oil (${r.oil}) and ${Math.round(CONFIG.leakyTanksShare * 100)}% of your Capital (${leakyLoss(r)}).`
    case 'Proxy Meeting': return 'Nothing. The shareholders talk among themselves.'
    case 'Wreck': {
      const m = r.marked
      if (m === null || !r.plots[m]) return 'Looks for something to wreck.'
      return `Destroys ${plotName(r, m)}.`
    }
    case 'Infiltrate': { const i = infiltrateTarget(r); return i >= 0 ? `Marks ${plotName(r, i)}.` : 'Watches your fields.' }
    case 'Proration': return `Next turn you can pump only ${CONFIG.prorationCap} oil.`
    case 'Inspection': return `−${CONFIG.inspectionAP} AP next turn.`
    case 'Shut-in': { const i = rumbleTarget(r); return i >= 0 ? `Shuts in ${plotName(r, i)}: it pumps nothing this round.` : 'Looks for a Well to shut in.' }
    case 'Hostile Bid': return `Lose $${3 + c}.`
    case 'Proxy Ballot': return 'Adds a Proxy Ballot to your deck: must play, +1 Board Exposure.'
    case 'The Vote': return `+${1 + c} Board Exposure.`
    case 'Canvass': return '+1 Board Exposure.'
  }
  return a
}

/** Leaky Tanks takes a quarter of your Capital. */
export const leakyLoss = (r: Run) => `$${Math.floor(r.capital * CONFIG.leakyTanksShare)}`

/** The Patent Holder's Royalty: $1 per Well and Field, at least $1. */
export const royalty = (r: Run) => Math.max(1, wellCount(r))

export function fireTarget(r: Run): string {
  if (!r.fire) return ''
  if (r.oil > 0) return `Burns ${Math.min(r.oil, r.fire)} oil (${r.oil} → ${Math.max(0, r.oil - r.fire)}).`
  if (r.stage >= 2) return 'Nothing to burn: one fire dies down.'
  const i = highestWell(r)
  if (i < 0) return 'Nothing left to burn.'
  return `Destroys Well No. ${i + 1}.`
}

function endTurn(r: Run) {
  newReport(r)
  // unplayed Must play cards still cost their money
  for (const c of r.hand.filter(x => CARDS[x.key].forced)) {
    const d = CARDS[c.key]
    if (c.key === 'badBlood') beat(r, 'cards', 'Bad Blood', badBloodRoll(r) ? 'Someone set a fire.' : 'Nothing happened. This time.')
    else if (d.exposure) { beat(r, 'board', d.name, `Unplayed: +${d.exposure} Board Exposure.`); captured = []; expose(r, d.exposure, d.name); captured = null }
    else if (d.cost) { money(r, d.name, -d.cost); beat(r, 'money', d.name, `Unplayed: −$${d.cost}.`) }
    spendCard(r, c)
    if (r.phase === 'lost') return
  }
  for (const t of liveThreats(r)) {
    if (t.kind === 'inspector' && r.capital >= CONFIG.inspectorReserve) {
      say(r, 'The Inspector is impressed by your reserves.')
      beat(r, 'enemy', THREATS[t.kind].name, `Impressed by your reserves: −${CONFIG.inspectorReserveDamage} Hold.`, t.id)
      hit(r, t, CONFIG.inspectorReserveDamage)
    }
  }
  if (checkBankrupt(r) || r.phase !== 'turn') return
  r.discard.push(...r.hand.filter(c => !c.temp))
  r.hand = r.hand.filter(c => c.temp && c.key === 'iou')
  // fire burns
  if (r.fire) {
    const title = `${fires(r.fire)} burning`
    if (r.oil > 0) { const burnt = Math.min(r.oil, r.fire); r.oil -= burnt; say(r, `Fire burnt ${burnt} oil.`); beat(r, 'fire', title, `Burnt ${burnt} oil.`) }
    else if (r.stage >= 2) { r.fire -= 1; say(r, r.fire ? 'Nothing to burn: one fire dies down.' : 'Nothing to burn: the fire went out.'); beat(r, 'fire', title, r.fire ? 'Nothing to burn. One fire dies down.' : 'Nothing to burn. It went out.') } // steel and brick: Wells don't burn
    else {
      const i = highestWell(r)
      if (i < 0) { r.fire = 0; say(r, 'The fire burnt itself out.'); beat(r, 'fire', title, 'Nothing left to burn. It went out.') }
      else { loseWell(r, i, 'burnt'); say(r, `Fire destroyed Well No. ${i + 1}.`); beat(r, 'fire', title, `Destroyed Well No. ${i + 1}.`) }
    }
  }
  // enemies act
  let dmg = 0
  for (const t of liveThreats(r)) {
    const a = intent(r, t)
    const seqLen = THREATS[t.kind].cycle.length + (t.round3 && THREATS[t.kind].round3 ? 1 : 0)
    t.step += 1
    const c = t.cycle
    if (t.step % seqLen === 0) t.cycle += 1
    const name = THREATS[t.kind].name
    const preview = intentText(r, { ...t, step: t.step - 1, cycle: c }) // what the panel promised
    if (t.stopped) { t.stopped = false; say(r, `${name}'s ${a} was stopped.`); beat(r, 'enemy', `${name} · ${a}`, 'Stopped by Shore Up.', t.id); continue } // the move is skipped, not delayed
    beat(r, 'enemy', `${name} · ${a}`, preview, t.id)
    const line = r.report[r.report.length - 1]
    captured = []
    switch (a) {
      case 'Rumble': { const i = rumbleTarget(r); if (i >= 0) { const again = r.plots[i]!.unstable; r.plots[i]!.unstable = true; say(r, again ? `Well No. ${i + 1} shakes again.` : `Well No. ${i + 1} is Unstable.`) } break }
      case 'Spray': dmg += 2; r.oil = Math.max(0, r.oil - 1); break
      case 'Blow': {
        const u = r.plots.findIndex(w => w?.unstable)
        if (u >= 0) { loseWell(r, u, 'lost'); t.hold = Math.min(t.maxHold, t.hold + 2); say(r, `Blowout! Well No. ${u + 1} destroyed.`) }
        const i = rumbleTarget(r); if (i >= 0) r.plots[i]!.unstable = true
        break
      }
      case 'Picket': dmg += 2; break
      case 'Sabotage':
      { // one random Well
        const standing = r.plots.map((w, i) => (w ? i : -1)).filter(i => i >= 0)
        if (standing.length) { const i = pick(r, standing); loseWell(r, i, 'lost'); say(r, `${name} sabotaged Well No. ${i + 1}.`) }
        break
      }
      case 'Torch': startFire(r, 1); break
      case 'Audit': r.pending.audit = true; break
      case 'Fine': dmg += 3; break
      case 'Raise Rates': r.freight += 1; break
      case 'Refuse': r.pending.refuse = true; break
      case 'Jump':
        if (r.marked !== null && r.plots[r.marked]) { say(r, `The Claim Jumper stole Well No. ${r.marked + 1}.`); loseWell(r, r.marked, 'stolen') }
        r.marked = null
        break
      case 'Scout': { const i = highestWell(r); r.marked = i >= 0 ? i : null; break }
      case 'Short': r.short += 1; break
      case 'Margin Call': r.pending.margin += 1; break
      case 'Rumours': addJunk(r, 'badBlood'); say(r, 'Rumours: Bad Blood added to your deck.'); break
      case 'Paper Promise': r.hand.push(card(r, 'iou', true)); break
      case 'Lease': {
        const v = mostValuable(r)
        if (v) { removeFromDeck(r, v); say(r, `Hostile Lease: ${CARDS[v.key].name} taken for good.`) }
        break
      }
      case 'Arson': startFire(r, Math.min(CONFIG.fireMax, 2 + c)); break
      // stage 2
      case 'Dig': case 'Minutes': case 'Canvass': expose(r, 1, a, t.id); break
      case 'Front Page': expose(r, 2, a, t.id); break
      case 'Expose': takeGold(r, CONFIG.muckrakerGold, name); break
      case 'Headline': dmg += 4; break
      case 'Price War': r.short += 1; break
      case 'Rail Deal': if (!r.items.includes('pipeline')) r.freight += 1; break
      case 'Squeeze': dmg += 3; break
      case 'Clawback': if (exposureHigh(r)) takeGold(r, CONFIG.clawbackGold, name); else dmg += 4; break
      case 'Cease and Desist': r.pending.cease += 1; break
      case 'Royalty': dmg += royalty(r); break
      case 'Injunction': r.pending.ap += 1; break
      case 'Inspection': r.pending.ap += CONFIG.inspectionAP; break
      case 'New Patent Claim': r.pending.claims = (r.pending.claims ?? 0) + 1; break
      case 'Leaky Tanks': {
        const lost = Math.floor(r.capital * CONFIG.leakyTanksShare)
        if (r.oil) say(r, `Leaky tanks: ${r.oil} oil lost.`)
        r.oil = 0
        if (lost) { money(r, 'Leaky tanks', -lost); say(r, `Leaky tanks: −$${lost}.`) }
        break
      }
      case 'Proxy Meeting': break
      case 'Wreck': {
        const m = r.marked
        if (m !== null && r.plots[m]) { say(r, `${plotName(r, m)} wrecked.`); loseWell(r, m, 'lost') }
        r.marked = null
        break
      }
      case 'Infiltrate': { const i = infiltrateTarget(r); r.marked = i >= 0 ? i : null; break }
      case 'Proration': r.pending.prorate = true; break
      case 'Shut-in': { const i = rumbleTarget(r); if (i >= 0) { r.plots[i]!.unstable = true; say(r, `${plotName(r, i)} is shut in this round.`) } break }
      case 'Hostile Bid': dmg += 3 + c; break
      case 'Proxy Ballot': addJunk(r, 'proxyBallot'); say(r, 'A Proxy Ballot is in your deck.'); break
      case 'The Vote': expose(r, 1 + c, 'The Vote', t.id); break
    }
    if (isLost(r)) { if (captured.length) line.text = captured.join(' '); captured = null; return }
    // report what actually happened, if the move said so; otherwise what it promised
    if (captured.length) line.text = captured.join(' ')
    captured = null
  }
  const blocked = Math.min(dmg, r.cover)
  const taken = dmg - blocked
  r.cover -= blocked // Cover is used up as it blocks
  if (taken) money(r, 'Fines and losses', -taken)
  if (blocked) say(r, `Cover blocked $${blocked}.`)
  if (dmg) beat(r, 'money', 'Fines and losses', blocked ? (taken ? `−$${taken}. Cover blocked $${blocked}.` : `Cover blocked all $${dmg}.`) : `−$${taken}.`)
  if (checkBankrupt(r)) return
  if (r.turn >= CONFIG.turnLimit) { r.phase = 'lost'; r.loss = { reason: 'stalemate', by: liveThreats(r).map(t => THREATS[t.kind].name) }; return }
  beginTurn(r)
  if (r.phase === 'turn') {
    if (r.cover) beat(r, 'info', 'Accountant', `${r.cover} Cover carried over.`)
    beat(r, 'info', `Turn ${r.turn}`, `Your move. ${r.ap} AP, ${r.hand.length} cards.`)
  }
}

// ---------------------------------------------------------------- dispatcher
// ------------------------------------------------------------ between stages
/**
 * Stage 1 → 2: the company incorporates. Wells become Fields (1 oil, never dry),
 * Prospects wear out and the Exchange sells Wells instead, the board arrives with its
 * Exposure meter, and there's a loan on the table, plus upgrades and destroys.
 */
export function incorporate(r: Run) {
  r.stage = 2
  r.round = 0
  r.phase = 'incorporate'
  r.stageGold = r.gold
  r.plots = r.plots.map(w => (w ? { output: CONFIG.stage2Output, reserve: w.reserve, field: true } : null))
  for (const c of r.deck) if (c.key === 'prospect') { c.key = 'oldProspect'; c.uses = CARDS.oldProspect.uses; c.up = false }
  r.deck.push(card(r, 'derrick'), card(r, 'payDividend'), card(r, 'expenseAccount'))
  r.prospectPrice = CONFIG.derrickPrice
  r.exposure = Math.min(CONFIG.exposureStartCap, Math.floor(r.stats.skims / CONFIG.exposureStartPer))
  r.shop = { cards: [], item: null, loanTaken: false, prospectSold: true, bucketSold: true, boon: null, dividendPaid: true }
  r.threats = []
  r.modifier = null
  r.short = 0; r.freight = 0; r.fire = 0; r.marked = null; r.cover = 0
  r.hand = []; r.draw = []; r.discard = []
  r.ledger = []; r.events = []
  r.roundStart = snapshot(r)
}
const INCORPORATE_ACTIONS: Action['type'][] = ['takeLoan', 'upgradeCard', 'destroyCard', 'leaveShop']

/** Playtest tools, only on admin runs. */
function adminAction(r: Run, op: AdminOp, key?: CardKey, target?: number) {
  switch (op) {
    case 'hold20': { // 0 AP, ignores weaknesses and immunities
      const t = liveThreats(r).find(x => x.id === target) ?? liveThreats(r)[0]
      if (r.phase === 'turn' && t) { say(r, `Admin: ${THREATS[t.kind].name} −20 Hold.`); hit(r, t, Math.min(20, t.hold), false, true) }
      break
    }
    case 'cash': money(r, 'Admin', 10); break
    case 'gold': r.gold += 1; break
    case 'exposureUp': expose(r, 1, 'Admin'); break
    case 'exposureDown': expose(r, -1, 'Admin'); break
    case 'ap': if (r.phase === 'turn') r.ap += 1; break
    case 'winRound': if (r.phase === 'turn') for (const t of liveThreats(r)) hit(r, t, t.hold, false, true); break
    case 'addCard': if (key && r.phase === 'turn') { const c = card(r, key); r.deck.push(c); r.hand.push(c); say(r, `Admin: ${CARDS[key].name} added to your hand.`) } else if (key) { r.deck.push(card(r, key)); say(r, `Admin: ${CARDS[key].name} added to your deck.`) } break
  }
}

export function act(prev: Run, a: Action): Run {
  const r = clone(prev)
  if (a.type === 'admin') { if (r.admin && r.phase !== 'lost') adminAction(r, a.op, a.card, a.target); return r }
  if (r.phase === 'shop') { shopAction(r, a); return r }
  if (r.phase === 'incorporate') { if (INCORPORATE_ACTIONS.includes(a.type)) shopAction(r, a); return r }
  if (r.phase === 'stageComplete' && a.type === 'continue' && r.stage === 1) { incorporate(r); return r }
  if (r.phase === 'roundWon' && r.spoils && (a.type === 'takeSpoils' || a.type === 'sellSpoils')) {
    if (a.type === 'takeSpoils') { r.deck.push(card(r, r.spoils)); say(r, `${CARDS[r.spoils].name} added to your deck.`) }
    else money(r, `Turned down ${CARDS[r.spoils].name}`, CONFIG.spoilsCash)
    r.spoils = null
    return r
  }
  if (r.phase === 'roundWon' && a.type === 'continue') {
    r.spoils = null
    r.phase = 'shop'; r.hand = []; openShop(r); r.ledger = []; r.events = []
    return r
  }
  if (r.phase !== 'turn') return r
  switch (a.type) {
    case 'play': play(r, a.cardId, a.target); break
    case 'sellOil': sellOil(r); break
    case 'sellWell': sellWell(r, a.plot); break
    case 'firebreak': firebreak(r); break
    case 'endTurn': endTurn(r); break
  }
  return r
}

/** Rounds completed so far, out of 16, for progress bars and run history. */
export function roundsReached(r: Run): number {
  return (r.stage - 1) * 4 + Math.max(1, r.round)
}
