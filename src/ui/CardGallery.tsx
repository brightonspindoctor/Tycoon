// ?preview=cards: every card at hand size and deck size, for checking card layout.
import { CARDS, type CardKey } from '../engine/data'
import { CardView } from './CardView'

export function CardGallery() {
  const keys = Object.keys(CARDS) as CardKey[]
  const cards = keys.map((key, i) => ({ id: i + 1, key, uses: CARDS[key].uses }))
  return (
    <div className="screen gallery" data-theme="victorian">
      <span className="cl-label">Hand size</span>
      <div className="gallery__row m-hand">{cards.map(c => <CardView key={c.id} card={c} />)}</div>
      <span className="cl-label">Deck size</span>
      <div className="gallery__row">{cards.map(c => <CardView key={c.id} card={c} small />)}</div>
    </div>
  )
}
