// The game board laid out for a phone held upright: a status bar on top, the
// enemies and field in a scrolling middle, and the hand and actions in a dock
// within thumb reach. Cards take two taps (read, then play) so nothing is
// played by accident on a small screen.
import { useState } from 'react'
import { CONFIG } from '../engine/config'
import { CARDS, ITEMS, MODS, THREATS } from '../engine/data'
import {
  apCost, canPlay, damageFor, debtPerTurn, fireTarget, intent, intentText, isAttack, liveThreats, netPrice, price, production, skimRate,
  type Action, type Run, type Threat,
} from '../engine/engine'
import { money, year } from '../engine/format'
import { CardView } from './CardView'

interface Props { run: Run; dispatch: (a: Action) => void }
const art = (path: string) => `${import.meta.env.BASE_URL}art/${path}`

export function MobileGame({ run, dispatch }: Props) {
  const [selected, setSelected] = useState<number | null>(null)
  const [plotMenu, setPlotMenu] = useState<number | null>(null)
  const [sheet, setSheet] = useState(false)
  const st = run.stage
  const live = liveThreats(run)
  const sel = run.hand.find(c => c.id === selected) ?? null
  const selDef = sel ? CARDS[sel.key] : null
  const selCheck = sel ? canPlay(run, sel) : null
  const dmgOn = (t: Threat) => (selDef ? damageFor(selDef.family, selDef.power, t.kind) : 0)
  const needsTarget = !!sel && !!selCheck?.ok && isAttack(sel.key) && live.filter(t => dmgOn(t) > 0).length > 1
  const blowout = live.find(t => t.kind === 'blowout')
  const unstable = run.plots.findIndex(w => w?.unstable)
  const burnsWell = run.fire > 0 && run.oil === 0
  const lastWell = run.plots.reduce((m, p, k) => (p ? k : m), -1)
  const nextDebt = debtPerTurn(run) * (run.pending.audit ? 2 : 1)

  function playSelected() {
    if (!sel || !selCheck?.ok || needsTarget) return
    dispatch({ type: 'play', cardId: sel.id })
    setSelected(null)
  }
  function tapCard(id: number) {
    setPlotMenu(null)
    if (selected === id) { if (selCheck?.ok && !needsTarget) playSelected(); else setSelected(null); return }
    setSelected(id)
  }
  function tapThreat(t: Threat) {
    if (!needsTarget || !sel || dmgOn(t) <= 0) return
    dispatch({ type: 'play', cardId: sel.id, target: t.id })
    setSelected(null)
  }

  return (
    <div className="m-game">
      <header className="m-hud">
        <div className="m-hud__when">
          <span className="cl-label">Round {run.round}/4 · Turn {run.turn}</span>
          <b className="cl-display">{year(st, run.round)}</b>
          <div className="m-pips">{[1, 2, 3, 4].map(i => <span key={i} className={`round-pip ${i < run.round ? 'is-done' : ''} ${i === run.round ? 'is-now' : ''} ${i === 4 ? 'is-boss' : ''}`} />)}</div>
        </div>
        <button type="button" className="m-hud__money" onClick={() => setSheet(true)} aria-label="Open the ledger">
          <span className="m-hud__cap">
            <span className="cl-label">Capital</span>
            <b className={`cl-num ${run.capital <= debtPerTurn(run) * 2 ? 'cl-minus' : ''}`}>{money(run.capital, st)}</b>
            <span className="m-hud__debt cl-num">{money(-nextDebt, st)} next turn</span>
          </span>
          <span className="m-hud__gold">
            <span className="cl-label">Fortune</span>
            <b className="cl-num">{run.gold}<small> gold</small></b>
            <span className="m-hud__more cl-label">Ledger ›</span>
          </span>
        </button>
      </header>

      <main className="m-main" onClick={e => { if (e.target === e.currentTarget) { setSelected(null); setPlotMenu(null) } }}>
        {run.modifier && <div className="m-chip"><b>{MODS[run.modifier].name}</b> · {MODS[run.modifier].text}</div>}

        <section className="m-threats" aria-label="Opposition">
          {needsTarget && <span className="cl-label m-prompt">Tap an enemy to hit</span>}
          {run.threats.map(t => {
            const d = THREATS[t.kind]
            const can = needsTarget && !t.beaten && dmgOn(t) > 0
            const Tag = can ? 'button' : 'section'
            return (
              <Tag key={t.id} onClick={can ? () => tapThreat(t) : undefined}
                className={`m-threat ${t.beaten ? 'threat--beaten' : ''} ${can ? 'threat--target' : ''}`}
                aria-label={`${d.name}, Hold ${Math.max(0, t.hold)} of ${t.maxHold}`}>
                <img className="m-threat__portrait" src={art(`enemies/${d.portrait}.jpg`)} alt="" />
                <div className="m-threat__body">
                  <div className="m-threat__top">
                    <h2 className="m-threat__name">{d.name}</h2>
                    <span className="cl-num m-threat__hold">{Math.max(0, t.hold)}/{t.maxHold}</span>
                  </div>
                  <span className="hold-bar"><span style={{ width: `${Math.max(0, (t.hold / t.maxHold) * 100)}%` }} /></span>
                  {t.beaten ? <div className="m-intent m-intent--done">Beaten</div> : (
                    <div className="m-intent"><b>{intent(run, t)}</b> {intentText(run, t)}</div>
                  )}
                  <div className="m-traits">
                    {[d.weak && `Weak: ${d.weak}`, d.resist && `Resists: ${d.resist}`, d.immune && `Immune: ${d.immune}`, d.whenBeaten && `Beaten: ${d.whenBeaten}`].filter(Boolean).join(' · ')}
                  </div>
                </div>
                {needsTarget && !t.beaten && <span className={`m-threat__dmg ${can ? '' : 'is-none'}`}>{can ? `Deal ${dmgOn(t)}` : 'No effect'}</span>}
              </Tag>
            )
          })}
        </section>

        {run.fire > 0 && (
          <section className="m-fire" aria-label={`Fire, intensity ${run.fire}`}>
            <img src={art('icons/fire.png')} alt="" />
            <div><b className="cl-label">Fire {run.fire}/{CONFIG.fireMax} · pumps stopped</b><span>End of turn: {fireTarget(run)}</span></div>
          </section>
        )}

        <section aria-label="Your field">
          <div className="m-label"><span className="cl-label">Your field · Titusville</span>{run.fire > 0 && <span className="cl-label field__fireway">Fire burns ←</span>}</div>
          <div className="m-field">
            {run.plots.length === 0 && <div className="m-plot m-plot--none">No land yet. Play Prospect to claim 2 plots.</div>}
            {run.plots.map((w, i) => {
              const marked = run.marked === i && !!w
              const burning = burnsWell && i === lastWell
              const state = !w ? 'Empty' : w.unstable ? 'Unstable' : run.fire ? 'Stopped' : `${w.output} oil`
              return (
                <div key={i} className={`m-plot ${!w ? 'plot--empty' : ''} ${w?.unstable ? 'plot--unstable' : ''} ${marked ? 'plot--marked' : ''} ${burning ? 'plot--burning' : ''} ${run.fire && w ? 'plot--stopped' : ''}`}>
                  <span className="m-plot__no cl-num">{i + 1}{i === CONFIG.firebreakPlot ? '·FB' : ''}</span>
                  {w ? (
                    <button type="button" className="plot__well" onClick={() => { setSelected(null); setPlotMenu(plotMenu === i ? null : i) }} aria-label={`Well No. ${i + 1}, ${state}. Tap to sell`}>
                      <img src={art('icons/derrick.png')} alt="" />
                    </button>
                  ) : <div className="m-plot__hole" />}
                  <span className="m-plot__state">{state}</span>
                  {w && <span className={`m-plot__state ${w.reserve <= w.output * 2 ? 'cl-minus' : ''}`}>{w.reserve} left</span>}
                  {marked && <span className="m-flag">Marked</span>}
                  {burning && <span className="m-flag m-flag--fire">Burns</span>}
                </div>
              )
            })}
          </div>
          {plotMenu !== null && run.plots[plotMenu] && (
            <div className="m-plotmenu">
              <span>Well No. {plotMenu + 1}</span>
              <button type="button" className="cl-btn cl-btn--small" disabled={run.ap < 1} onClick={() => { dispatch({ type: 'sellWell', plot: plotMenu }); setPlotMenu(null) }}>Sell · 1 AP · {money(CONFIG.sellWellValue, st, true)}</button>
              <button type="button" className="cl-btn cl-btn--small" onClick={() => setPlotMenu(null)}>Keep</button>
            </div>
          )}
        </section>

        <section className="m-stats">
          <div className={run.fire && run.oil > 0 ? 'is-burning' : ''}>
            <span className="cl-label">Stockpile</span>
            <b className="cl-num">{run.oil}/{run.storage}</b>
            <span className="m-barrels">{Array.from({ length: run.storage }, (_, i) => <i key={i} className={i < run.oil ? 'is-full' : ''} />)}</span>
          </div>
          <div>
            <span className="cl-label">Oil price</span>
            <b className="cl-num">{money(netPrice(run), st)}</b>
            <span className="res-note">{run.freight ? `${money(price(run), st)} − ${money(run.freight, st)} freight` : 'per barrel'}</span>
          </div>
          <div>
            <span className="cl-label">Production</span>
            <b className={`cl-num ${production(run) === 0 && run.plots.some(Boolean) ? 'cl-minus' : ''}`}>{production(run)}</b>
            <span className="res-note">{run.fire ? 'pumps stopped' : 'oil a turn'}</span>
          </div>
        </section>

        <div className="m-events" aria-live="polite">{run.events.slice(0, 3).map((e, i) => <p key={`${run.turn}-${i}-${e}`} className={i === 0 ? 'is-new' : ''}>{e}</p>)}</div>
      </main>

      <footer className="m-dock">
        {sel && selDef ? (
          <div className="m-detail">
            <div className="m-detail__text">
              <b className="cl-display">{selDef.name}</b>
              <span>{selDef.text}</span>
              {!selCheck?.ok && selCheck?.why && <span className="cl-minus m-detail__why">{selCheck.why}</span>}
            </div>
            {selCheck?.ok && (needsTarget
              ? <span className="cl-label m-detail__hint">Tap an enemy ↑</span>
              : <button type="button" className="cl-btn cl-btn--primary" onClick={playSelected}>Play · {apCost(run, sel)} AP</button>)}
          </div>
        ) : (
          <div className="m-actions">
            <button type="button" className="cl-btn cl-btn--small" disabled={run.ap < 1 || run.oil < 1 || run.current.refuse} onClick={() => dispatch({ type: 'sellOil' })}>
              {run.current.refuse ? 'Shipment refused' : `Sell ${run.oil} oil · ${money(run.oil * netPrice(run), st, true)}`}
            </button>
            {blowout && unstable >= 0 && <button type="button" className="cl-btn cl-btn--small" disabled={run.ap < 1} onClick={() => dispatch({ type: 'capWell' })}>Cap No. {unstable + 1} · {CONFIG.capWellDamage} Hold</button>}
            {run.fire > 0 && run.plots.length > CONFIG.firebreakPlot && <button type="button" className="cl-btn cl-btn--small" disabled={run.ap < CONFIG.firebreakAP} onClick={() => dispatch({ type: 'firebreak' })}>Firebreak · 2 AP</button>}
            {run.cover > 0 && <span className="cover-badge">Cover {run.cover}</span>}
          </div>
        )}

        <div className="m-hand">
          {run.hand.length === 0 && <span className="res-note m-hand__empty">No cards in hand.</span>}
          {run.hand.map((c, i) => {
            const chk = canPlay(run, c)
            return <div key={c.id} className="hand__slot" style={{ animationDelay: `${i * 50}ms` }}>
              <CardView card={c} apCost={apCost(run, c)} playable={chk.ok} why={chk.why} selected={selected === c.id} onClick={() => tapCard(c.id)} />
            </div>
          })}
        </div>

        <div className="m-bar">
          <div className="ap" aria-label={`${run.ap} action points left`}>
            <span className="cl-label">AP</span>
            {Array.from({ length: Math.max(run.ap, CONFIG.baseAP) }, (_, i) => <span key={i} className={`ap-coin ${i < run.ap ? 'is-on' : ''}`} />)}
          </div>
          <span className="m-piles cl-num">Draw {run.draw.length} · Discard {run.discard.length}</span>
          <button type="button" className={`cl-btn end-turn ${run.ap === 0 ? 'cl-btn--primary' : ''}`} onClick={() => { setSelected(null); setPlotMenu(null); dispatch({ type: 'endTurn' }) }}>End turn</button>
        </div>
      </footer>

      {sheet && (
        <div className="m-sheet-wrap" onClick={() => setSheet(false)}>
          <section className="m-sheet" role="dialog" aria-label="Company ledger" onClick={e => e.stopPropagation()}>
            <div className="m-sheet__grip" />
            <section className="cl-ledger ledger">
              <div className="cl-ledger__head"><span className="cl-label">Capital</span><span className="cl-ledger__total">{money(run.capital, st)}</span></div>
              <ul className="cl-ledger__rows">
                {run.ledger.map((l, i) => <li key={i}><span>{l.label}</span><span className={l.label === 'Brought forward' ? '' : l.amount < 0 ? 'cl-minus' : 'cl-plus'}>{l.label === 'Brought forward' ? money(l.amount, st) : money(l.amount, st, true)}</span></li>)}
                <li className="next-debt"><span>Debt next turn</span><span className="cl-minus">({money(-nextDebt, st)})</span></li>
              </ul>
            </section>
            <section className="fortune">
              <div><span className="cl-label">Your fortune</span><b className="cl-num">{run.gold} gold</b></div>
              <span className="res-note">Skim rate: {money(skimRate(run), st)} → 1 gold</span>
            </section>
            <section className="items">
              <span className="cl-label">Items</span>
              <div className="items__row">
                <div className="cl-item cl-item--neg"><div className="cl-item__disc">−{run.debt}</div><div className="cl-item__name">Bank Debt</div><div className="cl-item__fx">{money(-run.debt, st)} a turn</div></div>
                {run.items.map((k, i) => <div key={i} className="cl-item"><div className="cl-item__disc"><img src={art(`icons/${ITEMS[k].icon}.png`)} alt="" /></div><div className="cl-item__name">{ITEMS[k].name}</div><div className="cl-item__fx">{ITEMS[k].text}</div></div>)}
              </div>
            </section>
            <button type="button" className="cl-btn" onClick={() => setSheet(false)}>Close</button>
          </section>
        </div>
      )}
    </div>
  )
}
