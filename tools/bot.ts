// A simple rule-following player, used by the tests and the balance simulator.
import { act, canPlay, canUpgrade, cardDef, handTargetsFor, intent, isAttack, liveThreats, netPrice, skimRate, type Run } from '../src/engine/engine'
import { CARDS, PROSPECT_FOR, type CardKey } from '../src/engine/data'
import { CONFIG } from '../src/engine/config'

// which cards are worth upgrading first
const UPGRADE_ORDER: CardKey[] = ['lawyerUp', 'payWages', 'hiredHand', 'patentThicket', 'espionage', 'dynamite', 'payDividend', 'expenseAccount', 'improveGear', 'shoreUp', 'insurance']

/** Stage 1 → 2: take the loan when cash is short, upgrade the best cards, drop junk. */
export function botIncorporate(r: Run): Run {
  if (r.capital < 20) r = act(r, { type: 'takeLoan' })
  for (const c of r.deck.filter(x => CARDS[x.key].junk)) if (r.capital > r.destroyCost + 8) r = act(r, { type: 'destroyCard', cardId: c.id })
  for (const k of UPGRADE_ORDER) {
    const c = r.deck.find(x => x.key === k && canUpgrade(x))
    if (c && r.capital > r.upgradeCost + 16) r = act(r, { type: 'upgradeCard', cardId: c.id })
  }
  return act(r, { type: 'leaveShop' })
}

export function botShop(r: Run): Run {
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
    : ['payWages', 'dynamite', 'lawyerUp', 'fireBrigade', 'shoreUp']
  for (let i = 0; i < r.shop.cards.length; i++) {
    const k = r.shop.cards[i]
    if (k && want.includes(k) && r.capital > (CARDS[k].price ?? 0) + 7) { r = act(r, { type: 'buyCard', slot: i }); break }
  }
  if ((r.shop.item === 'storageTank' || r.shop.item === 'refinery' || r.shop.item === 'offshore') && r.capital > 14) r = act(r, { type: 'buyItem' })
  if (stage2) {
    const up = UPGRADE_ORDER.map(k => r.deck.find(x => x.key === k && canUpgrade(x))).find(Boolean)
    if (up && r.capital > r.upgradeCost + 14) r = act(r, { type: 'upgradeCard', cardId: up.id })
  }
  return act(r, { type: 'leaveShop' })
}

const TAKES_GOLD = ['Expose', 'Clawback']

export function botTurn(r: Run): Run {
  for (let guard = 0; guard < 40 && r.phase === 'turn'; guard++) {
    const playable = r.hand.filter(c => canPlay(r, c).ok)
    const forced = playable.find(c => CARDS[c.key].forced)
    const find = (k: string) => playable.find(c => c.key === k)
    const water = find('fireBrigade') ?? find('extinguisher') ?? find('bucket')
    const attack = playable.find(c => isAttack(c.key))
    const building = playable.find(c => c.key === 'well' || c.key === 'wildcat')
    const prospect = playable.find(c => ['prospect', 'survey', 'oldProspect'].includes(c.key))
    const graft = find('hardGraft')
    const petty = find('pettyCash')
    const stop = find('shoreUp') ?? find('securityDetail')
    const draw = find('telegraphLine') ?? find('tickerTape') ?? (r.capital > 8 ? find('efficiencyExpert') : undefined)
    const rig = find('rotaryRig') ?? find('derrick')
    const expense = r.exposure <= 3 && r.capital > skimRate(r) + 12 ? find('expenseAccount') : undefined
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

/** Plays a whole run: through stage 1, the incorporation, and stage 2 (or stops at `stopAt`). */
export function botRun(r: Run, stopAt = 2): Run {
  for (let guard = 0; guard < 900; guard++) {
    if (r.phase === 'shop') r = botShop(r)
    else if (r.phase === 'turn') r = botTurn(r)
    else if (r.phase === 'incorporate') r = botIncorporate(r)
    else if (r.phase === 'roundWon') {
      if (r.spoils) r = act(r, { type: isAttack(r.spoils) || r.spoils === 'prospect' || r.spoils === 'rotaryRig' ? 'takeSpoils' : 'sellSpoils' })
      r = act(r, { type: 'continue' })
    }
    else if (r.phase === 'stageComplete' && r.stage < stopAt) r = act(r, { type: 'continue' })
    else break
  }
  return r
}
