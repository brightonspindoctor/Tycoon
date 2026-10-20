import { CARDS } from '../engine/data'
import { cardDef, type Card } from '../engine/engine'
import { ERA_LABEL, ERA_THEME, units } from '../engine/format'

interface Props {
  card: Card
  apCost?: number
  playable?: boolean
  why?: string
  selected?: boolean
  onClick?: () => void
  price?: string
  small?: boolean
  stage?: number // for the $ unit in the card text
  marked?: 'destroy' | 'upgrade' // a card you can choose for a destroy or an upgrade
}

export function CardView({ card, apCost, playable = true, why, selected, onClick, price, small, stage = 1, marked }: Props) {
  const d = cardDef(card)
  const era = d.era ?? 1 // a card keeps the look of the era it came from
  const cls = ['cl-card', 'card', d.forced ? 'cl-card--forced' : '', d.junk && !d.forced ? 'card--junk' : '', selected ? 'cl-card--selected' : '', playable ? 'card--playable' : 'card--dim', small ? 'card--small' : '', d.family === 'Skim' ? 'card--skim' : '', card.up ? 'card--up' : '', marked ? `card--${marked}` : '']
  const ap = apCost ?? d.ap
  // from stage 2 every Well pumps 1 and never runs dry, old Well cards included
  const builds = stage >= 2 && (card.key === 'well' || card.key === 'wildcat')
  const text = units(builds ? 'Build a Well: 1 oil a turn, never runs dry. Claims a plot if none is empty.' : d.text, stage)
  const base = CARDS[card.key].uses
  return (
    <button type="button" className={cls.filter(Boolean).join(' ')} data-theme={ERA_THEME[era] ?? 'victorian'} onClick={onClick}
      aria-label={`${d.name}${ap !== null ? `, costs ${ap} AP` : ''}. ${text}${why ? ` (${why})` : ''}`} title={why}>
      {d.forced && <span className="cl-stamp cl-stamp--loss card-stamp">Must play</span>}
      {card.up && !d.forced && <span className="card-up" aria-hidden="true">+</span>}
      {price && <span className="cl-tag card-price">{price}</span>}
      <div className="cl-card__top">
        <div className="cl-card__cost">{ap ?? '–'}</div>
        <div className="cl-card__name">{d.name}</div>
      </div>
      <div className="cl-card__art"><img src={`${import.meta.env.BASE_URL}art/icons/${d.icon}.png`} alt="" draggable={false} /></div>
      <div className="cl-card__band">{d.family}<span className="cl-card__era"> · {ERA_LABEL[era]}</span></div>
      <div className="cl-card__effect">{text}</div>
      <div className="cl-card__foot">
        <div className="cl-pips" aria-hidden="true">
          {d.oncePerRound ? <span className="cl-num card-once">1 / round</span> : card.uses === null ? <span className="cl-num">∞</span> : Array.from({ length: Math.max(card.uses, base ?? 0) }, (_, i) => <span key={i} className={`cl-pip ${i < card.uses! ? 'cl-pip--on' : ''}`} />)}
        </div>
        {why && !playable && why !== 'Not enough AP' && <span className="cl-label card-why">{why}</span>}
      </div>
    </button>
  )
}
