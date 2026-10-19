// Tap the draw (or discard) pile to see what's in it. Cards are grouped and sorted
// by name, so the view shows what's left without giving away the order.
import { CARDS } from '../engine/data'
import type { Card } from '../engine/engine'
import { CardView } from './CardView'

export function PileView({ title, cards, onClose }: { title: string; cards: Card[]; onClose: () => void }) {
  const groups = new Map<string, { card: Card; n: number }>()
  for (const c of cards) {
    const g = groups.get(c.key + ':' + c.uses)
    if (g) g.n++; else groups.set(c.key + ':' + c.uses, { card: c, n: 1 })
  }
  const list = [...groups.values()].sort((a, b) => CARDS[a.card.key].name.localeCompare(CARDS[b.card.key].name))
  return (
    <div className="pile-view-wrap" onClick={onClose}>
      <section className="pile-view" role="dialog" aria-label={title} onClick={e => e.stopPropagation()}>
        <header className="settings__head">
          <h2 className="cl-display">{title} · {cards.length} card{cards.length === 1 ? '' : 's'}</h2>
          <button type="button" className="cl-btn cl-btn--small" onClick={onClose}>Close</button>
        </header>
        {list.length === 0 ? <p className="res-note">Empty. Your discard pile is shuffled back in when you next draw.</p> : (
          <div className="pile-view__grid">
            {list.map(({ card, n }) => (
              <div key={card.id} className="pile-view__item">
                <CardView card={card} small playable />
                {n > 1 && <span className="pile-view__count cl-num">×{n}</span>}
              </div>
            ))}
          </div>
        )}
        <p className="res-note">Shown in name order, not the order you'll draw them.</p>
      </section>
    </div>
  )
}
