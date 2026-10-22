import { useState } from 'react'
import { BONUSES, type BonusKey } from '../engine/data'
import { bestScore, completedIndustries, loadRuns, loadUnlocks, trustFundOffered, type RunRecord } from '../storage'
import { CONFIG } from '../engine/config'
import { play } from '../sound'
import { openSettings } from './settingsBus'
import { AdminStartPanel } from './AdminPanel'
import type { AdminStart } from '../engine/admin'

const INDUSTRIES = ['Oil', 'Pharmaceutical', 'Fishing', 'Tech']
const ANNOUNCED = ['Pharmaceutical'] // shown as Coming soon before Oil is finished
// a run that died, rather than one that finished a stage or the game
const ended = (r: RunRecord) => ['Bankrupt', 'Out of time', 'Quit', 'Ousted', 'Ruined'].includes(r.outcome)

export function Intro({ onBegin, onHistory, onAbout, onScoreboard, admin, onAdminStart }: { onBegin: () => void; onHistory: () => void; onAbout: () => void; onScoreboard: () => void; admin?: boolean; onAdminStart?: (o: AdminStart) => void }) {
  const done = completedIndustries()
  const best = bestScore('Oil')
  const won = done.length > 0 // the scoreboard unlocks the first time you win the game
  // each industry is revealed when the one before it is finished; three tiles on the page
  const shown = INDUSTRIES.slice(0, 3)
  const open = shown.filter((name, i) => i === 0 || ANNOUNCED.includes(name) || done.includes(shown[i - 1]))
  return (
    <div className="screen intro" data-theme="victorian">
      <img className="intro__art" src={`${import.meta.env.BASE_URL}art/title.jpg`} alt="Tycoon: a share certificate with the industries arranged around a globe" />
      <div className="intro__side">
        <span className="cl-label">Industry. Influence. Plausible deniability.</span>
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
      </div>
    </div>
  )
}

/** The scoreboard: every finished game on this device, best first. Unlocked by winning once. */
export function Scoreboard({ onBack }: { onBack: () => void }) {
  const board = loadRuns().filter(r => r.completed && r.gold !== null).sort((a, b) => (b.gold as number) - (a.gold as number))
  return (
    <div className="screen history scoreboard" data-theme="victorian">
      <header className="game__head">
        <div><span className="cl-label">Tycoon · Big Oil beats the Truth</span><h1 className="cl-display game__title">Scoreboard</h1></div>
        <button type="button" className="cl-btn" onClick={onBack}>Back</button>
      </header>
      <img className="scoreboard__banner" src={`${import.meta.env.BASE_URL}art/screens/scoreboard.jpg`} alt="The Earth from orbit, every continent on fire" />
      <div className="history__table">
        <table className="cl-table">
          <thead><tr><th>#</th><th>Date</th><th>Industry</th><th>Badge</th><th className="num">Gold</th></tr></thead>
          <tbody>
            {board.map((r, i) => (
              <tr key={r.id}><td>{i + 1}</td><td>{new Date(r.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</td><td>{r.industry}</td><td>{r.tactic ?? '—'}</td><td className="num">{r.gold}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function BonusPick({ onPick, onBack }: { onPick: (b: BonusKey) => void; onBack: () => void }) {
  const [offered] = useState(() => trustFundOffered(CONFIG.trustFundStreak))
  const [faithful] = useState(() => !!loadUnlocks().proxy)
  return (
    <div className="screen bonus" data-theme="victorian">
      <header className="game__head">
        <div><span className="cl-label">Oil · Pennsylvania · 1863</span><h1 className="cl-display game__title">Choose your advantage</h1></div>
        <button type="button" className="cl-btn" onClick={onBack}>Back</button>
      </header>
      <div className="bonus__grid">
        {(Object.keys(BONUSES) as BonusKey[]).filter(k => (k !== 'trustFund' || offered) && (k !== 'oldFaithful' || faithful)).map(k => (
          <button key={k} type="button" className={`bonus__card ${k === 'trustFund' ? 'bonus__card--earned' : ''}`} onClick={() => { play('card'); onPick(k) }}>
            {k === 'trustFund' && <span className="cl-label bonus__tag">{CONFIG.trustFundStreak} failures in a row</span>}
            <span className="cl-display bonus__name">{BONUSES[k].name}</span>
            <span>{BONUSES[k].text}</span>
          </button>
        ))}
      </div>
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
            <thead><tr><th>#</th><th>Date</th><th>Industry</th><th>How far</th><th>Ended</th><th className="num">Score</th></tr></thead>
            <tbody>{runs.map((r, i) => (
              <tr key={r.id}>
                <td>{runs.length - i}</td><td>{new Date(r.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</td><td>{r.industry}</td>
                <td><span className="mini-bar">{Array.from({ length: 16 }, (_, k) => <i key={k} className={k + 1 < r.rounds || (k + 1 === r.rounds && !ended(r)) ? 'd' : k + 1 === r.rounds ? 'x' : ''} />)}</span> {r.completed ? 'Complete' : `Stage ${Math.ceil(r.rounds / 4)} · Round ${((r.rounds - 1) % 4) + 1}`}</td>
                <td className={r.outcome === 'Quit' ? 'res-note' : ended(r) ? 'cl-minus' : ''}>{r.outcome}{r.tactic && <span className="history__badge">{r.tactic}</span>}</td>
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
