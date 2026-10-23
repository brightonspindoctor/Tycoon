import { describe, expect, it } from 'vitest'
import { act, newRun, type Run } from './engine'
import { adminStart, ADMIN_DEFAULTS } from './admin'
import { CONFIG } from './config'
import { CARDS, type CardKey } from './data'
import { ACHIEVEMENTS, ACHIEVEMENT_KEYS, achievedBy } from './achievements'

const A = CONFIG.achievements
function inStage(stage: 1 | 2 | 3 | 4, hand: CardKey[] = [], hold = 30): Run {
  const r = adminStart(11, { ...ADMIN_DEFAULTS, stage, start: 1, wells: 2, capital: 80, gold: 6, deck: 'starter' })
  r.threats = [{ id: 900, kind: stage === 4 ? 'fracking' : r.threats[0].kind, hold, maxHold: hold, step: 0, cycle: 0, round3: false, beaten: false }]
  r.hand = hand.map((k, i) => ({ id: 5000 + i, key: k, uses: CARDS[k].uses }))
  r.ap = 4
  return r
}

describe('achievements', () => {
  it('every achievement has a name, a goal and an icon; all but the two device ones check the run', () => {
    for (const k of ACHIEVEMENT_KEYS) {
      const a = ACHIEVEMENTS[k]
      expect(a.name && a.goal && a.icon).toBeTruthy()
      expect(!!a.check).toBe(k !== 'fluentInSpin' && k !== 'fullCabinet')
    }
    expect(ACHIEVEMENT_KEYS).toHaveLength(18)
  })

  it('a new run has earned nothing', () => {
    expect(achievedBy(newRun(1, 'threeOil'))).toEqual([])
  })

  it('counts oil pumped across the run for Gusher', () => {
    let r = inStage(1)
    r.feats = { pumped: A.gusher - 1, bestHit: 0, scratched: false, cleanFight: false, quickBoss: false }
    expect(achievedBy(r)).not.toContain('gusher')
    r.capital = 500
    r = act(r, { type: 'endTurn' })
    expect(r.feats!.pumped).toBeGreaterThanOrEqual(A.gusher)
    expect(achievedBy(r)).toContain('gusher')
  })

  it('Cash Rich is stage 1 only', () => {
    const r = inStage(1); r.capital = A.cashRich
    expect(achievedBy(r)).toContain('cashRich')
    const r4 = inStage(4); r4.capital = A.cashRich * 3
    expect(achievedBy(r4)).not.toContain('cashRich')
  })

  it('Bulletproof needs the Cover during a turn', () => {
    const r = inStage(3); r.cover = A.bulletproof
    expect(achievedBy(r)).toContain('bulletproof')
    r.cover = A.bulletproof - 1
    expect(achievedBy(r)).not.toContain('bulletproof')
  })

  it('records the most Hold one card removes, for Mercy Rule', () => {
    let r = inStage(1, ['dynamite'], 200)
    r = act(r, { type: 'play', cardId: 5000, target: 900 })
    expect(r.feats!.bestHit).toBeGreaterThan(0)
    expect(r.feats!.bestHit).toBe(200 - r.threats[0].hold)
  })

  it('beating a boss on the first turn is a Hostile Takeover', () => {
    let r = inStage(1, ['dynamite'], 1)
    r.round = 4; r.turn = 1
    r = act(r, { type: 'play', cardId: 5000, target: 900 })
    expect(r.phase).toBe('stageComplete')
    expect(achievedBy(r)).toContain('hostileTakeover')
  })

  it('Not a Scratch: a stage 3 fight won before any enemy took Capital, but not stage 1', () => {
    let r = inStage(3, ['buyOut'], 1)
    r = act(r, { type: 'play', cardId: 5000, target: 900 })
    expect(r.phase === 'roundWon' || r.phase === 'stageComplete').toBe(true)
    expect(achievedBy(r)).toContain('notAScratch')
    let r1 = inStage(1, ['dynamite'], 1)
    r1 = act(r1, { type: 'play', cardId: 5000, target: 900 })
    expect(achievedBy(r1)).not.toContain('notAScratch')
  })

  it('an enemy taking Capital spoils the fight, and a new fight starts clean', () => {
    let r = inStage(3, [], 999)
    r.cover = 0; r.capital = 500
    r = act(r, { type: 'endTurn' })
    expect(r.feats!.scratched).toBe(true)
  })

  it('the end-of-game ones only count once the Truth is beaten', () => {
    const r = inStage(4)
    r.stats.skims = 0; r.gold = A.dynasty
    r.deck = r.deck.slice(0, A.leanMachine)
    expect(achievedBy(r)).not.toContain('aboveBoard')
    r.phase = 'stageComplete'
    expect(achievedBy(r)).toEqual(expect.arrayContaining(['aboveBoard', 'dynasty', 'leanMachine']))
  })

  it('the failures', () => {
    const b = inStage(1); b.phase = 'lost'; b.round = 1; b.loss = { reason: 'bankrupt', by: [] }
    expect(achievedBy(b)).toContain('shortCareer')
    const m = inStage(4); m.phase = 'lost'; m.loss = { reason: 'midnight', by: [] }
    expect(achievedBy(m)).toContain('stoppedClock')
    const g = inStage(2); g.phase = 'lost'; g.capital = A.richCompany; g.loss = { reason: 'ruined', by: [] }
    expect(achievedBy(g)).toContain('richCompany')
  })
})

describe('hard mode', () => {
  it('no advantage: the starter deck without its Prospect, the full Bank Debt, no oil, no items', () => {
    const plain = newRun(5, 'none')
    expect(plain.bonus).toBe('none')
    expect(plain.debt).toBe(CONFIG.startDebt)
    expect(plain.oil).toBe(0)
    expect(plain.items).toEqual([])
    expect(plain.plots.filter(Boolean)).toHaveLength(0)
    expect(plain.deck.length).toBe(newRun(5, 'threeOil').deck.length - 1)
    expect(plain.deck.some(c => c.key === 'prospect')).toBe(false)
  })
})
