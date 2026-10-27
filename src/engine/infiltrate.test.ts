import { describe, expect, it } from 'vitest'
import { act, canPlay, infiltrated, newRun, type Run } from './engine'
import { SHOP_POOL } from './data'

const setup = (kind: 'railroad' | 'strike' | 'inspector' = 'railroad', hold = 50): Run => {
  const r = newRun(25, 'threeOil')
  r.threats = [{ id: 900, kind, hold, maxHold: hold, step: 0, cycle: 0, round3: false, beaten: false }]
  r.deck.push({ id: 8800, key: 'infiltrate', uses: null })
  r.hand = [{ id: 8800, key: 'infiltrate', uses: null }]
  r.ap = 3
  r.capital = 100
  return r
}
const hold = (r: Run) => r.threats[0].hold
/** Ends a turn with freight cleared, so the Railroad Agent never reaches the $1 floor (where she'd gain Hold). */
const end = (r: Run) => act({ ...r, freight: 0 }, { type: 'endTurn' })

describe('Infiltrate', () => {
  it('is sold in the stage 1 shop and costs 2 AP', () => {
    expect(SHOP_POOL).toContain('infiltrate')
    const r = setup(); r.ap = 1
    expect(canPlay(r, r.hand[0]).ok).toBe(false)
  })

  it('does 3 now, then 2 and 1 as your next two turns end', () => {
    let r = setup()
    r = act(r, { type: 'play', cardId: 8800, target: 900 })
    expect(hold(r)).toBe(47)
    expect(infiltrated(r, r.threats[0])).toEqual([2, 1])
    r = end(r) // the turn it was played: nothing more yet
    expect(hold(r)).toBe(47)
    r = end(r)
    expect(hold(r)).toBe(45)
    r = end(r)
    expect(hold(r)).toBe(44)
    r = end(r)
    expect(hold(r)).toBe(44)
    expect(infiltrated(r, r.threats[0])).toEqual([])
  })

  it('doubles against an enemy weak to Dirty', () => {
    let r = setup('strike')
    r = act(r, { type: 'play', cardId: 8800, target: 900 })
    expect(hold(r)).toBe(44)
    expect(infiltrated(r, r.threats[0])).toEqual([4, 2])
  })

  it("can't be played on an enemy immune to Dirty", () => {
    const r = setup('inspector')
    expect(canPlay(r, r.hand[0]).ok).toBe(false)
  })

  it('can finish an enemy off as the turn ends, which wins the round', () => {
    let r = setup('railroad', 5)
    r = act(r, { type: 'play', cardId: 8800, target: 900 })
    expect(hold(r)).toBe(2)
    r = act(r, { type: 'endTurn' })
    r = act(r, { type: 'endTurn' })
    expect(r.threats[0].beaten).toBe(true)
    expect(r.phase).toBe('roundWon')
  })

  it('upgraded: 4, then 3 and 2', () => {
    let r = setup()
    r.hand[0].up = true
    r = act(r, { type: 'play', cardId: 8800, target: 900 })
    expect(hold(r)).toBe(46)
    expect(infiltrated(r, r.threats[0])).toEqual([3, 2])
  })
})
