import { useEffect, useState } from 'react'
import { loadGlobalScores, loadOilTotal, type GlobalScore } from '../telemetry'
import { BONUSES, type BonusKey } from '../engine/data'
import { ACHIEVEMENTS, ACHIEVEMENT_KEYS } from '../engine/achievements'
import { bestScore, completedIndustries, loadAchieved, loadRuns, loadUnlocks, trustFundOffered, type RunRecord } from '../storage'
import { CONFIG } from '../engine/config'
import { play } from '../sound'
import { openSettings } from './settingsBus'
import { iconUrl } from './icons'
import { AdminStartPanel } from './AdminPanel'
import type { AdminStart } from '../engine/admin'

const INDUSTRIES = ['Oil', 'Pharmaceutical', 'Fishing', 'Tech']
// the front page motto: the first one until you've played a run, then a different one each visit
const FIRST_MOTTO = 'Industry. Influence. Plausible deniability.'
const MOTTOS = [
  'Drill. Drill. Drill.', 'Profits now. Apologies later.', 'Today\'s oil. Tomorrow\'s problem.', 'Keep calm and keep pumping.',
  'Externalities are someone else\'s department.', 'The ground has plenty more.', 'Growth is the only weather that matters.',
  'What spill?', 'Fortune favours the extractive.', 'The planet will cope.', 'Every barrel is a vote of confidence.',
  'Doubt is our product.', 'Nobody remembers the regulators.', 'Plausible deniability is a renewable resource.', 'The science can wait.',
]
function pickMotto(): string {
  if (!loadRuns().length) return FIRST_MOTTO
  let last = ''
  try { last = sessionStorage.getItem('tycoon.motto') ?? '' } catch { /* ignore */ }
  const options = MOTTOS.filter(m => m !== last)
  const m = options[Math.floor(Math.random() * options.length)]
  try { sessionStorage.setItem('tycoon.motto', m) } catch { /* ignore */ }
  return m
}
const ANNOUNCED = ['Pharmaceutical'] // shown as Coming soon before Oil is finished
// a run that died, rather than one that finished a stage or the game
const ended = (r: RunRecord) => ['Bankrupt', 'Out of time', 'Quit', 'Ousted', 'Ruined'].includes(r.outcome)

export function Intro({ onBegin, onHistory, onAbout, onScoreboard, onAchievements, admin, onAdminStart }: { onBegin: () => void; onHistory: () => void; onAbout: () => void; onScoreboard: () => void; onAchievements: () => void; admin?: boolean; onAdminStart?: (o: AdminStart) => void }) {
  const done = completedIndustries()
  const [motto] = useState(pickMotto)
  const got = loadAchieved()
  const feats = ACHIEVEMENT_KEYS.filter(k => got[k]).length
  const best = bestScore('Oil')
  const won = done.length > 0 // the scoreboard unlocks the first time you win the game
  const [oil, setOil] = useState<number | null>(null) // every barrel every player has pumped
  useEffect(() => { let on = true; void loadOilTotal().then(n => { if (on && typeof n === 'number') setOil(n) }); return () => { on = false } }, [])
  // each industry is revealed when the one before it is finished; three tiles on the page
  const shown = INDUSTRIES.slice(0, 3)
  const open = shown.filter((name, i) => i === 0 || ANNOUNCED.includes(name) || done.includes(shown[i - 1]))
  return (
    <div className="screen intro" data-theme="victorian">
      <img className="intro__art" src={`${import.meta.env.BASE_URL}art/title.jpg`} alt="Tycoon: a share certificate with the industries arranged around a globe" />
      <div className="intro__side">
        <span className="cl-label">{motto}</span>
        <h1 className="cl-display intro__title">Choose your industry</h1>
        <div className="industries">
          {shown.map(name => open.includes(name) ? (
            <button key={name} type="button" className="industry" disabled={name !== 'Oil'} onClick={() => { play('click'); onBegin() }}>
              <span className="cl-display industry__name">{name}</span>
              {name === 'Oil' ? best !== null && <span className="res-note">Best: {best} gold</span> : <span className="res-note">Coming soon</span>}
              <span className="cl-btn cl-btn--primary">Begin</span>
            </button>
          ) : (
            <div key={name} className="industry industry--sealed"><span className="cl-display industry__name">? ? ?</span><span className="cl-label">Sealed</span></div>
          ))}
        </div>
        {oil !== null && oil > 0 && (
          <div className="oil-total" aria-label={`${oil} barrels pumped by every player so far`}>
            <span className="cl-label">Pumped by every tycoon so far</span>
            <b className="cl-num">{oil.toLocaleString('en-GB')}</b><span className="res-note">barrels</span>
          </div>
        )}
        <button type="button" className="intro-feats" onClick={() => { play('click'); onAchievements() }} aria-label={`Achievements: ${feats} of ${ACHIEVEMENT_KEYS.length}. See them all`}>
          <span className="intro-feats__head"><span className="cl-label">Achievements</span><span className="cl-num">{feats} of {ACHIEVEMENT_KEYS.length}</span></span>
          <span className="intro-feats__row" aria-hidden="true">
            {ACHIEVEMENT_KEYS.map(k => <img key={k} className={got[k] ? 'is-earned' : ''} src={iconUrl(ACHIEVEMENTS[k].icon)} alt="" title={got[k] ? ACHIEVEMENTS[k].name : undefined} />)}
          </span>
          <span className="res-note">{feats ? `Latest: ${ACHIEVEMENTS[ACHIEVEMENT_KEYS.filter(k => got[k]).sort((a, b) => got[b].localeCompare(got[a]))[0]].name}` : 'None yet. See what there is to earn.'}</span>
        </button>
        {admin && onAdminStart && <AdminStartPanel onStart={onAdminStart} />}
        <div className="intro__menu">
          <button type="button" className="cl-btn" onClick={onHistory}>Run history</button>
          <button type="button" className="cl-btn" onClick={() => { play('click'); openSettings() }}>Settings</button>
          <button type="button" className="cl-btn" onClick={() => { play('click'); onAbout() }}>About</button>
          {won
            ? <button type="button" className="cl-btn" onClick={() => { play('click'); onScoreboard() }}>Scoreboard</button>
            : <button type="button" className="cl-btn intro__locked" disabled aria-label="Locked" title="Locked">?</button>}
        </div>
      </div>
    </div>
  )
}

export function About({ onBack }: { onBack: () => void }) {
  return (
    <div className="screen about" data-theme="victorian">
      <header className="game__head">
        <div><span className="cl-label">Tycoon</span><h1 className="cl-display game__title">About</h1></div>
        <button type="button" className="cl-btn" onClick={onBack}>Back</button>
      </header>
      <div className="about__body">
        <p>This game was made by Jonny Sadler as a passion project.</p>
        <p>If you enjoyed it please consider buying him a coffee.</p>
        <a className="cl-btn cl-btn--primary" href="https://buymeacoffee.com/jonnysadler" target="_blank" rel="noopener noreferrer">Buy me a coffee</a>
        <p className="res-note about__privacy">The game shares anonymous play data so it can be improved: how far runs get, where they end, and how long people play. It is linked to a random ID made on this device, never to your name, email or location. Switch it off in Settings. Your name goes on the global scoreboard only if you type one in.</p>
      </div>
    </div>
  )
}

/** The scoreboard: everyone's finished games (global), or this device's. Unlocked by winning once. */
export function Scoreboard({ onBack, onCabinet }: { onBack: () => void; onCabinet: () => void }) {
  const [tab, setTab] = useState<'global' | 'device'>('global')
  const [global, setGlobal] = useState<GlobalScore[] | null | 'error'>(null)
  useEffect(() => { void loadGlobalScores().then(g => setGlobal(g ?? 'error')) }, [])
  const mine = loadRuns().filter(r => r.completed && r.gold !== null).sort((a, b) => (b.gold as number) - (a.gold as number))
  const date = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  return (
    <div className="screen history scoreboard" data-theme="victorian">
      <header className="game__head">
        <div><span className="cl-label">Tycoon · Big Oil beats the Truth</span><h1 className="cl-display game__title">Scoreboard</h1></div>
        <div className="game__head-buttons">
          <button type="button" className="cl-btn" onClick={() => { play('click'); onCabinet() }}>Trophy cabinet</button>
          <button type="button" className="cl-btn" onClick={onBack}>Back</button>
        </div>
      </header>
      <img className="scoreboard__banner" src={`${import.meta.env.BASE_URL}art/screens/scoreboard.jpg`} alt="The Earth from orbit, every continent on fire" />
      <div className="segmented" role="tablist" aria-label="Scoreboard">
        <button type="button" role="tab" aria-selected={tab === 'global'} className={tab === 'global' ? 'is-on' : ''} onClick={() => setTab('global')}>Everyone</button>
        <button type="button" role="tab" aria-selected={tab === 'device'} className={tab === 'device' ? 'is-on' : ''} onClick={() => setTab('device')}>This device</button>
      </div>
      <div className="history__table">
        {tab === 'global' ? (
          global === null ? <p className="res-note">Loading the scoreboard…</p>
            : global === 'error' ? <p className="res-note">Couldn't reach the scoreboard. Check your connection.</p>
            : !global.length ? <p className="res-note">Nobody on it yet. Win a game and you're first.</p>
            : <table className="cl-table">
                <thead><tr><th>#</th><th>Name</th><th className="col-wide">Date</th><th>Badge</th><th className="num">Gold</th></tr></thead>
                <tbody>{global.map((g, i) => <tr key={i}><td>{i + 1}</td><td>{g.name}</td><td className="col-wide">{date(g.created_at)}</td><td>{g.tactic ?? '—'}{g.hard && <span className="history__badge">Self-Made</span>}</td><td className="num">{g.gold}</td></tr>)}</tbody>
              </table>
        ) : (
          <table className="cl-table">
            <thead><tr><th>#</th><th>Date</th><th className="col-wide">Industry</th><th>Badge</th><th className="num">Gold</th></tr></thead>
            <tbody>
              {mine.map((r, i) => (
                <tr key={r.id}><td>{i + 1}</td><td>{date(r.date)}</td><td className="col-wide">{r.industry}</td><td>{r.tactic ?? '—'}{r.hard && <span className="history__badge">Self-Made</span>}</td><td className="num">{r.gold}</td></tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export function BonusPick({ onPick, onBack }: { onPick: (b: BonusKey) => void; onBack: () => void }) {
  const [offered] = useState(() => trustFundOffered(CONFIG.trustFundStreak))
  const [faithful] = useState(() => !!loadUnlocks().proxy)
  const [slush] = useState(() => !!loadUnlocks().geneva)
  const [hardOpen] = useState(() => completedIndustries().includes('Oil')) // hard mode opens once you've won the game
  return (
    <div className="screen bonus" data-theme="victorian">
      <header className="game__head">
        <div><span className="cl-label">Oil · Pennsylvania · 1863</span><h1 className="cl-display game__title">Choose your advantage</h1></div>
        <button type="button" className="cl-btn" onClick={onBack}>Back</button>
      </header>
      <p className="bonus__loan"><b>The bank has lent you ${CONFIG.startCapital} to start.</b> You pay it back at ${CONFIG.startDebt} a turn, as Bank Debt. Choose one advantage.</p>
      <div className="bonus__grid">
        {(Object.keys(BONUSES) as BonusKey[]).filter(k => k !== 'none' && (k !== 'trustFund' || offered) && (k !== 'oldFaithful' || faithful) && (k !== 'slushFund' || slush)).map(k => (
          <button key={k} type="button" className={`bonus__card ${k === 'trustFund' ? 'bonus__card--earned' : ''}`} onClick={() => { play('card'); onPick(k) }}>
            {k === 'trustFund' && <span className="cl-label bonus__tag">{CONFIG.trustFundStreak} failures in a row</span>}
            <span className="cl-display bonus__name">{BONUSES[k].name}</span>
            <span>{BONUSES[k].text}</span>
          </button>
        ))}
      </div>
      {hardOpen
        ? <button type="button" className="bonus__none" onClick={() => { play('card'); onPick('none') }}>
            <span className="cl-display">{BONUSES.none.name}</span><span>{BONUSES.none.text}</span>
          </button>
        : <div className="bonus__none bonus__none--locked" aria-label="Hard mode: locked"><span className="cl-display">Hard mode</span><span>Win the game to unlock.</span></div>}
    </div>
  )
}

export function History({ onBack }: { onBack: () => void }) {
  const runs = loadRuns()
  const finished = runs.filter(r => r.completed).length
  const best = bestScore('Oil')
  const ends = runs.reduce<Record<string, number>>((m, r) => ({ ...m, [r.outcome]: (m[r.outcome] ?? 0) + 1 }), {})
  const common = Object.entries(ends).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—'
  return (
    <div className="screen history" data-theme="victorian">
      <header className="game__head">
        <div><span className="cl-label">Tycoon · The company records</span><h1 className="cl-display game__title">Run history</h1></div>
        <button type="button" className="cl-btn" onClick={onBack}>Back</button>
      </header>
      <div className="history__tiles">
        <div className="tile"><span className="cl-label">Runs</span><b className="cl-num">{runs.length}</b></div>
        <div className="tile"><span className="cl-label">Finished as Chairman</span><b className="cl-num">{finished}</b></div>
        <div className="tile tile--gold"><span className="cl-label">Best score · Oil</span><b className="cl-num">{best !== null ? `${best} gold` : '—'}</b></div>
        <div className="tile"><span className="cl-label">Most common end</span><b className="cl-display">{common}</b></div>
      </div>
      <div className="history__table">
        {runs.length === 0 ? <p className="res-note">No runs yet. The ledger is waiting.</p> : (
          <table>
            <thead><tr><th className="col-wide">#</th><th>Date</th><th className="col-wide">Industry</th><th>How far</th><th>Ended</th><th className="num">Score</th></tr></thead>
            <tbody>{runs.map((r, i) => (
              <tr key={r.id}>
                <td className="col-wide">{runs.length - i}</td><td>{new Date(r.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</td><td className="col-wide">{r.industry}</td>
                <td><span className="mini-bar">{Array.from({ length: 16 }, (_, k) => <i key={k} className={k + 1 < r.rounds || (k + 1 === r.rounds && !ended(r)) ? 'd' : k + 1 === r.rounds ? 'x' : ''} />)}</span> {r.completed ? 'Complete' : `Stage ${Math.ceil(r.rounds / 4)} · Round ${((r.rounds - 1) % 4) + 1}`}</td>
                <td className={r.outcome === 'Quit' ? 'res-note' : ended(r) ? 'cl-minus' : ''}>{r.outcome}{r.tactic && <span className="history__badge">{r.tactic}</span>}{r.hard && <span className="history__badge">{r.completed ? 'Self-Made' : 'Hard mode'}</span>}</td>
                <td className="num">{r.gold !== null ? `${r.gold} gold` : <span className="res-note">— ({r.stageGold} gold)</span>}</td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
      <p className="res-note">A score is only recorded when you finish all four stages as Chairman. Each square is one round; red is where the run ended.</p>
    </div>
  )
}
