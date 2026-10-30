// The game board laid out for a phone held upright: a status bar on top, the
// enemies and field in a scrolling middle, and the hand and actions in a dock
// within thumb reach. Cards take two taps (read, then play) so nothing is
// played by accident on a small screen.
import { useEffect, useRef, useState } from 'react'
import { CONFIG } from '../engine/config'
import { ITEMS, THREATS, bossRound, roleLabel } from '../engine/data'
import {
  apCost, turnsLeft, resistOf, attackPower, phaseName, reserves, weakOf, sellAP, canPlay, cardDef, damageOn, fires, freight, handTargetsFor, targetsFor, weakestWell, wellValue, debtPerTurn, fireTarget, infiltrated, intent, intentText, netPrice, neverDry, plotName, price, production, skimRate,
  type Action, type Beat, type Run, type Threat,
} from '../engine/engine'
import { FIELD_PLACE, money, units, year } from '../engine/format'
import { ExposureMeter } from './Exposure'
import { HeatMeter } from './Heat'
import { TruthClock } from './TruthClock'
import { Portrait } from './Portrait'
import { CardView } from './CardView'
import { iconUrl } from './icons'
import { GlossaryButton, SettingsButton } from './Settings'
import { PileView } from './PileView'
import { Coach } from './Coach'
import { lets, lit as coachLit, type CoachView } from './tutorial'

interface Props { run: Run; dispatch: (a: Action) => void; acting?: Beat | null; coach?: CoachView }
const art = (path: string) => `${import.meta.env.BASE_URL}art/${path}`

export function MobileGame({ run, dispatch, acting, coach }: Props) {
  const cl = (f: Parameters<typeof coachLit>[1]) => coachLit(coach, f)
  // the tutorial: bring what it's talking about into view (a new Well card lands at the far end of the hand)
  const root = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!coach) return
    const t = setTimeout(() => root.current?.querySelectorAll('.is-coached').forEach(el => el.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' })), 400)
    return () => clearTimeout(t)
  }, [coach?.no, run.hand.length]) // eslint-disable-line react-hooks/exhaustive-deps
  const lit = (k: Beat['kind']) => (acting?.kind === k ? 'is-acting' : '')
  const [selected, setSelected] = useState<number | null>(null)
  const [plotMenu, setPlotMenu] = useState<number | null>(null)
  const [sheet, setSheet] = useState(false)
  const [pile, setPile] = useState<'draw' | 'discard' | null>(null)
  const [shredding, setShredding] = useState(false)
  const st = run.stage
  const sel = run.hand.find(c => c.id === selected) ?? null
  const selDef = sel ? cardDef(sel) : null
  const selCheck = sel ? canPlay(run, sel) : null
  const dmgOn = (t: Threat) => (selDef ? damageOn(t, selDef.family, attackPower(run, selDef)) : 0)
  const targets = sel ? targetsFor(run, sel) : []
  const stopping = !!selDef?.stop
  const needsTarget = !!sel && !!selCheck?.ok && targets.length > 1
  const scrapping = !!sel && !!selCheck?.ok && handTargetsFor(run, sel).length > 0 // pick a card in your hand to destroy
  const canTarget = (t: Threat) => targets.some(x => x.id === t.id)
  const burnsWell = run.fire > 0 && run.oil === 0 && st < 2 // from stage 2, fire only burns oil
  const lastWell = run.plots.reduce((m, p, k) => (p ? k : m), -1)
  const nextDebt = debtPerTurn(run) * (run.pending.audit ? 2 : 1)

  function playSelected() {
    if (!sel || !selCheck?.ok || needsTarget || scrapping) return
    dispatch({ type: 'play', cardId: sel.id })
    setSelected(null)
  }
  function tapCard(id: number) {
    setPlotMenu(null)
    if (shredding) { dispatch({ type: 'shred', cardId: id }); setShredding(false); return }
    const key = run.hand.find(c => c.id === id)?.key
    if (key && !lets.card(coach, key)) return
    if (scrapping && sel && id !== sel.id) { dispatch({ type: 'play', cardId: sel.id, target: id }); setSelected(null); return }
    if (selected === id) { if (selCheck?.ok && !needsTarget && !scrapping) playSelected(); else setSelected(null); return }
    setSelected(id)
  }
  function tapThreat(t: Threat) {
    if (!needsTarget || !sel || !canTarget(t)) return
    dispatch({ type: 'play', cardId: sel.id, target: t.id })
    setSelected(null)
  }

  return (
    <div className="m-game" ref={root}>
      <header className="m-hud">
        <div className="m-hud__when">
          <span className="cl-label">{st >= 4 && run.round >= bossRound(4) ? 'The Truth' : `Round ${run.round}/4`} · Turn {run.turn}</span>
          {turnsLeft(run) <= CONFIG.stalemateWarn && <span className="cl-label cl-minus m-hud__hint">{turnsLeft(run)} turn{turnsLeft(run) === 1 ? '' : 's'} left to win</span>}
          {st === 2 && run.turn <= CONFIG.quickWinTurns && <span className="cl-label m-hud__hint">Exposure −{CONFIG.quickWinDrop} if won by turn {CONFIG.quickWinTurns}</span>}
          <div className="m-hud__year"><b className="cl-display">{year(st, run.round)}</b><GlossaryButton /><SettingsButton /></div>
          <div className="m-pips">{(st >= 4 && run.round >= bossRound(4) ? [1, 2, 3, 4, 5] : [1, 2, 3, 4]).map(i => <span key={i} className={`round-pip ${i < run.round ? 'is-done' : ''} ${i === run.round ? 'is-now' : ''} ${i === 4 && st < 4 ? 'is-boss' : ''} ${i === 5 ? 'is-truth' : ''}`} />)}</div>
        </div>
        <button type="button" className={`m-hud__money ${lit('money')} ${cl('capital')}`} onClick={() => setSheet(true)} aria-label="Open the ledger">
          <span className="m-hud__cap">
            <span className="cl-label">Capital</span>
            <b className={`cl-num ${run.capital <= debtPerTurn(run) * 2 ? 'cl-minus' : ''}`}>{money(run.capital, st)}</b>
            <span className="m-hud__debt cl-num">{nextDebt ? `${money(-nextDebt, st)} next turn` : st === 3 ? `Heat ${run.heat}` : st >= 4 ? `${run.clock} o'clock` : 'No debt'}</span>
          </span>
          <span className={`m-hud__gold ${acting?.kind === 'gold' ? 'is-acting' : ''}`}>
            <span className="cl-label">Fortune</span>
            <b className="cl-num">{run.gold}<small> gold</small></b>
            <span className="m-hud__more cl-label">Ledger ›</span>
          </span>
        </button>
      </header>

      <main className="m-main" onClick={e => { if (e.target === e.currentTarget) { setSelected(null); setPlotMenu(null) } }}>

        <section className={`m-threats ${cl('threat')}`} aria-label="Liabilities">
          {run.fire > 0 && !run.threats.some(t => !t.beaten) && <span className="cl-label m-prompt">Every liability is beaten. Put the fire out to end the round.</span>}
          {needsTarget && <span className="cl-label m-prompt">{stopping ? 'Tap the move to stop' : 'Tap a liability to hit'}</span>}
          {run.threats.map(t => {
            const d = THREATS[t.kind]
            const can = needsTarget && canTarget(t)
            const Tag = can ? 'button' : 'section'
            return (
              <Tag key={t.id} onClick={can ? () => tapThreat(t) : undefined}
                className={`m-threat ${t.beaten ? 'threat--beaten' : ''} ${can ? 'threat--target' : ''} ${acting?.who === t.id ? 'is-acting' : ''}`}
                aria-label={`${d.name}, Hold ${Math.max(0, t.hold)} of ${t.maxHold}`}>
                <Portrait className="m-threat__portrait" name={d.name} portrait={d.portrait} />
                <div className="m-threat__body">
                  {roleLabel(d) && <span className="cl-label m-threat__role">{roleLabel(d)}</span>}
                  <div className="m-threat__top">
                    <h2 className="m-threat__name">{d.name}{t.kind === 'truth' ? ` · ${phaseName(t)}` : ''}</h2>
                    <span className="cl-num m-threat__hold">{t.cover && !t.beaten ? <span className="enemy-cover">Cover {t.cover} · </span> : null}{Math.max(0, t.hold)}/{t.maxHold}</span>
                  </div>
                  <span className="hold-bar"><span style={{ width: `${Math.max(0, (t.hold / t.maxHold) * 100)}%` }} /></span>
                  {d.rule && !t.beaten && (t.kind === 'inspector' ? (x => (
        <div className={`opened threat__rule ${x.met ? 'is-met' : ''}`}>
          <b>{x.met ? 'Reserves met' : 'Reserves'}</b> {x.met
            ? units(`You have $${x.have}. End your turn now and he loses ${x.damage} Hold.`, st)
            : units(`You have $${x.have} of $${x.need}. End a turn with $${x.need} or more and he loses ${x.damage} Hold.`, st)}
        </div>
      ))(reserves(run)) : <div className="opened threat__rule"><b>Rule</b> {units(d.rule, st)}</div>)}
                  {t.opened && run.turn === 1 && !t.beaten && <div className="opened"><b>Opened with</b> {units(t.opened, st)}</div>}
                  {!t.beaten && (n => n.length ? <div className="opened infiltrated"><b>Still to come</b> −{n.join(', then −')} Hold as your turns end</div> : null)(infiltrated(run, t))}
                  {t.beaten ? <div className="m-intent m-intent--done">Beaten</div> : t.stopped ? (
                    <div className="m-intent m-intent--stopped"><b>Stopped · {intent(run, t)}</b> <s>{units(intentText(run, t), st)}</s></div>
                  ) : (
                    <div className="m-intent"><b>Next · {intent(run, t)}</b> {units(intentText(run, t), st)}</div>
                  )}
                  <div className="m-traits">
                    {[weakOf(t.kind, t.phase) && `Weak: ${weakOf(t.kind, t.phase)}`, resistOf(t.kind, t.phase) && `Resists: ${resistOf(t.kind, t.phase)}`, d.unblockable && 'Unblockable', d.immune && `Immune: ${d.immune}`].filter(Boolean).join(' · ')}
                  </div>
                </div>
                {run.admin && run.phase === 'turn' && !t.beaten && !needsTarget && <button type="button" className="cl-btn cl-btn--small admin-hit" onClick={e => { e.stopPropagation(); dispatch({ type: 'admin', op: 'hold20', target: t.id }) }}>−20</button>}
                {needsTarget && !t.beaten && <span className={`m-threat__dmg ${can ? '' : 'is-none'}`}>{stopping ? (can ? 'Stop' : 'Stopped') : can ? `−${dmgOn(t)} Hold` : 'No effect'}</span>}
              </Tag>
            )
          })}
        </section>

        {run.fire > 0 && (
          <section className={`m-fire ${lit('fire')} ${cl('fire')}`} aria-label={`${fires(run.fire)} burning`}>
            <img src={art('icons/fire.png')} alt="" />
            <div><b className="cl-label">{fires(run.fire)} burning{run.fireBy ? ` · started by ${run.fireBy}` : ''} · pumps stopped</b><span>End of turn: {fireTarget(run)}</span></div>
          </section>
        )}

        <ExposureMeter run={run} compact lit={acting?.kind === 'board'} />
        <HeatMeter run={run} compact lit={acting?.kind === 'board'} />
        <TruthClock run={run} compact lit={acting?.kind === 'board'} />

        <section aria-label="Your field">
          <div className="m-label"><span className="cl-label">Your {st >= 3 ? 'rigs' : st >= 2 ? 'fields' : 'field'} · {FIELD_PLACE[st] ?? FIELD_PLACE[1]}</span>{run.current.prorate && <span className="cl-label cl-minus">Prorated</span>}{run.fire > 0 && <span className="cl-label field__fireway">Fire burns ←</span>}</div>
          <div className={`m-field ${cl('field')}`}>
            {run.plots.length === 0 && <div className="m-plot m-plot--none">{st >= 3 ? `No Rigs. Build one at ${st >= 4 ? 'the Investor Portal' : 'the Trading Floor'}.` : st >= 2 ? 'No Wells. Play a Steel Derrick to build one.' : 'No land yet. Play Prospect to claim 2 plots.'}</div>}
            {run.plots.map((w, i) => {
              const marked = run.marked === i && !!w
              const burning = burnsWell && i === lastWell
              const state = !w ? 'Empty' : w.unstable ? (st >= 2 ? 'Shut in' : 'Unstable') : run.fire ? 'Stopped' : `${w.output} oil`
              return (
                <div key={i} className={`m-plot ${!w ? 'plot--empty' : ''} ${w?.field || w?.rig ? 'plot--field' : ''} ${w?.rig ? 'plot--rig' : ''} ${w?.unstable ? 'plot--unstable' : ''} ${marked ? 'plot--marked' : ''} ${burning ? 'plot--burning' : ''} ${run.fire && w ? 'plot--stopped' : ''}`}>
                  <span className="m-plot__no cl-num">{i + 1}</span>
                  {w ? (
                    <button type="button" className="plot__well" onClick={() => { setSelected(null); setPlotMenu(plotMenu === i ? null : i) }} aria-label={`${plotName(run, i)}, ${state}. Tap to sell`}>
                      <img src={iconUrl(w.rig ? (st >= 4 ? 'rig4' : 'rig') : 'derrick')} alt="" />
                    </button>
                  ) : <div className="m-plot__hole" />}
                  <span className="m-plot__state">{state}</span>
                  {w && (neverDry(w) ? <span className="m-plot__state plot__forever">{w.rig ? 'Rig' : w.field ? 'Field' : 'Lasting'}</span> : <span className={`m-plot__state ${w.reserve <= w.output * 2 ? 'cl-minus' : ''}`}>{w.reserve} left</span>)}
                  {marked && <span className="m-flag">Marked</span>}
                  {burning && <span className="m-flag m-flag--fire">Burns</span>}
                </div>
              )
            })}
          </div>
          {plotMenu !== null && run.plots[plotMenu] && (
            <div className="m-plotmenu">
              <span>{plotName(run, plotMenu)}</span>
              <button type="button" className="cl-btn cl-btn--small" disabled={run.ap < 1 || !!run.plots[plotMenu]?.faithful || !lets.other(coach)} onClick={() => { dispatch({ type: 'sellWell', plot: plotMenu }); setPlotMenu(null) }}>Sell · 1 AP · {money(wellValue(run.plots[plotMenu]!), st, true)}</button>
              <button type="button" className="cl-btn cl-btn--small" onClick={() => setPlotMenu(null)}>Keep</button>
            </div>
          )}
        </section>

        <section className={`m-stats ${lit('oil')}`}>
          <div className={`${run.fire && run.oil > 0 ? 'is-burning' : ''} ${cl('stock')}`}>
            <span className="cl-label">Stockpile</span>
            <b className="cl-num">{run.oil}/{run.storage}</b>
            <span className="m-barrels">{Array.from({ length: run.storage }, (_, i) => <i key={i} className={i < run.oil ? 'is-full' : ''} />)}</span>
          </div>
          <div>
            <span className="cl-label">Oil price</span>
            <b className="cl-num">{money(netPrice(run), st)}</b>
            <span className="res-note">{freight(run) ? `${money(price(run), st)} − ${money(freight(run), st)} freight` : run.boost || run.roundBoost ? `+${money(run.boost + run.roundBoost, st)} now` : 'per barrel'}</span>
          </div>
          <div>
            <span className="cl-label">Production</span>
            <b className={`cl-num ${production(run) === 0 && run.plots.some(Boolean) ? 'cl-minus' : ''}`}>{production(run)}</b>
            <span className="res-note">{run.fire ? 'pumps stopped' : 'oil a turn'}</span>
          </div>
        </section>

        <div className="m-events" aria-live="polite">{run.events.slice(0, 3).map((e, i) => <p key={`${run.turn}-${i}-${e}`} className={i === 0 ? 'is-new' : ''}>{units(e, st)}</p>)}</div>
      </main>

      <footer className="m-dock">
        {coach && <Coach view={coach} mobile />}
        {sel && selDef ? (
          <div className="m-detail">
            <div className="m-detail__text">
              <b className="cl-display">{selDef.name}</b>
              <span>{units(selDef.text, st)}</span>
              {!selCheck?.ok && selCheck?.why && <span className="cl-minus m-detail__why">{selCheck.why}</span>}
            </div>
            {selCheck?.ok && (scrapping
              ? <span className="cl-label m-detail__hint">Tap a card to destroy ↓</span>
              : needsTarget
              ? <span className="cl-label m-detail__hint">{stopping ? 'Tap a move ↑' : 'Tap a liability ↑'}</span>
              : <button type="button" className={`cl-btn cl-btn--primary ${coach?.play === sel.key ? 'is-coached' : ''}`} onClick={playSelected}>Play · {apCost(run, sel)} AP</button>)}
          </div>
        ) : (
          <div className="m-actions">
            <button type="button" className={`cl-btn cl-btn--small m-pilebtn ${lit('shuffle')}`} onClick={() => setPile('draw')}>Draw {run.draw.length}</button>
            <button type="button" className="cl-btn cl-btn--small m-pilebtn" onClick={() => setPile('discard')}>Discard {run.discard.length}</button>
            {run.fire > 0 && weakestWell(run) >= 0 && <button type="button" className="cl-btn cl-btn--small" disabled={run.ap < CONFIG.firebreakAP || !lets.other(coach)} onClick={() => dispatch({ type: 'firebreak' })}>Firebreak · {CONFIG.firebreakAP} AP · lose No. {weakestWell(run) + 1}</button>}
            {run.items.includes('paperShredder') && <button type="button" className="cl-btn cl-btn--small" disabled={run.shredded || !run.hand.length || !lets.other(coach)} onClick={() => setShredding(!shredding)}>{run.shredded ? 'Shredded' : shredding ? 'Cancel shred' : 'Shred a card'}</button>}
            {run.cover > 0 && <span className="cover-badge">Cover {run.cover}</span>}
          </div>
        )}

        <div className="m-hand">
          {run.hand.length === 0 && <span className="res-note m-hand__empty">No cards in hand.</span>}
          {run.hand.map((c, i) => {
            const chk = canPlay(run, c)
            const ok = lets.card(coach, c.key)
            return <div key={c.id} className={`hand__slot ${coach?.play === c.key && selected !== c.id ? 'is-coached' : ''}`} style={{ animationDelay: `${i * 50}ms` }}>
              <CardView card={c} stage={st} apCost={apCost(run, c)} playable={ok && (chk.ok || shredding || (scrapping && c.id !== selected))} why={chk.why} selected={selected === c.id} marked={shredding || (scrapping && c.id !== selected) ? 'destroy' : undefined} onClick={() => tapCard(c.id)} />
            </div>
          })}
        </div>

        <div className="m-bar">
          <div className={`ap ${cl('ap')}`} aria-label={`${run.ap} action points left`}>
            <span className="cl-label">AP</span>
            {Array.from({ length: Math.max(run.ap, CONFIG.baseAP) }, (_, i) => <span key={i} className={`ap-coin ${i < run.ap ? 'is-on' : ''}`} />)}
          </div>
          <button type="button" className={`cl-btn cl-btn--small m-sell ${cl('sell')}`} disabled={run.ap < sellAP(run) || run.oil < 1 || run.current.refuse || !lets.sell(coach)} onClick={() => dispatch({ type: 'sellOil' })}>
            {run.current.refuse ? 'Refused' : <>Sell {run.oil} oil<b className="cl-num"> {money(run.oil * netPrice(run) * (run.doubleSale ? 2 : 1), st, true)}</b>{st >= 3 && ` · ${sellAP(run)} AP`}</>}
          </button>
          <button type="button" className={`cl-btn end-turn ${run.ap === 0 ? 'cl-btn--primary' : ''} ${cl('endTurn')}`} disabled={!lets.endTurn(coach)} onClick={() => { setSelected(null); setPlotMenu(null); dispatch({ type: 'endTurn' }) }}>End turn</button>
        </div>
      </footer>

      {pile && <PileView title={pile === 'draw' ? 'Draw pile' : 'Discard pile'} cards={pile === 'draw' ? run.draw : run.discard} stage={st} onClose={() => setPile(null)} />}
      {sheet && (
        <div className="m-sheet-wrap" onClick={() => setSheet(false)}>
          <section className="m-sheet" role="dialog" aria-label="Company ledger" onClick={e => e.stopPropagation()}>
            <div className="m-sheet__grip" />
            <section className="cl-ledger ledger">
              <div className="cl-ledger__head"><span className="cl-label">Capital</span><span className="cl-ledger__total">{money(run.capital, st)}</span></div>
              <ul className="cl-ledger__rows">
                {run.ledger.map((l, i) => <li key={i}><span>{units(l.label, st)}</span><span className={l.label === 'Brought forward' ? '' : l.amount < 0 ? 'cl-minus' : 'cl-plus'}>{l.label === 'Brought forward' ? money(l.amount, st) : money(l.amount, st, true)}</span></li>)}
                {st !== 3 && <li className="next-debt"><span>Debt next turn</span><span className="cl-minus">{nextDebt ? `(${money(-nextDebt, st)})` : 'None'}</span></li>}
              </ul>
            </section>
            <ExposureMeter run={run} />
            <HeatMeter run={run} />
            <TruthClock run={run} />
            <section className="fortune">
              <div><span className="cl-label">Your fortune</span><b className="cl-num">{run.gold} gold</b></div>
              <span className="res-note">{run.goldShield ? 'Personal Lawyer on retainer this turn.' : st >= 2 ? 'Liabilities can take gold now. Below 0, you are ruined.' : `Skim rate: ${money(skimRate(run), st)} → 1 gold`}</span>
            </section>
            <section className="items">
              <span className="cl-label">Items</span>
              <div className="items__row">
                {run.debt > 0 && <div className="cl-item cl-item--neg"><div className="cl-item__disc">−{run.debt}</div><div className="cl-item__name">Bank Debt</div><div className="cl-item__fx">{money(-run.debt, st)} a turn</div></div>}
                {run.items.map((k, i) => <div key={i} className={`cl-item ${ITEMS[k].negative ? 'cl-item--neg' : ''}`}><div className="cl-item__disc"><img src={iconUrl(ITEMS[k].icon)} alt="" /></div><div className="cl-item__name">{ITEMS[k].name}</div><div className="cl-item__fx">{units(ITEMS[k].text, st)}</div></div>)}
              </div>
            </section>
            <button type="button" className="cl-btn" onClick={() => setSheet(false)}>Close</button>
          </section>
        </div>
      )}
    </div>
  )
}
