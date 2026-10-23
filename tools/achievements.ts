// How often the bot earns each achievement: a check that none is impossible or handed out.
// Run with: npx vite-node tools/achievements.ts [runs per bonus]
import { newRun } from '../src/engine/engine'
import type { BonusKey } from '../src/engine/data'
import { ACHIEVEMENTS, ACHIEVEMENT_KEYS, achievedBy, type AchievementKey } from '../src/engine/achievements'
import { botHooks, botRun } from './bot'

const N = Number(process.argv[2] ?? 300)
const bonuses: BonusKey[] = ['extraProspect', 'threeOil', 'pettyCash', 'gearGraft', 'trustFund', 'oldFaithful', 'slushFund']
const count: Partial<Record<AchievementKey, number>> = {}
let runs = 0
for (const b of bonuses) for (let i = 0; i < N; i++) {
  const got = new Set<AchievementKey>()
  botHooks.onAct = r => { for (const k of achievedBy(r)) got.add(k) }
  const r = botRun(newRun(5000 + i, b))
  for (const k of achievedBy(r)) got.add(k)
  for (const k of got) count[k] = (count[k] ?? 0) + 1
  runs++
}
botHooks.onAct = undefined
console.log(`Share of ${runs} bot runs that earn each achievement:`)
for (const k of ACHIEVEMENT_KEYS) if (ACHIEVEMENTS[k].check) console.log(`${ACHIEVEMENTS[k].name.padEnd(30)} ${((100 * (count[k] ?? 0)) / runs).toFixed(1).padStart(5)}%`)
