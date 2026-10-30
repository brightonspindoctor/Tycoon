// The October playtest changes: skims cost the stage's meter, the stalemate warning, and stage 4's card and item tweaks.
import { describe, expect, it } from 'vitest'
import { act, apCost, canPlay, type Run } from './engine'
import { adminStart, ADMIN_DEFAULTS } from './admin'
import { CONFIG } from './config'
import { CARDS, type CardKey } from './data'

function start(stage: 2 | 3 | 4, hand: CardKey[]): Run {
  const r = adminStart(5, { ...ADMIN_DEFAULTS, stage, start: 1, capital: 300, gold: 4, heat: 10, clock: 2 })
  r.hand = hand.map((k, i) => ({ id: 6000 + i, key: k, uses: CARDS[k].uses }))
  r.deck.push(...r.hand)
  r.ap = 4
  return r
}
const play = (r: Run, i = 0, target?: number) => act(r, { type: 'play', cardId: r.hand[i].id, target })

describe('skimming costs the stage meter', () => {
  it('stage 2: +1 Board Exposure', () => {
    const r = start(2, ['expenseAccount']); const before = r.exposure
    expect(play(r).exposure).toBe(before + 1)
  })
  it(`stage 3: +${CONFIG.skimHeat3} Heat`, () => {
    const r = start(3, ['expenseAccount']); const before = r.heat
    expect(play(r).heat).toBe(before + CONFIG.skimHeat3)
  })
  it(`stage 4: the clock moves on ${CONFIG.skimClock4} hour`, () => {
    const r = start(4, ['expenseAccount']); const before = r.clock!
    expect(play(r).clock).toBe(before + CONFIG.skimClock4)
  })
})

describe('the stalemate warning', () => {
  it(`warns when ${CONFIG.stalemateWarn} turns are left`, () => {
    let r = start(2, [])
    r.turn = CONFIG.turnLimit - CONFIG.stalemateWarn
    r.threats[0].hold = 999; r.threats[0].maxHold = 999
    r.capital = 999
    r = act(r, { type: 'endTurn' })
    expect(r.report.some(b => b.title === `${CONFIG.stalemateWarn} turns left`)).toBe(true)
  })
})

describe('stage 4 tweaks', () => {
  it('Subpoena caps you at 2 cards', () => expect(CONFIG.subpoenaCards).toBe(2))
  it('Influencers: 1 AP, once per fight, and no longer says it is the only one', () => {
    let r = start(4, ['influencers', 'propaganda'])
    expect(apCost(r, r.hand[0])).toBe(1)
    expect(CARDS.influencers.text).not.toMatch(/only one/i)
    r = play(r)
    expect(r.discard.some(c => c.key === 'influencers')).toBe(false) // sits out until the next fight
  })
  it('Climate Breakdown is once per fight', () => expect(CARDS.climateBreakdown.oncePerRound).toBe(true))
  it('a Compensation Claim costs 1 AP', () => expect(CARDS.compensationClaim.ap).toBe(1))
  it('Propaganda keeps hitting as your next 2 turns end', () => {
    let r = start(4, ['propaganda'])
    r.threats = [{ id: 900, kind: 'fracking', hold: 60, maxHold: 60, step: 0, cycle: 0, round3: false, beaten: false }]
    const t = r.threats[0]
    r = play(r, 0, t.id)
    const after1 = r.threats[0].hold
    for (let i = 0; i < 3; i++) { r.capital = 999; r = act(r, { type: 'endTurn' }) }
    expect(r.threats[0].hold).toBe(after1 - 2 * CONFIG.propaganda)
  })
  it('the Lobbyist on Retainer is let go after one fight', () => {
    const r = start(4, ['propaganda'])
    r.items.push('lobbyist')
    r.threats[0].hold = 1
    const won = act(r, { type: 'play', cardId: r.hand[0].id, target: r.threats[0].id })
    expect(won.phase === 'roundWon' || won.phase === 'stageComplete').toBe(true)
    expect(won.items).not.toContain('lobbyist')
  })
  it('Shore Up still works on other liabilities', () => {
    const r = start(4, ['shoreUp'])
    expect(canPlay(r, r.hand[0]).ok).toBe(r.threats[0].kind !== 'greenPoliticians')
  })
})
