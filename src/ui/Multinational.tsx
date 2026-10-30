// Between stage 2 and 3: the company goes multinational. Fields become offshore Rigs, old
// land, fire and board cards turn to junk, Heat arrives, and the Oil Shock is on the table. Upgrade and destroy here too.
import { useState } from 'react'
import { CONFIG } from '../engine/config'
import { CARDS } from '../engine/data'
import { canUpgrade, rigCount, type Action, type Run } from '../engine/engine'
import { money, units, year } from '../engine/format'
import { play } from '../sound'
import { CardView } from './CardView'
import { iconUrl } from './icons'
import { HeatMeter } from './Heat'
import { SettingsButton } from './Settings'

type Mode = null | 'destroy' | 'upgrade'

export function MultinationalScreen({ run, dispatch }: { run: Run; dispatch: (a: Action) => void }) {
  const [mode, setMode] = useState<Mode>(null)
  const st = run.stage
  const m = (n: number, sign = false) => money(n, st, sign)
  const can = (cost: number) => run.capital - cost >= 1
  const rigs = rigCount(run)
  const offer = run.offer ?? []
  const picked = run.picked ?? []
  const ready = !offer.length || picked.length >= Math.min(CONFIG.incorporatePicks, offer.length)
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
          <section className="rigs-now" aria-label={`Your Wells and Fields are now ${rigs} offshore Rigs, ${CONFIG.maxPlots} at most`}>
            <div className="rigs-now__row" aria-hidden="true">
              {Array.from({ length: CONFIG.maxPlots }, (_, i) => <span key={i} className={`rigs-now__slot ${i < rigs ? 'is-built' : ''}`}>{i < rigs && <img src={iconUrl('rig')} alt="" />}</span>)}
            </div>
            <div className="rigs-now__text">
              <span className="cl-label">Your Wells and Fields are now Rigs</span>
              <b className="cl-display">{rigs} of {CONFIG.maxPlots} Rigs</b>
              <span>Every Well and Field became an offshore Rig: {CONFIG.rigOutput} oil a turn, never dry. You can have {CONFIG.maxPlots} at most; the Trading Floor builds more, one per visit.</span>
            </div>
          </section>
          <section className="end__tiles incorporate__tiles" aria-label="What carried over">
            <div className="tile"><span className="cl-label">Dead Weight and Dry Leases</span><b className="cl-num">{dead} cards</b></div>
          </section>

          <section className="incorporate__board">
            <HeatMeter run={run} />
            <p className="res-note">No fires, no board, no Bank Debt. Every AP you spend adds {CONFIG.heatPerAP} Heat, and selling oil takes {CONFIG.sellAP3} AP. Climate Science and the summit add more Heat; Cover blocks it, and Lobbying takes it down.</p>
          </section>

          <section className="incorporate__pick" aria-label="New cards">
            <span className="cl-label">Pick {CONFIG.incorporatePicks} new cards · {picked.length} of {CONFIG.incorporatePicks}</span>
            <p className="res-note">The others go on sale at the first Trading Floor visit.</p>
            <div className="deck__list">
              {offer.map((k, i) => {
                const on = picked.includes(k)
                const full = !on && picked.length >= CONFIG.incorporatePicks
                return <CardView key={k} card={{ id: -1 - i, key: k, uses: CARDS[k].uses }} stage={st} selected={on} playable={!full} onClick={() => { if (full) return; dispatch({ type: 'pickCard', key: k }); play('click') }} />
              })}
            </div>
          </section>

          <section className="shop__deals">
            <div className="cl-slot slot">
              <span className="cl-tag">{m(run.upgradeCost)}</span>
              <div className="cl-slot__name">Upgrade a card</div>
              <div className="cl-slot__desc">One upgrade here. Twice per card in this stage. The price rises each time.</div>
              <button type="button" className="cl-btn" disabled={!!run.shop.upgraded || !can(run.upgradeCost) || !run.deck.some(c => canUpgrade(c, st))} onClick={() => setMode(mode === 'upgrade' ? null : 'upgrade')}>{run.shop.upgraded ? 'Done' : mode === 'upgrade' ? 'Cancel' : 'Choose'}</button>
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
                const ok = mode === 'destroy' || (mode === 'upgrade' && canUpgrade(c, st))
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
            </ul>
          </section>
          <section className="fortune"><div><span className="cl-label">Your fortune</span><b className="cl-num">{run.gold} gold</b></div><span className="res-note">The Bribery Scandal takes gold. Personal Guarantee and Dip into the Trust turn it back into Capital.</span></section>
          <div className="events">{run.events.slice(0, 2).map((e, i) => <p key={i}>{units(e, st)}</p>)}</div>
          <button type="button" className="cl-btn cl-btn--primary leave" disabled={!ready} onClick={() => { dispatch({ type: 'leaveShop' }); play('click') }}>{ready ? 'Begin round 1' : `Pick ${CONFIG.incorporatePicks - picked.length} more`}</button>
        </aside>
      </div>
    </div>
  )
}
