// Balance check: play many runs with the bot and report how far they get, stage by stage.
// Run with: npm run sim
import { newRun, type Run } from '../src/engine/engine'
import type { BonusKey } from '../src/engine/data'
import { botRun } from './bot'

const N = Number(process.argv[2] ?? 2000)
const bonuses: BonusKey[] = ['extraProspect', 'threeOil', 'pettyCash', 'gearGraft', 'trustFund']
const pct = (x: number, of = N) => `${((100 * x) / Math.max(1, of)).toFixed(1)}%`.padStart(6)
const roundsCleared = (r: Run) => (r.phase === 'stageComplete' ? r.stage * 4 : (r.stage - 1) * 4 + Math.max(0, r.round - 1))

console.log('Stage 1: % of all runs that clear each round. Stage 2: % of stage 1 winners.')
const s2killers: Record<string, number> = {}
const s2reasons: Record<string, number> = {}
let allS2 = 0, allS2wins = 0, exposureEnd = 0
for (const b of bonuses) {
  const reach = Array(9).fill(0)
  let s1wins = 0, s2wins = 0, gold = 0
  const killers: Record<string, number> = {}
  for (let i = 0; i < N; i++) {
    const r = botRun(newRun(1000 + i, b))
    const done = roundsCleared(r)
    for (let k = 1; k <= done; k++) reach[k]++
    if (done >= 4) s1wins++
    if (r.stage === 2 && r.phase === 'stageComplete') { s2wins++; gold += r.gold; exposureEnd += r.exposure }
    if (r.phase === 'lost') {
      const key = `S${r.stage}R${r.round} ${r.loss?.by[0] ?? 'debt'}`
      if (r.stage === 1) killers[key] = (killers[key] ?? 0) + 1
      else { s2killers[key] = (s2killers[key] ?? 0) + 1; s2reasons[r.loss!.reason] = (s2reasons[r.loss!.reason] ?? 0) + 1 }
    }
  }
  allS2 += s1wins; allS2wins += s2wins
  const top = Object.entries(killers).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([k, v]) => `${k} ${pct(v).trim()}`).join(', ')
  console.log(`${b.padEnd(14)} S1: R1${pct(reach[1])} R2${pct(reach[2])} R3${pct(reach[3])} boss${pct(s1wins)} | S2: R1${pct(reach[5], s1wins)} R2${pct(reach[6], s1wins)} R3${pct(reach[7], s1wins)} boss${pct(s2wins, s1wins)}  gold ${(gold / Math.max(1, s2wins)).toFixed(1)}  | ${top}`)
}
const top2 = Object.entries(s2killers).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => `${k} ${pct(v, allS2).trim()}`).join(', ')
console.log(`Stage 2 overall: ${pct(allS2wins, allS2).trim()} of ${allS2} stage 1 winners. Exposure at the end ${(exposureEnd / Math.max(1, allS2wins)).toFixed(1)}. Losses: ${JSON.stringify(s2reasons)}`)
console.log(`Stage 2 killers: ${top2}`)
