import { useState } from 'react'
import { CARDS, ITEMS } from '../engine/data'
import { skimRate, type Action, type Run } from '../engine/engine'
import { ERA_THEME, money } from '../engine/format'
import { CONFIG } from '../engine/config'
import { CardView } from './CardView'

interface Props { run: Run; dispatch: (a: Action) => void }
type Mode = null | 'destroy' | 'reinforce'

export function ShopScreen({ run, dispatch }: Props) {
  const [mode, setMode] = useState<Mode>(null)
  const st = run.stage
  const rate = skimRate(run)
  const nextRate = CONFIG.skimRate[run.round + 1] ?? rate
  const plotsLeft = CONFIG.maxPlots - run.plots.length
  const can = (cost: number) => run.capital - cost >= 1

  return (
    <div className="screen shop" data-theme={ERA_THEME[st] ?? 'victorian'}>
      <header className="game__head">
        <div>
          <span className="cl-label">Stage {st} · {run.round === 0 ? 'Before you start' : `After round ${run.round}`}</span>
          <h1 className="cl-display game__title">The Land Office</h1>
        </div>
        <div className="shop__next"><span className="cl-label">Next: Round {run.round + 1}</span><span>{['One threat', 'One threat and a modifier', 'Two threats at once', 'The Rival Baron'][run.round]}</span></div>
      </header>

      <div className="shop__grid">
        <div className="shop__main">
          <section>
            <div className="shop__row-head"><span className="cl-label">Cards</span><button type="button" className="cl-btn cl-btn--small" disabled={!can(1)} onClick={() => dispatch({ type: 'reroll' })}>Reroll · {money(1, st)}</button></div>
            <div className="shop__cards">
              {run.shop.cards.map((k, i) => k ? (
                <CardView key={i} card={{ id: -i - 1, key: k, uses: CARDS[k].uses }} price={money(CARDS[k].price!, st)} playable={can(CARDS[k].price!)}
                  why={can(CARDS[k].price!) ? undefined : 'Too expensive'} onClick={() => dispatch({ type: 'buyCard', slot: i })} />
              ) : <div key={i} className="sold">Sold</div>)}
              <div className="prospect-slot">
                <CardView card={{ id: -9, key: 'prospect', uses: null }} price={money(run.prospectPrice, st)} playable={can(run.prospectPrice)} onClick={() => dispatch({ type: 'buyProspect' })} />
                <span className="res-note">{plotsLeft === 0 ? 'No land left to claim.' : plotsLeft === 1 ? 'Only 1 plot left: half value.' : `${plotsLeft} plots left.`} Price rises each time.</span>
              </div>
            </div>
          </section>

          <section className="shop__deals">
            {run.shop.item ? (
              <div className="cl-slot slot">
                <span className="cl-tag">{money(ITEMS[run.shop.item].price, st)}</span>
                <div className="cl-slot__name">{ITEMS[run.shop.item].name}</div>
                <div className="cl-slot__desc">{ITEMS[run.shop.item].text}</div>
                <button type="button" className="cl-btn" disabled={!can(ITEMS[run.shop.item].price)} onClick={() => dispatch({ type: 'buyItem' })}>Buy</button>
              </div>
            ) : <div className="cl-slot slot sold">Item sold</div>}
            <div className="cl-slot slot">
              <span className="cl-tag">{money(8, st, true)}</span>
              <div className="cl-slot__name">Cheap Loan</div>
              <div className="cl-slot__desc"><span className="cl-plus">{money(8, st, true)} Capital now.</span> <span className="cl-minus">Bank Debt rises by {money(1, st)} a turn, for good.</span></div>
              <button type="button" className="cl-btn" disabled={run.shop.loanTaken} onClick={() => dispatch({ type: 'takeLoan' })}>{run.shop.loanTaken ? 'Signed' : 'Sign'}</button>
            </div>
            <div className="cl-slot slot">
              <span className="cl-tag">{money(run.destroyCost, st)}</span>
              <div className="cl-slot__name">Destroy a card</div>
              <div className="cl-slot__desc">Remove it for good. Price rises each time.</div>
              <button type="button" className="cl-btn" disabled={!can(run.destroyCost)} onClick={() => setMode(mode === 'destroy' ? null : 'destroy')}>{mode === 'destroy' ? 'Cancel' : 'Choose'}</button>
            </div>
            <div className="cl-slot slot">
              <span className="cl-tag">{money(2, st)}</span>
              <div className="cl-slot__name">Reinforce</div>
              <div className="cl-slot__desc">+1 use on a card that wears out.</div>
              <button type="button" className="cl-btn" disabled={!can(2)} onClick={() => setMode(mode === 'reinforce' ? null : 'reinforce')}>{mode === 'reinforce' ? 'Cancel' : 'Choose'}</button>
            </div>
          </section>

          <section className="deck">
            <span className="cl-label">Your deck · {run.deck.length} cards{mode ? ` · choose a card to ${mode}` : ''}</span>
            <div className="deck__list">
              {run.deck.map(c => {
                const ok = mode === 'destroy' || (mode === 'reinforce' && c.uses !== null)
                return <CardView key={c.id} card={c} small playable={!mode || ok} onClick={() => {
                  if (mode === 'destroy') dispatch({ type: 'destroyCard', cardId: c.id })
                  if (mode === 'reinforce' && c.uses !== null) dispatch({ type: 'reinforce', cardId: c.id })
                  if (ok) setMode(null)
                }} />
              })}
            </div>
          </section>
        </div>

        <aside className="col-money">
          <section className="cl-ledger ledger">
            <div className="cl-ledger__head"><span className="cl-label">Capital</span><span className="cl-ledger__total">{money(run.capital, st)}</span></div>
            <ul className="cl-ledger__rows">
              <li><span>Capital is your health</span><span /></li>
              {run.ledger.slice(-5).map((l, i) => <li key={i} className="ink-in"><span>{l.label}</span><span className={l.amount < 0 ? 'cl-minus' : 'cl-plus'}>{money(l.amount, st, true)}</span></li>)}
              <li className="next-debt"><span>Debt in round {run.round + 1}, per turn</span><span className="cl-minus">({money(-run.debt, st)})</span></li>
            </ul>
          </section>
          <section className="fortune fortune--skim">
            <div><span className="cl-label">Your fortune</span><b className="cl-num">{run.gold} gold</b></div>
            <p>Gold can't buy anything here. Every dollar you skim comes off the company's health.</p>
            <span className="res-note">Rate now: <b>{money(rate, st)} → 1 gold</b>{nextRate !== rate ? ` · Round ${run.round + 1}: ${money(nextRate, st)}` : ''}</span>
            <div className="skim-buttons">
              {[1, 2, 3].map(g => <button key={g} type="button" className="cl-btn cl-btn--skim" disabled={!can(g * rate)} onClick={() => dispatch({ type: 'skim', gold: g })}>{g} gold · {money(g * rate, st)}</button>)}
            </div>
          </section>
          <div className="events">{run.events.slice(0, 2).map((e, i) => <p key={i}>{e}</p>)}</div>
          <button type="button" className="cl-btn cl-btn--primary leave" onClick={() => dispatch({ type: 'leaveShop' })}>{run.round === 0 ? 'Begin round 1' : 'Leave shop'}</button>
        </aside>
      </div>
    </div>
  )
}
