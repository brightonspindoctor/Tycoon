import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { act, newRun, roundsReached, type Action, type Beat, type Run } from './engine/engine'
import type { BonusKey } from './engine/data'
import { loadReplay, saveRun, trustFundOffered } from './storage'
import { TickerTape } from './ui/TickerTape'
import { CONFIG } from './engine/config'
import { ERA_THEME } from './engine/format'
import { play } from './sound'
import { GameScreen } from './ui/GameScreen'
import { CardGallery } from './ui/CardGallery'
import { SoundBoard } from './ui/SoundBoard'
import { MobileGame } from './ui/MobileGame'
import { SettingsPanel } from './ui/Settings'
import { InstallPrompt } from './ui/InstallPrompt'
import { ShopScreen } from './ui/ShopScreen'
import { RoundSummary } from './ui/RoundSummary'
import { CrashOut, StageComplete } from './ui/EndScreens'
import { BonusPick, History, Intro } from './ui/MenuScreens'

type Screen = 'intro' | 'bonus' | 'run' | 'history'

// Phones held upright get their own layout; anything wider gets the 1440×900 board scaled to fit.
const MOBILE_MAX = 760
const measure = () => ({ scale: Math.min(window.innerWidth / 1440, window.innerHeight / 900), mobile: window.innerWidth <= MOBILE_MAX })

function useLayout() {
  const [layout, setLayout] = useState(measure)
  useLayoutEffect(() => {
    const fit = () => setLayout(measure())
    fit(); window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [])
  return layout
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('intro')
  const [run, setRun] = useState<Run | null>(null)
  const [shake, setShake] = useState(false)
  const [bailout, setBailout] = useState(false) // a losing streak earns the Trust Fund next run
  // the enemy turn being played back: the board stays as it was until the tape has run
  const [tape, setTape] = useState<{ beats: Beat[]; frozen: Run } | null>(null)
  const [acting, setActing] = useState<Beat | null>(null)
  const replay = (next: Run, frozen: Run) => { if (next.report.length && loadReplay() !== 'off') setTape({ beats: next.report, frozen }) }
  const saved = useRef<number | null>(null)
  const { scale, mobile } = useLayout()

  function dispatch(a: Action) {
    if (!run) return
    const nextRun = act(run, a)
    // sound and feedback from what changed
    if (a.type === 'play') {
      const key = run.hand.find(c => c.id === a.cardId)?.key
      const changed = nextRun.ap !== run.ap || nextRun.hand.length !== run.hand.length
      if (changed) play(key === 'prospect' ? 'prospect' : key === 'well' || key === 'wildcat' ? 'well' : 'card')
    }
    if (a.type === 'sellOil' && nextRun.capital > run.capital) play('sell')
    if (a.type === 'sellWell') play('coin')
    const replaying = nextRun.reportSeq !== run.reportSeq && nextRun.report.length > 0 && loadReplay() !== 'off'
    if (nextRun.fire > run.fire && !replaying) play('fire')
    if (nextRun.capital < run.capital - 1 && a.type === 'endTurn' && !replaying) { play('hit'); setShake(true); setTimeout(() => setShake(false), 350) }
    if (replaying) replay(nextRun, a.type === 'endTurn' ? run : nextRun)
    if (a.type === 'buyCard' || a.type === 'buyProspect' || a.type === 'buyBucket' || a.type === 'buyItem' || a.type === 'skim') play('coin')
    setRun(nextRun)
  }

  // ?preview=summary | crash | complete | shop | bossshop | round3 | boss jumps to a screen (for design checks)
  useEffect(() => {
    const want = new URLSearchParams(location.search).get('preview')
    if (!want) return
    void import('../tools/bot').then(({ botShop, botTurn }) => {
      for (let seed = 1; seed < 400; seed++) {
        let r = newRun(seed, 'threeOil')
        for (let i = 0; i < 400; i++) {
          if (want === 'shop' && r.phase === 'shop' && r.round >= 1) break
          if (want === 'bossshop' && r.phase === 'shop' && r.round === 3) break
          if (want === 'summary' && r.phase === 'roundWon' && r.round >= 2) break
          if (want === 'round3' && r.phase === 'turn' && r.round === 3 && r.turn >= 2) break
          if (want === 'boss' && r.phase === 'turn' && r.round === 4 && r.turn >= 2) break
          if (r.phase === 'shop') r = botShop(r)
          else if (r.phase === 'turn') r = botTurn(r)
          else if (r.phase === 'roundWon') r = act(r, { type: 'continue' })
          else break
        }
        const hit = (want === 'crash' && r.phase === 'lost') || (want === 'complete' && r.phase === 'stageComplete') ||
          (want === 'summary' && r.phase === 'roundWon') || (want === 'shop' && r.phase === 'shop') || (want === 'bossshop' && r.phase === 'shop' && r.round === 3) ||
          (want === 'round3' && r.phase === 'turn' && r.round === 3) || (want === 'boss' && r.phase === 'turn' && r.round === 4)
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
      setBailout(trustFundOffered(CONFIG.trustFundStreak))
    }
  }, [run])

  function start(bonus: BonusKey) {
    const r = newRun(Math.floor(Math.random() * 2 ** 31), bonus)
    setRun(r)
    setScreen('run')
    play('whistle')
    setTimeout(() => replay(r, r), 0)
  }

  const previewPage = new URLSearchParams(location.search).get('preview')
  let body: JSX.Element
  if (previewPage === 'cards') body = <CardGallery />
  else if (previewPage === 'sounds') body = <SoundBoard />
  else if (screen === 'intro') body = <Intro onBegin={() => setScreen('bonus')} onHistory={() => setScreen('history')} />
  else if (screen === 'bonus') body = <BonusPick onPick={start} onBack={() => setScreen('intro')} />
  else if (screen === 'history' || !run) body = <History onBack={() => setScreen('intro')} />
  else if (run.phase === 'shop' && !tape) body = <ShopScreen run={run} dispatch={dispatch} />
  else if (run.phase === 'lost' && !tape) body = <CrashOut run={run} bailout={bailout} onAgain={() => setScreen('bonus')} onHistory={() => setScreen('history')} />
  else if (run.phase === 'stageComplete' && !tape) body = <StageComplete run={run} onMenu={() => setScreen('intro')} onHistory={() => setScreen('history')} />
  else if (tape) body = (
    <>
      {mobile ? <MobileGame run={tape.frozen} dispatch={() => {}} acting={acting} /> : <GameScreen run={tape.frozen} dispatch={() => {}} acting={acting} />}
      <TickerTape key={tape.frozen.reportSeq + ':' + tape.beats.length} beats={tape.beats} speed={loadReplay()} onBeat={setActing} onDone={() => setTape(null)} />
    </>
  )
  else body = (
    <>
      {mobile ? <MobileGame run={run} dispatch={dispatch} /> : <GameScreen run={run} dispatch={dispatch} />}
      {run.phase === 'roundWon' && !tape && <RoundSummary key={run.round} run={run} dispatch={dispatch} onContinue={() => dispatch({ type: 'continue' })} />}
    </>
  )

  const fade = <div key={`${screen}-${run?.phase}-${run?.round}`} className="screen-fade">{body}</div>
  const overlays = <><SettingsPanel /><InstallPrompt /></>
  if (mobile) return <div className={`m ${shake ? 'is-shaking' : ''}`} data-theme={ERA_THEME[run?.stage ?? 1] ?? 'victorian'}>{fade}{overlays}</div>

  return (
    <div className="stage-wrap">
      <div className={`stage ${shake ? 'is-shaking' : ''}`} style={{ transform: `translate(-50%, -50%) scale(${scale})` }}>
        {fade}
      </div>
      {overlays}
    </div>
  )
}
