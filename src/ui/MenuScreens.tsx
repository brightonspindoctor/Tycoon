import { useState } from 'react'
import { BONUSES, type BonusKey } from '../engine/data'
import { bestScore, checkTrustFund, completedIndustries, loadRuns, loadUnlocks, type RunRecord } from '../storage'
import { CONFIG } from '../engine/config'
import { isMuted, play, setMuted } from '../sound'

const INDUSTRIES = ['Oil', 'Fishing', 'Pharma', 'Tech']
// a run that died, rather than one that finished a stage or the game
const ended = (r: RunRecord) => r.outcome === 'Bankrupt' || r.outcome === 'Out of time'

export function Intro({ onBegin, onHistory }: { onBegin: () => void; onHistory: () => void }) {
  const done = completedIndustries()
  const best = bestScore('Oil')
  const [muted, setM] = useState(isMuted())
  // each industry is revealed when the one before it is finished
  const open = INDUSTRIES.filter((_, i) => i === 0 || done.includes(INDUSTRIES[i - 1]))
  return (
    <div className="screen intro" data-theme="victorian">
      <img className="intro__art" src={`${import.meta.env.BASE_URL}art/title.jpg`} alt="Tycoon: a share certificate with the industries arranged around a globe" />
      <div className="intro__side">
        <span className="cl-label">Industry. Influence. Plausible deniability.</span>
        <h1 className="cl-display intro__title">Choose your industry</h1>
        <p className="intro__lead">You start with $15, a bank loan and a hunch. Get rich. Stay in charge. Your fortune only counts if you're still Chairman at the end.</p>
        <div className="industries">
          {INDUSTRIES.map(name => open.includes(name) ? (
            <button key={name} type="button" className="industry" disabled={name !== 'Oil'} onClick={() => { play('click'); onBegin() }}>
              <span className="cl-display industry__name">{name}</span>
              <span className="res-note">{name === 'Oil' ? (best !== null ? `Best: ${best} gold` : 'Stage 1 playable') : 'Coming soon'}</span>
              <span className="cl-btn cl-btn--primary">Begin</span>
            </button>
          ) : (
            <div key={name} className="industry industry--sealed"><span className="cl-display industry__name">? ? ?</span><span className="cl-label">Sealed</span></div>
          ))}
          <div className="industry industry--sealed industry--hidden"><span className="cl-display industry__name">? ? ?</span><span className="cl-label">Sealed</span></div>
          <span className="res-note">Finish an industry as Chairman to unseal the next.</span>
        </div>
        <div className="intro__menu">
          <button type="button" className="cl-btn" onClick={onHistory}>Run history</button>
          <button type="button" className="cl-btn" onClick={() => { setMuted(!muted); setM(!muted) }}>{muted ? 'Sound off' : 'Sound on'}</button>
        </div>
      </div>
    </div>
  )
}

export function BonusPick({ onPick, onBack }: { onPick: (b: BonusKey) => void; onBack: () => void }) {
  const [unlocks] = useState(() => { checkTrustFund(CONFIG.trustFundUnlock); return loadUnlocks() })
  return (
    <div className="screen bonus" data-theme="victorian">
      <header className="game__head">
        <div><span className="cl-label">Oil · Pennsylvania · 1863</span><h1 className="cl-display game__title">Choose your advantage</h1></div>
        <button type="button" className="cl-btn" onClick={onBack}>Back</button>
      </header>
      <p className="bonus__lead">Everyone starts with $15, two action points, a ten-card deck and a loan from the bank. Pick one thing more.</p>
      <div className="bonus__grid">
        {(Object.keys(BONUSES) as BonusKey[]).filter(k => k !== 'trustFund' || unlocks.includes('trustFund')).map(k => (
          <button key={k} type="button" className={`bonus__card ${k === 'trustFund' ? 'bonus__card--earned' : ''}`} onClick={() => { play('card'); onPick(k) }}>
            {k === 'trustFund' && <span className="cl-label bonus__tag">Unlocked</span>}
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
                <td className={ended(r) ? 'cl-minus' : ''}>{r.outcome}</td>
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
