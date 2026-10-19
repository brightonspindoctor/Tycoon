import { useEffect, useState } from 'react'
import { type Run, snapshot } from '../engine/engine'
import { money, year } from '../engine/format'
import { play } from '../sound'

/** Counts a number from `from` to `to` over `ms`, starting after `delay`. */
export function useCountUp(from: number, to: number, ms = 900, delay = 0): number {
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

function Row({ label, from, to, delay, fmt }: { label: string; from: number; to: number; delay: number; fmt: (n: number) => string }) {
  const v = useCountUp(from, to, 900, delay)
  const diff = to - from
  return (
    <li className="summary__row" style={{ animationDelay: `${delay}ms` }}>
      <span>{label}</span>
      <span className="cl-num summary__from">{fmt(from)}</span>
      <span className="summary__arrow">→</span>
      <b className="cl-num">{fmt(v)}</b>
      <span className={`cl-num summary__diff ${diff < 0 ? 'cl-minus' : diff > 0 ? 'cl-plus' : ''}`}>{diff === 0 ? '—' : diff > 0 ? `+${fmt(diff)}` : `−${fmt(-diff)}`}</span>
    </li>
  )
}

export function RoundSummary({ run, onContinue }: { run: Run; onContinue: () => void }) {
  const a = run.roundStart
  const b = snapshot(run)
  const st = run.stage
  const fromYear = year(st, run.round)
  const toYear = year(st, run.round + 1)
  const y = useCountUp(fromYear, toYear, 1400, 200)
  useEffect(() => { play('win'); const t = setTimeout(() => play('ink'), 600); return () => clearTimeout(t) }, [])
  const m = (n: number) => money(n, st)
  return (
    <div className="overlay" role="dialog" aria-label={`Round ${run.round} complete`}>
      <div className="summary" data-theme="victorian">
        <span className="cl-label">Stage {st} · Round {run.round} complete</span>
        <div className="summary__year cl-display">{y}</div>
        <ul className="summary__rows">
          <Row label="Capital" from={a.capital} to={b.capital} delay={500} fmt={m} />
          <Row label="Your fortune (gold)" from={a.gold} to={b.gold} delay={800} fmt={n => `${n}`} />
          <Row label="Wells" from={a.wells} to={b.wells} delay={1100} fmt={n => `${n}`} />
          <Row label="Oil in stock" from={a.oil} to={b.oil} delay={1400} fmt={n => `${n}`} />
          <Row label="Cards in deck" from={a.deck} to={b.deck} delay={1700} fmt={n => `${n}`} />
        </ul>
        <button type="button" className="cl-btn cl-btn--primary summary__go" onClick={onContinue}>To the Land Office</button>
      </div>
    </div>
  )
}
