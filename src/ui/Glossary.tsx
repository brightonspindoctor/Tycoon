// A short glossary of the game's five key words, opened from Settings. Deadpan, no strategy.
import { CONFIG } from '../engine/config'

const TERMS: [string, string][] = [
  ['Hold', "An enemy's strength. Bring it to 0 to beat it."],
  ['Cover', 'Blocks money you would lose, one for one, until it is used up. It goes at the end of your turn unless an item keeps it.'],
  ['Gold', 'Your own fortune, kept apart from the company. Some enemies take it; below 0 you are ruined. At the end of the game, your gold is your score.'],
  ['Capital', "The company's money. You pay for cards and losses with it. At $0, the company is bankrupt."],
  ['AP', `Action points. Most cards cost 1 AP to play. You get ${CONFIG.baseAP} a turn, more with some items.`],
]

export function Glossary({ onClose }: { onClose: () => void }) {
  return (
    <div className="settings-wrap glossary-wrap" onClick={onClose}>
      <section className="settings glossary" role="dialog" aria-label="Glossary" onClick={e => e.stopPropagation()} data-theme="victorian">
        <header className="settings__head">
          <h2 className="cl-display">Glossary</h2>
          <button type="button" className="cl-btn cl-btn--small" onClick={onClose}>Close</button>
        </header>
        <div className="glossary__body">
          <dl>{TERMS.map(([t, d]) => <div key={t} className="glossary__term"><dt>{t}</dt><dd>{d}</dd></div>)}</dl>
        </div>
      </section>
    </div>
  )
}
