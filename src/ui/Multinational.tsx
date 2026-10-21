// Between stage 2 and 3: the company goes multinational. Fields become offshore Rigs, old
// land, fire and board cards turn to junk, Heat arrives, and the Oil Shock is on the table. Upgrade and destroy here too.
import { useState } from 'react'
import { CONFIG } from '../engine/config'
import { CARDS } from '../engine/data'
import { canUpgrade, debtPerTurn, rigCount, type Action, type Run } from '../engine/engine'
import { money, units, year } from '../engine/format'
import { play } from '../sound'
import { CardView } from './CardView'
import { HeatMeter } from './Heat'
import { SettingsButton } from './Settings'

type Mode = null | 'destroy' | 'upgrade'

export function MultinationalScreen({ run, dispatch }: { run: Run; dispatch: (a: Action) => void }) {
  const [mode, setMode] = useState<Mode>(null)
  const st = run.stage
  const m = (n: number, sign = false) => money(n, st, sign)
  const can = (cost: number) => run.capital - cost >= 1
  const rigs = rigCount(run)
  const dead = run.deck.filter(c => CARDS[c.key].junk && !CARDS[c.key].forced).length

  return (
    <div className="screen shop incorporate multinational" data-theme="seventies">
      <header className="game__head">
        <div>
          <span className="cl-label">Oil · Stage 3 · {year(3, 1)} · Diversifying</span>
          <h1 className="cl-display game__title">Multinational</h1>
          <p className="end__sub">The board is yours. The oil is offshore. Everyone is watching.</p>
        </div>
        <div className="shop__head-right"><SettingsButton /><span className="stamp-big stamp-big--win incorporate__stamp">EST. {year(3, 1)}</span></div>
      </header>

      <div className="shop__grid">
        <div className="shop__main">
          <section className="end__tiles incorporate__tiles" aria-label="What carried over">
            <div className="tile"><span className="cl-label">Rigs</span><b className="cl-num">{rigs} / {CONFIG.maxPlots}</b></div>
            <div className="tile"><span className="cl-label">Dead Weight and Dry Leases</span><b className="cl-num">{dead} cards</b></div>
          </section>

          <section className="incorporate__board">
            <HeatMeter run={run} />
            <p className="res-note">No fires, no board. Every AP you spend adds {CONFIG.heatPerAP} Heat; Climate Science and the summit add more. Lobbying takes it down. Some enemies can be bought out with Capital instead of fought.</p>
          </section>

          <section className="shop__deals">
            <div className="cl-slot slot incorporate__loan">
              <span className="cl-tag">{m(CONFIG.oilShockCash, true)}</span>
              <div className="cl-slot__name">The Oil Shock</div>
              <div className="cl-slot__desc"><span className="cl-plus">{m(CONFIG.oilShockCash, true)} Capital now.</span> <span className="cl-minus">Start the stage at {CONFIG.oilShockHeat} Heat.</span></div>
              <button type="button" className="cl-btn" disabled={run.shop.loanTaken} onClick={() => { dispatch({ type: 'takeLoan' }); play('coin') }}>{run.shop.loanTaken ? 'Cashed in' : 'Cash in'}</button>
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
          </section>
          <section className="fortune"><div><span className="cl-label">Your fortune</span><b className="cl-num">{run.gold} gold</b></div><span className="res-note">The Bribery Scandal takes gold. Personal Guarantee and Dip into the Trust turn it back into Capital.</span></section>
          <div className="events">{run.events.slice(0, 2).map((e, i) => <p key={i}>{units(e, st)}</p>)}</div>
          <button type="button" className="cl-btn cl-btn--primary leave" onClick={() => { dispatch({ type: 'leaveShop' }); play('click') }}>Begin round 1</button>
        </aside>
      </div>
    </div>
  )
}
