import { describe, expect, it } from 'vitest'
import { act, canPlay, damageFor, newRun, type Run } from './engine'
import { CONFIG } from './config'
import { money } from './format'
import { botRun } from '../../tools/bot'

const begin = (bonus: Parameters<typeof newRun>[1] = 'threeOil', seed = 7): Run => newRun(seed, bonus)

describe('a new run', () => {
  it('starts with the agreed economy', () => {
    const r = newRun(1, 'threeOil')
    expect(r.capital).toBe(CONFIG.startCapital - 1) // first turn's Bank Debt is paid
    expect(r.debt).toBe(1)
    expect(r.deck).toHaveLength(10)
    expect(r.oil).toBe(3)
    expect(r.phase).toBe('turn') // no shop before the first fight
    expect(r.round).toBe(1)
  })

  it('round 1 charges the debt and deals a hand of five', () => {
    const r = begin()
    expect(r.phase).toBe('turn')
    expect(r.round).toBe(1)
    expect(r.hand.length).toBeGreaterThanOrEqual(5)
    expect(r.capital).toBeLessThan(CONFIG.startCapital)
    expect(r.threats).toHaveLength(1)
  })
})

describe('damage', () => {
  it('doubles when weak and halves when resisted', () => {
    expect(damageFor('Muscle', 2, 'claimJumper')).toBe(4)
    expect(damageFor('Legal', 4, 'claimJumper')).toBe(2)
    expect(damageFor('Muscle', 2, 'inspector')).toBe(0)
    expect(damageFor('Wages', 3, 'blowout')).toBe(0)
    expect(damageFor('Dirty', 6, 'baron')).toBe(12)
  })
})

describe('selling and prospecting', () => {
  it('sells the whole stockpile for 1 AP', () => {
    let r = begin()
    const before = r.capital
    r = act(r, { type: 'sellOil' })
    expect(r.oil).toBe(0)
    expect(r.ap).toBe(1)
    expect(r.capital).toBeGreaterThanOrEqual(before)
  })

  it('Prospect claims two plots and two Well cards', () => {
    let r = begin()
    const p = r.hand.find(c => c.key === 'prospect') ?? r.draw.find(c => c.key === 'prospect')!
    if (!r.hand.includes(p)) { r.hand.push(p); r.draw = r.draw.filter(c => c !== p) }
    r.ap = 2
    r = act(r, { type: 'play', cardId: p.id })
    expect(r.plots).toHaveLength(2)
    expect(r.hand.filter(c => c.key === 'well')).toHaveLength(2)
  })
})

describe('fire', () => {
  it('burns oil first, then the highest Well', () => {
    let r = begin()
    r.plots = [{ output: 1, reserve: 6 }, { output: 1, reserve: 6 }, { output: 1, reserve: 6 }]
    r.oil = 1; r.fire = 2; r.threats.forEach(t => (t.hold = 99))
    r = act(r, { type: 'endTurn' })
    expect(r.oil).toBe(0)
    expect(r.plots.filter(Boolean)).toHaveLength(3)
    r.fire = Math.max(r.fire, 1)
    r = act(r, { type: 'endTurn' })
    expect(r.plots[2]).toBeNull()
  })
})

describe('money units', () => {
  it('grows a unit each stage', () => {
    expect(money(15, 1)).toBe('$15')
    expect(money(15, 2)).toBe('$15K')
    expect(money(-3, 3)).toBe('−$3M')
    expect(money(4, 4, true)).toBe('+$4B')
  })
})

describe('a whole stage played by the bot', () => {
  it('always ends in a win or a loss', () => {
    for (let s = 0; s < 50; s++) {
      const r = botRun(newRun(500 + s, 'threeOil'))
      expect(['lost', 'stageComplete']).toContain(r.phase)
    }
  })
})

describe('fixes', () => {
  it('Prospect can refill empty plots once all land is claimed', () => {
    let r = begin()
    const p = r.hand.find(c => c.key === 'prospect') ?? r.draw.find(c => c.key === 'prospect')!
    if (!r.hand.includes(p)) { r.hand.push(p); r.draw = r.draw.filter(c => c !== p) }
    r.hand = r.hand.filter(c => c.key !== 'well')
    r.ap = 2
    r.plots = [{ output: 1, reserve: 6 }, null, { output: 1, reserve: 6 }, { output: 1, reserve: 6 }, { output: 1, reserve: 6 }]
    r = act(r, { type: 'play', cardId: p.id })
    expect(r.hand.filter(c => c.key === 'well')).toHaveLength(2)
  })

  it('Prospect is refused when every plot has a Well', () => {
    const r = begin()
    r.plots = Array.from({ length: CONFIG.maxPlots }, () => ({ output: 1, reserve: 6 }))
    const p = r.deck.find(c => c.key === 'prospect')!
    r.hand.push(p); r.ap = 2
    expect(canPlay(r, p).ok).toBe(false)
  })

  it('an attack aimed at an immune enemy hits one it can hurt', () => {
    let r = begin()
    r.threats = [
      { id: 900, kind: 'inspector', hold: 6, maxHold: 6, step: 0, cycle: 0, round3: false, beaten: false },
      { id: 901, kind: 'strike', hold: 8, maxHold: 8, step: 0, cycle: 0, round3: false, beaten: false },
    ]
    const h = r.deck.find(c => c.key === 'hiredHand')!
    r.hand = [h]; r.ap = 2
    r = act(r, { type: 'play', cardId: h.id, target: 900 })
    expect(r.threats[0].hold).toBe(6)
    expect(r.threats[1].hold).toBe(4)
  })
})

describe('wells and hands', () => {
  it('a Well runs dry and frees its plot', () => {
    let r = begin()
    r.threats = [{ id: 900, kind: 'inspector', hold: 99, maxHold: 99, step: 0, cycle: 0, round3: false, beaten: false }]
    r.capital = 50
    r.plots = [{ output: 1, reserve: 2 }, null]
    r.storage = 99
    r = act(r, { type: 'endTurn' })
    expect(r.plots[0]?.reserve).toBe(1)
    r = act(r, { type: 'endTurn' })
    expect(r.plots[0]).toBeNull()
    expect(r.stats.wellsDry).toBe(1)
  })

  it('every hand is five cards', () => {
    let r = begin('extraProspect')
    for (let t = 0; t < 6 && r.phase === 'turn'; t++) {
      r.threats.forEach(x => (x.hold = 99))
      expect(r.hand).toHaveLength(CONFIG.handSize)
      r = act(r, { type: 'endTurn' })
    }
  })

  it('unbuilt Well cards are discarded and come back later', () => {
    let r = begin()
    r.threats.forEach(t => (t.hold = 99))
    const p = r.deck.find(c => c.key === 'prospect')!
    r.hand = [p]; r.draw = r.draw.filter(c => c.id !== p.id); r.discard = []; r.ap = 2
    r = act(r, { type: 'play', cardId: p.id })
    const wells = r.hand.filter(c => c.key === 'well')
    expect(wells).toHaveLength(2)
    expect(r.deck.filter(c => c.key === 'well')).toHaveLength(2)
    r = act(r, { type: 'endTurn' })
    const ids = wells.map(w => w.id)
    const where = [...r.hand, ...r.draw, ...r.discard].filter(c => ids.includes(c.id))
    expect(where).toHaveLength(2)
    expect(r.hand.length).toBe(CONFIG.handSize)
  })

  it('building a Well uses the card up', () => {
    let r = begin()
    const p = r.deck.find(c => c.key === 'prospect')!
    r.hand = [p]; r.ap = 3
    r = act(r, { type: 'play', cardId: p.id })
    const w = r.hand.find(c => c.key === 'well')!
    r = act(r, { type: 'play', cardId: w.id })
    expect(r.deck.some(c => c.id === w.id)).toBe(false)
    expect(r.plots[0]?.reserve).toBe(CONFIG.wellReserve)
  })
})
