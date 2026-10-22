// A plain glossary of the game's words, opened from Settings. Short, deadpan, no hints about strategy.
import { CONFIG } from '../engine/config'

const SECTIONS: { title: string; terms: [string, string][] }[] = [
  { title: 'Your turn', terms: [
    ['Capital', "The company's money. You pay for cards and losses with it. At $0, the company is bankrupt."],
    ['AP', `Action points. Most cards cost 1 AP to play. You get ${CONFIG.baseAP} a turn, more with some items.`],
    ['End turn', 'Your unplayed cards go to the discard pile, the enemies make their moves, and you draw a new hand.'],
    ['Turn limit', `Win a round within ${CONFIG.turnLimit} turns, or the investors lose patience.`],
  ] },
  { title: 'Enemies', terms: [
    ['Hold', "An enemy's strength. Bring it to 0 to beat it."],
    ['Next move', 'What the enemy will do at the end of your turn. Moves repeat in a cycle.'],
    ['Weak to', 'Cards of this type do double damage.'],
    ['Resists', 'Cards of this type do half damage.'],
    ['Immune to', 'Cards of this type do nothing.'],
    ['Enemy Cover', 'Blocks that much of your damage this turn. It comes back every turn.'],
    ['Block', 'Shore Up and Security Detail stop an enemy\'s next move. Each copy works once a round.'],
    ['Boss', 'The last fight of each stage.'],
  ] },
  { title: 'Damage types', terms: [
    ['Legal', 'Lawyers, patents, buy-outs.'],
    ['Dirty', 'Muscle, sabotage, bribes.'],
    ['Bury', 'Making evidence disappear. From stage 3.'],
    ['Lobby', 'Politicians and the press. From stage 3.'],
  ] },
  { title: 'Cover and losses', terms: [
    ['Cover', 'Blocks money you would lose, one for one, until it is used up. It goes at the end of your turn unless an item keeps it.'],
    ['Fines and losses', 'Money enemies take at the end of your turn, after your Cover.'],
  ] },
  { title: 'Your deck', terms: [
    ['Draw pile and discard pile', 'You draw from the draw pile. When it runs out, the discard pile is shuffled into it.'],
    ['Must play', 'You have to play this before anything else. If you don\'t, it still costs you at the end of the turn.'],
    ['Junk', 'Cards that do nothing useful. Enemies put them in your deck or hand.'],
    ['Uses', 'Some cards can be played only so many times, then they are gone. ∞ means they stay.'],
    ['Once per round', 'After it is played, it sits out until the next round.'],
    ['Upgrade', 'A stronger version of a card, marked +. From stage 2. In stages 3 and 4, a card can be upgraded twice.'],
    ['Destroy', 'Removes a card from your deck for good.'],
    ['Duplicate', 'A second copy of a card, upgrade and all.'],
  ] },
  { title: 'Oil', terms: [
    ['Wells, Fields and Rigs', `They pump oil every turn. Stage 1 Wells run dry; Fields (stage 2) and Rigs (stages 3 and 4) never do. You have ${CONFIG.maxPlots} plots at most.`],
    ['Stockpile and storage', 'Oil waits in your stockpile until you sell it. Anything over your storage is lost.'],
    ['Sell oil', 'Sells the whole stockpile at the oil price. From stage 3 it costs 2 AP.'],
    ['Oil price', 'What each barrel sells for. Enemies and modifiers push it up or down.'],
    ['Fire', 'Stops your pumps and burns stored oil, then Wells. Put it out with water cards, or a Firebreak.'],
  ] },
  { title: 'The shop', terms: [
    ['Items', 'Bought once, they work every turn without being played.'],
    ['Spoils', 'After a round, a card to take or turn down for cash.'],
    ['Modifier', 'A rule for the round, such as a cheaper oil price.'],
    ['Bank Debt', 'Paid every turn while you have a loan.'],
  ] },
  { title: 'Stage by stage', terms: [
    ['Board Exposure (stage 2)', `How much the board suspects you, 0 to ${CONFIG.exposureMax}. At ${CONFIG.exposureMax}, you are voted out.`],
    ['Heat (stage 3)', `Public and government attention, 0 to ${CONFIG.heatMax}. Every AP you spend adds ${CONFIG.heatPerAP}. At ${CONFIG.heatMax}, the company is broken up.`],
    ['The Truth clock (stage 4)', "Starts at 1 o'clock. Every enemy's 2nd and 5th moves move it on an hour. At midnight, the run is over."],
    ['Residue', 'How you leave a stage\'s meter leaves an item behind for the next stage.'],
  ] },
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
          {SECTIONS.map(s => (
            <section key={s.title} className="glossary__section">
              <h3 className="cl-label">{s.title}</h3>
              <dl>{s.terms.map(([t, d]) => <div key={t} className="glossary__term"><dt>{t}</dt><dd>{d}</dd></div>)}</dl>
            </section>
          ))}
        </div>
      </section>
    </div>
  )
}
