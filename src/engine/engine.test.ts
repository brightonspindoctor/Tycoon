import { describe, expect, it } from 'vitest'
import { act, apCost, canPlay, damageFor, debtPerTurn, intent, intentText, isAttack, netPrice, newRun, targetsFor, type Run } from './engine'
import { lossStreak, type RunRecord } from '../storage'
import { CONFIG } from './config'
import { money } from './format'
import { botRun } from '../../tools/bot'
import { BOONS, CARDS, REWARDS, THREATS, type CardKey } from './data'

const begin = (bonus: Parameters<typeof newRun>[1] = 'threeOil', seed = 7): Run => newRun(seed, bonus)

describe('a new run', () => {
  it('starts with the agreed economy', () => {
    const r = newRun(1, 'threeOil')
    expect(r.capital).toBe(CONFIG.startCapital - 1) // first turn's Bank Debt is paid
    expect(r.debt).toBe(1)
    expect(r.deck).toHaveLength(9)
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
    expect(damageFor('Dirty', 2, 'claimJumper')).toBe(4)
    expect(damageFor('Legal', 4, 'railroad')).toBe(2)
    expect(damageFor('Dirty', 2, 'inspector')).toBe(0)
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

  it('Shore Up stops one enemy move this turn; the cycle still moves on', () => {
    let r = lone(begin(), 'inspector')
    r.threats[0].step = 1 // next move: Fine (−$3)
    const s = card('shoreUp'); r.deck.push(s); r.hand = [s]; r.ap = 1
    r = act(r, { type: 'play', cardId: s.id })
    expect(r.threats[0].stopped).toBe(true)
    const cash = r.capital
    r = act(r, { type: 'endTurn' })
    expect(r.capital).toBe(cash - debtPerTurn(r)) // only the Bank Debt, no Fine
    expect(r.threats[0].stopped).toBe(false)
    expect(intent(r, r.threats[0])).toBe('Audit') // moved past the Fine
  })

  it('with two enemies, Shore Up stops the one you pick', () => {
    let r = lone(begin(), 'inspector')
    r.threats.push({ id: 901, kind: 'railroad', hold: 50, maxHold: 50, step: 0, cycle: 0, round3: false, beaten: false })
    const s = card('shoreUp'); r.deck.push(s); r.hand = [s]; r.ap = 1
    expect(targetsFor(r, s)).toHaveLength(2)
    r = act(r, { type: 'play', cardId: s.id, target: 901 })
    expect(r.threats.find(t => t.id === 901)!.stopped).toBe(true)
    expect(r.threats.find(t => t.id === 900)!.stopped).toBeFalsy()
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

  it('the Railroad Agent resists Legal and has no weakness', () => {
    expect(damageFor('Legal', 4, 'railroad')).toBe(2)
    expect(damageFor('Dirty', 3, 'railroad')).toBe(3)
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
      r.threats = [{ id: 900, kind: 'railroad', hold: 50, maxHold: 50, step: 0, cycle: 0, round3: false, beaten: false }]
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
  it('Pay Wages is a Dirty card that works on anyone', () => {
    expect(damageFor('Dirty', 4, 'inspector')).toBe(0) // the Inspector is immune to Dirty
    expect(damageFor('Dirty', 4, 'speculator')).toBe(4) // no resist any more
    expect(damageFor('Dirty', 4, 'claimJumper')).toBe(8) // weak
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

describe('families, shop limits and the boss items', () => {
  it('only Legal and Dirty deal damage before stage 3, and one Lawyer Up no longer finishes the Speculator', () => {
    const fams = new Set(Object.values(CARDS).filter(c => (c.era ?? 1) < 3 && isAttack(Object.keys(CARDS).find(k => CARDS[k as CardKey] === c) as CardKey)).map(c => c.family))
    expect([...fams].sort()).toEqual(['Dirty', 'Legal'])
    expect(damageFor('Legal', CARDS.lawyerUp.power, 'speculator')).toBeLessThan(THREATS.speculator.hold)
  })

  it('Dirty damage adds no Bad Blood by itself; Dynamite puts one in the discard pile', () => {
    for (const [kind, expected] of [['claimJumper', 0], ['strike', 0]] as const) {
      let r = newRun(4, 'threeOil')
      r.threats = [{ id: 900, kind, hold: 50, maxHold: 50, step: 0, cycle: 0, round3: false, beaten: false }]
      const h = r.deck.find(c => c.key === 'hiredHand')!; r.hand = [h]; r.ap = 1
      const before = r.deck.filter(c => c.key === 'badBlood').length
      r = act(r, { type: 'play', cardId: h.id })
      expect(r.deck.filter(c => c.key === 'badBlood').length - before).toBe(expected)
    }
  })

  it('one Prospect and one Bucket per visit; destroying starts at $2', () => {
    let r = newRun(5, 'threeOil'); r.phase = 'roundWon'; r.capital = 40
    r = act(r, { type: 'continue' })
    expect(r.destroyCost).toBe(2)
    const n = (k: CardKey) => r.deck.filter(c => c.key === k).length
    const p0 = n('prospect'), b0 = n('bucket')
    r = act(r, { type: 'buyProspect' }); r = act(r, { type: 'buyProspect' })
    r = act(r, { type: 'buyBucket' }); r = act(r, { type: 'buyBucket' })
    r = act(r, { type: 'reroll' }); r = act(r, { type: 'buyProspect' }) // a reroll doesn't restock them
    expect(n('prospect')).toBe(p0 + 1)
    expect(n('bucket')).toBe(b0 + 1)
  })

  it('before the boss you can buy a small item for 1 gold, and beating the boss gives a bigger one of another type', () => {
    for (let seed = 1; seed <= 40; seed++) {
      let r = newRun(seed, 'threeOil'); r.round = 3; r.phase = 'roundWon'; r.gold = 2
      r = act(r, { type: 'continue' })
      expect(r.shop.boon).not.toBeNull()
      r = act(r, { type: 'buyBoon' })
      expect(r.gold).toBe(2 - CONFIG.boonGold)
      const boon = r.boon!
      r = act(r, { type: 'leaveShop' })
      expect(r.round).toBe(4)
      r.threats[0].hold = 1; r.ap = 5
      const hit = r.hand.find(c => isAttack(c.key) && canPlay(r, c).ok) ?? (() => { const h = r.deck.find(c => c.key === 'hiredHand')!; r.hand.push(h); return h })()
      r.capital = 50
      r = act(r, { type: 'play', cardId: hit.id })
      if (r.phase !== 'stageComplete') { r.threats[0].hold = 0; continue }
      expect(r.reward).not.toBeNull()
      expect(REWARDS[r.reward!].type).not.toBe(BOONS[boon].type)
    }
  })
})

describe('Bad Blood', () => {
  it('must be played first, costs 0 AP, and sometimes starts a fire', () => {
    let fires = 0
    for (let seed = 1; seed <= 300; seed++) {
      let r = newRun(seed, 'threeOil')
      r.threats = [{ id: 900, kind: 'railroad', hold: 50, maxHold: 50, step: 0, cycle: 0, round3: false, beaten: false }]
      r.fire = 0
      const bb = { id: 8000, key: 'badBlood' as const, uses: null }
      const hh = r.deck.find(c => c.key === 'hiredHand')!
      r.deck.push(bb); r.hand = [hh, bb]; r.ap = 1
      expect(canPlay(r, hh).ok).toBe(false) // Must play first
      expect(canPlay(r, bb).ok).toBe(true)
      r = act(r, { type: 'play', cardId: bb.id })
      expect(r.ap).toBe(1) // free
      expect(r.discard.some(c => c.id === 8000)).toBe(true) // back in the deck cycle
      if (r.fire > 0) fires++
    }
    expect(fires / 300).toBeGreaterThan(0.25); expect(fires / 300).toBeLessThan(0.42)
  })

  it('Dynamite puts Bad Blood straight into the discard pile', () => {
    let r = newRun(6, 'threeOil')
    r.threats = [{ id: 900, kind: 'railroad', hold: 50, maxHold: 50, step: 0, cycle: 0, round3: false, beaten: false }]
    const d = { id: 8001, key: 'dynamite' as const, uses: 1 }
    r.deck.push(d); r.hand = [d]; r.ap = 1
    r = act(r, { type: 'play', cardId: d.id })
    expect(r.discard.filter(c => c.key === 'badBlood')).toHaveLength(1)
    expect(r.draw.some(c => c.key === 'badBlood')).toBe(false)
  })
})

describe('Spoils', () => {
  const winRound = (seed: number) => {
    let r = newRun(seed, 'threeOil'); r.capital = 30
    r.threats.forEach(t => (t.hold = 1)); r.ap = 3
    const atk = r.deck.find(c => c.key === 'lawyerUp')!; r.hand = [atk]
    r = act(r, { type: 'play', cardId: atk.id, target: r.threats[0].id })
    return r
  }
  it('winning a round offers a card: take it into your deck…', () => {
    let r = winRound(3)
    expect(r.phase).toBe('roundWon')
    const k = r.spoils!
    expect(k).toBeTruthy()
    const before = r.deck.filter(c => c.key === k).length
    r = act(r, { type: 'takeSpoils' })
    expect(r.deck.filter(c => c.key === k).length).toBe(before + 1)
    expect(r.spoils).toBeNull()
    r = act(r, { type: 'sellSpoils' }) // only one choice
    r = act(r, { type: 'continue' })
    expect(r.phase).toBe('shop')
  })
  it('…or turn it down for $3', () => {
    let r = winRound(4)
    const cash = r.capital, deck = r.deck.length
    r = act(r, { type: 'sellSpoils' })
    expect(r.capital).toBe(cash + CONFIG.spoilsCash)
    expect(r.deck.length).toBe(deck)
  })
})

describe('Loose Thread', () => {
  it('costs $1 and no AP', () => {
    let r = newRun(8, 'threeOil'); r.capital = 10
    const lt = { id: 8100, key: 'looseThread' as const, uses: null }
    r.deck.push(lt); r.hand = [lt]; r.ap = 2
    r = act(r, { type: 'play', cardId: lt.id })
    expect(r.ap).toBe(2)
    expect(r.capital).toBe(9)
  })
})

describe('opening hand', () => {
  it('always has a Prospect when you own one', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const r = newRun(seed, 'threeOil')
      expect(r.hand.some(c => c.key === 'prospect')).toBe(true)
    }
  })
  it('in later rounds too', () => {
    for (let seed = 1; seed <= 100; seed++) {
      let r = newRun(seed, 'gearGraft'); r.phase = 'shop'; r.round = 1
      r = act(r, { type: 'leaveShop' })
      expect(r.hand.some(c => c.key === 'prospect')).toBe(true)
    }
  })
})

describe('Firebreak', () => {
  it('costs 2 AP, loses your weakest Well and puts out every fire', () => {
    let r = newRun(9, 'threeOil')
    r.threats = [{ id: 900, kind: 'railroad', hold: 50, maxHold: 50, step: 0, cycle: 0, round3: false, beaten: false }]
    r.plots = [{ output: 2, reserve: 8 }, { output: 1, reserve: 5 }, { output: 1, reserve: 2 }, { output: 2, reserve: 1 }]
    r.fire = 3; r.ap = 2
    r = act(r, { type: 'firebreak' })
    expect(r.fire).toBe(0)
    expect(r.ap).toBe(0)
    expect(r.plots[2]).toBeNull() // output 1 with the fewest barrels left
    expect(r.plots.filter(Boolean)).toHaveLength(3)
  })
  it("can't be cut without a fire, a Well or 2 AP", () => {
    for (const set of [(r: Run) => { r.fire = 0 }, (r: Run) => { r.plots = [] }, (r: Run) => { r.ap = 1 }]) {
      let r = newRun(9, 'threeOil'); r.plots = [{ output: 1, reserve: 5 }]; r.fire = 2; r.ap = 2
      set(r)
      const before = JSON.stringify([r.fire, r.plots, r.ap])
      r = act(r, { type: 'firebreak' })
      expect(JSON.stringify([r.fire, r.plots, r.ap])).toBe(before)
    }
  })
})

describe('oil price', () => {
  it('starts at $3 and never drops below $1 a barrel, freight included', () => {
    const r = newRun(10, 'threeOil'); r.modifier = null; r.short = 0; r.freight = 0
    expect(netPrice(r)).toBe(3)
    r.short = 5; r.modifier = 'glut'
    expect(netPrice(r)).toBe(1)
    r.short = 0; r.modifier = null; r.freight = 4
    expect(netPrice(r)).toBe(1)
  })
})

describe('resists', () => {
  it('in stage 1 only the Railroad Agent and the Baron resist anything; the Blowout is immune to Legal', () => {
    const stage1 = ['blowout', 'strike', 'inspector', 'railroad', 'claimJumper', 'speculator', 'baron']
    expect(Object.entries(THREATS).filter(([k, t]) => stage1.includes(k) && t.resist).map(([k]) => k).sort()).toEqual(['baron', 'railroad'])
  })
})

describe('Bad Blood decays', () => {
  it('is destroyed for good after being played twice', () => {
    let r = newRun(12, 'threeOil')
    r.threats = [{ id: 900, kind: 'railroad', hold: 50, maxHold: 50, step: 0, cycle: 0, round3: false, beaten: false }]
    const bb = { id: 8200, key: 'badBlood' as const, uses: 2 }
    r.deck.push(bb); r.hand = [bb]; r.ap = 1
    r = act(r, { type: 'play', cardId: 8200 })
    expect(r.deck.find(c => c.id === 8200)?.uses).toBe(1)
    const again = r.discard.find(c => c.id === 8200)!
    r.discard = r.discard.filter(c => c.id !== 8200); r.hand = [again]
    r = act(r, { type: 'play', cardId: 8200 })
    expect(r.deck.some(c => c.id === 8200)).toBe(false)
    expect([...r.draw, ...r.discard, ...r.hand].some(c => c.id === 8200)).toBe(false)
  })
})

describe('selling a Well', () => {
  it('pays $1 for every barrel still in it, and there is no Cap Well', () => {
    let r = newRun(13, 'threeOil'); r.capital = 10; r.ap = 1
    r.plots = [{ output: 1, reserve: 4 }]
    r = act(r, { type: 'sellWell', plot: 0 })
    expect(r.capital).toBe(14)
    expect(r.plots[0]).toBeNull()
  })
})

describe('Hard Graft', () => {
  it('plays once per round and comes back next round', () => {
    let r = newRun(14, 'threeOil')
    r.threats = [{ id: 900, kind: 'railroad', hold: 50, maxHold: 50, step: 0, cycle: 0, round3: false, beaten: false }]
    const g = r.deck.find(c => c.key === 'hardGraft')!
    r.hand = [g]; r.draw = r.draw.filter(c => c.id !== g.id); r.discard = []; r.ap = 2
    r = act(r, { type: 'play', cardId: g.id })
    expect(r.ap).toBe(3)
    expect(r.deck.some(c => c.id === g.id)).toBe(true) // never destroyed
    for (let t = 0; t < 4 && r.phase === 'turn'; t++) { // sits out for the rest of the round
      expect([...r.hand, ...r.draw, ...r.discard].some(c => c.id === g.id)).toBe(false)
      r.threats.forEach(x => (x.hold = 50)); r.capital = 50
      r = act(r, { type: 'endTurn' })
    }
    r.phase = 'shop'; r.round = 1
    r = act(r, { type: 'leaveShop' }) // next round
    expect([...r.hand, ...r.draw].some(c => c.id === g.id)).toBe(true)
  })
})

describe('Send a Telegram', () => {
  it('adds a random attack card that costs no AP', () => {
    let r = newRun(15, 'threeOil'); r.capital = 20
    r.threats = [{ id: 900, kind: 'railroad', hold: 50, maxHold: 50, step: 0, cycle: 0, round3: false, beaten: false }]
    const t = { id: 8300, key: 'telegram' as const, uses: 1 }
    r.deck.push(t); r.hand = [t]; r.ap = 1
    r = act(r, { type: 'play', cardId: t.id })
    expect(r.ap).toBe(0)
    const help = r.hand.find(c => c.temp)!
    expect(isAttack(help.key)).toBe(true)
    expect(apCost(r, help)).toBe(0)
    expect(canPlay(r, help).ok).toBe(true) // playable with 0 AP left
    const hold = r.threats[0].hold
    r = act(r, { type: 'play', cardId: help.id })
    expect(r.threats[0].hold).toBeLessThan(hold)
  })
})

describe('sweep fixes', () => {
  it("the Baron's Lease takes your most valuable card by price, never junk", () => {
    let r = newRun(16, 'threeOil')
    r.threats = [{ id: 900, kind: 'baron', hold: 50, maxHold: 50, step: 1, cycle: 0, round3: false, beaten: false }] // next: Lease
    r.capital = 50
    const wild = { id: 8400, key: 'wildcat' as const, uses: 1 }
    r.deck.push(wild); r.draw.push(wild)
    expect(intentText(r, r.threats[0])).toContain('Wildcat Well')
    r = act(r, { type: 'endTurn' })
    expect(r.deck.some(c => c.id === 8400)).toBe(false)
    expect(r.deck.some(c => c.key === 'prospect')).toBe(true) // the old version always took the Prospect
  })

  it('a Must play card you cannot afford in AP does not block your free cards', () => {
    const r = newRun(17, 'threeOil')
    const mc = { id: 8500, key: 'marginCall' as const, uses: 1, temp: true }
    const g = r.deck.find(c => c.key === 'hardGraft')!
    r.hand = [mc, g]; r.ap = 0
    expect(canPlay(r, g).ok).toBe(true)
    r.ap = 1
    expect(canPlay(r, g).ok).toBe(false) // now it can be paid, so it comes first
  })

})

describe('turn report, Shore Up once per round, Accountant', () => {
  const one = (r: Run, kind: Parameters<typeof damageFor>[2], step = 0) => { r.threats = [{ id: 900, kind, hold: 50, maxHold: 50, step, cycle: 0, round3: false, beaten: false }]; r.capital = 50; return r }

  it('ending a turn records each event in order, enemy moves named', () => {
    let r = one(newRun(19, 'threeOil'), 'inspector', 1) // next: Fine
    r.fire = 1; r.oil = 2
    const seq = r.reportSeq
    r = act(r, { type: 'endTurn' })
    expect(r.reportSeq).toBe(seq + 1)
    const fineAt = r.report.findIndex(b => b.title.includes('Fine'))
    expect(r.report.findIndex(b => b.kind === 'fire')).toBeLessThan(fineAt) // fire burns before enemies act
    const fine = r.report[fineAt]
    expect(fine.who).toBe(900)
    expect(r.report[r.report.length - 1].title).toBe(`Turn ${r.turn}`)
  })

  it('Shore Up plays once per round', () => {
    let r = one(newRun(20, 'threeOil'), 'inspector')
    const s = r.deck.find(c => c.key === 'shoreUp')!
    r.hand = [s]; r.draw = r.draw.filter(c => c.id !== s.id); r.discard = []; r.ap = 1
    r = act(r, { type: 'play', cardId: s.id })
    for (let t = 0; t < 3; t++) {
      expect([...r.hand, ...r.draw, ...r.discard].some(c => c.id === s.id)).toBe(false)
      r.capital = 50; r = act(r, { type: 'endTurn' })
    }
    expect(r.deck.some(c => c.id === s.id)).toBe(true)
  })

  it('Cover resets each turn, unless you have an Accountant; then it carries over and is used up as it blocks', () => {
    for (const accountant of [false, true]) {
      let r = one(newRun(21, 'threeOil'), 'inspector', 0) // Audit, then Fine
      if (accountant) r.items.push('accountant')
      r.cover = 5
      r = act(r, { type: 'endTurn' }) // Audit: nothing to block
      expect(r.cover).toBe(accountant ? 5 : 0)
      const cash = r.capital
      r = act(r, { type: 'endTurn' }) // Fine $3
      if (accountant) { expect(r.cover).toBe(2); expect(cash - r.capital).toBe(debtPerTurn(r)) } // the $3 Fine is blocked; only debt is paid
    }
  })
})

describe('Cover between rounds', () => {
  it('never carries into the next round, even with an Accountant', () => {
    let r = newRun(22, 'threeOil'); r.items.push('accountant'); r.cover = 6
    r.phase = 'shop'; r.round = 1
    r = act(r, { type: 'leaveShop' })
    expect(r.cover).toBe(0)
  })
})

describe('the Strike', () => {
  it('opens with Walkout (−1 AP); Picket costs $2, not AP', () => {
    let r = newRun(23, 'threeOil')
    for (let seed = 1; seed < 200; seed++) { // find a round 2 that draws the Strike
      r = newRun(seed, 'threeOil'); r.phase = 'shop'; r.round = 1
      r = act(r, { type: 'leaveShop' })
      if (r.threats[0].kind === 'strike' && r.modifier !== 'bankSqueeze' && r.modifier !== 'boomtown') break
    }
    const strike = r.threats.find(t => t.kind === 'strike')!
    expect(r.ap).toBe(CONFIG.baseAP - 1) // Walkout
    expect(intent(r, strike)).toBe('Picket')
    expect(intentText(r, strike)).toBe('Lose $2.')
    r.capital = 30; r.cover = 0; r.modifier = null
    const cash = r.capital
    r = act(r, { type: 'endTurn' })
    expect(r.ap).toBe(CONFIG.baseAP) // no AP lost
    expect(cash - r.capital).toBe(2 + debtPerTurn(r))
  })
})

describe('the Blowout', () => {
  it('is immune to Legal', () => { expect(damageFor('Legal', 3, 'blowout')).toBe(0); expect(damageFor('Dirty', 2, 'blowout')).toBe(2) })

  it('Rumble picks your highest stable Well, and only repeats on a shaking one when none are stable', () => {
    let r = newRun(24, 'threeOil'); r.capital = 50
    r.threats = [{ id: 900, kind: 'blowout', hold: 50, maxHold: 50, step: 0, cycle: 0, round3: false, beaten: false }] // next: Rumble
    r.plots = [{ output: 1, reserve: 6 }, { output: 1, reserve: 6 }, { output: 1, reserve: 6, unstable: true }]
    expect(intentText(r, r.threats[0])).toBe('Well No. 2 becomes Unstable.')
    r = act(r, { type: 'endTurn' })
    expect(r.plots.map(w => !!w?.unstable)).toEqual([false, true, true])
    r.plots = [{ output: 1, reserve: 6, unstable: true }]; r.threats[0].step = 0
    expect(intentText(r, r.threats[0])).toBe('Well No. 1 shakes again.')
  })
})

describe('Shore Up limit', () => {
  it('each copy plays once per round, leaves the piles, and comes back next round', () => {
    let r = newRun(25, 'threeOil'); r.capital = 50
    r.threats = [{ id: 900, kind: 'inspector', hold: 50, maxHold: 50, step: 0, cycle: 0, round3: false, beaten: false },
      { id: 901, kind: 'railroad', hold: 50, maxHold: 50, step: 0, cycle: 0, round3: false, beaten: false }]
    const a = r.deck.find(c => c.key === 'shoreUp')!, b = { id: 8700, key: 'shoreUp' as const, uses: null }
    r.deck.push(b); r.hand = [a, b]; r.ap = 2
    r = act(r, { type: 'play', cardId: a.id, target: 900 })
    // a second copy can still be played this round
    expect(canPlay(r, r.hand.find(c => c.id === 8700)!).ok).toBe(true)
    r = act(r, { type: 'play', cardId: 8700, target: 901 })
    const inPiles = (x: Run, id: number) => [...x.hand, ...x.draw, ...x.discard].some(c => c.id === id)
    expect(inPiles(r, a.id)).toBe(false)
    expect(inPiles(r, 8700)).toBe(false)
    // not back after a reshuffle in the same round
    for (let i = 0; i < 4 && r.phase === 'turn' && r.round === 1; i++) {
      r = act(r, { type: 'endTurn' })
      if (r.phase === 'turn' && r.round === 1) { expect(inPiles(r, a.id)).toBe(false); expect(inPiles(r, 8700)).toBe(false) }
    }
    // next round: both are back in the deck's piles
    r.phase = 'shop'; r.round = 1; r = act(r, { type: 'leaveShop' })
    expect(inPiles(r, a.id)).toBe(true)
    expect(inPiles(r, 8700)).toBe(true)
  })
})

describe('quitting a run', () => {
  it("doesn't break or extend the losing streak", () => {
    const rec = (outcome: string): RunRecord => ({ id: outcome + Math.random(), date: '', industry: 'Oil', rounds: 2, outcome, gold: null, completed: false, stageGold: 0 })
    expect(lossStreak([rec('Bankrupt'), rec('Quit'), rec('Bankrupt'), rec('Out of time')])).toBe(3)
    expect(lossStreak([rec('Quit'), rec('Quit')])).toBe(0)
  })
})

describe('The Blowout', () => {
  it('Blow destroys the Well the Rumble shook, and shakes nothing else', () => {
    let r = newRun(26, 'threeOil'); r.capital = 50
    r.threats = [{ id: 901, kind: 'blowout', hold: 3, maxHold: 5, step: 2, cycle: 0, round3: false, beaten: false }] // next: Blow
    r.plots = [{ output: 1, reserve: 6, unstable: true }, { output: 1, reserve: 6 }, { output: 1, reserve: 6, unstable: true }]
    expect(intentText(r, r.threats[0])).toBe('Well No. 3 is destroyed. +2 Hold.')
    r = act(r, { type: 'endTurn' })
    expect(r.plots[2]).toBeNull()
    expect(r.plots.map(w => !!w?.unstable)).toEqual([true, false, false])
    expect(r.threats[0].hold).toBe(5)
  })
  it('Blow with nothing shaking does nothing', () => {
    let r = newRun(27, 'threeOil'); r.capital = 50
    r.threats = [{ id: 902, kind: 'blowout', hold: 5, maxHold: 5, step: 2, cycle: 0, round3: false, beaten: false }]
    r.plots = [{ output: 1, reserve: 6 }, { output: 1, reserve: 6 }]
    r = act(r, { type: 'endTurn' })
    expect(r.plots.filter(Boolean).length).toBe(2)
    expect(r.plots.some(w => w?.unstable)).toBe(false)
  })
})

describe('fire holds the round open', () => {
  const lastHit = (seed: number) => {
    const r = newRun(seed, 'threeOil'); r.capital = 50
    r.threats = [{ id: 950, kind: 'strike', hold: 1, maxHold: 8, step: 0, cycle: 0, round3: false, beaten: false }]
    r.plots = [{ output: 1, reserve: 6 }, { output: 1, reserve: 6 }]
    r.fire = 1
    const hand = r.deck.find(c => c.key === 'hiredHand')!
    r.hand = [hand, ...r.deck.filter(c => c.key === 'bucket').slice(0, 1)]; r.ap = 2
    return { r, hand }
  }
  it('beating the last enemy while a fire burns keeps you in the round', () => {
    const { r, hand } = lastHit(31)
    const after = act(r, { type: 'play', cardId: hand.id })
    expect(after.threats[0].beaten).toBe(true)
    expect(after.phase).toBe('turn')
  })
  it('putting the fire out then ends the round', () => {
    const { r, hand } = lastHit(32)
    let after = act(r, { type: 'play', cardId: hand.id })
    const bucket = after.hand.find(c => c.key === 'bucket')!
    after = act(after, { type: 'play', cardId: bucket.id })
    expect(after.fire).toBe(0)
    expect(after.phase).toBe('roundWon')
  })
  it('a fire left burning keeps doing damage on later turns, then the round ends once it is out', () => {
    const { r, hand } = lastHit(33)
    r.oil = 0
    let after = act(r, { type: 'play', cardId: hand.id })
    after = act(after, { type: 'endTurn' }) // stage 1: the fire takes a Well
    expect(after.plots.filter(Boolean).length).toBe(1)
    expect(after.phase).toBe('turn')
  })
})
