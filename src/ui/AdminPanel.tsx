// Admin mode: start a playtest run anywhere, and the in-run tools in Settings.
import { useState } from 'react'
import { ADMIN_DEFAULTS, type AdminStart } from '../engine/admin'
import { BONUSES, CARDS, type BonusKey, type CardKey } from '../engine/data'
import type { AdminOp } from '../engine/engine'
import { play } from '../sound'

const STARTS: { v: AdminStart['start']; label: string }[] = [
  { v: 'incorporate', label: 'Incorporation' }, { v: 1, label: 'Round 1' }, { v: 2, label: 'Round 2' }, { v: 3, label: 'Round 3' }, { v: 4, label: 'Boss' },
]

function Stepper({ label, value, min, max, step = 1, onChange }: { label: string; value: number; min: number; max: number; step?: number; onChange: (n: number) => void }) {
  return (
    <div className="admin__field">
      <span className="cl-label">{label}</span>
      <div className="admin__stepper">
        <button type="button" className="cl-btn cl-btn--small" disabled={value <= min} onClick={() => onChange(Math.max(min, value - step))} aria-label={`Less ${label}`}>−</button>
        <b className="cl-num">{value}</b>
        <button type="button" className="cl-btn cl-btn--small" disabled={value >= max} onClick={() => onChange(Math.min(max, value + step))} aria-label={`More ${label}`}>+</button>
      </div>
    </div>
  )
}

/** On the title screen: choose where to start and with what. */
export function AdminStartPanel({ onStart }: { onStart: (o: AdminStart) => void }) {
  const [o, setO] = useState<AdminStart>(ADMIN_DEFAULTS)
  const set = (p: Partial<AdminStart>) => setO({ ...o, ...p })
  const starts = (o.stage === 1 ? STARTS.filter(s => s.v !== 'incorporate') : STARTS).map(s => (s.v === 'incorporate' && o.stage === 3 ? { ...s, label: 'Multinational' } : s))
  return (
    <section className="admin" aria-label="Admin: jump in">
      <div className="admin__head"><span className="cl-label">Admin · jump in</span><span className="res-note">Not recorded in history.</span></div>
      <div className="segmented" role="radiogroup" aria-label="Stage">
        {([1, 2, 3] as const).map(s => <button key={s} type="button" role="radio" aria-checked={o.stage === s} className={o.stage === s ? 'is-on' : ''} onClick={() => set({ stage: s, start: s === 1 && o.start === 'incorporate' ? 1 : o.start })}>Stage {s}</button>)}
      </div>
      <div className="segmented admin__starts" role="radiogroup" aria-label="Start at">
        {starts.map(s => <button key={String(s.v)} type="button" role="radio" aria-checked={o.start === s.v} className={o.start === s.v ? 'is-on' : ''} onClick={() => set({ start: s.v })}>{s.label}</button>)}
      </div>
      <div className="admin__grid">
        <Stepper label={o.stage === 3 ? 'Rigs' : o.stage === 2 ? 'Fields' : 'Wells'} value={o.wells} min={0} max={5} onChange={n => set({ wells: n })} />
        <Stepper label={o.stage === 3 ? 'Capital ($M)' : o.stage === 2 ? 'Capital ($K)' : 'Capital ($)'} value={o.capital} min={5} max={100} step={5} onChange={n => set({ capital: n })} />
        <Stepper label="Gold" value={o.gold} min={0} max={20} onChange={n => set({ gold: n })} />
        {o.stage === 2 && <Stepper label="Exposure" value={o.exposure} min={0} max={7} onChange={n => set({ exposure: n })} />}
        {o.stage === 3 && <Stepper label="Heat" value={o.heat ?? 0} min={0} max={90} step={10} onChange={n => set({ heat: n })} />}
      </div>
      <div className="admin__row">
        <label className="cl-label" htmlFor="admin-bonus">Bonus</label>
        <select id="admin-bonus" className="admin__select" value={o.bonus} onChange={e => set({ bonus: e.target.value as BonusKey })}>
          {(Object.keys(BONUSES) as BonusKey[]).map(k => <option key={k} value={k}>{BONUSES[k].name}</option>)}
        </select>
        <div className="segmented" role="radiogroup" aria-label="Deck">
          {(['starter', 'strong'] as const).map(d => <button key={d} type="button" role="radio" aria-checked={o.deck === d} className={o.deck === d ? 'is-on' : ''} onClick={() => set({ deck: d })}>{d === 'starter' ? 'Starter deck' : 'Strong deck'}</button>)}
        </div>
      </div>
      <button type="button" className="cl-btn cl-btn--primary" onClick={() => { play('whistle'); onStart(o) }}>Start playtest</button>
    </section>
  )
}

/** In Settings during an admin run. */
export function AdminTools({ onAdmin, inTurn, stage }: { onAdmin: (op: AdminOp, card?: CardKey) => void; inTurn: boolean; stage: number }) {
  const [key, setKey] = useState<CardKey>('espionage')
  const keys = (Object.keys(CARDS) as CardKey[]).sort((a, b) => CARDS[a].name.localeCompare(CARDS[b].name))
  const go = (op: AdminOp, card?: CardKey) => { play('click'); onAdmin(op, card) }
  return (
    <div className="settings__row admin-tools">
      <span className="cl-label">Admin tools</span>
      <div className="admin-tools__buttons">
        <button type="button" className="cl-btn cl-btn--small" onClick={() => go('cash')}>+10 Capital</button>
        <button type="button" className="cl-btn cl-btn--small" onClick={() => go('gold')}>+1 gold</button>
        {stage === 2 && <button type="button" className="cl-btn cl-btn--small" onClick={() => go('exposureDown')}>Exposure −1</button>}
        {stage === 2 && <button type="button" className="cl-btn cl-btn--small" onClick={() => go('exposureUp')}>Exposure +1</button>}
        {stage === 3 && <button type="button" className="cl-btn cl-btn--small" onClick={() => go('heatDown')}>Heat −10</button>}
        {stage === 3 && <button type="button" className="cl-btn cl-btn--small" onClick={() => go('heatUp')}>Heat +10</button>}
        {inTurn && <button type="button" className="cl-btn cl-btn--small" onClick={() => go('ap')}>+1 AP</button>}
        {inTurn && <button type="button" className="cl-btn cl-btn--small" onClick={() => go('winRound')}>Win the round</button>}
      </div>
      <div className="admin__row">
        <select className="admin__select" value={key} onChange={e => setKey(e.target.value as CardKey)} aria-label="Card to add">
          {keys.map(k => <option key={k} value={k}>{CARDS[k].name}{CARDS[k].era === 2 ? ' (1900s)' : CARDS[k].era === 3 ? ' (1970s)' : ''}</option>)}
        </select>
        <button type="button" className="cl-btn cl-btn--small" onClick={() => go('addCard', key)}>Add to {inTurn ? 'hand' : 'deck'}</button>
      </div>
    </div>
  )
}
