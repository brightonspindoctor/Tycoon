import { describe, expect, it } from 'vitest'
import { act, buyoutPrice, cardDef, goMultinational, handSize, intentText, newRun, price, production, type Run } from './engine'
import { CONFIG } from './config'
import { CARDS, THREATS, type CardKey, type ThreatKind } from './data'

/** A run that has just won the proxy fight, with some old stock in the deck. */
function afterProxyFight(seed = 3): Run {
  const r = newRun(seed, 'threeOil')
  r.stage = 2
  r.plots = [{ output: 1, reserve: 0, field: true }, null, { output: 1, reserve: 0, lasting: true }]
  r.deck = (['oldProspect', 'derrick', 'bucket', 'shoreUp', 'payDividend', 'hiredHand', 'lawyerUp', 'telegraphLine', 'hardGraft', 'insurance', 'badBlood'] as CardKey[])
    .map((k, i) => ({ id: 100 + i, key: k, uses: CARDS[k].uses }))
  r.deck[6].up = true // an upgraded Lawyer Up
  r.phase = 'stageComplete'
  r.round = 4
  r.gold = 5
  r.capital = 30
  return r
}
/** Straight into stage 3, round 1, against one enemy, with a hand you choose. */
function inStage3(hand: CardKey[] = [], threat: ThreatKind = 'rivals', seed = 3): Run {
  let r = act(afterProxyFight(seed), { type: 'continue' })
  r = act(r, { type: 'leaveShop' })
  r.threats = [{ id: 900, kind: threat, hold: 20, maxHold: 20, step: 0, cycle: 0, round3: false, beaten: false }]
  r.hand = hand.map((k, i) => ({ id: 5000 + i, key: k, uses: CARDS[k].uses }))
  r.deck.push(...r.hand)
  r.ap = 3
  r.capital = 60
  r.heat = 10
  return r
}
const inHand = (r: Run, k: CardKey) => r.hand.find(c => c.key === k)!

describe('going multinational (stage 2 → 3)', () => {
  it('turns every Field and Well into an offshore Rig, and drops empty plots', () => {
    const r = act(afterProxyFight(), { type: 'continue' })
    expect(r.phase).toBe('incorporate')
    expect(r.stage).toBe(3)
    expect(r.plots).toHaveLength(2)
    expect(r.plots.every(w => w?.rig && w.output === CONFIG.rigOutput)).toBe(true)
  })

  it('turns land cards into Dry Leases and fire and board cards into Dead Weight', () => {
    const r = act(afterProxyFight(), { type: 'continue' })
    const keys = r.deck.map(c => c.key)
    expect(keys.filter(k => k === 'dryLease')).toHaveLength(2) // Worn Prospect, Steel Derrick
    expect(keys.filter(k => k === 'deadWeight')).toHaveLength(3) // Bucket, Shore Up, Pay a Dividend
    expect(keys).not.toContain('badBlood') // no fires in stage 3
  })

  it('fades old attacks to 1 Hold and old Cover to 1, and takes their upgrades away', () => {
    const r = act(afterProxyFight(), { type: 'continue' })
    const lawyer = r.deck.find(c => c.key === 'lawyerUp')!
    expect(lawyer.faded).toBe(true)
    expect(lawyer.up).toBeFalsy()
    expect(cardDef(lawyer).power).toBe(1)
    expect(cardDef(r.deck.find(c => c.key === 'insurance')!).cover).toBe(1)
    // cards that don't weaken aren't marked
    expect(r.deck.find(c => c.key === 'telegraphLine')!.faded).toBeFalsy()
    expect(r.deck.find(c => c.key === 'hardGraft')!.faded).toBeFalsy()
  })

  it('adds Bury Evidence, Lobby Congress and Bribe an Official, and starts Heat at 0', () => {
    const r = act(afterProxyFight(), { type: 'continue' })
    for (const k of ['buryEvidence', 'lobbyCongress', 'bribeOfficial'] as CardKey[]) expect(r.deck.some(c => c.key === k)).toBe(true)
    expect(r.heat).toBe(0)
  })

  it('offers the Oil Shock: Capital now, Heat from the start', () => {
    const r = act(act(afterProxyFight(), { type: 'continue' }), { type: 'takeLoan' })
    expect(r.capital).toBe(30 + CONFIG.oilShockCash)
    expect(r.heat).toBe(CONFIG.oilShockHeat)
    expect(r.debt).toBe(CONFIG.startDebt) // not a loan: no extra Bank Debt
  })

  it('money is shown in millions from here', () => {
    expect(goMultinational).toBeTypeOf('function')
    expect(price(inStage3())).toBe(CONFIG.oilPrice3)
  })
})

describe('Heat', () => {
  it('every AP you spend adds 2 Heat', () => {
    const r = inStage3(['telex'])
    const after = act(r, { type: 'play', cardId: inHand(r, 'telex').id })
    expect(after.heat).toBe(r.heat + CONFIG.heatPerAP)
    const sold = act({ ...r, oil: 2 }, { type: 'sellOil' })
    expect(sold.heat).toBe(r.heat + CONFIG.heatPerAP)
  })

  it('0 AP cards add no Heat', () => {
    const r = inStage3(['hardGraft'])
    expect(act(r, { type: 'play', cardId: inHand(r, 'hardGraft').id }).heat).toBe(r.heat)
  })

  it('lobbying takes Heat down', () => {
    const r = inStage3(['thinkTank', 'lobbyCongress'])
    r.heat = 30
    const a = act(r, { type: 'play', cardId: inHand(r, 'thinkTank').id })
    expect(a.heat).toBe(r.heat + CONFIG.heatPerAP - 10)
    const b = act(a, { type: 'play', cardId: inHand(a, 'lobbyCongress').id, target: 900 })
    expect(b.heat).toBe(a.heat + CONFIG.heatPerAP - 5)
    expect(b.threats[0].hold).toBe(20 - 3)
  })

  it('at 100 the company is broken up', () => {
    const r = inStage3(['telex'])
    r.heat = CONFIG.heatMax - 1
    const after = act(r, { type: 'play', cardId: inHand(r, 'telex').id })
    expect(after.phase).toBe('lost')
    expect(after.loss?.reason).toBe('brokenUp')
  })

  it('a final blow that tips Heat over still wins the round', () => {
    const r = inStage3(['buryEvidence'], 'diversified')
    r.heat = CONFIG.heatMax - 1; r.threats[0].hold = 1
    const after = act(r, { type: 'play', cardId: inHand(r, 'buryEvidence').id, target: 900 })
    expect(after.phase).toBe('roundWon')
    expect(after.heat).toBe(CONFIG.heatMax - 1)
  })

  it('Climate Science adds Heat on its own', () => {
    const r = inStage3([], 'climateScience')
    const after = act(r, { type: 'endTurn' })
    expect(after.heat).toBe(r.heat + CONFIG.measureHeat)
  })

  it('the Lobbying Firm at the Trading Floor: $ for −10 Heat, once a visit', () => {
    const r = inStage3()
    r.phase = 'shop'; r.heat = 40; r.shop.dividendPaid = false
    const a = act(r, { type: 'payDividends' })
    expect(a.heat).toBe(40 - CONFIG.lobbyFirmDrop)
    expect(a.capital).toBe(r.capital - CONFIG.lobbyFirmCost)
    expect(act(a, { type: 'payDividends' }).heat).toBe(a.heat)
  })
})

describe('stage 3 cards', () => {
  it('Embargo Rumours: oil +$1 this turn; Queues at the Pump: +$2 for the round', () => {
    const r = inStage3(['embargoRumours', 'queuesAtPump'], 'diversified')
    const a = act(r, { type: 'play', cardId: inHand(r, 'embargoRumours').id })
    expect(price(a)).toBe(price(r) + 1)
    const b = act(a, { type: 'play', cardId: inHand(a, 'queuesAtPump').id })
    expect(price(b)).toBe(price(r) + 3)
    const next = act(b, { type: 'endTurn' })
    expect(price(next)).toBe(price(r) + 2) // the queues last the round, the rumour doesn't
  })

  it('Memo: discard the rest of your hand, draw that many plus 1', () => {
    const r = inStage3(['memo', 'deadWeight', 'deadWeight'])
    r.draw = Array.from({ length: 6 }, (_, i) => ({ id: 7000 + i, key: 'telex' as CardKey, uses: null }))
    r.deck.push(...r.draw)
    const after = act(r, { type: 'play', cardId: inHand(r, 'memo').id })
    expect(after.hand).toHaveLength(3)
    expect(after.hand.every(c => c.key === 'telex')).toBe(true)
  })

  it('Restructure destroys a card in hand and draws 1; upgraded it is Write It Off (+$2)', () => {
    const r = inStage3(['restructure', 'deadWeight'])
    const dead = inHand(r, 'deadWeight')
    const after = act(r, { type: 'play', cardId: inHand(r, 'restructure').id, target: dead.id })
    expect(after.deck.some(c => c.id === dead.id)).toBe(false)
    const up = inStage3(['restructure', 'deadWeight'])
    inHand(up, 'restructure').up = true
    expect(cardDef(inHand(up, 'restructure')).name).toBe('Write It Off')
    const paid = act(up, { type: 'play', cardId: inHand(up, 'restructure').id, target: inHand(up, 'deadWeight').id })
    expect(paid.capital).toBe(up.capital + 2)
  })

  it('Personal Guarantee and Dip into the Trust turn gold into Capital', () => {
    const r = inStage3(['personalGuarantee', 'dipTrust'])
    const a = act(r, { type: 'play', cardId: inHand(r, 'personalGuarantee').id })
    expect(a.gold).toBe(r.gold - 1)
    expect(a.capital).toBe(r.capital + CONFIG.personalGuaranteeCash)
    const b = act(a, { type: 'play', cardId: inHand(a, 'dipTrust').id })
    expect(b.gold).toBe(a.gold - CONFIG.dipTrustGold)
    expect(b.capital).toBe(a.capital + CONFIG.dipTrustCash)
    expect(b.deck.some(c => c.key === 'dipTrust')).toBe(false) // one use
    expect(b.heat).toBe(a.heat) // 0 AP
  })

  it('a bribe makes a Bribery Scandal bigger', () => {
    const r = inStage3(['bribeOfficial'], 'briberyScandal')
    const after = act(r, { type: 'play', cardId: inHand(r, 'bribeOfficial').id, target: 900 })
    expect(after.threats[0].hold).toBe(20 - 8 + CONFIG.bribeFeedsScandal)
  })

  it('Bury Evidence hits Climate Science twice as hard', () => {
    const r = inStage3(['buryEvidence'], 'climateScience')
    const after = act(r, { type: 'play', cardId: inHand(r, 'buryEvidence').id, target: 900 })
    expect(after.threats[0].hold).toBe(20 - 12)
  })
})

describe('buying enemies out', () => {
  it('pays $2 per Hold left, costs 1 AP, and beats the enemy', () => {
    const r = inStage3([], 'rivals')
    r.threats[0].hold = 10
    const after = act(r, { type: 'buyOut', target: 900 })
    expect(after.capital).toBe(r.capital - buyoutPrice(r.threats[0]))
    expect(after.heat).toBe(r.heat + CONFIG.heatPerAP)
    expect(after.phase).toBe('roundWon')
  })

  it("can't buy out Climate Science, the Bribery Scandal or the summit", () => {
    for (const k of ['climateScience', 'briberyScandal', 'geneva'] as ThreatKind[]) {
      expect(THREATS[k].buyout).toBeUndefined()
      const r = inStage3([], k)
      expect(act(r, { type: 'buyOut', target: 900 }).capital).toBe(r.capital)
    }
  })
})

describe('stage 3 items and the shop', () => {
  it('the Trading Floor builds an Offshore Rig outright, up to 5', () => {
    const r = inStage3()
    r.phase = 'shop'; r.shop.prospectSold = false
    const after = act(r, { type: 'buyProspect' })
    expect(after.plots.filter(w => w?.rig)).toHaveLength(3)
    expect(after.prospectPrice).toBe(r.prospectPrice + CONFIG.rigStep)
    expect(production(after)).toBe(3)
  })

  it('Rolodex: +1 hand size, up to 7; Supertanker: +4 storage, up to 12', () => {
    const r = inStage3()
    r.items.push('rolodex', 'rolodex', 'rolodex')
    expect(handSize(r)).toBe(CONFIG.handMax)
    r.phase = 'shop'; r.storage = 10; r.shop.item = 'supertanker'
    expect(act(r, { type: 'buyItem' }).storage).toBe(CONFIG.maxStorage)
  })

  it('the Paper Shredder destroys a card in hand for free, once a round', () => {
    const r = inStage3(['deadWeight', 'deadWeight'])
    r.items.push('paperShredder')
    const [a, b] = r.hand
    const once = act(r, { type: 'shred', cardId: a.id })
    expect(once.deck.some(c => c.id === a.id)).toBe(false)
    expect(once.ap).toBe(r.ap)
    const twice = act(once, { type: 'shred', cardId: b.id })
    expect(twice.deck.some(c => c.id === b.id)).toBe(true)
  })
})

describe('the Geneva Climate Summit', () => {
  it('opens with Heat, then testimony grows each cycle', () => {
    const r = inStage3([], 'geneva')
    expect(intentText(r, r.threats[0])).toBe(`+${CONFIG.testimonyHeat} Heat.`)
    expect(intentText(r, { ...r.threats[0], cycle: 2 })).toBe(`+${CONFIG.testimonyHeat + 2 * CONFIG.testimonyStep} Heat.`)
  })

  it('puts a Draft Declaration in your next hand', () => {
    const r = inStage3([], 'geneva')
    r.threats[0].step = 1
    const after = act(r, { type: 'endTurn' })
    expect(after.hand.some(c => c.key === 'draftDeclaration')).toBe(true)
  })

  it('beating it ends the stage and leaves a residue by Heat', () => {
    const cool = inStage3(['buryEvidence'], 'geneva')
    cool.round = 4; cool.threats[0].hold = 1; cool.heat = 20
    const won = act(cool, { type: 'play', cardId: inHand(cool, 'buryEvidence').id, target: 900 })
    expect(won.phase).toBe('stageComplete')
    expect(won.residue).toBe('furtherResearch')
    const hot = inStage3(['buryEvidence'], 'geneva')
    hot.round = 4; hot.threats[0].hold = 1; hot.heat = 90
    expect(act(hot, { type: 'play', cardId: inHand(hot, 'buryEvidence').id, target: 900 }).residue).toBe('regulators')
  })
})
