// Money grows a unit every stage (same value underneath): $15 → $15K → $15M → $15B.
const UNITS = ['', '', 'K', 'M', 'B']

/** Puts the stage's unit on every "$N" in a line of game text: "Lose $4." → "Lose $4K." */
export function units(text: string, stage = 1): string {
  const unit = UNITS[Math.min(stage, 4)]
  return unit ? text.replace(/\$(\d+)(?![KMB\d])/g, `$$$1${unit}`) : text
}

export const STAGE_TITLE: Record<number, string> = { 1: 'The Wildcat Years', 2: 'The Boardroom Years', 3: 'The Multinational Years', 4: 'Big Oil' }
export const FIELD_PLACE: Record<number, string> = { 1: 'Titusville', 2: 'Spindletop', 3: 'Gulf of Mexico', 4: 'Worldwide' }
export const SHOP_NAME: Record<number, string> = { 1: 'The Land Office', 2: 'The Exchange', 3: 'The Trading Floor', 4: 'The Investor Portal' }
export const ERA_LABEL: Record<number, string> = { 1: '1860s', 2: '1900s', 3: '1970s', 4: '2010s' }

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
  3: [1970, 1973, 1976, 1979], // the boss is the 1979 climate conference in Geneva
  4: [2010, 2012, 2014, 2016, 2019], // Deepwater Horizon, the fracking boom, Paris, then the school strikes and the Truth
}
export function year(stage: number, round: number): number {
  const ys = YEARS[stage] ?? YEARS[1]
  return ys[Math.max(0, Math.min(ys.length - 1, round - 1))]
}

export const ERA_THEME: Record<number, string> = { 1: 'victorian', 2: 'deco', 3: 'seventies', 4: 'greenwash' }
