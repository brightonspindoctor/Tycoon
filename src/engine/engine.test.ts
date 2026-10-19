import { describe, expect, it } from 'vitest'
import { act, canPlay, damageFor, debtPerTurn, newRun, type Run } from './engine'
import { lossStreak, type RunRecord } from '../storage'
import { CONFIG } from './config'
import { money } from './format'
import { botRun } from '../../tools/bot'
import { THREATS, type CardKey } from './data'

const begin = (bonus: Parameters<typeof newRun>[1] = 'threeOil', seed = 7): Run => newRun(seed, bonus)

describe('a new run', () => {
  it('starts with the agreed economy', () => {
    const r = newRun(1, 'threeOil')
    expect(r.capital).toBe(CONFIG.startCapital - 1) // first turn's Bank Debt is paid
    expect(r.debt).toBe(1)
    expect(r.deck).toHaveLength(8)
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

describe('who you fight', () => {
  const roleOf = (k: string) => THREATS[k as keyof typeof THREATS].role
  const enter = (r: Run, round: number): Run => { r.phase = 'shop'; r.round = round - 1; return act(r, { type: 'leaveShop' }) }

  it('round 1 takes your cash, round 2 breaks your engine, round 3 sends one of each', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const r1 = newRun(seed, 'threeOil')
      expect(r1.threats.map(t => roleOf(t.kind))).toEqual(['cash'])
      const r2 = enter(newRun(seed, 'threeOil'), 2)
      expect(r2.threats.map(t => roleOf(t.kind))).toEqual(['engine'])
      const r3 = enter(newRun(seed, 'threeOil'), 3)
      expect(r3.threats.map(t => roleOf(t.kind)).sort()).toEqual(['cash', 'engine'])
      expect(enter(newRun(seed, 'threeOil'), 4).threats.map(t => t.kind)).toEqual(['baron'])
    }
  })
})

describe('Trust Fund', () => {
  it('starts with $15 and no Bank Debt', () => {
    const r = newRun(3, 'trustFund')
    expect(r.debt).toBe(0)
    expect(r.capital).toBe(CONFIG.startCapital) // nothing was charged on turn 1
    expect(r.ledger.some(l => l.label.startsWith('Bank debt'))).toBe(false)
  })

  it('only covers stage 1', () => {
    const r = newRun(3, 'trustFund')
    expect(debtPerTurn(r)).toBe(0)
    r.stage = 2
    expect(debtPerTurn(r)).toBe(CONFIG.startDebt)
  })

  it('is offered after 3 stage 1 losses in a row, and a stage 1 win resets it', () => {
    const rec = (outcome: string, rounds = 2): RunRecord => ({ id: outcome + rounds + Math.random(), date: '', industry: 'Oil', rounds, outcome, gold: null, completed: false, stageGold: 0 })
    const lost = rec('Bankrupt'), timeout = rec('Out of time', 3), won = rec('Stage 1 complete', 4)
    expect(lossStreak([lost, timeout, lost])).toBe(3)
    expect(lossStreak([lost, lost, won, lost, lost])).toBe(2) // newest first: a win breaks the streak
    expect(lossStreak([won, lost, lost, lost])).toBe(0)
  })
})

describe('card and enemy changes', () => {
  const lone = (r: Run, kind: Parameters<typeof damageFor>[2]) => { r.threats = [{ id: 900, kind, hold: 50, maxHold: 50, step: 0, cycle: 0, round3: false, beaten: false }]; r.capital = 50; return r }

  it('Prospect is used up once played', () => {
    let r = lone(begin(), 'inspector')
    const p = r.deck.find(c => c.key === 'prospect')!
    r.hand = [p]; r.ap = 2
    r = act(r, { type: 'play', cardId: p.id })
    expect(r.deck.some(c => c.key === 'prospect')).toBe(false)
  })

  it('Shore Up deals 1 Hold damage and gives 1 Cover', () => {
    let r = lone(begin(), 'inspector')
    const s = card('shoreUp'); r.deck.push(s); r.hand = [s]; r.ap = 1
    r = act(r, { type: 'play', cardId: s.id })
    expect(r.threats[0].hold).toBe(49)
    expect(r.cover).toBe(CONFIG.shoreUpCover)
  })

  it('Bucket of Water puts out one fire and never wears out', () => {
    let r = lone(begin(), 'inspector')
    const b = r.deck.find(c => c.key === 'bucket')!
    expect(b.uses).toBeNull()
    r.fire = 2; r.hand = [b]; r.ap = 1
    r = act(r, { type: 'play', cardId: b.id })
    expect(r.fire).toBe(1)
    expect(r.deck.some(c => c.id === b.id)).toBe(true)
  })

  it('fires add up', () => {
    let r = lone(begin(), 'baron')
    r.modifier = null; r.oil = 5; r.storage = 9; r.fire = 1 // one fire burning, oil to keep it fed
    r.threats[0].step = 2 // the Baron's next move is Arson: 2 more fires
    r = act(r, { type: 'endTurn' })
    expect(r.fire).toBe(Math.min(CONFIG.fireMax, 1 + 2))
  })

  it('the Railroad Agent is no longer weak to Legal; she takes bribes', () => {
    expect(damageFor('Legal', 4, 'railroad')).toBe(4)
    expect(damageFor('Dirty', 3, 'railroad')).toBe(6)
  })

  it('Buckets are always for sale at the Land Office', () => {
    let r = begin(); r.phase = 'shop'; r.capital = 20
    const before = r.deck.filter(c => c.key === 'bucket').length
    r = act(r, { type: 'buyBucket' })
    expect(r.deck.filter(c => c.key === 'bucket').length).toBe(before + 1)
    expect(r.capital).toBe(20 - CONFIG.bucketPrice)
  })
})

let cid = 5000
function card(key: CardKey) { return { id: cid++, key, uses: null as number | null } }

describe('Bribe', () => {
  it('costs 1 gold, then either lands cleanly or backfires with Bad Blood', () => {
    let landed = 0, refused = 0
    for (let seed = 1; seed <= 400; seed++) {
      let r = newRun(seed, 'threeOil')
      r.threats = [{ id: 900, kind: 'inspector', hold: 50, maxHold: 50, step: 0, cycle: 0, round3: false, beaten: false }]
      r.gold = 3
      const b = { id: 7777, key: 'payOff' as const, uses: null }
      r.deck.push(b); r.hand = [b]; r.ap = 1
      const blood = r.deck.filter(c => c.key === 'badBlood').length
      r = act(r, { type: 'play', cardId: b.id })
      expect(r.gold).toBe(3 - CONFIG.bribeGold)
      const hitIt = r.threats[0].hold === 50 - CONFIG.bribeDamage
      const backfired = r.deck.filter(c => c.key === 'badBlood').length === blood + 1
      expect(hitIt !== backfired).toBe(true) // exactly one of the two
      if (hitIt) landed++; else refused++
    }
    expect(landed / 400).toBeGreaterThan(0.4); expect(landed / 400).toBeLessThan(0.6)
    expect(refused).toBeGreaterThan(0)
  })

  it("can't be played without gold", () => {
    const r = newRun(2, 'threeOil')
    const b = { id: 7778, key: 'payOff' as const, uses: null }
    r.hand = [b]; r.ap = 1; r.gold = 0
    expect(canPlay(r, b).ok).toBe(false)
  })
})

describe('Pay Wages and Sabotage', () => {
  it('Pay Wages is a Muscle card that works on anyone', () => {
    expect(damageFor('Muscle', 4, 'inspector')).toBe(0) // the Inspector is immune to Muscle
    expect(damageFor('Muscle', 4, 'blowout')).toBe(2) // resists
    expect(damageFor('Muscle', 4, 'claimJumper')).toBe(8) // weak
  })

  it('Sabotage destroys exactly one random Well', () => {
    const lost = new Set<number>()
    for (let seed = 1; seed <= 60; seed++) {
      let r = newRun(seed, 'threeOil')
      r.threats = [{ id: 900, kind: 'strike', hold: 99, maxHold: 99, step: 1, cycle: 0, round3: false, beaten: false }] // next move: Sabotage
      r.capital = 50; r.storage = 20
      r.plots = [{ output: 1, reserve: 9 }, { output: 1, reserve: 9 }, { output: 1, reserve: 9 }]
      const deck = r.deck.length
      r = act(r, { type: 'endTurn' })
      expect(r.plots.filter(Boolean)).toHaveLength(2)
      expect(r.deck.length).toBe(deck) // no cards destroyed any more
      lost.add(r.plots.findIndex(w => !w))
    }
    expect(lost.size).toBeGreaterThan(1) // not always the same Well
  })
})
