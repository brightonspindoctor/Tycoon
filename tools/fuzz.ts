// Rules fuzzer: plays thousands of runs with random (often silly) actions and checks,
// after every single action, that the game never reaches an impossible state.
// Run with: npm run fuzz
import { act, canPlay, handSize, handTargetsFor, intent, intentText, newRun, targetsFor, wellValue, type Action, type Run } from '../src/engine/engine'
import { BONUSES, BOONS, CARDS, ITEMS, REWARDS, bossRound, type BonusKey } from '../src/engine/data'
import { CONFIG } from '../src/engine/config'
import { botIncorporate, botShop, botTurn } from './bot'
import { adminStart, ADMIN_DEFAULTS } from '../src/engine/admin'

let seed = 12345
const rand = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff }
const pick = <T,>(xs: T[]): T => xs[Math.floor(rand() * xs.length)]

function randomAction(r: Run): Action {
  if (r.phase === 'roundWon') return r.spoils ? { type: rand() < 0.5 ? 'takeSpoils' : 'sellSpoils' } : { type: 'continue' }
  if (r.phase === 'stageComplete') return { type: 'continue' }
  if (r.phase === 'incorporate') {
    const opts: Action[] = [{ type: 'leaveShop' }, { type: 'takeLoan' }, { type: 'skim', gold: 1 }, { type: 'buyCard', slot: 0 }, { type: 'payDividends' }, { type: 'buySilo' }]
    if (r.offer?.length) opts.push({ type: 'pickCard', key: pick(r.offer) }, { type: 'pickCard', key: pick(r.offer) })
    if (r.deck.length) opts.push({ type: 'duplicateCard', cardId: pick(r.deck).id })
    if (r.deck.length) opts.push({ type: 'destroyCard', cardId: pick(r.deck).id }, { type: 'upgradeCard', cardId: pick(r.deck).id })
    if (r.offer && (r.picked ?? []).length < 2 && rand() < 0.5) return { type: 'pickCard', key: pick(r.offer) }
    return rand() < 0.2 ? { type: 'leaveShop' } : pick(opts)
  }
  if (r.phase === 'shop') {
    const opts: Action[] = [{ type: 'leaveShop' }, { type: 'buyProspect' }, { type: 'buyBucket' }, { type: 'buyBoon' }, { type: 'buyItem' },
      { type: 'takeLoan' }, { type: 'reroll' }, { type: 'skim', gold: 1 + Math.floor(rand() * 3) }, { type: 'buyCard', slot: Math.floor(rand() * 3) }, { type: 'payDividends' }, { type: 'buySilo' }]
    if (r.deck.length) opts.push({ type: 'duplicateCard', cardId: pick(r.deck).id })
    if (r.deck.length) { opts.push({ type: 'destroyCard', cardId: pick(r.deck).id }, { type: 'upgradeCard', cardId: pick(r.deck).id }) }
    return rand() < 0.25 ? { type: 'leaveShop' } : pick(opts)
  }
  const opts: Action[] = [{ type: 'endTurn' }, { type: 'sellOil' }, { type: 'firebreak' }, { type: 'sellWell', plot: Math.floor(rand() * 6) - 1 }]
  if (r.hand.length) opts.push({ type: 'shred', cardId: pick(r.hand).id })
  for (const c of r.hand) {
    const ts = r.threats.map(t => t.id)
    opts.push({ type: 'play', cardId: c.id, target: rand() < 0.7 ? pick(ts) : undefined })
    const hs = handTargetsFor(r, c)
    if (hs.length) opts.push({ type: 'play', cardId: c.id, target: pick(hs).id })
    if (canPlay(r, c).ok) opts.push({ type: 'play', cardId: c.id, target: targetsFor(r, c)[0]?.id }) // weight playable cards
  }
  opts.push({ type: 'play', cardId: 999999 }) // a card that doesn't exist
  return rand() < 0.15 ? { type: 'endTurn' } : pick(opts)
}

/** One action the bot would take (its first choice this turn), so chaos runs still make progress. */
function botStep(r: Run): Action {
  const playable = r.hand.filter(c => canPlay(r, c).ok)
  const forced = playable.find(c => CARDS[c.key].forced)
  if (forced) return { type: 'play', cardId: forced.id }
  const attack = playable.find(c => targetsFor(r, c).length && c.key !== 'shoreUp')
  if (attack) return { type: 'play', cardId: attack.id, target: targetsFor(r, attack)[0].id }
  const any = playable[0]
  if (any) return { type: 'play', cardId: any.id, target: targetsFor(r, any)[0]?.id }
  if (r.oil > 0 && r.ap > 0) return { type: 'sellOil' }
  return { type: 'endTurn' }
}

function check(r: Run, prev: Run, a: Action): string | null {
  const piles = [...r.draw, ...r.hand, ...r.discard]
  const ids = piles.map(c => c.id)
  if (new Set(ids).size !== ids.length) return 'a card is in two places at once'
  const deckIds = new Set(r.deck.map(c => c.id))
  if (new Set(r.deck.map(c => c.id)).size !== r.deck.length) return 'duplicate card in deck'
  for (const c of piles) if (!c.temp && !deckIds.has(c.id)) return `${c.key} in a pile but not in the deck`
  if (r.phase === 'turn') {
    const pileIds = new Set(ids)
    for (const c of r.deck) if (!pileIds.has(c.id) && !CARDS[c.key].oncePerRound) return `${c.key} in the deck but in no pile`
  }
  for (const c of r.deck) if (c.uses !== null && c.uses <= 0) return `${c.key} with ${c.uses} uses still in the deck`
  if (r.fire < 0 || r.fire > CONFIG.fireMax) return `fire ${r.fire}`
  if (r.oil < 0 || r.oil > r.storage) return `oil ${r.oil} of ${r.storage}`
  if (r.plots.length > CONFIG.maxPlots) return `${r.plots.length} plots`
  for (const w of r.plots) if (w && wellValue(w) <= 0) return `a plot that sells for nothing: ${JSON.stringify(w)}`
  if (a.type === 'duplicateCard' && r.phase === 'shop' && r.shop.duplicated && !prev.shop.duplicated && r.deck.length !== prev.deck.length + 1) return 'duplicate did not add exactly one card'
  for (const w of r.plots) if (w && ((!w.field && !w.lasting && !w.rig && !w.faithful && w.reserve <= 0) || w.output <= 0)) return `well ${JSON.stringify(w)}`
  if (r.gold < 0 && !(r.phase === 'lost' && r.loss?.reason === 'ruined')) return `gold ${r.gold}`
  if (r.gold < 0 && r.phase !== 'lost') return `gold ${r.gold} but still playing`
  if (r.exposure < 0 || r.exposure > CONFIG.exposureMax) return `exposure ${r.exposure}`
  if (r.exposure >= CONFIG.exposureMax && r.phase !== 'lost') return `exposure ${r.exposure} but not ousted`
  if (r.stage === 1 && r.exposure !== 0) return 'Board Exposure in stage 1'
  if (r.stage !== 3 && r.heat !== 0) return `Heat ${r.heat} outside stage 3`
  if (r.heat < 0 || r.heat > CONFIG.heatMax) return `heat ${r.heat}`
  if (r.heat >= CONFIG.heatMax && r.phase !== 'lost') return 'Heat at the top but not broken up'
  if (r.loss?.reason === 'brokenUp' && r.heat < CONFIG.heatMax) return 'broken up below the top'
  if (r.stage === 3 && r.fire) return 'a fire in stage 3'
  if (r.stage === 3 && r.phase === 'turn' && r.debt) return 'Bank Debt in stage 3'
  if (r.deck.some(c => c.up2 && !c.up)) return 'a second upgrade without a first'
  if (r.deck.filter(c => c.key === 'oilShock').length > 1) return 'two Oil Shocks'
  if (r.stage >= 3 && r.deck.some(c => c.key === 'badBlood')) return 'fire-starting Bad Blood after stage 2'
  if (r.stage < 3 && r.deck.some(c => c.key === 'badBloodLate')) return 'the $5 Bad Blood before stage 3'
  if (r.phase === 'incorporate' && r.stage === 4 && prev.phase === 'incorporate' && prev.bigOilStep === 'pick' && r.bigOilStep === 'pick' && r.deck.length < prev.deck.length) return 'a card destroyed while picking'
  if (r.stage === 3 && r.plots.some(w => w && !w.rig)) return 'a stage 3 plot that is not a Rig'
  if (r.stage === 3 && r.storage - r.tempStorage > Math.max(CONFIG.maxStorage, prev.storage - prev.tempStorage)) return `storage ${r.storage}` // storage brought from stage 2 can sit above the Supertanker cap
  if (r.stage === 3 && r.phase === 'shop' && r.shop.cards.some(k => k && (CARDS[k].era ?? 1) < 3 && k !== 'tickerTape')) return 'an old card in the stage 3 shop'
  if (r.stage === 3 && r.phase === 'shop' && r.shop.item && !(ITEMS[r.shop.item].stages ?? []).includes(3)) return 'an old item in the stage 3 shop'
  if (r.deck.some(c => c.faded && c.up)) return 'a faded card that is upgraded'
  if (r.stage < 3 && r.deck.some(c => c.faded)) return 'a faded card before stage 3'
  if (r.stage === 2 && r.deck.some(c => c.key === 'prospect')) return 'a fresh Prospect in stage 2'
  if (r.stage === 2 && r.plots.some(w => w && (w.output !== CONFIG.stage2Output || !(w.field || w.lasting)))) return 'a stage 2 Well that pumps other than 1 or runs dry'
  if (r.stage === 2 && r.phase === 'shop' && r.shop.cards.some(k => k && (CARDS[k].era ?? 1) < 2)) return 'a stage 1 card in the stage 2 shop'
  if (r.stage === 2 && r.phase === 'shop' && r.shop.item && !(ITEMS[r.shop.item].stages ?? []).includes(2)) return 'a stage 1 item in the stage 2 shop'
  if ((r.silos ?? 0) > CONFIG.silo2Max) return 'too many Silos'
  // stage 4
  if (r.stage === 4 && ((r.clock ?? 0) < 1 || (r.clock ?? 0) > CONFIG.clockMax)) return `clock ${r.clock}`
  if (r.stage === 4 && (r.clock ?? 0) >= CONFIG.clockMax && r.phase !== 'lost') return 'midnight but still playing'
  if (r.loss?.reason === 'midnight' && (r.clock ?? 0) < CONFIG.clockMax) return 'lost at midnight before midnight'
  if (r.stage === 4 && r.plots.some(w => w && !w.rig)) return 'a stage 4 plot that is not a Rig'
  if (r.stage === 4 && r.storage - r.tempStorage > Math.max(CONFIG.maxStorage4, prev.storage - prev.tempStorage)) return `storage ${r.storage}`
  if (r.stage === 4 && r.phase === 'shop' && r.shop.cards.some(k => k && (CARDS[k].era ?? 1) < 4)) return 'an old card in the stage 4 shop'
  if (r.stage === 4 && r.phase === 'shop' && r.shop.item && !(ITEMS[r.shop.item].stages ?? []).includes(4)) return 'an old item in the stage 4 shop'
  if (r.stage === 4 && r.phase === 'turn' && r.round < bossRound(4) && r.threats.length !== 1) return 'two stage 4 enemies at once'
  if ((r.met ?? []).length !== new Set(r.met ?? []).size) return 'a stage 4 enemy met twice'
  if (r.deck.filter(c => c.key === 'influencers').length > 1 || false) return 'two copies of a one-in-the-game card'
  if (r.phase === 'shop' && r.shop.cards.some(k => k && CARDS[k].unique && (r.uniques ?? []).includes(k))) return 'a one-in-the-game card offered again'
  for (const t of r.threats) if (t.kind === 'truth' && ((t.phase ?? 0) < 0 || (t.phase ?? 0) > 3 || t.maxHold !== CONFIG.truthPhaseHold)) return `Truth phase ${t.phase} hold ${t.maxHold}`
  if (r.threats.some(t => t.kind === 'truth' && t.beaten) && r.threats.some(t => t.kind === 'truth' && (t.phase ?? 0) < 3)) return 'the Truth fell before its last phase'
  if (r.loss?.reason === 'ousted' && r.exposure < CONFIG.exposureMax) return 'ousted below the top'
  if (r.loss?.reason === 'ruined' && r.gold >= 0) return 'ruined with gold left'
  if (r.ap < 0) return `ap ${r.ap}`
  if (r.phase !== 'lost' && r.capital <= 0) return `capital ${r.capital} but phase ${r.phase}`
  if ((r.round < 1 && r.phase !== 'incorporate' && !(r.phase === 'shop' && r.stage === 4)) || r.round > bossRound(r.stage)) return `round ${r.round}` // stage 4 opens the shop before round 1
  if (r.phase === 'incorporate' && (r.stage < 2 || r.round !== 0)) return 'incorporating mid-stage'
  if (r.phase === 'incorporate' && r.stage === 2 && prev.phase === 'stageComplete' && r.plots.some(w => w && !w.field)) return 'a Well that did not become a Field'
  if (r.phase === 'incorporate' && r.stage === 3 && prev.phase === 'stageComplete' && r.plots.length !== prev.plots.filter(Boolean).length) return 'a Field that did not become a Rig'
  if (r.phase === 'incorporate' && r.stage === 3 && r.deck.some(c => ['prospect', 'oldProspect', 'derrick', 'well', 'bucket'].includes(c.key))) return 'an old land or fire card survived going multinational'
  if (r.phase === 'stageComplete' && r.round !== bossRound(r.stage)) return 'stage complete before the boss'
  if (r.phase === 'roundWon' && r.round >= bossRound(r.stage)) return 'roundWon in the boss round'
  if ((r.phase === 'roundWon' || r.phase === 'stageComplete') && r.threats.some(t => !t.beaten)) return 'round won with an enemy standing'
  if (r.phase === 'turn' && !r.threats.some(t => !t.beaten) && !r.fire) return 'turn with no enemy standing and no fire'
  if ((r.phase === 'roundWon' || r.phase === 'stageComplete') && prev.phase === 'turn' && r.fire) return 'round ended with a fire burning'
  for (const t of r.threats) {
    if (t.hold > t.maxHold) return `${t.kind} hold ${t.hold}/${t.maxHold}`
    if (t.beaten !== (t.hold <= 0)) return `${t.kind} beaten=${t.beaten} hold=${t.hold}`
    if (!t.beaten && r.phase === 'turn') { if (!intent(r, t)) return `${t.kind} has no move`; if (!intentText(r, t)) return `${t.kind} move has no text` }
  }
  if (r.marked !== null && (r.marked < 0 || r.marked >= r.plots.length)) return `marked plot ${r.marked}`
  if (a.type === 'endTurn' && r.phase === 'turn' && prev.phase === 'turn') {
    const extra = r.round === bossRound(r.stage) && r.turn === 1 && r.boon === 'spareRigs' ? 2 : 0
    if (r.hand.length > handSize(r) + extra) return `hand of ${r.hand.length} after drawing`
  }
  if (JSON.stringify(r).includes('null,"amount"') || /NaN|Infinity/.test(JSON.stringify({ c: r.capital, g: r.gold, o: r.oil, f: r.fire, ap: r.ap }))) return 'NaN somewhere'
  if (!Number.isFinite(r.capital) || !Number.isFinite(r.ap)) return 'non-finite number'
  if (r.shop.cards.length > 3) return 'shop has more than 3 cards'
  if (r.phase === 'turn' && r.ledger[0]?.label === 'Brought forward') {
    const sum = r.ledger.reduce((s, l) => s + l.amount, 0)
    if (sum !== r.capital) return `ledger adds up to ${sum} but capital is ${r.capital}`
  }
  if (r.phase === 'roundWon' && prev.phase === 'turn' && !r.spoils) return 'round won with no spoils offered'
  if (r.phase === 'stageComplete' && prev.phase === 'turn' && r.gold < prev.gold + CONFIG.bossGold - 3) return 'no gold for beating the boss'
  if (r.phase === 'shop' && prev.phase === 'roundWon' && (r.shop.boon !== null) !== (r.round === bossRound(r.stage) - 1)) return `pre-boss item offered after round ${r.round}`
  if (r.phase === 'stageComplete' && prev.phase === 'turn' && r.stage < 4) {
    if (!r.reward) return 'stage complete with no reward'
    if (r.boon && REWARDS[r.reward].type === BOONS[r.boon].type) return 'reward is the same type as the pre-boss item'
    if (r.tempStorage) return 'temporary silo still counted after the stage'
  }
  if (a.type === 'play' && prev.hand.find(c => c.id === a.cardId)?.key === 'telegram' && r.hand.length > prev.hand.length - 1) {
    const help = r.hand.find(c => c.temp && !prev.hand.some(p => p.id === c.id))
    if (help && !help.free) return 'Telegram card is not free'
  }
  return null
}

const bonuses = Object.keys(BONUSES) as BonusKey[]
const RUNS = Number(process.argv[2] ?? 3000)
let actions = 0, problems = 0
const ends: Record<string, number> = {}
const seen = new Map<string, string>()
for (let i = 0; i < RUNS; i++) {
  // a third of the runs start straight in stage 3 (as admin mode does), so stage 3 gets real coverage
  const s3 = i % 4 === 2, s4 = i % 4 === 3
  let r = s4 ? adminStart(1 + i * 7919, { ...ADMIN_DEFAULTS, stage: 4, start: i % 2 ? 'incorporate' : 1 + (i % 5) as 1 | 2 | 3 | 4 | 5, wells: i % 6, capital: 20 + (i % 5) * 20, gold: i % 9, deck: i % 2 ? 'strong' : 'starter', clock: 1 + (i % 10) })
    : s3 ? adminStart(1 + i * 7919, { ...ADMIN_DEFAULTS, stage: 3, start: i % 2 ? 'incorporate' : 1 + (i % 4) as 1 | 2 | 3 | 4, wells: i % 6, capital: 10 + (i % 5) * 10, gold: i % 7, deck: i % 2 ? 'strong' : 'starter' }) : newRun(1 + i * 7919, bonuses[i % bonuses.length])
  if (s3 || s4) r.admin = false // checked like a normal run
  if (!s3) r.gold = i % 3 // some runs have gold to spend on the Bribe and the pre-boss item
  const log: string[] = []
  // play sensibly with the bot up to a chosen round, then act at random from there
  const chaosFrom = 1 + (i % 4)
  // some runs play sensibly through stage 1 (and 2) first, so chaos also reaches stages 2 and 3
  const chaosStage = s4 ? 4 : s3 ? 3 : 1 + (i % 4)
  const before = (x: Run) => x.stage < chaosStage || (x.stage === chaosStage && x.round < chaosFrom)
  for (let g = 0; g < 1400 && before(r) && r.phase !== 'lost' && !(r.phase === 'stageComplete' && r.stage === 4); g++) {
    const prev = r
    if (r.phase === 'shop') r = botShop(r)
    else if (r.phase === 'turn') r = botTurn(r)
    else if (r.phase === 'incorporate') r = botIncorporate(r)
    else if (r.phase === 'stageComplete') r = act(r, { type: 'continue' })
    else if (r.phase === 'roundWon') r = act(act(r, { type: 'takeSpoils' }), { type: 'continue' })
    const bad = check(r, prev, { type: 'continue' })
    if (bad) { if (!seen.has(bad)) seen.set(bad, `run ${i} (bot) round ${r.round} turn ${r.turn}`); problems++; break }
  }
  for (let step = 0; step < 3000 && r.phase !== 'lost' && !(r.phase === 'stageComplete' && r.stage === 4); step++) {
    const a = rand() < 0.5 && r.phase === 'turn' ? botStep(r) : randomAction(r)
    let next: Run
    try { next = act(r, a) } catch (e) { const k = `crash: ${(e as Error).message}`; if (!seen.has(k)) seen.set(k, `${log.slice(-6).join(' > ')} > ${JSON.stringify(a)}`); problems++; break }
    actions++
    log.push(`${a.type}${'cardId' in a ? ':' + (r.hand.find(c => c.id === a.cardId)?.key ?? '?') : ''}`)
    const bad = check(next, r, a)
    if (bad) { if (!seen.has(bad)) seen.set(bad, `run ${i} round ${next.round} turn ${next.turn}: ${log.slice(-6).join(' > ')}`); problems++; break }
    r = next
  }
  ends[`${r.phase} S${r.stage}`] = (ends[`${r.phase} S${r.stage}`] ?? 0) + 1
}
console.log(`${RUNS} runs, ${actions} actions, ${problems} problems. Ended: ${JSON.stringify(ends)}`)
for (const [k, v] of seen) console.log(`- ${k}\n    ${v}`)
