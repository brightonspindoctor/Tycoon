// ?preview=sounds: play every sound effect, for checking how they sound.
import { CUES, play, renderOffline } from '../sound'

if (typeof window !== 'undefined') (window as unknown as { tycoonRender: typeof renderOffline }).tycoonRender = renderOffline

export function SoundBoard() {
  return (
    <div className="screen gallery" data-theme="victorian">
      <h1 className="cl-display game__title">Sounds</h1>
      <div className="soundboard">
        {CUES.map(({ cue, label }) => <button key={cue} type="button" className="cl-btn" onClick={() => play(cue)}>{label}</button>)}
      </div>
    </div>
  )
}
