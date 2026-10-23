import { useEffect, useState } from 'react'
import { submitScore } from '../telemetry'
import type { Run } from '../engine/engine'
import { roundsReached } from '../engine/engine'
import { BONUSES, ITEMS, rewardInfo } from '../engine/data'
import { ERA_THEME, money, units, year } from '../engine/format'
import { CONFIG } from '../engine/config'
import { play } from '../sound'
import { iconUrl } from './icons'
import { TACTICS, tacticFor } from '../engine/tactics'

function Progress({ reached, dead }: { reached: number; dead: boolean }) {
  return (
    <div className="progress">
      {[1, 2, 3, 4].map(s => (
        <div key={s} className="progress__stage">
          <div>{(s === 4 && reached >= 17 ? [1, 2, 3, 4, 5] : [1, 2, 3, 4]).map(r => { // the Truth: a surprise fifth round
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

export function CrashOut({ run, bailout, onAgain, onHistory }: { run: Run; bailout?: boolean; onAgain: () => void; onHistory: () => void }) {
  useEffect(() => { play('stamp'); const t = setTimeout(() => play(run.loss?.reason === 'midnight' ? 'midnight' : 'straw'), 500); return () => clearTimeout(t) }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const st = run.stage
  const reached = roundsReached(run)
  const reason = run.loss?.reason ?? 'bankrupt'
  const stalled = reason === 'stalemate'
  const ENDS = {
    bankrupt: { title: 'The company is bankrupt', sub: `The bank has taken your ${st >= 3 ? 'Rigs' : st >= 2 ? 'Fields' : 'Wells'}.`, stamp: 'BANKRUPT', note: 'Account closed by order of the bank.' },
    stalemate: { title: 'The investors lost patience', sub: `${CONFIG.turnLimit} turns and nothing to show for it. The board has found a new Chairman.`, stamp: 'REMOVED', note: 'Chairman removed by order of the board.' },
    ousted: { title: 'The board has voted you out', sub: 'Board Exposure reached the top. Your office is cleared by Friday. They kept the company; you kept your fortune, but nobody records a fortune that walked out of the door.', stamp: 'OUSTED', note: 'Chairman removed by a vote of the board.' },
    ruined: { title: 'You are personally ruined', sub: 'Your own fortune ran out. The company carries on without you, as companies do.', stamp: 'RUINED', note: 'Personal account closed. Company account unaffected.' },
    midnight: { title: 'Midnight', sub: 'The clock ran out. The Truth is out: in the papers, in the courts, in the street. Big Oil will survive. You will not be running it.', stamp: 'MIDNIGHT', note: 'Chairman removed in the public interest.' },
    brokenUp: { title: 'The company is broken up', sub: 'Heat reached 100. Washington had seen enough. Your empire is now seven smaller, equally profitable companies, none of them run by you.', stamp: 'BROKEN UP', note: 'Divestiture ordered in the public interest.' },
  }[reason]
  return (
    <div className="screen end" data-theme={ERA_THEME[st] ?? 'victorian'}>
      <header className="end__head">
        <span className="cl-label">Oil · Stage {st} · Round {run.round} · {year(st, run.round)}</span>
        <h1 className="cl-display end__title">{ENDS.title}</h1>
        <p className="end__sub">{ENDS.sub} {run.fire ? 'The fire is still burning. ' : ''}Nobody remembers your name.</p>
        <span className="stamp-big">{ENDS.stamp}</span>
      </header>
      <div className="end__grid">
        <div className="end__main">
          <div className="end__progress"><div className="end__progress-head"><span className="cl-label">How far you got</span><span className="cl-num">Round {reached} of 16</span></div><Progress reached={reached} dead /></div>
          <div className="end__tiles">
            <div className="tile"><span className="cl-label">Finished off by</span><b className="cl-display">{run.loss?.by[0] ?? (reason === 'ousted' ? 'The board' : 'Debt')}</b>{run.loss && run.loss.by.length > 1 && <span className="res-note">and {run.loss.by.slice(1).join(', ')}</span>}</div>
            <div className="tile"><span className="cl-label">Wells built</span><b className="cl-num">{run.stats.wellsBuilt}</b><span className="res-note">{run.stats.wellsDry} dry · {run.stats.wellsBurnt} burnt · {run.stats.wellsStolen} stolen · {run.stats.wellsLost} lost</span></div>
            <div className="tile"><span className="cl-label">Oil sold</span><b className="cl-num">{run.stats.oilSold} bbl</b><span className="res-note">{money(run.stats.earned, st)} earned · {money(run.stats.spent, st)} spent</span></div>
          </div>
          <div className="fortune fortune--lost"><div><span className="cl-label">Your fortune</span><p>Not recorded. A fortune only counts if you finish as Chairman.</p></div><b className="cl-num struck">{run.gold} gold</b></div>
          {st === 2 && <div className="tile"><span className="cl-label">Board Exposure at the end</span><b className="cl-num">{run.exposure} / {CONFIG.exposureMax}</b></div>}
          {st === 3 && <div className="tile"><span className="cl-label">Heat at the end</span><b className="cl-num">{run.heat} / {CONFIG.heatMax}</b></div>}
          {st === 4 && <div className="tile"><span className="cl-label">The Truth clock at the end</span><b className="cl-num">{(run.clock ?? 1) >= CONFIG.clockMax ? 'Midnight' : `${run.clock} o'clock`}</b></div>}
          {bailout && (
            <div className="unlock" role="status">
              <span className="cl-label">{CONFIG.trustFundStreak} failures in a row · Father has written</span>
              <b className="cl-display">{BONUSES.trustFund.name}</b>
              <span>{BONUSES.trustFund.text} On offer for your next run.</span>
            </div>
          )}
          <div className="end__buttons"><button type="button" className="cl-btn cl-btn--primary" onClick={onAgain}>Try again</button><button type="button" className="cl-btn" onClick={onHistory}>Run history</button></div>
        </div>
        <section className="cl-ledger ledger">
          <div className="cl-ledger__head"><span className="cl-label">Final turn</span><span className="cl-ledger__total cl-minus">{money(Math.max(0, run.capital), st)}</span></div>
          <ul className="cl-ledger__rows">{run.ledger.map((l, i) => <li key={i}><span>{units(l.label, st)}</span><span className={l.label === 'Brought forward' ? '' : l.amount < 0 ? 'cl-minus' : 'cl-plus'}>{l.label === 'Brought forward' ? money(l.amount, st) : money(l.amount, st, true)}</span></li>)}</ul>
          <p className="res-note">{stalled ? 'Chairman removed by order of the board.' : ENDS.note}</p>
        </section>
      </div>
    </div>
  )
}

export function StageComplete({ run, runId, onMenu, onHistory, onContinue, onScoreboard }: { run: Run; runId?: string | null; onMenu: () => void; onHistory: () => void; onContinue: () => void; onScoreboard: () => void }) {
  useEffect(() => { if (run.stage >= 4) return; play('register'); const t = setTimeout(() => play('win'), 900); return () => clearTimeout(t) }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const st = run.stage
  if (st >= 4) return <Victory run={run} runId={runId ?? null} onMenu={onMenu} onScoreboard={onScoreboard} />
  const last = st >= 4
  const copy = st === 1
    ? { title: 'The Rival Baron is finished', sub: 'His fields are yours. The new century is coming, and so is the competition.' }
    : st === 2 ? { title: 'The proxy fight is won', sub: 'The board is yours again, for now. A war is coming, and after it, the oil shocks.' }
    : { title: 'The Geneva Climate Summit is over', sub: 'The declaration calls for further research. Your delegates helped write it. Now everyone wants it to look green.' }
  const wells = run.plots.filter(Boolean).length
  const tactic = last ? tacticFor(run.tally, run.deck.length, run.stats.oilSold, run.stage >= 4 ? run.clock : 0) : null
  return (
    <div className="screen end" data-theme={ERA_THEME[st] ?? 'victorian'}>
      <header className="end__head">
        <span className="cl-label">Oil · Stage {st} complete · {year(st, 4)}</span>
        <h1 className="cl-display end__title">{copy.title}</h1>
        <p className="end__sub">{copy.sub}</p>
        <span className="stamp-big stamp-big--win">STAGE {st}</span>
      </header>
      <div className="end__grid">
        <div className="end__main">
          <section className="winnings" role="status" aria-label="What you won">
            <span className="cl-label winnings__head">{st === 1 ? 'For beating the Baron' : st === 2 ? 'For winning the proxy fight' : 'For watering down the declaration'}, you win</span>
            <div className="winnings__row">
              <div className="winnings__prize winnings__prize--gold">
                <b className="cl-num">+{CONFIG.bossGold}</b>
                <span className="cl-label">gold</span>
                <span className="res-note">into your own fortune</span>
              </div>
              {run.reward && (
                <div className="winnings__prize">
                  <img src={iconUrl(rewardInfo(run.reward, st).icon)} alt="" />
                  <div>
                    <b className="cl-display">{rewardInfo(run.reward, st).name}</b>
                    <span>{units(rewardInfo(run.reward, st).text, st)}</span>
                    <span className="res-note">{`Yours for stage ${st + 1}.`}</span>
                  </div>
                </div>
              )}
            </div>
          </section>
          {tactic && (
            <section className="badge" role="status" aria-label="Your tactic">
              <img src={iconUrl(TACTICS[tactic].icon)} alt="" />
              <div>
                <span className="cl-label">How you won</span>
                <b className="cl-display">{TACTICS[tactic].name}</b>
                <span>{TACTICS[tactic].text}</span>
              </div>
            </section>
          )}
          <div className="end__progress"><div className="end__progress-head"><span className="cl-label">How far you got</span><span className="cl-num">Round {st * 4} of 16</span></div><Progress reached={st * 4} dead={false} /></div>
          <div className="end__tiles">
            <div className="tile"><span className="cl-label">Capital</span><b className="cl-num">{money(run.capital, st)}</b><span className="res-note">{last ? 'left in the company' : `carried into stage ${st + 1}`}</span></div>
            <div className="tile"><span className="cl-label">{st === 1 ? 'Wells standing' : st === 2 ? 'Fields and Wells' : 'Rigs'}</span><b className="cl-num">{wells}</b><span className="res-note">{st === 1 ? (wells ? 'They become Fields: never running dry.' : `${run.stats.wellsBuilt} built in total`) : st === 2 ? `${run.plots.filter(w => w?.field).length} of them Fields. They all become offshore Rigs.` : 'pumping in the Gulf'}</span></div>
            <div className="tile"><span className="cl-label">Oil sold</span><b className="cl-num">{run.stats.oilSold} bbl</b><span className="res-note">{money(run.stats.earned, st)} earned</span></div>
          </div>
          {st === 3 && (
            <div className={`unlock ${run.residue === 'regulators' ? 'unlock--neg' : 'reward'}`} role="status">
              <span className="cl-label">Washington remembers · Heat ended at {run.heat} / {CONFIG.heatMax}</span>
              <b className="cl-display">{run.residue ? ITEMS[run.residue].name : 'Nothing on file'}</b>
              <span>{run.residue ? units(ITEMS[run.residue].text, st) : `Neither hot nor cold: nothing follows you. (${CONFIG.heatHigh}+ leaves you On File; ${CONFIG.heatLow} or less, a Clean Image.)`}</span>
            </div>
          )}
          {st === 2 && (
            <div className={`unlock ${run.residue === 'boardGrudge' ? 'unlock--neg' : 'reward'}`} role="status">
              <span className="cl-label">The board remembers · Board Exposure ended at {run.exposure} / {CONFIG.exposureMax}</span>
              <b className="cl-display">{run.residue ? ITEMS[run.residue].name : 'A clean slate'}</b>
              <span>{run.residue ? units(ITEMS[run.residue].text, st) : `Neither high nor low: nothing follows you. (${CONFIG.exposureHigh}+ leaves a Board Grudge; ${CONFIG.exposureLow} or less, Loyal Directors.)`}</span>
            </div>
          )}
          <div className="fortune"><div><span className="cl-label">Your fortune</span></div><b className="cl-num">{run.gold} gold</b></div>
          <div className="end__buttons">
            {last ? <button type="button" className="cl-btn cl-btn--primary" onClick={onMenu}>Back to the start</button>
              : <button type="button" className="cl-btn cl-btn--primary" onClick={onContinue}>{st === 1 ? 'Into the new century' : st === 2 ? 'Go multinational' : 'Become Big Oil'}</button>}
            {last && <button type="button" className="cl-btn" onClick={onHistory}>Run history</button>}
          </div>
        </div>
      </div>
    </div>
  )
}

/** The end of the game: Big Oil beats the Truth. Your gold is the score. */
function Victory({ run, runId, onMenu, onScoreboard }: { run: Run; runId: string | null; onMenu: () => void; onScoreboard: () => void }) {
  const [name, setName] = useState('')
  const [sent, setSent] = useState<'idle' | 'sending' | 'done' | 'failed'>('idle')
  async function send() {
    if (!runId || sent === 'sending' || sent === 'done') return
    setSent('sending')
    setSent((await submitScore(runId, name)) ? 'done' : 'failed')
    play('coin')
  }
  useEffect(() => { const t = setTimeout(() => play('victory'), 300); return () => clearTimeout(t) }, [])
  const tactic = tacticFor(run.tally, run.deck.length, run.stats.oilSold, run.stage >= 4 ? run.clock : 0)
  return (
    <div className="screen end victory" data-theme="greenwash">
      <img className="victory__banner" src={`${import.meta.env.BASE_URL}art/screens/victory.jpg`} alt="A chairman raises a glass of champagne in a glass boardroom while the city burns outside" />
      <header className="end__head">
        <span className="cl-label">Oil · Game complete · {year(4, 5)} · {(run.clock ?? 1) >= CONFIG.clockMax - 1 ? 'one minute to midnight' : `${run.clock} o'clock`}</span>
        <h1 className="cl-display end__title">Big Oil beats the Truth.</h1>
        <p className="end__sub">Good for you and your gold.</p>
        <span className="stamp-big stamp-big--win">CHAIRMAN</span>
      </header>
      <div className="end__grid">
        <div className="end__main">
          <section className="winnings victory__score" role="status" aria-label="Your score">
            <span className="cl-label winnings__head">Your score: your own fortune</span>
            <div className="winnings__row">
              <div className="winnings__prize winnings__prize--gold">
                <b className="cl-num">{run.gold}</b>
                <span className="cl-label">gold</span>
                <span className="res-note">{CONFIG.bossGold} of it for beating the Truth</span>
              </div>
            </div>
          </section>
          {tactic && (
            <section className="badge" role="status" aria-label="Your tactic">
              <img src={iconUrl(TACTICS[tactic].icon)} alt="" />
              <div>
                <span className="cl-label">How you won</span>
                <b className="cl-display">{TACTICS[tactic].name}</b>
                <span>{TACTICS[tactic].text}</span>
              </div>
            </section>
          )}
          <div className="end__progress"><div className="end__progress-head"><span className="cl-label">How far you got</span><span className="cl-num">Round 17 of 16</span></div><Progress reached={17} dead={false} /></div>
          <div className="end__tiles">
            <div className="tile"><span className="cl-label">Capital</span><b className="cl-num">{money(run.capital, 4)}</b><span className="res-note">left in Big Oil</span></div>
            <div className="tile"><span className="cl-label">Oil sold</span><b className="cl-num">{run.stats.oilSold} bbl</b><span className="res-note">over a century and a half</span></div>
            <div className="tile"><span className="cl-label">The Truth clock</span><b className="cl-num">{run.clock} o'clock</b><span className="res-note">and still ticking</span></div>
          </div>
          {runId && (
            <section className="global-entry" aria-label="The global scoreboard">
              <span className="cl-label">The global scoreboard</span>
              {sent === 'done' ? <p>You're on it, as {name.trim() || 'Anonymous tycoon'}.</p> : <>
                <p className="res-note">Your gold, a name you choose and your badge go on the scoreboard everyone sees. Nothing else.</p>
                <div className="global-entry__row">
                  <input className="global-entry__name" maxLength={20} placeholder="Anonymous tycoon" value={name} onChange={e => setName(e.target.value)} aria-label="Your name on the scoreboard" />
                  <button type="button" className="cl-btn cl-btn--primary" disabled={sent === 'sending'} onClick={() => void send()}>{sent === 'sending' ? 'Sending…' : 'Put me on it'}</button>
                </div>
                {sent === 'failed' && <p className="cl-minus res-note">Couldn't reach the scoreboard. Check your connection and try again.</p>}
              </>}
            </section>
          )}
          <div className="end__buttons">
            <button type="button" className="cl-btn cl-btn--primary" onClick={onScoreboard}>See the scoreboard</button>
            <button type="button" className="cl-btn" onClick={onMenu}>Back to the start</button>
          </div>
        </div>
      </div>
    </div>
  )
}
