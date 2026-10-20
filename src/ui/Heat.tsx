// The stage 3 meter: how much attention the company draws, 0 to 100. Every AP spent adds 2.
// Climate Science and the Geneva Climate Summit add more; lobbying takes it down. At 100: broken up.
import { CONFIG } from '../engine/config'
import type { Run } from '../engine/engine'

export function HeatMeter({ run, compact, lit }: { run: Run; compact?: boolean; lit?: boolean }) {
  if (run.stage !== 3) return null
  const h = run.heat
  const high = h >= CONFIG.heatHigh
  const apLeft = Math.floor((CONFIG.heatMax - h - 1) / CONFIG.heatPerAP)
  return (
    <section className={`heat ${compact ? 'heat--compact' : ''} ${high ? 'is-high' : ''} ${lit ? 'is-acting' : ''}`} aria-label={`Heat ${h} of ${CONFIG.heatMax}`}>
      <div className="heat__head">
        <span className="cl-label">Heat</span>
        <b className="cl-num">{h} / {CONFIG.heatMax}</b>
      </div>
      <div className="heat__bar" aria-hidden="true">
        <span className="heat__fill" style={{ width: `${Math.min(100, (h / CONFIG.heatMax) * 100)}%` }} />
        <span className="heat__mark" style={{ left: `${(CONFIG.heatLow / CONFIG.heatMax) * 100}%` }} />
        <span className="heat__mark heat__mark--hot" style={{ left: `${(CONFIG.heatHigh / CONFIG.heatMax) * 100}%` }} />
      </div>
      {!compact && <span className="res-note">Every AP you spend: +{CONFIG.heatPerAP}. About {Math.max(0, apLeft)} AP left before you're broken up at {CONFIG.heatMax}. Lobbying cools it.</span>}
    </section>
  )
}
