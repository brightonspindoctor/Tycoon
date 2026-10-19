import { ROLE_LABEL, THREATS } from '../engine/data'
import { intent, intentText, type Run, type Threat } from '../engine/engine'

interface Props {
  run: Run
  threat: Threat
  targeting?: boolean
  damagePreview?: number
  onTarget?: () => void
}

export function ThreatPanel({ run, threat, targeting, damagePreview, onTarget }: Props) {
  const d = THREATS[threat.kind]
  const pct = Math.max(0, (threat.hold / threat.maxHold) * 100)
  const Tag = targeting ? 'button' : 'section'
  return (
    <Tag className={`threat ${threat.beaten ? 'threat--beaten' : ''} ${targeting ? 'threat--target' : ''}`} onClick={targeting ? onTarget : undefined}
      aria-label={`${d.name}, Hold ${threat.hold} of ${threat.maxHold}`}>
      <div className="threat__head">
        <img className="threat__portrait" src={`${import.meta.env.BASE_URL}art/enemies/${d.portrait}.jpg`} alt="" />
        <div className="threat__title">
          <span className="cl-label">{ROLE_LABEL[d.role]}{d.movesFirst ? ' · Moves first' : ''}</span>
          <h2 className="threat__name">{d.name}</h2>
          <div className="threat__hold">
            <span className="hold-bar"><span style={{ width: `${pct}%` }} /></span>
            <span className="cl-num">{Math.max(0, threat.hold)} / {threat.maxHold}</span>
          </div>
          {targeting && damagePreview !== undefined && <span className="cl-label threat__preview">{damagePreview > 0 ? `Deal ${damagePreview}` : 'No effect'}</span>}
        </div>
      </div>
      {threat.opened && run.turn === 1 && !threat.beaten && <div className="opened"><b>Opened with</b> {threat.opened}</div>}
      {threat.beaten ? <div className="warn warn--done">Beaten</div> : (
        <div className="warn">
          <b>Next · end of turn · {intent(run, threat)}</b>
          <span>{intentText(run, threat)}</span>
        </div>
      )}
      <dl className="threat__traits">
        {d.weak && <div><dt>Weak to:</dt><dd>{d.weak}</dd></div>}
        {d.resist && <div><dt>Resists:</dt><dd>{d.resist}</dd></div>}
        {d.immune && <div><dt>Immune to:</dt><dd>{d.immune}</dd></div>}
        {d.whenBeaten && <div><dt>When beaten:</dt><dd>{d.whenBeaten}</dd></div>}
      </dl>
    </Tag>
  )
}
