// Small seeded random number generator (mulberry32). The state lives in the run,
// so a run can be replayed exactly from its seed.
export function next(state: { rng: number }): number {
  state.rng = (state.rng + 0x6d2b79f5) | 0
  let t = state.rng
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

export function pick<T>(state: { rng: number }, items: readonly T[]): T {
  return items[Math.floor(next(state) * items.length)]
}

export function shuffle<T>(state: { rng: number }, items: T[]): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(next(state) * (i + 1))
    ;[items[i], items[j]] = [items[j], items[i]]
  }
  return items
}

export function sample<T>(state: { rng: number }, items: readonly T[], n: number): T[] {
  return shuffle(state, [...items]).slice(0, n)
}
