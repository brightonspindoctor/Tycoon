// Balance check: play many runs with the bot and report how far they get, stage by stage.
// Run with: npm run sim
import { newRun, type Run } from '../src/engine/engine'
import type { BonusKey } from '../src/engine/data'
import { botRun } from './bot'

const N = Number(process.argv[2] ?? 2000)
const bonuses: BonusKey[] = ['extraProspect', 'threeOil', 'pettyCash', 'gearGraft', 'trustFund']
const pct = (x: number, of = N) => `${((100 * x) / Math.max(1, of)).toFixed(1)}%`.padStart(6)
const roundsCleared = (r: Run) => (r.phase === 'stageComplete' ? r.stage * 4 : (r.stage - 1) * 4 + Math.max(0, r.round - 1))

console.log('Stage 1: % of all runs that clear each round. Stage 2: % of stage 1 winners. Stage 3: % of stage 2 winners.')
const killers: Record<number, Record<string, number>> = { 2: {}, 3: {} }
const reasons: Record<number, Record<string, number>> = { 2: {}, 3: {} }
let allS2 = 0, allS2wins = 0, allS3wins = 0, heatEnd = 0
for (const b of bonuses) {
  const reach = Array(13).fill(0)
  let s1wins = 0, s2wins = 0, s3wins = 0
  const k1: Record<string, number> = {}
  for (let i = 0; i < N; i++) {
    const r = botRun(newRun(1000 + i, b))
    const done = roundsCleared(r)
    for (let k = 1; k <= done; k++) reach[k]++
    if (done >= 4) s1wins++
    if (done >= 8) { s2wins++ }
    if (r.stage === 3 && r.phase === 'stageComplete') { s3wins++; heatEnd += r.heat }
    if (r.phase === 'lost') {
      const key = `S${r.stage}R${r.round} ${r.loss?.by[0] ?? 'debt'}`
      if (r.stage === 1) k1[key] = (k1[key] ?? 0) + 1
      else { killers[r.stage][key] = (killers[r.stage][key] ?? 0) + 1; reasons[r.stage][r.loss!.reason] = (reasons[r.stage][r.loss!.reason] ?? 0) + 1 }
    }
  }
  allS2 += s1wins; allS2wins += s2wins; allS3wins += s3wins
  const top = Object.entries(k1).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([k, v]) => `${k} ${pct(v).trim()}`).join(', ')
  console.log(`${b.padEnd(14)} S1 boss${pct(s1wins)} | S2: R1${pct(reach[5], s1wins)} R2${pct(reach[6], s1wins)} R3${pct(reach[7], s1wins)} boss${pct(s2wins, s1wins)} | S3: R1${pct(reach[9], s2wins)} R2${pct(reach[10], s2wins)} R3${pct(reach[11], s2wins)} boss${pct(s3wins, s2wins)} | ${top}`)
}
for (const st of [2, 3]) {
  const of = st === 2 ? allS2 : allS2wins
  const top = Object.entries(killers[st]).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => `${k} ${pct(v, of).trim()}`).join(', ')
  console.log(`Stage ${st} overall: ${pct(st === 2 ? allS2wins : allS3wins, of).trim()} of ${of}. Losses: ${JSON.stringify(reasons[st])}`)
  console.log(`  killers: ${top}`)
}
console.log(`Stage 3 Heat at the end (winners): ${(heatEnd / Math.max(1, allS3wins)).toFixed(0)}`)
