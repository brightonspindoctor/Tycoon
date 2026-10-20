// ?preview=cards: every card at hand size and deck size, then every upgrade, for checking card layout.
import { CARDS, UPGRADES, type CardKey } from '../engine/data'
import { CardView } from './CardView'

export function CardGallery() {
  const keys = Object.keys(CARDS) as CardKey[]
  const cards = keys.map((key, i) => ({ id: i + 1, key, uses: CARDS[key].uses }))
  const ups = (Object.keys(UPGRADES) as CardKey[]).map((key, i) => ({ id: 500 + i, key, uses: CARDS[key].uses, up: true }))
  return (
    <div className="screen gallery" data-theme="victorian">
      <span className="cl-label">Hand size</span>
      <div className="gallery__row m-hand">{cards.map(c => <CardView key={c.id} card={c} />)}</div>
      <span className="cl-label">Deck size</span>
      <div className="gallery__row">{cards.map(c => <CardView key={c.id} card={c} small />)}</div>
      <span className="cl-label">Upgraded · stage 2 units</span>
      <div className="gallery__row m-hand">{ups.map(c => <CardView key={c.id} card={c} stage={2} />)}</div>
    </div>
  )
}
