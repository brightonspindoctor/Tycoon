import { useState } from 'react'
import { CONFIG } from '../engine/config'
import { ITEMS, MODS, THREATS } from '../engine/data'
import {
  apCost, canPlay, cardDef, damageOn, fires, freight, handTargetsFor, targetsFor, weakestWell, wellValue, debtPerTurn, fireTarget, liveThreats, netPrice, neverDry, plotName, price, production, skimRate,
  type Action, type Beat, type Run,
} from '../engine/engine'
import { ERA_THEME, FIELD_PLACE, STAGE_TITLE, money, units, year } from '../engine/format'
import { ExposureMeter } from './Exposure'
import { CardView } from './CardView'
import { ThreatPanel } from './ThreatPanel'
import { SettingsButton } from './Settings'
import { PileView } from './PileView'

interface Props { run: Run; dispatch: (a: Action) => void; acting?: Beat | null }

export function GameScreen({ run, dispatch, acting }: Props) {
  const lit = (k: Beat['kind']) => (acting?.kind === k ? 'is-acting' : '')
  const [selected, setSelected] = useState<number | null>(null)
  const [plotMenu, setPlotMenu] = useState<number | null>(null)
  const [pile, setPile] = useState<'draw' | 'discard' | null>(null)
  const st = run.stage
  const live = liveThreats(run)
  const sel = run.hand.find(c => c.id === selected)
  const targets = sel ? targetsFor(run, sel) : []
  const targeting = targets.length > 1
  const stopping = !!sel && !!cardDef(sel).stop
  const scrapping = !!sel && handTargetsFor(run, sel).length > 0 // choose a card in your hand to destroy

  function clickCard(id: number) {
    // a destroy card is waiting for its victim
    if (sel && scrapping && id !== sel.id) { dispatch({ type: 'play', cardId: sel.id, target: id }); setSelected(null); return }
    const c = run.hand.find(x => x.id === id)!
    if (!canPlay(run, c).ok) return
    // only ask for a target when the card could go to more than one enemy, or a card in hand
    if (targetsFor(run, c).length > 1 || handTargetsFor(run, c).length > 0) { setSelected(selected === id ? null : id); return }
    setSelected(null)
    dispatch({ type: 'play', cardId: id })
  }

  const fireNext = fireTarget(run)
  const burnsWell = run.fire > 0 && run.oil === 0 && st < 2 // from stage 2, fire only burns oil
  const endReady = run.ap === 0

  return (
    <div className="screen game" data-theme={ERA_THEME[st] ?? 'victorian'}>
      <header className="game__head">
        <div>
          <span className="cl-label">Stage {st} · {year(st, run.round)}</span>
          <h1 className="cl-display game__title">{STAGE_TITLE[st] ?? STAGE_TITLE[1]}</h1>
        </div>
        <div className="game__meta">
          <div className="round-track" aria-label={`Round ${run.round} of 4`}>
            <span className="cl-label">Round {run.round} of 4 · Turn {run.turn}{st >= 2 && run.turn <= CONFIG.quickWinTurns ? ` · Win by turn ${CONFIG.quickWinTurns}: Exposure −${CONFIG.quickWinDrop}` : ''}</span>
            <div>{[1, 2, 3, 4].map(i => <span key={i} className={`round-pip ${i < run.round ? 'is-done' : ''} ${i === run.round ? 'is-now' : ''} ${i === 4 ? 'is-boss' : ''}`} />)}</div>
          </div>
          <SettingsButton />
          {run.modifier && <div className="modifier"><span className="cl-label">Modifier</span><b>{MODS[run.modifier].name}</b> · {units(MODS[run.modifier].text, st)}</div>}
        </div>
      </header>

      <div className="game__grid">
        <section className="col-threats" aria-label="Opposition">
          <span className="cl-label">Opposition{targeting ? (stopping ? ' · Choose a move to stop' : ' · Choose a target') : ''}</span>
          {run.threats.map(t => (
            <ThreatPanel key={t.id} run={run} threat={t} acting={acting?.who === t.id}
              targeting={targeting && targets.some(x => x.id === t.id)}
              preview={!sel ? undefined : stopping ? (t.stopped ? 'Already stopped' : 'Stop this move') : (n => (n > 0 ? `−${n} Hold` : 'No effect'))(damageOn(t, cardDef(sel).family, cardDef(sel).power))}
              onTarget={() => { dispatch({ type: 'play', cardId: sel!.id, target: t.id }); setSelected(null) }}
              onAdminHit={run.admin && run.phase === 'turn' ? () => dispatch({ type: 'admin', op: 'hold20', target: t.id }) : undefined} />
          ))}
          {run.fire > 0 && (
            <section className={`hazard ${lit('fire')}`} aria-label={`${fires(run.fire)} burning`}>
              <div className="hazard__head"><img src={`${import.meta.env.BASE_URL}art/icons/fire.png`} alt="" /><span className="cl-label">{fires(run.fire)} burning</span><span className="cl-num hazard__level">max {CONFIG.fireMax}</span></div>
              <div className="warn warn--heat"><b>End of turn</b><span>{fireNext}</span></div>
              <span className="hazard__note">Pumps stopped.</span>
            </section>
          )}
        </section>

        <section className="col-field" aria-label="Your field">
          <div className="field__label"><span className="cl-label">Your {st >= 2 ? 'fields' : 'field'} · {FIELD_PLACE[st] ?? FIELD_PLACE[1]}</span>{run.current.prorate && <span className="cl-label cl-minus">Prorated: {CONFIG.prorationCap} oil a turn at most</span>}{run.fire > 0 && <span className="cl-label field__fireway">Fire burns ←</span>}</div>
          <div className="field">
            {run.plots.length === 0 && <div className="plot plot--empty-field">{st >= 2 ? 'No land. Play a Survey to claim a plot.' : 'No land yet. Play Prospect to claim 2 plots.'}</div>}
            {run.plots.map((w, i) => {
              const marked = run.marked === i && !!w
              const burning = burnsWell && i === run.plots.reduce((m, p, k) => (p ? k : m), -1)
              const state = !w ? 'Empty plot' : w.unstable ? (st >= 2 ? 'Shut in' : 'Unstable') : run.fire ? 'Pump stopped' : `${w.output} oil / turn`
              return (
                <div key={i} className={`plot ${!w ? 'plot--empty' : ''} ${w?.field ? 'plot--field' : ''} ${w?.unstable ? 'plot--unstable' : ''} ${marked ? 'plot--marked' : ''} ${burning ? 'plot--burning' : ''} ${run.fire && w ? 'plot--stopped' : ''}`}>
                  <span className="cl-label">Plot {i + 1}</span>
                  {w ? <button type="button" className="plot__well" onClick={() => setPlotMenu(plotMenu === i ? null : i)} aria-label={`${plotName(run, i)}, ${state}`}>
                    <img src={`${import.meta.env.BASE_URL}art/icons/derrick.png`} alt="" />
                  </button> : <div className="plot__hole" />}
                  <span className="plot__name">{w ? plotName(run, i) : '—'}</span>
                  <span className="plot__state">{state}</span>
                  {w && !neverDry(w) && (<span className={`plot__state ${w.reserve <= w.output * 2 ? 'cl-minus' : ''}`}>{w.reserve} bbl left</span>)}
                  {marked && <span className="plot__flag">Marked</span>}
                  {burning && <span className="plot__flag plot__flag--fire">Burns next</span>}
                  {plotMenu === i && w && (
                    <div className="plot__menu">
                      <button type="button" className="cl-btn" disabled={run.ap < 1} onClick={() => { dispatch({ type: 'sellWell', plot: i }); setPlotMenu(null) }}>Sell {w.field ? 'Field' : 'Well'} · 1 AP · {money(wellValue(w), st, true)}</button>
                    </div>
                  )}
                </div>
              )
            })}
            <div className={`plot plot--stock ${run.fire && run.oil > 0 ? 'plot--burning' : ''} ${lit('oil')}`}>
              <span className="cl-label">Stockpile</span>
              <div className="barrels">{Array.from({ length: run.storage }, (_, i) => <span key={i} className={`barrel ${i < run.oil ? 'is-full' : ''}`} />)}</div>
              <span className="plot__name cl-num">{run.oil} / {run.storage} oil</span>
              {run.fire > 0 && run.oil > 0 && <span className="plot__flag plot__flag--fire">On fire</span>}
            </div>
          </div>

          <div className="resources">
            <div><span className="cl-label">Oil price</span><b className="cl-num">{money(netPrice(run), st)}</b><span className="res-note">{freight(run) ? `${money(price(run), st)} − freight ${money(freight(run), st)}` : run.boost ? `+${money(run.boost, st)} this turn` : 'per barrel'}</span></div>
            <div><span className="cl-label">Production</span><b className={`cl-num ${production(run) === 0 && run.plots.some(Boolean) ? 'cl-minus' : ''}`}>{production(run)}</b><span className="res-note">{run.fire ? 'pumps stopped' : st >= 2 ? `${run.plots.filter(w => w?.field).length} Fields · ${run.plots.filter(w => w && !w.field).length} Wells` : `${run.plots.filter(Boolean).length} Wells`}</span></div>
            <div><span className="cl-label">Storage</span><b className="cl-num">{run.storage}</b><span className="res-note">barrels</span></div>
          </div>

          <div className="events" aria-live="polite">{run.events.slice(0, 3).map((e, i) => <p key={`${run.turn}-${i}-${e}`} className={i === 0 ? 'is-new' : ''}>{units(e, st)}</p>)}</div>
        </section>

        <aside className="col-money">
          <section className={`cl-ledger ledger ${lit('money')}`} aria-label="Company ledger">
            <div className="cl-ledger__head"><span className="cl-label">Capital</span><span className={`cl-ledger__total ${run.capital <= debtPerTurn(run) * 2 ? 'cl-minus' : ''}`}>{money(run.capital, st)}</span></div>
            <ul className="cl-ledger__rows">
              {run.ledger.slice(-6).map((l, i) => <li key={`${run.turn}-${i}`} className="ink-in"><span>{units(l.label, st)}</span><span className={l.label === 'Brought forward' ? '' : l.amount < 0 ? 'cl-minus' : 'cl-plus'}>{l.label === 'Brought forward' ? money(l.amount, st) : money(l.amount, st, true)}</span></li>)}
              <li className="next-debt"><span>Debt next turn</span><span className="cl-minus">{debtPerTurn(run) ? `(${money(-debtPerTurn(run) * (run.pending.audit ? 2 : 1), st)})` : 'None'}</span></li>
            </ul>
          </section>
          <ExposureMeter run={run} lit={acting?.kind === 'board'} />
          <section className={`fortune ${lit('gold')}`}>
            <div><span className="cl-label">Your fortune</span><b className={`cl-num ${st >= 2 && run.gold === 0 ? 'cl-minus' : ''}`}>{run.gold} gold</b></div>
            <span className="res-note">{run.goldShield ? 'Personal Lawyer on retainer this turn.' : st >= 2 ? 'Enemies can take gold now. Below 0, you are ruined.' : `Skim rate: ${money(skimRate(run), st)} → 1 gold`}</span>
          </section>
          <section className="items">
            <span className="cl-label">Items</span>
            <div className="items__row">
              {run.debt > 0 && <div className="cl-item cl-item--neg"><div className="cl-item__disc">−{run.debt}</div><div className="cl-item__name">Bank Debt</div><div className="cl-item__fx">{money(-run.debt, st)} a turn</div></div>}
              {run.items.map((k, i) => <div key={i} className={`cl-item ${ITEMS[k].negative ? 'cl-item--neg' : ''}`}><div className="cl-item__disc"><img src={`${import.meta.env.BASE_URL}art/icons/${ITEMS[k].icon}.png`} alt="" /></div><div className="cl-item__name">{ITEMS[k].name}</div><div className="cl-item__fx">{units(ITEMS[k].text, st)}</div></div>)}
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
          <button type="button" className="cl-btn sell-btn" disabled={run.ap < 1 || run.oil < 1 || run.current.refuse}
            onClick={() => dispatch({ type: 'sellOil' })}>
            {run.current.refuse ? 'Shipment refused' : `Sell ${run.oil} oil · 1 AP · ${money(run.oil * netPrice(run), st, true)}`}
            {run.fire > 0 && run.oil > 0 && st < 2 && <em> · fire hits Wells next</em>}
          </button>
          {run.cover > 0 && <span className="cover-badge">Cover {run.cover}</span>}
          <div className="action-strip__actions">
            {run.fire > 0 && weakestWell(run) >= 0 && <button type="button" className="cl-btn" disabled={run.ap < CONFIG.firebreakAP} onClick={() => dispatch({ type: 'firebreak' })}>Firebreak · {CONFIG.firebreakAP} AP · lose Well No. {weakestWell(run) + 1}, put out every fire</button>}
          </div>
        </div>
        {scrapping && <div className="hand-prompt cl-label">Choose a card in your hand to destroy</div>}
        <div className="hand-row">
          <button type="button" className={`pile pile--btn ${lit('shuffle')}`} title="See what's left to draw" onClick={() => setPile('draw')}><span className="pile__card cl-num">{run.draw.length}</span><span className="cl-label">Draw</span></button>
          <div className={`hand ${lit('cards')}`}>
            {run.hand.map((c, i) => {
              const chk = canPlay(run, c)
              return <div key={c.id} className="hand__slot" style={{ animationDelay: `${i * 60}ms` }}>
                <CardView card={c} stage={st} apCost={apCost(run, c)} playable={chk.ok || (scrapping && c.id !== selected)} why={chk.why} selected={selected === c.id} marked={scrapping && c.id !== selected ? 'destroy' : undefined} onClick={() => clickCard(c.id)} />
              </div>
            })}
          </div>
          <div className="pile-col">
            <button type="button" className="pile pile--btn" title="See the discard pile" onClick={() => setPile('discard')}><span className="pile__card pile__card--discard cl-num">{run.discard.length}</span><span className="cl-label">Discard</span></button>
            <button type="button" className={`cl-btn end-turn ${endReady ? 'cl-btn--primary' : ''}`} onClick={() => { setSelected(null); dispatch({ type: 'endTurn' }) }}>End turn</button>
          </div>
        </div>
      </footer>
      {pile && <PileView title={pile === 'draw' ? 'Draw pile' : 'Discard pile'} cards={pile === 'draw' ? run.draw : run.discard} stage={st} onClose={() => setPile(null)} />}
      <span className="sr-only">{live.map(t => THREATS[t.kind].name).join(', ')}</span>
    </div>
  )
}
