// The enemy turn, played back one event at a time, the way news arrived in each era:
// ticker tape (stage 1), silent-film intertitles (stage 2), a telex printout (stage 3)
// and phone notifications (stage 4). The thing each line is about lights up on the
// board. Tap to hurry it along.
import { useEffect, useRef, useState } from 'react'
import type { Beat } from '../engine/engine'
import { play, type Cue } from '../sound'
import type { Replay } from '../storage'

const CUE: Record<Beat['kind'], Cue | null> = { enemy: 'ticker', fire: 'fire', money: 'hit', cards: 'ticker', shuffle: 'shuffle', oil: 'ink', info: 'click', board: 'stamp', gold: 'hit' }

interface Props { beats: Beat[]; speed: Replay; stage?: number; onBeat: (b: Beat | null) => void; onDone: () => void }

/** The sound for a line of the tape: what happened, then the era's own enemy-turn sound. */
function cueFor(b: Beat, stage: number): Cue | null {
  if (b.title === 'The Truth clock' || /the clock moves on/.test(b.text)) return /goes back|doesn't move/.test(b.text) ? 'rewind' : 'tick'
  if (/· Impressed$/.test(b.title)) return 'register' // the Bank Inspector likes what he sees
  if (/gold from your fortune/.test(b.text)) return 'goldLoss'
  if (/\+\d+ Hold|Regains \d+ Hold/.test(b.text)) return 'heal'
  if (b.kind === 'cards') return 'junk'
  if (b.kind === 'money' && !b.text.includes('−')) return 'coin'
  if (b.kind === 'enemy') return stage >= 4 ? 'ping' : stage === 3 ? 'telex' : stage === 2 ? 'reel' : 'ticker'
  return CUE[b.kind]
}

export function TickerTape({ beats, speed, stage = 1, onBeat, onDone }: Props) {
  const [i, setI] = useState(0)
  const [typed, setTyped] = useState(0)
  const fast = speed === 'fast'
  const instant = stage === 2 || stage >= 4 // intertitles and notifications arrive whole; tape and telex print
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
    const cue = cueFor(b, stage)
    if (cue) play(cue)
  }, [i]) // eslint-disable-line react-hooks/exhaustive-deps

  // type the line, hold it, then feed on
  useEffect(() => {
    if (!b) return
    if (typed < full) {
      if (instant) { setTyped(full); return }
      const step = fast ? 3 : stage === 3 ? 2 : 1 // the telex prints faster than the ticker
      const t = setTimeout(() => setTyped(n => Math.min(full, n + step)), fast ? 10 : 18)
      return () => clearTimeout(t)
    }
    // a line that arrives whole stays a little longer, by its length, so it can be read
    const hold = ((b.kind === 'shuffle' ? 1100 : b.kind === 'info' ? 700 : 900) + (instant ? Math.min(900, full * 14) : 0)) * (fast ? 0.45 : 1)
    const t = setTimeout(advance, hold)
    return () => clearTimeout(t)
  }, [typed, i]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!b) return null
  const era = stage >= 4 ? 'feed' : stage === 3 ? 'telex' : stage === 2 ? 'reel' : 'ticker'
  const breaking = (x: Beat) => x.title === 'The Truth clock' || x.kind === 'board'
  return (<>
    {/* the dimming sits under whatever the line is about (lit above it); the tape sits above both */}
    <div className={`tape-dim tape-dim--${era}`} aria-hidden="true" />
    <div className={`tape-wrap tape-wrap--${era}`} onClick={advance} role="status" aria-live="polite">
      {era === 'feed' ? (
        // notifications stack: the newest slides in on top, the last two stay below it
        <div className="feed">
          {beats.slice(Math.max(0, i - 2), i + 1).reverse().map((x, k) => (
            <div key={i - k} className={`note ${k === 0 ? 'note--new' : ''} ${breaking(x) ? 'note--breaking' : ''}`}>
              <span className="note__icon" aria-hidden="true">{breaking(x) ? '!' : x.kind === 'money' ? '$' : x.kind === 'gold' ? '£' : '●'}</span>
              <div className="note__body">
                <div className="note__head"><b>{breaking(x) ? `Breaking · ${x.title}` : x.title}</b><span>{k === 0 ? 'now' : `${k}m ago`}</span></div>
                <span className="note__text">{x.text}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="tape" key={i}>
          <span className={`tape__stamp tape__stamp--${b.kind}`}>{b.title}</span>
          <span className="tape__text">{b.text.slice(0, typed)}{!instant && <span className="tape__caret" />}</span>
          {b.kind === 'shuffle' && <Riffle />}
        </div>
      )}
      <div className="tape__foot">
        <span className="cl-num">{i + 1} / {beats.length}</span>
      </div>
    </div>
  </>)

}

/** Two half-decks riffled together and squared up. */
function Riffle() {
  return (
    <span className="riffle" aria-hidden="true">
      {Array.from({ length: 10 }, (_, k) => <span key={k} className={`riffle__card riffle__card--${k % 2 ? 'r' : 'l'}`} style={{ animationDelay: `${120 + k * 55}ms`, zIndex: k }} />)}
    </span>
  )
}
