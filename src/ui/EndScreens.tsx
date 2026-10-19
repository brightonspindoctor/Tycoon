import { useEffect } from 'react'
import type { Run } from '../engine/engine'
import { roundsReached } from '../engine/engine'
import { money, year } from '../engine/format'
import { play } from '../sound'

function Progress({ reached, dead }: { reached: number; dead: boolean }) {
  return (
    <div className="progress">
      {[1, 2, 3, 4].map(s => (
        <div key={s} className="progress__stage">
          <div>{[1, 2, 3, 4].map(r => {
            const n = (s - 1) * 4 + r
            const cls = n < reached || (!dead && n === reached) ? 'is-done' : n === reached && dead ? 'is-dead' : ''
            return <span key={r} className={`seg ${cls}`} />
          })}</div>
          <span className="cl-label">Stage {s}</span>
        </div>
      ))}
    </div>
  )
}

export function CrashOut({ run, onAgain, onHistory }: { run: Run; onAgain: () => void; onHistory: () => void }) {
  useEffect(() => { play('stamp'); const t = setTimeout(() => play('lose'), 400); return () => clearTimeout(t) }, [])
  const st = run.stage
  const reached = roundsReached(run)
  const stalled = run.loss?.reason === 'stalemate'
  return (
    <div className="screen end" data-theme="victorian">
      <header className="end__head">
        <span className="cl-label">Oil · Stage {st} · Round {run.round} · {year(st, run.round)}</span>
        <h1 className="cl-display end__title">{stalled ? 'The investors lost patience' : 'The company is bankrupt'}</h1>
        <p className="end__sub">The bank has taken your Wells. {run.fire ? 'The fire is still burning. ' : ''}Nobody remembers your name.</p>
        <span className="stamp-big">BANKRUPT</span>
      </header>
      <div className="end__grid">
        <div className="end__main">
          <div className="end__progress"><div className="end__progress-head"><span className="cl-label">How far you got</span><span className="cl-num">Round {reached} of 16</span></div><Progress reached={reached} dead /></div>
          <div className="end__tiles">
            <div className="tile"><span className="cl-label">Finished off by</span><b className="cl-display">{run.loss?.by[0] ?? 'Debt'}</b>{run.loss && run.loss.by.length > 1 && <span className="res-note">and {run.loss.by.slice(1).join(', ')}</span>}</div>
            <div className="tile"><span className="cl-label">Wells built</span><b className="cl-num">{run.stats.wellsBuilt}</b><span className="res-note">{run.stats.wellsBurnt} burnt · {run.stats.wellsStolen} stolen · {run.stats.wellsLost} lost</span></div>
            <div className="tile"><span className="cl-label">Oil sold</span><b className="cl-num">{run.stats.oilSold} bbl</b><span className="res-note">{money(run.stats.earned, st)} earned · {money(run.stats.spent, st)} spent</span></div>
          </div>
          <div className="fortune fortune--lost"><div><span className="cl-label">Your fortune</span><p>Not recorded. A fortune only counts if you finish as Chairman.</p></div><b className="cl-num struck">{run.gold} gold</b></div>
          <div className="end__buttons"><button type="button" className="cl-btn cl-btn--primary" onClick={onAgain}>Try again</button><button type="button" className="cl-btn" onClick={onHistory}>Run history</button></div>
        </div>
        <section className="cl-ledger ledger">
          <div className="cl-ledger__head"><span className="cl-label">Final turn</span><span className="cl-ledger__total cl-minus">{money(Math.max(0, run.capital), st)}</span></div>
          <ul className="cl-ledger__rows">{run.ledger.map((l, i) => <li key={i}><span>{l.label}</span><span className={l.label === 'Brought forward' ? '' : l.amount < 0 ? 'cl-minus' : 'cl-plus'}>{l.label === 'Brought forward' ? money(l.amount, st) : money(l.amount, st, true)}</span></li>)}</ul>
          <p className="res-note">Account closed by order of the bank.</p>
        </section>
      </div>
    </div>
  )
}

export function StageComplete({ run, onMenu, onHistory }: { run: Run; onMenu: () => void; onHistory: () => void }) {
  useEffect(() => { play('win') }, [])
  const st = run.stage
  return (
    <div className="screen end" data-theme="victorian">
      <header className="end__head">
        <span className="cl-label">Oil · Stage 1 complete · 1890</span>
        <h1 className="cl-display end__title">The Rival Baron is finished</h1>
        <p className="end__sub">His fields are yours. The new century is coming, and so is the competition.</p>
        <span className="stamp-big stamp-big--win">STAGE 1</span>
      </header>
      <div className="end__grid">
        <div className="end__main">
          <div className="end__progress"><div className="end__progress-head"><span className="cl-label">How far you got</span><span className="cl-num">Round 4 of 16</span></div><Progress reached={4} dead={false} /></div>
          <div className="end__tiles">
            <div className="tile"><span className="cl-label">Capital</span><b className="cl-num">{money(run.capital, st)}</b><span className="res-note">carried into stage 2</span></div>
            <div className="tile"><span className="cl-label">Wells standing</span><b className="cl-num">{run.plots.filter(Boolean).length}</b><span className="res-note">{run.stats.wellsBuilt} built in total</span></div>
            <div className="tile"><span className="cl-label">Oil sold</span><b className="cl-num">{run.stats.oilSold} bbl</b><span className="res-note">{money(run.stats.earned, st)} earned</span></div>
          </div>
          <div className="fortune"><div><span className="cl-label">Your fortune so far</span><p>Stage 2 is still being drilled. This playtest ends here.</p></div><b className="cl-num">{run.gold} gold</b></div>
          <div className="end__buttons"><button type="button" className="cl-btn cl-btn--primary" onClick={onMenu}>Back to the start</button><button type="button" className="cl-btn" onClick={onHistory}>Run history</button></div>
        </div>
      </div>
    </div>
  )
}
