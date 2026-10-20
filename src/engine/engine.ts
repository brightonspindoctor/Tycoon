// The Oil stage 1 rules. Pure functions over a plain-object Run, so the same code
// drives the game screens, the tests and the balance simulator.
import { CONFIG } from './config'
import {
  ATTACK_CARDS, CARDS, CASH_POOL, ENGINE_POOL, ITEMS, MODS, SHOP_POOL, STARTER, THREATS,
  BOONS, REWARDS, type BoonKey, type RewardKey, type BonusKey, type CardKey, type Family, type ItemKey, type ModKey, type ThreatKind,
} from './data'
import { next, pick, shuffle } from './rng'

export interface Card { id: number; key: CardKey; uses: number | null; temp?: boolean; free?: boolean } // free: costs no AP
export interface Well { output: number; reserve: number; unstable?: boolean }
export interface Threat { id: number; kind: ThreatKind; hold: number; maxHold: number; step: number; cycle: number; round3: boolean; beaten: boolean; opened?: string; stopped?: boolean }
export interface LedgerLine { label: string; amount: number }
/** One line of the end-of-turn report, played back on the ticker tape. */
export interface Beat { kind: 'enemy' | 'fire' | 'money' | 'cards' | 'shuffle' | 'oil' | 'info'; title: string; text: string; who?: number }
export type Phase = 'shop' | 'turn' | 'roundWon' | 'lost' | 'stageComplete'
export type LossReason = 'bankrupt' | 'stalemate'

export interface ShopOffer {
  cards: (CardKey | null)[]
  item: ItemKey | null
  loanTaken: boolean
  prospectSold: boolean // one Prospect per visit
  bucketSold: boolean // one Bucket of Water per visit
  boon: BoonKey | null // before the boss: one small item for gold
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
  pending: { ap: number; audit: boolean; refuse: boolean; margin: number }
  current: { audit: boolean; refuse: boolean }
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
}

export interface Snapshot { capital: number; gold: number; wells: number; oil: number; deck: number }
export const snapshot = (r: Run): Snapshot => ({ capital: r.capital, gold: r.gold, wells: wellCount(r), oil: r.oil, deck: r.deck.length })

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
  | { type: 'reinforce'; cardId: number }
  | { type: 'reroll' }
  | { type: 'skim'; gold: number }
  | { type: 'leaveShop' }
  | { type: 'continue' }

// ------------------------------------------------------------------ helpers
const clone = <T,>(x: T): T => structuredClone(x)
const card = (r: Run, key: CardKey, temp = false): Card => ({ id: r.nextId++, key, uses: CARDS[key].uses, temp })

export function skimRate(r: Run): number { return CONFIG.skimRate[r.round] ?? 4 }

export function price(r: Run): number {
  let p = CONFIG.oilPrice - r.short
  if (r.modifier === 'glut') p -= 1
  if (r.modifier === 'boomtown') p += 1
  return Math.max(CONFIG.oilFloor, p)
}
/** What you get per barrel after freight; never below the floor. */
export const netPrice = (r: Run) => Math.max(CONFIG.oilFloor, price(r) - r.freight)

export function debtPerTurn(r: Run): number {
  let d = r.debt
  if (r.bonus === 'trustFund' && r.stage > 1) d += CONFIG.startDebt // Father's money only covers stage 1
  if (r.modifier === 'bankSqueeze' || r.modifier === 'boomtown') d += 1
  return d
}

export const prospectAP = (r: Run) => CARDS.prospect.ap! + (r.modifier === 'hardRock' ? 1 : 0)
export const apCost = (r: Run, c: Card) => (c.free ? 0 : c.key === 'prospect' ? prospectAP(r) : CARDS[c.key].ap ?? 0)
export const freePlot = (r: Run) => r.plots.findIndex(p => p === null)
export const highestWell = (r: Run) => { for (let i = r.plots.length - 1; i >= 0; i--) if (r.plots[i]) return i; return -1 }
export const liveThreats = (r: Run) => r.threats.filter(t => !t.beaten)
export const wellCount = (r: Run) => r.plots.filter(Boolean).length
const pumps = (w: Well | null) => (w && !w.unstable ? Math.min(w.output, w.reserve) : 0)
export const production = (r: Run) => r.fire ? 0 : r.plots.reduce((s, w) => s + pumps(w), 0)

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

export function damageFor(family: Family, power: number, kind: ThreatKind): number {
  const t = THREATS[kind]
  if (t.immune === family) return 0
  if (t.weak === family) return power * 2
  if (t.resist === family) return Math.floor(power / 2)
  return power
}
export const isAttack = (key: CardKey) => ['Legal', 'Dirty'].includes(CARDS[key].family)

export const fires = (n: number) => `${n} fire${n === 1 ? '' : 's'}`
/** Starts `count` new fires (Fire is the number of fires burning, up to fireMax). */
function startFire(r: Run, count: number) {
  const bonus = r.modifier === 'drySeason' ? 1 : 0
  r.fire = Math.min(CONFIG.fireMax, r.fire + count + bonus)
  say(r, `Fire! ${fires(r.fire)} burning. Pumps stopped.`)
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
    short: 0, freight: 0, pending: { ap: 0, audit: false, refuse: false, margin: 0 }, current: { audit: false, refuse: false },
    items: [], destroyCost: CONFIG.destroyCost, prospectPrice: CONFIG.prospectPrice,
    shop: { cards: [], item: null, loanTaken: false, prospectSold: false, bucketSold: false, boon: null }, ledger: [], events: [],
    stats: { oilSold: 0, earned: 0, spent: 0, wellsBuilt: 0, wellsBurnt: 0, wellsStolen: 0, wellsLost: 0, wellsDry: 0, skims: 0 },
    roundStart: { capital: CONFIG.startCapital, gold: 0, wells: 0, oil: 0, deck: 0 },
    boon: null, reward: null, tempStorage: 0, spoils: null, report: [], reportSeq: 0,
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
  const pool = [...SHOP_POOL]
  const picks: CardKey[] = []
  while (picks.length < 3 && pool.length) {
    const k = weightedCard(r, pool)
    picks.push(k); pool.splice(pool.indexOf(k), 1)
  }
  const items = (Object.keys(ITEMS) as ItemKey[]).filter(i => ITEMS[i].repeatable || !r.items.includes(i))
  r.shop = { ...r.shop, cards: picks, item: items.length ? pick(r, items) : null }
}

/** Opening the Land Office after a round: fresh stock, and before the boss, one small item for gold. */
function openShop(r: Run) {
  r.shop = { cards: [], item: null, loanTaken: false, prospectSold: false, bucketSold: false, boon: null }
  stockShop(r)
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
    case 'buyBucket':
      if (r.shop.bucketSold || !pay(r, CONFIG.bucketPrice, 'Bucket of Water')) return
      r.deck.push(card(r, 'bucket')); r.shop.bucketSold = true
      return
    case 'buyProspect':
      if (r.shop.prospectSold || !pay(r, r.prospectPrice, 'Prospect')) return
      r.deck.push(card(r, 'prospect')); r.prospectPrice += 1; r.shop.prospectSold = true
      return
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
      money(r, 'Cheap Loan', 8); r.debt += 1; r.shop.loanTaken = true
      say(r, `Bank Debt is now −$${r.debt} a turn.`)
      return
    case 'destroyCard': {
      const c = r.deck.find(x => x.id === a.cardId)
      if (!c || !pay(r, r.destroyCost, `Destroy ${CARDS[c.key].name}`)) return
      removeFromDeck(r, c); r.destroyCost += 1
      return
    }
    case 'reinforce': {
      const c = r.deck.find(x => x.id === a.cardId)
      if (!c || c.uses === null || CARDS[c.key].junk || !pay(r, 2, `Reinforce ${CARDS[c.key].name}`)) return
      c.uses += 1
      return
    }
    case 'reroll':
      if (!pay(r, 1, 'Reroll')) return
      stockShop(r)
      return
    case 'skim': {
      const cost = a.gold * skimRate(r)
      if (a.gold < 1 || r.capital - cost < 1) { say(r, "The company can't spare that much."); return }
      money(r, `Skim ${a.gold} gold`, -cost); r.gold += a.gold; r.stats.skims += a.gold
      return
    }
    case 'leaveShop':
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
  if (round === 1) kinds = [pick(r, CASH_POOL)]
  else if (round === 2) { kinds = [pick(r, ENGINE_POOL)]; r.modifier = pick(r, Object.keys(MODS) as ModKey[]) }
  else if (round === 3) kinds = [pick(r, CASH_POOL), pick(r, ENGINE_POOL)]
  else kinds = ['baron']
  r.threats = kinds.map(k => ({ id: r.nextId++, kind: k, hold: THREATS[k].hold, maxHold: THREATS[k].hold, step: 0, cycle: 0, round3: round === 3, beaten: false }))
  if (!CONFIG.oilCarriesOver) r.oil = 0
  r.short = 0
  r.freight = r.threats.some(t => t.kind === 'railroad') ? 1 : 0
  r.fire = 0
  r.marked = null
  r.plots.forEach(w => w && (w.unstable = false))
  r.pending = { ap: 0, audit: false, refuse: false, margin: 0 }
  r.hand = []
  r.discard = []
  r.draw = shuffle(r, [...r.deck])
  // a Prospect, if you own one, is always in the round's opening hand (cards are drawn from the end)
  const p = r.draw.findIndex(c => c.key === 'prospect')
  if (p >= 0) r.draw.push(...r.draw.splice(p, 1))
  r.phase = 'turn'
  r.events = []
  r.cover = 0
  newReport(r)
  for (const t of r.threats) { say(r, `${THREATS[t.kind].name} arrives.`); beat(r, 'enemy', `Round ${round}`, `${THREATS[t.kind].name} arrives.`, t.id) }
  if (r.modifier) { say(r, `${MODS[r.modifier].name}: ${MODS[r.modifier].text}.`); beat(r, 'info', MODS[r.modifier].name, `${MODS[r.modifier].text}.`) }
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
    }
  }
  if (round === 4 && r.boon) {
    if (r.boon === 'spareHand') r.pending.ap -= 1
    if (r.boon === 'tempSilo') { r.storage += CONFIG.tempSilo; r.tempStorage = CONFIG.tempSilo }
  }
  beginTurn(r)
  if (round === 4 && r.boon === 'spareRigs' && r.turn === 1) {
    for (let i = 0; i < 2; i++) { const w = card(r, 'well'); r.deck.push(w); r.hand.push(w) }
  }
}

function beginTurn(r: Run) {
  r.turn += 1
  r.ledger = [{ label: 'Brought forward', amount: r.capital }]
  if (!r.items.includes('accountant')) r.cover = 0
  r.current = { audit: r.pending.audit, refuse: r.pending.refuse }
  const apPenalty = r.pending.ap
  const margins = r.pending.margin
  r.pending = { ap: 0, audit: false, refuse: false, margin: 0 }
  const d = debtPerTurn(r) * (r.current.audit ? 2 : 1)
  money(r, r.current.audit ? 'Bank debt (audited)' : 'Bank debt', -d)
  if (d && r.turn > 1) beat(r, 'money', r.current.audit ? 'Bank debt · audited' : 'Bank debt', `−$${d}.`)
  const ious = r.hand.filter(c => c.key === 'iou').length
  if (ious) { money(r, 'IOU', -ious); beat(r, 'money', 'IOU', `−$${ious}.`) }
  if (checkBankrupt(r)) return
  const made = production(r)
  if (made) {
    r.plots.forEach((w, i) => {
      if (!w) return
      w.reserve -= pumps(w)
      if (w.reserve <= 0) { loseWell(r, i, 'dry'); say(r, `Well No. ${i + 1} has run dry.`); beat(r, 'oil', `Well No. ${i + 1}`, 'Has run dry.') }
    })
    const room = r.storage - r.oil
    r.oil += Math.min(room, made)
    if (made > room) say(r, `Storage full: ${made - room} oil lost.`)
    beat(r, 'oil', 'Pumps', made <= room ? `+${made} oil.` : room > 0 ? `+${room} oil. Storage full: ${made - room} lost.` : `Storage full: ${made} oil lost.`)
  }
  for (let i = 0; i < margins; i++) r.hand.push(card(r, 'marginCall', true))
  if (margins) beat(r, 'cards', 'Margin Call', `${margins > 1 ? `${margins} Margin Calls` : 'A Margin Call'} in your hand.`)
  const n = CONFIG.handSize - (r.modifier === 'badWeather' ? 1 : 0)
  while (r.hand.length < n) { // draw back up to a full hand
    if (!r.draw.length && r.discard.length) { r.draw = shuffle(r, r.discard); beat(r, 'shuffle', 'Reshuffle', `Your discard pile is your new deck: ${r.discard.length} cards.`); r.discard = [] }
    const c = r.draw.pop()
    if (!c) break
    r.hand.push(c)
  }
  r.ap = Math.max(0, CONFIG.baseAP + (r.items.includes('steamPump') ? 1 : 0) - apPenalty)
}

function checkBankrupt(r: Run): boolean {
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
  }
  if (!liveThreats(r).length) {
    r.phase = r.round >= 4 ? 'stageComplete' : 'roundWon'
    if (r.phase === 'stageComplete') grantReward(r)
    else r.spoils = weightedCard(r, [...SHOP_POOL]) // a card to take, or turn down for cash
    r.plots.forEach(w => w && (w.unstable = false))
  }
}

function grantReward(r: Run) {
  if (r.tempStorage) { r.storage -= r.tempStorage; r.tempStorage = 0 }
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
function hit(r: Run, t: Threat, dmg: number, badBlood = false) {
  t.hold -= dmg
  if (badBlood) { addJunk(r, 'badBlood', 'discard'); say(r, 'Bad Blood added to your discard pile.') }
  if (t.hold <= 0) threatBeaten(r, t)
}

// ------------------------------------------------------------- turn actions
/** The enemies a card can be aimed at: ones an attack can hurt, or ones not yet stopped. */
export function targetsFor(r: Run, c: Card): Threat[] {
  const d = CARDS[c.key]
  if (d.stop) return liveThreats(r).filter(t => !t.stopped)
  if (isAttack(c.key)) return liveThreats(r).filter(t => damageFor(d.family, d.power, t.kind) > 0)
  return []
}

export function canPlay(r: Run, c: Card): { ok: boolean; why?: string } {
  const d = CARDS[c.key]
  if (r.phase !== 'turn') return { ok: false }
  if (d.ap === null) return { ok: false, why: "Can't be played" }
  const forced = r.hand.some(x => CARDS[x.key].forced && apCost(r, x) <= r.ap)
  if (forced && !d.forced) return { ok: false, why: 'Play your Must play cards first' }
  if (apCost(r, c) > r.ap) return { ok: false, why: 'Not enough AP' }
  if (d.cost && r.capital - d.cost < 1 && !d.forced) return { ok: false, why: 'Not enough Capital' }
  if (d.gold && r.gold < d.gold) return { ok: false, why: 'Not enough gold' }
  if (c.key === 'prospect' && r.plots.length >= CONFIG.maxPlots && freePlot(r) < 0) return { ok: false, why: 'No land left to claim' }
  if ((c.key === 'well' || c.key === 'wildcat') && freePlot(r) < 0) return { ok: false, why: 'No free plot' }
  if ((c.key === 'bucket' || c.key === 'fireBrigade') && !r.fire) return { ok: false, why: 'No fire' }
  if (d.stop && !targetsFor(r, c).length) return { ok: false, why: 'Every move is already stopped' }
  if (c.key === 'pettyCash' && r.capital - skimRate(r) < 1) return { ok: false, why: 'Not enough Capital' }
  if (isAttack(c.key) && !liveThreats(r).some(t => damageFor(d.family, d.power, t.kind) > 0)) return { ok: false, why: 'No effect on these enemies' }
  return { ok: true }
}

function spendCard(r: Run, c: Card) {
  r.hand = r.hand.filter(x => x.id !== c.id)
  if (c.temp) return
  if (CARDS[c.key].oncePerRound) return // sits out until the next round's shuffle
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
  const d = CARDS[c.key]
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
  } else if (d.stop) {
    const options = targetsFor(r, c)
    const t = options.find(x => x.id === target) ?? options[0]
    spendCard(r, c)
    t.stopped = true
    say(r, `${d.name}: ${THREATS[t.kind].name}'s ${intent(r, t)} is stopped this turn.`)
  } else {
    spendCard(r, c)
    switch (c.key) {
      case 'prospect': {
        const add = Math.min(CONFIG.plotsPerProspect, CONFIG.maxPlots - r.plots.length)
        for (let i = 0; i < add; i++) r.plots.push(null)
        for (let i = 0; i < CONFIG.wellCardsPerProspect; i++) { const w = card(r, 'well'); r.deck.push(w); r.hand.push(w) }
        say(r, add ? `Claimed ${add} plot${add > 1 ? 's' : ''}.` : 'No new land. 2 Well cards drawn.')
        break
      }
      case 'well': case 'wildcat': {
        const i = freePlot(r)
        r.plots[i] = { output: d.power, reserve: c.key === 'wildcat' ? CONFIG.wildcatReserve : CONFIG.wellReserve }
        r.stats.wellsBuilt++
        say(r, `Well No. ${i + 1} built.`)
        break
      }
      case 'bucket': r.fire = Math.max(0, r.fire - 1); say(r, r.fire ? `One fire out. ${fires(r.fire)} still burning.` : 'Fire out. Pumps restart next turn.'); break
      case 'fireBrigade': r.fire = 0; say(r, 'Every fire is out. Pumps restart next turn.'); break
      case 'improveGear': r.cover += d.power; break
      case 'hardGraft': r.ap += 1; break
      case 'pettyCash': {
        const rate = skimRate(r)
        if (r.capital - rate >= 1) { money(r, 'Petty Cash (skim)', -rate); r.gold += 1; r.stats.skims++ }
        break
      }
      case 'inheritance': money(r, 'Inheritance', CONFIG.inheritance); break
      case 'dividends': money(r, 'Dividends', CONFIG.dividends); break
      case 'telegram': { const help = card(r, pick(r, ATTACK_CARDS), true); help.free = true; r.hand.push(help); say(r, `Help is on its way: ${CARDS[help.key].name}, free to play.`); break }
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
export const wellValue = (w: Well) => w.reserve * CONFIG.sellPerBarrel

function sellWell(r: Run, plot: number) {
  const w = r.plots[plot]
  if (r.ap < 1 || !w) return
  r.ap -= 1
  const value = wellValue(w)
  loseWell(r, plot, 'lost')
  money(r, `Sold Well No. ${plot + 1} (${w.reserve} bbl left)`, value)
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
    case 'Rumble': return hw >= 0 ? `Well No. ${hw + 1} becomes Unstable.` : 'The ground rumbles.'
    case 'Spray': return 'Lose $2 and 1 oil.'
    case 'Blow': { const u = r.plots.findIndex(w => w?.unstable); return u >= 0 ? `Well No. ${u + 1} is destroyed.` : 'Pressure builds.' }
    case 'Picket': return '−1 AP next turn.'
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
  }
  return a
}

export function fireTarget(r: Run): string {
  if (!r.fire) return ''
  if (r.oil > 0) return `Burns ${Math.min(r.oil, r.fire)} oil (${r.oil} → ${Math.max(0, r.oil - r.fire)}).`
  const i = highestWell(r)
  if (i < 0) return 'Nothing left to burn.'
  return `Destroys Well No. ${i + 1}.`
}

function endTurn(r: Run) {
  newReport(r)
  // unplayed Must play cards still cost their money
  for (const c of r.hand.filter(x => CARDS[x.key].forced)) {
    if (c.key === 'badBlood') beat(r, 'cards', 'Bad Blood', badBloodRoll(r) ? 'Someone set a fire.' : 'Nothing happened. This time.')
    else { money(r, CARDS[c.key].name, -CARDS[c.key].cost); beat(r, 'money', CARDS[c.key].name, `Unplayed: −$${CARDS[c.key].cost}.`) }
    spendCard(r, c)
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
      case 'Rumble': { const i = highestWell(r); if (i >= 0) { r.plots[i]!.unstable = true; say(r, `Well No. ${i + 1} is Unstable.`) } break }
      case 'Spray': dmg += 2; r.oil = Math.max(0, r.oil - 1); break
      case 'Blow': {
        const u = r.plots.findIndex(w => w?.unstable)
        if (u >= 0) { loseWell(r, u, 'lost'); t.hold = Math.min(t.maxHold, t.hold + 2); say(r, `Blowout! Well No. ${u + 1} destroyed.`) }
        const i = highestWell(r); if (i >= 0) r.plots[i]!.unstable = true
        break
      }
      case 'Picket': r.pending.ap += 1; break
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
    }
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
export function act(prev: Run, a: Action): Run {
  const r = clone(prev)
  if (r.phase === 'shop') { shopAction(r, a); return r }
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
