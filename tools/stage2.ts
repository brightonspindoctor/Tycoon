// Stage 2 playtest: thousands of bot runs started straight in stage 2 (as in admin mode),
// broken down by round and enemy, across starting positions and play styles.
// Run with: npx vite-node tools/stage2.ts [runs]
import { adminStart, ADMIN_DEFAULTS, type AdminStart } from '../src/engine/admin'
import { act, type Run } from '../src/engine/engine'
import { THREATS } from '../src/engine/data'
import { botShop, botStyle, botTurn } from './bot'

const N = Number(process.argv[2] ?? 2000)
const pct = (x: number, of: number) => `${((100 * x) / Math.max(1, of)).toFixed(0)}%`

interface Fight { round: number; enemies: string; won: boolean; turns: number; capDelta: number }
function play(seed: number, o: AdminStart) {
  let r: Run = adminStart(seed, o)
  const fights: Fight[] = []
  let cur: { round: number; enemies: string; cap: number } | null = null
  const shopCap: number[] = []
  for (let g = 0; g < 900; g++) {
    if (r.phase === 'turn') {
      if (!cur || cur.round !== r.round) cur = { round: r.round, enemies: r.threats.map(t => THREATS[t.kind].name.replace('The ', '')).join(' + '), cap: r.capital }
      const turn = r.turn
      r = botTurn(r)
      if (r.phase !== 'turn') fights.push({ round: cur.round, enemies: cur.enemies, won: r.phase === 'roundWon' || r.phase === 'stageComplete', turns: turn, capDelta: r.capital - cur.cap })
    } else if (r.phase === 'shop') { shopCap[r.round] = r.capital; r = botShop(r) }
    else if (r.phase === 'roundWon') r = act(act(r, { type: r.spoils && ['patentThicket', 'espionage', 'poachEngineer', 'securityDetail'].includes(r.spoils) ? 'takeSpoils' : 'sellSpoils' }), { type: 'continue' })
    else break
  }
  return { r, fights, shopCap }
}

function report(label: string, o: AdminStart) {
  const reach = [0, 0, 0, 0, 0], reasons: Record<string, number> = {}, killers: Record<string, number> = {}
  const byEnemy: Record<string, { n: number; won: number; turns: number; cap: number }> = {}
  const turnsByRound = [0, 0, 0, 0, 0], countByRound = [0, 0, 0, 0, 0], shop = [0, 0, 0, 0], shopN = [0, 0, 0, 0]
  let wins = 0, gold = 0, exposure = 0, expAll = 0, quick = 0
  for (let i = 0; i < N; i++) {
    const { r, fights, shopCap } = play(5000 + i, o)
    for (const f of fights) {
      const e = (byEnemy[`R${f.round} ${f.enemies}`] ??= { n: 0, won: 0, turns: 0, cap: 0 })
      e.n++; e.turns += f.turns; e.cap += f.capDelta; if (f.won) { e.won++; reach[f.round]++; if (f.turns <= 3) quick++ }
      turnsByRound[f.round] += f.turns; countByRound[f.round]++
    }
    shopCap.forEach((c, k) => { if (c !== undefined) { shop[k] += c; shopN[k]++ } })
    expAll += r.exposure
    if (r.phase === 'stageComplete') { wins++; gold += r.gold; exposure += r.exposure }
    else { reasons[r.loss?.reason ?? '?'] = (reasons[r.loss?.reason ?? '?'] ?? 0) + 1; const k = `R${r.round} ${r.loss?.by[0] ?? r.loss?.reason}`; killers[k] = (killers[k] ?? 0) + 1 }
  }
  console.log(`\n## ${label}`)
  console.log(`Clears: R1 ${pct(reach[1], N)} · R2 ${pct(reach[2], N)} · R3 ${pct(reach[3], N)} · boss ${pct(wins, N)}   gold at the end ${(gold / Math.max(1, wins)).toFixed(1)}, Exposure at the end ${(exposure / Math.max(1, wins)).toFixed(1)}`)
  console.log(`Turns per fight: ${[1, 2, 3, 4].map(k => `R${k} ${(turnsByRound[k] / Math.max(1, countByRound[k])).toFixed(1)}`).join(' · ')}   quick wins (≤3 turns): ${pct(quick, reach.reduce((a, b) => a + b, 0))} of fights won`)
  console.log(`Capital entering the shop: ${[1, 2, 3].map(k => `after R${k} $${(shop[k] / Math.max(1, shopN[k])).toFixed(0)}K`).join(' · ')}`)
  console.log(`Losses: ${Object.entries(reasons).map(([k, v]) => `${k} ${pct(v, N)}`).join(', ')}`)
  console.log(`Top killers: ${Object.entries(killers).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, v]) => `${k} ${pct(v, N)}`).join(', ')}`)
  return byEnemy
}

botStyle.skim = 'normal'
const base = report('Default start: 2 Fields, $20K, 3 gold, Exposure 0, starter deck, normal skimming', ADMIN_DEFAULTS)
console.log('\nPer fight (default start): appearances · win % · average turns · average Capital change')
for (const [k, v] of Object.entries(base).sort()) if (v.n >= N / 40) console.log(`  ${k.padEnd(48)} ${String(v.n).padStart(5)} · ${pct(v.won, v.n).padStart(4)} · ${(v.turns / v.n).toFixed(1)} turns · ${v.cap / v.n >= 0 ? '+' : ''}${(v.cap / v.n).toFixed(1)}K`)
report('Weak start: 0 Fields, $10K, 0 gold', { ...ADMIN_DEFAULTS, wells: 0, capital: 10, gold: 0 })
report('Strong start: 4 Fields, $35K, 6 gold, strong deck', { ...ADMIN_DEFAULTS, wells: 4, capital: 35, gold: 6, deck: 'strong' })
botStyle.skim = 'none'
report('Default start, never skims', ADMIN_DEFAULTS)
botStyle.skim = 'greedy'
report('Default start, greedy skimming (up to Exposure 5)', ADMIN_DEFAULTS)
