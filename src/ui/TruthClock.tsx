// The stage 4 meter: the Truth clock, from 1 o'clock to midnight. Every enemy's 2nd and 5th
// moves move it on an hour, and the Truth's every 5th. Carbon Footprint and Net Zero wind it back.
import { CONFIG } from '../engine/config'
import { clockText, type Run } from '../engine/engine'

export function TruthClock({ run, compact, lit }: { run: Run; compact?: boolean; lit?: boolean }) {
  if (run.stage !== 4) return null
  const h = run.clock ?? CONFIG.clockStart
  const left = CONFIG.clockMax - h
  const late = left <= 3
  const size = compact ? 64 : 88
  // the wedge from midnight round to the hour shows how much of the day is gone
  const a = (h / 12) * 2 * Math.PI
  const x = 50 + 40 * Math.sin(a), y = 50 - 40 * Math.cos(a)
  const wedge = h >= 12 ? '' : `M50 50 L50 10 A40 40 0 ${h > 6 ? 1 : 0} 1 ${x.toFixed(2)} ${y.toFixed(2)} Z`
  return (
    <section className={`truth-clock ${compact ? 'truth-clock--compact' : ''} ${late ? 'is-late' : ''} ${lit ? 'is-acting' : ''}`} aria-label={`The Truth clock: ${clockText(h)}, ${left} hours to midnight`}>
      <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
        <circle className="truth-clock__face" cx="50" cy="50" r="46" />
        {wedge && <path className="truth-clock__spent" d={wedge} />}
        {Array.from({ length: 12 }, (_, i) => {
          const t = (i / 12) * 2 * Math.PI
          return <line key={i} className={`truth-clock__tick ${i === 0 ? 'truth-clock__tick--midnight' : ''}`}
            x1={50 + 38 * Math.sin(t)} y1={50 - 38 * Math.cos(t)} x2={50 + (i === 0 ? 30 : 33) * Math.sin(t)} y2={50 - (i === 0 ? 30 : 33) * Math.cos(t)} />
        })}
        <line className="truth-clock__minute" x1="50" y1="50" x2="50" y2="14" />
        <line className="truth-clock__hand" x1="50" y1="50" x2="50" y2="24" style={{ transform: `rotate(${h * 30}deg)` }} />
        <circle className="truth-clock__pin" cx="50" cy="50" r="4" />
      </svg>
      <div className="truth-clock__text">
        <span className="cl-label">The Truth clock</span>
        <b className="cl-num">{h >= CONFIG.clockMax ? 'Midnight' : `${h} o'clock`}</b>
        <span className="res-note">{h >= CONFIG.clockMax ? 'The Truth is out.' : `${left} hour${left === 1 ? '' : 's'} to midnight.${compact ? '' : ' Every liability\'s 2nd and 5th moves move it on.'}`}</span>
      </div>
    </section>
  )
}
