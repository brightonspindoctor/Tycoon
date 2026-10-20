// The settings panel (volume, sound on/off, install) and the gear button that opens it.
import { useEffect, useState } from 'react'
import { getVolume, isMuted, play, setMuted, setVolume } from '../sound'
import { loadReplay, saveReplay, type Replay } from '../storage'
import { install } from '../install'
import { OPEN_SETTINGS, openSettings, useInstallable } from './settingsBus'


export function SettingsButton({ className = '' }: { className?: string }) {
  return (
    <button type="button" className={`cl-btn settings-btn ${className}`} onClick={() => { play('click'); openSettings() }} aria-label="Settings" title="Settings">
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M19.4 13a7.6 7.6 0 0 0 0-2l2-1.6-2-3.4-2.4 1a7.4 7.4 0 0 0-1.7-1L15 3.5h-4l-.4 2.5a7.4 7.4 0 0 0-1.7 1l-2.4-1-2 3.4 2 1.6a7.6 7.6 0 0 0 0 2l-2 1.6 2 3.4 2.4-1a7.4 7.4 0 0 0 1.7 1l.4 2.5h4l.4-2.5a7.4 7.4 0 0 0 1.7-1l2.4 1 2-3.4zM13 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7z" transform="translate(-1 0)" /></svg>
    </button>
  )
}

/** Mounted once by App; opens whenever a SettingsButton is pressed. */
export function SettingsPanel() {
  const [open, setOpen] = useState(false)
  const [vol, setVol] = useState(getVolume())
  const [muted, setM] = useState(isMuted())
  const [replay, setReplay] = useState<Replay>(loadReplay())
  const { installable, installed, ios } = useInstallable()
  useEffect(() => {
    const show = () => { setVol(getVolume()); setM(isMuted()); setOpen(true) }
    window.addEventListener(OPEN_SETTINGS, show)
    return () => window.removeEventListener(OPEN_SETTINGS, show)
  }, [])
  useEffect(() => {
    if (!open) return
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [open])
  if (!open) return null

  const pct = Math.round(vol * 100)
  return (
    <div className="settings-wrap" onClick={() => setOpen(false)}>
      <section className="settings" role="dialog" aria-label="Settings" onClick={e => e.stopPropagation()} data-theme="victorian">
        <header className="settings__head">
          <h2 className="cl-display">Settings</h2>
          <button type="button" className="cl-btn cl-btn--small" onClick={() => setOpen(false)}>Close</button>
        </header>

        <div className="settings__row">
          <label className="cl-label" htmlFor="volume">Volume</label>
          <div className="settings__volume">
            <input id="volume" type="range" min={0} max={100} step={5} value={pct} disabled={muted}
              onChange={e => { const v = Number(e.target.value) / 100; setVol(v); setVolume(v) }}
              onPointerUp={() => play('coin')} onKeyUp={() => play('coin')}
              style={{ ['--fill' as string]: `${muted ? 0 : pct}%` }} />
            <span className="cl-num settings__pct">{muted ? 'Off' : `${pct}%`}</span>
          </div>
        </div>

        <div className="settings__row settings__row--inline">
          <span className="cl-label">Sound</span>
          <button type="button" role="switch" aria-checked={!muted} className={`switch ${muted ? '' : 'is-on'}`}
            onClick={() => { setMuted(!muted); setM(!muted); if (muted) setTimeout(() => play('click'), 0) }}>
            <span className="switch__knob" /><span className="switch__text">{muted ? 'Off' : 'On'}</span>
          </button>
        </div>

        <div className="settings__row">
          <span className="cl-label">Enemy turn</span>
          <div className="segmented" role="radiogroup" aria-label="Enemy turn replay">
            {(['normal', 'fast', 'off'] as Replay[]).map(v => (
              <button key={v} type="button" role="radio" aria-checked={replay === v} className={replay === v ? 'is-on' : ''}
                onClick={() => { setReplay(v); saveReplay(v); play('click') }}>{v === 'normal' ? 'Play it out' : v === 'fast' ? 'Fast' : 'Off'}</button>
            ))}
          </div>
        </div>

        <div className="settings__row">
          <span className="cl-label">Home screen</span>
          {installed ? <p className="res-note">Installed. Open Tycoon from your home screen.</p>
            : installable ? <button type="button" className="cl-btn cl-btn--primary" onClick={() => void install()}>Install Tycoon</button>
            : ios ? <p className="res-note">In Safari, tap Share <ShareIcon />, then <b>Add to Home Screen</b>.</p>
            : <p className="res-note">Use your browser's menu to install or add it to your home screen.</p>}
        </div>
      </section>
    </div>
  )
}

export function ShareIcon() {
  return <svg className="share-icon" viewBox="0 0 24 24" width="16" height="16" aria-label="Share"><path fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="M12 15V3m0 0L8 7m4-4 4 4M7 11H5v10h14V11h-2" /></svg>
}
