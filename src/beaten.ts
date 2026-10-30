// Every liability you have beaten, kept on the device. The glossary's Liabilities tab shows them.
import { THREATS, type ThreatKind } from './engine/data'

const KEY = 'tycoon.beaten'
export function loadBeaten(): ThreatKind[] {
  try { return (JSON.parse(localStorage.getItem(KEY) ?? '[]') as ThreatKind[]).filter(k => k in THREATS) } catch { return [] }
}
/** Marks these as beaten; returns the ones beaten for the first time. */
export function noteBeaten(kinds: ThreatKind[]): ThreatKind[] {
  const had = new Set(loadBeaten())
  const fresh = [...new Set(kinds)].filter(k => !had.has(k))
  if (!fresh.length) return []
  try { localStorage.setItem(KEY, JSON.stringify([...had, ...fresh])) } catch { return [] }
  return fresh
}
