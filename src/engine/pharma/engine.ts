// The Pharmaceutical rules, stage 1. Pure functions over a plain-object run, like the Oil engine,
// so the screen, the tests and the simulator all use the same code.
import { PHARMA as C } from '../config'
import { next, pick, shuffle } from '../rng'
import {
  BIG_ONES, CASE_STEPS, PCARDS, PSHOP_POOL, PSTARTER, PTHREATS, REMEDIES, REMEDY_KEYS, WEAK_ONES, isRemedy,
  type Hit, type PCardKey, type PMove, type PThreatKind, type RemedyKey,
} from './data'

export interface PCard { id: number; key: PCardKey; uses?: number; age?: number } // age: a remedy's turns since it was researched
export interface Patent { cardId: number; key: RemedyKey; age: number; copied?: boolean; blocked?: boolean }
export interface PThreat { id: number; kind: PThreatKind; hold: number; maxHold: number; step: number; beaten: boolean; nda?: boolean }
export interface PCase { id: number; remedy: RemedyKey; step: number } // step: 0 Complaint · 1 Hospitalised · 2 Critical
export type PPhase = 'turn' | 'roundWon' | 'shop' | 'lost' | 'won'
export type PLoss = 'disgraced' | 'bankrupt' | 'stalemate'

export interface PRun {
  seed: number
  rng: number
  phase: PPhase
  round: number
  turn: number
  capital: number
  trust: number
  ap: number
  nextId: number
  draw: PCard[]
  hand: PCard[]
  discard: PCard[]
  benched: PCard[] // once-a-fight cards already played: back for the next fight
  factories: (Patent | null)[]
  threats: PThreat[]
  cases: PCase[]
  researched: boolean // Research is once a turn
  doubleResearch: boolean // Invent an Ailment
  samples: number // Free Samples: live remedies pay this much more this turn
  factoryPrice: number // index into the factory prices
  destroyCost: number
  shop: { cards: (PCardKey | null)[]; destroyed: boolean }
  spoils: PCardKey[] // after a round: pick one, or take the cash
  events: string[]
  loss?: { reason: PLoss; by?: string }
  stats: { earned: number; researched: number; patented: number; produced: number; deaths: number; settled: number }
}

export type PAction =
  | { type: 'research' }
  | { type: 'play'; cardId: number; target?: number } // target: a liability id, a remedy card id (Produce) or a factory index (Free Samples doesn't need one)
  | { type: 'settle'; caseId: number }
  | { type: 'endTurn' }
  | { type: 'spoils'; key: PCardKey | null } // null: take the cash
  | { type: 'buy'; slot: number }
  | { type: 'buyFactory' }
  | { type: 'destroy'; cardId: number }
  | { type: 'leaveShop' }

const say = (r: PRun, s: string) => { r.events.unshift(s); r.events.length = Math.min(r.events.length, 12) }
const card = (r: PRun, key: PCardKey): PCard => {
  const c: PCard = { id: r.nextId++, key }
  if (PCARDS[key].uses) c.uses = PCARDS[key].uses
  if (isRemedy(key)) c.age = 0
  return c
}
export const allCards = (r: PRun) => [...r.draw, ...r.hand, ...r.discard, ...r.benched]
export const liveThreats = (r: PRun) => r.threats.filter(t => !t.beaten)
export const remedyPays = (key: RemedyKey, age: number) => REMEDIES[key].pays[age] ?? 0
export const turnsLeft = (key: RemedyKey, age: number) => Math.max(0, REMEDIES[key].pays.length - age)
export const factoryCount = (r: PRun) => r.factories.length
export const nextFactoryPrice = (r: PRun) => C.factoryPrices[Math.min(r.factoryPrice, C.factoryPrices.length - 1)]
export const currentMove = (t: PThreat): PMove => { const m = PTHREATS[t.kind].moves; return m[t.step % m.length] }

export function researchCost(r: PRun): number {
  if (r.trust < C.researchLowBelow) return C.research.low
  if (r.trust >= C.researchHighFrom) return C.research.high
  return C.research.mid
}
/** What a live patent pays this turn, as it stands. */
export function patentPays(r: PRun, p: Patent): number {
  if (p.blocked) return 0
  const base = remedyPays(p.key, p.age)
  return (p.copied ? Math.floor(base / 2) : base) + r.samples
}

export function damageFor(family: string, power: number, kind: PThreatKind): number {
  const d = PTHREATS[kind]
  if (d.weak === family) return power * 2
  if (d.resist === family) return Math.floor(power / 2)
  return power
}

function threatsFor(r: PRun, round: number): PThreatKind[] {
  if (round >= 4) return ['fraud']
  if (round === 1) return [pick(r, BIG_ONES)]
  const weak = shuffle(r, [...WEAK_ONES])
  if (round === 2) return weak.slice(0, 2)
  const x = next(r)
  return x < 0.4 ? weak.slice(0, 3) : x < 0.7 ? ['rivalQuack'] : ['classAction']
}

function startRound(r: PRun, round: number) {
  r.round = round
  r.turn = 0
  r.phase = 'turn'
  r.draw = shuffle(r, [...r.draw, ...r.hand, ...r.discard, ...r.benched])
  r.hand = []; r.discard = []; r.benched = []
  for (const p of r.factories) if (p) p.blocked = false // a block from the last fight doesn't carry over
  r.threats = []
  for (const k of threatsFor(r, round)) arrive(r, k)
  startTurn(r)
}

function arrive(r: PRun, k: PThreatKind) {
  const d = PTHREATS[k]
  r.threats.push({ id: r.nextId++, kind: k, hold: d.hold, maxHold: d.hold, step: 0, beaten: false })
  say(r, `${d.name} arrives.`)
  for (const h of d.arrives ?? []) applyHit(r, h, d.name)
}

/** Turns until a liability's next arrival, for the screen. */
export function spawnIn(r: PRun, t: PThreat): number | null {
  const s = PTHREATS[t.kind].spawn
  if (!s || t.beaten) return null
  return s.every - (r.turn % s.every)
}

function drawCards(r: PRun, n: number) {
  for (let i = 0; i < n; i++) {
    if (!r.draw.length) { if (!r.discard.length) return; r.draw = shuffle(r, r.discard); r.discard = [] }
    r.hand.push(r.draw.shift()!)
  }
}

function startTurn(r: PRun) {
  r.turn++
  r.ap = C.baseAP
  r.researched = false
  r.samples = 0
  drawCards(r, C.handSize)
}

export function newPharmaRun(seed: number): PRun {
  const r: PRun = {
    seed, rng: seed, phase: 'turn', round: 0, turn: 0, capital: C.startCapital, trust: 0, ap: C.baseAP, nextId: 1,
    draw: [], hand: [], discard: [], benched: [], factories: Array(C.startFactories).fill(null), threats: [], cases: [],
    researched: false, doubleResearch: false, samples: 0, factoryPrice: 0, destroyCost: C.destroyCost,
    shop: { cards: [], destroyed: false }, spoils: [], events: [],
    stats: { earned: 0, researched: 0, patented: 0, produced: 0, deaths: 0, settled: 0 },
  }
  r.draw = PSTARTER.map(k => card(r, k))
  startRound(r, 1)
  return r
}

function addTrust(r: PRun, n: number) {
  r.trust = Math.min(C.trustMax, r.trust + n)
}
function pay(r: PRun, n: number) { r.capital -= n }
function earn(r: PRun, n: number) { r.capital += n; r.stats.earned += n }

const freeFactory = (r: PRun) => r.factories.findIndex(f => !f)
const livePatents = (r: PRun) => r.factories.filter((f): f is Patent => !!f)

export function canResearch(r: PRun): { ok: boolean; why?: string } {
  if (r.phase !== 'turn') return { ok: false }
  if (r.researched) return { ok: false, why: 'Once a turn' }
  if (r.capital < researchCost(r)) return { ok: false, why: 'Not enough Capital' }
  return { ok: true }
}

export function canPlay(r: PRun, c: PCard): { ok: boolean; why?: string } {
  const d = PCARDS[c.key]
  if (r.phase !== 'turn') return { ok: false }
  if (d.ap === null) return { ok: false, why: isRemedy(c.key) ? 'Needs Produce' : 'Unplayable' }
  if (r.ap < d.ap) return { ok: false, why: 'Not enough AP' }
  if (d.cost && r.capital < d.cost) return { ok: false, why: 'Not enough Capital' }
  if (c.key === 'produce') {
    if (freeFactory(r) < 0) return { ok: false, why: 'No empty factory' }
    if (!r.hand.some(x => isRemedy(x.key))) return { ok: false, why: 'No remedy in hand' }
  }
  if (c.key === 'nda' && !liveThreats(r).some(t => !t.nda)) return { ok: false, why: 'Nothing to cancel' }
  return { ok: true }
}

/** What a card could be aimed at: liabilities, or remedies in your hand. Empty: it needs no target. */
export function targetsFor(r: PRun, c: PCard): { kind: 'threat' | 'remedy'; ids: number[] } {
  const d = PCARDS[c.key]
  if (c.key === 'produce') return { kind: 'remedy', ids: r.hand.filter(x => isRemedy(x.key)).map(x => x.id) }
  if (c.key === 'nda') return { kind: 'threat', ids: liveThreats(r).filter(t => !t.nda).map(t => t.id) }
  if (d.power && !d.all) return { kind: 'threat', ids: liveThreats(r).map(t => t.id) }
  return { kind: 'threat', ids: [] }
}

function hitThreat(r: PRun, t: PThreat, family: string, power: number) {
  const dmg = damageFor(family, power, t.kind)
  t.hold -= dmg
  if (t.hold <= 0 && !t.beaten) { t.hold = 0; t.beaten = true; addTrust(r, C.beatTrust); say(r, `${PTHREATS[t.kind].name} is beaten. +${C.beatTrust} Trust.`) }
}

function research(r: PRun) {
  const cost = researchCost(r)
  pay(r, cost)
  r.researched = true
  const n = r.doubleResearch ? 2 : 1
  r.doubleResearch = false
  for (let i = 0; i < n; i++) {
    const c = card(r, pick(r, REMEDY_KEYS))
    r.hand.push(c)
    r.stats.researched++
    r.stats.patented++
    say(r, `Research: ${PCARDS[c.key].name}.`)
  }
}

function play(r: PRun, c: PCard, target?: number) {
  const d = PCARDS[c.key]
  const chk = canPlay(r, c)
  if (!chk.ok) return
  const aim = targetsFor(r, c)
  let tgt = target
  if (tgt === undefined && aim.ids.length === 1) tgt = aim.ids[0]
  if (aim.ids.length && (tgt === undefined || !aim.ids.includes(tgt))) return // needs a target
  r.ap -= d.ap!
  if (d.cost) pay(r, d.cost)
  if (d.trust && c.key !== 'testimonials') addTrust(r, d.trust)
  r.hand = r.hand.filter(x => x.id !== c.id)

  switch (c.key) {
    case 'produce': {
      const rem = r.hand.find(x => x.id === tgt)!
      r.hand = r.hand.filter(x => x.id !== rem.id)
      const key = rem.key as RemedyKey
      r.factories[freeFactory(r)] = { cardId: rem.id, key, age: rem.age ?? 0 }
      r.stats.produced++
      if (REMEDIES[key].produceTrust) addTrust(r, REMEDIES[key].produceTrust!)
      say(r, `${PCARDS[key].name} goes live.`)
      break
    }
    case 'nda': { const t = r.threats.find(x => x.id === tgt)!; t.nda = true; say(r, `NDA signed with ${PTHREATS[t.kind].name}.`); break }
    case 'freeSamples': r.samples += 1; break
    case 'hireSalesmen': r.hand.push(card(r, 'salesman'), card(r, 'salesman')); break
    case 'medicineShow': r.hand.push(card(r, 'salesman')); break
    case 'biopiracy': { const x = card(r, pick(r, REMEDY_KEYS)); r.hand.push(x); r.stats.patented++; say(r, `Biopiracy: ${PCARDS[x.key].name}.`); break }
    case 'inventAilment': r.doubleResearch = true; break
    case 'testimonials': addTrust(r, (d.trust ?? 0) - r.cases.length); break
  }
  if (d.power) {
    if (d.all) for (const t of liveThreats(r)) hitThreat(r, t, d.family, d.power)
    else { const t = r.threats.find(x => x.id === tgt); if (t) hitThreat(r, t, d.family, d.power) }
  }

  // where the card goes now
  if (c.uses !== undefined) {
    c.uses--
    if (c.uses <= 0) { say(r, `${d.name} is used up.`); return wonYet(r) }
  }
  if (d.oncePerFight) r.benched.push(c)
  else r.discard.push(c)
  wonYet(r)
}

function wonYet(r: PRun) {
  if (r.phase !== 'turn' || liveThreats(r).length) return
  r.phase = 'roundWon'
  say(r, `Round ${r.round} won.`)
  r.spoils = r.round >= 4 ? [] : shuffle(r, [...PSHOP_POOL]).slice(0, 3)
  if (r.round >= 4) r.phase = 'won'
}

/** A case lands on a live remedy that can cause them, or else any live one. No live remedy: −1 Trust. */
function newCase(r: PRun) {
  const live = livePatents(r)
  const risky = live.filter(p => REMEDIES[p.key].caseChance > 0)
  const on = risky.length ? pick(r, risky) : live.length ? pick(r, live) : null
  if (!on) { addTrust(r, -1); say(r, 'No one to blame: −1 Trust.'); return }
  r.cases.push({ id: r.nextId++, remedy: on.key, step: 0 })
  say(r, `Patient Case: ${PCARDS[on.key].name}.`)
}

function worsen(r: PRun, c: PCase) {
  c.step++
  if (c.step === 2) { addTrust(r, -C.criticalTrust); say(r, `A ${PCARDS[c.remedy].name} case is Critical.`) }
  if (c.step >= 3) {
    pay(r, C.deathCapital); addTrust(r, -C.deathTrust); r.stats.deaths++
    say(r, `A ${PCARDS[c.remedy].name} patient has died. −$${C.deathCapital}, −${C.deathTrust} Trust.`)
    r.cases = r.cases.filter(x => x.id !== c.id)
  }
}

function applyHit(r: PRun, h: Hit, who: string) {
  switch (h.k) {
    case 'trust': addTrust(r, -h.n); break
    case 'cash': pay(r, h.n); break
    case 'widow': pay(r, r.cases.length ? h.n * 2 : h.n); break
    case 'case': newCase(r); break
    case 'worsen': if (r.cases.length) for (const c of [...r.cases]) worsen(r, c); else addTrust(r, -1); break
    case 'copy': {
      const live = livePatents(r).filter(p => !p.copied)
      if (!live.length) { pay(r, 2); break }
      const best = live.reduce((a, b) => (remedyPays(b.key, b.age + 1) > remedyPays(a.key, a.age + 1) ? b : a))
      best.copied = true; say(r, `${who}: ${PCARDS[best.key].name} is copied. Half pay from now on.`); break
    }
    case 'block': {
      const live = livePatents(r).filter(p => !p.blocked)
      if (!live.length) { pay(r, 1); break }
      const best = live.reduce((a, b) => (remedyPays(b.key, b.age + 1) > remedyPays(a.key, a.age + 1) ? b : a))
      best.blocked = true; say(r, `${who}: ${PCARDS[best.key].name} pays nothing next turn.`); break
    }
  }
}

function ageCard(r: PRun, c: PCard): PCard {
  if (!isRemedy(c.key)) return c
  c.age = (c.age ?? 0) + 1
  if (c.age >= REMEDIES[c.key].pays.length) { say(r, `${PCARDS[c.key].name} expired on the shelf. A Generic takes its place.`); return card(r, 'generic') }
  return c
}

function endTurn(r: PRun) {
  // 1 · open cases get worse
  for (const c of [...r.cases]) worsen(r, c)
  // 2 · live remedies pay, and the risky ones can cause cases
  for (const p of livePatents(r)) {
    const n = patentPays(r, p)
    if (n) earn(r, n)
    p.blocked = false
    if (next(r) < REMEDIES[p.key].caseChance) newCase(r)
  }
  // 3 · liabilities move
  for (const t of liveThreats(r)) {
    const m = currentMove(t)
    const name = PTHREATS[t.kind].name
    m.hits.forEach((h, i) => {
      if (i === 0 && t.nda) { say(r, `${name}'s ${m.name}: first hit cancelled (NDA).`); return }
      applyHit(r, h, name)
    })
    t.nda = false
    t.step++
  }
  // 3b · some liabilities bring others: the Class Action adds a Claimant every 3rd turn
  for (const t of liveThreats(r)) {
    const s = PTHREATS[t.kind].spawn
    if (!s || r.turn % s.every !== 0) continue
    if (liveThreats(r).filter(x => x.kind === s.kind).length >= s.max) continue
    arrive(r, s.kind)
  }
  // 4 · everything ages; expired patents leave a Generic
  r.factories = r.factories.map(p => {
    if (!p) return p
    p.age++
    if (p.age >= REMEDIES[p.key].pays.length) { say(r, `${PCARDS[p.key].name}'s patent expires. A Generic goes in your discard.`); r.discard.push(card(r, 'generic')); return null }
    return p
  })
  r.hand = r.hand.map(c => ageCard(r, c))
  r.draw = r.draw.map(c => ageCard(r, c))
  r.discard = r.discard.map(c => ageCard(r, c))
  // 5 · lost?
  if (r.trust <= C.disgraceAt) { r.phase = 'lost'; r.loss = { reason: 'disgraced' }; return }
  if (r.capital < 0) { r.phase = 'lost'; r.loss = { reason: 'bankrupt' }; return }
  if (r.turn >= C.turnLimit) { r.phase = 'lost'; r.loss = { reason: 'stalemate' }; return }
  // 6 · next turn
  r.discard.push(...r.hand); r.hand = []
  startTurn(r)
}

function openShop(r: PRun) {
  r.phase = 'shop'
  r.shop = { cards: shuffle(r, [...PSHOP_POOL]).slice(0, C.shopCards), destroyed: false }
}

/** Takes an action and returns the new run. The run passed in is never changed. */
export function pact(prev: PRun, a: PAction): PRun {
  const r: PRun = structuredClone(prev)
  switch (a.type) {
    case 'research': if (canResearch(r).ok) research(r); break
    case 'play': { const c = r.hand.find(x => x.id === a.cardId); if (c) play(r, c, a.target); break }
    case 'settle': {
      const c = r.cases.find(x => x.id === a.caseId)
      if (!c || r.phase !== 'turn') break
      const cost = C.settle[c.step]
      if (r.capital < cost || r.ap < C.settleAP) break
      pay(r, cost); r.ap -= C.settleAP; r.stats.settled++
      r.cases = r.cases.filter(x => x.id !== c.id)
      say(r, `Settled out of court for $${cost}.`)
      break
    }
    case 'endTurn': if (r.phase === 'turn') endTurn(r); break
    case 'spoils':
      if (r.phase !== 'roundWon') break
      if (a.key && r.spoils.includes(a.key)) r.discard.push(card(r, a.key))
      else earn(r, C.spoilsCash)
      openShop(r)
      break
    case 'buy': {
      const k = r.shop.cards[a.slot]
      if (r.phase !== 'shop' || !k) break
      const price = PCARDS[k].price ?? 0
      if (r.capital < price) break
      pay(r, price); r.discard.push(card(r, k)); r.shop.cards[a.slot] = null
      break
    }
    case 'buyFactory': {
      const price = nextFactoryPrice(r)
      if (r.phase !== 'shop' || r.factories.length >= C.maxFactories || r.capital < price) break
      pay(r, price); r.factories.push(null); r.factoryPrice++
      break
    }
    case 'destroy': {
      if (r.phase !== 'shop') break
      const c = allCards(r).find(x => x.id === a.cardId)
      if (!c || (c.key !== 'generic' && r.shop.destroyed)) break // Generics as often as you like; anything else once a visit
      const cost = c.key === 'generic' ? C.genericDestroy : r.destroyCost
      if (r.capital < cost) break
      pay(r, cost)
      if (c.key !== 'generic') r.destroyCost++
      r.draw = r.draw.filter(x => x.id !== c.id); r.discard = r.discard.filter(x => x.id !== c.id); r.hand = r.hand.filter(x => x.id !== c.id); r.benched = r.benched.filter(x => x.id !== c.id)
      if (c.key !== 'generic') r.shop.destroyed = true
      break
    }
    case 'leaveShop': if (r.phase === 'shop') startRound(r, r.round + 1); break
  }
  return r
}

export const caseStep = (c: PCase) => CASE_STEPS[c.step]
export const settleCost = (c: PCase) => C.settle[c.step]
/** The Trust dial's colour band. */
export const trustBand = (t: number) => (t <= -3 ? 'low' : t >= 3 ? 'high' : 'mid')
