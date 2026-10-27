// The Oil rules, stages 1 to 4. Pure functions over a plain-object Run, so the same code
// drives the game screens, the tests and the balance simulator.
import { CONFIG } from './config'
import {
  ATTACK_CARDS, BOSS, CARDS, INCORPORATE_OFFER_2, CASH_POOLS, ENGINE_POOLS, ITEMS, PROSPECTS, PROSPECT_FOR, WATER_FOR, STARTER, THREATS, UPGRADES, shopPool,
  BOONS, REWARDS, BRIBES, INCORPORATE_OFFER_3, INCORPORATE_OFFER_4, STAGE4_POOL, badBloodFor, TRUTH_PHASES, bossRound, TO_DEAD_WEIGHT, TO_DRY_LEASE, fadedDef, boonInfo, landCardFor, type BoonKey, type RewardKey, type BonusKey, type CardDef, type CardKey, type Family, type ItemKey, type ThreatKind,
} from './data'
import { next, pick, shuffle } from './rng'
import { newTally, type Tally } from './tactics'

export interface Card { id: number; key: CardKey; uses: number | null; temp?: boolean; free?: boolean; up?: boolean; up2?: boolean; faded?: boolean } // free: costs no AP · up: upgraded · up2: upgraded twice (stage 3) · faded: unused
export interface Well { output: number; reserve: number; unstable?: boolean; field?: boolean; lasting?: boolean; rig?: boolean; faithful?: boolean } // faithful: Old Faithful, which nothing can touch // a Field (an old Well), a stage 2 Well (lasting) and a stage 3 Rig never run dry
export const neverDry = (w: Well) => !!(w.field || w.lasting || w.rig || w.faithful)
/** Wells enemies, fires and Firebreaks can go for: every one but Old Faithful. */
const exposed = (w: Well | null): w is Well => !!w && !w.faithful
export interface Threat { id: number; kind: ThreatKind; hold: number; maxHold: number; step: number; cycle: number; round3: boolean; beaten: boolean; opened?: string; stopped?: boolean; cover?: number; poison?: Poison[]
  phase?: number // the Truth: which of its four phases it's in
  fed?: number // the Bribery Scandal: bribes paid this fight
  baseCover?: number // the Truth: its Cover each turn (the hour it was met at)
  coverNext?: number // Cover it has next turn instead of its usual (Containment Fails)
  entryHour?: number // the Truth: the hour on the clock when you met it
}
/** Damage still to land on an enemy as one of your turns ends (Infiltrate). */
export interface Poison { turn: number; family: Family; power: number }
export interface LedgerLine { label: string; amount: number }
/** One line of the end-of-turn report, played back on the ticker tape. */
export interface Beat { kind: 'enemy' | 'fire' | 'money' | 'cards' | 'shuffle' | 'oil' | 'info' | 'board' | 'gold'; title: string; text: string; who?: number }
export type Phase = 'shop' | 'turn' | 'roundWon' | 'lost' | 'stageComplete' | 'incorporate'
export type LossReason = 'bankrupt' | 'stalemate' | 'ousted' | 'ruined' | 'brokenUp' | 'midnight'

export interface ShopOffer {
  cards: (CardKey | null)[]
  item: ItemKey | null
  loanTaken: boolean
  prospectSold: boolean // one Prospect per visit
  bucketSold: boolean // one Bucket of Water per visit
  boon: BoonKey | null // before the boss: one small item for gold
  dividendPaid: boolean // the shop's dividend, once per visit (stage 2 on)
  siloSold?: boolean // the Exchange's Silo, once per visit
  duplicated?: boolean // the Exchange's duplicate, once per visit
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
  short: number
  freight: number
  pending: { ap: number; audit: boolean; refuse: boolean; margin: number; cease: number; prorate: boolean; claims?: number; badBlood?: number; shutdown?: number; declarations?: number; compensation?: number; apTo1?: boolean; cardCap?: number }
  current: { audit: boolean; refuse: boolean; prorate: boolean; shutdown?: number; apTo1?: boolean; cardCap?: number }
  items: ItemKey[]
  destroyCost: number
  prospectPrice: number
  shop: ShopOffer
  ledger: LedgerLine[]
  events: string[]
  tally?: Tally // hidden: how the run was played, for the tactic badge at the end
  stats: { oilSold: number; earned: number; spent: number; wellsBuilt: number; wellsBurnt: number; wellsStolen: number; wellsLost: number; wellsDry: number; skims: number }
  loss?: { reason: LossReason; by: string[] }
  roundStart: Snapshot
  boon: BoonKey | null // bought before the boss
  reward: RewardKey | null // given for beating the boss
  tempStorage: number // storage that only lasts for the boss round
  spoils: CardKey | null // the card offered after a round is won
  report: Beat[] // what happened since you last acted, in order
  reportSeq: number // goes up each time a new report starts
  exposure: number // Board Exposure, 0 to exposureMax (stage 2 only)
  goldShield: boolean // a Personal Lawyer is guarding your fortune this turn
  boost: number // oil sells this much more this turn (Ticker Tape)
  upgradeCost: number
  duplicateCost?: number // incorporation: rises with each duplicate
  residue: ItemKey | null // left behind by the stage's meter
  stageGold: number // gold at the start of this stage
  silos?: number // Exchange Silos built (at most silo2Max)
  admin?: boolean // a playtest run started from admin mode: never recorded
  heat: number // stage 3: 0 to heatMax; every AP spent adds to it, and at the top you're broken up
  roundBoost: number // oil sells this much more for the rest of the round (Queues at the Pump)
  shredded: boolean // the Paper Shredder has been used this round
  doubleSale?: boolean // the Oil Shock: the next sale this turn pays double
  oilShockBought?: boolean // the Oil Shock is sold once a run
  skimBase?: number // gold skimmed before this stage began (for stage 3's starting Heat)
  offer?: CardKey[] // incorporation: the new cards on offer
  picked?: CardKey[] // incorporation: the ones chosen so far
  leftover?: CardKey[] // offered at incorporation, not picked: on sale at the first shop visit
  clock?: number // stage 4: the Truth clock, 1 to clockMax; midnight loses the run
  met?: ThreatKind[] // stage 4 enemies already met this run: never the same one twice
  freeDestroys?: number // becoming Big Oil: free destroys left in the clear-out
  bigOilStep?: 'pick' | 'clear' // becoming Big Oil: pick the new cards, then the free clear-out, then the shop
  captured?: boolean // Carbon Capture: the next move that would move the clock on doesn't
  amplify?: boolean // Influencers: the next card's Hold damage or Cover is doubled
  played?: number // cards played this turn (a Subpoena caps it)
  uniques?: CardKey[] // one-in-the-game cards already had: never offered again
  fireBy?: string // who started the latest fire, for the fire panel
  leftBehind?: { by: string; cards: CardKey[] } // cards a beaten enemy put in your deck this round (the Bank Inspector's report)
  feats?: Feats // for achievements: things the run state alone doesn't show
}

/** Kept for achievements. pumped: oil pumped this run; bestHit: most Hold one card removed; scratched: an enemy took Capital this fight; cleanFight: won a stage 3 or 4 fight untouched; quickBoss: beat a boss on turn 1. */
export interface Feats { pumped: number; bestHit: number; scratched: boolean; cleanFight: boolean; quickBoss: boolean }
export const feats = (r: Run): Feats => (r.feats ??= { pumped: 0, bestHit: 0, scratched: false, cleanFight: false, quickBoss: false })

export type AdminOp = 'cash' | 'gold' | 'exposureUp' | 'exposureDown' | 'heatUp' | 'heatDown' | 'clockUp' | 'clockDown' | 'ap' | 'winRound' | 'addCard' | 'hold20'

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
  | { type: 'duplicateCard'; cardId: number }
  | { type: 'admin'; op: AdminOp; card?: CardKey; target?: number }
  | { type: 'shred'; cardId: number } // stage 3: the Paper Shredder, once a round
  | { type: 'pickCard'; key: CardKey }
  | { type: 'leaveShop' }
  | { type: 'continue' }

// ------------------------------------------------------------------ helpers
const clone = <T,>(x: T): T => structuredClone(x)
const card = (r: Run, key: CardKey, temp = false): Card => ({ id: r.nextId++, key, uses: CARDS[key].uses, temp })

/** What a card does, upgrades included. */
export function cardDef(c: { key: CardKey; up?: boolean; up2?: boolean; faded?: boolean }): CardDef {
  let d = CARDS[c.key]
  if (c.up) d = { ...d, ...UPGRADES[c.key], name: UPGRADES[c.key]?.name ?? `${d.name}+` }
  if (c.up && c.up2) d = secondUpgrade(CARDS[c.key], d)
  return c.faded ? fadedDef(d) : d
}
// where each number sits in a card's text, so a second upgrade can rewrite it
const NUMBER_IN_TEXT: Partial<Record<keyof CardDef, RegExp>> = {
  power: /(Remove |\+\$|\+)(\d+)( Hold| AP| oil|\.)/, heat: /(−)(\d+)( Heat)/, draw: /(Draw )(\d+)()/, cover: /(\+)(\d+)( Cover)/,
  cost: /(Pay \$)(\d+)()/, goldBack: /(\+\$)(\d+)(\.\s*$)/, roundBoost: /(\+\$)(\d+)()/,
}
/** Stage 3 lets a card be upgraded twice: the second upgrade repeats the first one's gain. */
function secondUpgrade(base: CardDef, up: CardDef): CardDef {
  const d: CardDef = { ...up, name: `${up.name}+` }
  let text = up.text
  for (const k of Object.keys(NUMBER_IN_TEXT) as (keyof CardDef)[]) {
    const a = base[k], b = up[k]
    if (typeof a !== 'number' || typeof b !== 'number' || a === b) continue
    const v = Math.max(k === 'heat' ? -99 : 0, b + (b - a))
    ;(d as unknown as Record<string, number>)[k] = v
    text = text.replace(NUMBER_IN_TEXT[k]!, (_m, pre: string, _n: string, post: string) => `${pre}${Math.abs(v)}${post}`)
  }
  if (typeof base.ap === 'number' && typeof up.ap === 'number' && up.ap < base.ap) {
    d.ap = Math.max(0, up.ap - (base.ap - up.ap))
  }
  return { ...d, text: text.replace(/Pay \$0\. /, '') }
}
/** Can this card take an upgrade? Once in stage 2; in stage 3, twice if the second one adds anything. */
export function canUpgrade(c: Card, stage = 2): boolean {
  if (c.temp || c.faded || !UPGRADES[c.key]) return false
  if (!c.up) return true
  if (stage < 3 || c.up2) return false
  const same = (d: CardDef) => JSON.stringify({ ...d, name: '', text: '' })
  return same(cardDef({ ...c, up2: true })) !== same(cardDef(c))
}
/** The Exchange can copy any card with a shop price (not junk), upgrade and all, for that price. */
export const canDuplicate = (c: Card) => !c.temp && !c.faded && !CARDS[c.key].junk && !CARDS[c.key].unique && !!CARDS[c.key].price
export const isProspect = (k: CardKey) => PROSPECTS.includes(k)

// only stage 1 sells a fire card
export const waterPrice = () => CONFIG.bucketPrice
/** Can a Well card be built? Stage 1 needs an empty plot; from stage 2 a Well claims a new plot if there's none. */
export const canBuild = (r: Run) => freePlot(r) >= 0 || (r.stage >= 2 && r.plots.length < CONFIG.maxPlots)
export const rigCount = (r: Run) => r.plots.filter(w => w?.rig).length
const BUILDS: CardKey[] = ['well', 'wildcat', 'derrick', 'rig']

export function skimRate(r: Run): number {
  const table = r.stage >= 4 ? CONFIG.skimRate4 : r.stage >= 3 ? CONFIG.skimRate3 : r.stage >= 2 ? CONFIG.skimRate2 : CONFIG.skimRate
  return table[r.round] ?? table[4]
}

/** What an item costs in the shop: Board Grudge marks every item up. */
export const itemPrice = (r: Run, it: ItemKey) => ITEMS[it].price + (r.items.includes('boardGrudge') ? CONFIG.grudgeMarkup : 0)
export function price(r: Run): number {
  const base = atWar(r) ? CONFIG.warPrice : r.stage >= 4 ? CONFIG.oilPrice4 : r.stage >= 3 ? CONFIG.oilPrice3 : r.stage >= 2 ? CONFIG.oilPrice2 : CONFIG.oilPrice
  let p = base - r.short + r.boost + (r.roundBoost ?? 0) + (r.items.includes('refinery') ? 1 : 0)
    - r.items.filter(i => i === 'supertanker').length * CONFIG.supertankerCut
  return Math.max(CONFIG.oilFloor, p)
}
/** What you get per barrel after freight; never below the floor. */
export const netPrice = (r: Run) => Math.max(CONFIG.oilFloor, price(r) - freight(r))
export const freight = (r: Run) => r.freight
/** Oil already sells for the floor price: more freight would change nothing. */
export const atFloor = (r: Run) => price(r) - r.freight <= CONFIG.oilFloor

export function debtPerTurn(r: Run): number {
  if (r.stage === 3) return 0 // no Bank Debt in stage 3: Heat is the clock (stage 4 has the World Bank)
  return r.debt
}

/** The Fossil Fuel Subsidy: the cards you started the game with (and copies of them) cost 0 AP. */
const STARTER_KEYS = new Set<CardKey>(STARTER)
export const apCost = (r: Run, c: Card) => (c.free || (r.items.includes('fossilSubsidy') && STARTER_KEYS.has(c.key)) ? 0 : cardDef(c).ap ?? 0)
export const freePlot = (r: Run) => r.plots.findIndex(p => p === null)
export const highestWell = (r: Run) => { for (let i = r.plots.length - 1; i >= 0; i--) if (exposed(r.plots[i])) return i; return -1 }
/** Where a Rumble lands: your highest stable Well, or if every Well is already unstable, the highest one. */
/** Where a Blow lands: the Well the last Rumble shook (the highest-numbered unstable one), or −1. */
export const blowTarget = (r: Run) => { for (let i = r.plots.length - 1; i >= 0; i--) if (r.plots[i]?.unstable) return i; return -1 }
export const rumbleTarget = (r: Run) => { for (let i = r.plots.length - 1; i >= 0; i--) if (exposed(r.plots[i]) && !r.plots[i]!.unstable) return i; return highestWell(r) }
export const liveThreats = (r: Run) => r.threats.filter(t => !t.beaten)
/** While War lasts: only warOutput barrels a turn, but oil sells for warPrice. */
export const atWar = (r: Run) => r.stage >= 4 && r.threats.some(t => t.kind === 'war' && !t.beaten)
export const wellCount = (r: Run) => r.plots.filter(Boolean).length
const pumps = (w: Well | null) => (w && !w.unstable ? (neverDry(w) ? w.output : Math.min(w.output, w.reserve)) : 0)
export const production = (r: Run) => {
  if (r.fire) return 0
  let made = r.plots.reduce((s, w) => s + pumps(w), 0)
  if (r.current.shutdown) made = Math.max(0, made - r.current.shutdown * CONFIG.rigOutput) // the Spill shuts a Rig for a turn
  if (atWar(r)) made = Math.min(CONFIG.warOutput, made)
  return r.current.prorate ? Math.min(CONFIG.prorationCap, made) : made
}
export const fieldCount = (r: Run) => r.plots.filter(w => w?.field).length
/** What R&D Sprint counts: every Well and Field in stage 2 (Fields only, in theory, before). */
const sprintWells = (r: Run) => (r.stage >= 2 ? wellCount(r) : fieldCount(r))

/** The hidden tally, made on first use (runs saved before it existed have none). */
function tally(r: Run): Tally { return (r.tally ??= newTally()) }

function money(r: Run, label: string, amount: number) {
  if (amount === 0) return
  r.capital += amount
  r.ledger.push({ label, amount })
  if (amount > 0) r.stats.earned += amount; else r.stats.spent -= amount
  if (amount < 0 && captured) feats(r).scratched = true // an enemy move took it
}
let playHit = 0 // Hold removed by the card being played
let captured: string[] | null = null // messages from the move being resolved, for the turn report
function say(r: Run, msg: string) { r.events.unshift(msg); r.events = r.events.slice(0, 6); captured?.push(msg) }
function beat(r: Run, kind: Beat['kind'], title: string, text: string, who?: number) { r.report.push({ kind, title, text, who }) }
function newReport(r: Run) { r.report = []; r.reportSeq += 1 }

/** Checked after things that can end the run, past TypeScript's narrowing of phase. */
const isLost = (r: Run) => r.phase === 'lost'
export const exposureHigh = (r: Run) => r.exposure >= CONFIG.exposureHigh
/** Moves Board Exposure (stage 2 on). At the top you're ousted. */
function expose(r: Run, n: number, why: string, who?: number) {
  if (r.stage !== 2 || n === 0) return // the board only watches in stage 2
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
export const heatHigh = (r: Run) => r.heat >= CONFIG.heatHigh
/** Moves Heat (stage 3 only). At the top the company is broken up. Quiet changes (AP spent) aren't announced. */
function heat(r: Run, n: number, why: string, who?: number, quiet = false) {
  if (r.stage !== 3 || n === 0 || r.phase === 'lost') return
  const before = r.heat
  const won = r.phase === 'roundWon' || r.phase === 'stageComplete' // a win at the buzzer still counts
  r.heat = Math.max(0, Math.min(won ? CONFIG.heatMax - 1 : CONFIG.heatMax, r.heat + n))
  if (r.heat === before) return
  if (r.heat < before) tally(r).cooled += before - r.heat
  if (!quiet) {
    const msg = `${why}: Heat ${n > 0 ? '+' : '−'}${Math.abs(r.heat - before)} (${r.heat}/${CONFIG.heatMax}).`
    say(r, msg)
    if (!captured) beat(r, 'board', 'Heat', msg, who)
  }
  if (r.heat >= CONFIG.heatMax) {
    r.phase = 'lost'
    r.loss = { reason: 'brokenUp', by: liveThreats(r).map(t => THREATS[t.kind].name) }
  }
}
/** Moves the Truth clock (stage 4 only). At midnight the run is lost. */
function moveClock(r: Run, n: number, why: string, who?: number) {
  if (r.stage !== 4 || n === 0 || r.phase === 'lost') return
  const before = r.clock ?? CONFIG.clockStart
  if (n > 0 && r.captured) { r.captured = false; const msg = `Carbon Capture: ${why} doesn't move the clock.`; say(r, msg); if (!captured) beat(r, 'board', 'The Truth clock', msg, who); return }
  const won = r.phase === 'roundWon' || r.phase === 'stageComplete' // a win at the buzzer still counts
  r.clock = Math.max(1, Math.min(won ? CONFIG.clockMax - 1 : CONFIG.clockMax, before + n))
  if (r.clock === before) return
  if (r.clock < before && why !== 'Admin') tally(r).cooled += (before - r.clock) * CONFIG.tactics.clockHourWorth // Spin Doctor: winding the clock back counts like cooling Heat
  const msg = `${why}: the clock ${n > 0 ? 'moves on' : 'goes back'} to ${clockText(r.clock)}.`
  say(r, msg)
  if (!captured) beat(r, 'board', 'The Truth clock', msg, who)
  if (r.clock >= CONFIG.clockMax) {
    r.phase = 'lost'
    r.loss = { reason: 'midnight', by: liveThreats(r).map(t => THREATS[t.kind].name) }
  }
}
/** "11 o'clock", or "Midnight". */
export const clockText = (h: number) => (h >= CONFIG.clockMax ? 'midnight' : `${h} o'clock`)
/** What Heat the AP you just spent adds (stage 3). */
const apHeat = (r: Run, ap: number) => heat(r, ap * CONFIG.heatPerAP, 'Effort', undefined, true)
/** Hand size: 5, plus a Rolodex each, up to handMax. */
export const handSize = (r: Run) => Math.min(CONFIG.handMax, CONFIG.handSize + r.items.filter(i => i === 'rolodex').length)
/** Heat from an enemy (stage 3): Cover blocks it first, like cash. */
function enemyHeat(r: Run, n: number, why: string, who?: number) {
  const blocked = Math.min(n, r.cover)
  if (blocked) { r.cover -= blocked; tally(r).absorbed += blocked; say(r, `Cover blocked ${blocked} Heat.`) }
  heat(r, n - blocked, why, who)
}
/** The cards the shop and the spoils draw from: the Oil Shock only until you've had one. */
const poolFor = (r: Run): CardKey[] => shopPool(r.stage).filter(k => (k !== 'oilShock' || !(r.oilShockBought || r.deck.some(c => c.key === 'oilShock')))
  && (!CARDS[k].unique || !(r.uniques?.includes(k) || r.deck.some(c => c.key === k)))) // one-in-the-game cards: never offered again once had
const gotCard = (r: Run, key: CardKey) => {
  if (key === 'oilShock') r.oilShockBought = true
  if (CARDS[key].unique && !r.uniques?.includes(key)) r.uniques = [...(r.uniques ?? []), key]
}

/** An enemy takes gold from your own fortune. Below 0 gold, you're ruined. */
function takeGold(r: Run, n: number, who: string) {
  if (r.goldShield) { r.goldShield = false; say(r, `Your Personal Lawyer kept ${who} away from your fortune.`); return }
  const amount = Math.max(0, n - (r.items.includes('offshore') ? 1 : 0) - (r.items.includes('offshoreTrust') ? 1 : 0))
  if (!amount) { say(r, `Your Offshore Account kept your fortune out of reach.`); return }
  r.gold -= amount
  say(r, `${who} took ${amount} gold from your fortune.`)
  if (r.gold < 0 && r.phase !== 'lost') {
    r.phase = 'lost'
    r.loss = { reason: 'ruined', by: [who] }
  }
}

/** What an enemy is weak to now: the Truth's weakness changes with each phase. */
export const weakOf = (kind: ThreatKind, phase = 0): Family | undefined => (kind === 'truth' ? TRUTH_PHASES[Math.min(phase, TRUTH_PHASES.length - 1)].weak : THREATS[kind].weak)
/** The Truth's current phase, by name. */
export const phaseName = (t: Threat) => (t.kind === 'truth' ? TRUTH_PHASES[Math.min(t.phase ?? 0, TRUTH_PHASES.length - 1)].name : '')
export function damageFor(family: Family, power: number, kind: ThreatKind, phase = 0): number {
  const t = THREATS[kind]
  if (t.immune === family) return 0
  if (weakOf(kind, phase) === family) return power * 2
  if (t.resist === family) return Math.floor(power / 2)
  return power
}
/** Hold an attack would actually remove from this enemy now, after its Cover. */
export const damageOn = (t: Threat, family: Family, power: number) => Math.max(0, damageFor(family, power, t.kind, t.phase) - (t.cover ?? 0))
export const ATTACK_FAMILIES: Family[] = ['Legal', 'Dirty', 'Bury', 'Lobby']
export const isAttack = (key: CardKey) => ATTACK_FAMILIES.includes(CARDS[key].family) && (CARDS[key].power > 0 || !!CARDS[key].spendCover)
/** An attack's strength now: Retain Counsel spends all your Cover as damage, plus its own power. */
export const attackPower = (r: Run, d: CardDef) => (d.spendCover ? r.cover + d.power : d.power)

export const fires = (n: number) => `${n} fire${n === 1 ? '' : 's'}`
/** Starts `count` new fires (Fire is the number of fires burning, up to fireMax). */
function startFire(r: Run, count: number, by?: string) {
  if (r.stage >= 3) return // no fires in stage 3
  r.fireBy = by ?? r.fireBy
  r.fire = Math.min(CONFIG.fireMax, r.fire + count)
  say(r, `Fire! ${fires(r.fire)} burning. Pumps stopped.`)
}

/** Destroys a card in your hand for good (a temporary card just goes). */
function destroyInHand(r: Run, c: Card) {
  r.hand = r.hand.filter(x => x.id !== c.id)
  if (!c.temp) { removeFromDeck(r, c); tally(r).destroyed++ }
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
  if (next(r) < CONFIG.badBloodFireChance) { say(r, 'Bad Blood: someone set a fire.'); startFire(r, 1, 'Bad Blood'); return true }
  say(r, 'Bad Blood: nothing happened. This time.')
  return false
}
function loseWell(r: Run, i: number, how: 'burnt' | 'stolen' | 'lost' | 'dry') {
  if (r.plots[i]?.faithful) return // Old Faithful stands
  if (!r.plots[i]) return
  r.plots[i] = null
  if (r.marked === i) r.marked = null
  if (how === 'burnt') r.stats.wellsBurnt++
  else if (how === 'stolen') r.stats.wellsStolen++
  else if (how === 'dry') r.stats.wellsDry++
  else r.stats.wellsLost++
}

// ---------------------------------------------------------------- new run
/** What earlier runs have unlocked: kept by the app, passed in so the engine stays pure. */
export interface Unlocks { baron?: boolean; proxy?: boolean; geneva?: boolean }
export function newRun(seed: number, bonus: BonusKey, unlocks: Unlocks = {}): Run {
  const r: Run = {
    seed, rng: seed, bonus, phase: 'shop', stage: 1, round: 0, turn: 0,
    capital: CONFIG.startCapital, gold: 0, debt: bonus === 'trustFund' ? CONFIG.trustFundDebt : CONFIG.startDebt, ap: 0, cover: 0, nextId: 1,
    deck: [], draw: [], hand: [], discard: [], plots: [], oil: bonus === 'threeOil' ? 3 : 0,
    storage: CONFIG.startStorage + (unlocks.baron ? CONFIG.baronSilo : 0), fire: 0, marked: null, threats: [],
    short: 0, freight: 0, pending: { ap: 0, audit: false, refuse: false, margin: 0, cease: 0, prorate: false }, current: { audit: false, refuse: false, prorate: false },
    items: [], destroyCost: CONFIG.destroyCost, prospectPrice: CONFIG.prospectPrice,
    shop: { cards: [], item: null, loanTaken: false, prospectSold: false, bucketSold: false, boon: null, dividendPaid: false }, ledger: [], events: [],
    tally: newTally(),
    stats: { oilSold: 0, earned: 0, spent: 0, wellsBuilt: 0, wellsBurnt: 0, wellsStolen: 0, wellsLost: 0, wellsDry: 0, skims: 0 },
    roundStart: { capital: CONFIG.startCapital, gold: 0, wells: 0, oil: 0, deck: 0, exposure: 0 },
    boon: null, reward: null, tempStorage: 0, spoils: null, report: [], reportSeq: 0,
    exposure: 0, goldShield: false, boost: 0, upgradeCost: CONFIG.upgradeCost, residue: null, stageGold: 0,
    heat: 0, roundBoost: 0, shredded: false, clock: CONFIG.clockStart, met: [],
  }
  r.deck = (bonus === 'none' ? STARTER.filter(k => k !== 'prospect') : STARTER).map(k => card(r, k)) // hard mode: no Prospect either
  if (bonus === 'extraProspect') r.deck.push(card(r, 'prospect'))
  if (bonus === 'pettyCash') r.deck.push(card(r, 'pettyCash'))
  if (bonus === 'gearGraft') r.deck.push(card(r, 'improveGear'), card(r, 'hardGraft'))
  if (bonus === 'oldFaithful') r.plots = [{ output: 1, reserve: 0, faithful: true }]
  if (bonus === 'slushFund') r.items.push('slushFund')
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
  const pool = [...poolFor(r)]
  const picks: CardKey[] = []
  while (picks.length < 3 && pool.length) {
    const k = weightedCard(r, pool)
    picks.push(k); pool.splice(pool.indexOf(k), 1)
  }
  const items = (Object.keys(ITEMS) as ItemKey[]).filter(i => !ITEMS[i].never && (!ITEMS[i].stages || ITEMS[i].stages!.includes(r.stage)) && (ITEMS[i].repeatable || !r.items.includes(i))
    && !(i === 'rolodex' && handSize(r) >= CONFIG.handMax) && !(i === 'supertanker' && r.storage >= CONFIG.maxStorage) && !(i === 'strategicReserve' && r.storage >= CONFIG.maxStorage4))
  r.shop = { ...r.shop, cards: picks, item: items.length ? pick(r, items) : null }
  // the cards turned down at incorporation are on sale at the first visit
  if (r.leftover?.length) { r.shop.cards = [...r.leftover, ...picks.filter(k => !r.leftover!.includes(k))].slice(0, Math.max(3, r.leftover.length)); r.leftover = [] }
}

/** Opening the Land Office after a round: fresh stock, and before the boss, one small item for gold. */
function openShop(r: Run) {
  r.shop = { cards: [], item: null, loanTaken: false, prospectSold: false, bucketSold: false, boon: null, dividendPaid: false }
  stockShop(r)
  if (r.round === bossRound(r.stage) - 1) r.shop.boon = pick(r, (Object.keys(BOONS) as BoonKey[]).filter(b => r.stage < 3 || BOONS[b].type !== 'fire'))
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
      r.deck.push(card(r, key)); r.shop.cards[a.slot] = null; gotCard(r, key)
      return
    }
    case 'buyBucket': {
      const k = WATER_FOR[r.stage] // stage 2 sells no fire card
      if (!k || r.shop.bucketSold || !pay(r, waterPrice(), CARDS[k].name)) return
      r.deck.push(card(r, k)); r.shop.bucketSold = true
      return
    }
    case 'buyProspect': {
      if (r.stage >= 3) { // the Trading Floor builds an Offshore Rig outright
        if (r.shop.prospectSold || !canBuild(r) || !pay(r, r.prospectPrice, 'Offshore Rig')) return
        if (freePlot(r) < 0) r.plots.push(null)
        const i = freePlot(r)
        r.plots[i] = { output: CONFIG.rigOutput, reserve: 0, rig: true }
        r.stats.wellsBuilt++
        r.prospectPrice += CONFIG.rigStep; r.shop.prospectSold = true
        say(r, `Rig No. ${i + 1} is pumping.`)
        return
      }
      const k = PROSPECT_FOR[r.stage] ?? 'derrick'
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
      say(r, `${boonInfo(b, r.stage).name}: yours for ${CONFIG.boonGold} gold.`)
      return
    }
    case 'buyItem': {
      const it = r.shop.item
      if (!it || !pay(r, itemPrice(r, it), ITEMS[it].name)) return
      r.items.push(it)
      if (it === 'storageTank') r.storage += 2
      if (it === 'silo') r.storage += CONFIG.siloStorage
      if (it === 'supertanker') r.storage = Math.min(CONFIG.maxStorage, r.storage + CONFIG.supertanker)
      if (it === 'strategicReserve') r.storage = Math.min(CONFIG.maxStorage4, r.storage + CONFIG.strategicReserve)
      r.shop.item = null
      return
    }
    case 'takeLoan':
      if (r.shop.loanTaken || (r.phase === 'shop' && r.stage >= 2)) return // no Cheap Loan at the Exchange
      if (r.stage === 3) return // no loans in stage 3
      if (r.stage >= 4) { // the World Bank: development finance, with a green project attached
        if (r.phase !== 'incorporate' || r.bigOilStep !== 'pick') return // offered with the new cards
        money(r, 'World Bank loan', CONFIG.worldBankLoan); r.debt += CONFIG.worldBankDebt
        r.deck.push(card(r, 'greenProject'))
        r.shop.loanTaken = true
        say(r, `The World Bank: ${'$'}${CONFIG.worldBankLoan} now, ${'$'}${r.debt} a turn, and a Green Project in your deck.`)
        return
      }
      if (r.phase === 'incorporate') { money(r, 'Incorporation loan', CONFIG.stage2Loan); r.debt += CONFIG.stage2LoanDebt }
      else { money(r, 'Cheap Loan', 8); r.debt += 1 }
      r.shop.loanTaken = true
      say(r, `Bank Debt is now −${r.debt} a turn.`)
      return
    case 'upgradeCard': {
      const c = r.deck.find(x => x.id === a.cardId)
      if (!c || !canUpgrade(c, r.stage) || r.stage < 2 || (r.phase === 'incorporate' && r.stage >= 4) || !pay(r, r.upgradeCost, `Upgrade ${cardDef(c).name}`)) return
      if (c.up) c.up2 = true; else c.up = true
      r.upgradeCost += r.stage >= 3 ? CONFIG.cost3Step : 1
      say(r, `${cardDef(c).name}: upgraded.`)
      return
    }
    case 'buySilo':
      if (r.stage !== 2 || r.phase !== 'shop' || r.shop.siloSold || (r.silos ?? 0) >= CONFIG.silo2Max || !pay(r, CONFIG.silo2Price, 'Silo')) return
      r.storage += CONFIG.silo2Storage; r.shop.siloSold = true; r.silos = (r.silos ?? 0) + 1
      say(r, `Silo built: storage for ${r.storage} oil.`)
      return
    case 'duplicateCard': {
      const c = r.deck.find(x => x.id === a.cardId)
      if (!c || r.stage < 2 || !canDuplicate(c)) return
      if (r.phase === 'incorporate' && r.stage === 2) { // stage 1 → 2: as many as you like, each one dearer
        const cost = r.duplicateCost ?? CONFIG.duplicateCost
        if (!pay(r, cost, `Duplicate ${CARDS[c.key].name}`)) return
        r.duplicateCost = cost + 1
      } else {
        if (r.phase !== 'shop' || r.shop.duplicated || !pay(r, CARDS[c.key].price!, `Duplicate ${CARDS[c.key].name}`)) return
        r.shop.duplicated = true
      }
      r.deck.push({ ...card(r, c.key), up: c.up, up2: c.up2, uses: CARDS[c.key].uses })
      say(r, `${cardDef(c).name}: a second copy is in your deck.`)
      return
    }
    case 'payDividends':
      if (r.stage === 3) { // the Lobbying Firm
        if (r.phase !== 'shop' || r.shop.dividendPaid || r.heat === 0 || !pay(r, CONFIG.lobbyFirmCost, 'Lobbying firm')) return
        r.shop.dividendPaid = true
        heat(r, -CONFIG.lobbyFirmDrop, 'Lobbying firm')
        return
      }
      if (r.stage !== 2 || r.phase !== 'shop' || r.shop.dividendPaid || r.exposure === 0 || !pay(r, CONFIG.dividendCost, 'Dividends to the board')) return
      r.shop.dividendPaid = true
      expose(r, -CONFIG.dividendDrop, 'Dividends paid')
      return
    case 'destroyCard': {
      const c = r.deck.find(x => x.id === a.cardId)
      if (!c) return
      if (r.phase === 'incorporate' && r.stage >= 4) { // becoming Big Oil: only the clear-out step destroys, and only for free
        if (r.bigOilStep !== 'clear' || (r.freeDestroys ?? 0) <= 0 || c.key === 'influencers') return
        removeFromDeck(r, c); tally(r).destroyed++; r.freeDestroys! -= 1
        say(r, `Cleared out: ${CARDS[c.key].name}. ${r.freeDestroys} free left.`)
        return
      }
      if (!pay(r, r.destroyCost, `Destroy ${CARDS[c.key].name}`)) return
      removeFromDeck(r, c); tally(r).destroyed++; r.destroyCost += r.stage >= 3 ? CONFIG.cost3Step : 1
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
    case 'pickCard': {
      if (r.phase !== 'incorporate' || !r.offer?.includes(a.key)) return
      const picked = r.picked ?? []
      if (picked.includes(a.key)) r.picked = picked.filter(k => k !== a.key)
      else if (picked.length < CONFIG.incorporatePicks) r.picked = [...picked, a.key]
      return
    }
    case 'leaveShop':
      if (r.phase === 'incorporate' && r.stage >= 4 && r.bigOilStep === 'clear') { // clear-out done: on to the Investor Portal
        r.bigOilStep = undefined; r.freeDestroys = 0
        r.phase = 'shop'; r.round = 0; openShop(r); r.ledger = []; r.events = []
        return
      }
      if (r.phase === 'incorporate') {
        if (r.offer && (r.picked ?? []).length < Math.min(CONFIG.incorporatePicks, r.offer.length)) { say(r, `Pick ${CONFIG.incorporatePicks} new cards first.`); return }
        for (const k of r.picked ?? []) { r.deck.push(card(r, k)); gotCard(r, k) }
        r.leftover = (r.offer ?? []).filter(k => !(r.picked ?? []).includes(k) && k !== PROSPECT_FOR[r.stage]) // the Derrick is always on sale anyway
        r.offer = undefined; r.picked = undefined
        if (r.stage >= 4) { r.bigOilStep = 'clear'; return } // Big Oil: the free clear-out comes next
        r.phase = 'shop'; startRound(r, 1); return
      }
      startRound(r, r.round + 1)
      return
  }
}

// ------------------------------------------------------------------ rounds
function startRound(r: Run, round: number) {
  r.roundStart = snapshot(r)
  feats(r).scratched = false
  r.round = round
  r.leftBehind = undefined
  r.turn = 0
  let kinds: ThreatKind[]
  const cash = CASH_POOLS[r.stage] ?? CASH_POOLS[2], engine = ENGINE_POOLS[r.stage] ?? ENGINE_POOLS[2]
  if (r.stage >= 4) { // one enemy a round, never one already met this run; then the Truth
    if (round >= bossRound(4)) kinds = ['truth']
    else { const fresh = STAGE4_POOL.filter(k => !(r.met ?? []).includes(k)); kinds = [pick(r, fresh.length ? fresh : STAGE4_POOL)] }
    r.met = [...(r.met ?? []), ...kinds.filter(k => k !== 'truth')]
  }
  else if (round === 1) kinds = [pick(r, cash)]
  else if (round === 2) kinds = [pick(r, engine)]
  else if (round === 3) kinds = [pick(r, cash), pick(r, engine)]
  else kinds = [BOSS[r.stage] ?? BOSS[2]]
  const extra = r.stage >= 4 && round < bossRound(4) ? (round - 1) * CONFIG.stage4HoldStep : 0 // stage 4 enemies toughen round by round
  r.threats = kinds.map(k => ({ id: r.nextId++, kind: k, hold: THREATS[k].hold + extra, maxHold: THREATS[k].hold + extra, step: 0, cycle: 0, round3: round === 3, beaten: false }))
  for (const t of r.threats) if (t.kind === 'truth') { // the later the hour you arrive, the harder it is
    t.phase = 0; t.entryHour = r.clock ?? CONFIG.clockStart; t.baseCover = t.entryHour
  }
  if (!CONFIG.oilCarriesOver) r.oil = 0
  r.short = 0
  r.freight = r.threats.some(t => t.kind === 'railroad') ? 1 : 0
  r.boost = 0
  r.roundBoost = 0
  r.shredded = false
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
  newReport(r)
  for (const t of r.threats) { say(r, `${THREATS[t.kind].name} arrives.`); beat(r, 'enemy', `Round ${round}`, `${THREATS[t.kind].name} arrives.`, t.id) }
  if (r.items.includes('pressOffice')) expose(r, -1, 'Press Office')
  // opening moves
  for (const t of r.threats) {
    const op = THREATS[t.kind].movesFirst
    if (op === 'Walkout') { r.pending.ap += 1; t.opened = 'Walkout: −1 AP this turn.'; say(r, 'Walkout: −1 AP on your first turn.'); beat(r, 'enemy', `${THREATS[t.kind].name} · Walkout`, '−1 AP on your first turn.', t.id) }
    if (op === 'Scout') {
      const i = highestWell(r); r.marked = i >= 0 ? i : null
      t.opened = i >= 0 ? `Scout: marked Well No. ${i + 1}.` : 'Scout: found no Well to mark.'
      if (i >= 0) say(r, `The Claim Jumper has marked Well No. ${i + 1}.`)
      beat(r, 'enemy', `${THREATS[t.kind].name} · Scout`, i >= 0 ? `Marked Well No. ${i + 1}.` : 'Found no Well to mark.', t.id)
    }
    if (op === 'Arson') { startFire(r, 1, THREATS[t.kind].name); t.opened = 'Arson: started a fire.'; beat(r, 'enemy', `${THREATS[t.kind].name} · Arson`, 'Started a fire.', t.id) }
    if (op === 'Canvass' || op === 'Minutes') {
      beat(r, 'enemy', `${THREATS[t.kind].name} · ${op}`, '+1 Board Exposure.', t.id)
      captured = []; expose(r, 1, op); captured = null
      t.opened = `${op}: +1 Board Exposure.`
    }
    if (op === 'Opening Session') {
      beat(r, 'enemy', `${THREATS[t.kind].name} · ${op}`, `+${CONFIG.genevaOpening} Heat.`, t.id)
      captured = []; enemyHeat(r, CONFIG.genevaOpening, op); captured = null
      t.opened = `${op}: +${CONFIG.genevaOpening} Heat.`
    }
    if (op === 'Infiltrate') {
      const i = infiltrateTarget(r); r.marked = i >= 0 ? i : null
      t.opened = i >= 0 ? `Infiltrate: marked ${plotName(r, i)}.` : 'Infiltrate: found nothing to mark.'
      beat(r, 'enemy', `${THREATS[t.kind].name} · Infiltrate`, i >= 0 ? `Marked ${plotName(r, i)}.` : 'Found nothing to mark.', t.id)
    }
  }
  if (round === bossRound(r.stage) && r.boon) {
    if (r.boon === 'spareHand') r.pending.ap -= 1
    if (r.boon === 'tempSilo') { r.storage += CONFIG.tempSilo; r.tempStorage = CONFIG.tempSilo }
  }
  if (isLost(r)) return
  beginTurn(r)
  if (round === bossRound(r.stage) && r.boon === 'spareRigs' && r.turn === 1) {
    for (let i = 0; i < 2; i++) { const w = card(r, landCardFor(r.stage)); r.deck.push(w); r.hand.push(w) }
  }
}

/** Cover your items give at the start of every turn. Clean Image is a free Think Tank, and stacks with a bought one. */
export const itemCover = (r: Run) => (r.items.includes('auditingFirm') ? CONFIG.auditingFirmCover : 0)
  + (r.items.includes('thinkTankItem') ? CONFIG.thinkTankCover : 0) + (r.items.includes('furtherResearch') ? CONFIG.thinkTankCover : 0)
  + (r.items.includes('prAgency') ? CONFIG.prAgencyCover : 0) + (r.items.includes('slushFund') ? CONFIG.slushFundCover : 0)
/** The Steam Pump adds 1 AP on every other turn of a fight: turns 1, 3, 5… */
export const steamPumpTurn = (r: Run) => r.items.includes('steamPump') && r.turn % 2 === 1
function beginTurn(r: Run) {
  r.turn += 1
  r.ledger = [{ label: 'Brought forward', amount: r.capital }]
  if (!r.items.includes('accountant')) r.cover = 0
  r.cover += itemCover(r)
  r.doubleSale = false
  r.current = { audit: r.pending.audit, refuse: r.pending.refuse, prorate: r.pending.prorate, shutdown: r.pending.shutdown ?? 0, apTo1: r.pending.apTo1, cardCap: r.pending.cardCap }
  r.played = 0
  const compensation = r.pending.compensation ?? 0
  const declarations = r.pending.declarations ?? 0
  const apPenalty = r.pending.ap
  const margins = r.pending.margin
  const ceases = r.pending.cease
  const claims = r.pending.claims ?? 0
  const fuses = r.pending.badBlood ?? 0
  r.pending = { ap: 0, audit: false, refuse: false, margin: 0, cease: 0, prorate: false }
  for (const t of liveThreats(r)) { t.cover = t.coverNext ?? t.baseCover ?? THREATS[t.kind].cover; t.coverNext = undefined } // enemy Cover: fresh each turn, never stacks
  r.boost = 0
  r.goldShield = false
  const first = r.stage === 1 && r.round === 1 && r.turn === 1 // the loan has only just been made: nothing is owed yet
  const d = first ? 0 : debtPerTurn(r) * (r.current.audit ? 2 : 1)
  money(r, r.current.audit ? 'Bank debt (audited)' : 'Bank debt', -d)
  if (d && r.turn > 1) beat(r, 'money', r.current.audit ? 'Bank debt · audited' : 'Bank debt', `−$${d}.`)
  if (r.items.includes('fillingStations')) money(r, 'Filling Stations', 1)
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
    feats(r).pumped += made
    r.oil += Math.min(room, made)
    if (made > room) say(r, `Storage full: ${made - room} oil lost.`)
    beat(r, 'oil', r.current.prorate ? 'Pumps · prorated' : 'Pumps', made <= room ? `+${made} oil.` : room > 0 ? `+${room} oil. Storage full: ${made - room} lost.` : `Storage full: ${made} oil lost.`)
  }
  for (let i = 0; i < margins; i++) r.hand.push(card(r, 'marginCall', true))
  if (margins) beat(r, 'cards', 'Margin Call', `${margins > 1 ? `${margins} Margin Calls` : 'A Margin Call'} in your hand.`)
  for (let i = 0; i < ceases; i++) r.hand.push(card(r, 'ceaseDesist', true))
  for (let i = 0; i < fuses; i++) { const b = card(r, badBloodFor(r.stage)); r.deck.push(b); r.hand.push(b) } // lasts until it decays
  if (fuses) beat(r, 'cards', 'Bad Blood', `${fuses > 1 ? `${fuses} Bad Blood cards` : 'A Bad Blood card'} in your hand: 1 in 3 chance of a fire.`)
  for (let i = 0; i < claims; i++) r.hand.push(card(r, 'patentClaim', true))
  for (let i = 0; i < declarations; i++) r.hand.push(card(r, 'draftDeclaration', true))
  if (declarations) beat(r, 'cards', 'Draft Declaration', 'A Draft Declaration in your hand: must play, 1 AP, does nothing.')
  for (let i = 0; i < compensation; i++) r.hand.push(card(r, 'compensationClaim', true))
  if (compensation) beat(r, 'cards', 'Compensation Claim', `${compensation > 1 ? `${compensation} Compensation Claims` : 'A Compensation Claim'} in your hand: must play, −$${CONFIG.claimCost} each.`)
  if (r.current.shutdown) beat(r, 'oil', 'Shut down', `${r.current.shutdown > 1 ? `${r.current.shutdown} Rigs` : 'A Rig'} pumped nothing this turn.`)
  if (claims) beat(r, 'cards', 'New Patent Claim', 'A New Patent Claim is clogging your hand.')
  if (ceases) beat(r, 'cards', 'Cease and Desist', `${ceases > 1 ? `${ceases} Cease and Desist letters` : 'A Cease and Desist letter'} in your hand.`)
  const n = handSize(r)
  drawUpTo(r, n)
  const loyal = r.round === bossRound(r.stage) && r.items.includes('loyalDirectors') ? 1 : 0
  r.ap = Math.max(0, CONFIG.baseAP + (steamPumpTurn(r) ? 1 : 0) + (r.items.includes('lobbyist') ? CONFIG.lobbyistAP : 0) + loyal - apPenalty)
  if (r.current.apTo1) { r.ap = Math.min(r.ap, 1); beat(r, 'info', 'Tremors', 'You have 1 AP this turn.') }
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
export const plotName = (r: Run, i: number) => (r.plots[i]?.faithful ? 'Old Faithful' : `${r.plots[i]?.rig ? 'Rig' : r.plots[i]?.field ? 'Field' : 'Well'} No. ${i + 1}`)
/** What the Saboteur goes for: your best Field, or your best Well if you have none. */
export function infiltrateTarget(r: Run): number {
  let best = -1
  r.plots.forEach((w, i) => {
    const b = best >= 0 ? r.plots[best]! : null
    const score = (x: Well) => (x.field ? 100 : 0) + x.output * 10 + Math.min(9, x.reserve)
    if (exposed(w) && (!b || score(w) > score(b))) best = i
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
    case 'inspector': {
      addJunk(r, 'looseThread'); addJunk(r, 'looseThread')
      r.leftBehind = { by: THREATS[t.kind].name, cards: ['looseThread', 'looseThread'] }
      say(r, 'He filed his report: 2 Loose Threads added to your deck.')
      beat(r, 'cards', `${THREATS[t.kind].name} · His report`, 'He filed his report: 2 Loose Threads in your deck. Must play, −$1 each.', t.id)
      break
    }
    case 'claimJumper': say(r, 'The Claim Jumper set a fire on his way out.'); startFire(r, CONFIG.claimJumperFires, 'the Claim Jumper'); break
    case 'blowout': r.oil = Math.min(r.storage, r.oil + 3); say(r, 'Gusher! +3 oil.'); break
    case 'speculator': r.short = 0; break
    case 'railroad': r.freight = 0; break
    case 'muckraker': expose(r, -1, 'Retraction'); break
    case 'clawback': expose(r, -1, 'The committee is satisfied'); break
    case 'combine': r.short = 0; r.freight = 0; say(r, 'The Combine folds. Prices and freight recover.'); break
    case 'saboteur': startFire(r, 1, 'the Saboteur'); say(r, 'The Saboteur left a parting gift.'); break
    case 'rivals': r.short = 0; say(r, 'The rivals fold. Prices recover.'); break
    case 'fracking': r.short = 0; break
    case 'war': say(r, 'Ceasefire. Prices and output recover.'); break
  }
  if (!liveThreats(r).length && r.phase !== 'lost') {
    if (r.fire) { say(r, `Put the fire out to end the round.`); return }
    endRound(r)
  }
}

/** After a fire goes out with every enemy already beaten, the round ends. */
function fireOut(r: Run) { if (r.phase === 'turn' && !r.fire && !liveThreats(r).length) endRound(r) }
/** Every enemy beaten and no fire burning: the round is over. */
function endRound(r: Run) {
  {
    // a quick win impresses the board, the boss included
    if (r.stage === 2 && r.turn <= CONFIG.quickWinTurns) expose(r, -CONFIG.quickWinDrop, `Won in ${r.turn} turn${r.turn === 1 ? '' : 's'}`)
    // the board reads the quarter: Capital up, Exposure falls; Capital down, it rises (not after the boss)
    if (r.stage === 2 && r.round < 4) {
      if (r.capital > r.roundStart.capital) expose(r, -1, 'A good quarter')
      else if (r.capital < r.roundStart.capital) expose(r, 1, 'A bad quarter')
      if (isLost(r)) return
    }
    tally(r).rounds++
    if (r.turn <= CONFIG.tactics.quickTurns) tally(r).quick++
    r.phase = r.round >= bossRound(r.stage) ? 'stageComplete' : 'roundWon'
    if (!feats(r).scratched && r.stage >= 3) feats(r).cleanFight = true // stage 3 and 4 moves all cost something: only Cover keeps them off
    if (r.phase === 'stageComplete' && r.turn <= 1) feats(r).quickBoss = true
    if (r.phase === 'stageComplete') grantReward(r)
    // a card to take, or turn down for cash. After stage 2's first fight, it's the Expense Account: skimming from now on
    else r.spoils = r.stage === 2 && r.round === 1 && !r.deck.some(c => c.key === 'expenseAccount') ? 'expenseAccount' : weightedCard(r, [...poolFor(r)])
    r.plots.forEach(w => w && (w.unstable = false))
  }
}

function grantReward(r: Run) {
  if (r.tempStorage) { r.storage -= r.tempStorage; r.tempStorage = 0; r.oil = Math.min(r.oil, r.storage) } // the temporary silo is dismantled; what doesn't fit is sold off with it
  r.gold += CONFIG.bossGold
  say(r, `${CONFIG.bossGold} gold for you.`)
  if (r.stage >= 4) return // the Truth is beaten: the game is won, and your fortune is the score
  if (r.stage === 2) { // the meter leaves its mark
    r.residue = r.exposure >= CONFIG.exposureHigh ? 'boardGrudge' : r.exposure <= CONFIG.exposureLow ? 'loyalDirectors' : null
    if (r.residue) r.items.push(r.residue)
  }
  if (r.stage === 3) {
    r.residue = r.heat >= CONFIG.heatHigh ? 'regulators' : r.heat <= CONFIG.heatLow ? 'furtherResearch' : null
    if (r.residue) r.items.push(r.residue)
  }
  const avoid = r.boon ? BOONS[r.boon].type : null
  const landFull = r.stage >= 2 && r.plots.filter(Boolean).length >= CONFIG.maxPlots // no plot for new Rigs: Drilling Rights would be two dead cards
  const options = (Object.keys(REWARDS) as RewardKey[]).filter(k => k !== 'steamPump' && REWARDS[k].type !== avoid && !(k === 'silo' && r.items.includes('silo')) && !(k === 'drillingRights' && landFull))
  const k = options.length ? pick(r, options) : 'dividends' // every lasting reward ruled out: Dividends, even if it matches the item bought
  r.reward = k
  if (k === 'steamPump') r.items.push('steamPump')
  if (k === 'silo') { r.items.push('silo'); r.storage = r.stage >= 3 ? Math.min(CONFIG.maxStorage, r.storage + 4) : r.storage + 4 }
  if (k === 'dividends') r.deck.push(card(r, 'dividends'))
  if (k === 'drillingRights') { const land = landCardFor(r.stage + 1); r.deck.push(card(r, land), card(r, land)) } // for the stage ahead: Rigs from stage 3
}

/** Damage to an enemy. Cards marked badBlood put a Bad Blood card in your discard pile. */
function hit(r: Run, t: Threat, dmg: number, badBlood = false, ignoreCover = false, family?: string) {
  if (t.cover && !ignoreCover) { const blocked = Math.min(t.cover, dmg); t.cover -= blocked; dmg -= blocked; if (blocked) say(r, `${THREATS[t.kind].name}'s Cover blocked ${blocked}.`) }
  if (family) { const d = tally(r).damage; d[family] = (d[family] ?? 0) + Math.max(0, Math.min(dmg, t.hold)) }
  playHit += Math.max(0, Math.min(dmg, t.hold))
  t.hold -= dmg
  if (badBlood) { addJunk(r, badBloodFor(r.stage), 'discard'); say(r, 'Bad Blood added to your discard pile.') }
  if (t.hold <= 0 && t.kind === 'truth' && (t.phase ?? 0) < TRUTH_PHASES.length - 1) { // the Truth is only beaten in its last phase
    t.phase = (t.phase ?? 0) + 1; t.hold = CONFIG.truthPhaseHold; t.maxHold = CONFIG.truthPhaseHold; t.poison = []
    say(r, `The Truth: ${phaseName(t)}. Weak to ${weakOf(t.kind, t.phase)}.`)
    return
  }
  if (t.hold <= 0) threatBeaten(r, t)
}

// ------------------------------------------------------------- turn actions
/** The enemies a card can be aimed at: ones an attack can hurt, or ones not yet stopped. */
export function targetsFor(r: Run, c: Card): Threat[] {
  const d = cardDef(c)
  if (d.stop) return liveThreats(r).filter(t => !t.stopped)
  if (isAttack(c.key)) return liveThreats(r).filter(t => damageFor(d.family, attackPower(r, d), t.kind, t.phase) > 0)
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
  if (r.current.cardCap && (r.played ?? 0) >= r.current.cardCap && !d.forced) return { ok: false, why: `Subpoena: ${r.current.cardCap} cards this turn` }
  if (apCost(r, c) > r.ap) return { ok: false, why: 'Not enough AP' }
  if (d.cost && r.capital - d.cost < 1 && !d.forced) return { ok: false, why: 'Not enough Capital' }
  if (d.gold && r.gold < d.gold) return { ok: false, why: 'Not enough gold' }
  if (isProspect(c.key) && (d.plots ?? 0) > 0 && r.plots.length >= CONFIG.maxPlots && freePlot(r) < 0) return { ok: false, why: 'No land left to claim' }
  if (isProspect(c.key) && !d.plots && !canBuild(r)) return { ok: false, why: 'No empty plot' }
  if (c.key === 'rdSprint' && !sprintWells(r)) return { ok: false, why: 'No Wells' }
  if (d.scrap === 'one' && !handTargetsFor(r, c).length) return { ok: false, why: 'Nothing to destroy' }
  if (d.scrap === 'junk' && !r.hand.some(x => x.id !== c.id && CARDS[x.key].junk)) return { ok: false, why: 'No junk in hand' }
  if (c.key === 'payDividend' && r.exposure === 0) return { ok: false, why: 'The board is happy' }
  if (c.key === 'personalLawyer' && r.goldShield) return { ok: false, why: 'Already retained' }
  if (d.capture && r.captured) return { ok: false, why: 'Already capturing' }
  if (BUILDS.includes(c.key) && !canBuild(r)) return { ok: false, why: 'No free plot' }
  if ((c.key === 'bucket' || c.key === 'fireBrigade' ) && !r.fire) return { ok: false, why: 'No fire' }
  if (d.family === 'Skim' && r.capital - Math.max(1, skimRate(r) - (d.skimOff ?? 0)) < 1) return { ok: false, why: 'Not enough Capital' }
  if (d.stop && !liveThreats(r).length) return { ok: false, why: 'No liabilities left' }
  if (d.stop && !targetsFor(r, c).length) return { ok: false, why: 'Every move is already stopped' }
  if (c.key === 'pettyCash' && r.capital - skimRate(r) < 1) return { ok: false, why: 'Not enough Capital' }
  if (isAttack(c.key) && !liveThreats(r).length) return { ok: false, why: 'No liabilities left' }
  if (d.spendCover && attackPower(r, d) <= 0) return { ok: false, why: 'No Cover to spend' }
  if (isAttack(c.key) && !liveThreats(r).some(t => damageFor(d.family, attackPower(r, d), t.kind, t.phase) > 0)) return { ok: false, why: 'No effect on these liabilities' }
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
  playHit = 0
  try { playCard(r, c, target) } finally { if (playHit > feats(r).bestHit) feats(r).bestHit = playHit }
}
function playCard(r: Run, c: Card, target?: number) {
  const d = cardDef(c)
  const spent = apCost(r, c)
  r.ap -= spent
  r.played = (r.played ?? 0) + 1
  if (d.unique) gotCard(r, c.key) // one in the game: never offered again
  if (d.cost) money(r, d.name, -d.cost)
  // Influencers: this card's Hold damage and Cover are doubled (it is used up by the next card, whatever it is)
  const amp = r.amplify && !d.amplify ? 2 : 1
  if (r.amplify && !d.amplify) r.amplify = false
  if (isAttack(c.key)) {
    const live = liveThreats(r)
    const pw = attackPower(r, d)
    const best = live.reduce((a, b) => (damageFor(d.family, pw, b.kind, b.phase) > damageFor(d.family, pw, a.kind, a.phase) ? b : a))
    const chosen = live.find(x => x.id === target)
    const t = chosen && damageFor(d.family, pw, chosen.kind, chosen.phase) > 0 ? chosen : best
    const dmg = damageFor(d.family, pw, t.kind, t.phase) * amp
    if (d.spendCover) { say(r, `${d.name}: ${r.cover} Cover spent.`); r.cover = 0 }
    spendCard(r, c)
    if (d.gold) r.gold -= d.gold
    if (d.chance !== undefined) {
      // a gamble: it either lands cleanly or backfires with Bad Blood
      if (next(r) < d.chance) { say(r, `${d.name} taken: ${THREATS[t.kind].name} −${dmg} Hold.`); hit(r, t, dmg, false, false, d.family) }
      else { addJunk(r, badBloodFor(r.stage), 'discard'); say(r, `${THREATS[t.kind].name} refused the bribe. Bad Blood added to your discard pile.`) }
    } else {
      say(r, `${d.name}: ${THREATS[t.kind].name} −${dmg} Hold.`)
      hit(r, t, dmg, !!d.badBlood, false, d.family)
      if (d.poison && !t.beaten) (t.poison ??= []).push(...d.poison.map((p, i) => ({ turn: r.turn + 1 + i, family: d.family, power: p })))
    }
    if (r.phase === 'turn' && d.draw) drawCards(r, d.draw)
    if (d.cover) r.cover += d.cover * amp
    if (d.apBack && r.phase === 'turn') r.ap += d.apBack
    if (d.roundBoost) { r.roundBoost += d.roundBoost; say(r, `${d.name}: oil sells +$${d.roundBoost} for the rest of the round.`) }
    if (d.exposure) expose(r, d.exposure, d.name)
    if (BRIBES.includes(c.key)) feedScandal(r)
  } else if (d.stop) {
    const options = targetsFor(r, c)
    const t = options.find(x => x.id === target) ?? options[0]
    spendCard(r, c)
    t.stopped = true
    tally(r).blocks++
    if (d.cover) r.cover += d.cover * amp // Influencers doubles a blocking card's Cover too
    say(r, `${d.name}: ${THREATS[t.kind].name}'s ${intent(r, t)} is stopped this turn.`)
  } else if (d.scrap) {
    spendCard(r, c)
    if (d.scrap === 'one') {
      const options = r.hand.filter(x => x.id !== c.id)
      const victim = options.find(x => x.id === target) ?? options.find(x => CARDS[x.key].junk) ?? options[0]
      if (victim) { destroyInHand(r, victim); say(r, `${d.name}: ${cardDef(victim).name} destroyed.`) }
      if (d.goldBack) money(r, d.name, d.goldBack)
      if (d.exposure) expose(r, d.exposure, d.name)
      if (d.draw) drawCards(r, d.draw)
    } else {
      const junk = r.hand.filter(x => CARDS[x.key].junk)
      for (const j of junk) destroyInHand(r, j)
      const got = drawCards(r, junk.length)
      say(r, `${d.name}: ${junk.length} junk card${junk.length === 1 ? '' : 's'} destroyed, ${got} drawn.`)
    }
  } else {
    spendCard(r, c)
    if (d.amplify) { r.amplify = true; say(r, `${d.name}: your next card's Hold damage or Cover is doubled.`) }
    if (d.recycle) { // everything but itself goes back into the draw pile
      const back = r.discard.filter(x => x.id !== c.id)
      if (back.length) { r.draw = shuffle(r, [...r.draw, ...back]); r.discard = r.discard.filter(x => x.id === c.id); say(r, `${d.name}: ${back.length} cards back into your draw pile.`) }
    }
    if (d.cover) r.cover += d.cover * amp
    if (d.draw) drawCards(r, d.draw)
    if (d.capture) { r.captured = true; say(r, `${d.name}: the next move that would move the clock on won't.`) }
    if (d.clock) {
      const burnt = d.backfire !== undefined && next(r) < d.backfire // Carbon Offsets: sometimes the forest burns down
      if (burnt) say(r, `${d.name}: the forest burned down.`)
      moveClock(r, burnt ? 1 : d.clock, burnt ? `${d.name} (the forest burned down)` : d.name)
    }
    if (d.apNext) r.pending.ap += d.apNext
    if (d.exposure !== undefined && d.exposure !== 0 && d.family !== 'Skim') expose(r, d.exposure, d.name)
    if (d.roundBoost) { r.roundBoost += d.roundBoost; say(r, `${d.name}: oil sells +$${d.roundBoost} for the rest of the round.`) }
    if (d.memo) {
      const rest = r.hand.filter(x => !CARDS[x.key].forced)
      for (const x of rest) { r.hand = r.hand.filter(h => h.id !== x.id); if (!x.temp) r.discard.push(x) }
      const got = drawCards(r, rest.length + 1)
      say(r, `${d.name}: ${rest.length} discarded, ${got} drawn.`)
    }
    switch (c.key) {
      case 'prospect': case 'oldProspect': {
        const add = Math.min(d.plots ?? 0, CONFIG.maxPlots - r.plots.length)
        for (let i = 0; i < add; i++) r.plots.push(null)
        const wells = d.wells ?? 1
        for (let i = 0; i < wells; i++) { const w = card(r, 'well'); r.deck.push(w); r.hand.push(w) }
        say(r, add ? `Claimed ${add} plot${add > 1 ? 's' : ''}.` : `No new land. ${wells} Well card${wells > 1 ? 's' : ''} drawn.`)
        break
      }
      case 'rdSprint': {
        const made = sprintWells(r) * d.power
        const got = Math.min(made, r.storage - r.oil)
        r.oil += got
        say(r, got < made ? `R&D Sprint: +${got} oil. Storage full: ${made - got} lost.` : `R&D Sprint: +${got} oil.`)
        break
      }
      case 'tickerTape': case 'embargoRumours': r.boost += d.power; break
      case 'personalGuarantee': case 'dipTrust': r.gold -= d.gold ?? 0; money(r, d.name, d.power); say(r, `${d.name}: ${d.gold} gold into the company.`); break
      case 'thinkTank': case 'telex': case 'memo': case 'queuesAtPump': case 'deadWeight': case 'dryLease': case 'draftDeclaration': case 'advertorial': break
      case 'oilShock': r.doubleSale = true; say(r, 'Oil Shock: your next sale this turn pays double.'); break
      case 'nightShift': r.ap += d.power; break
      case 'payDividend': break
      case 'personalLawyer': r.goldShield = true; say(r, 'Your Personal Lawyer is on retainer this turn.'); break
      case 'ceaseDesist': case 'proxyBallot': break
      case 'well': case 'wildcat': case 'derrick': case 'rig': {
        if (freePlot(r) < 0) r.plots.push(null) // stage 2: a Well claims its own plot
        const i = freePlot(r)
        r.plots[i] = r.stage >= 3 ? { output: CONFIG.rigOutput, reserve: 0, rig: true } // stage 3: a Rig
          : r.stage >= 2
          ? { output: CONFIG.stage2Output, reserve: 0, lasting: true } // every stage 2 Well pumps 1 and never runs dry
          : { output: d.power, reserve: c.key === 'wildcat' ? CONFIG.wildcatReserve : CONFIG.wellReserve }
        r.stats.wellsBuilt++
        say(r, `${plotName(r, i)} built.`)
        break
      }
      case 'bucket': r.fire = Math.max(0, r.fire - d.power); say(r, r.fire ? `${d.power > 1 ? 'Two fires' : 'One fire'} out. ${fires(r.fire)} still burning.` : 'Fire out. Pumps restart next turn.'); fireOut(r); break
      case 'fireBrigade': r.fire = 0; say(r, 'Every fire is out. Pumps restart next turn.'); fireOut(r); break
      case 'improveGear': break
      case 'hardGraft': case 'bridgeFuel': r.ap += d.power; break
      case 'pettyCash': case 'expenseAccount': {
        const rate = Math.max(1, skimRate(r) - (d.skimOff ?? 0))
        if (r.capital - rate >= 1) { money(r, `${d.name} (skim)`, -rate); r.gold += 1; r.stats.skims++; expose(r, d.exposure ?? 1, d.name) }
        break
      }
      case 'inheritance': money(r, 'Inheritance', CONFIG.inheritance); break
      case 'dividends': money(r, 'Dividends', d.power); break
      case 'telegram': { const help = card(r, pick(r, ATTACK_CARDS), true); help.free = true; r.hand.push(help); say(r, `Help is on its way: ${CARDS[help.key].name}, free to play.`); break }
      case 'telegraphLine': case 'efficiencyExpert': break
      case 'badBlood': badBloodRoll(r); break
      case 'looseThread': case 'marginCall': case 'iou': case 'badBloodLate': break
    }
  }
  // a card's own Heat and the Heat of the AP it cost land together, so cooling isn't lost at 0 and can save you at the top
  if (d.heat) heat(r, d.heat + spent * CONFIG.heatPerAP, d.name)
  else apHeat(r, spent)
  checkBankrupt(r)
}

/** What Infiltrate will still take off this enemy: this turn's end, then the turns after. */
export const infiltrated = (r: Run, t: Threat): number[] => {
  const by = new Map<number, number>()
  for (const p of t.poison ?? []) by.set(p.turn, (by.get(p.turn) ?? 0) + damageFor(p.family, p.power, t.kind, t.phase))
  return [...by.entries()].sort((a, b) => a[0] - b[0]).filter(([turn]) => turn >= r.turn).map(([, n]) => n)
}
/** Infiltrate: the damage still owed lands as your turn ends, before the enemies move. It goes past their Cover. */
function infiltration(r: Run) {
  for (const t of liveThreats(r)) {
    if (!t.poison?.length) continue
    const due = t.poison.filter(p => p.turn === r.turn)
    t.poison = t.poison.filter(p => p.turn > r.turn)
    for (const p of due) {
      if (t.beaten) break
      const dmg = damageFor(p.family, p.power, t.kind, t.phase)
      if (!dmg) continue
      say(r, `Infiltrate: ${THREATS[t.kind].name} −${dmg} Hold.`)
      beat(r, 'enemy', `${THREATS[t.kind].name} · Infiltrated`, `−${dmg} Hold.`, t.id)
      hit(r, t, dmg, false, true, p.family)
    }
  }
}

/** A bribe paid while a Bribery Scandal is on the board makes it bigger. */
/** How much the next bribe grows a Bribery Scandal: 4, then 2 more each time this fight. */
export const scandalGrowth = (t: Threat) => CONFIG.bribeFeedsScandal + (t.fed ?? 0) * CONFIG.bribeFeedsStep
function feedScandal(r: Run) {
  for (const t of liveThreats(r)) {
    if (t.kind !== 'briberyScandal') continue
    const grow = scandalGrowth(t)
    t.fed = (t.fed ?? 0) + 1
    t.hold += grow; t.maxHold += grow
    say(r, `The Bribery Scandal grows: +${grow} Hold.`)
  }
}

/** The Paper Shredder: once a round, destroy a card in your hand for free. */
function shred(r: Run, cardId: number) {
  const c = r.hand.find(x => x.id === cardId)
  if (!c || !r.items.includes('paperShredder') || r.shredded) return
  r.shredded = true
  destroyInHand(r, c)
  say(r, `Paper Shredder: ${cardDef(c).name} destroyed.`)
}

/** AP to sell your oil: 1, or 2 in stage 3. */
export const sellAP = (r: Run) => (r.stage >= 3 ? CONFIG.sellAP3 : 1)
function sellOil(r: Run) {
  const ap = sellAP(r)
  if (r.ap < ap || r.oil < 1 || r.current.refuse) return
  r.ap -= ap
  const n = r.oil
  const each = netPrice(r)
  r.oil = 0
  r.stats.oilSold += n
  const doubled = !!r.doubleSale
  r.doubleSale = false
  money(r, `Sold ${n} oil @ $${each}${doubled ? ' (Oil Shock: doubled)' : ''}`, n * each * (doubled ? 2 : 1))
  apHeat(r, ap)
}

/** What a Well sells for: $1 for every barrel still in it; a Field or a stage 2 Well (never dry) has a set price. */
export const wellValue = (w: Well) => (w.rig ? CONFIG.rigValue : neverDry(w) ? CONFIG.fieldValue : w.reserve * CONFIG.sellPerBarrel)

function sellWell(r: Run, plot: number) {
  const w = r.plots[plot]
  if (r.ap < 1 || !w || w.faithful) return // Old Faithful isn't for sale
  r.ap -= 1
  const value = wellValue(w)
  loseWell(r, plot, 'lost')
  money(r, w.rig ? `Sold Rig No. ${plot + 1}` : w.field ? `Sold Field No. ${plot + 1}` : neverDry(w) ? `Sold Well No. ${plot + 1}` : `Sold Well No. ${plot + 1} (${w.reserve} bbl left)`, value)
  apHeat(r, 1)
}

/** The Well a Firebreak costs you: the lowest output, then the fewest barrels left. */
export function weakestWell(r: Run): number {
  let best = -1
  r.plots.forEach((w, i) => {
    const b = best >= 0 ? r.plots[best]! : null
    if (exposed(w) && (!b || w.output < b.output || (w.output === b.output && w.reserve < b.reserve))) best = i
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
  fireOut(r)
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
  let text = moveText(r, t)
  // stage 3: every move also costs Capital and adds Heat; say so
  if (t.kind === 'spill') text += ` −${CONFIG.spillAP} AP next turn.`
  if (r.stage === 3 && THREATS[t.kind].chip) text += ` Plus −$${THREATS[t.kind].chip}${CONFIG.moveHeat3 ? `, +${CONFIG.moveHeat3} Heat` : ''}.`
  // the Truth moves the clock on with every 5th move it makes
  return t.kind === 'truth' && (t.step + 1) % CONFIG.truthTickEvery === 0 ? `${text} The clock moves on an hour.` : text
}
function moveText(r: Run, t: Threat): string {
  const a = intent(r, t)
  const hw = highestWell(r)
  const c = t.cycle
  switch (a) {
    case 'Rumble': { const i = rumbleTarget(r); return i < 0 ? 'The ground rumbles.' : r.plots[i]!.unstable ? `Well No. ${i + 1} shakes again.` : `Well No. ${i + 1} becomes Unstable.` }
    case 'Spray': return 'Lose $2 and 1 oil.'
    case 'Blow': { const u = blowTarget(r); return u >= 0 ? `Well No. ${u + 1} is destroyed.${t.hold < t.maxHold ? ` +${Math.min(2, t.maxHold - t.hold)} Hold.` : ''}` : 'Pressure builds. Nothing is shaking, so nothing happens.' }
    case 'Picket': return 'Lose $2.'
    case 'Sabotage': return wellCount(r) ? 'Destroys a random Well.' : 'Looks for a Well to wreck.'
    case 'Torch': return 'Starts a fire.'
    case 'Audit': return 'Your debt doubles next turn.'
    case 'Fine': return 'Lose $3.'
    case 'Raise Rates': return atFloor(r) ? `Oil already sells for $${CONFIG.oilFloor}. She gains ${CONFIG.railroadHoldUp} Hold instead.` : `Raises her freight charge: you get $1 less for every barrel you sell.`
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
    case 'Headline': return `Lose $${cash(r, CONFIG.headline)}.`
    case 'Front Page': return '+2 Board Exposure.'
    case 'Price War': return 'Oil price −$1.'
    case 'Rail Deal': return 'A secret deal with the railway: you get $1 less for every barrel you sell.'
    case 'Squeeze': return `Lose $${cash(r, CONFIG.squeeze)}.`
    case 'Minutes': return '+1 Board Exposure.'
    case 'Clawback': return exposureHigh(r) ? `Exposure is high: takes ${CONFIG.clawbackGold} gold from your fortune.` : `Lose $${cash(r, CONFIG.clawbackCash)}. (At ${CONFIG.exposureHigh}+ Exposure, takes ${CONFIG.clawbackGold} gold instead.)`
    case 'Cease and Desist': return 'Adds a Cease and Desist to your next hand: must play, 1 AP, does nothing.'
    case 'Royalty': return `Lose $${cash(r, CONFIG.royaltyPer)} for each Well and Field you own ($${royalty(r)}).`
    case 'Injunction': return '−1 AP next turn.'
    case 'New Patent Claim': return "Adds a New Patent Claim to your next hand: it can't be played and takes a slot."
    case 'Leaky Tanks': return `Lose all your stored oil (${r.oil}) and ${Math.round(CONFIG.leakyTanksShare * 100)}% of your Capital (${leakyLoss(r)}).`
    case 'Proxy Meeting': return 'Nothing. The shareholders talk among themselves.'
    case 'Lit Fuse': return 'Puts a Bad Blood card in your next hand: 1 in 3 chance of a fire each time it\'s played.'
    case 'Hired Muscle': return 'Puts a Bad Blood card in your next hand: 1 in 3 chance of a fire each time it\'s played.'
    case 'Wreck': {
      const m = r.marked
      if (m === null || !r.plots[m]) return 'Looks for something to wreck.'
      return `Destroys ${plotName(r, m)}.`
    }
    case 'Infiltrate': { const i = infiltrateTarget(r); return i >= 0 ? `Marks ${plotName(r, i)}.` : 'Watches your fields.' }
    case 'Proration': return `Next turn you can pump only ${CONFIG.prorationCap} oil.`
    case 'Inspection': return `−${CONFIG.inspectionAP} AP next turn.`
    case 'Shut-in': { const i = rumbleTarget(r); return i >= 0 ? `Shuts in ${plotName(r, i)}: it pumps nothing this round.` : 'Looks for a Well to shut in.' }
    case 'Hostile Bid': return `Lose $${cash(r, hostileBid(c))}.`
    case 'Proxy Ballot': return 'Adds a Proxy Ballot to your deck: must play, +1 Board Exposure.'
    case 'The Vote': return `+${1 + c} Board Exposure.`
    case 'Canvass': return '+1 Board Exposure.'
    // stage 3
    case 'Slick': return `Lose up to ${CONFIG.slickOil} stored oil.`
    case 'Shut Down': return wellCount(r) ? 'A Rig pumps nothing next turn.' : 'Looks for a Rig to shut down.'
    case 'Clean-up Bill': return `Lose $${r.stage >= 4 ? CONFIG.cleanupBill4 : CONFIG.cleanupBill}.`
    case 'Measure': return `+${CONFIG.measureHeat} Heat.`
    case 'Publish': return `+${CONFIG.publishHeat} Heat.`
    case 'Peer Review': return t.hold < t.maxHold ? `Regains ${Math.min(CONFIG.peerReview, t.maxHold - t.hold)} Hold.` : 'Checks its sums. Nothing happens.'
    case 'Consensus': return `+${CONFIG.consensusHeat} Heat.`
    case 'Undercut': return `Lose $${r.stage >= 4 ? CONFIG.undercut4 : CONFIG.undercut}.`
    case 'Poach Contracts': return `Lose $${CONFIG.poachContracts}.`
    case 'Running Costs': return `Lose $${CONFIG.runningCosts}.`
    case 'Bad Quarter': return `Lose $${CONFIG.runningCosts}.`
    case 'Write-down': return `Lose $${CONFIG.writeDown}.`
    case 'Leak': return `Takes ${CONFIG.leakGold} gold from your fortune.`
    case 'Hearing': return `Lose $${CONFIG.hearing}.`
    case 'Exposé': return `Lose $${CONFIG.exposeCash}.`
    case 'Indictment': return `Takes ${CONFIG.indictGold} gold from your fortune.`
    case 'Expert Testimony': return `+${testimony(c)} Heat.`
    case 'Draft Declaration': return 'Puts a Draft Declaration in your next hand: must play, 1 AP, does nothing.'
    case 'Resolution': return `Lose $${resolution(c)}.`
    case 'Opening Session': return `+${CONFIG.genevaOpening} Heat.`
    // stage 4
    case 'Cheap Gas': return `Oil price −$${CONFIG.cheapGas} for the round.`
    case 'Tremors': return 'Next turn you have 1 AP.'
    case 'Moratorium': return `Lose $${CONFIG.moratorium}.`
    case 'Subsidies': case 'Grid Deal': return t.hold < t.maxHold ? `Regains ${Math.min(CONFIG.subsidies, t.maxHold - t.hold)} Hold.` : 'Already at full strength. Nothing happens.'
    case 'Blowout': return `Lose $${CONFIG.blowout4}.`
    case 'Containment Fails': return `${CONFIG.containment} Cover next turn.`
    case 'Oiled Seabirds': case 'Water Pollution': return `A Compensation Claim in your next hand: must play, −$${CONFIG.claimCost}.`
    case 'Claims Pile Up': return `2 Compensation Claims in your next hand: must play, −$${CONFIG.claimCost} each.`
    case 'Lost Cargo': case 'Wildfire Season': return `Lose your stored oil (${r.oil}).`
    case 'Windfall Tax': return `Takes ${CONFIG.windfallGold} gold from your fortune.`
    case 'Asset Freeze': return `Takes ${CONFIG.freezeGold} gold from your fortune.`
    case 'Subpoena': return `Next turn you can play ${CONFIG.subpoenaCards} cards at most.`
    case 'Requisition': return `Lose up to ${CONFIG.requisition} stored oil.`
    case 'Pipeline Strike': return `Lose $${CONFIG.pipelineStrike}.`
    case 'Profiteering Probe': return `Lose $${CONFIG.profiteering}.`
    case 'Sea Level Rise': return `Lose $${truthCash(t, CONFIG.seaLevel)}.`
    case 'Crop Failure': return `Lose $${truthCash(t, CONFIG.cropFailure)}.`
    case 'Childhood Asthma': return `Takes ${truthGold(t)} gold from your fortune.`
    case 'Suppressed Development': return '−1 AP next turn.'
  }
  if (r.stage >= 4 && THREATS[t.kind].ticks?.includes(t.step % THREATS[t.kind].cycle.length)) return 'The clock moves on an hour.'
  return a
}
/** The Truth hits harder the later the hour you met it. */
export const truthCash = (t: Threat, base: number) => base + CONFIG.truthPerHour * Math.max(0, (t.entryHour ?? 1) - 1)
export const truthGold = (t: Threat) => CONFIG.asthmaGold + Math.floor(Math.max(0, (t.entryHour ?? 1) - 1) / CONFIG.truthGoldHours)
/** The Geneva Climate Summit's moves grow every cycle. */
export const testimony = (cycle: number) => CONFIG.testimonyHeat + CONFIG.testimonyStep * cycle
export const resolution = (cycle: number) => CONFIG.resolutionCash + CONFIG.resolutionStep * cycle

/** The Bank Inspector's reserves rule, as it stands this turn: met or not, and by how much. */
export const reserves = (r: Run) => ({ met: r.capital >= CONFIG.inspectorReserve, need: CONFIG.inspectorReserve, have: r.capital, damage: CONFIG.inspectorReserveDamage })
/** Leaky Tanks takes a quarter of your Capital. */
export const leakyLoss = (r: Run) => `$${Math.floor(r.capital * CONFIG.leakyTanksShare)}`

/** The Proxy Fight's Hostile Bid grows every cycle. */
/** Stage 2 cash attacks hit twice as hard from round 2. */
export const cash = (r: Run, base: number) => base * (r.round >= CONFIG.cashDoubleFrom ? 2 : 1)
export const hostileBid = (cycle: number) => CONFIG.hostileBid + CONFIG.hostileBidStep * cycle
/** The Patent Holder's Royalty: $2 per Well and Field, at least $2. */
export const royalty = (r: Run) => cash(r, CONFIG.royaltyPer) * Math.max(1, wellCount(r))

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
      const last = t.hold <= CONFIG.inspectorReserveDamage
      say(r, `The Inspector is impressed by your reserves of $${r.capital}.`)
      beat(r, 'enemy', `${THREATS[t.kind].name} · Impressed`, last
        ? `You ended the turn with $${r.capital}, at least $${CONFIG.inspectorReserve}. −${CONFIG.inspectorReserveDamage} Hold: the books are in order, and he signs off.`
        : `You ended the turn with $${r.capital}, at least $${CONFIG.inspectorReserve}. −${CONFIG.inspectorReserveDamage} Hold.`, t.id)
      hit(r, t, CONFIG.inspectorReserveDamage)
    }
  }
  if (checkBankrupt(r) || r.phase !== 'turn') return
  const sticky = (c: Card) => !c.temp && !!CARDS[c.key].sticky // a Green Project stays in your hand until you play it
  r.discard.push(...r.hand.filter(c => !c.temp && !sticky(c)))
  r.hand = r.hand.filter(c => (c.temp && c.key === 'iou') || sticky(c))
  infiltration(r)
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
  if (!liveThreats(r).length) { // every enemy is beaten; only the fire is left
    if (!r.fire) { endRound(r); return }
    if (checkBankrupt(r)) return
    beginTurn(r)
    if (r.phase === 'turn') beat(r, 'info', `Turn ${r.turn}`, `The fire is still burning. Put it out to end the round. ${r.ap} AP, ${r.hand.length} cards.`)
    return
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
        const u = blowTarget(r)
        if (u >= 0) {
          loseWell(r, u, 'lost')
          const before = t.hold; t.hold = Math.min(t.maxHold, t.hold + 2)
          say(r, `Blowout! Well No. ${u + 1} destroyed.${t.hold > before ? ` +${t.hold - before} Hold.` : ''}`)
        }
        break
      }
      case 'Picket': dmg += 2; break
      case 'Sabotage':
      { // one random Well
        const standing = r.plots.map((w, i) => (exposed(w) ? i : -1)).filter(i => i >= 0)
        if (standing.length) { const i = pick(r, standing); loseWell(r, i, 'lost'); say(r, `${name} sabotaged Well No. ${i + 1}.`) }
        break
      }
      case 'Torch': startFire(r, 1, name); break
      case 'Audit': r.pending.audit = true; break
      case 'Fine': dmg += 3; break
      case 'Raise Rates': if (atFloor(r)) { t.hold += CONFIG.railroadHoldUp; t.maxHold += CONFIG.railroadHoldUp; say(r, `Oil can't go lower. ${name} gains ${CONFIG.railroadHoldUp} Hold.`) } else r.freight += 1; break
      case 'Refuse': r.pending.refuse = true; break
      case 'Jump':
        if (r.marked !== null && r.plots[r.marked]) { say(r, `The Claim Jumper stole Well No. ${r.marked + 1}.`); loseWell(r, r.marked, 'stolen') }
        r.marked = null
        break
      case 'Scout': { const i = highestWell(r); r.marked = i >= 0 ? i : null; break }
      case 'Short': r.short += 1; break
      case 'Margin Call': r.pending.margin += 1; break
      case 'Rumours': addJunk(r, badBloodFor(r.stage)); say(r, 'Rumours: Bad Blood added to your deck.'); break
      case 'Paper Promise': r.hand.push(card(r, 'iou', true)); break
      case 'Lease': {
        const v = mostValuable(r)
        if (v) { removeFromDeck(r, v); say(r, `Hostile Lease: ${CARDS[v.key].name} taken for good.`) }
        break
      }
      case 'Arson': startFire(r, Math.min(CONFIG.fireMax, 2 + c), name); break
      // stage 2
      case 'Dig': case 'Minutes': case 'Canvass': expose(r, 1, a, t.id); break
      case 'Front Page': expose(r, 2, a, t.id); break
      case 'Expose': takeGold(r, CONFIG.muckrakerGold, name); break
      case 'Headline': dmg += cash(r, CONFIG.headline); break
      case 'Price War': r.short += 1; break
      case 'Rail Deal': r.freight += 1; break
      case 'Squeeze': dmg += cash(r, CONFIG.squeeze); break
      case 'Clawback': if (exposureHigh(r)) takeGold(r, CONFIG.clawbackGold, name); else { const n = cash(r, CONFIG.clawbackCash); dmg += n; say(r, `Lose $${n}.`) } break // the tape says what happened, not the rule
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
      case 'Lit Fuse': case 'Hired Muscle': r.pending.badBlood = (r.pending.badBlood ?? 0) + 1; break
      case 'Wreck': {
        const m = r.marked
        if (m !== null && r.plots[m]) { say(r, `${plotName(r, m)} wrecked.`); loseWell(r, m, 'lost') }
        r.marked = null
        break
      }
      case 'Infiltrate': { const i = infiltrateTarget(r); r.marked = i >= 0 ? i : null; break }
      case 'Proration': r.pending.prorate = true; break
      case 'Shut-in': { const i = rumbleTarget(r); if (i >= 0) { r.plots[i]!.unstable = true; say(r, `${plotName(r, i)} is shut in this round.`) } break }
      case 'Hostile Bid': dmg += cash(r, hostileBid(c)); break
      case 'Proxy Ballot': addJunk(r, 'proxyBallot'); say(r, 'A Proxy Ballot is in your deck.'); break
      case 'The Vote': expose(r, 1 + c, 'The Vote', t.id); break
      // stage 3
      case 'Slick': { const lost = Math.min(r.oil, CONFIG.slickOil); r.oil -= lost; if (lost) say(r, `The slick took ${lost} oil.`); break }
      case 'Shut Down': if (wellCount(r)) r.pending.shutdown = (r.pending.shutdown ?? 0) + 1; break
      case 'Clean-up Bill': dmg += r.stage >= 4 ? CONFIG.cleanupBill4 : CONFIG.cleanupBill; break
      case 'Measure': enemyHeat(r, CONFIG.measureHeat, a, t.id); break
      case 'Publish': enemyHeat(r, CONFIG.publishHeat, a, t.id); break
      case 'Consensus': enemyHeat(r, CONFIG.consensusHeat, a, t.id); break
      case 'Peer Review': { const before = t.hold; t.hold = Math.min(t.maxHold, t.hold + CONFIG.peerReview); if (t.hold > before) say(r, `Peer review: +${t.hold - before} Hold.`); break }
      case 'Undercut': dmg += r.stage >= 4 ? CONFIG.undercut4 : CONFIG.undercut; break
      case 'Poach Contracts': dmg += CONFIG.poachContracts; break
      case 'Running Costs': case 'Bad Quarter': dmg += CONFIG.runningCosts; break
      case 'Write-down': dmg += CONFIG.writeDown; break
      case 'Leak': takeGold(r, CONFIG.leakGold, name); break
      case 'Hearing': dmg += CONFIG.hearing; break
      case 'Exposé': dmg += CONFIG.exposeCash; break
      case 'Indictment': takeGold(r, CONFIG.indictGold, name); break
      case 'Expert Testimony': enemyHeat(r, testimony(c), a, t.id); break
      case 'Draft Declaration': r.pending.declarations = (r.pending.declarations ?? 0) + 1; break
      case 'Resolution': dmg += resolution(c); break
      // stage 4
      case 'Cheap Gas': r.short += CONFIG.cheapGas; break
      case 'Tremors': r.pending.apTo1 = true; break
      case 'Moratorium': dmg += CONFIG.moratorium; break
      case 'Subsidies': case 'Grid Deal': { const before = t.hold; t.hold = Math.min(t.maxHold, t.hold + CONFIG.subsidies); if (t.hold > before) say(r, `${a}: +${t.hold - before} Hold.`); break }
      case 'Blowout': dmg += CONFIG.blowout4; break
      case 'Containment Fails': t.coverNext = CONFIG.containment; break
      case 'Oiled Seabirds': case 'Water Pollution': r.pending.compensation = (r.pending.compensation ?? 0) + 1; break
      case 'Claims Pile Up': r.pending.compensation = (r.pending.compensation ?? 0) + 2; break
      case 'Lost Cargo': case 'Wildfire Season': if (r.oil) say(r, `${a}: ${r.oil} oil lost.`); r.oil = 0; break
      case 'Windfall Tax': takeGold(r, CONFIG.windfallGold, name); break
      case 'Asset Freeze': takeGold(r, CONFIG.freezeGold, name); break
      case 'Subpoena': r.pending.cardCap = CONFIG.subpoenaCards; break
      case 'Requisition': { const lost = Math.min(r.oil, CONFIG.requisition); r.oil -= lost; if (lost) say(r, `Requisitioned: ${lost} oil.`); break }
      case 'Pipeline Strike': dmg += CONFIG.pipelineStrike; break
      case 'Profiteering Probe': dmg += CONFIG.profiteering; break
      case 'Sea Level Rise': dmg += truthCash(t, CONFIG.seaLevel); break
      case 'Crop Failure': dmg += truthCash(t, CONFIG.cropFailure); break
      case 'Childhood Asthma': takeGold(r, truthGold(t), name); break
      case 'Suppressed Development': r.pending.ap += 1; break
    }
    // stage 4: the 2nd and 5th move of every enemy's cycle, and every 5th move the Truth makes, move the clock on an hour
    if (r.stage >= 4 && !isLost(r)) {
      const ticks = THREATS[t.kind].ticks
      const tick = t.kind === 'truth' ? t.step % CONFIG.truthTickEvery === 0 : !!ticks?.includes((t.step - 1) % THREATS[t.kind].cycle.length)
      if (tick) moveClock(r, 1, a, t.id)
    }
    if (r.stage >= 3 && THREATS[t.kind].chip) dmg += THREATS[t.kind].chip! // every stage 3 and 4 move also costs you
    if (t.kind === 'spill' && !isLost(r)) r.pending.ap += CONFIG.spillAP // the Spill: every move costs you an AP next turn
    let scrutiny = 0 // stage 3: every move also adds Heat; Cover blocks it
    if (r.stage === 3 && CONFIG.moveHeat3 && !isLost(r)) {
      const blocked = Math.min(CONFIG.moveHeat3, r.cover)
      r.cover -= blocked; tally(r).absorbed += blocked
      scrutiny = CONFIG.moveHeat3 - blocked
      heat(r, scrutiny, a, t.id, true)
    }
    if (isLost(r)) { if (captured.length) line.text = captured.join(' '); if (scrutiny) line.text += ` +${scrutiny} Heat.`; captured = null; return }
    // report what actually happened, if the move said so; otherwise what it promised
    if (captured.length) line.text = captured.join(' ')
    if (scrutiny) line.text += ` +${scrutiny} Heat (${r.heat}/${CONFIG.heatMax}).`
    captured = null
  }
  const blocked = Math.min(dmg, r.cover)
  const taken = dmg - blocked
  r.cover -= blocked // Cover is used up as it blocks
  tally(r).absorbed += blocked
  if (taken) { money(r, 'Fines and losses', -taken); feats(r).scratched = true }
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
  r.plots = r.plots.map(w => (w ? { output: CONFIG.stage2Output, reserve: w.reserve, field: true, faithful: w.faithful } : null))
  for (const c of r.deck) if (c.key === 'prospect') { c.key = 'oldProspect'; c.uses = CARDS.oldProspect.uses; c.up = false }
  r.offer = [...INCORPORATE_OFFER_2]; r.picked = []
  r.skimBase = r.stats.skims
  r.prospectPrice = CONFIG.derrickPrice
  r.debt = 0 // incorporation wipes the slate: no Bank Debt unless you sign for the new loan
  r.duplicateCost = CONFIG.duplicateCost
  say(r, 'Bank Debt cleared.')
  r.exposure = Math.min(CONFIG.exposureStartCap, Math.floor(r.stats.skims / CONFIG.exposureStartPer))
  r.shop = { cards: [], item: null, loanTaken: false, prospectSold: true, bucketSold: true, boon: null, dividendPaid: true }
  r.threats = []
  r.short = 0; r.freight = 0; r.fire = 0; r.marked = null; r.cover = 0
  r.hand = []; r.draw = []; r.discard = []
  r.ledger = []; r.events = []
  r.roundStart = snapshot(r)
}
/**
 * Stage 2 → 3: the company goes multinational. Every Field and Well becomes an offshore Rig,
 * land cards dry up and fire and board cards are dead weight (everything else works as before),
 * Heat arrives, and the Oil Shock is on the table.
 */
export function goMultinational(r: Run) {
  r.stage = 3
  r.round = 0
  r.phase = 'incorporate'
  r.stageGold = r.gold
  r.plots = r.plots.filter(Boolean).slice(0, CONFIG.maxPlots).map(w => ({ output: CONFIG.rigOutput, reserve: 0, rig: true, faithful: w!.faithful }))
  r.deck = r.deck.filter(c => !c.temp)
  for (const c of r.deck) if (c.key === 'badBlood') c.key = 'badBloodLate' // no fires in stage 3: Bad Blood becomes a $5 bill
  for (const c of r.deck) {
    if (TO_DRY_LEASE.includes(c.key)) { c.key = 'dryLease'; c.uses = CARDS.dryLease.uses; c.up = false }
    else if (TO_DEAD_WEIGHT.includes(c.key)) { c.key = 'deadWeight'; c.uses = null; c.up = false }
    // every other old card keeps working exactly as before
  }
  r.offer = [...INCORPORATE_OFFER_3]; r.picked = []
  r.prospectPrice = CONFIG.rigPrice
  r.debt = 0 // no Bank Debt in stage 3
  r.destroyCost = Math.max(r.destroyCost, CONFIG.destroyCost3)
  r.upgradeCost = Math.max(r.upgradeCost, CONFIG.upgradeCost3)
  // the press read the expense accounts: Heat for what you skimmed in stage 2
  const skimmed = r.stats.skims - (r.skimBase ?? 0)
  r.heat = Math.min(CONFIG.heatStartCap, Math.floor(skimmed / CONFIG.heatSkimsEvery) * CONFIG.heatPerSkims)
  r.skimBase = r.stats.skims
  r.shop = { cards: [], item: null, loanTaken: false, prospectSold: true, bucketSold: true, boon: null, dividendPaid: true }
  r.threats = []
  r.short = 0; r.freight = 0; r.fire = 0; r.marked = null; r.cover = 0; r.roundBoost = 0
  r.hand = []; r.draw = []; r.discard = []
  r.ledger = []; r.events = []
  r.roundStart = snapshot(r)
}
/**
 * Stage 3 → 4: the multinational becomes Big Oil. Rigs carry on, any old loan is paid off,
 * the World Bank offers development finance (with a Green Project attached), three cards can be
 * cleared out for free, Heat is gone and the Truth clock starts at 1 o'clock (2 with On File).
 */
export function goBigOil(r: Run) {
  r.stage = 4
  r.round = 0
  r.phase = 'incorporate'
  r.stageGold = r.gold
  r.deck = r.deck.filter(c => !c.temp)
  r.offer = [...INCORPORATE_OFFER_4]; r.picked = []
  r.prospectPrice = CONFIG.rigPrice4
  r.debt = 0 // every old loan is paid off
  r.destroyCost = Math.max(r.destroyCost, CONFIG.destroyCost4)
  r.upgradeCost = Math.max(r.upgradeCost, CONFIG.upgradeCost4)
  r.heat = 0 // Heat is worth nothing now
  r.clock = CONFIG.clockStart + (r.items.includes('regulators') ? 1 : 0)
  r.freeDestroys = CONFIG.clearOut
  r.bigOilStep = 'pick'
  r.met = []
  r.skimBase = r.stats.skims
  r.shop = { cards: [], item: null, loanTaken: false, prospectSold: true, bucketSold: true, boon: null, dividendPaid: true }
  r.threats = []
  r.short = 0; r.freight = 0; r.fire = 0; r.marked = null; r.cover = 0; r.roundBoost = 0; r.amplify = false
  r.hand = []; r.draw = []; r.discard = []
  r.ledger = []; r.events = []
  say(r, 'Earlier loans paid off.')
  r.roundStart = snapshot(r)
}
const INCORPORATE_ACTIONS: Action['type'][] = ['takeLoan', 'upgradeCard', 'destroyCard', 'duplicateCard', 'pickCard', 'leaveShop']

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
    case 'heatUp': heat(r, 10, 'Admin'); break
    case 'heatDown': heat(r, -10, 'Admin'); break
    case 'clockUp': moveClock(r, 1, 'Admin'); break
    case 'clockDown': moveClock(r, -1, 'Admin'); break
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
  if (r.phase === 'stageComplete' && a.type === 'continue' && r.stage === 2) { goMultinational(r); return r }
  if (r.phase === 'stageComplete' && a.type === 'continue' && r.stage === 3) { goBigOil(r); return r }
  if (r.phase === 'roundWon' && r.spoils && (a.type === 'takeSpoils' || a.type === 'sellSpoils')) {
    if (a.type === 'takeSpoils') { r.deck.push(card(r, r.spoils)); gotCard(r, r.spoils); say(r, `${CARDS[r.spoils].name} added to your deck.`) }
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
    case 'shred': shred(r, a.cardId); break
    case 'endTurn': endTurn(r); break
  }
  return r
}

/** Rounds completed so far, out of 16 (the Truth is a surprise 17th), for progress bars and run history. */
export function roundsReached(r: Run): number {
  return (r.stage - 1) * 4 + Math.max(1, r.round)
}
