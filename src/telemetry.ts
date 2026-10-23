// Anonymous play data and the global scoreboard, in the Supabase project "tycoon".
// No names, emails or IP addresses are kept: a player is a random ID made on this device.
// Players can switch it off in Settings. Every call is fire-and-forget: if it fails, the game carries on.
import { isInstalled } from './install'

const URL_ = 'https://owhyrbplhdigomtxrokh.supabase.co/rest/v1/rpc/'
const KEY = 'sb_publishable_IwxfoEJ5_88Rm5od9xCQ1w_pdNhM63G' // publishable: safe in the browser, it can only call the tycoon_* functions
const PLAYER = 'tycoon.player'
const SHARE = 'tycoon.shareData'
const VERSION = '2026.10'

const store = {
  get: (k: string) => { try { return localStorage.getItem(k) } catch { return null } },
  set: (k: string, v: string) => { try { localStorage.setItem(k, v) } catch { /* not kept */ } },
}
const uuid = () => (crypto.randomUUID?.() ?? 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = (Math.random() * 16) | 0; return (c === 'x' ? r : (r & 3) | 8).toString(16) }))

/** Sharing anonymous play data: on unless the player turned it off. */
export const sharing = () => store.get(SHARE) !== '0'
export function setSharing(on: boolean) { store.set(SHARE, on ? '1' : '0'); if (on) void hello() }

function playerId(): string {
  let id = store.get(PLAYER)
  if (!id) { id = uuid(); store.set(PLAYER, id) }
  return id
}

async function call<T = unknown>(fn: string, args: Record<string, unknown>, opts: { keepalive?: boolean; always?: boolean } = {}): Promise<T | null> {
  if (!opts.always && !sharing()) return null
  try {
    const res = await fetch(URL_ + fn, {
      method: 'POST', keepalive: opts.keepalive,
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(args),
    })
    if (!res.ok) return null
    const text = await res.text()
    return (text ? JSON.parse(text) : null) as T
  } catch { return null }
}

const platform = () => (/iPad|Tablet/.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && window.innerWidth > 760) ? 'tablet' : window.innerWidth <= 760 ? 'mobile' : 'desktop')

// ------------------------------------------------------------- sessions and time played
let session: string | null = null
let pinger: number | undefined
export async function hello() {
  if (!sharing() || session) return
  session = await call<string>('tycoon_hello', { p_player: playerId(), p_platform: platform(), p_version: VERSION, p_installed: isInstalled() })
  if (!session) return
  window.clearInterval(pinger)
  // a ping every minute while the game is on screen: how long people play
  pinger = window.setInterval(() => { if (document.visibilityState === 'visible' && session) void call('tycoon_ping', { p_session: session }) }, 60_000)
}
if (typeof window !== 'undefined') {
  window.addEventListener('appinstalled', () => void call('tycoon_installed', { p_player: playerId() }))
}

// ------------------------------------------------------------- runs and rounds
interface Current { id: string; seed: number; bonus: string; activeMs: number; since: number | null }
let current: Current | null = null
const tick = () => { if (current?.since != null) { current.activeMs += Date.now() - current.since; current.since = null } }
if (typeof document !== 'undefined') {
  // only time with the game on screen counts towards a run
  document.addEventListener('visibilitychange', () => { if (!current) return; if (document.visibilityState === 'visible') current.since ??= Date.now(); else tick() })
}

export function runStarted(seed: number, bonus: string) {
  current = { id: uuid(), seed, bonus, activeMs: 0, since: Date.now() }
  void call('tycoon_run_start', { p_run: current.id, p_player: playerId(), p_bonus: bonus })
}

export function roundEnded(seed: number, stage: number, round: number, enemies: string[], won: boolean, turns: number) {
  if (current?.seed !== seed) return
  void call('tycoon_round', { p_run: current.id, p_player: playerId(), p_stage: stage, p_round: round, p_enemies: enemies, p_won: won, p_turns: turns })
}

export interface RunEnd { outcome: string; stage: number; round: number; roundsReached: number; killedBy?: string; gold?: number; tactic?: string; clock?: number }
/** Returns the run's ID, for putting a won game on the scoreboard. */
export function runEnded(seed: number, e: RunEnd): string | null {
  if (current?.seed !== seed) return null
  tick()
  const id = current.id
  const args = {
    p_run: id, p_player: playerId(), p_outcome: e.outcome, p_stage: e.stage, p_round: e.round, p_rounds_reached: e.roundsReached,
    p_killed_by: e.killedBy ?? null, p_gold: e.gold ?? null, p_tactic: e.tactic ?? null, p_clock: e.clock ?? null, p_seconds: Math.round(current.activeMs / 1000),
  }
  void call('tycoon_run_end', args, { keepalive: true })
  last = { id, bonus: current.bonus, args }
  current = null
  return id
}

// ------------------------------------------------------------- the global scoreboard
export interface GlobalScore { name: string; gold: number; tactic: string | null; created_at: string }
/** Puts a won game on the global scoreboard. This one goes even with play data off: the player asked for it. */
let last: { id: string; bonus: string; args: Record<string, unknown> } | null = null
export async function submitScore(runId: string, name: string): Promise<boolean> {
  // with play data off, the won game itself still has to reach the scoreboard
  if (!sharing() && last?.id === runId) {
    await call('tycoon_hello', { p_player: playerId(), p_platform: platform(), p_version: VERSION, p_installed: isInstalled() }, { always: true })
    await call('tycoon_run_start', { p_run: runId, p_player: playerId(), p_bonus: last.bonus }, { always: true })
    await call('tycoon_run_end', last.args, { always: true })
  }
  try {
    const res = await fetch(URL_ + 'tycoon_submit_score', { method: 'POST', headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ p_run: runId, p_player: playerId(), p_name: name }) })
    return res.ok
  } catch { return false }
}
export const loadGlobalScores = (limit = 50) => call<GlobalScore[]>('tycoon_scoreboard', { p_limit: limit }, { always: true })
