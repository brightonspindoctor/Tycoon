import { describe, expect, it } from 'vitest'
import { act, canPlay, cardDef, incorporate, intentText, netPrice, newRun, production, skimRate, type Card, type Run } from './engine'
import { CONFIG } from './config'
import { CARDS, type CardKey, type ThreatKind } from './data'

/** A run that has just beaten the Baron. */
function afterBaron(seed = 3): Run {
  const r = newRun(seed, 'threeOil')
  r.plots = [{ output: 1, reserve: 2 }, null, { output: 2, reserve: 5, unstable: true }]
  r.phase = 'stageComplete'
  r.round = 4
  r.gold = 3
  return r
}
/** Straight into stage 2, round 1, with a hand you choose. */
function inStage2(hand: CardKey[] = [], threat: ThreatKind = 'muckraker', seed = 3): Run {
  let r = act(afterBaron(seed), { type: 'continue' })
  r = act(r, { type: 'leaveShop' })
  r.threats = [{ id: 900, kind: threat, hold: 40, maxHold: 40, step: 0, cycle: 0, round3: false, beaten: false }]
  r.hand = hand.map((k, i) => ({ id: 5000 + i, key: k, uses: CARDS[k].uses }))
  r.deck.push(...r.hand)
  r.ap = 3
  r.capital = 30
  return r
}
const inHand = (r: Run, k: CardKey) => r.hand.find(c => c.key === k)!

describe('incorporation (stage 1 → 2)', () => {
  it('turns every standing Well into a Field: 1 oil, never runs dry', () => {
    const r = act(afterBaron(), { type: 'continue' })
    expect(r.phase).toBe('incorporate')
    expect(r.stage).toBe(2)
    expect(r.plots[0]).toMatchObject({ field: true, output: 1 })
    expect(r.plots[1]).toBeNull()
    expect(r.plots[2]).toMatchObject({ field: true, output: 1 }) // a 2-oil Well becomes a 1-oil Field
    expect(r.plots[2]!.unstable).toBeFalsy()
  })

  it('wears out your Prospects and gives you a Steel Derrick, a Pay a Dividend and an Expense Account', () => {
    const before = afterBaron()
    const prospects = before.deck.filter(c => c.key === 'prospect').length
    const r = act(before, { type: 'continue' })
    expect(r.deck.filter(c => c.key === 'prospect')).toHaveLength(0)
    expect(r.deck.filter(c => c.key === 'oldProspect')).toHaveLength(prospects)
    for (const k of ['derrick', 'payDividend', 'expenseAccount'] as const) expect(r.deck.filter(c => c.key === k)).toHaveLength(1)
    expect(r.deck.some(c => c.key === 'survey')).toBe(false)
  })

  it('offers a 10K loan that adds 1K a turn to Bank Debt, once', () => {
    let r = act(afterBaron(), { type: 'continue' })
    const cap = r.capital, debt = r.debt
    r = act(r, { type: 'takeLoan' })
    r = act(r, { type: 'takeLoan' })
    expect(r.capital).toBe(cap + CONFIG.stage2Loan)
    expect(r.debt).toBe(debt + CONFIG.stage2LoanDebt)
  })

  it('lets you upgrade and destroy cards before stage 2 starts', () => {
    let r = act(afterBaron(), { type: 'continue' })
    r.capital = 40
    const lawyer = r.deck.find(c => c.key === 'lawyerUp')!
    r = act(r, { type: 'upgradeCard', cardId: lawyer.id })
    const up = r.deck.find(c => c.id === lawyer.id)!
    expect(up.up).toBe(true)
    expect(cardDef(up).power).toBe(5)
    expect(cardDef(up).name).toBe('Lawyer Up+')
    r = act(r, { type: 'upgradeCard', cardId: lawyer.id }) // only once
    expect(r.capital).toBe(40 - CONFIG.upgradeCost)
    const bucket = r.deck.find(c => c.key === 'bucket')!
    r = act(r, { type: 'destroyCard', cardId: bucket.id })
    expect(r.deck.some(c => c.id === bucket.id)).toBe(false)
    r = act(r, { type: 'leaveShop' })
    expect(r.phase).toBe('turn')
    expect(r.round).toBe(1)
  })

  it('starts Board Exposure from what you skimmed in stage 1, capped', () => {
    const a = afterBaron(); a.stats.skims = 7
    expect(act(a, { type: 'continue' }).exposure).toBe(2)
    const b = afterBaron(); b.stats.skims = 40
    expect(act(b, { type: 'continue' }).exposure).toBe(CONFIG.exposureStartCap)
  })

  it('pays 3 gold for beating the Baron', () => {
    let r = newRun(4, 'threeOil')
    r.round = 4
    r.threats = [{ id: 901, kind: 'baron', hold: 1, maxHold: 20, step: 0, cycle: 0, round3: false, beaten: false }]
    const lawyer: Card = { id: 7000, key: 'lawyerUp', uses: null }
    r.hand = [lawyer]; r.deck.push(lawyer); r.ap = 2; r.capital = 20
    const gold = r.gold
    r = act(r, { type: 'play', cardId: lawyer.id })
    expect(r.phase).toBe('stageComplete')
    expect(r.gold).toBe(gold + CONFIG.bossGold)
  })
})

describe('stage 2 economy', () => {
  it('Fields pump for ever; new Wells still run dry', () => {
    let r = inStage2([])
    r.plots = [{ output: 1, reserve: 1, field: true }, { output: 1, reserve: 1 }]
    r.oil = 0; r.storage = 10
    r = act(r, { type: 'endTurn' })
    r = act(r, { type: 'endTurn' })
    expect(r.plots[0]).toMatchObject({ field: true })
    expect(r.plots[1]).toBeNull()
  })

  it('stage 2 Wells claim their own plot, pump 1 and never run dry, old Well cards included', () => {
    let r = inStage2(['derrick', 'wildcat', 'oldProspect'])
    r.plots = [{ output: 1, reserve: 3, field: true }]
    r.ap = 5; r.storage = 20; r.oil = 0
    r = act(r, { type: 'play', cardId: inHand(r, 'derrick').id })
    r = act(r, { type: 'play', cardId: inHand(r, 'wildcat').id })
    expect(r.plots).toHaveLength(3)
    expect(r.plots.slice(1).every(w => w?.lasting && w.output === 1)).toBe(true)
    r = act(r, { type: 'play', cardId: inHand(r, 'oldProspect').id }) // a worn Prospect still gives a Well card
    expect(r.hand.filter(c => c.key === 'well')).toHaveLength(1)
  })

  it('Wells need room: 5 working plots is the most', () => {
    const r = inStage2(['derrick'])
    r.plots = Array.from({ length: 5 }, () => ({ output: 1, reserve: 0, lasting: true }))
    expect(canPlay(r, inHand(r, 'derrick')).ok).toBe(false)
  })

  it('oil sells for more in stage 2, and skimming costs more', () => {
    const r = inStage2([])
    expect(netPrice(r)).toBe(CONFIG.oilPrice2)
    expect(skimRate(r)).toBe(CONFIG.skimRate2[1])
  })

  it('a Rotary Rig (no longer sold) still turns a Well into a Field', () => {
    let r = inStage2(['rotaryRig'])
    r.plots = [{ output: 1, reserve: 2 }, { output: 2, reserve: 1 }]
    r = act(r, { type: 'play', cardId: inHand(r, 'rotaryRig').id })
    expect(r.plots[1]!.field).toBe(true)
    expect(r.plots[0]!.field).toBeFalsy()
  })
})

describe('Board Exposure', () => {
  it('skimming is a card from stage 2: from $4 a gold, +1 Exposure each time', () => {
    let r = inStage2(['expenseAccount'])
    const cap = r.capital, gold = r.gold
    expect(skimRate(r)).toBe(4)
    r = act(r, { type: 'play', cardId: inHand(r, 'expenseAccount').id })
    expect(r.gold).toBe(gold + 1)
    expect(r.capital).toBe(cap - 4)
    expect(r.exposure).toBe(1)
    r.phase = 'shop'
    const g = r.gold
    r = act(r, { type: 'skim', gold: 1 }) // no side-door skim in the Exchange
    expect(r.gold).toBe(g)
  })

  it('dividends bring it down: the shop for −2, the card for −1', () => {
    let r = inStage2(['payDividend'])
    r.exposure = 4
    r = act(r, { type: 'play', cardId: inHand(r, 'payDividend').id })
    expect(r.exposure).toBe(3)
    r.phase = 'shop'; r.shop.dividendPaid = false
    r = act(r, { type: 'payDividends' })
    expect(r.exposure).toBe(1)
    r = act(r, { type: 'payDividends' }) // once a visit
    expect(r.exposure).toBe(1)
  })

  it('reaching 8 ousts you', () => {
    let r = inStage2([], 'proxyFight')
    r.exposure = 7
    r.threats[0].step = 2 // The Vote
    r = act(r, { type: 'endTurn' })
    expect(r.phase).toBe('lost')
    expect(r.loss?.reason).toBe('ousted')
  })

  it('Shred the Files and Industrial Espionage raise it', () => {
    let r = inStage2(['shredFiles', 'looseThread', 'espionage'], 'combine')
    r = act(r, { type: 'play', cardId: inHand(r, 'shredFiles').id, target: inHand(r, 'looseThread').id })
    expect(r.hand.some(c => c.key === 'looseThread')).toBe(false)
    expect(r.deck.some(c => c.key === 'looseThread')).toBe(false)
    expect(r.exposure).toBe(1)
    r = act(r, { type: 'play', cardId: inHand(r, 'espionage').id })
    expect(r.exposure).toBe(2)
  })

  it('a good quarter lowers it, a bad one raises it', () => {
    let r = inStage2(['lawyerUp'], 'muckraker')
    r.exposure = 3; r.turn = 6 // too slow for a quick win
    r.threats[0].hold = 1
    r.roundStart.capital = 10 // the company ends the round with more
    r = act(r, { type: 'play', cardId: inHand(r, 'lawyerUp').id })
    expect(r.phase).toBe('roundWon')
    expect(r.exposure).toBe(1) // Retraction −1, good quarter −1
  })

  it('winning a fight within 3 turns lowers it by 2, the boss included', () => {
    for (const [turn, drop] of [[3, 2], [4, 0]] as const) {
      let r = inStage2(['lawyerUp'], 'combine')
      r.exposure = 5; r.turn = turn
      r.threats[0].hold = 1
      r.roundStart.capital = r.capital - 2 // Lawyer Up's $2: no quarter effect
      r = act(r, { type: 'play', cardId: inHand(r, 'lawyerUp').id })
      expect(r.exposure).toBe(5 - drop)
    }
    let b = inStage2(['lawyerUp'], 'proxyFight')
    b.round = 4; b.exposure = 4; b.turn = 2; b.threats[0].hold = 1
    b = act(b, { type: 'play', cardId: inHand(b, 'lawyerUp').id })
    expect(b.phase).toBe('stageComplete')
    expect(b.exposure).toBe(2)
  })

  it('is high from 5', () => {
    const r = inStage2([], 'clawback')
    r.exposure = 4; r.threats[0].step = 0
    expect(intentText(r, r.threats[0])).toMatch(/Lose \$4/)
    r.exposure = 5
    expect(intentText(r, r.threats[0])).toMatch(/takes 2 gold/)
  })
})

describe('your own fortune', () => {
  it("the Muckraker's first move is not the gold one, and Expose takes 1 gold", () => {
    let r = inStage2([], 'muckraker')
    r.gold = 3
    r = act(r, { type: 'endTurn' }) // Dig
    expect(r.gold).toBe(3)
    expect(r.exposure).toBe(1)
    r = act(r, { type: 'endTurn' }) // Expose
    expect(r.gold).toBe(2)
  })

  it('below 0 gold you are ruined', () => {
    let r = inStage2([], 'muckraker')
    r.gold = 0; r.threats[0].step = 1
    r = act(r, { type: 'endTurn' })
    expect(r.phase).toBe('lost')
    expect(r.loss?.reason).toBe('ruined')
  })

  it('a Personal Lawyer blocks the next gold taken this turn', () => {
    let r = inStage2(['personalLawyer'], 'muckraker')
    r.gold = 0; r.threats[0].step = 1
    r = act(r, { type: 'play', cardId: inHand(r, 'personalLawyer').id })
    r = act(r, { type: 'endTurn' })
    expect(r.phase).toBe('turn')
    expect(r.gold).toBe(0)
  })
})

describe('stage 2 enemies', () => {
  it('the Saboteur wrecks the marked Field', () => {
    let r = inStage2([], 'saboteur')
    r.plots = [{ output: 1, reserve: 9, field: true }, { output: 1, reserve: 0, lasting: true }]
    r.marked = 0
    r = act(r, { type: 'endTurn' }) // Wreck
    expect(r.plots[0]).toBeNull()
    expect(r.plots[1]).toBeTruthy()
  })

  it("the Railroad Commission's Proration caps next turn's pumping", () => {
    let r = inStage2([], 'commission')
    r.plots = [{ output: 2, reserve: 9, field: true }, { output: 2, reserve: 9, field: true }]
    r.storage = 20; r.oil = 0
    r = act(r, { type: 'endTurn' })
    expect(r.oil).toBe(CONFIG.prorationCap)
    expect(production(r)).toBe(CONFIG.prorationCap)
  })

  it('the Patent Holder sends a Cease and Desist you must play', () => {
    let r = inStage2(['lawyerUp'], 'patentHolder')
    r = act(r, { type: 'endTurn' })
    const letter = r.hand.find(c => c.key === 'ceaseDesist')!
    expect(letter).toBeTruthy()
    expect(canPlay(r, r.hand.find(c => c.key !== 'ceaseDesist' && !CARDS[c.key].forced)!).ok).toBe(false)
  })

  it('destroy cards can be played on a Must play card', () => {
    let r = inStage2(['streamline', 'ceaseDesist'], 'patentHolder')
    r.hand[1].temp = true
    expect(canPlay(r, inHand(r, 'streamline')).ok).toBe(true)
    r = act(r, { type: 'play', cardId: inHand(r, 'streamline').id, target: inHand(r, 'ceaseDesist').id })
    expect(r.hand.some(c => c.key === 'ceaseDesist')).toBe(false)
  })

  it('the Proxy Fight is the stage 2 boss and opens by canvassing the board', () => {
    let r = act(afterBaron(), { type: 'continue' })
    r = act(r, { type: 'leaveShop' })
    r.phase = 'shop'; r.round = 3
    r = act(r, { type: 'leaveShop' })
    expect(r.threats[0].kind).toBe('proxyFight')
    expect(r.exposure).toBeGreaterThanOrEqual(1)
  })
})

describe('the end of stage 2', () => {
  it('leaves a residue item from Board Exposure', () => {
    for (const [exp, item] of [[6, 'boardGrudge'], [1, 'loyalDirectors'], [3, null]] as const) {
      let r = inStage2(['lawyerUp'], 'proxyFight')
      r.round = 4; r.exposure = exp; r.threats[0].hold = 1; r.turn = 9 // too slow for a quick win
      r = act(r, { type: 'play', cardId: inHand(r, 'lawyerUp').id })
      expect(r.phase).toBe('stageComplete')
      expect(r.residue).toBe(item)
    }
  })
})

void incorporate

describe('the Exchange', () => {
  it('sells only stage 2 cards', () => {
    for (let seed = 1; seed < 40; seed++) {
      let r = inStage2(['lawyerUp'], 'muckraker', seed)
      r.threats[0].hold = 1
      r = act(r, { type: 'play', cardId: inHand(r, 'lawyerUp').id })
      expect(CARDS[r.spoils!].era).toBe(2)
      r = act(act(r, { type: 'sellSpoils' }), { type: 'continue' })
      for (const k of r.shop.cards) expect(CARDS[k!].era).toBe(2)
    }
  })
})

describe('fire in stage 2', () => {
  it('burns oil and stops the pumps, but never touches Wells or Fields', () => {
    let r = inStage2([], 'combine')
    r.plots = [{ output: 1, reserve: 0, field: true }, { output: 1, reserve: 0, lasting: true }]
    r.fire = 2; r.oil = 1; r.storage = 10
    r = act(r, { type: 'endTurn' })
    expect(r.oil).toBe(0)
    expect(r.plots.filter(Boolean)).toHaveLength(2)
    r = act(r, { type: 'endTurn' }) // nothing left to burn: a fire dies down
    expect(r.plots.filter(Boolean)).toHaveLength(2)
    expect(r.fire).toBeLessThan(2)
  })
})

describe('the Exchange Silo', () => {
  it('adds 2 storage, once a visit', () => {
    let r = inStage2([])
    r.phase = 'shop'; r.shop.siloSold = false; r.capital = 30
    const st = r.storage
    r = act(r, { type: 'buySilo' })
    r = act(r, { type: 'buySilo' })
    expect(r.storage).toBe(st + 2)
  })
})
