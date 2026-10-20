// Money grows a unit every stage (same value underneath): $15 → $15K → $15M → $15B.
const UNITS = ['', '', 'K', 'M', 'B']

/** Puts the stage's unit on every "$N" in a line of game text: "Lose $4." → "Lose $4K." */
export function units(text: string, stage = 1): string {
  const unit = UNITS[Math.min(stage, 4)]
  return unit ? text.replace(/\$(\d+)(?![KMB\d])/g, `$$$1${unit}`) : text
}

export const STAGE_TITLE: Record<number, string> = { 1: 'The Wildcat Years', 2: 'The Boardroom Years' }
export const FIELD_PLACE: Record<number, string> = { 1: 'Titusville', 2: 'Spindletop' }
export const SHOP_NAME: Record<number, string> = { 1: 'The Land Office', 2: 'The Exchange' }
export const ERA_LABEL: Record<number, string> = { 1: '1860s', 2: '1900s', 3: '1950s', 4: '1990s' }

export function money(n: number, stage = 1, sign = false): string {
  const unit = UNITS[Math.min(stage, 4)]
  const s = `$${Math.abs(n)}${unit}`
  if (n < 0) return `−${s}`
  return sign && n > 0 ? `+${s}` : s
}

// Each stage spans an era; each round moves the calendar on.
const YEARS: Record<number, number[]> = {
  1: [1863, 1870, 1880, 1890],
  2: [1901, 1910, 1920, 1930],
  3: [1946, 1955, 1965, 1973],
  4: [1988, 1997, 2009, 2026],
}
export function year(stage: number, round: number): number {
  return YEARS[stage]?.[Math.max(0, Math.min(3, round - 1))] ?? 1863
}

export const ERA_THEME: Record<number, string> = { 1: 'victorian', 2: 'deco', 3: 'midcentury', 4: 'greenwash' }
