import { describe, expect, it } from 'vitest'
import { ADMIN_DEFAULTS, adminStart } from './admin'
import { act, newRun } from './engine'

describe('admin mode', () => {
  it('jumps to any stage 2 round with the kit asked for', () => {
    for (const start of [1, 2, 3, 4] as const) {
      const r = adminStart(9, { ...ADMIN_DEFAULTS, start, wells: 3, gold: 5, exposure: 4 })
      expect(r.stage).toBe(2)
      expect(r.round).toBe(start)
      expect(r.phase).toBe('turn')
      expect(r.plots.filter(w => w?.field)).toHaveLength(3)
      expect(r.gold).toBe(5)
      expect(r.exposure).toBeGreaterThanOrEqual(4)
      expect(r.admin).toBe(true)
    }
    expect(adminStart(9, { ...ADMIN_DEFAULTS, start: 4 }).threats[0].kind).toBe('proxyFight')
  })

  it('can open on the incorporation screen, or in stage 1', () => {
    expect(adminStart(9, { ...ADMIN_DEFAULTS, start: 'incorporate' }).phase).toBe('incorporate')
    const r = adminStart(9, { ...ADMIN_DEFAULTS, stage: 1, start: 4, wells: 2 })
    expect(r.stage).toBe(1)
    expect(r.threats[0].kind).toBe('baron')
  })

  it('cheats work on admin runs only', () => {
    let r = adminStart(9, ADMIN_DEFAULTS)
    const cap = r.capital
    r = act(r, { type: 'admin', op: 'cash' })
    expect(r.capital).toBe(cap + 10)
    r = act(r, { type: 'admin', op: 'addCard', card: 'espionage' })
    expect(r.hand.some(c => c.key === 'espionage')).toBe(true)
    r = act(r, { type: 'admin', op: 'winRound' })
    expect(r.phase).toBe('roundWon')
    const plain = newRun(9, 'threeOil')
    expect(act(plain, { type: 'admin', op: 'cash' }).capital).toBe(plain.capital)
  })
})
