// Shown once, before your first run ever: the whole game in four lines.
import { useEffect, useState } from 'react'
import { play } from '../sound'

const LINES = ['Prospect fields.', 'Build wells.', 'Sell oil.', 'Grow your capital.']

export function Welcome({ onBegin }: { onBegin: () => void }) {
  const [shown, setShown] = useState(0)
  useEffect(() => {
    if (shown >= LINES.length) return
    const t = setTimeout(() => { setShown(n => n + 1); play('stamp') }, shown === 0 ? 450 : 700)
    return () => clearTimeout(t)
  }, [shown])
  const done = shown >= LINES.length
  return (
    <div className="screen welcome" data-theme="victorian" onClick={() => { if (!done) setShown(LINES.length) }}>
      <span className="cl-label">Oil · Pennsylvania · 1863</span>
      <ol className="welcome__lines">
        {LINES.map((l, i) => <li key={l} className={`cl-display ${i < shown ? 'is-in' : ''}`}><span className="welcome__no cl-num">{i + 1}</span>{l}</li>)}
      </ol>
      <button type="button" className={`cl-btn cl-btn--primary welcome__go ${done ? 'is-in' : ''}`} onClick={e => { e.stopPropagation(); play('click'); onBegin() }}>Begin</button>
    </div>
  )
}
