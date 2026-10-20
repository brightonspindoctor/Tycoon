// Prints one stage 3 run turn by turn (admin start), for balance work. npx vite-node tools/trace3.ts [seed]
import { adminStart, ADMIN_DEFAULTS } from '../src/engine/admin'
import { act, cardDef, intent, type Run } from '../src/engine/engine'
import { THREATS } from '../src/engine/data'
import { botIncorporate, botShop, botTurn } from './bot'
const seed = Number(process.argv[2] ?? 7001)
let r: Run = botIncorporate(adminStart(seed, { ...ADMIN_DEFAULTS, stage: 3, start: 'incorporate', wells: 3, capital: 30, gold: 5 }))
for (let g = 0; g < 300; g++) {
  if (r.phase === 'turn') {
    const before = r
    console.log(`R${r.round}T${r.turn} $${r.capital} heat ${r.heat} oil ${r.oil}/${r.storage} AP ${r.ap} | ${r.threats.filter(t => !t.beaten).map(t => `${THREATS[t.kind].name} ${t.hold}/${t.maxHold} next ${intent(r, t)}`).join(', ')}`)
    console.log(`   hand: ${r.hand.map(c => cardDef(c).name).join(', ')}`)
    r = botTurn(r)
    console.log(`   events: ${[...r.events].reverse().join(' | ')}  → $${r.capital} heat ${r.heat} (${r.phase})`)
    if (before.round !== r.round && r.phase === 'shop') console.log('--- shop')
  } else if (r.phase === 'shop') { const c = r.capital; r = botShop(r); console.log(`SHOP $${c} → $${r.capital}, rigs ${r.plots.length}, deck ${r.deck.length}`) }
  else if (r.phase === 'roundWon') r = act(act(r, { type: 'takeSpoils' }), { type: 'continue' })
  else break
}
console.log(r.phase, r.loss)
