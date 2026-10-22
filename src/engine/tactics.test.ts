import { describe, expect, it } from 'vitest'
import { act, newRun } from './engine'
import { newTally, tacticFor, type Tally } from './tactics'
import { CONFIG } from './config'
import { botRun } from '../../tools/bot'

const with_ = (t: Partial<Tally>): Tally => ({ ...newTally(), ...t })
const bar = CONFIG.tactics.bar

describe('hidden tactics', () => {
  it('a run keeps a tally as it is played', () => {
    const r = botRun(newRun(3, 'threeOil'), 1)
    expect(r.tally!.rounds).toBeGreaterThan(0)
    expect(Object.values(r.tally!.damage).reduce((a, b) => a + b, 0)).toBeGreaterThan(0)
  })

  it('a blocked move is counted', () => {
    let r = newRun(25, 'threeOil')
    const s = r.deck.find(c => c.key === 'shoreUp')!
    r.hand = [s]; r.ap = 1
    r = act(r, { type: 'play', cardId: s.id, target: r.threats[0].id })
    expect(r.tally!.blocks).toBe(1)
  })

  it('no badge when nothing stands out', () => {
    expect(tacticFor(with_({ rounds: 12 }), 20, 10)).toBeNull()
    expect(tacticFor(undefined, 10, 500)).toBeNull()
  })

  it('picks the tactic furthest past its bar', () => {
    expect(tacticFor(with_({ damage: { Legal: 90, Dirty: 10 } }), 20, 0)).toBe('lawyeredUp')
    expect(tacticFor(with_({ cooled: bar.spinDoctor * 2, damage: { Legal: 60, Dirty: 40 } }), 20, 0)).toBe('spinDoctor')
    expect(tacticFor(with_({ blocks: Math.ceil(bar.fortress / CONFIG.tactics.blockWorth) + 2 }), 20, 0)).toBe('fortress')
    expect(tacticFor(with_({ rounds: 12, quick: 6 }), 20, 0)).toBe('blitz')
    expect(tacticFor(with_({}), 20, bar.oilBaron + 30)).toBe('oilBaron')
  })

  it('Lean Operation needs a small deck as well as cards destroyed', () => {
    expect(tacticFor(with_({ destroyed: 12 }), CONFIG.tactics.leanDeckMax, 0)).toBe('leanOperation')
    expect(tacticFor(with_({ destroyed: 12 }), CONFIG.tactics.leanDeckMax + 1, 0)).toBeNull()
  })
})
