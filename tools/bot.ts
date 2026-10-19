// A simple rule-following player, used by the tests and the balance simulator.
import { act, canPlay, isAttack, netPrice, type Run } from '../src/engine/engine'
import { CARDS } from '../src/engine/data'

export function botShop(r: Run): Run {
  // destroy junk, buy a Prospect if land is left, buy one attack card, then leave
  const junk = r.deck.find(c => CARDS[c.key].junk)
  if (junk && r.capital > r.destroyCost + 6) r = act(r, { type: 'destroyCard', cardId: junk.id })
  // Prospect is single use: rebuy one when there is land to claim or an empty plot to fill
  const roomForWells = r.plots.length < 5 || r.plots.some(p => !p)
  if (roomForWells && !r.deck.some(c => c.key === 'prospect') && r.capital > r.prospectPrice + 6) r = act(r, { type: 'buyProspect' })
  const want = ['payWages', 'dynamite', 'lawyerUp', 'fireBrigade', 'shoreUp']
  for (let i = 0; i < r.shop.cards.length; i++) {
    const k = r.shop.cards[i]
    if (k && want.includes(k) && r.capital > (CARDS[k].price ?? 0) + 7) { r = act(r, { type: 'buyCard', slot: i }); break }
  }
  if (r.shop.item === 'storageTank' && r.capital > 11) r = act(r, { type: 'buyItem' })
  return act(r, { type: 'leaveShop' })
}

export function botTurn(r: Run): Run {
  for (let guard = 0; guard < 30 && r.phase === 'turn'; guard++) {
    const playable = r.hand.filter(c => canPlay(r, c).ok)
    const forced = playable.find(c => CARDS[c.key].forced)
    const find = (k: string) => playable.find(c => c.key === k)
    const water = find('fireBrigade') ?? find('bucket')
    const attack = playable.find(c => isAttack(c.key))
    const building = playable.find(c => c.key === 'well' || c.key === 'wildcat')
    const prospect = find('prospect')
    const graft = find('hardGraft')
    const petty = find('pettyCash')
    const stop = find('shoreUp')
    let choice: Run | null = null
    if (forced) choice = act(r, { type: 'play', cardId: forced.id })
    else if (r.fire && water) choice = act(r, { type: 'play', cardId: water.id })
    else if (r.oil > 0 && netPrice(r) > 0 && !r.current.refuse && (r.capital <= 6 || r.oil >= r.storage - 1)) choice = act(r, { type: 'sellOil' })
    else if (building) choice = act(r, { type: 'play', cardId: building.id })
    else if (prospect && !r.hand.some(c => c.key === 'well') && r.plots.every(Boolean)) choice = act(r, { type: 'play', cardId: prospect.id })
    else if (attack) choice = act(r, { type: 'play', cardId: attack.id })
    else if (r.oil > 0 && netPrice(r) > 0 && !r.current.refuse) choice = act(r, { type: 'sellOil' })
    else if (stop) choice = act(r, { type: 'play', cardId: stop.id })
    else if (petty && r.capital > 10) choice = act(r, { type: 'play', cardId: petty.id })
    else if (graft && r.ap === 0 && r.hand.some(c => c.key !== 'hardGraft' && CARDS[c.key].ap === 1)) choice = act(r, { type: 'play', cardId: graft.id })
    if (!choice || choice === r || JSON.stringify(choice) === JSON.stringify(r)) break
    r = choice
  }
  return r.phase === 'turn' ? act(r, { type: 'endTurn' }) : r
}

export function botRun(r: Run): Run {
  for (let guard = 0; guard < 400; guard++) {
    if (r.phase === 'shop') r = botShop(r)
    else if (r.phase === 'turn') r = botTurn(r)
    else if (r.phase === 'roundWon') {
      if (r.spoils) r = act(r, { type: isAttack(r.spoils) || r.spoils === 'prospect' ? 'takeSpoils' : 'sellSpoils' })
      r = act(r, { type: 'continue' })
    }
    else break
  }
  return r
}
