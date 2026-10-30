// The tutorial's script and rules: a new player's first fight, played to a script (the hands are dealt by the engine,
// see TUTORIAL_HANDS), then a nudge to buy a second Prospect. Each step says what to do and why, lights up
// the thing it means, and blocks everything else until it's done.
import type { CardKey } from '../engine/data'
import { CONFIG } from '../engine/config'
import { netPrice, type Action, type Run } from '../engine/engine'

export type Focus = 'threat' | 'ap' | 'card' | 'endTurn' | 'capital' | 'stock' | 'sell' | 'fire' | 'field' | 'prospect'
type Wait = { next: true } | { play: CardKey } | { sell: true } | { endTurn: true } | { leave: true }
interface Step { phase: 'turn' | 'shop'; turn?: number; text: (r: Run) => string; focus?: Focus; wait: Wait }

export const STEPS: Step[] = [
  // turn 1
  { phase: 'turn', turn: 1, focus: 'threat', wait: { next: true }, text: () => 'Your first fight. This is a liability: the Squatter. Bring its Hold to 0 to beat it.' },
  { phase: 'turn', turn: 1, focus: 'threat', wait: { next: true }, text: () => `Liabilities show their next move. When you end your turn, his Shakedown costs you $${CONFIG.shakedown}.` },
  { phase: 'turn', turn: 1, focus: 'ap', wait: { next: true }, text: () => `You get ${CONFIG.baseAP} AP, action points, a turn. A card's AP cost is in its top corner.` },
  { phase: 'turn', turn: 1, focus: 'card', wait: { play: 'hardGraft' }, text: () => 'Hard Graft costs 0 AP and gives you 1 more. Play it.' },
  { phase: 'turn', turn: 1, focus: 'card', wait: { play: 'prospect' }, text: () => 'Prospect costs 2 AP. It claims 2 plots of land and puts 2 Well cards in your hand. Play it.' },
  { phase: 'turn', turn: 1, focus: 'card', wait: { play: 'well' }, text: () => `A Well costs 1 AP. It pumps 1 oil a turn until it runs dry after ${CONFIG.wellReserve}. Build one.` },
  { phase: 'turn', turn: 1, focus: 'endTurn', wait: { endTurn: true }, text: () => 'No AP left. Cards you didn\'t play go to the discard pile. End your turn.' },
  // turn 2
  { phase: 'turn', turn: 2, focus: 'capital', wait: { next: true }, text: r => `The Shakedown took $${CONFIG.shakedown}${r.debt ? `, and Bank Debt takes $${r.debt} a turn` : ''}. Capital is the company's money. At $0 you are bankrupt.` },
  { phase: 'turn', turn: 2, focus: 'card', wait: { play: 'improveGear' }, text: () => 'Another Shakedown is coming. Improve Gear costs $1 and gives 4 Cover. Cover blocks money you would lose this turn. Play it.' },
  { phase: 'turn', turn: 2, focus: 'card', wait: { play: 'hiredHand' }, text: () => 'Now hit back. Hired Hand removes 2 Hold. Play it.' },
  { phase: 'turn', turn: 2, focus: 'endTurn', wait: { endTurn: true }, text: () => 'End your turn. Your Cover takes the Shakedown.' },
  // turn 3
  { phase: 'turn', turn: 3, focus: 'stock', wait: { next: true }, text: r => `Cover blocked it all. Your Well pumps at the start of each turn: ${r.oil} oil in the stockpile so far.` },
  { phase: 'turn', turn: 3, focus: 'sell', wait: { sell: true }, text: r => `Oil sells for $${netPrice(r)} a barrel. Selling the lot costs 1 AP. Sell it.` },
  { phase: 'turn', turn: 3, focus: 'card', wait: { play: 'lawyerUp' }, text: () => 'Lawyer Up costs $2 and removes 3 Hold. Play it.' },
  { phase: 'turn', turn: 3, focus: 'threat', wait: { next: true }, text: () => 'Next he starts a fire. Shore Up would block it. Let it happen, this once.' },
  { phase: 'turn', turn: 3, focus: 'endTurn', wait: { endTurn: true }, text: () => 'End your turn.' },
  // turn 4
  { phase: 'turn', turn: 4, focus: 'fire', wait: { next: true }, text: () => 'Fire. Your pumps stop while it burns. At the end of each turn it burns your oil, or a Well if you have none.' },
  { phase: 'turn', turn: 4, focus: 'card', wait: { play: 'bucket' }, text: () => 'Bucket of Water puts out one fire. Play it.' },
  { phase: 'turn', turn: 4, focus: 'card', wait: { play: 'hiredHand' }, text: r => `The Squatter has ${r.threats[0]?.hold ?? 2} Hold left. Finish him.` },
  // the Land Office
  { phase: 'shop', focus: 'prospect', wait: { leave: true }, text: () => 'The Land Office. Buy a second Prospect: more land, more Wells, more oil. The next fight is yours. Every word and card you play is in the glossary, the book at the top.' },
]

/** What the board lets you do during this step. Everything else waits. */
export interface CoachGate { focus?: Focus; play?: CardKey; sell?: boolean; endTurn?: boolean }
/** What a screen needs to show the coach: the step, and what it allows. */
export interface CoachView extends CoachGate { text: string; no: number; of: number; next?: () => void; skip: () => void }

/** The step showing now, if this screen is where it belongs. */
export function coachFor(step: number | null, r: Run | null, skip: () => void, next: () => void): CoachView | undefined {
  if (step === null || !r) return undefined
  const s = STEPS[step]
  if (!s || s.phase !== r.phase || (s.turn && s.turn !== r.turn)) return undefined
  const w = s.wait
  return {
    text: s.text(r), no: step + 1, of: STEPS.length, skip, focus: s.focus,
    next: 'next' in w ? next : undefined,
    play: 'play' in w ? w.play : undefined, sell: 'sell' in w, endTurn: 'endTurn' in w,
  }
}

/** Does this action finish the step? (Only if it worked: the run changed.) */
export function stepDone(step: number, a: Action, prev: Run, next: Run): boolean {
  const w = STEPS[step]?.wait
  if (!w || next === prev) return false
  if ('play' in w) return a.type === 'play' && prev.hand.find(c => c.id === a.cardId)?.key === w.play && !next.hand.some(c => c.id === a.cardId)
  if ('sell' in w) return a.type === 'sellOil' && next.oil < prev.oil
  if ('endTurn' in w) return a.type === 'endTurn' && next.turn !== prev.turn
  if ('leave' in w) return a.type === 'leaveShop' && next.phase !== 'shop'
  return false
}

/** Allowed by the coach? With no coach, everything is. */
export const lets = {
  card: (c: CoachGate | undefined, key: CardKey) => !c || c.play === key,
  sell: (c: CoachGate | undefined) => !c || !!c.sell,
  endTurn: (c: CoachGate | undefined) => !c || !!c.endTurn,
  other: (c: CoachGate | undefined) => !c, // selling Wells, the Firebreak, the Shredder: not in the tutorial
}
export const lit = (c: CoachGate | undefined, f: Focus) => (c?.focus === f ? 'is-coached' : '')
