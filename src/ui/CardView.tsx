import { useLayoutEffect, useRef } from 'react'
import { CONFIG } from '../engine/config'
import { CARDS } from '../engine/data'
import { cardDef, type Card } from '../engine/engine'
import { ERA_LABEL, ERA_THEME, units } from '../engine/format'
import { iconUrl } from './icons'

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
  const cls = ['cl-card', 'card', card.faded ? 'card--faded' : '', d.forced ? 'cl-card--forced' : '', d.junk && !d.forced ? 'card--junk' : '', selected ? 'cl-card--selected' : '', playable ? 'card--playable' : 'card--dim', small ? 'card--small' : '', d.family === 'Skim' ? 'card--skim' : '', card.up ? 'card--up' : '', marked ? `card--${marked}` : '']
  const ap = apCost ?? d.ap
  // from stage 2 every Well pumps 1 and never runs dry, old Well cards included
  const builds = stage >= 2 && (card.key === 'well' || card.key === 'wildcat')
  // there's no board in stage 3: cards from the 1900s stop mentioning it
  // ...and from stage 4, Heat is worth nothing, so they stop mentioning that too
  const plain = (t: string) => {
    let x = stage >= 3 ? t.replace(/ ?[+−]\d Board Exposure\./g, '').replace(/ The board never sees it\./, '') : t
    if (stage >= 4) x = x.replace(/ ?[+−]\d+ Heat\./g, '').replace(/ Blocks Heat too\./, '').replace(/ Scandal \+\d+ Hold\./, '').trim()
    if (stage >= 4 && /^(Pay \$\d+[KMB]?\.)?$/.test(x)) x = `${x} Does nothing now.`.trim()
    return x
  }
  const text = plain(units(builds ? (stage >= 3 ? `Build a Rig: ${CONFIG.rigOutput} oil a turn, never dry.` : 'Build a Well: 1 oil a turn, never dry.') : d.text, stage))
  const base = CARDS[card.key].uses
  // a long text steps its font down until it fits the card's fixed text box
  const effect = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const el = effect.current
    if (!el) return
    el.style.fontSize = ''; el.style.lineHeight = ''
    // the mobile hand keeps a minimum of art and lets the text step down until the card holds it all
    const box = el.closest('.m-hand') ? el.closest('.card') as HTMLElement | null : null
    const over = () => (box ? box.scrollHeight > box.clientHeight + 1 : el.scrollHeight > el.clientHeight + 1)
    let size = parseFloat(getComputedStyle(el).fontSize)
    const floor = small ? 8 : box ? 9 : 10.5
    while (over() && size > floor) {
      size -= 0.5
      el.style.fontSize = `${size}px`; el.style.lineHeight = `${Math.round(size * 1.28)}px`
    }
  }, [text, small])
  return (
    <button type="button" className={cls.filter(Boolean).join(' ')} data-theme={ERA_THEME[era] ?? 'victorian'} onClick={onClick}
      aria-label={`${d.name}${ap !== null ? `, costs ${ap} AP` : ''}. ${text}${why ? ` (${why})` : ''}`} title={why}>
      {d.forced && <span className="cl-stamp cl-stamp--loss card-stamp">Must play</span>}
      {card.up && !d.forced && <span className="card-up" aria-hidden="true">+</span>}
      {card.faded && <span className="cl-stamp cl-stamp--muted card-stamp card-stamp--faded">Faded</span>}
      {price && <span className="cl-tag card-price">{price}</span>}
      <div className="cl-card__top">
        <div className="cl-card__cost">{ap ?? '–'}</div>
        <div className="cl-card__name">{d.name}</div>
      </div>
      <div className="cl-card__art"><img src={iconUrl(d.icon)} alt="" draggable={false} /></div>
      <div className="cl-card__band">{d.family}<span className="cl-card__era"> · {ERA_LABEL[era]}</span></div>
      <div className="cl-card__effect" ref={effect}>{text}</div>
      <div className="cl-card__foot">
        <div className="cl-pips" aria-hidden="true">
          {d.oncePerRound ? <span className="cl-num card-once">1 / round</span> : card.uses === null ? <span className="cl-num">∞</span> : Array.from({ length: Math.max(card.uses, base ?? 0) }, (_, i) => <span key={i} className={`cl-pip ${i < card.uses! ? 'cl-pip--on' : ''}`} />)}
        </div>
        {why && !playable && why !== 'Not enough AP' && <span className="cl-label card-why">{why}</span>}
      </div>
    </button>
  )
}
