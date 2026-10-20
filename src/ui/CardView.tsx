import { CARDS } from '../engine/data'
import type { Card } from '../engine/engine'

interface Props {
  card: Card
  apCost?: number
  playable?: boolean
  why?: string
  selected?: boolean
  onClick?: () => void
  price?: string
  small?: boolean
}

export function CardView({ card, apCost, playable = true, why, selected, onClick, price, small }: Props) {
  const d = CARDS[card.key]
  const cls = ['cl-card', 'card', d.forced ? 'cl-card--forced' : '', d.junk && !d.forced ? 'card--junk' : '', selected ? 'cl-card--selected' : '', playable ? 'card--playable' : 'card--dim', small ? 'card--small' : '', d.family === 'Skim' ? 'card--skim' : '']
  const ap = apCost ?? d.ap
  return (
    <button type="button" className={cls.filter(Boolean).join(' ')} data-theme="victorian" onClick={onClick}
      aria-label={`${d.name}${ap !== null ? `, costs ${ap} AP` : ''}. ${d.text}${why ? ` (${why})` : ''}`} title={why}>
      {d.forced && <span className="cl-stamp cl-stamp--loss card-stamp">Must play</span>}
      {price && <span className="cl-tag card-price">{price}</span>}
      <div className="cl-card__top">
        <div className="cl-card__cost">{ap ?? '–'}</div>
        <div className="cl-card__name">{d.name}</div>
      </div>
      <div className="cl-card__art"><img src={`${import.meta.env.BASE_URL}art/icons/${d.icon}.png`} alt="" draggable={false} /></div>
      <div className="cl-card__band">{d.family}<span className="cl-card__era"> · 1860s</span></div>
      <div className="cl-card__effect">{d.text}</div>
      <div className="cl-card__foot">
        <div className="cl-pips" aria-hidden="true">
          {d.oncePerRound ? <span className="cl-num card-once">1 / round</span> : card.uses === null ? <span className="cl-num">∞</span> : Array.from({ length: Math.max(card.uses, d.uses ?? 0) }, (_, i) => <span key={i} className={`cl-pip ${i < card.uses! ? 'cl-pip--on' : ''}`} />)}
        </div>
        {why && !playable && why !== 'Not enough AP' && <span className="cl-label card-why">{why}</span>}
      </div>
    </button>
  )
}
