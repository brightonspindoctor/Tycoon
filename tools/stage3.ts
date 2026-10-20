// Stage 3 playtest: bot runs started straight in stage 3 (as in admin mode), broken down by round and enemy.
// Run with: npx vite-node tools/stage3.ts
import { adminStart, ADMIN_DEFAULTS } from '../src/engine/admin'
import { act, type Run } from '../src/engine/engine'
import { THREATS } from '../src/engine/data'
import { botShop, botTurn, botIncorporate } from './bot'
const N = 1000
const rounds: Record<number, { turns: number; heat: number; cap: number; n: number }> = {}
const enemy: Record<string, { n: number; won: number; turns: number; cap: number; heat: number }> = {}
let wins = 0; const reasons: Record<string, number> = {}; let capEnd = 0, goldEnd = 0
for (let i = 0; i < N; i++) {
  let r: Run = adminStart(7000 + i, { ...ADMIN_DEFAULTS, stage: 3, start: 'incorporate', wells: 3, capital: 30, gold: 5 })
  r = botIncorporate(r)
  let cur: { round: number; heat: number; cap: number; e: string } | null = null
  for (let g = 0; g < 900; g++) {
    if (r.phase === 'turn') {
      if (!cur || cur.round !== r.round) cur = { round: r.round, heat: r.heat, cap: r.capital, e: r.threats.map(t => THREATS[t.kind].name).join('+') }
      const t = r.turn
      r = botTurn(r)
      if (r.phase !== 'turn') {
        const x = (rounds[cur.round] ??= { turns: 0, heat: 0, cap: 0, n: 0 }); x.n++; x.turns += t; x.heat += r.heat - cur.heat; x.cap += r.capital - cur.cap
        const e = (enemy[`R${cur.round} ${cur.e}`] ??= { n: 0, won: 0, turns: 0, cap: 0, heat: 0 }); e.n++; e.turns += t; e.heat += r.heat - cur.heat; e.cap += r.capital - cur.cap; if (r.phase !== 'lost') e.won++
      }
    } else if (r.phase === 'shop') r = botShop(r)
    else if (r.phase === 'roundWon') r = act(act(r, { type: 'takeSpoils' }), { type: 'continue' })
    else break
  }
  if (r.phase === 'stageComplete') { wins++; capEnd += r.capital; goldEnd += r.gold } else reasons[r.loss!.reason] = (reasons[r.loss!.reason] ?? 0) + 1
}
console.log('wins', wins / N, JSON.stringify(reasons), 'cap at end', (capEnd / wins).toFixed(0), 'gold', (goldEnd / wins).toFixed(1))
for (const [k, v] of Object.entries(rounds)) console.log(`R${k} turns ${(v.turns / v.n).toFixed(1)} heat +${(v.heat / v.n).toFixed(1)} cap ${(v.cap / v.n).toFixed(1)}`)
for (const [k, v] of Object.entries(enemy).sort()) if (v.n > 20) console.log(`${k.padEnd(50)} n${v.n} win ${(100 * v.won / v.n).toFixed(0)}% turns ${(v.turns / v.n).toFixed(1)} heat +${(v.heat / v.n).toFixed(0)} cap ${(v.cap / v.n).toFixed(0)}`)
