// A short glossary of the game's five key words, opened from Settings. Deadpan, no strategy.
import { CONFIG } from '../engine/config'
import { TERMS, loadFound } from '../terms'

const WORDS: [string, string][] = [
  ['Hold', "A liability's strength. Bring it to 0 to beat it."],
  ['Cover', 'Blocks money you would lose, one for one, until it is used up. It goes at the end of your turn unless an item keeps it.'],
  ['Gold', 'Your own fortune, kept apart from the company. Some liabilities take it; below 0 you are ruined. At the end of the game, your gold is your score.'],
  ['Capital', "The company's money. You pay for cards and losses with it. At $0, the company is bankrupt."],
  ['AP', `Action points. Most cards cost 1 AP to play. You get ${CONFIG.baseAP} a turn, more with some items.`],
]

export function Glossary({ onClose }: { onClose: () => void }) {
  const found = loadFound().map(k => TERMS[k]).filter(Boolean) as NonNullable<(typeof TERMS)[keyof typeof TERMS]>[]
  return (
    <div className="settings-wrap glossary-wrap" onClick={onClose}>
      <section className="settings glossary" role="dialog" aria-label="Glossary" onClick={e => e.stopPropagation()} data-theme="victorian">
        <header className="settings__head">
          <h2 className="cl-display">Glossary</h2>
          <button type="button" className="cl-btn cl-btn--small" onClick={onClose}>Close</button>
        </header>
        <div className="glossary__body">
          <dl>{WORDS.map(([t, d]) => <div key={t} className="glossary__term"><dt>{t}</dt><dd>{d}</dd></div>)}</dl>
          <section className="glossary__found" aria-label="Terms you have found">
            <h3 className="cl-label">The business</h3>
            {found.length ? <dl>{found.map(t => (
              <div key={t.term} className="glossary__term">
                <dt>{t.term}</dt><dd>{t.means}</dd>
                <dd className="glossary__real"><b>In the real world</b> {t.real}</dd>
              </div>
            ))}</dl> : <p className="res-note">More terms appear here as you buy cards.</p>}
          </section>
        </div>
      </section>
    </div>
  )
}
