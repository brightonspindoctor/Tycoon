import { describe, expect, it } from 'vitest'
import { act, newRun, type Run } from './engine'
import type { BonusKey, CardKey } from './data'

const keys = (r: Run) => r.hand.map(c => c.key)
const playKey = (r: Run, k: CardKey) => {
  const c = r.hand.find(x => x.key === k)
  expect(c, `${k} in hand: ${keys(r).join(', ')}`).toBeTruthy()
  const next = act(r, { type: 'play', cardId: c!.id })
  expect(next.hand.some(x => x.id === c!.id), `${k} was played`).toBe(false)
  return next
}

/** The script the coach walks a new player through, turn by turn. */
function playScript(seed: number, bonus: BonusKey = 'threeOil') {
  let r = newRun(seed, bonus, {}, { tutorial: true })
  expect(r.threats.map(t => t.kind)).toEqual(['squatter'])
  expect(r.oil).toBe(0) // the 3 Oil bonus waits until the fight is over
  // turn 1: Hard Graft, Prospect, a Well
  expect(keys(r)).toEqual(['prospect', 'hardGraft', 'hiredHand', 'improveGear', 'lawyerUp'])
  r = playKey(r, 'hardGraft'); expect(r.ap).toBe(3)
  r = playKey(r, 'prospect'); expect(r.ap).toBe(1)
  r = playKey(r, 'well'); expect(r.ap).toBe(0)
  expect(r.plots.filter(Boolean)).toHaveLength(1)
  const before = r.capital
  r = act(r, { type: 'endTurn' })
  // turn 2: the Shakedown took $3; Cover, then the first hit
  expect(r.turn).toBe(2)
  expect(r.oil).toBe(1)
  expect(keys(r)).toEqual(['improveGear', 'hiredHand', 'bucket', 'shoreUp', 'lawyerUp'])
  const afterShake = r.capital
  r = playKey(r, 'improveGear'); expect(r.cover).toBe(4)
  r = playKey(r, 'hiredHand'); expect(r.threats[0].hold).toBe(5)
  const t2 = r.capital
  r = act(r, { type: 'endTurn' })
  // turn 3: Cover blocked it all; sell, Lawyer Up, and the Torch is coming
  expect(r.oil).toBe(2)
  expect(keys(r)).toEqual(['lawyerUp', 'hiredHand', 'shoreUp', 'bucket', 'improveGear'])
  r = act(r, { type: 'sellOil' }); expect(r.oil).toBe(0)
  r = playKey(r, 'lawyerUp'); expect(r.threats[0].hold).toBe(2)
  r = act(r, { type: 'endTurn' })
  // turn 4: fire. Bucket, then finish him
  expect(r.fire).toBe(1)
  expect(r.oil).toBe(0) // pumps stopped
  expect(keys(r)).toEqual(['bucket', 'hiredHand', 'lawyerUp', 'improveGear', 'shoreUp'])
  r = playKey(r, 'bucket'); expect(r.fire).toBe(0)
  r = playKey(r, 'hiredHand')
  expect(r.phase).toBe('roundWon')
  return { r, before, afterShake, t2 }
}

describe('the tutorial', () => {
  it('plays the same four turns, whatever the seed', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const { r, before, afterShake, t2 } = playScript(seed)
      expect(before - afterShake).toBe(3 + 1) // the Shakedown, then Bank Debt
      expect(r.tutorial).toBe(false)
      expect(r.oil).toBe(3) // the bonus arrives once it's over
      expect(t2).toBeGreaterThan(0)
    }
  })

  it('works with each first-run bonus', () => {
    for (const b of ['extraProspect', 'pettyCash', 'gearGraft', 'trustFund'] as BonusKey[]) playScript(7, b)
  })

  it('carries on as a normal fight when skipped', () => {
    let r = newRun(3, 'threeOil', {}, { tutorial: true })
    r = act(r, { type: 'skipTutorial' })
    expect(r.tutorial).toBe(false)
    expect(r.oil).toBe(3)
    expect(r.threats[0].kind).toBe('squatter')
  })

  it('never sends the Squatter outside the tutorial', () => {
    for (let seed = 1; seed <= 200; seed++) expect(newRun(seed, 'threeOil').threats[0].kind).not.toBe('squatter')
  })
})
