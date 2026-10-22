import { describe, expect, it } from 'vitest'
import { act, cardDef, goMultinational, handSize, intentText, newRun, price, production, type Run } from './engine'
import { CONFIG } from './config'
import { CARDS, boonInfo, landCardFor, rewardInfo, type CardKey, type ThreatKind } from './data'

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
  r = act(act(r, { type: 'pickCard', key: 'buryEvidence' }), { type: 'pickCard', key: 'lobbyCongress' })
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
    expect(keys.filter(k => k === 'deadWeight')).toHaveLength(2) // Bucket, Pay a Dividend
    expect(keys).toContain('shoreUp') // blocks still work in stage 3, like Security Detail
    expect(keys).not.toContain('badBlood') // no fires in stage 3
  })

  it('leaves every other old card exactly as it was, upgrades and all', () => {
    const r = act(afterProxyFight(), { type: 'continue' })
    const lawyer = r.deck.find(c => c.key === 'lawyerUp')!
    expect(lawyer.faded).toBeFalsy()
    expect(lawyer.up).toBe(true)
    expect(cardDef(lawyer).power).toBe(cardDef({ key: 'lawyerUp', up: true }).power)
    expect(cardDef(r.deck.find(c => c.key === 'insurance')!).cover).toBe(CARDS.insurance.cover)
    expect(r.deck.some(c => c.faded)).toBe(false)
  })

  it('a Dry Lease is destroyed once it is played', () => {
    const r = inStage3(['dryLease'])
    const lease = inHand(r, 'dryLease')
    const after = act(r, { type: 'play', cardId: lease.id })
    expect(after.deck.some(c => c.id === lease.id)).toBe(false)
    expect(after.ap).toBe(r.ap - 1)
  })

  it('has you pick 2 of 4 new cards, starts Heat from stage 2 skimming, and drops Bank Debt', () => {
    let r = act(afterProxyFight(), { type: 'continue' })
    expect(r.offer).toEqual(['buryEvidence', 'lobbyCongress', 'buyOut', 'advertorial'])
    expect(r.heat).toBe(0)
    expect(r.debt).toBe(0)
    expect(act(r, { type: 'leaveShop' }).phase).toBe('incorporate') // pick first
    r = act(act(r, { type: 'pickCard', key: 'buyOut' }), { type: 'pickCard', key: 'advertorial' })
    r = act(r, { type: 'leaveShop' })
    expect(r.deck.some(c => c.key === 'buyOut') && r.deck.some(c => c.key === 'advertorial')).toBe(true)
    expect(r.leftover).toEqual(['buryEvidence', 'lobbyCongress'])
    expect(r.ledger.some(l => /Bank debt/.test(l.label))).toBe(false)
    // skimmed 6 gold in stage 2: +10 Heat to start
    const skimmer = afterProxyFight(); skimmer.stats.skims = 6
    expect(act(skimmer, { type: 'continue' }).heat).toBe(2 * CONFIG.heatPerSkims)
  })

  it('no longer offers a loan or an Oil Shock cash-in', () => {
    const r = act(afterProxyFight(), { type: 'continue' })
    expect(act(r, { type: 'takeLoan' }).capital).toBe(r.capital)
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
    const sold = act({ ...r, oil: 2 }, { type: 'sellOil' }) // selling takes 2 AP in stage 3
    expect(sold.ap).toBe(r.ap - CONFIG.sellAP3)
    expect(sold.heat).toBe(r.heat + CONFIG.sellAP3 * CONFIG.heatPerAP)
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
    expect(b.heat).toBe(a.heat + CONFIG.heatPerAP - 6)
    expect(b.threats[0].hold).toBe(20 - 9)
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

describe('Buy Out, Advertorial, the Oil Shock and Cover', () => {
  it('Buy Out costs $8 and removes 14 Hold, double against Rival Companies', () => {
    const r = inStage3(['buyOut'], 'rivals')
    const after = act(r, { type: 'play', cardId: inHand(r, 'buyOut').id, target: 900 })
    expect(after.capital).toBe(r.capital - 8)
    expect(after.threats[0].hold).toBe(20 - 20) // 28 on a 20-Hold enemy: beaten
  })

  it('Buy Out is Legal damage: full on the summit, double on the Bribery Scandal, half on the Spill', () => {
    expect(CARDS.buyOut.family).toBe('Legal')
    const hold = (k: ThreatKind) => { const r = inStage3(['buyOut'], k); r.threats[0].hold = 40; return act(r, { type: 'play', cardId: inHand(r, 'buyOut').id, target: 900 }).threats[0].hold }
    expect(hold('geneva')).toBe(40 - 14)
    expect(hold('briberyScandal')).toBe(40 - 28)
    expect(hold('spill')).toBe(40 - 7)
  })

  it('Cover blocks Heat from enemies, and every enemy move also takes Capital', () => {
    const r = inStage3(['advertorial'], 'climateScience')
    const a = act(r, { type: 'play', cardId: inHand(r, 'advertorial').id })
    expect(a.cover).toBe(6)
    const b = act(a, { type: 'endTurn' }) // Measure: +5 Heat, blocked; then $1 chip, blocked by what's left
    expect(b.heat).toBe(a.heat)
    expect(b.capital).toBe(a.capital)
    const c = act(inStage3([], 'climateScience'), { type: 'endTurn' })
    expect(c.heat).toBe(10 + CONFIG.measureHeat)
  })

  it('the Oil Shock doubles your next sale this turn, and is sold once a run', () => {
    const r = inStage3(['oilShock'])
    r.oil = 4
    const a = act(r, { type: 'play', cardId: inHand(r, 'oilShock').id })
    const sold = act(a, { type: 'sellOil' })
    expect(sold.capital).toBe(a.capital + 4 * CONFIG.oilPrice3 * 2)
    expect(sold.deck.some(c => c.key === 'oilShock')).toBe(false)
    const shop = { ...sold, oilShockBought: true }
    for (let i = 0; i < 30; i++) { shop.phase = 'shop'; const x = act(shop, { type: 'reroll' }); expect(x.shop.cards).not.toContain('oilShock') }
  })

  it('a card can be upgraded twice in stage 3', () => {
    const r = inStage3(['buryEvidence'])
    r.phase = 'shop'; r.capital = 200
    const c = r.hand[0]
    const once = act(r, { type: 'upgradeCard', cardId: c.id })
    const twice = act(once, { type: 'upgradeCard', cardId: c.id })
    const card = twice.deck.find(x => x.id === c.id)!
    expect(card.up && card.up2).toBe(true)
    expect(cardDef(card).power).toBe(12)
    expect(cardDef(card).text).toBe('Remove 12 Hold.')
    expect(act(twice, { type: 'upgradeCard', cardId: c.id }).capital).toBe(twice.capital) // not a third time
  })
})

describe('stage 3 items and the shop', () => {
  it('the Trading Floor builds an Offshore Rig outright, up to 5', () => {
    const r = inStage3()
    r.phase = 'shop'; r.shop.prospectSold = false
    const after = act(r, { type: 'buyProspect' })
    expect(after.plots.filter(w => w?.rig)).toHaveLength(3)
    expect(after.prospectPrice).toBe(r.prospectPrice + CONFIG.rigStep)
    expect(production(after)).toBe(3 * CONFIG.rigOutput)
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

describe('land cards for the stage ahead', () => {
  it('Drilling Rights after the stage 2 boss gives Rigs, which survive going multinational', () => {
    expect(landCardFor(2 + 1)).toBe('rig') // grantReward hands out the land card for the stage ahead
    expect(landCardFor(1 + 1)).toBe('well')
    expect(rewardInfo('drillingRights', 2).text).toContain('Rig')
    expect(rewardInfo('drillingRights', 1).text).toContain('Well')
    const r = afterProxyFight()
    r.deck.push({ id: 7000, key: 'rig', uses: 1 }, { id: 7001, key: 'rig', uses: 1 })
    const after = act(r, { type: 'continue' })
    expect(after.deck.filter(c => c.key === 'rig')).toHaveLength(2) // not turned into Dry Leases
  })

  it('a Rig card builds a Rig', () => {
    const r = inStage3(['rig'])
    const before = r.plots.filter(Boolean).length
    const s = act(r, { type: 'play', cardId: inHand(r, 'rig').id })
    expect(s.plots.filter(Boolean).length).toBe(before + 1)
    expect(s.plots.filter(w => w?.rig)).toHaveLength(before + 1)
  })

  it('the spare-land boon is Spare Wells until stage 3', () => {
    expect(boonInfo('spareRigs', 1).name).toBe('Spare Wells')
    expect(boonInfo('spareRigs', 2).name).toBe('Spare Wells')
    expect(boonInfo('spareRigs', 3).name).toBe('Spare Rigs')
  })
})
