// Pharmaceutical, stage 1: the fight, the round's spoils, the shop and the end. Admin-only while it's built.
// One layout for both sizes: the 1440×900 board on a wide screen, a single scrolling column on a phone.
import { useEffect, useRef, useState } from 'react'
import { PHARMA as C } from '../engine/config'
import { CASE_STEPS, PCARDS, PTHREATS, REMEDIES, isRemedy, moveText, type PCardKey, type RemedyKey } from '../engine/pharma/data'
import {
  allCards, canPlay, canResearch, currentMove, damageFor, newPharmaRun, nextFactoryPrice, pact, patentPays, researchCost, settleCost, skimRate, spawnIn, targetsFor, trustBand,
  type PAction, type PCard, type PRun,
} from '../engine/pharma/engine'
import { findPharmaTerms } from '../terms'
import { patented } from '../telemetry'
import { play } from '../sound'
import { iconUrl as baseIconUrl } from './icons'
import { Portrait } from './Portrait'
import { GlossaryButton, SettingsButton } from './Settings'

const YEARS = [1880, 1888, 1896, 1905]
// art not drawn yet borrows an existing icon (drop the line once the real file is in public/art/icons)
const STAND_IN: Record<string, string> = {}
const iconUrl = (i: string) => baseIconUrl(STAND_IN[i] ?? i)
const money = (n: number, sign = false) => `${n < 0 ? '−' : sign ? '+' : ''}$${Math.abs(n)}`

/** A Pharmaceutical card, drawn like every other card in the game. */
function PCardView({ card, onClick, playable = true, why, selected, price, marked }: { card: PCard | { id: number; key: PCardKey; uses?: number; age?: number }; onClick?: () => void; playable?: boolean; why?: string; selected?: boolean; price?: string; marked?: boolean }) {
  const d = PCARDS[card.key]
  const remedy = isRemedy(card.key) ? REMEDIES[card.key as RemedyKey] : null
  const age = card.age ?? 0
  const cls = ['cl-card', 'card', 'ph-card', playable ? 'card--playable' : 'card--dim', selected ? 'cl-card--selected' : '', d.family === 'Junk' ? 'card--junk' : '', remedy ? 'ph-card--remedy' : '', marked ? 'card--destroy' : '']
  return (
    <button type="button" className={cls.filter(Boolean).join(' ')} onClick={onClick} data-theme="victorian"
      aria-label={`${d.name}${d.ap !== null ? `, costs ${d.ap} AP` : ''}. ${d.text}${why ? ` (${why})` : ''}`} title={why}>
      {price && <span className="cl-tag card-price">{price}</span>}
      <div className="cl-card__top"><div className="cl-card__cost">{d.ap ?? '–'}</div><div className="cl-card__name">{d.name}</div></div>
      <div className="cl-card__art"><img src={iconUrl(d.icon)} alt="" draggable={false} /></div>
      <div className="cl-card__band">{d.family}<span className="cl-card__era"> · 1880s</span></div>
      <div className="cl-card__effect">{d.text}</div>
      <div className="cl-card__foot">
        <div className="cl-pips" aria-hidden="true">
          {remedy ? <span className="ph-track">{remedy.pays.map((p, i) => <i key={i} className={i < age ? 'is-gone' : i === age ? 'is-now' : ''}>{p}</i>)}</span>
            : d.oncePerFight ? <span className="cl-num card-once">1 / fight</span>
            : card.uses !== undefined && d.uses ? Array.from({ length: d.uses }, (_, i) => <span key={i} className={`cl-pip ${i < card.uses! ? 'cl-pip--on' : ''}`} />) : null}
        </div>
        {why && !playable && why !== 'Not enough AP' && <span className="cl-label card-why">{why}</span>}
      </div>
    </button>
  )
}

/** Skull and crossbones: the Disgraced line. */
const Skull = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="currentColor">
    <path d="M4 18.6 19.6 22l.4-1.6L5 17zM20 18.6 4.4 22 4 20.4 19 17z" opacity=".9" />
    <path d="M12 2C7.6 2 4.5 5 4.5 9c0 2.3 1 4 2.5 5v2.2c0 .6.4 1 1 1h8c.6 0 1-.4 1-1V14c1.5-1 2.5-2.7 2.5-5 0-4-3.1-7-7.5-7zm-3 10.3a1.9 1.9 0 1 1 0-3.8 1.9 1.9 0 0 1 0 3.8zm2 2.7.9-2 .9 2zm4-2.7a1.9 1.9 0 1 1 0-3.8 1.9 1.9 0 0 1 0 3.8z" />
  </svg>
)

/** Trust, −5 to +5, with the Disgraced line at −6. */
function TrustDial({ trust }: { trust: number }) {
  const cells = Array.from({ length: C.trustMax - C.disgraceAt + 1 }, (_, i) => C.disgraceAt + i)
  return (
    <section className={`ph-trust ph-trust--${trustBand(trust)}`} aria-label={`Trust ${trust}, from ${C.trustMin} to +${C.trustMax}. Disgraced at ${C.disgraceAt}.`}>
      <div className="ph-trust__head"><img src={iconUrl('trust')} alt="" /><span className="cl-label">Trust</span><b className="cl-num">{trust > 0 ? `+${trust}` : trust}</b></div>
      <div className="ph-trust__scale" aria-hidden="true">
        {cells.map(n => <span key={n} className={`ph-trust__cell ${n === C.disgraceAt ? 'is-skull' : ''} ${n === trust ? 'is-now' : ''} ${n === 0 ? 'is-zero' : ''} ${n < 0 ? 'is-neg' : n > 0 ? 'is-pos' : ''}`}>{n === C.disgraceAt ? <Skull /> : n > 0 ? `+${n}` : n}</span>)}
      </div>
      <span className="res-note">Research {money(C.research.low)} at −3 or less · {money(C.research.mid)} · {money(C.research.high)} at +3 or more. Disgraced at {C.disgraceAt}.</span>
    </section>
  )
}

const MOBILE_MAX = 760 // the same line the Oil screens use
function useMobile() {
  const [m, setM] = useState(() => window.innerWidth <= MOBILE_MAX)
  useEffect(() => { const f = () => setM(window.innerWidth <= MOBILE_MAX); window.addEventListener('resize', f); return () => window.removeEventListener('resize', f) }, [])
  return m
}

function Fight({ run, dispatch }: { run: PRun; dispatch: (a: PAction) => void }) {
  const mobile = useMobile()
  const [selected, setSelected] = useState<number | null>(null)
  const sel = run.hand.find(c => c.id === selected)
  const aim = sel ? targetsFor(run, sel) : null
  const research = canResearch(run)
  const cost = researchCost(run)
  const income = run.factories.reduce((s, p) => s + (p ? patentPays(run, p) : 0), 0)
  const year = YEARS[run.round - 1] ?? 1880
  const late = C.turnLimit - run.turn <= 5

  function clickCard(c: PCard) {
    if (sel && aim?.kind === 'remedy' && aim.ids.includes(c.id)) { dispatch({ type: 'play', cardId: sel.id, target: c.id }); setSelected(null); return }
    if (!canPlay(run, c).ok) return
    const t = targetsFor(run, c)
    if (t.ids.length > 1) { setSelected(selected === c.id ? null : c.id); return }
    setSelected(null)
    dispatch({ type: 'play', cardId: c.id })
  }
  const endTurn = () => { setSelected(null); dispatch({ type: 'endTurn' }) }

  const capitalBox = (
    <div className="ph-capital" aria-label={`Capital ${money(run.capital)}. Live remedies pay ${money(income)} as your turn ends.`}>
      <span className="cl-label">Capital</span>
      <b className={`cl-num ${run.capital <= 3 ? 'cl-minus' : ''}`}>{money(run.capital)}</b>
      <span className="cl-num ph-capital__next">{income ? `${money(income, true)} at turn end` : 'No live remedies'}</span>
    </div>
  )

  const threats = (
    <section className="col-threats ph__threats" aria-label="Liabilities">
      <span className="cl-label">Liabilities{aim?.kind === 'threat' ? ` · ${sel?.key === 'nda' ? 'Choose who signs' : 'Choose a target'}` : ''}</span>
      {run.threats.map(t => {
        const d = PTHREATS[t.kind]
        const m = currentMove(t)
        const targeting = aim?.kind === 'threat' && aim.ids.includes(t.id)
        const Tag = targeting ? 'button' : 'section'
        const pd = sel ? PCARDS[sel.key] : null
        const spawn = spawnIn(run, t)
        return (
          <Tag key={t.id} className={`threat ${t.beaten ? 'threat--beaten' : ''} ${targeting ? 'threat--target' : ''}`} onClick={targeting ? () => { dispatch({ type: 'play', cardId: sel!.id, target: t.id }); setSelected(null) } : undefined}>
            <div className="threat__head">
              <Portrait className="threat__portrait" name={d.name} portrait={d.portrait} />
              <div className="threat__title">
                {d.boss && <span className="cl-label">Boss</span>}
                <h2 className="threat__name">{d.name}</h2>
                <div className="threat__hold"><span className="hold-bar"><span style={{ width: `${(t.hold / t.maxHold) * 100}%` }} /></span><span className="cl-num">{t.hold} / {t.maxHold}</span></div>
                {targeting && pd && <span className="cl-label threat__preview">{sel!.key === 'nda' ? 'Cancel the first hit' : `−${damageFor(pd.family, pd.power ?? 0, t.kind)} Hold`}</span>}
              </div>
            </div>
            {t.beaten ? <div className="warn warn--done">Beaten</div> : (
              <div className={`warn ${t.nda ? 'warn--stopped' : ''}`}>
                <b>Next · {m.name}{m.hits.length > 1 ? ` · ${m.hits.length} hits` : ''}</b>
                <span>{moveText(m)}</span>
                {t.nda && <span className="ph-nda">NDA: the first hit is cancelled</span>}
                {spawn !== null && <span className="ph-nda">{PTHREATS[d.spawn!.kind].name} joins {spawn === 1 ? 'as this turn ends' : `in ${spawn} turns`}</span>}
              </div>
            )}
            {!t.beaten && <dl className="threat__traits">
              {d.weak && <div><dt>Weak to:</dt><dd>{d.weak}</dd></div>}
              {d.resist && <div><dt>Resists:</dt><dd>{d.resist}</dd></div>}
            </dl>}
          </Tag>
        )
      })}
    </section>
  )

  const middle = (
    <section className="ph__middle" aria-label="Your factories">
      <TrustDial trust={run.trust} />
      {run.samples > 0 && <span className="cover-badge">Free Samples: live remedies pay {money(run.samples)} more this turn</span>}
      <span className="cl-label">Your factories · {run.factories.length} of {C.maxFactories}</span>
      <div className="ph-factories">
        {run.factories.map((p, i) => {
          const cases = p ? run.cases.filter(c => c.remedy === p.key) : []
          const left = p ? REMEDIES[p.key].pays.length - p.age : 0
          return (
            <div key={i} className={`ph-factory ${p ? 'is-live' : ''}`}>
              <img className="ph-factory__icon" src={iconUrl(p ? PCARDS[p.key].icon : 'factory')} alt="" />
              <div className="ph-factory__body">
                {p ? <>
                  <b className="ph-factory__name">{PCARDS[p.key].name}</b>
                  <span className="ph-track ph-track--big">{REMEDIES[p.key].pays.map((n, k) => <i key={k} className={k < p.age ? 'is-gone' : k === p.age ? 'is-now' : ''}>{p.copied ? Math.floor(n / 2) : n}</i>)}</span>
                  <span className="cl-num ph-factory__pays">Pays {money(patentPays(run, p))} · {left} turn{left === 1 ? '' : 's'} left</span>
                  {p.copied && <span className="plot__flag">Illegal Copy: half pay</span>}
                  {p.blocked && <span className="plot__flag plot__flag--fire">Pays nothing this turn</span>}
                  {cases.length > 0 && <span className="plot__flag plot__flag--fire">{cases.length} Patient Case{cases.length > 1 ? 's' : ''}</span>}
                </> : <><b className="ph-factory__name">Empty factory</b><span className="res-note">Play Produce with a remedy.</span></>}
              </div>
            </div>
          )
        })}
      </div>

      {run.cases.length > 0 && (
        <section className="ph-cases" aria-label="Patient Cases">
          <span className="cl-label">Patient Cases · each gets worse as your turn ends</span>
          {run.cases.map(c => (
            <div key={c.id} className="ph-case">
              <img src={iconUrl('patientCase')} alt="" />
              <div className="ph-case__body">
                <b>{PCARDS[c.remedy].name}</b>
                <span className="ph-ladder">{CASE_STEPS.map((st, i) => <i key={st} className={i < c.step ? 'is-gone' : i === c.step ? 'is-now' : i === 3 ? 'is-death' : ''}>{st}</i>)}</span>
              </div>
              <button type="button" className="cl-btn cl-btn--small" disabled={run.capital < settleCost(c) || run.ap < C.settleAP} onClick={() => dispatch({ type: 'settle', caseId: c.id })}>Settle · {C.settleAP} AP · {money(settleCost(c))}</button>
            </div>
          ))}
          <span className="res-note">A death costs {money(C.deathCapital)} and {C.deathTrust} Trust. Critical costs {C.criticalTrust} Trust.</span>
        </section>
      )}

      <div className="events" aria-live="polite">{run.events.slice(0, 3).map((e, i) => <p key={`${run.turn}-${i}-${e}`} className={i === 0 ? 'is-new' : ''}>{e}</p>)}</div>
    </section>
  )

  const researchBtn = (
    <button type="button" className="cl-btn cl-btn--primary ph-research" disabled={!research.ok} onClick={() => { play('click'); dispatch({ type: 'research' }) }}>
      <img src={iconUrl('research')} alt="" />
      <span><b>Research · {money(cost)}</b><span className="res-note">{research.why ?? (run.doubleResearch ? 'Two remedies this time' : 'Once a turn · no AP')}</span></span>
    </button>
  )
  const ap = (
    <div className="ap" aria-label={`${run.ap} action points left`}>
      <span className="cl-label">AP</span>
      {Array.from({ length: Math.max(run.ap, C.baseAP) }, (_, i) => <span key={i} className={`ap-coin ${i < run.ap ? 'is-on' : ''}`} />)}
      <span className="cl-num">{run.ap}</span>
    </div>
  )
  const hand = run.hand.map((c, i) => {
    const chk = canPlay(run, c)
    const pick = aim?.kind === 'remedy' && aim.ids.includes(c.id)
    return <div key={c.id} className="hand__slot" style={{ animationDelay: `${i * 60}ms` }}>
      <PCardView card={c} playable={chk.ok || pick} why={pick ? undefined : chk.why} selected={selected === c.id} onClick={() => clickCard(c)} />
    </div>
  })
  const prompt = aim?.kind === 'remedy' ? <span className="hand-prompt cl-label">Choose a remedy to produce</span> : null

  if (mobile) return (
    <div className="m-game ph" data-theme="victorian">
      <header className="m-hud">
        <div className="m-hud__when">
          <span className="cl-label">Round {run.round}/4 · Turn {run.turn}</span>
          {late && <span className="cl-label cl-minus m-hud__hint">{C.turnLimit - run.turn + 1} turns left to win</span>}
          <div className="m-hud__year"><b className="cl-display">{year}</b><GlossaryButton /><SettingsButton /></div>
          <div className="m-pips">{[1, 2, 3, 4].map(i => <span key={i} className={`round-pip ${i < run.round ? 'is-done' : ''} ${i === run.round ? 'is-now' : ''} ${i === 4 ? 'is-boss' : ''}`} />)}</div>
        </div>
        {capitalBox}
      </header>
      <main className="m-main">{threats}{middle}</main>
      <footer className="m-dock">
        <div className="m-actions">{ap}{researchBtn}{prompt}<button type="button" className={`cl-btn ph-end-m ${run.ap === 0 ? 'cl-btn--primary' : ''}`} onClick={endTurn}>End turn</button></div>
        <div className="m-hand ph-hand">{hand}</div>
      </footer>
    </div>
  )

  return (
    <div className="screen game ph" data-theme="victorian">
      <header className="game__head">
        <div>
          <span className="cl-label">Pharmaceutical · Stage 1 · {year}</span>
          <h1 className="cl-display game__title">Patent Medicines</h1>
        </div>
        <div className="game__meta">
          <div className="round-track" aria-label={`Round ${run.round} of 4`}>
            <span className="cl-label">Round {run.round} of 4 · Turn {run.turn}{late && <b className="cl-minus"> · {C.turnLimit - run.turn + 1} turns left to win</b>}</span>
            <div>{[1, 2, 3, 4].map(i => <span key={i} className={`round-pip ${i < run.round ? 'is-done' : ''} ${i === run.round ? 'is-now' : ''} ${i === 4 ? 'is-boss' : ''}`} />)}</div>
          </div>
          {capitalBox}
          <GlossaryButton /><SettingsButton />
        </div>
      </header>

      <div className="ph__grid">{threats}{middle}</div>

      <footer className="game__foot">
        <div className="action-strip">{ap}{researchBtn}{prompt}</div>
        <div className="hand-row">
          <div className="pile"><span className="pile__card cl-num">{run.draw.length}</span><span className="cl-label">Draw</span></div>
          <div className="hand ph-hand">{hand}</div>
          <div className="pile-col">
            <div className="pile"><span className="pile__card pile__card--discard cl-num">{run.discard.length}</span><span className="cl-label">Discard</span></div>
            <button type="button" className={`cl-btn end-turn ${run.ap === 0 ? 'cl-btn--primary' : ''}`} onClick={endTurn}>End turn</button>
          </div>
        </div>
      </footer>
    </div>
  )
}

function Spoils({ run, dispatch }: { run: PRun; dispatch: (a: PAction) => void }) {
  return (
    <div className="settings-wrap ph-overlay">
      <section className="settings ph-spoils" role="dialog" aria-label={`Round ${run.round} won`} data-theme="victorian">
        <span className="cl-label">Round {run.round} won</span>
        <h2 className="cl-display">Take a card</h2>
        <div className="ph-row">{run.spoils.map(k => <PCardView key={k} card={{ id: -1, key: k, uses: PCARDS[k].uses }} onClick={() => dispatch({ type: 'spoils', key: k })} />)}</div>
        <button type="button" className="cl-btn" onClick={() => dispatch({ type: 'spoils', key: null })}>Take {money(C.spoilsCash)} instead</button>
      </section>
    </div>
  )
}

function Shop({ run, dispatch }: { run: PRun; dispatch: (a: PAction) => void }) {
  const [destroying, setDestroying] = useState(false)
  const price = nextFactoryPrice(run)
  const deck = allCards(run)
  return (
    <div className="screen shop ph ph-shop" data-theme="victorian">
      <header className="game__head">
        <div><span className="cl-label">Pharmaceutical · After round {run.round}</span><h1 className="cl-display game__title">The Apothecary's Wholesaler</h1></div>
        <div className="shop__head-right">
          <div className="ph-capital"><span className="cl-label">Capital</span><b className="cl-num">{money(run.capital)}</b><span className="cl-num ph-capital__next">Trust {run.trust > 0 ? `+${run.trust}` : run.trust} · {run.gold} gold</span></div>
          <GlossaryButton /><SettingsButton />
          <button type="button" className="cl-btn cl-btn--primary ph-leave-top" onClick={() => dispatch({ type: 'leaveShop' })}>On to round {run.round + 1}</button>
        </div>
      </header>
      <section>
        <span className="cl-label">Cards</span>
        <div className="ph-row">
          {run.shop.cards.map((k, i) => k
            ? <PCardView key={i} card={{ id: -i - 1, key: k, uses: PCARDS[k].uses }} price={money(PCARDS[k].price ?? 0)} playable={run.capital >= (PCARDS[k].price ?? 0)} why={run.capital >= (PCARDS[k].price ?? 0) ? undefined : 'Too expensive'} onClick={() => dispatch({ type: 'buy', slot: i })} />
            : <div key={i} className="sold">Sold</div>)}
        </div>
      </section>
      <section className="ph-shop__extras">
        <div className="ph-factory">
          <img className="ph-factory__icon" src={iconUrl('factory')} alt="" />
          <b className="ph-factory__name">A new factory</b>
          <span className="res-note">You have {run.factories.length} of {C.maxFactories}. Each one runs one live remedy.</span>
          <button type="button" className="cl-btn cl-btn--primary" disabled={run.factories.length >= C.maxFactories || run.capital < price} onClick={() => dispatch({ type: 'buyFactory' })}>{run.factories.length >= C.maxFactories ? 'All built' : `Build · ${money(price)}`}</button>
        </div>
        <div className="ph-factory">
          <img className="ph-factory__icon" src={iconUrl('generic')} alt="" />
          <b className="ph-factory__name">Destroy a card</b>
          <span className="res-note">Generics {money(C.genericDestroy)}, as many as you like. Any other card {money(run.destroyCost)}, once a visit.</span>
          <button type="button" className="cl-btn" onClick={() => setDestroying(!destroying)}>{destroying ? 'Done' : 'Choose a card'}</button>
        </div>
        <div className="ph-factory fortune--skim">
          <img className="ph-factory__icon" src={iconUrl('charityGala')} alt="" />
          <b className="ph-factory__name">Your fortune · {run.gold} gold</b>
          <span className="res-note">Skim Capital into your own pocket at {money(skimRate(run))} a gold. Gold is your score.</span>
          <div className="skim-buttons">{[1, 2, 3].map(g => <button key={g} type="button" className="cl-btn cl-btn--skim" disabled={run.capital - g * skimRate(run) < 1} onClick={() => dispatch({ type: 'skim', gold: g })}>{g} gold · {money(g * skimRate(run))}</button>)}</div>
        </div>
      </section>
      <section>
        <span className="cl-label">Your cards · {deck.length}{destroying ? ' · tap a card to destroy it' : ''}</span>
        <div className="ph-row ph-row--wrap">
          {deck.map(c => {
            if (!destroying) return <PCardView key={c.id} card={c} />
            const cost = c.key === 'generic' ? C.genericDestroy : run.destroyCost
            const ok = run.capital >= cost && (c.key === 'generic' || !run.shop.destroyed)
            return <PCardView key={c.id} card={c} marked playable={ok} price={money(cost)} why={ok ? undefined : 'Not now'} onClick={() => dispatch({ type: 'destroy', cardId: c.id })} />
          })}
        </div>
      </section>
      <div className="ph-shop__foot"><span className="res-note">{run.round + 1 === 4 ? 'Next: the boss, The Great American Fraud.' : `Next: round ${run.round + 1}.`}</span><button type="button" className="cl-btn cl-btn--primary" onClick={() => dispatch({ type: 'leaveShop' })}>On to round {run.round + 1}</button></div>
    </div>
  )
}

function End({ run, onAgain, onMenu }: { run: PRun; onAgain: () => void; onMenu: () => void }) {
  const won = run.phase === 'won'
  const why = run.loss?.reason === 'disgraced' ? 'Trust fell to −6. Disgraced.' : run.loss?.reason === 'bankrupt' ? 'Capital ran out. Bankrupt.' : 'Out of time.'
  return (
    <div className="screen ph ph-end" data-theme="victorian">
      <span className="cl-label">Pharmaceutical · Stage 1 · Admin playtest</span>
      <h1 className="cl-display game__title">{won ? 'The Pure Food and Drug Act passes. You adapt.' : why}</h1>
      <p>{won ? `Stage 1 cleared with ${money(run.capital)} in Capital, ${run.gold} gold and Trust at ${run.trust}.` : `Lost in round ${run.round}, turn ${run.turn}, with ${run.gold} gold.`}</p>
      <p className="res-note">{run.stats.researched} researched · {run.stats.produced} produced · {money(run.stats.earned)} earned · {run.stats.settled} settled · {run.stats.deaths} {run.stats.deaths === 1 ? 'death' : 'deaths'}</p>
      <div className="ph-row"><button type="button" className="cl-btn cl-btn--primary" onClick={onAgain}>Play again</button><button type="button" className="cl-btn" onClick={onMenu}>Front page</button></div>
    </div>
  )
}

/** The whole Pharmaceutical run. Nothing is saved or recorded: it's an admin playtest. */
export function PharmaGame({ onMenu, initial }: { onMenu: () => void; initial?: PRun }) {
  const [run, setRun] = useState(() => initial ?? newPharmaRun(Math.floor(Math.random() * 2 ** 31)))
  const dispatch = (a: PAction) => setRun(r => pact(r, a))
  // patents go to the front-page total as each round ends (previews don't count)
  const sent = useRef(initial ? Infinity : 0)
  useEffect(() => {
    if (run.phase === 'turn' || run.phase === 'shop') return
    if (run.stats.patented > sent.current) { patented(run.stats.patented - sent.current); sent.current = run.stats.patented }
  }, [run.phase, run.stats.patented])
  useEffect(() => { findPharmaTerms(allCards(run).map(c => c.key)) }, [run.draw.length, run.discard.length, run.hand.length]) // eslint-disable-line react-hooks/exhaustive-deps
  if (run.phase === 'won' || run.phase === 'lost') return <End run={run} onAgain={() => setRun(newPharmaRun(Math.floor(Math.random() * 2 ** 31)))} onMenu={onMenu} />
  if (run.phase === 'shop') return <Shop run={run} dispatch={dispatch} />
  return <>{<Fight run={run} dispatch={dispatch} />}{run.phase === 'roundWon' && <Spoils run={run} dispatch={dispatch} />}</>
}
