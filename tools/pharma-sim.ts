// Pharmaceutical balance check: the bot plays many stage 1 runs and reports how far they get.
// Run with: npm run sim:pharma [runs]
import { PTHREATS } from '../src/engine/pharma/data'
import { newPharmaRun } from '../src/engine/pharma/engine'
import { pharmaBot } from './pharma-bot'
const N = Number(process.argv[2] ?? 2000)
const reach = [0, 0, 0, 0, 0]
const loss: Record<string, number> = {}
let wins = 0, capital = 0, deaths = 0
for (let i = 0; i < N; i++) {
  const r = pharmaBot(newPharmaRun(1000 + i))
  for (let k = 1; k < r.round; k++) reach[k]++
  if (r.phase === 'won') { wins++; capital += r.capital }
  if (r.phase === 'lost') { const key = `R${r.round} ${r.loss!.reason} vs ${r.threats.filter(x => !x.beaten).map(x => PTHREATS[x.kind].name).join(' + ')}`; loss[key] = (loss[key] ?? 0) + 1 }
  deaths += r.stats.deaths
}
const pct = (x: number) => `${((100 * x) / N).toFixed(1)}%`
console.log(`Pharmaceutical stage 1 · ${N} bot runs`)
console.log(`Cleared round 1 ${pct(reach[1])} · 2 ${pct(reach[2])} · 3 ${pct(reach[3])} · boss ${pct(wins)}`)
console.log(`Winners end with $${(capital / Math.max(1, wins)).toFixed(1)} on average · deaths per run ${(deaths / N).toFixed(2)}`)
console.log('Top losses:')
for (const [k, v] of Object.entries(loss).sort((a, b) => b[1] - a[1]).slice(0, 10)) console.log(`  ${pct(v).padStart(6)}  ${k}`)
