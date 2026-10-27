// Balance check: play many runs with the bot and report how far they get, stage by stage.
// Run with: npm run sim
import { newRun, type Run } from '../src/engine/engine'
import type { BonusKey } from '../src/engine/data'
import { botHooks, botRun } from './bot'

const N = Number(process.argv[2] ?? 2000)
const bonuses: BonusKey[] = ['extraProspect', 'threeOil', 'pettyCash', 'gearGraft', 'trustFund', 'oldFaithful', 'slushFund', 'none']
const pct = (x: number, of = N) => `${((100 * x) / Math.max(1, of)).toFixed(1)}%`.padStart(6)
// rounds cleared: 4 a stage, then stage 4's five fights (the Truth is round 17)
const roundsCleared = (r: Run) => (r.phase === 'stageComplete' ? (r.stage >= 4 ? 17 : r.stage * 4) : (r.stage - 1) * 4 + Math.max(0, r.round - 1))

console.log('Stage 1: % of all runs that clear each round. Each later stage: % of the previous stage\'s winners.')
const killers: Record<number, Record<string, number>> = { 2: {}, 3: {}, 4: {} }
const reasons: Record<number, Record<string, number>> = { 2: {}, 3: {}, 4: {} }
let allS2 = 0, allS2wins = 0, allS3wins = 0, allS4wins = 0, heatEnd = 0, clockAtTruth = 0, metTruth = 0, goldEnd = 0
for (const b of bonuses) {
  const reach = Array(18).fill(0)
  let s1wins = 0, s2wins = 0, s3wins = 0, s4wins = 0
  const k1: Record<string, number> = {}
  for (let i = 0; i < N; i++) {
    // Heat has to be read the moment stage 3 is won: going Big Oil straight after resets it to 0
    let heatAtWin: number | null = null
    botHooks.onAct = x => { if (x.stage === 3 && x.phase === 'stageComplete') heatAtWin = x.heat }
    const r = botRun(newRun(1000 + i, b))
    botHooks.onAct = undefined
    const done = roundsCleared(r)
    for (let k = 1; k <= done; k++) reach[k]++
    if (done >= 4) s1wins++
    if (done >= 8) s2wins++
    if (done >= 12) { s3wins++; heatEnd += heatAtWin ?? 0 }
    if (r.stage === 4 && r.round === 5) { metTruth++; clockAtTruth += r.threats.find(t => t.kind === 'truth')?.entryHour ?? 0 }
    if (r.stage === 4 && r.phase === 'stageComplete') { s4wins++; goldEnd += r.gold }
    if (r.phase === 'lost') {
      const key = `S${r.stage}R${r.round} ${r.loss?.by[0] ?? 'debt'}`
      if (r.stage === 1) k1[key] = (k1[key] ?? 0) + 1
      else { killers[r.stage][key] = (killers[r.stage][key] ?? 0) + 1; reasons[r.stage][r.loss!.reason] = (reasons[r.stage][r.loss!.reason] ?? 0) + 1 }
    }
  }
  allS2 += s1wins; allS2wins += s2wins; allS3wins += s3wins; allS4wins += s4wins
  const top = Object.entries(k1).sort((a, b) => b[1] - a[1]).slice(0, 1).map(([k, v]) => `${k} ${pct(v).trim()}`).join(', ')
  console.log(`${b.padEnd(14)} S1${pct(s1wins)} | S2 boss${pct(s2wins, s1wins)} | S3 boss${pct(s3wins, s2wins)} | S4: R1${pct(reach[13], s3wins)} R2${pct(reach[14], s3wins)} R3${pct(reach[15], s3wins)} R4${pct(reach[16], s3wins)} Truth${pct(s4wins, s3wins)} | ${top}`)
}
const of = { 2: allS2, 3: allS2wins, 4: allS3wins } as Record<number, number>
const wins = { 2: allS2wins, 3: allS3wins, 4: allS4wins } as Record<number, number>
for (const st of [2, 3, 4]) {
  const top = Object.entries(killers[st]).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => `${k} ${pct(v, of[st]).trim()}`).join(', ')
  console.log(`Stage ${st} overall: ${pct(wins[st], of[st]).trim()} of ${of[st]}. Losses: ${JSON.stringify(reasons[st])}`)
  console.log(`  killers: ${top}`)
}
console.log(`Stage 3 Heat at the end (winners): ${(heatEnd / Math.max(1, allS3wins)).toFixed(0)} · Clock when meeting the Truth: ${(clockAtTruth / Math.max(1, metTruth)).toFixed(1)} o'clock · Gold at the end (winners): ${(goldEnd / Math.max(1, allS4wins)).toFixed(1)}`)
