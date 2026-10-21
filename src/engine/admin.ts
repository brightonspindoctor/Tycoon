// Admin mode: start a playtest run anywhere, with the kit you choose. Pure, like the rest of the engine.
import { act, newRun, type Card, type Run } from './engine'
import { CARDS, type BonusKey, type CardKey } from './data'

export interface AdminStart {
  stage: 1 | 2
  start: 1 | 2 | 3 | 4 | 'incorporate' // a round, or (stage 2) the incorporation screen
  bonus: BonusKey
  wells: number // stage 1: Wells standing; stage 2: Fields
  capital: number
  gold: number
  exposure: number // stage 2
  deck: 'starter' | 'strong'
}

export const ADMIN_DEFAULTS: AdminStart = { stage: 2, start: 1, bonus: 'threeOil', wells: 2, capital: 20, gold: 3, exposure: 0, deck: 'starter' }

// a deck that has been through a decent stage 1, plus a few stage 2 buys
const STRONG_1: CardKey[] = ['payWages', 'lawyerUp', 'fireBrigade', 'dynamite']
const STRONG_2: CardKey[] = ['patentThicket', 'espionage', 'rotaryRig', 'telegraphLine', 'personalLawyer']

export function adminStart(seed: number, o: AdminStart): Run {
  let r = newRun(seed, o.bonus)
  r.admin = true
  const add = (k: CardKey, up = false) => { const c: Card = { id: r.nextId++, key: k, uses: CARDS[k].uses, up }; r.deck.push(c) }
  if (o.deck === 'strong') STRONG_1.forEach(k => add(k))
  r.plots = Array.from({ length: Math.min(5, Math.max(o.wells, 0) + (o.stage === 1 ? 0 : 1)) }, (_, i) => (i < o.wells ? { output: 1, reserve: 6 } : null))
  if (o.stage === 2) {
    r.phase = 'stageComplete'; r.round = 4
    r = act(r, { type: 'continue' }) // incorporate: Wells become Fields
    r.admin = true
    if (o.deck === 'strong') { STRONG_2.forEach(k => add(k)); const l = r.deck.find(c => c.key === 'lawyerUp'); if (l) l.up = true }
    r.exposure = Math.max(0, Math.min(7, o.exposure))
    // jumping past incorporation: skip the pick and hand over the old stage 2 kit
    if (o.start !== 'incorporate') { r.offer = undefined; r.picked = undefined; (['derrick', 'payDividend', 'expenseAccount'] as CardKey[]).forEach(k => add(k)) }
  }
  r.capital = o.capital
  r.gold = o.gold
  if (o.start === 'incorporate' && o.stage === 2) return r
  const round = o.start === 'incorporate' ? 1 : o.start
  if (o.stage === 1 && round === 1) { r.phase = 'shop'; r.round = 0 } // replay round 1 with the kit
  else if (o.stage === 2 && round === 1) return act(r, { type: 'leaveShop' })
  else { r.phase = 'shop'; r.round = round - 1 }
  r.shop.prospectSold = false; r.shop.bucketSold = false
  return act(r, { type: 'leaveShop' })
}
