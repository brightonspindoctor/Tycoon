// The stage 2 meter: how much the board suspects you. High from 5; at 8 you're ousted.
import { CONFIG } from '../engine/config'
import type { Run } from '../engine/engine'

export function ExposureMeter({ run, compact, lit }: { run: Run; compact?: boolean; lit?: boolean }) {
  if (run.stage < 2) return null
  const e = run.exposure
  const high = e >= CONFIG.exposureHigh
  return (
    <section className={`exposure ${compact ? 'exposure--compact' : ''} ${high ? 'is-high' : ''} ${lit ? 'is-acting' : ''}`} aria-label={`Board Exposure ${e} of ${CONFIG.exposureMax}`}>
      <div className="exposure__head">
        <span className="cl-label">Board Exposure</span>
        <b className="cl-num">{e} / {CONFIG.exposureMax}</b>
      </div>
      <div className="exposure__bar" aria-hidden="true">
        {Array.from({ length: CONFIG.exposureMax }, (_, i) => (
          <span key={i} className={`seg ${i < e ? 'is-on' : ''} ${i >= CONFIG.exposureHigh - 1 ? 'is-hot' : ''} ${i === CONFIG.exposureMax - 1 ? 'is-last' : ''}`} />
        ))}
      </div>
      {!compact && <span className="res-note">{high ? 'High: the board is circling.' : 'Skimming raises it. Dividends and a good round lower it.'} Ousted at {CONFIG.exposureMax}.</span>}
    </section>
  )
}
