import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { act, newRun, roundsReached, type Action, type Run } from './engine/engine'
import type { BonusKey } from './engine/data'
import { saveRun } from './storage'
import { play } from './sound'
import { GameScreen } from './ui/GameScreen'
import { ShopScreen } from './ui/ShopScreen'
import { RoundSummary } from './ui/RoundSummary'
import { CrashOut, StageComplete } from './ui/EndScreens'
import { BonusPick, History, Intro } from './ui/MenuScreens'

type Screen = 'intro' | 'bonus' | 'run' | 'history'

/** Scales the 1440×900 game to fit the window. */
function useFit() {
  const [scale, setScale] = useState(1)
  useLayoutEffect(() => {
    const fit = () => setScale(Math.min(window.innerWidth / 1440, window.innerHeight / 900))
    fit(); window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [])
  return scale
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('intro')
  const [run, setRun] = useState<Run | null>(null)
  const [shake, setShake] = useState(false)
  const saved = useRef<number | null>(null)
  const scale = useFit()

  function dispatch(a: Action) {
    if (!run) return
    const nextRun = act(run, a)
    // sound and feedback from what changed
    if (a.type === 'play') play('card')
    if (a.type === 'sellOil' || a.type === 'sellWell') play('coin')
    if (nextRun.fire > run.fire) play('fire')
    if (nextRun.capital < run.capital - 1 && a.type === 'endTurn') { play('hit'); setShake(true); setTimeout(() => setShake(false), 350) }
    if (a.type === 'buyCard' || a.type === 'buyProspect' || a.type === 'buyItem' || a.type === 'skim') play('coin')
    setRun(nextRun)
  }

  // ?preview=summary | crash | complete | shop jumps to a screen (for design checks)
  useEffect(() => {
    const want = new URLSearchParams(location.search).get('preview')
    if (!want) return
    void import('../tools/bot').then(({ botShop, botTurn }) => {
      for (let seed = 1; seed < 400; seed++) {
        let r = newRun(seed, 'threeOil')
        for (let i = 0; i < 400; i++) {
          if (want === 'shop' && r.phase === 'shop' && r.round >= 1) break
          if (want === 'summary' && r.phase === 'roundWon' && r.round >= 2) break
          if (r.phase === 'shop') r = botShop(r)
          else if (r.phase === 'turn') r = botTurn(r)
          else if (r.phase === 'roundWon') r = act(r, { type: 'continue' })
          else break
        }
        const hit = (want === 'crash' && r.phase === 'lost') || (want === 'complete' && r.phase === 'stageComplete') ||
          (want === 'summary' && r.phase === 'roundWon') || (want === 'shop' && r.phase === 'shop')
        if (hit) { saved.current = r.seed; setRun(r); setScreen('run'); return }
      }
    })
  }, [])

  // record finished runs once
  useEffect(() => {
    if (!run || saved.current === run.seed) return
    if (run.phase === 'lost' || run.phase === 'stageComplete') {
      saved.current = run.seed
      saveRun({
        id: String(run.seed), date: new Date().toISOString(), industry: 'Oil', rounds: roundsReached(run),
        outcome: run.phase === 'stageComplete' ? 'Stage 1 complete' : run.loss?.reason === 'stalemate' ? 'Out of time' : 'Bankrupt', gold: null, completed: false, stageGold: run.gold,
      })
    }
  }, [run])

  function start(bonus: BonusKey) {
    setRun(newRun(Math.floor(Math.random() * 2 ** 31), bonus))
    setScreen('run')
  }

  let body: JSX.Element
  if (screen === 'intro') body = <Intro onBegin={() => setScreen('bonus')} onHistory={() => setScreen('history')} />
  else if (screen === 'bonus') body = <BonusPick onPick={start} onBack={() => setScreen('intro')} />
  else if (screen === 'history' || !run) body = <History onBack={() => setScreen('intro')} />
  else if (run.phase === 'shop') body = <ShopScreen run={run} dispatch={dispatch} />
  else if (run.phase === 'lost') body = <CrashOut run={run} onAgain={() => setScreen('bonus')} onHistory={() => setScreen('history')} />
  else if (run.phase === 'stageComplete') body = <StageComplete run={run} onMenu={() => setScreen('intro')} onHistory={() => setScreen('history')} />
  else body = (
    <>
      <GameScreen run={run} dispatch={dispatch} />
      {run.phase === 'roundWon' && <RoundSummary key={run.round} run={run} onContinue={() => dispatch({ type: 'continue' })} />}
    </>
  )

  return (
    <div className="stage-wrap">
      <div className={`stage ${shake ? 'is-shaking' : ''}`} style={{ transform: `scale(${scale})` }}>
        <div key={`${screen}-${run?.phase}-${run?.round}`} className="screen-fade">{body}</div>
      </div>
    </div>
  )
}
