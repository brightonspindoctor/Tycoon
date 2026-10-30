// Between stage 3 and 4: the multinational becomes Big Oil, in three steps.
// 1. Pick two new cards from four (one of each damage type), with the World Bank's offer alongside.
// 2. The clear-out: destroy up to three cards for free.
// 3. Then the Investor Portal, the usual shop, before round 1.
import { useState } from 'react'
import { CONFIG } from '../engine/config'
import { CARDS } from '../engine/data'
import { rigCount, type Action, type Run } from '../engine/engine'
import { money, units, year } from '../engine/format'
import { play } from '../sound'
import { CardView } from './CardView'
import { TruthClock } from './TruthClock'
import { SettingsButton } from './Settings'

export function BigOilScreen({ run, dispatch }: { run: Run; dispatch: (a: Action) => void }) {
  return run.bigOilStep === 'clear' ? <ClearOut run={run} dispatch={dispatch} /> : <Pick run={run} dispatch={dispatch} />
}

function Head({ step, title, sub }: { step: number; title: string; sub: string }) {
  return (
    <header className="game__head">
      <div>
        <span className="cl-label">Oil · Stage 4 · {year(4, 1)} · Becoming Big Oil · Step {step} of 3</span>
        <h1 className="cl-display game__title">{title}</h1>
        <p className="end__sub">{sub}</p>
      </div>
      <div className="shop__head-right"><SettingsButton /><span className="stamp-big stamp-big--win incorporate__stamp">EST. {year(4, 1)}</span></div>
    </header>
  )
}

function Money({ run }: { run: Run }) {
  const m = (n: number, sign = false) => money(n, run.stage, sign)
  return (
    <>
      <section className="cl-ledger ledger">
        <div className="cl-ledger__head"><span className="cl-label">Capital</span><span className="cl-ledger__total">{m(run.capital)}</span></div>
        <ul className="cl-ledger__rows">
          {run.ledger.slice(-6).map((l, i) => <li key={i} className="ink-in"><span>{units(l.label, run.stage)}</span><span className={l.amount < 0 ? 'cl-minus' : 'cl-plus'}>{m(l.amount, true)}</span></li>)}
          <li className="next-debt"><span>Debt per turn</span><span className="cl-minus">{run.debt ? `(${m(-run.debt)})` : 'None'}</span></li>
        </ul>
      </section>
      <section className="fortune"><div><span className="cl-label">Your fortune</span><b className="cl-num">{run.gold} gold</b></div><span className="res-note">Your fortune is your score. Green Politicians and the Truth will come for it.</span></section>
      <div className="events">{run.events.slice(0, 2).map((e, i) => <p key={i}>{units(e, run.stage)}</p>)}</div>
    </>
  )
}

/** Step 1: two new cards, and the World Bank. */
function Pick({ run, dispatch }: { run: Run; dispatch: (a: Action) => void }) {
  const st = run.stage
  const m = (n: number, sign = false) => money(n, st, sign)
  const offer = run.offer ?? []
  const picked = run.picked ?? []
  const ready = !offer.length || picked.length >= Math.min(CONFIG.incorporatePicks, offer.length)
  return (
    <div className="screen shop incorporate bigoil" data-theme="greenwash">
      <Head step={1} title="Big Oil" sub="Powering a better tomorrow™. The summit is over, the oil is everywhere, and now it has to look green." />
      <div className="shop__grid">
        <div className="shop__main">
          <section className="end__tiles incorporate__tiles" aria-label="What carried over">
            <div className="tile"><span className="cl-label">Rigs</span><b className="cl-num">{rigCount(run)} / {CONFIG.maxPlots}</b></div>
            <div className="tile"><span className="cl-label">Old loans</span><b className="cl-num">Paid off</b></div>
          </section>
          <section className="incorporate__board">
            <TruthClock run={run} />
            <p className="res-note">No Heat any more: old Heat cards keep only their other effects. At midnight, the Truth is out and the run is over.</p>
          </section>
          <section className="incorporate__pick" aria-label="New cards">
            <span className="cl-label">Pick {CONFIG.incorporatePicks} new cards · {picked.length} of {CONFIG.incorporatePicks}</span>
            <p className="res-note">The others go on sale at the Investor Portal.</p>
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
          </section>
        </div>
        <aside className="col-money">
          <Money run={run} />
          <button type="button" className="cl-btn cl-btn--primary leave" disabled={!ready} onClick={() => { dispatch({ type: 'leaveShop' }); play('click') }}>{ready ? 'Next: the clear-out' : `Pick ${CONFIG.incorporatePicks - picked.length} more`}</button>
        </aside>
      </div>
    </div>
  )
}

/** Step 2: up to three cards destroyed, for free. */
function ClearOut({ run, dispatch }: { run: Run; dispatch: (a: Action) => void }) {
  const st = run.stage
  const [chosen, setChosen] = useState<number | null>(null)
  const free = run.freeDestroys ?? 0
  return (
    <div className="screen shop incorporate bigoil" data-theme="greenwash">
      <Head step={2} title="The clear-out" sub={`New brand, new deck. Destroy up to ${CONFIG.clearOut} cards for free.`} />
      <div className="shop__grid">
        <div className="shop__main">
          <section className="end__tiles incorporate__tiles" aria-label="Clear-out">
            <div className="tile"><span className="cl-label">Free destroys left</span><b className="cl-num">{free} of {CONFIG.clearOut}</b></div>
            <div className="tile"><span className="cl-label">Your deck</span><b className="cl-num">{run.deck.length} cards</b></div>
          </section>
          <section className="deck">
            <span className="cl-label">{free ? 'Choose a card to destroy' : 'Clear-out done'}</span>
            <div className="deck__list">
              {run.deck.map(c => {
                const ok = free > 0 && c.key !== 'influencers'
                return <CardView key={c.id} card={c} small stage={st} playable={ok} selected={chosen === c.id} marked={ok ? 'destroy' : undefined} onClick={() => {
                  if (!ok) return
                  if (chosen !== c.id) { setChosen(c.id); play('click'); return } // tap once to choose, again to destroy
                  dispatch({ type: 'destroyCard', cardId: c.id }); play('stamp'); setChosen(null)
                }} />
              })}
            </div>
            {free > 0 && <p className="res-note">Tap a card to choose it, then tap it again to destroy it.</p>}
          </section>
        </div>
        <aside className="col-money">
          <Money run={run} />
          <button type="button" className="cl-btn cl-btn--primary leave" onClick={() => { dispatch({ type: 'leaveShop' }); play('click') }}>To the Investor Portal</button>
        </aside>
      </div>
    </div>
  )
}
