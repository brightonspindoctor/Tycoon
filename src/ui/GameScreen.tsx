import { useState } from 'react'
import { CONFIG } from '../engine/config'
import { CARDS, ITEMS, MODS, THREATS } from '../engine/data'
import {
  apCost, canPlay, damageFor, debtPerTurn, fireTarget, isAttack, liveThreats, netPrice, price, production, skimRate,
  type Action, type Run,
} from '../engine/engine'
import { ERA_THEME, money, year } from '../engine/format'
import { CardView } from './CardView'
import { ThreatPanel } from './ThreatPanel'
import { SettingsButton } from './Settings'

interface Props { run: Run; dispatch: (a: Action) => void }

export function GameScreen({ run, dispatch }: Props) {
  const [selected, setSelected] = useState<number | null>(null)
  const [plotMenu, setPlotMenu] = useState<number | null>(null)
  const st = run.stage
  const live = liveThreats(run)
  const sel = run.hand.find(c => c.id === selected)
  const targeting = !!sel && isAttack(sel.key) && live.length > 1
  const blowout = live.find(t => t.kind === 'blowout')
  const unstable = run.plots.findIndex(w => w?.unstable)

  function clickCard(id: number) {
    const c = run.hand.find(x => x.id === id)!
    if (!canPlay(run, c).ok) return
    // only ask for a target when more than one enemy can be hurt by this card
    const hurtable = live.filter(t => damageFor(CARDS[c.key].family, CARDS[c.key].power, t.kind) > 0)
    if (isAttack(c.key) && hurtable.length > 1) { setSelected(selected === id ? null : id); return }
    setSelected(null)
    dispatch({ type: 'play', cardId: id })
  }

  const fireNext = fireTarget(run)
  const burnsWell = run.fire > 0 && run.oil === 0
  const endReady = run.ap === 0

  return (
    <div className="screen game" data-theme={ERA_THEME[st] ?? 'victorian'}>
      <header className="game__head">
        <div>
          <span className="cl-label">Stage {st} · {year(st, run.round)}</span>
          <h1 className="cl-display game__title">The Wildcat Years</h1>
        </div>
        <div className="game__meta">
          <div className="round-track" aria-label={`Round ${run.round} of 4`}>
            <span className="cl-label">Round {run.round} of 4 · Turn {run.turn}</span>
            <div>{[1, 2, 3, 4].map(i => <span key={i} className={`round-pip ${i < run.round ? 'is-done' : ''} ${i === run.round ? 'is-now' : ''} ${i === 4 ? 'is-boss' : ''}`} />)}</div>
          </div>
          <SettingsButton />
          {run.modifier && <div className="modifier"><span className="cl-label">Modifier</span><b>{MODS[run.modifier].name}</b> · {MODS[run.modifier].text}</div>}
        </div>
      </header>

      <div className="game__grid">
        <section className="col-threats" aria-label="Opposition">
          <span className="cl-label">Opposition{targeting ? ' · Choose a target' : ''}</span>
          {run.threats.map(t => (
            <ThreatPanel key={t.id} run={run} threat={t}
              targeting={targeting && !t.beaten && damageFor(CARDS[sel!.key].family, CARDS[sel!.key].power, t.kind) > 0}
              damagePreview={sel ? damageFor(CARDS[sel.key].family, CARDS[sel.key].power, t.kind) : undefined}
              onTarget={() => { dispatch({ type: 'play', cardId: sel!.id, target: t.id }); setSelected(null) }} />
          ))}
          {run.fire > 0 && (
            <section className="hazard" aria-label={`Fire, intensity ${run.fire}`}>
              <div className="hazard__head"><img src={`${import.meta.env.BASE_URL}art/icons/fire.png`} alt="" /><span className="cl-label">Fire</span><span className="cl-num hazard__level">{run.fire} / {CONFIG.fireMax}</span></div>
              <div className="warn warn--heat"><b>End of turn</b><span>{fireNext}</span></div>
              <span className="hazard__note">Pumps stopped.</span>
            </section>
          )}
        </section>

        <section className="col-field" aria-label="Your field">
          <div className="field__label"><span className="cl-label">Your field · Titusville</span>{run.fire > 0 && <span className="cl-label field__fireway">Fire burns ←</span>}</div>
          <div className="field">
            {run.plots.length === 0 && <div className="plot plot--empty-field">No land yet. Play Prospect to claim 2 plots.</div>}
            {run.plots.map((w, i) => {
              const marked = run.marked === i && !!w
              const burning = burnsWell && i === run.plots.reduce((m, p, k) => (p ? k : m), -1)
              const state = !w ? 'Empty plot' : w.unstable ? 'Unstable' : run.fire ? 'Pump stopped' : `${w.output} oil / turn`
              return (
                <div key={i} className={`plot ${!w ? 'plot--empty' : ''} ${w?.unstable ? 'plot--unstable' : ''} ${marked ? 'plot--marked' : ''} ${burning ? 'plot--burning' : ''} ${run.fire && w ? 'plot--stopped' : ''}`}>
                  <span className="cl-label">Plot {i + 1}{i === CONFIG.firebreakPlot ? ' · Firebreak' : ''}</span>
                  {w ? <button type="button" className="plot__well" onClick={() => setPlotMenu(plotMenu === i ? null : i)} aria-label={`Well No. ${i + 1}, ${state}`}>
                    <img src={`${import.meta.env.BASE_URL}art/icons/derrick.png`} alt="" />
                  </button> : <div className="plot__hole" />}
                  <span className="plot__name">{w ? `Well No. ${i + 1}` : '—'}</span>
                  <span className="plot__state">{state}</span>
                  {w && <span className={`plot__state ${w.reserve <= w.output * 2 ? 'cl-minus' : ''}`}>{w.reserve} bbl left</span>}
                  {marked && <span className="plot__flag">Marked</span>}
                  {burning && <span className="plot__flag plot__flag--fire">Burns next</span>}
                  {plotMenu === i && w && (
                    <div className="plot__menu">
                      <button type="button" className="cl-btn" disabled={run.ap < 1} onClick={() => { dispatch({ type: 'sellWell', plot: i }); setPlotMenu(null) }}>Sell · 1 AP · {money(CONFIG.sellWellValue, st, true)}</button>
                    </div>
                  )}
                </div>
              )
            })}
            <div className={`plot plot--stock ${run.fire && run.oil > 0 ? 'plot--burning' : ''}`}>
              <span className="cl-label">Stockpile</span>
              <div className="barrels">{Array.from({ length: run.storage }, (_, i) => <span key={i} className={`barrel ${i < run.oil ? 'is-full' : ''}`} />)}</div>
              <span className="plot__name cl-num">{run.oil} / {run.storage} oil</span>
              {run.fire > 0 && run.oil > 0 && <span className="plot__flag plot__flag--fire">On fire</span>}
            </div>
          </div>

          <div className="resources">
            <div><span className="cl-label">Oil price</span><b className="cl-num">{money(netPrice(run), st)}</b><span className="res-note">{run.freight ? `${money(price(run), st)} − freight ${money(run.freight, st)}` : 'per barrel'}</span></div>
            <div><span className="cl-label">Production</span><b className={`cl-num ${production(run) === 0 && run.plots.some(Boolean) ? 'cl-minus' : ''}`}>{production(run)}</b><span className="res-note">{run.fire ? 'pumps stopped' : `${run.plots.filter(Boolean).length} Wells`}</span></div>
            <div><span className="cl-label">Storage</span><b className="cl-num">{run.storage}</b><span className="res-note">barrels</span></div>
          </div>

          <div className="events" aria-live="polite">{run.events.slice(0, 3).map((e, i) => <p key={`${run.turn}-${i}-${e}`} className={i === 0 ? 'is-new' : ''}>{e}</p>)}</div>
        </section>

        <aside className="col-money">
          <section className="cl-ledger ledger" aria-label="Company ledger">
            <div className="cl-ledger__head"><span className="cl-label">Capital</span><span className={`cl-ledger__total ${run.capital <= debtPerTurn(run) * 2 ? 'cl-minus' : ''}`}>{money(run.capital, st)}</span></div>
            <ul className="cl-ledger__rows">
              {run.ledger.slice(-6).map((l, i) => <li key={`${run.turn}-${i}`} className="ink-in"><span>{l.label}</span><span className={l.label === 'Brought forward' ? '' : l.amount < 0 ? 'cl-minus' : 'cl-plus'}>{l.label === 'Brought forward' ? money(l.amount, st) : money(l.amount, st, true)}</span></li>)}
              <li className="next-debt"><span>Debt next turn</span><span className="cl-minus">({money(-debtPerTurn(run) * (run.pending.audit ? 2 : 1), st)})</span></li>
            </ul>
          </section>
          <section className="fortune">
            <div><span className="cl-label">Your fortune</span><b className="cl-num">{run.gold} gold</b></div>
            <span className="res-note">Skim rate: {money(skimRate(run), st)} → 1 gold</span>
          </section>
          <section className="items">
            <span className="cl-label">Items</span>
            <div className="items__row">
              {run.debt > 0 && <div className="cl-item cl-item--neg"><div className="cl-item__disc">−{run.debt}</div><div className="cl-item__name">Bank Debt</div><div className="cl-item__fx">{money(-run.debt, st)} a turn</div></div>}
              {run.items.map((k, i) => <div key={i} className="cl-item"><div className="cl-item__disc"><img src={`${import.meta.env.BASE_URL}art/icons/${ITEMS[k].icon}.png`} alt="" /></div><div className="cl-item__name">{ITEMS[k].name}</div><div className="cl-item__fx">{ITEMS[k].text}</div></div>)}
            </div>
          </section>
        </aside>
      </div>

      <footer className="game__foot">
        <div className="action-strip">
          <div className="ap" aria-label={`${run.ap} action points left`}>
            <span className="cl-label">AP</span>
            {Array.from({ length: Math.max(run.ap, CONFIG.baseAP) }, (_, i) => <span key={i} className={`ap-coin ${i < run.ap ? 'is-on' : ''}`} />)}
            <span className="cl-num">{run.ap}</span>
          </div>
          {run.cover > 0 && <span className="cover-badge">Cover {run.cover}</span>}
          <div className="action-strip__actions">
            <button type="button" className="cl-btn" disabled={run.ap < 1 || run.oil < 1 || run.current.refuse}
              onClick={() => dispatch({ type: 'sellOil' })}>
              {run.current.refuse ? 'Shipment refused' : `Sell ${run.oil} oil · 1 AP · ${money(run.oil * netPrice(run), st, true)}`}
              {run.fire > 0 && run.oil > 0 && <em> · fire hits Wells next</em>}
            </button>
            {blowout && unstable >= 0 && <button type="button" className="cl-btn" disabled={run.ap < 1} onClick={() => dispatch({ type: 'capWell' })}>Cap Well No. {unstable + 1} · 1 AP · {CONFIG.capWellDamage} Hold</button>}
            {run.fire > 0 && run.plots.length > CONFIG.firebreakPlot && <button type="button" className="cl-btn" disabled={run.ap < CONFIG.firebreakAP} onClick={() => dispatch({ type: 'firebreak' })}>Firebreak · 2 AP{run.plots[CONFIG.firebreakPlot] ? ' · lose Well No. 2' : ''}</button>}
          </div>
        </div>
        <div className="hand-row">
          <div className="pile" title="Draw pile"><span className="pile__card cl-num">{run.draw.length}</span><span className="cl-label">Draw</span></div>
          <div className="hand">
            {run.hand.map((c, i) => {
              const chk = canPlay(run, c)
              return <div key={c.id} className="hand__slot" style={{ animationDelay: `${i * 60}ms` }}>
                <CardView card={c} apCost={apCost(run, c)} playable={chk.ok} why={chk.why} selected={selected === c.id} onClick={() => clickCard(c.id)} />
              </div>
            })}
          </div>
          <div className="pile-col">
            <div className="pile" title="Discard pile"><span className="pile__card pile__card--discard cl-num">{run.discard.length}</span><span className="cl-label">Discard</span></div>
            <button type="button" className={`cl-btn end-turn ${endReady ? 'cl-btn--primary' : ''}`} onClick={() => { setSelected(null); dispatch({ type: 'endTurn' }) }}>End turn</button>
          </div>
        </div>
      </footer>
      <span className="sr-only">{live.map(t => THREATS[t.kind].name).join(', ')}</span>
    </div>
  )
}
