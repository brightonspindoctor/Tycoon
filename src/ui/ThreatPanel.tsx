import { ROLE_LABEL, THREATS } from '../engine/data'
import { infiltrated, intent, intentText, phaseName, weakOf, type Run, type Threat } from '../engine/engine'
import { TRUTH_PHASES } from '../engine/data'
import { units } from '../engine/format'
import { Portrait } from './Portrait'

interface Props {
  run: Run
  threat: Threat
  targeting?: boolean
  acting?: boolean
  preview?: string
  onTarget?: () => void
  onAdminHit?: () => void // admin runs: −20 Hold, 0 AP
}

export function ThreatPanel({ run, threat, targeting, acting, preview, onTarget, onAdminHit }: Props) {
  const d = THREATS[threat.kind]
  const pct = Math.max(0, (threat.hold / threat.maxHold) * 100)
  const Tag = targeting ? 'button' : 'section'
  return (
    <Tag className={`threat ${threat.beaten ? 'threat--beaten' : ''} ${targeting ? 'threat--target' : ''} ${acting ? 'is-acting' : ''}`} onClick={targeting ? onTarget : undefined}
      aria-label={`${d.name}, Hold ${threat.hold} of ${threat.maxHold}`}>
      <div className="threat__head">
        <Portrait className="threat__portrait" name={d.name} portrait={d.portrait} />
        <div className="threat__title">
          <span className="cl-label">{ROLE_LABEL[d.role]}{d.movesFirst ? ' · Moves first' : ''}</span>
          <h2 className="threat__name">{d.name}</h2>
          {threat.kind === 'truth' && <span className="truth-phase cl-label" aria-label={`Phase ${(threat.phase ?? 0) + 1} of 4: ${phaseName(threat)}`}>
            {TRUTH_PHASES.map((_, i) => <i key={i} className={i < (threat.phase ?? 0) ? 'is-done' : i === (threat.phase ?? 0) ? 'is-now' : ''} />)} {phaseName(threat)}
          </span>}
          <div className="threat__hold">
            <span className="hold-bar"><span style={{ width: `${pct}%` }} /></span>
            <span className="cl-num">{Math.max(0, threat.hold)} / {threat.maxHold}</span>
            {!!threat.cover && !threat.beaten && <span className="enemy-cover cl-num" title="Blocks this much of your damage this turn">Cover {threat.cover}</span>}
          </div>
          {targeting && preview && <span className="cl-label threat__preview">{preview}</span>}
        </div>
      </div>
      {threat.opened && run.turn === 1 && !threat.beaten && <div className="opened"><b>Opened with</b> {units(threat.opened, run.stage)}</div>}
      {!threat.beaten && (n => n.length ? <div className="opened infiltrated"><b>Infiltrated</b> −{n.join(', then −')} Hold as your turns end</div> : null)(infiltrated(run, threat))}
      {threat.beaten ? <div className="warn warn--done">Beaten</div> : threat.stopped ? (
        <div className="warn warn--stopped">
          <b>Stopped this turn · {intent(run, threat)}</b>
          <span><s>{units(intentText(run, threat), run.stage)}</s></span>
        </div>
      ) : (
        <div className="warn">
          <b>Next · end of turn · {intent(run, threat)}</b>
          <span>{units(intentText(run, threat), run.stage)}</span>
        </div>
      )}
      {onAdminHit && !threat.beaten && <button type="button" className="cl-btn cl-btn--small admin-hit" onClick={e => { e.stopPropagation(); onAdminHit() }}>Admin · −20 Hold</button>}
      <dl className="threat__traits">
        {weakOf(threat.kind, threat.phase) && <div><dt>Weak to:</dt><dd>{weakOf(threat.kind, threat.phase)}</dd></div>}
        {d.resist && <div><dt>Resists:</dt><dd>{d.resist}</dd></div>}
        {d.immune && <div><dt>Immune to:</dt><dd>{d.immune}</dd></div>}
      </dl>
    </Tag>
  )
}
