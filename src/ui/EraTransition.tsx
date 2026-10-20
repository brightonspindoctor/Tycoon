// Between stages: the old era's ledger page lifts away to reveal the new one, the
// year rolls on and the company is stamped. Tap to skip.
import { useEffect, useState } from 'react'
import { ERA_THEME, year } from '../engine/format'
import { play } from '../sound'

const LINES: Record<number, string[]> = {
  2: ['The Baron is finished.', 'His fields are yours.', 'Now you answer to a board.'],
  3: ['The board is yours.', 'The oil is offshore.', 'The whole world is watching.'],
}
const STAMP: Record<number, string> = { 2: 'INCORPORATED', 3: 'MULTINATIONAL' }

export function EraTransition({ to, onDone }: { to: number; onDone: () => void }) {
  const from = to - 1
  const fromYear = year(from, 4), toYear = year(to, 1)
  const [y, setY] = useState(fromYear)
  const [stamped, setStamped] = useState(false)
  useEffect(() => {
    const t0 = performance.now() + 900
    let raf = 0
    const tick = (now: number) => {
      const t = Math.min(1, Math.max(0, (now - t0) / 1300))
      setY(Math.round(fromYear + (toYear - fromYear) * (1 - Math.pow(1 - t, 3))))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    const s = setTimeout(() => { setStamped(true); play('stamp') }, 2400)
    const d = setTimeout(onDone, 3900)
    play('whistle')
    return () => { cancelAnimationFrame(raf); clearTimeout(s); clearTimeout(d) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="era-trans" role="dialog" aria-label={`Into ${toYear}`} onClick={onDone}>
      <div className="era-trans__new" data-theme={ERA_THEME[to]} />
      <div className="era-trans__old" data-theme={ERA_THEME[from]} />
      <div className="era-trans__copy" data-theme={ERA_THEME[to]}>
        <div className="cl-display era-trans__year">{y}</div>
        {(LINES[to] ?? []).map((l, i) => <p key={l} className="era-trans__line" style={{ animationDelay: `${1200 + i * 450}ms` }}>{l}</p>)}
        {stamped && <span className="stamp-big stamp-big--win era-trans__stamp">{STAMP[to] ?? `STAGE ${to}`}</span>}
        <span className="cl-label era-trans__skip">Tap to skip</span>
      </div>
    </div>
  )
}
