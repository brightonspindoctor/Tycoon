import { describe, expect, it } from 'vitest'
import { PHARMA as C } from '../config'
import { PSTARTER, PTHREATS } from './data'
import { allCards, newPharmaRun, pact, researchCost, type PRun } from './engine'
import { pharmaBot } from '../../../tools/pharma-bot'

const fresh = (seed = 7) => newPharmaRun(seed)
/** A run with a given hand, against one liability, for testing a rule on its own. */
function setUp(hand: PRun['hand'][number]['key'][], threat: keyof typeof PTHREATS = 'reporter'): PRun {
  const r = fresh()
  r.hand = hand.map(k => ({ id: r.nextId++, key: k, ...(k === 'salesman' ? { uses: 3 } : {}), ...(['snakeOil', 'cocaineTonic', 'soothingSyrup', 'heroinSyrup', 'vegetableCompound'].includes(k) ? { age: 0 } : {}) }))
  r.draw = []; r.discard = []
  r.threats = [{ id: r.nextId++, kind: threat, hold: PTHREATS[threat].hold, maxHold: PTHREATS[threat].hold, step: 0, beaten: false }]
  return r
}

describe('Pharmaceutical stage 1', () => {
  it('starts with 8 cards, 1 factory, $15 and Trust 0', () => {
    const r = fresh()
    expect(allCards(r).length).toBe(PSTARTER.length)
    expect(PSTARTER.length).toBe(8)
    expect(r.factories).toEqual([null])
    expect(r.capital).toBe(15)
    expect(r.trust).toBe(0)
    expect(r.hand.length).toBe(5)
  })

  it('Research costs Capital, gives a remedy, and is once a turn', () => {
    let r = fresh()
    const cost = researchCost(r)
    r = pact(r, { type: 'research' })
    expect(r.capital).toBe(15 - cost)
    expect(r.hand.length).toBe(6)
    r = pact(r, { type: 'research' })
    expect(r.hand.length).toBe(6)
  })

  it('Research is dearer at low Trust and cheaper at high Trust', () => {
    const r = fresh()
    r.trust = -4; expect(researchCost(r)).toBe(C.research.low)
    r.trust = 0; expect(researchCost(r)).toBe(C.research.mid)
    r.trust = 4; expect(researchCost(r)).toBe(C.research.high)
  })

  it('Produce puts a remedy live, and it pays more each turn until it expires into a Generic', () => {
    let r = setUp(['produce', 'snakeOil'])
    const produce = r.hand[0].id, oil = r.hand[1].id
    r = pact(r, { type: 'play', cardId: produce, target: oil })
    expect(r.factories[0]?.key).toBe('snakeOil')
    const paid: number[] = []
    for (let i = 0; i < 4; i++) { const before = r.capital; r.threats[0].step = 0; r.trust = 0; r = pact(r, { type: 'endTurn' }); paid.push(r.capital - before) }
    // the Reporter only takes Trust, so every change in Capital is the remedy
    expect(paid).toEqual([1, 2, 2, 3])
    expect(r.factories[0]).toBeNull()
    expect(allCards(r).some(c => c.key === 'generic')).toBe(true)
  })

  it('a remedy goes stale even if it is never produced', () => {
    let r = setUp(['cocaineTonic'])
    for (let i = 0; i < 3; i++) { r.trust = 0; r = pact(r, { type: 'endTurn' }) }
    expect(allCards(r).some(c => c.key === 'cocaineTonic')).toBe(false)
    expect(allCards(r).some(c => c.key === 'generic')).toBe(true)
  })

  it('an NDA cancels only the first hit of a multi-hit move', () => {
    let r = setUp(['nda'], 'temperance') // Sermon: 2× −1 Trust
    r = pact(r, { type: 'play', cardId: r.hand[0].id })
    r = pact(r, { type: 'endTurn' })
    expect(r.trust).toBe(-1)
    expect(r.capital).toBe(14) // an NDA costs $1
  })

  it('weakness doubles damage, resistance halves it', () => {
    let r = setUp(['salesman', 'kickback'], 'temperance') // resists Dirty
    r = pact(r, { type: 'play', cardId: r.hand[0].id })
    expect(r.threats[0].hold).toBe(10 - 1)
    r = setUp(['expertWitness'], 'temperance') // weak to Legal
    r = pact(r, { type: 'play', cardId: r.hand[0].id })
    expect(r.threats[0].hold).toBe(10 - 8)
    expect(r.capital).toBe(14)
  })

  it('a Travelling Salesman is gone after 3 uses', () => {
    let r = setUp(['salesman'], 'fraud')
    const id = r.hand[0].id
    for (let i = 0; i < 3; i++) {
      const c = allCards(r).find(x => x.id === id)!
      r.hand = [c]; r.draw = r.draw.filter(x => x.id !== id); r.discard = r.discard.filter(x => x.id !== id); r.ap = 2
      r = pact(r, { type: 'play', cardId: id })
    }
    expect(allCards(r).some(c => c.id === id)).toBe(false)
  })

  it('a liability with several hits plays them all; Trust at −6 is Disgraced', () => {
    let r = setUp([], 'temperance')
    r.trust = -4
    r = pact(r, { type: 'endTurn' })
    expect(r.phase).toBe('lost')
    expect(r.loss?.reason).toBe('disgraced')
  })

  it('negative Trust is allowed', () => {
    let r = setUp([], 'reporter')
    r.trust = -4
    r = pact(r, { type: 'endTurn' })
    expect(r.trust).toBe(-5)
    expect(r.phase).toBe('turn')
  })

  it('settling a case costs 1 AP as well as Capital', () => {
    let r = setUp([], 'customer')
    r.cases = [{ id: 999, remedy: 'soothingSyrup', step: 0 }]
    r.ap = 0
    r = pact(r, { type: 'settle', caseId: 999 })
    expect(r.cases.length).toBe(1)
    r.ap = 2
    r = pact(r, { type: 'settle', caseId: 999 })
    expect(r.cases.length).toBe(0)
    expect(r.ap).toBe(2 - C.settleAP)
    expect(r.capital).toBe(15 - C.settle[0])
  })

  it('the Class Action opens a Patient Case and brings a Claimant every 3rd turn', () => {
    let r = setUp(['produce', 'snakeOil'])
    r = pact(r, { type: 'play', cardId: r.hand[0].id, target: r.hand[1].id })
    r.threats = []
    r.events = []
    // bring it in the way a round does
    r = pact({ ...r, phase: 'shop', round: 2 }, { type: 'leaveShop' })
    while (!r.threats.some(t => t.kind === 'classAction')) {
      r = pact({ ...r, phase: 'shop', round: 2, cases: [] }, { type: 'leaveShop' })
    }
    expect(r.cases.length).toBe(1)
    const claimants = () => r.threats.filter(t => t.kind === 'claimant').length
    for (let i = 0; i < 2; i++) { r.trust = 0; r.capital = 50; r = pact(r, { type: 'endTurn' }) }
    expect(claimants()).toBe(0)
    r.trust = 0; r.capital = 50; r = pact(r, { type: 'endTurn' })
    expect(claimants()).toBe(1)
  })

  it('Patient Cases worsen each turn and a death costs Capital and Trust', () => {
    let r = setUp([], 'customer')
    r.cases = [{ id: 999, remedy: 'soothingSyrup', step: 1 }]
    r = pact(r, { type: 'endTurn' }) // → Critical
    expect(r.trust).toBe(-C.criticalTrust)
    const before = r.capital
    r = pact(r, { type: 'endTurn' }) // → Death
    expect(r.cases.length).toBe(0)
    expect(r.trust).toBe(-C.criticalTrust - C.deathTrust)
    expect(before - r.capital).toBe(C.deathCapital + 2) // and the Customer's $2
  })

  it('beating every liability wins the round, and the shop sells factories at rising prices', () => {
    let r = setUp(['kickback'], 'customer')
    r = pact(r, { type: 'play', cardId: r.hand[0].id })
    expect(r.phase).toBe('roundWon')
    r = pact(r, { type: 'spoils', key: null })
    expect(r.phase).toBe('shop')
    r.capital = 100
    r = pact(r, { type: 'buyFactory' }); r = pact(r, { type: 'buyFactory' })
    expect(r.factories.length).toBe(3)
    expect(r.capital).toBe(100 - C.factoryPrices[0] - C.factoryPrices[1])
  })

  it('the bot can play whole runs without the engine getting stuck', () => {
    for (let s = 1; s <= 200; s++) {
      const r = pharmaBot(newPharmaRun(s))
      expect(['won', 'lost']).toContain(r.phase)
      expect(r.factories.length).toBeLessThanOrEqual(C.maxFactories)
    }
  })
})
