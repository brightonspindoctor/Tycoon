import { describe, expect, it } from 'vitest'
import { act, canPlay, damageFor, debtPerTurn, intentText, price, production, type Card, type Run, type Threat } from './engine'
import { adminStart, ADMIN_DEFAULTS } from './admin'
import { CONFIG } from './config'
import { CARDS, INCORPORATE_OFFER_4, STAGE4_POOL, type CardKey, type ThreatKind } from './data'

/** On the first Big Oil screen: the pick, then the clear-out, still to do. */
const bigOil = (seed = 7, extra: Partial<typeof ADMIN_DEFAULTS> = {}) => adminStart(seed, { ...ADMIN_DEFAULTS, stage: 4, start: 'incorporate', wells: 2, capital: 60, gold: 6, deck: 'starter', ...extra })

/** Stage 4, round `round`, against one enemy you choose, with a hand you choose. */
function inStage4(hand: CardKey[] = [], kind: ThreatKind = 'fracking', round = 1): Run {
  const r = adminStart(11, { ...ADMIN_DEFAULTS, stage: 4, start: round as 1, wells: 2, capital: 80, gold: 6, deck: 'starter' })
  r.threats = [{ id: 900, kind, hold: 30, maxHold: 30, step: 0, cycle: 0, round3: false, beaten: false, ...(kind === 'truth' ? { phase: 0, entryHour: r.clock, baseCover: 0 } : {}) }]
  r.hand = hand.map((k, i) => ({ id: 5000 + i, key: k, uses: CARDS[k].uses }))
  r.deck.push(...r.hand)
  r.ap = 4
  r.cover = 0
  return r
}
const inHand = (r: Run, k: CardKey) => r.hand.find(c => c.key === k)!
const playIt = (r: Run, k: CardKey, target = 900) => act(r, { type: 'play', cardId: inHand(r, k).id, target })
/** Ends turns until the enemy has made `n` moves (Cover zeroed so nothing is blocked). */
function moves(r: Run, n: number): Run {
  for (let i = 0; i < n && r.phase === 'turn'; i++) { r.capital = 500; r.gold = 50; r = act(r, { type: 'endTurn' }) }
  return r
}

describe('becoming Big Oil (stage 3 → 4)', () => {
  it('starts the clock at 1, pays off old loans, clears Heat and offers one card of each damage type', () => {
    const r = bigOil()
    expect(r.stage).toBe(4)
    expect(r.phase).toBe('incorporate')
    expect(r.clock).toBe(1)
    expect(r.debt).toBe(0)
    expect(r.heat).toBe(0)
    expect(r.offer?.map(k => CARDS[k].family).sort()).toEqual(['Bury', 'Dirty', 'Legal', 'Lobby'])
  })

  it('On File starts the clock an hour later', () => {
    const r = adminStart(3, { ...ADMIN_DEFAULTS, stage: 3, start: 'incorporate', capital: 40 })
    r.items.push('regulators'); r.phase = 'stageComplete'; r.round = 4
    expect(act(r, { type: 'continue' }).clock).toBe(2)
  })

  it('the World Bank lends $30 at $2 a turn and adds a Green Project', () => {
    const r = act(bigOil(), { type: 'takeLoan' })
    expect(r.capital).toBe(60 + CONFIG.worldBankLoan)
    expect(r.debt).toBe(CONFIG.worldBankDebt)
    expect(r.deck.filter(c => c.key === 'greenProject')).toHaveLength(1)
    expect(act(r, { type: 'takeLoan' }).capital).toBe(r.capital) // once
  })

  it('in three steps: pick two cards, then clear out up to three for free, then the shop', () => {
    let r = bigOil()
    expect(r.bigOilStep).toBe('pick')
    const n0 = r.deck.length
    r = act(r, { type: 'destroyCard', cardId: r.deck[0].id })
    expect(r.deck.length).toBe(n0) // no destroying while picking
    r = act(r, { type: 'leaveShop' })
    expect(r.bigOilStep).toBe('pick') // not until two are picked
    r = act(act(r, { type: 'pickCard', key: r.offer![0] }), { type: 'pickCard', key: r.offer![1] })
    r = act(r, { type: 'leaveShop' })
    expect(r.bigOilStep).toBe('clear')
    expect(r.deck.length).toBe(n0 + 2)
    const cash = r.capital
    for (let i = 0; i < 4; i++) r = act(r, { type: 'destroyCard', cardId: r.deck[0].id })
    expect(r.deck.length).toBe(n0 + 2 - 3) // three free, and no fourth
    expect(r.capital).toBe(cash)
    expect(act(r, { type: 'takeLoan' }).capital).toBe(cash) // the World Bank was on the first step
    r = act(r, { type: 'leaveShop' })
    expect(r.phase).toBe('shop')
    expect(r.round).toBe(0)
    expect(r.shop.cards.filter(k => k && INCORPORATE_OFFER_4.includes(k))).toHaveLength(2) // the two not picked are on sale
    r = act(r, { type: 'leaveShop' })
    expect(r.phase).toBe('turn')
    expect(r.round).toBe(1)
  })
})

describe('stage 4 rounds', () => {
  it('four different enemies, one at a time, then the Truth in round 5', () => {
    let r = adminStart(21, { ...ADMIN_DEFAULTS, stage: 4, start: 1, capital: 900, gold: 20, deck: 'strong' })
    const seen: ThreatKind[] = []
    for (let round = 1; round <= 5; round++) {
      expect(r.round).toBe(round)
      expect(r.threats).toHaveLength(1)
      seen.push(r.threats[0].kind)
      r = act(r, { type: 'admin', op: 'winRound' })
      if (round < 5) { r = act(act(r, { type: 'sellSpoils' }), { type: 'continue' }); r = act(r, { type: 'leaveShop' }) }
    }
    expect(new Set(seen.slice(0, 4)).size).toBe(4)
    expect(seen.slice(0, 4).every(k => STAGE4_POOL.includes(k))).toBe(true)
    expect(seen[4]).toBe('truth')
  })

  it('later enemies are tougher', () => {
    let r = adminStart(21, { ...ADMIN_DEFAULTS, stage: 4, start: 1, capital: 900, deck: 'strong' })
    const first = r.threats[0].maxHold - 0
    r = act(r, { type: 'admin', op: 'winRound' }); r = act(act(r, { type: 'sellSpoils' }), { type: 'continue' }); r = act(r, { type: 'leaveShop' })
    expect(r.threats[0].maxHold).toBeGreaterThanOrEqual(first - 6 + CONFIG.stage4HoldStep)
  })

  it('oil sells at $6, Bank Debt is the World Bank\'s, and there is no Heat', () => {
    const r = inStage4([], 'greenPoliticians')
    expect(price(r)).toBe(CONFIG.oilPrice4)
    expect(debtPerTurn(r)).toBe(r.debt)
    expect(r.heat).toBe(0)
  })
})

describe('the Truth clock', () => {
  it('every enemy\'s 2nd and 5th moves move it on an hour', () => {
    let r = inStage4([], 'greenPoliticians')
    const start = r.clock!
    r = moves(r, 1); expect(r.clock).toBe(start)
    r = moves(r, 1); expect(r.clock).toBe(start + 1)
    r = moves(r, 2); expect(r.clock).toBe(start + 1)
    r = moves(r, 1); expect(r.clock).toBe(start + 2)
    r = moves(r, 2); expect(r.clock).toBe(start + 3) // the 7th move is the next cycle's 2nd
  })

  it('a stopped move does not move it', () => {
    let r = inStage4(['shoreUp'], 'greenPoliticians')
    r = moves(r, 1)
    r.hand.push({ id: 7777, key: 'shoreUp', uses: null }); r.deck.push(r.hand[r.hand.length - 1]); r.ap = 2
    r = act(r, { type: 'play', cardId: 7777, target: 900 })
    const before = r.clock
    r = moves(r, 1)
    expect(r.clock).toBe(before)
  })

  it('midnight loses the run', () => {
    let r = inStage4([], 'greenPoliticians')
    r.clock = 11
    r = moves(r, 2)
    expect(r.phase).toBe('lost')
    expect(r.loss?.reason).toBe('midnight')
  })

  it('Carbon Offsets winds it back an hour, but 1 in 4 times the forest burns down and it goes on', () => {
    let back = 0, on = 0
    for (let seed = 1; seed <= 400; seed++) {
      const r = inStage4(['carbonOffsets'])
      r.clock = 6; r.rng = seed
      const after = playIt(r, 'carbonOffsets')
      if (after.clock === 5) back++; else if (after.clock === 7) on++
    }
    expect(back + on).toBe(400)
    expect(on / 400).toBeGreaterThan(0.17)
    expect(on / 400).toBeLessThan(0.33)
  })

  it('Carbon Capture stops the next move that would move the clock on', () => {
    let r = inStage4(['carbonCapture'], 'greenPoliticians')
    r = playIt(r, 'carbonCapture')
    expect(r.captured).toBe(true)
    const start = r.clock
    r = moves(r, 2) // the 2nd move would move it on
    expect(r.clock).toBe(start)
    expect(r.captured).toBe(false)
    r = moves(r, 3) // the 5th does
    expect(r.clock).toBe(start! + 1)
  })
})

describe('stage 4 enemies', () => {
  it('Fracking\'s Tremors leave you 1 AP', () => {
    let r = inStage4([], 'fracking')
    r = moves(r, 3) // Cheap Gas, Earthquake Swarm, Tremors
    expect(r.ap).toBe(1)
  })

  it('Green Alternatives heals itself', () => {
    let r = inStage4([], 'greenAlternatives')
    r.threats[0].hold = 20
    r = moves(r, 1)
    expect(r.threats[0].hold).toBe(20 + CONFIG.subsidies)
  })

  it('Deepwater Disaster has Cover, and more after Containment Fails', () => {
    let r = inStage4([], 'deepwaterDisaster')
    r = moves(r, 1)
    expect(r.threats[0].cover).toBe(4)
    r = moves(r, 2)
    expect(r.threats[0].cover).toBe(CONFIG.containment)
  })

  it('the Spilled Tanker puts Compensation Claims in your hand', () => {
    let r = inStage4([], 'spilledTanker')
    r = moves(r, 1)
    expect(r.hand.filter(c => c.key === 'compensationClaim')).toHaveLength(1)
    expect(canPlay(r, r.hand.find(c => c.key !== 'compensationClaim' && CARDS[c.key].ap !== null) ?? r.hand[0]).ok).toBe(r.hand.every(c => c.key === 'compensationClaim'))
  })

  it('Green Politicians take gold and cap your cards with a Subpoena', () => {
    let r = inStage4([], 'greenPoliticians')
    r.gold = 10; r.capital = 500
    r = act(r, { type: 'endTurn' })
    expect(r.gold).toBe(10 - CONFIG.windfallGold)
    r = moves(r, 2) // Hearings, Subpoena
    expect(r.current.cardCap).toBe(CONFIG.subpoenaCards)
    const cheap: Card[] = Array.from({ length: 4 }, (_, i) => ({ id: 6000 + i, key: 'bridgeFuel' as CardKey, uses: null }))
    r.hand = cheap; r.played = 3
    expect(canPlay(r, cheap[0]).ok).toBe(false)
  })

  it('War: one barrel a turn, but oil sells for $10', () => {
    const r = inStage4([], 'war')
    r.plots = [{ output: 2, reserve: 0, rig: true }, { output: 2, reserve: 0, rig: true }]
    expect(production(r)).toBe(CONFIG.warOutput)
    expect(price(r)).toBe(CONFIG.warPrice)
    r.threats[0].beaten = true
    expect(production(r)).toBe(4)
    expect(price(r)).toBe(CONFIG.oilPrice4)
  })
})

describe('the Truth', () => {
  it('fights in four 25-Hold phases, each weak to one type, taking every other type normally', () => {
    const r = inStage4(['propaganda'], 'truth', 5)
    const t: Threat = { ...r.threats[0], hold: 25, maxHold: 25 }
    expect(damageFor('Dirty', 10, 'truth', 0)).toBe(20)
    expect(damageFor('Lobby', 10, 'truth', 0)).toBe(10)
    expect(damageFor('Legal', 10, 'truth', 1)).toBe(20)
    expect(damageFor('Bury', 10, 'truth', 2)).toBe(20)
    expect(damageFor('Lobby', 10, 'truth', 3)).toBe(20)
    expect(t.phase).toBe(0)
  })

  it('moves to its next phase instead of falling, and only falls in the last', () => {
    let r = inStage4(['climateBreakdown', 'climateBreakdown', 'climateBreakdown'], 'truth', 5)
    r.threats[0].hold = 5; r.threats[0].maxHold = 25
    r = act(r, { type: 'play', cardId: r.hand[0].id, target: 900 })
    expect(r.threats[0].phase).toBe(1)
    expect(r.threats[0].hold).toBe(CONFIG.truthPhaseHold)
    expect(r.threats[0].beaten).toBe(false)
    r.threats[0].phase = 3; r.threats[0].hold = 5
    r = act(r, { type: 'play', cardId: r.hand[0].id, target: 900 })
    expect(r.phase).toBe('stageComplete')
  })

  it('moves the clock on with every 5th move it makes', () => {
    let r = inStage4([], 'truth', 5)
    const start = r.clock!
    r = moves(r, 4); expect(r.clock).toBe(start)
    r = moves(r, 1); expect(r.clock).toBe(start + 1)
    expect(intentText({ ...r, threats: r.threats }, { ...r.threats[0], step: 9 })).toContain('clock')
  })

  it('hits harder the later the hour you arrive', () => {
    const early = inStage4([], 'truth', 5); early.threats[0].entryHour = 2
    const late = inStage4([], 'truth', 5); late.threats[0].entryHour = 9
    const cost = (r: Run) => { r.capital = 500; const after = act(r, { type: 'endTurn' }); return 500 - after.capital }
    expect(cost(late) - cost(early)).toBe(7 * CONFIG.truthPerHour)
  })

  it('winning ends the game: your gold is the score', () => {
    let r = inStage4([], 'truth', 5)
    r.threats[0].phase = 3
    const gold = r.gold
    r = act(r, { type: 'admin', op: 'winRound' })
    expect(r.phase).toBe('stageComplete')
    expect(r.gold).toBe(gold + CONFIG.bossGold)
    expect(act(r, { type: 'continue' }).stage).toBe(4) // nowhere further to go
  })
})

describe('stage 4 cards', () => {
  it('Influencers doubles the next card\'s Hold damage or Cover, costing $3 each play', () => {
    let r = inStage4(['influencers', 'sustainabilityReport', 'astroturfing'], 'fracking')
    const cash = r.capital
    r = playIt(r, 'influencers')
    expect(r.capital).toBe(cash - 3)
    const hold = r.threats[0].hold
    r = playIt(r, 'sustainabilityReport')
    expect(hold - r.threats[0].hold).toBe(18) // Bury 9, doubled (Fracking neither weak to nor resists it)
    r = playIt(r, 'astroturfing')
    expect(r.cover).toBe(4) // only the next card
  })

  it('Influencers is never offered again once yours, and can\'t be duplicated or cleared out', () => {
    let r = bigOil()
    r = act(act(r, { type: 'pickCard', key: r.offer![0] }), { type: 'pickCard', key: r.offer![1] })
    r = act(r, { type: 'leaveShop' })
    r.deck.push({ id: 9999, key: 'influencers', uses: null })
    expect(act(r, { type: 'destroyCard', cardId: 9999 }).freeDestroys).toBe(CONFIG.clearOut)
  })

  it('Green Project stays in your hand until you play it', () => {
    let r = inStage4(['greenProject'], 'greenPoliticians')
    r = moves(r, 1)
    expect(r.hand.some(c => c.key === 'greenProject')).toBe(true)
    r.ap = 2
    r = playIt(r, 'greenProject')
    expect(r.deck.some(c => c.key === 'greenProject')).toBe(false)
  })

  it('On the Payroll gives an AP back; Bridge Fuel gives 2', () => {
    let r = inStage4(['onThePayroll', 'bridgeFuel'], 'greenPoliticians')
    r.ap = 1
    r = playIt(r, 'onThePayroll'); expect(r.ap).toBe(1)
    r = playIt(r, 'bridgeFuel'); expect(r.ap).toBe(3)
  })

  it('Recycling puts your discard pile back into the draw pile', () => {
    let r = inStage4(['recycling'], 'greenPoliticians')
    r.discard = [{ id: 4000, key: 'hiredHand', uses: null }, { id: 4001, key: 'hiredHand', uses: null }]
    r.draw = []
    r = playIt(r, 'recycling')
    expect(r.discard.filter(c => c.key === 'hiredHand')).toHaveLength(0)
    expect(r.hand.filter(c => c.key === 'hiredHand')).toHaveLength(2)
  })

  it('old Heat cards keep only their other effect', () => {
    let r = inStage4(['lobbyCongress'], 'fracking')
    const hold = r.threats[0].hold
    r = playIt(r, 'lobbyCongress')
    expect(r.threats[0].hold).toBe(hold - 9)
    expect(r.heat).toBe(0)
  })
})

describe('fixes after the first full games', () => {
  it('Drilling Rights is never the reward once every plot has a Rig', () => {
    for (let seed = 1; seed < 60; seed++) {
      const r = adminStart(seed, { ...ADMIN_DEFAULTS, stage: 3, start: 4, wells: 5, capital: 300, gold: 9, deck: 'strong' })
      r.plots = Array.from({ length: 5 }, () => ({ output: 2, reserve: 0, rig: true }))
      const won = act(r, { type: 'admin', op: 'winRound' })
      expect(won.phase).toBe('stageComplete')
      expect(won.reward).not.toBe('drillingRights')
    }
  })

  it('winding the Truth clock back counts towards Spin Doctor', () => {
    let r = inStage4(['carbonOffsets'])
    r.clock = 6; r.rng = 2
    const before = r.tally?.cooled ?? 0
    r = playIt(r, 'carbonOffsets')
    expect((r.tally?.cooled ?? 0) - before).toBe(r.clock === 5 ? CONFIG.tactics.clockHourWorth : 0)
  })
})

describe('Bad Blood from stage 3', () => {
  it('no fires from stage 3: Bad Blood is a must-play $5 card', () => {
    const d = CARDS.badBloodLate
    expect(d.forced).toBe(true)
    expect(d.cost).toBe(CONFIG.badBloodCost)
    let r = inStage4(['badBloodLate'], 'greenPoliticians')
    expect(canPlay(r, r.hand.find(c => c.key !== 'badBloodLate') ?? r.hand[0]).ok).toBe(true)
    r.hand.push({ id: 7100, key: 'propaganda', uses: null }); r.deck.push(r.hand[r.hand.length - 1])
    expect(canPlay(r, r.hand.find(c => c.key === 'propaganda')!).ok).toBe(false) // must play first
    const cash = r.capital
    r = playIt(r, 'badBloodLate')
    expect(r.capital).toBe(cash - CONFIG.badBloodCost)
    expect(r.fire).toBe(0)
  })

  it('Dynamite still adds Bad Blood from stage 3, the $5 kind', () => {
    let r = inStage4(['dynamite'], 'greenPoliticians')
    r = playIt(r, 'dynamite')
    expect(r.discard.some(c => c.key === 'badBloodLate')).toBe(true)
    expect(r.deck.some(c => c.key === 'badBlood')).toBe(false)
  })
})
