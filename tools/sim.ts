// Balance check: play many stage 1 runs with the bot and report how far they get.
// Run with: npm run sim
import { newRun } from '../src/engine/engine'
import type { BonusKey } from '../src/engine/data'
import { botRun } from './bot'

const N = 2000
const bonuses: BonusKey[] = ['extraProspect', 'threeOil', 'pettyCash', 'gearGraft', 'trustFund']
for (const b of bonuses) {
  const reach = [0, 0, 0, 0, 0]
  let wins = 0, gold = 0
  const killers: Record<string, number> = {}
  for (let i = 0; i < N; i++) {
    const r = botRun(newRun(1000 + i, b))
    if (r.phase === 'stageComplete') { wins++; gold += r.gold }
    else for (const k of r.loss?.by ?? []) killers[`R${r.round} ${k}`] = (killers[`R${r.round} ${k}`] ?? 0) + 1
    const done = r.phase === 'stageComplete' ? 4 : r.round - 1
    for (let k = 1; k <= done; k++) reach[k]++
  }
  const pct = (x: number) => `${((100 * x) / N).toFixed(1)}%`
  const top = Object.entries(killers).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k, v]) => `${k} ${pct(v)}`).join(', ')
  console.log(`${b.padEnd(14)} R1 ${pct(reach[1])}  R2 ${pct(reach[2])}  R3 ${pct(reach[3])}  boss ${pct(wins)}  gold ${(gold / Math.max(1, wins)).toFixed(1)}  | ${top}`)
}
