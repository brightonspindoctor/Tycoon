import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { act, newRun, roundsReached, type Action, type AdminOp, type Beat, type Run } from './engine/engine'
import { bossRound, type BonusKey, type CardKey } from './engine/data'
import { badgeCounts, loadAdmin, loadReplay, loadUnlocks, saveAchieved, markWelcomed, saveAdmin, saveRun, saveUnlock, trustFundOffered, welcomeSeen } from './storage'
import { adminStart, type AdminStart } from './engine/admin'
import { Welcome } from './ui/Welcome'
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
import { SELF_MADE, TACTICS, tacticFor } from './engine/tactics'
import { IncorporateScreen } from './ui/Incorporate'
import { MultinationalScreen } from './ui/Multinational'
import { BigOilScreen } from './ui/BigOil'
import { EraTransition } from './ui/EraTransition'
import { units } from './engine/format'
import { About, BonusPick, History, Intro, Scoreboard } from './ui/MenuScreens'
import { Achievements, TrophyCabinet } from './ui/Achievements'
import { hello, roundEnded, runEnded, runStarted } from './telemetry'
import { findTerms, loadFound, TERMS } from './terms'
import { ACHIEVEMENTS, achievedBy, type AchievementKey } from './engine/achievements'
import { THREATS } from './engine/data'

type Screen = 'intro' | 'bonus' | 'welcome' | 'run' | 'history' | 'about' | 'scoreboard' | 'achievements' | 'cabinet'

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
  const [eraTo, setEraTo] = useState<number | null>(null) // the stage being turned to
  const [bailout, setBailout] = useState(false) // a losing streak earns the Trust Fund next run
  const [admin, setAdmin] = useState(() => {
    const q = new URLSearchParams(location.search).get('admin')
    if (q === '0') saveAdmin(false) // ?admin=0 switches it off; switching it on needs the PIN in Settings
    return loadAdmin()
  })
  // the enemy turn being played back: the board stays as it was until the tape has run
  const [tape, setTape] = useState<{ beats: Beat[]; frozen: Run } | null>(null)
  const [fireNote, setFireNote] = useState<string | null>(null) // a fire started on your own turn (the Claim Jumper on his way out, say)
  const [acting, setActing] = useState<Beat | null>(null)
  const replay = (next: Run, frozen: Run) => {
    if (!next.report.length || loadReplay() === 'off') return
    setTape({ beats: next.report.map(b => ({ ...b, title: units(b.title, next.stage), text: units(b.text, next.stage) })), frozen })
  }
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
    if (nextRun.fire > run.fire && !replaying) {
      play('fire')
      const over = !nextRun.threats.some(t => !t.beaten)
      setFireNote(`${nextRun.fireBy ? `Started by ${nextRun.fireBy}. ` : ''}${over ? 'Put it out to end the round.' : 'Pumps stop until it\'s out.'}`)
      setTimeout(() => setFireNote(null), 4500)
    }
    // stage 4: the clock and the Truth, when it happens on your turn rather than on the tape
    if (!replaying && (nextRun.clock ?? 0) !== (run.clock ?? 0) && nextRun.stage === 4 && run.stage === 4) play((nextRun.clock ?? 0) > (run.clock ?? 0) ? 'tick' : 'rewind')
    const phaseOf = (x: Run) => x.threats.find(t => t.kind === 'truth')?.phase ?? 0
    if (phaseOf(nextRun) > phaseOf(run)) setTimeout(() => play('phase'), 150)
    if (nextRun.capital < run.capital - 1 && a.type === 'endTurn' && !replaying) { play('hit'); setShake(true); setTimeout(() => setShake(false), 350) }
    if (replaying) replay(nextRun, a.type === 'endTurn' ? run : nextRun)
    if (nextRun.stage > run.stage) setEraTo(nextRun.stage) // a new era: turn the page
    if (a.type === 'buyCard' || a.type === 'buyProspect' || a.type === 'buyBucket' || a.type === 'buyItem' || a.type === 'skim' || a.type === 'payDividends' || (a.type === 'upgradeCard' && nextRun.upgradeCost > run.upgradeCost)) play('coin')
    setRun(nextRun)
  }

  // ?preview=summary | crash | complete | shop | bossshop | round3 | boss jumps to a screen (for design checks);
  // add &stage=2 or &stage=3 to find it in a later stage, or use incorporate | complete2 | crash2 | multinational | complete3 | crash3
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    let want = params.get('preview')
    if (!want) return
    let wantStage = Number(params.get('stage') ?? 1)
    if (want === 'incorporate' || want === 'complete2' || want === 'crash2') { wantStage = 2; if (want !== 'incorporate') want = want.slice(0, -1) }
    if (want === 'multinational' || want === 'complete3' || want === 'crash3') { wantStage = 3; want = want === 'multinational' ? 'incorporate' : want.slice(0, -1) }
    if (want === 'bigoil' || want === 'complete4' || want === 'crash4') { wantStage = 4; want = want === 'bigoil' ? 'incorporate' : want.slice(0, -1) }
    void import('../tools/bot').then(({ botIncorporate, botShop, botTurn }) => {
      for (let seed = 1; seed < 600; seed++) {
        let r = newRun(seed, wantStage >= 4 ? 'oldFaithful' : 'threeOil')
        for (let i = 0; i < 2400; i++) {
          if (want === 'incorporate' && r.phase === 'incorporate' && r.stage === wantStage) break
          if (r.stage < wantStage) {
            if (r.phase === 'stageComplete') { r = act(r, { type: 'continue' }); continue }
            if (r.phase === 'incorporate') { r = botIncorporate(r); continue }
          } else if (r.phase === 'incorporate') { r = botIncorporate(r); continue }
          if (r.stage === wantStage) {
            if (want === 'shop' && r.phase === 'shop' && r.round >= 1) break
            if (want === 'bossshop' && r.phase === 'shop' && r.round === 3) break
            if (want === 'summary' && r.phase === 'roundWon' && r.round >= 2) break
            if (want === 'round3' && r.phase === 'turn' && r.round === 3 && r.turn >= 2) break
            if (want === 'boss' && r.phase === 'turn' && r.round === bossRound(r.stage) && r.turn >= 2) break
          }
          if (r.phase === 'shop') r = botShop(r)
          else if (r.phase === 'turn') r = botTurn(r)
          else if (r.phase === 'roundWon') r = act(r, { type: 'continue' })
          else break
        }
        if (r.stage !== wantStage) continue
        const hit = (want === 'incorporate' && r.phase === 'incorporate') || (want === 'crash' && r.phase === 'lost') || (want === 'complete' && r.phase === 'stageComplete') ||
          (want === 'summary' && r.phase === 'roundWon') || (want === 'shop' && r.phase === 'shop') || (want === 'bossshop' && r.phase === 'shop' && r.round === 3) ||
          (want === 'round3' && r.phase === 'turn' && r.round === 3) || (want === 'boss' && r.phase === 'turn' && r.round === bossRound(r.stage))
        if (hit) { saved.current = r.seed; setRun(r); setScreen('run'); return }
      }
    })
  }, [])

  // beating a boss unlocks something for every later run (never from an admin playtest)
  useEffect(() => {
    if (!run || run.admin || run.phase !== 'stageComplete') return
    if (run.stage === 1) saveUnlock('baron')
    if (run.stage === 2) saveUnlock('proxy')
    if (run.stage === 3) saveUnlock('geneva')
  }, [run])

  // a card you get for the first time can unlock a term in the glossary
  const [newTerm, setNewTerm] = useState<string | null>(null)
  useEffect(() => {
    if (!run || run.admin) return // admin playtests hand you cards you never bought
    const fresh = findTerms(run.deck.map(c => c.key))
    if (!fresh.length) return
    setNewTerm(fresh.length > 2 ? `${fresh.length} new terms` : fresh.map(t => t.term).join(' and '))
    const t = setTimeout(() => setNewTerm(null), 4000)
    return () => clearTimeout(t)
  }, [run?.deck.length]) // eslint-disable-line react-hooks/exhaustive-deps

  // anonymous play data: say hello once the game is open
  useEffect(() => { void hello() }, [])
  const [wonRunId, setWonRunId] = useState<string | null>(null)
  // each round that ends, won or lost: where people get stuck
  const lastRun = useRef<Run | null>(null)
  useEffect(() => {
    const prev = lastRun.current
    lastRun.current = run
    if (!run || run.admin || !prev || prev.seed !== run.seed || prev.phase !== 'turn') return
    if (run.phase !== 'roundWon' && run.phase !== 'stageComplete' && run.phase !== 'lost') return
    roundEnded(run.seed, run.stage, run.round, run.threats.map(t => THREATS[t.kind].name), run.phase !== 'lost', run.turn)
  }, [run])

  // record finished runs once
  useEffect(() => {
    if (!run || saved.current === run.seed || run.admin) return // admin playtests are never recorded
    // a finished stage carries on into the next, so a run is recorded when it ends, or when the Truth is beaten: the game is won
    if (run.phase === 'lost' || (run.phase === 'stageComplete' && run.stage >= 4)) {
      saved.current = run.seed
      const LOST = { bankrupt: 'Bankrupt', stalemate: 'Out of time', ousted: 'Ousted', ruined: 'Ruined', brokenUp: 'Broken up', midnight: 'Midnight' }
      const won = run.phase === 'stageComplete'
      saveRun({
        id: String(run.seed), date: new Date().toISOString(), industry: 'Oil', rounds: roundsReached(run),
        outcome: won ? 'Chairman' : LOST[run.loss?.reason ?? 'bankrupt'], gold: won ? run.gold : null, completed: won, stageGold: run.gold, // your gold is the score
        tactic: won ? (t => t ? TACTICS[t].name : undefined)(tacticFor(run.tally, run.deck.length, run.stats.oilSold, run.stage >= 4 ? run.clock : 0)) : undefined,
        hard: run.bonus === 'none' || undefined,
      })
      // the Trust Fund is earned once, by a losing streak, and kept for good: the notice shows only the first time
      const earned = !loadUnlocks().trustFund && trustFundOffered(CONFIG.trustFundStreak)
      if (earned) saveUnlock('trustFund')
      setBailout(earned)
      const t = won ? tacticFor(run.tally, run.deck.length, run.stats.oilSold, run.clock) : null
      const id = runEnded(run.seed, {
        outcome: won ? 'won' : run.loss?.reason ?? 'bankrupt', stage: run.stage, round: run.round, roundsReached: won ? 17 : roundsReached(run),
        killedBy: run.loss?.by[0], gold: won ? run.gold : undefined, tactic: t ? TACTICS[t].name : undefined, clock: run.stage >= 4 ? run.clock : undefined,
      })
      setWonRunId(won ? id : null)
    }
  }, [run])

  // achievements: checked as the run changes (never in an admin playtest), after the run is recorded
  const [newFeat, setNewFeat] = useState<string | null>(null)
  useEffect(() => {
    if (!run || run.admin) return
    const keys: AchievementKey[] = achievedBy(run)
    if (loadFound().length >= Object.keys(TERMS).length) keys.push('fluentInSpin')
    const badges = badgeCounts()
    if ([...Object.values(TACTICS), SELF_MADE].every(t => badges[t.name])) keys.push('fullCabinet')
    const fresh = saveAchieved(keys) as AchievementKey[]
    if (!fresh.length) return
    setNewFeat(fresh.map(k => ACHIEVEMENTS[k].name).join(' · '))
    setTimeout(() => play('ping'), 200)
    const t = setTimeout(() => setNewFeat(null), 4500)
    return () => clearTimeout(t)
  }, [run])

  function startAdmin(o: AdminStart) {
    const r = adminStart(Math.floor(Math.random() * 2 ** 31), o)
    saved.current = null
    setRun(r)
    setScreen('run')
    setTimeout(() => replay(r, r), 0)
  }

  const [pendingBonus, setPendingBonus] = useState<BonusKey | null>(null)
  function start(bonus: BonusKey) {
    if (!welcomeSeen()) { setPendingBonus(bonus); setScreen('welcome'); return }
    const r = newRun(Math.floor(Math.random() * 2 ** 31), bonus, loadUnlocks())
    runStarted(r.seed, bonus)
    setRun(r)
    setScreen('run')
    play('whistle')
    setTimeout(() => replay(r, r), 0)
  }

  const previewPage = new URLSearchParams(location.search).get('preview')
  let body: JSX.Element
  if (previewPage === 'cards') body = <CardGallery />
  else if (previewPage === 'sounds') body = <SoundBoard />
  else if (screen === 'intro') body = <Intro onBegin={() => setScreen('bonus')} onHistory={() => setScreen('history')} onAbout={() => setScreen('about')} onScoreboard={() => setScreen('scoreboard')} onAchievements={() => setScreen('achievements')} admin={admin} onAdminStart={startAdmin} />
  else if (screen === 'achievements') body = <Achievements onBack={() => setScreen('intro')} />
  else if (screen === 'cabinet') body = <TrophyCabinet onBack={() => setScreen('scoreboard')} />
  else if (screen === 'about') body = <About onBack={() => setScreen('intro')} />
  else if (screen === 'scoreboard') body = <Scoreboard onBack={() => setScreen('intro')} onCabinet={() => setScreen('cabinet')} />
  else if (screen === 'bonus') body = <BonusPick onPick={start} onBack={() => setScreen('intro')} />
  else if (screen === 'welcome') body = <Welcome onBegin={() => { markWelcomed(); start(pendingBonus ?? 'threeOil') }} />
  else if (screen === 'history' || !run) body = <History onBack={() => setScreen('intro')} />
  else if (run.phase === 'shop' && !tape) body = <ShopScreen run={run} dispatch={dispatch} />
  else if (run.phase === 'lost' && !tape) body = <CrashOut run={run} bailout={bailout} onAgain={() => setScreen('bonus')} onHistory={() => setScreen('history')} />
  else if (run.phase === 'stageComplete' && !tape) body = <StageComplete run={run} runId={wonRunId} onMenu={() => setScreen('intro')} onHistory={() => setScreen('history')} onScoreboard={() => setScreen('scoreboard')} onContinue={() => dispatch({ type: 'continue' })} />
  else if (run.phase === 'incorporate') body = <>{run.stage >= 4 ? <BigOilScreen run={run} dispatch={dispatch} /> : run.stage >= 3 ? <MultinationalScreen run={run} dispatch={dispatch} /> : <IncorporateScreen run={run} dispatch={dispatch} />}{eraTo && <EraTransition to={eraTo} onDone={() => setEraTo(null)} />}</>
  else if (tape) body = (
    <>
      {mobile ? <MobileGame run={tape.frozen} dispatch={() => {}} acting={acting} /> : <GameScreen run={tape.frozen} dispatch={() => {}} acting={acting} />}
      <TickerTape key={tape.frozen.reportSeq + ':' + tape.beats.length} beats={tape.beats} speed={loadReplay()} stage={tape.frozen.stage} onBeat={setActing} onDone={() => setTape(null)} />
    </>
  )
  else body = (
    <>
      {mobile ? <MobileGame run={run} dispatch={dispatch} /> : <GameScreen run={run} dispatch={dispatch} />}
      {run.phase === 'roundWon' && !tape && <RoundSummary key={run.round} run={run} dispatch={dispatch} onContinue={() => dispatch({ type: 'continue' })} />}
    </>
  )

  const fade = <div key={`${screen}-${run?.phase}-${run?.round}`} className="screen-fade">{body}</div>
  const inRun = screen === 'run' && !!run && (run.phase === 'turn' || run.phase === 'shop' || run.phase === 'roundWon' || run.phase === 'incorporate' || (run.phase === 'stageComplete' && run.stage < 4))
  function quitRun() {
    if (!run) return
    saved.current = run.seed
    if (!run.admin) {
      saveRun({ id: String(run.seed), date: new Date().toISOString(), industry: 'Oil', rounds: roundsReached(run), outcome: 'Quit', gold: null, completed: false, stageGold: run.gold })
      runEnded(run.seed, { outcome: 'quit', stage: run.stage, round: run.round, roundsReached: roundsReached(run) })
    }
    setTape(null); setActing(null); setRun(null); setScreen('intro')
  }
  const adminProps = {
    onToggle: setAdmin,
    onAdmin: run?.admin && screen === 'run' && !tape ? (op: AdminOp, card?: CardKey) => dispatch({ type: 'admin', op, card }) : undefined,
    inTurn: run?.phase === 'turn', stage: run?.stage ?? 1,
  }
  const badge = run?.admin && screen === 'run' ? <span className="admin-badge cl-label">Admin playtest</span> : null
  const termToast = newTerm ? <div className="term-toast" role="status"><span className="cl-label">New in the glossary</span><b>{newTerm}</b><span className="res-note">Settings › Glossary</span></div> : null
  const featToast = newFeat ? <div className={`term-toast term-toast--feat ${termToast ? 'is-raised' : ''}`} role="status"><span className="cl-label">Achievement</span><b>{newFeat}</b><span className="res-note">Front page › Achievements</span></div> : null
  const fireToast = fireNote && screen === 'run' ? <div className="term-toast term-toast--fire" role="alert"><span className="cl-label">Fire!</span><b>{fireNote}</b></div> : null
  const overlays = <>{fireToast}<SettingsPanel onQuit={inRun ? quitRun : undefined} admin={adminProps} /><InstallPrompt />{badge}{termToast}{featToast}</>
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
