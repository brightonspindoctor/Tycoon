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
const UNLOCKS = 'tycoon.unlocks.v1'

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

// Unlocks earned so far. Kept apart from run history so trimming history never takes one away.
export function loadUnlocks(): string[] {
  try { return JSON.parse(localStorage.getItem(UNLOCKS) ?? '[]') as string[] } catch { return [] }
}
function saveUnlock(key: string) {
  try { localStorage.setItem(UNLOCKS, JSON.stringify([...new Set([...loadUnlocks(), key])])) } catch { /* ignore */ }
}

/** Runs that ended before the end of stage 1 (bankrupt or out of time). */
export const stage1Losses = () => loadRuns().filter(r => r.industry === 'Oil' && r.rounds <= 4 && r.outcome !== 'Stage 1 complete' && !r.completed).length

/** Unlocks the Trust Fund once enough stage 1 runs are lost. True only on the run that unlocks it. */
export function checkTrustFund(needed: number): boolean {
  if (loadUnlocks().includes('trustFund') || stage1Losses() < needed) return false
  saveUnlock('trustFund')
  return true
}
