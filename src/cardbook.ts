// Every card you have played, and how often, kept on the device. The glossary's Cards tab lists them.
import { CARDS, type CardKey } from './engine/data'

const KEY = 'tycoon.cardsPlayed'
export type Played = Partial<Record<CardKey, number>>

export function loadPlayed(): Played {
  try {
    const all = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Played
    return Object.fromEntries(Object.entries(all).filter(([k]) => k in CARDS)) as Played // a card since removed from the game is dropped
  } catch { return {} }
}

/** Counts one play of this card. Returns true the first time it's played. */
export function notePlayed(key: CardKey): boolean {
  const all = loadPlayed()
  const first = !all[key]
  all[key] = (all[key] ?? 0) + 1
  try { localStorage.setItem(KEY, JSON.stringify(all)) } catch { /* not kept */ }
  return first
}
