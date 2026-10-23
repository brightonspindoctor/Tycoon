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
  tactic?: string // the badge a won game earned
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

const VOLUME = 'tycoon.volume'
const INSTALL_SEEN = 'tycoon.installPromptSeen'
const REPLAY = 'tycoon.replay'
const WELCOMED = 'tycoon.welcomed'

/** The welcome screen shows once, before your first run ever. */
export function welcomeSeen(): boolean {
  try { return localStorage.getItem(WELCOMED) === '1' || loadRuns().length > 0 } catch { return true }
}
export function markWelcomed() {
  try { localStorage.setItem(WELCOMED, '1') } catch { /* ignore */ }
}

export type Replay = 'normal' | 'fast' | 'off'
export function loadReplay(): Replay {
  try { const v = localStorage.getItem(REPLAY); return v === 'fast' || v === 'off' ? v : 'normal' } catch { return 'normal' }
}
export function saveReplay(v: Replay) {
  try { localStorage.setItem(REPLAY, v) } catch { /* ignore */ }
}

export function loadVolume(): number {
  try { const v = Number(localStorage.getItem(VOLUME)); return localStorage.getItem(VOLUME) === null || Number.isNaN(v) ? 0.8 : Math.min(1, Math.max(0, v)) } catch { return 0.8 }
}
export function saveVolume(v: number) {
  try { localStorage.setItem(VOLUME, String(v)) } catch { /* ignore */ }
}
export function installPromptSeen(): boolean {
  try { return localStorage.getItem(INSTALL_SEEN) === '1' } catch { return true }
}
export function markInstallPromptSeen() {
  try { localStorage.setItem(INSTALL_SEEN, '1') } catch { /* ignore */ }
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
    if (r.outcome === 'Quit') continue // walking away doesn't count either way
    const lostInStage1 = !r.completed && r.rounds <= 4 && (r.outcome === 'Bankrupt' || r.outcome === 'Out of time')
    if (!lostInStage1) break
    n++
  }
  return n
}

/** The Trust Fund is earned by enough stage 1 losses in a row, and then stays on offer for good. */
export const trustFundOffered = (needed: number) => !!loadUnlocks().trustFund || lossStreak(loadRuns()) >= needed

const UNLOCKS = 'tycoon.unlocks'
/** What earlier runs have unlocked for every later one: Baron → +1 storage, Proxy Fight → Old Faithful, Geneva → the Slush Fund, a losing streak → the Trust Fund. */
export function loadUnlocks(): { baron?: boolean; proxy?: boolean; geneva?: boolean; trustFund?: boolean } {
  try { return JSON.parse(localStorage.getItem(UNLOCKS) ?? '{}') } catch { return {} }
}
export function saveUnlock(k: 'baron' | 'proxy' | 'geneva' | 'trustFund') {
  try { localStorage.setItem(UNLOCKS, JSON.stringify({ ...loadUnlocks(), [k]: true })) } catch { /* not kept */ }
}

const ADMIN = 'tycoon.admin'
/** Admin mode: playtest tools. Turned on in Settings with the PIN (?admin=0 turns it off). */
export function loadAdmin(): boolean {
  try { return localStorage.getItem(ADMIN) === '1' } catch { return false }
}
export function saveAdmin(on: boolean) {
  try { localStorage.setItem(ADMIN, on ? '1' : '0') } catch { /* ignore */ }
}
