import { useEffect, useState } from 'react'
import { type Action, type Run, snapshot } from '../engine/engine'
import { CARDS } from '../engine/data'
import { CONFIG } from '../engine/config'
import { CardView } from './CardView'
import { ERA_THEME, SHOP_NAME, money, year } from '../engine/format'
import { play } from '../sound'

/** Counts a number from `from` to `to` over `ms`, starting after `delay`. */
function useCountUp(from: number, to: number, ms = 900, delay = 0): number {
  const [v, setV] = useState(from)
  useEffect(() => {
    let raf = 0
    const start = performance.now() + delay
    const tick = (now: number) => {
      const t = Math.min(1, Math.max(0, (now - start) / ms))
      setV(Math.round(from + (to - from) * (1 - Math.pow(1 - t, 3))))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [from, to, ms, delay])
  return v
}

function Row({ label, from, to, delay, fmt, diffFmt = fmt, worseUp = false }: { label: string; from: number; to: number; delay: number; fmt: (n: number) => string; diffFmt?: (n: number) => string; worseUp?: boolean }) {
  const v = useCountUp(from, to, 900, delay)
  const diff = to - from
  const good = worseUp ? diff < 0 : diff > 0 // for Exposure, down is good
  return (
    <li className="summary__row" style={{ animationDelay: `${delay}ms` }}>
      <span>{label}</span>
      <span className="cl-num summary__from">{fmt(from)}</span>
      <span className="summary__arrow">→</span>
      <b className="cl-num">{fmt(v)}</b>
      <span className={`cl-num summary__diff ${diff === 0 ? '' : good ? 'cl-plus' : 'cl-minus'}`}>{diff === 0 ? '—' : diff > 0 ? `+${diffFmt(diff)}` : `−${diffFmt(-diff)}`}</span>
    </li>
  )
}

export function RoundSummary({ run, onContinue, dispatch }: { run: Run; onContinue: () => void; dispatch: (a: Action) => void }) {
  const [offered] = useState(run.spoils) // the card shown, kept after the choice is made
  const [choice, setChoice] = useState<'took' | 'sold' | null>(null)
  const a = run.roundStart
  const b = snapshot(run)
  const st = run.stage
  const fromYear = year(st, run.round)
  const toYear = year(st, run.round + 1)
  const y = useCountUp(fromYear, toYear, 1400, 200)
  useEffect(() => { play('register') }, [])
  const m = (n: number) => money(n, st)
  return (
    <div className="overlay" role="dialog" aria-label={`Round ${run.round} complete`}>
      <div className="summary" data-theme={ERA_THEME[st] ?? 'victorian'}>
        <span className="cl-label">Stage {st} · Round {run.round} complete</span>
        <div className="summary__year cl-display">{y}</div>
        <ul className="summary__rows">
          <Row label="Capital" from={a.capital} to={b.capital} delay={500} fmt={m} />
          <Row label="Your fortune (gold)" from={a.gold} to={b.gold} delay={800} fmt={n => `${n}`} />
          <Row label={st >= 2 ? 'Wells and Fields' : 'Wells'} from={a.wells} to={b.wells} delay={1100} fmt={n => `${n}`} />
          <Row label="Oil in stock" from={a.oil} to={b.oil} delay={1400} fmt={n => `${n}`} />
          <Row label="Cards in deck" from={a.deck} to={b.deck} delay={1700} fmt={n => `${n}`} />
          {st >= 2 && <Row label="Board Exposure" from={a.exposure} to={b.exposure} delay={2000} fmt={n => `${n}/${CONFIG.exposureMax}`} diffFmt={n => `${n}`} worseUp />}
        </ul>
        {offered && (
          <section className="spoils" aria-label="Spoils">
            <CardView card={{ id: -50, key: offered, uses: CARDS[offered].uses }} playable small stage={st} />
            <div className="spoils__side">
              <span className="cl-label">Spoils of the round</span>
              {choice === null ? <>
                <p>Take this card into your deck, or turn it down for {m(CONFIG.spoilsCash)}.</p>
                <div className="spoils__buttons">
                  <button type="button" className="cl-btn cl-btn--primary" onClick={() => { dispatch({ type: 'takeSpoils' }); setChoice('took'); play('card') }}>Take it</button>
                  <button type="button" className="cl-btn" onClick={() => { dispatch({ type: 'sellSpoils' }); setChoice('sold'); play('coin') }}>Turn it down · {m(CONFIG.spoilsCash)}</button>
                </div>
              </> : <p className="spoils__done">{choice === 'took' ? `${CARDS[offered].name} is in your deck.` : `Turned down. ${m(CONFIG.spoilsCash)} to the company.`}</p>}
            </div>
          </section>
        )}
        <button type="button" className="cl-btn cl-btn--primary summary__go" disabled={!!offered && choice === null} onClick={onContinue}>To {SHOP_NAME[st] ?? SHOP_NAME[2]}</button>
      </div>
    </div>
  )
}
