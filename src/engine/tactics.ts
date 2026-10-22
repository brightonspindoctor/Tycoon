// Hidden tactics: never shown during play. At the end of a won game, the run's
// play style earns one badge on the results screen.
import { CONFIG } from './config'

export interface Tally {
  damage: Record<string, number> // Hold taken off enemies, by card family
  blocks: number // enemy moves stopped
  absorbed: number // damage and Heat soaked up by your Cover
  destroyed: number // cards destroyed for good
  cooled: number // Heat taken off by your own cards and the lobbying firm, plus hours wound back on the Truth clock
  rounds: number // rounds won
  quick: number // rounds won in CONFIG.tactics.quickTurns turns or fewer
}
export const newTally = (): Tally => ({ damage: {}, blocks: 0, absorbed: 0, destroyed: 0, cooled: 0, rounds: 0, quick: 0 })

export type TacticKey = 'leanOperation' | 'fortress' | 'oilBaron' | 'spinDoctor' | 'lawyeredUp' | 'blitz'
export const TACTICS: Record<TacticKey, { name: string; text: string; icon: string }> = {
  leanOperation: { name: 'Lean Operation', text: 'A small deck, cut to the bone.', icon: 'streamline' },
  fortress: { name: 'Fortress', text: 'Nothing got through.', icon: 'securityDetail' },
  oilBaron: { name: 'Oil Baron', text: 'You just sold more oil than anyone.', icon: 'derrick' },
  spinDoctor: { name: 'Spin Doctor', text: 'The story never caught up with you.', icon: 'lobbyCongress' },
  lawyeredUp: { name: 'Lawyered Up', text: 'Every problem had a solicitor.', icon: 'patentThicket' },
  blitz: { name: 'Blitz', text: 'They never saw you coming.', icon: 'telegraphLine' },
}

/** What each tactic measures, for a finished run. */
export function tacticScores(t: Tally, deckSize: number, oilSold: number): Record<TacticKey, number> {
  const dealt = Object.values(t.damage).reduce((a, b) => a + b, 0)
  return {
    leanOperation: deckSize <= CONFIG.tactics.leanDeckMax ? t.destroyed : 0,
    fortress: t.blocks * CONFIG.tactics.blockWorth + t.absorbed,
    oilBaron: oilSold, // barrels, across the whole run
    spinDoctor: t.cooled,
    lawyeredUp: dealt ? (t.damage.Legal ?? 0) / dealt : 0,
    blitz: t.rounds ? t.quick / t.rounds : 0,
  }
}

/** The badge a won game earns: the tactic that stands out most against its bar, or none. */
export function tacticFor(t: Tally | undefined, deckSize: number, oilSold: number): TacticKey | null {
  if (!t) return null
  const s = tacticScores(t, deckSize, oilSold)
  let best: TacticKey | null = null, bestRatio = 1
  for (const k of Object.keys(s) as TacticKey[]) {
    const ratio = s[k] / CONFIG.tactics.bar[k]
    if (ratio >= bestRatio) { best = k; bestRatio = ratio }
  }
  return best
}
