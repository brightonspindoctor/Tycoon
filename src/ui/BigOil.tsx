// Between stage 3 and 4: the multinational becomes Big Oil. Old loans are paid off, the World Bank
// offers development finance with a Green Project attached, three cards go for free in the clear-out,
// Heat is gone and the Truth clock starts. Pick two new cards, one of each damage type on offer.
import { useState } from 'react'
import { CONFIG } from '../engine/config'
import { CARDS } from '../engine/data'
import { canUpgrade, rigCount, type Action, type Run } from '../engine/engine'
import { money, units, year } from '../engine/format'
import { play } from '../sound'
import { CardView } from './CardView'
import { TruthClock } from './TruthClock'
import { SettingsButton } from './Settings'

type Mode = null | 'destroy' | 'upgrade'

export function BigOilScreen({ run, dispatch }: { run: Run; dispatch: (a: Action) => void }) {
  const [mode, setMode] = useState<Mode>(null)
  const st = run.stage
  const m = (n: number, sign = false) => money(n, st, sign)
  const can = (cost: number) => run.capital - cost >= 1
  const offer = run.offer ?? []
  const picked = run.picked ?? []
  const ready = !offer.length || picked.length >= Math.min(CONFIG.incorporatePicks, offer.length)
  const free = run.freeDestroys ?? 0

  return (
    <div className="screen shop incorporate bigoil" data-theme="greenwash">
      <header className="game__head">
        <div>
          <span className="cl-label">Oil · Stage 4 · {year(4, 1)} · Battling the Truth</span>
          <h1 className="cl-display game__title">Big Oil</h1>
          <p className="end__sub">Powering a better tomorrow™. The summit is over, the oil is everywhere, and now it has to look green.</p>
        </div>
        <div className="shop__head-right"><SettingsButton /><span className="stamp-big stamp-big--win incorporate__stamp">EST. {year(4, 1)}</span></div>
      </header>

      <div className="shop__grid">
        <div className="shop__main">
          <section className="end__tiles incorporate__tiles" aria-label="What carried over">
            <div className="tile"><span className="cl-label">Rigs</span><b className="cl-num">{rigCount(run)} / {CONFIG.maxPlots}</b></div>
            <div className="tile"><span className="cl-label">Old loans</span><b className="cl-num">Paid off</b></div>
            <div className="tile"><span className="cl-label">Free clear-out</span><b className="cl-num">{free} left</b></div>
          </section>

          <section className="incorporate__board">
            <TruthClock run={run} />
            <p className="res-note">No Heat any more: old Heat cards keep only their other effects. Every enemy's 2nd and 5th moves move the clock on an hour. At midnight, the Truth is out and the run is over.</p>
          </section>

          <section className="incorporate__pick" aria-label="New cards">
            <span className="cl-label">Pick {CONFIG.incorporatePicks} new cards · {picked.length} of {CONFIG.incorporatePicks}</span>
            <p className="res-note">The others go on sale at the first Investor Portal visit.</p>
            <div className="deck__list">
              {offer.map((k, i) => {
                const on = picked.includes(k)
                const full = !on && picked.length >= CONFIG.incorporatePicks
                return <CardView key={k} card={{ id: -1 - i, key: k, uses: CARDS[k].uses }} stage={st} selected={on} playable={!full} onClick={() => { if (full) return; dispatch({ type: 'pickCard', key: k }); play('click') }} />
              })}
            </div>
          </section>

          <section className="shop__deals">
            <div className="cl-slot slot bigoil__loan">
              <span className="cl-tag">{m(CONFIG.worldBankLoan, true)}</span>
              <div className="cl-slot__name">The World Bank</div>
              <div className="cl-slot__desc"><span className="cl-plus">Development finance: {m(CONFIG.worldBankLoan, true)} Capital now.</span> <span className="cl-minus">{m(CONFIG.worldBankDebt)} a turn, and a Green Project in your deck.</span></div>
              <button type="button" className="cl-btn" disabled={run.shop.loanTaken} onClick={() => { dispatch({ type: 'takeLoan' }); play('coin') }}>{run.shop.loanTaken ? 'Signed' : 'Sign'}</button>
            </div>
            <div className="cl-slot slot">
              <span className="cl-tag">{free ? 'Free' : m(run.destroyCost)}</span>
              <div className="cl-slot__name">Clear out a card</div>
              <div className="cl-slot__desc">{free ? `${free} of ${CONFIG.clearOut} free. Then ${m(run.destroyCost)} each.` : 'The price rises each time.'}</div>
              <button type="button" className="cl-btn" disabled={!free && !can(run.destroyCost)} onClick={() => setMode(mode === 'destroy' ? null : 'destroy')}>{mode === 'destroy' ? 'Cancel' : 'Choose'}</button>
            </div>
            <div className="cl-slot slot">
              <span className="cl-tag">{m(run.upgradeCost)}</span>
              <div className="cl-slot__name">Upgrade a card</div>
              <div className="cl-slot__desc">Twice per card. The price rises each time.</div>
              <button type="button" className="cl-btn" disabled={!can(run.upgradeCost) || !run.deck.some(c => canUpgrade(c, st))} onClick={() => setMode(mode === 'upgrade' ? null : 'upgrade')}>{mode === 'upgrade' ? 'Cancel' : 'Choose'}</button>
            </div>
          </section>

          <section className="deck">
            <span className="cl-label">Your deck · {run.deck.length} cards{mode ? ` · choose a card to ${mode === 'destroy' ? 'clear out' : 'upgrade'}` : ''}</span>
            <div className="deck__list">
              {run.deck.map(c => {
                const ok = (mode === 'destroy' && !(free && c.key === 'influencers')) || (mode === 'upgrade' && canUpgrade(c, st))
                return <CardView key={c.id} card={c} small stage={st} playable={!mode || ok} marked={ok && mode ? mode : undefined} onClick={() => {
                  if (!ok || !mode) return
                  dispatch({ type: mode === 'destroy' ? 'destroyCard' : 'upgradeCard', cardId: c.id })
                  play(mode === 'destroy' ? 'stamp' : 'coin')
                  if (mode === 'upgrade' || free <= 1) setMode(null)
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
              <li className="next-debt"><span>Debt per turn</span><span className="cl-minus">{run.debt ? `(${m(-run.debt)})` : 'None'}</span></li>
            </ul>
          </section>
          <section className="fortune"><div><span className="cl-label">Your fortune</span><b className="cl-num">{run.gold} gold</b></div><span className="res-note">Your fortune is your score. Green Politicians and the Truth will come for it.</span></section>
          <div className="events">{run.events.slice(0, 2).map((e, i) => <p key={i}>{units(e, st)}</p>)}</div>
          <button type="button" className="cl-btn cl-btn--primary leave" disabled={!ready} onClick={() => { dispatch({ type: 'leaveShop' }); play('click') }}>{ready ? 'Begin round 1' : `Pick ${CONFIG.incorporatePicks - picked.length} more`}</button>
        </aside>
      </div>
    </div>
  )
}
