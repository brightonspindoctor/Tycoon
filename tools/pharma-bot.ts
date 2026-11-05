// A simple bot that plays Pharmaceutical stage 1, for the balance check and the tests.
import { PHARMA as C } from '../src/engine/config'
import { PCARDS, PTHREATS, isRemedy } from '../src/engine/pharma/data'
import {
  canPlay, canResearch, damageFor, liveThreats, nextFactoryPrice, pact, researchCost, settleCost, targetsFor, turnsLeft,
  type PRun,
} from '../src/engine/pharma/engine'

export function pharmaBot(start: PRun, onStep?: (r: PRun) => void): PRun {
  let r = start
  let guard = 0
  while ((r.phase === 'turn' || r.phase === 'roundWon' || r.phase === 'shop') && guard++ < 5000) {
    onStep?.(r)
    if (r.phase === 'roundWon') { r = pact(r, { type: 'spoils', key: r.spoils[0] ?? null }); continue }
    if (r.phase === 'shop') {
      const g = [...r.draw, ...r.discard].find(c => c.key === 'generic')
      if (g && r.capital > C.genericDestroy + 4) { r = pact(r, { type: 'destroy', cardId: g.id }); continue }
      if (r.factories.length < C.maxFactories && r.capital >= nextFactoryPrice(r) + 6) { r = pact(r, { type: 'buyFactory' }); continue }
      const slot = r.shop.cards.findIndex(k => k && (PCARDS[k].price ?? 99) + 6 <= r.capital)
      if (slot >= 0) { r = pact(r, { type: 'buy', slot }); continue }
      r = pact(r, { type: 'leaveShop' }); continue
    }
    // a turn
    const free = r.factories.some(f => !f)
    const remedies = r.hand.filter(c => isRemedy(c.key))
    const cs = r.cases.find(c => c.step >= 1 && r.capital >= settleCost(c) + 3)
    if (cs) { r = pact(r, { type: 'settle', caseId: cs.id }); continue }
    if (canResearch(r).ok && free && !remedies.length && r.capital >= researchCost(r) + 3) { r = pact(r, { type: 'research' }); continue }
    const playable = r.hand.filter(c => canPlay(r, c).ok)
    const has = (k: string) => playable.find(c => c.key === k)
    const produce = has('produce')
    if (produce) {
      const best = remedies.reduce((a, b) => (turnsLeft(b.key as never, b.age ?? 0) > turnsLeft(a.key as never, a.age ?? 0) ? b : a))
      r = pact(r, { type: 'play', cardId: produce.id, target: best.id }); continue
    }
    if (r.trust <= -3) { const t = has('charityGala') ?? has('testimonials') ?? has('freeSamples') ?? has('medicineShow'); if (t) { r = pact(r, { type: 'play', cardId: t.id }); continue } }
    const nda = has('nda')
    if (nda) {
      const t = liveThreats(r).filter(x => !x.nda).sort((a, b) => PTHREATS[b.kind].moves.length - PTHREATS[a.kind].moves.length)[0]
      if (t) { r = pact(r, { type: 'play', cardId: nda.id, target: t.id }); continue }
    }
    // the attack that does the most damage
    let bestPlay: { id: number; target?: number; dmg: number } | null = null
    for (const c of playable) {
      const d = PCARDS[c.key]
      if (!d.power) continue
      if (d.all) { const dmg = liveThreats(r).reduce((s, t) => s + Math.min(t.hold, damageFor(d.family, d.power!, t.kind)), 0); if (!bestPlay || dmg > bestPlay.dmg) bestPlay = { id: c.id, dmg }; continue }
      for (const id of targetsFor(r, c).ids) {
        const t = r.threats.find(x => x.id === id)!
        const dmg = Math.min(t.hold, damageFor(d.family, d.power, t.kind)) + (damageFor(d.family, d.power, t.kind) >= t.hold ? 3 : 0)
        if (!bestPlay || dmg > bestPlay.dmg) bestPlay = { id: c.id, target: id, dmg }
      }
    }
    if (bestPlay) { r = pact(r, { type: 'play', cardId: bestPlay.id, target: bestPlay.target }); continue }
    const other = playable.find(c => ['freeSamples', 'hireSalesmen', 'biopiracy', 'inventAilment', 'charityGala', 'testimonials'].includes(c.key) && (c.key !== 'charityGala' || r.trust < 3))
    if (other) { r = pact(r, { type: 'play', cardId: other.id }); continue }
    r = pact(r, { type: 'endTurn' })
  }
  return r
}

