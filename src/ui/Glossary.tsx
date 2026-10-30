// The glossary: the five key words, the business terms you have found, and every card you have played.
// Opened from Settings, or straight from the board and the shop. Deadpan, no strategy.
import { useState } from 'react'
import { CONFIG } from '../engine/config'
import { CARDS, UPGRADES, type CardKey } from '../engine/data'
import { ERA_LABEL, units } from '../engine/format'
import { TERMS, loadFound } from '../terms'
import { loadPlayed } from '../cardbook'
import { play } from '../sound'
import { CardView } from './CardView'

const WORDS: [string, string][] = [
  ['Hold', "A liability's strength. Bring it to 0 to beat it."],
  ['Cover', 'Blocks money you would lose, one for one, until it is used up. It goes at the end of your turn unless an item keeps it.'],
  ['Gold', 'Your own fortune, kept apart from the company. Some liabilities take it; below 0 you are ruined. At the end of the game, your gold is your score.'],
  ['Capital', "The company's money. You pay for cards and losses with it. At $0, the company is bankrupt."],
  ['AP', `Action points. Most cards cost 1 AP to play. You get ${CONFIG.baseAP} a turn, more with some items.`],
]

type Tab = 'words' | 'business' | 'cards'
const ALL_CARDS = Object.keys(CARDS).length

export function Glossary({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<Tab>('words')
  const [open, setOpen] = useState<CardKey | null>(null)
  const found = loadFound().map(k => TERMS[k]).filter(Boolean) as NonNullable<(typeof TERMS)[keyof typeof TERMS]>[]
  const played = loadPlayed()
  const keys = (Object.keys(played) as CardKey[]).sort((a, b) => (CARDS[a].era ?? 1) - (CARDS[b].era ?? 1) || CARDS[a].name.localeCompare(CARDS[b].name))
  const eras = [...new Set(keys.map(k => CARDS[k].era ?? 1))]
  const pick = (t: Tab) => { play('click'); setTab(t); setOpen(null) }

  return (
    <div className="settings-wrap glossary-wrap" onClick={onClose}>
      <section className="settings glossary" role="dialog" aria-label="Glossary" onClick={e => e.stopPropagation()} data-theme="victorian">
        <header className="settings__head">
          <h2 className="cl-display">Glossary</h2>
          <button type="button" className="cl-btn cl-btn--small" onClick={onClose}>Close</button>
        </header>
        <div className="segmented glossary__tabs" role="tablist" aria-label="Glossary sections">
          <button type="button" role="tab" aria-selected={tab === 'words'} className={tab === 'words' ? 'is-on' : ''} onClick={() => pick('words')}>Words</button>
          <button type="button" role="tab" aria-selected={tab === 'business'} className={tab === 'business' ? 'is-on' : ''} onClick={() => pick('business')}>Terms · {found.length}</button>
          <button type="button" role="tab" aria-selected={tab === 'cards'} className={tab === 'cards' ? 'is-on' : ''} onClick={() => pick('cards')}>Cards · {keys.length}</button>
        </div>
        <div className="glossary__body">
          {tab === 'words' && <dl>{WORDS.map(([t, d]) => <div key={t} className="glossary__term"><dt>{t}</dt><dd>{d}</dd></div>)}</dl>}

          {tab === 'business' && (found.length ? <dl>{found.map(t => (
            <div key={t.term} className="glossary__term">
              <dt>{t.term}</dt><dd>{t.means}</dd>
              <dd className="glossary__real"><b>In the real world</b> {t.real}</dd>
            </div>
          ))}</dl> : <p className="res-note">More terms appear here as you buy cards.</p>)}

          {tab === 'cards' && !open && (keys.length ? <>
            <p className="res-note">Every card you have played: {keys.length} of {ALL_CARDS}. Tap one to read it.</p>
            {eras.map(e => (
              <section key={e} className="glossary__era" aria-label={`Cards from the ${ERA_LABEL[e]}`}>
                <span className="cl-label">{ERA_LABEL[e]}</span>
                <div className="glossary__cards">
                  {keys.filter(k => (CARDS[k].era ?? 1) === e).map((k, i) => (
                    <CardView key={k} card={{ id: -900 - i, key: k, uses: CARDS[k].uses }} small stage={e} onClick={() => { play('card'); setOpen(k) }} />
                  ))}
                </div>
              </section>
            ))}
          </> : <p className="res-note">Cards appear here once you have played them.</p>)}

          {tab === 'cards' && open && <CardPage k={open} times={played[open] ?? 0} onBack={() => { play('click'); setOpen(null) }} />}
        </div>
      </section>
    </div>
  )
}

/** One card, full size, with what it does and what it can become. */
function CardPage({ k, times, onBack }: { k: CardKey; times: number; onBack: () => void }) {
  const d = CARDS[k]
  const era = d.era ?? 1
  const up = UPGRADES[k]
  const term = TERMS[k] && loadFound().includes(k) ? TERMS[k] : null
  const uses = d.oncePerRound ? 'Once per fight' : d.uses === null ? 'Stays in your deck' : `${d.uses} use${d.uses === 1 ? '' : 's'}, then gone`
  const facts: [string, string][] = [
    ['Type', d.family],
    ['Cost', d.ap === null ? "Can't be played" : `${d.ap} AP${d.cost ? ` and ${units(`$${d.cost}`, era)}` : ''}${d.gold ? ` and ${d.gold} gold` : ''}`],
    ['Lasts', uses],
    ...(d.price ? [['In the shop', `${units(`$${d.price}`, era)}${d.rarity ? ` · ${d.rarity}` : ''}`] as [string, string]] : []),
    ...(up?.text ? [['Upgraded', units(up.text, era)] as [string, string]] : []),
    ['Played', `${times} time${times === 1 ? '' : 's'}`],
  ]
  return (
    <div className="glossary__card">
      <button type="button" className="cl-btn cl-btn--small glossary__back" onClick={onBack}>‹ All cards</button>
      <div className="glossary__card-row">
        <div className="glossary__card-face"><CardView card={{ id: -999, key: k, uses: d.uses }} stage={era} /></div>
        <dl className="glossary__facts">
          {facts.map(([t, v]) => <div key={t} className="glossary__term"><dt>{t}</dt><dd>{v}</dd></div>)}
        </dl>
      </div>
      {d.flavour && <p className="glossary__flavour">“{d.flavour}”</p>}
      {term && <div className="glossary__term"><dt>{term.term}</dt><dd>{term.means}</dd></div>}
    </div>
  )
}
