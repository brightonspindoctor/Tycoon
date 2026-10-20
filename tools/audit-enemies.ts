// Run with: npm run audit
// Plays every enemy move in a fixed state and prints what it promised next to what changed.
import { newRun, act, intent, intentText, incorporate, debtPerTurn, netPrice, type Run } from '../src/engine/engine'
import { THREATS, type ThreatKind } from '../src/engine/data'

function base(stage: number): Run {
  let r = newRun(11, 'threeOil')
  if (stage === 2) { incorporate(r); r = act(r, { type: 'leaveShop' }) }
  r.plots = stage === 2
    ? [{ output: 1, reserve: 0, field: true }, { output: 1, reserve: 0, lasting: true }, { output: 1, reserve: 0, field: true }]
    : [{ output: 1, reserve: 6 }, { output: 1, reserve: 6 }, { output: 2, reserve: 6 }]
  r.capital = 60; r.oil = 3; r.gold = 5; r.exposure = stage === 2 ? 2 : 0; r.cover = 0; r.fire = 0; r.marked = null
  r.hand = []; r.ap = 2
  return r
}
const summary = (r: Run) => ({
  cap: r.capital, oil: r.oil, gold: r.gold, exp: r.exposure, fire: r.fire, ap: r.ap, net: netPrice(r),
  plots: r.plots.map(w => (w ? (w.unstable ? 'U' : 'W') : '_')).join(''), marked: r.marked,
  hand: r.hand.filter(c => ['marginCall', 'ceaseDesist', 'patentClaim', 'badBlood', 'iou'].includes(c.key)).map(c => c.key).join(','),
  deckJunk: r.deck.filter(c => ['badBlood', 'proxyBallot', 'looseThread'].includes(c.key)).length, deck: r.deck.length,
  phase: r.phase,
})
for (const kind of Object.keys(THREATS) as ThreatKind[]) {
  const d = THREATS[kind]; const stage = ['muckraker', 'combine', 'clawback', 'patentHolder', 'saboteur', 'commission', 'proxyFight'].includes(kind) ? 2 : 1
  const steps = d.cycle.length + (d.round3 ? 1 : 0)
  for (let step = 0; step < steps; step++) for (const round of [1, 2]) {
    const r = base(stage); r.round = round
    if (kind === 'claimJumper' || kind === 'saboteur') r.marked = 2
    if (kind === 'blowout' && step === 2) r.plots[1]!.unstable = true
    r.threats = [{ id: 999, kind, hold: 99, maxHold: 99, step, cycle: 0, round3: !!d.round3 && step >= d.cycle.length, beaten: false }]
    const t = r.threats[0]
    const a = intent(r, t), said = intentText(r, t)
    const before = summary(r)
    const debt = debtPerTurn(r)
    const after = act(r, { type: 'endTurn' })
    const s = summary(after)
    const was = before as Record<string, unknown>
    const diff = Object.entries(s).filter(([k, v]) => was[k] !== v).map(([k, v]) => `${k} ${String(was[k])}→${String(v)}`).join(', ')
    console.log(`${d.name.padEnd(24)} R${round} ${a.padEnd(17)} | ${said}\n${''.padEnd(30)}→ ${diff} (debt ${debt}, pumps run after)`)
    if (stage === 1 || round === 2) break
  }
}
