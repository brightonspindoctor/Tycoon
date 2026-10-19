// Run history and progress, kept in this browser.
export interface RunRecord {
  id: string
  date: string
  industry: string
  rounds: number // rounds reached, out of 16
  outcome: string
  gold: number | null // only recorded for a finished game
  completed: boolean
  stageGold: number
}

const KEY = 'tycoon.runs.v1'
const MUTE = 'tycoon.muted'

export function loadRuns(): RunRecord[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '[]') as RunRecord[] } catch { return [] }
}

export function saveRun(rec: RunRecord) {
  try {
    const runs = loadRuns().filter(r => r.id !== rec.id)
    runs.unshift(rec)
    localStorage.setItem(KEY, JSON.stringify(runs.slice(0, 200)))
  } catch { /* storage unavailable: history just isn't kept */ }
}

export function completedIndustries(): string[] {
  return [...new Set(loadRuns().filter(r => r.completed).map(r => r.industry))]
}

export function bestScore(industry: string): number | null {
  const scores = loadRuns().filter(r => r.industry === industry && r.gold !== null).map(r => r.gold as number)
  return scores.length ? Math.max(...scores) : null
}

export function loadMuted(): boolean {
  try { return localStorage.getItem(MUTE) === '1' } catch { return false }
}
export function saveMuted(m: boolean) {
  try { localStorage.setItem(MUTE, m ? '1' : '0') } catch { /* ignore */ }
}

/** How many runs in a row, most recent first, ended before the end of stage 1. */
export function lossStreak(runs: RunRecord[]): number {
  let n = 0
  for (const r of runs) { // newest first
    const lostInStage1 = !r.completed && r.rounds <= 4 && (r.outcome === 'Bankrupt' || r.outcome === 'Out of time')
    if (!lostInStage1) break
    n++
  }
  return n
}

/** The Trust Fund is offered after enough stage 1 losses in a row. */
export const trustFundOffered = (needed: number) => lossStreak(loadRuns()) >= needed
