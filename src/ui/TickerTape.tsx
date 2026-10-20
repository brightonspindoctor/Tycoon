// The enemy turn, played back one event at a time on a strip of ticker tape.
// Each line types out, the thing it's about lights up on the board, then the
// tape feeds on. Tap to hurry it along; Skip jumps to your turn.
import { useEffect, useRef, useState } from 'react'
import type { Beat } from '../engine/engine'
import { play, type Cue } from '../sound'
import type { Replay } from '../storage'

const CUE: Record<Beat['kind'], Cue | null> = { enemy: 'ticker', fire: 'fire', money: 'hit', cards: 'ticker', shuffle: 'shuffle', oil: 'ink', info: 'click' }

interface Props { beats: Beat[]; speed: Replay; onBeat: (b: Beat | null) => void; onDone: () => void }

export function TickerTape({ beats, speed, onBeat, onDone }: Props) {
  const [i, setI] = useState(0)
  const [typed, setTyped] = useState(0)
  const fast = speed === 'fast'
  const b = beats[i]
  const full = b ? b.text.length : 0
  const finished = useRef(false)

  function finish() { if (finished.current) return; finished.current = true; onBeat(null); onDone() }
  function advance() {
    if (typed < full) { setTyped(full); return } // first tap: finish the line
    if (i + 1 >= beats.length) finish()
    else { setI(i + 1); setTyped(0) }
  }

  // announce the beat, with its sound
  useEffect(() => {
    if (!b) { finish(); return }
    onBeat(b)
    const cue = b.kind === 'money' && !b.text.includes('−') ? 'coin' : CUE[b.kind]
    if (cue) play(cue)
  }, [i]) // eslint-disable-line react-hooks/exhaustive-deps

  // type the line, hold it, then feed on
  useEffect(() => {
    if (!b) return
    if (typed < full) {
      const step = fast ? 3 : 1
      const t = setTimeout(() => setTyped(n => Math.min(full, n + step)), fast ? 10 : 18)
      return () => clearTimeout(t)
    }
    const hold = (b.kind === 'shuffle' ? 1100 : b.kind === 'info' ? 700 : 900) * (fast ? 0.45 : 1)
    const t = setTimeout(advance, hold)
    return () => clearTimeout(t)
  }, [typed, i]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!b) return null
  return (
    <div className="tape-wrap" onClick={advance} role="status" aria-live="polite">
      <div className="tape" key={i}>
        <span className={`tape__stamp tape__stamp--${b.kind}`}>{b.title}</span>
        <span className="tape__text">{b.text.slice(0, typed)}<span className="tape__caret" /></span>
        {b.kind === 'shuffle' && <Riffle />}
      </div>
      <div className="tape__foot">
        <span className="cl-num">{i + 1} / {beats.length}</span>
        <span className="tape__hint">Tap to hurry</span>
        <button type="button" className="cl-btn cl-btn--small" onClick={e => { e.stopPropagation(); finish() }}>Skip ›</button>
      </div>
    </div>
  )
}

/** Two half-decks riffled together and squared up. */
function Riffle() {
  return (
    <span className="riffle" aria-hidden="true">
      {Array.from({ length: 10 }, (_, k) => <span key={k} className={`riffle__card riffle__card--${k % 2 ? 'r' : 'l'}`} style={{ animationDelay: `${120 + k * 55}ms`, zIndex: k }} />)}
    </span>
  )
}
