// Between stage 1 and 2: the company incorporates. What carried over, the board's
// arrival, the bank's loan, and a chance to upgrade and destroy cards.
import { useState } from 'react'
import { CONFIG } from '../engine/config'
import { canUpgrade, debtPerTurn, type Action, type Run } from '../engine/engine'
import { money, units, year } from '../engine/format'
import { play } from '../sound'
import { CardView } from './CardView'
import { ExposureMeter } from './Exposure'
import { SettingsButton } from './Settings'

type Mode = null | 'destroy' | 'upgrade'

export function IncorporateScreen({ run, dispatch }: { run: Run; dispatch: (a: Action) => void }) {
  const [mode, setMode] = useState<Mode>(null)
  const st = run.stage
  const m = (n: number, sign = false) => money(n, st, sign)
  const can = (cost: number) => run.capital - cost >= 1
  const fields = run.plots.filter(w => w?.field).length
  const worn = run.deck.filter(c => c.key === 'oldProspect').length
  const skimmed = run.stats.skims

  return (
    <div className="screen shop incorporate" data-theme="deco">
      <header className="game__head">
        <div>
          <span className="cl-label">Oil · Stage 2 · {year(2, 1)} · Technical race</span>
          <h1 className="cl-display game__title">Incorporated</h1>
          <p className="end__sub">The Baron's fields are yours. Now you answer to a board.</p>
        </div>
        <div className="shop__head-right"><SettingsButton /><span className="stamp-big stamp-big--win incorporate__stamp">INC. {year(2, 1)}</span></div>
      </header>

      <div className="shop__grid">
        <div className="shop__main">
          <section className="end__tiles incorporate__tiles" aria-label="What carried over">
            <div className="tile"><span className="cl-label">Fields</span><b className="cl-num">{fields}</b><span className="res-note">{fields ? `Your ${fields === 1 ? 'Well is now a Field' : `${fields} Wells are now Fields`}: 1 oil a turn, never dry.` : 'No Wells were standing.'} New Wells never run dry either.</span></div>
            <div className="tile"><span className="cl-label">Prospecting is over</span><b className="cl-num">{worn ? `${worn} worn` : 'Wells'}</b><span className="res-note">The Exchange sells Wells now, not Prospects. A Steel Derrick is in your deck{worn ? '; old Prospects just add a Well' : ''}.</span></div>
            <div className="tile"><span className="cl-label">Your fortune</span><b className="cl-num">{run.gold} gold</b><span className="res-note">Some enemies can take gold now. Below 0, you're ruined.</span></div>
          </section>

          <section className="incorporate__board">
            <ExposureMeter run={run} />
            <p className="res-note">The new board read the old books: {skimmed ? `you skimmed ${skimmed} gold in stage 1, so Board Exposure starts at ${run.exposure}.` : 'nothing skimmed, so Board Exposure starts at 0.'} High from {CONFIG.exposureHigh}. A Pay a Dividend card is in your deck, and an Expense Account: from now on, that's how you skim (from {m(CONFIG.skimRate2[1])} a gold).</p>
          </section>

          <section className="shop__deals">
            <div className="cl-slot slot incorporate__loan">
              <span className="cl-tag">{m(CONFIG.stage2Loan, true)}</span>
              <div className="cl-slot__name">The bank's offer</div>
              <div className="cl-slot__desc"><span className="cl-plus">{m(CONFIG.stage2Loan, true)} Capital now.</span> <span className="cl-minus">Bank Debt rises by {m(CONFIG.stage2LoanDebt)} a turn, for good.</span></div>
              <button type="button" className="cl-btn" disabled={run.shop.loanTaken} onClick={() => { dispatch({ type: 'takeLoan' }); play('coin') }}>{run.shop.loanTaken ? 'Signed' : 'Sign'}</button>
            </div>
            <div className="cl-slot slot">
              <span className="cl-tag">{m(run.upgradeCost)}</span>
              <div className="cl-slot__name">Upgrade a card</div>
              <div className="cl-slot__desc">Once per card. The price rises each time.</div>
              <button type="button" className="cl-btn" disabled={!can(run.upgradeCost) || !run.deck.some(canUpgrade)} onClick={() => setMode(mode === 'upgrade' ? null : 'upgrade')}>{mode === 'upgrade' ? 'Cancel' : 'Choose'}</button>
            </div>
            <div className="cl-slot slot">
              <span className="cl-tag">{m(run.destroyCost)}</span>
              <div className="cl-slot__name">Destroy a card</div>
              <div className="cl-slot__desc">Clear out the old stock.</div>
              <button type="button" className="cl-btn" disabled={!can(run.destroyCost)} onClick={() => setMode(mode === 'destroy' ? null : 'destroy')}>{mode === 'destroy' ? 'Cancel' : 'Choose'}</button>
            </div>
          </section>

          <section className="deck">
            <span className="cl-label">Your deck · {run.deck.length} cards{mode ? ` · choose a card to ${mode}` : ''}</span>
            <div className="deck__list">
              {run.deck.map(c => {
                const ok = mode === 'destroy' || (mode === 'upgrade' && canUpgrade(c))
                return <CardView key={c.id} card={c} small stage={st} playable={!mode || ok} marked={ok && mode ? mode : undefined} onClick={() => {
                  if (!ok || !mode) return
                  dispatch({ type: mode === 'destroy' ? 'destroyCard' : 'upgradeCard', cardId: c.id })
                  play(mode === 'destroy' ? 'stamp' : 'coin')
                  setMode(null)
                }} />
              })}
            </div>
          </section>
        </div>

        <aside className="col-money">
          <section className="cl-ledger ledger">
            <div className="cl-ledger__head"><span className="cl-label">Capital</span><span className="cl-ledger__total">{m(run.capital)}</span></div>
            <ul className="cl-ledger__rows">
              {run.ledger.slice(-6).map((l, i) => <li key={i} className="ink-in"><span>{units(l.label, st)}</span><span className={l.amount < 0 ? 'cl-minus' : 'cl-plus'}>{m(l.amount, true)}</span></li>)}
              <li className="next-debt"><span>Bank Debt per turn</span><span className="cl-minus">{debtPerTurn(run) ? `(${m(-debtPerTurn(run))})` : 'None'}</span></li>
            </ul>
            {run.bonus === 'trustFund' && <p className="res-note">The Trust Fund is spent. Bank Debt starts this stage.</p>}
          </section>
          <div className="events">{run.events.slice(0, 2).map((e, i) => <p key={i}>{units(e, st)}</p>)}</div>
          <button type="button" className="cl-btn cl-btn--primary leave" onClick={() => { dispatch({ type: 'leaveShop' }); play('click') }}>Begin round 1</button>
        </aside>
      </div>
    </div>
  )
}
