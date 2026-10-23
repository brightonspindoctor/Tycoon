// A simple rule-following player, used by the tests and the balance simulator.
import { act, attackPower, canBuild, canPlay, canUpgrade, cardDef, damageOn, handTargetsFor, intent, isAttack, liveThreats, netPrice, rigCount, sellAP, skimRate, type Card, type Run } from '../src/engine/engine'
import { CARDS, PROSPECT_FOR, THREATS, type CardKey } from '../src/engine/data'
import { CONFIG } from '../src/engine/config'

// which cards are worth upgrading first
/** How the bot plays the money: for the stage 2 playtest. */
export const botStyle = { skim: 'normal' as 'none' | 'normal' | 'greedy' }

const UPGRADE_ORDER: CardKey[] = ['lawyerUp', 'payWages', 'hiredHand', 'patentThicket', 'espionage', 'dynamite', 'payDividend', 'expenseAccount', 'improveGear', 'shoreUp', 'insurance']

const UPGRADE_3: CardKey[] = ['buyOut', 'buryEvidence', 'lobbyCongress', 'retainCounsel', 'bribeOfficial', 'advertorial', 'restructure', 'telex', 'thinkTank']
/** A card that's dead weight in stage 3: junk, or a faded old card. */
const stale = (c: Card) => !!c.faded || (CARDS[c.key].junk && !CARDS[c.key].forced)

/** Stage 2 → 3: pick the new cards, drop the dead stock, upgrade. */
function botMultinational(r: Run): Run {
  for (const k of ['buyOut', 'lobbyCongress', 'buryEvidence', 'advertorial'] as CardKey[]) if ((r.picked ?? []).length < CONFIG.incorporatePicks && r.offer?.includes(k)) r = act(r, { type: 'pickCard', key: k })
  for (const c of r.deck.filter(x => CARDS[x.key].junk)) if (r.capital > r.destroyCost + 12) r = act(r, { type: 'destroyCard', cardId: c.id })
  for (const k of UPGRADE_3) {
    const c = r.deck.find(x => x.key === k && canUpgrade(x, r.stage))
    if (c && r.capital > r.upgradeCost + 20) r = act(r, { type: 'upgradeCard', cardId: c.id })
  }
  return act(r, { type: 'leaveShop' })
}

const UPGRADE_4: CardKey[] = ['climateBreakdown', 'propaganda', 'onThePayroll', 'sustainabilityReport', 'astroturfing', 'buyOut', 'buryEvidence', 'lobbyCongress', 'retainCounsel', 'bridgeFuel', 'recycling', 'carbonCapture', 'carbonOffsets']
/** How useless a card is to Big Oil: junk first, then Heat-only and faded stock, then weak old attacks. */
const dross = (c: Card) => (CARDS[c.key].junk ? 100 : c.key === 'thinkTank' ? 90 : ['improveGear', 'hiredHand', 'hardGraft', 'telegram', 'pettyCash'].includes(c.key) ? 50 : 0) - (CARDS[c.key].era ?? 1)
/** The damage types a deck carries: the Truth wants all four. */
const families = (r: Run) => new Set(r.deck.filter(c => isAttack(c.key)).map(c => CARDS[c.key].family))

/** Stage 3 → 4, in its two steps: pick the damage types the deck lacks (and the World Bank if cash is short), then the free clear-out. */
function botBigOil(r: Run): Run {
  if (r.bigOilStep === 'clear') {
    for (let i = 0; i < CONFIG.clearOut && (r.freeDestroys ?? 0) > 0; i++) {
      const worst = [...r.deck].sort((a, b) => dross(b) - dross(a))[0]
      if (!worst || dross(worst) <= 0) break
      r = act(r, { type: 'destroyCard', cardId: worst.id })
    }
    return act(r, { type: 'leaveShop' })
  }
  if (r.capital < 60) r = act(r, { type: 'takeLoan' })
  const have = families(r)
  const offer = [...(r.offer ?? [])].sort((a, b) => Number(have.has(CARDS[a].family)) - Number(have.has(CARDS[b].family)))
  for (const k of offer) if ((r.picked ?? []).length < CONFIG.incorporatePicks) r = act(r, { type: 'pickCard', key: k })
  return act(r, { type: 'leaveShop' })
}

function botShop4(r: Run): Run {
  if (rigCount(r) < 5 && canBuild(r) && r.capital > r.prospectPrice + 15) r = act(r, { type: 'buyProspect' })
  const junk = [...r.deck].sort((a, b) => dross(b) - dross(a))[0]
  if (junk && dross(junk) >= 50 && r.capital > r.destroyCost + 15) r = act(r, { type: 'destroyCard', cardId: junk.id })
  const have = families(r)
  const lateClock = (r.clock ?? 1) >= 5
  const want: CardKey[] = [
    ...(lateClock ? ['carbonOffsets', 'carbonCapture'] as CardKey[] : []),
    ...(['climateBreakdown', 'sustainabilityReport', 'propaganda', 'onThePayroll', 'astroturfing'] as CardKey[]).filter(k => !have.has(CARDS[k].family)),
    'bridgeFuel', 'influencers', 'climateBreakdown', 'carbonCapture', 'carbonOffsets', 'recycling', 'sustainabilityReport', 'propaganda', 'onThePayroll', 'astroturfing',
  ]
  for (let n = 0; n < 2; n++) for (const k of want) {
    const i = r.shop.cards.indexOf(k)
    if (i >= 0 && r.capital > (CARDS[k].price ?? 0) + (n ? 50 : 15)) { r = act(r, { type: 'buyCard', slot: i }); break }
  }
  if (r.shop.item && ['lobbyist', 'prAgency', 'fossilSubsidy', 'strategicReserve', 'offshoreTrust', 'rolodex'].includes(r.shop.item) && r.capital > 50) r = act(r, { type: 'buyItem' })
  if (r.shop.boon && r.gold > 4) r = act(r, { type: 'buyBoon' })
  const up = UPGRADE_4.map(k => r.deck.find(x => x.key === k && canUpgrade(x, r.stage))).find(Boolean)
  if (up && r.capital > r.upgradeCost + 25) r = act(r, { type: 'upgradeCard', cardId: up.id })
  return act(r, { type: 'leaveShop' })
}

/** Stage 1 → 2: take the loan when cash is short, upgrade the best cards, drop junk. */
export function botIncorporate(r: Run): Run {
  if (r.stage >= 4) return botBigOil(r)
  if (r.stage >= 3) return botMultinational(r)
  if (r.capital < 20) r = act(r, { type: 'takeLoan' })
  for (const c of r.deck.filter(x => CARDS[x.key].junk)) if (r.capital > r.destroyCost + 8) r = act(r, { type: 'destroyCard', cardId: c.id })
  for (const k of UPGRADE_ORDER) {
    const c = r.deck.find(x => x.key === k && canUpgrade(x))
    if (c && r.capital > r.upgradeCost + 16) r = act(r, { type: 'upgradeCard', cardId: c.id })
  }
  // pick the new cards: a Derrick and the attack card first
  for (const k of ['derrick', 'patentThicket', 'payDividend', 'tickerTape'] as CardKey[]) if ((r.picked ?? []).length < CONFIG.incorporatePicks && r.offer?.includes(k)) r = act(r, { type: 'pickCard', key: k })
  return act(r, { type: 'leaveShop' })
}

function botShop3(r: Run): Run {
  if (r.heat >= 20 && r.capital > CONFIG.lobbyFirmCost + 15) r = act(r, { type: 'payDividends' }) // the lobbying firm
  // a Rig first, while there's room: they never run dry
  if (rigCount(r) < 5 && canBuild(r) && r.capital > r.prospectPrice + 10) r = act(r, { type: 'buyProspect' })
  const junk = r.deck.find(stale)
  if (junk && r.capital > r.destroyCost + 10) r = act(r, { type: 'destroyCard', cardId: junk.id })
  const want: CardKey[] = r.heat >= 40 ? ['thinkTank', 'lobbyCongress', 'advertorial', 'buyOut', 'buryEvidence', 'retainCounsel', 'restructure'] : ['buyOut', 'buryEvidence', 'lobbyCongress', 'thinkTank', 'retainCounsel', 'oilShock', 'advertorial', 'restructure', 'telex', 'queuesAtPump']
  for (let n = 0; n < 2; n++) for (const k of want) { // a rich company buys twice
    const i = r.shop.cards.indexOf(k)
    if (i >= 0 && r.capital > (CARDS[k].price ?? 0) + (n ? 40 : 10)) { r = act(r, { type: 'buyCard', slot: i }); break }
  }
  if (r.shop.item && ['supertanker', 'refinery', 'thinkTankItem', 'paperShredder', 'rolodex'].includes(r.shop.item) && r.capital > 35) r = act(r, { type: 'buyItem' })
  const up = UPGRADE_3.map(k => r.deck.find(x => x.key === k && canUpgrade(x, r.stage))).find(Boolean)
  if (up && r.capital > r.upgradeCost + 18) r = act(r, { type: 'upgradeCard', cardId: up.id })
  return act(r, { type: 'leaveShop' })
}

export function botShop(r: Run): Run {
  if (r.stage >= 4) return botShop4(r)
  if (r.stage >= 3) return botShop3(r)
  const stage2 = r.stage >= 2
  // the board first: keep Exposure well away from the top
  if (stage2 && r.exposure >= 4 && r.capital > CONFIG.dividendCost + 6) r = act(r, { type: 'payDividends' })
  // destroy junk, buy a Prospect if land is left, buy one attack card, then leave
  const junk = r.deck.find(c => CARDS[c.key].junk)
  if (junk && r.capital > r.destroyCost + 6) r = act(r, { type: 'destroyCard', cardId: junk.id })
  // Prospect is single use: rebuy one when there is land to claim or an empty plot to fill
  const roomForWells = r.plots.length < 5 || r.plots.some(p => !p)
  const prospectKey = PROSPECT_FOR[r.stage] ?? 'derrick'
  const wantWell = stage2 ? r.deck.filter(c => c.key === 'derrick' || c.key === 'well').length < 5 - r.plots.filter(Boolean).length : !r.deck.some(c => c.key === prospectKey)
  if (roomForWells && wantWell && r.capital > r.prospectPrice + 6) r = act(r, { type: 'buyProspect' })
  const want = stage2
    ? ['patentThicket', 'espionage', 'poachEngineer', 'securityDetail', 'insurance', 'payDividend', 'personalLawyer', 'expenseAccount']
    : ['payWages', 'dynamite', 'infiltrate', 'lawyerUp', 'fireBrigade', 'shoreUp']
  for (let i = 0; i < r.shop.cards.length; i++) {
    const k = r.shop.cards[i]
    if (k && want.includes(k) && r.capital > (CARDS[k].price ?? 0) + 7) { r = act(r, { type: 'buyCard', slot: i }); break }
  }
  if ((r.shop.item === 'storageTank' || r.shop.item === 'offshore') && r.capital > 14) r = act(r, { type: 'buyItem' })
  if (stage2) {
    const up = UPGRADE_ORDER.map(k => r.deck.find(x => x.key === k && canUpgrade(x))).find(Boolean)
    if (up && r.capital > r.upgradeCost + 14) r = act(r, { type: 'upgradeCard', cardId: up.id })
  }
  if (stage2 && r.storage < 6 && r.capital > CONFIG.silo2Price + 14) r = act(r, { type: 'buySilo' })
  return act(r, { type: 'leaveShop' })
}

const TAKES_GOLD = ['Expose', 'Clawback']

/** Stage 3: every AP is Heat, so play only what pays. */
function botTurn3(r: Run): Run {
  for (let guard = 0; guard < 40 && r.phase === 'turn'; guard++) {
    const playable = r.hand.filter(c => canPlay(r, c).ok)
    const find = (k: CardKey) => playable.find(c => c.key === k)
    const forced = playable.find(c => CARDS[c.key].forced)
    const live = liveThreats(r)
    // the hardest-hitting attack, if it hits for more than 1
    const bestHit = (c: Card) => Math.max(0, ...live.map(t => damageOn(t, cardDef(c).family, attackPower(r, cardDef(c)))))
    const attacks = playable.filter(c => isAttack(c.key) && bestHit(c) > 1).sort((a, b) => bestHit(b) - bestHit(a))
    const scrapper = playable.find(c => cardDef(c).scrap === 'one' && handTargetsFor(r, c).some(stale))
    const cool = r.heat >= 35 && r.capital > 15 ? (find('thinkTank') ?? (r.heat >= 55 ? find('lobbyCongress') : undefined)) : undefined
    const cash = r.capital < 12 ? (find('personalGuarantee') ?? (r.capital < 6 ? find('dipTrust') : undefined)) : undefined
    const boost = r.oil >= 3 ? (find('queuesAtPump') ?? find('embargoRumours')) : undefined
    let choice: Run | null = null
    const canSell = r.oil > 0 && !r.current.refuse && r.ap >= sellAP(r)
    const full = canSell && r.oil + rigCount(r) * CONFIG.rigOutput > r.storage && (r.capital < 25 || !playable.some(c => isAttack(c.key) && bestHit(c) > 1)) // selling is a whole turn: fight first unless cash is short
    const shock = canSell && r.oil >= 8 && !r.doubleSale ? find('oilShock') : undefined
    const heatComing = live.some(t => ['Measure', 'Publish', 'Consensus', 'Expert Testimony'].includes(intent(r, t)))
    const spin = heatComing && r.cover < 4 && r.ap >= 1 && r.capital > 15 ? find('advertorial') : undefined
    if (forced) choice = act(r, { type: 'play', cardId: forced.id })
    else if (shock) choice = act(r, { type: 'play', cardId: shock.id })
    else if (full && boost && r.ap >= 1 + sellAP(r)) choice = act(r, { type: 'play', cardId: boost.id })
    else if (full) choice = act(r, { type: 'sellOil' })
    else if (r.items.includes('paperShredder') && !r.shredded && r.hand.some(stale)) choice = act(r, { type: 'shred', cardId: r.hand.find(stale)!.id })
    else if (cash) choice = act(r, { type: 'play', cardId: cash.id })
    else if (cool) choice = act(r, { type: 'play', cardId: cool.id })
    else if (scrapper) choice = act(r, { type: 'play', cardId: scrapper.id, target: handTargetsFor(r, scrapper).find(stale)!.id })
    else if (attacks.length) {
      const c = attacks[0]
      const t = live.reduce((a, b) => (damageOn(b, cardDef(c).family, attackPower(r, cardDef(c))) > damageOn(a, cardDef(c).family, attackPower(r, cardDef(c))) ? b : a))
      choice = act(r, { type: 'play', cardId: c.id, target: t.id })
    }
    else if (spin) choice = act(r, { type: 'play', cardId: spin.id })
    else if (boost && r.ap >= 1 + sellAP(r)) choice = act(r, { type: 'play', cardId: boost.id })
    else if (canSell && (r.oil >= Math.min(r.storage - 1, 6) || r.capital <= 10)) choice = act(r, { type: 'sellOil' })
    else if (find('telex') && r.ap >= 2) choice = act(r, { type: 'play', cardId: find('telex')!.id })
    else if (find('hardGraft')) choice = act(r, { type: 'play', cardId: find('hardGraft')!.id })
    if (!choice || JSON.stringify(choice) === JSON.stringify(r)) break
    r = choice
  }
  return r.phase === 'turn' ? act(r, { type: 'endTurn' }) : r
}

/** The moves that move the Truth clock on: worth stopping. */
const ticking = (r: Run) => liveThreats(r).filter(t => !t.stopped && intentTicks(r, t))
const intentTicks = (_r: Run, t: Run['threats'][number]) => t.kind === 'truth' ? (t.step + 1) % CONFIG.truthTickEvery === 0 : !!THREATS[t.kind].ticks?.includes(t.step % THREATS[t.kind].cycle.length)

/** Stage 4: beat each enemy fast, stop the moves that move the clock, and keep the clock back. */
function botTurn4(r: Run): Run {
  for (let guard = 0; guard < 40 && r.phase === 'turn'; guard++) {
    const playable = r.hand.filter(c => canPlay(r, c).ok)
    const find = (k: CardKey) => playable.find(c => c.key === k)
    const forced = playable.find(c => CARDS[c.key].forced)
    const live = liveThreats(r)
    const bestHit = (c: Card) => Math.max(0, ...live.map(t => damageOn(t, cardDef(c).family, attackPower(r, cardDef(c)))))
    const attacks = playable.filter(c => isAttack(c.key) && bestHit(c) > 1).sort((a, b) => bestHit(b) - bestHit(a))
    const tick = ticking(r)[0]
    const stop = tick ? (find('shoreUp') ?? find('securityDetail')) : undefined
    const clockBack = (r.clock ?? 1) >= 4 && r.capital > 15 ? find('carbonOffsets') : undefined
    const capture = tick && !r.captured && r.capital > 15 ? find('carbonCapture') : undefined
    const apUp = find('bridgeFuel') ?? find('hardGraft')
    const amp = attacks.length && bestHit(attacks[0]) >= 12 && r.capital > 20 && !r.amplify ? find('influencers') : undefined
    const canSell = r.oil > 0 && !r.current.refuse && r.ap >= sellAP(r)
    const full = canSell && r.oil + rigCount(r) * CONFIG.rigOutput > r.storage && (r.capital < 30 || !attacks.length)
    const cash = r.capital < 15 ? (find('personalGuarantee') ?? (r.capital < 8 ? find('dipTrust') : undefined)) : undefined
    let choice: Run | null = null
    if (forced) choice = act(r, { type: 'play', cardId: forced.id })
    else if (apUp) choice = act(r, { type: 'play', cardId: apUp.id })
    else if (stop && tick) choice = act(r, { type: 'play', cardId: stop.id, target: tick.id })
    else if (capture) choice = act(r, { type: 'play', cardId: capture.id })
    else if (clockBack) choice = act(r, { type: 'play', cardId: clockBack.id })
    else if (full) choice = act(r, { type: 'sellOil' })
    else if (cash) choice = act(r, { type: 'play', cardId: cash.id })
    else if (amp) choice = act(r, { type: 'play', cardId: amp.id })
    else if (attacks.length) {
      const c = attacks[0]
      const t = live.reduce((a, b) => (damageOn(b, cardDef(c).family, attackPower(r, cardDef(c))) > damageOn(a, cardDef(c).family, attackPower(r, cardDef(c))) ? b : a))
      choice = act(r, { type: 'play', cardId: c.id, target: t.id })
    }
    else if (find('recycling')) choice = act(r, { type: 'play', cardId: find('recycling')!.id })
    else if (find('telex') && r.ap >= 2) choice = act(r, { type: 'play', cardId: find('telex')!.id })
    else if (canSell && (r.oil >= Math.min(r.storage - 1, 6) || r.capital <= 15)) choice = act(r, { type: 'sellOil' })
    else if (find('greenProject')) choice = act(r, { type: 'play', cardId: find('greenProject')!.id })
    if (!choice || JSON.stringify(choice) === JSON.stringify(r)) break
    r = choice
  }
  return r.phase === 'turn' ? act(r, { type: 'endTurn' }) : r
}

export function botTurn(r: Run): Run {
  if (r.stage >= 4) return botTurn4(r)
  if (r.stage >= 3) return botTurn3(r)
  for (let guard = 0; guard < 40 && r.phase === 'turn'; guard++) {
    const playable = r.hand.filter(c => canPlay(r, c).ok)
    const forced = playable.find(c => CARDS[c.key].forced)
    const find = (k: string) => playable.find(c => c.key === k)
    const water = find('fireBrigade') ?? find('bucket')
    const attack = playable.find(c => isAttack(c.key))
    const building = playable.find(c => c.key === 'well' || c.key === 'wildcat')
    const prospect = playable.find(c => ['prospect', 'oldProspect'].includes(c.key))
    const graft = find('hardGraft')
    const petty = find('pettyCash')
    const stop = find('shoreUp') ?? find('securityDetail')
    const draw = find('telegraphLine') ?? find('tickerTape') ?? (r.capital > 8 ? find('efficiencyExpert') : undefined)
    const rig = find('derrick')
    const skimOK = botStyle.skim === 'greedy' ? r.exposure <= 5 && r.capital > skimRate(r) + 6 : botStyle.skim === 'normal' ? r.exposure <= 3 && r.capital > skimRate(r) + 12 : false
    const expense = skimOK ? find('expenseAccount') : undefined
    const sprint = find('rdSprint')
    const night = find('nightShift')
    const dividend = r.exposure >= 4 && r.capital > 8 ? find('payDividend') : undefined
    const goldAtRisk = liveThreats(r).some(t => !t.stopped && TAKES_GOLD.includes(intent(r, t)) && (intent(r, t) !== 'Clawback' || r.exposure >= CONFIG.exposureHigh))
    const lawyer = goldAtRisk && r.gold <= 2 ? find('personalLawyer') : undefined
    const scrap = playable.find(c => cardDef(c).scrap === 'one' && handTargetsFor(r, c).some(x => CARDS[x.key].junk)) ?? playable.find(c => cardDef(c).scrap === 'junk')
    let choice: Run | null = null
    if (scrap) {
      const victim = handTargetsFor(r, scrap).find(x => CARDS[x.key].junk)
      choice = act(r, { type: 'play', cardId: scrap.id, target: victim?.id })
    }
    else if (forced) choice = act(r, { type: 'play', cardId: forced.id })
    else if (lawyer) choice = act(r, { type: 'play', cardId: lawyer.id })
    else if (dividend && r.exposure >= 5) choice = act(r, { type: 'play', cardId: dividend.id })
    else if (r.fire && water) choice = act(r, { type: 'play', cardId: water.id })
    else if (draw) choice = act(r, { type: 'play', cardId: draw.id })
    else if (night && r.ap <= 1) choice = act(r, { type: 'play', cardId: night.id })
    else if (r.oil > 0 && netPrice(r) > 0 && !r.current.refuse && (r.capital <= 6 || r.oil >= r.storage - 1)) choice = act(r, { type: 'sellOil' })
    else if (building) choice = act(r, { type: 'play', cardId: building.id })
    else if (rig) choice = act(r, { type: 'play', cardId: rig.id })
    else if (prospect && !r.hand.some(c => c.key === 'well')) choice = act(r, { type: 'play', cardId: prospect.id })
    else if (attack) choice = act(r, { type: 'play', cardId: attack.id })
    else if (sprint) choice = act(r, { type: 'play', cardId: sprint.id })
    else if (dividend) choice = act(r, { type: 'play', cardId: dividend.id })
    else if (r.oil > 0 && netPrice(r) > 0 && !r.current.refuse) choice = act(r, { type: 'sellOil' })
    else if (stop) choice = act(r, { type: 'play', cardId: stop.id })
    else if (petty && r.capital > 10 && r.exposure <= 3) choice = act(r, { type: 'play', cardId: petty.id })
    else if (expense) choice = act(r, { type: 'play', cardId: expense.id })
    else if (graft && r.ap === 0 && r.hand.some(c => c.key !== 'hardGraft' && CARDS[c.key].ap === 1)) choice = act(r, { type: 'play', cardId: graft.id })
    if (!choice || choice === r || JSON.stringify(choice) === JSON.stringify(r)) break
    r = choice
  }
  return r.phase === 'turn' ? act(r, { type: 'endTurn' }) : r
}

/** Plays a whole run: through stage 1, the incorporation, stage 2, going multinational and stage 3 (or stops at `stopAt`). */
export function botRun(r: Run, stopAt = 4): Run {
  for (let guard = 0; guard < 900; guard++) {
    if (r.phase === 'shop') r = botShop(r)
    else if (r.phase === 'turn') r = botTurn(r)
    else if (r.phase === 'incorporate') r = botIncorporate(r)
    else if (r.phase === 'roundWon') {
      if (r.spoils) r = act(r, { type: isAttack(r.spoils) || ['expenseAccount', 'prospect', 'thinkTank', 'bridgeFuel', 'carbonOffsets', 'carbonCapture', 'influencers', 'recycling'].includes(r.spoils) ? 'takeSpoils' : 'sellSpoils' })
      r = act(r, { type: 'continue' })
    }
    else if (r.phase === 'stageComplete' && r.stage < stopAt) r = act(r, { type: 'continue' })
    else break
  }
  return r
}
