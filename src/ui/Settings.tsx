// The settings panel (volume, sound on/off, install) and the gear button that opens it.
import { useEffect, useState } from 'react'
import { getVolume, isMuted, play, setMuted, setVolume } from '../sound'
import { loadAdmin, loadReplay, saveAdmin, saveReplay, type Replay } from '../storage'
import type { AdminOp } from '../engine/engine'
import type { CardKey } from '../engine/data'
import { AdminTools } from './AdminPanel'
import { Glossary } from './Glossary'
import { setSharing, sharing } from '../telemetry'

const ADMIN_PIN = '3333'
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
/** onQuit is passed while a run is in progress: the panel then offers to quit it. */
interface AdminProps { onToggle: (on: boolean) => void; onAdmin?: (op: AdminOp, card?: CardKey) => void; inTurn: boolean; stage: number }
export function SettingsPanel({ onQuit, admin }: { onQuit?: () => void; admin?: AdminProps }) {
  const [adminOn, setAdminOn] = useState(loadAdmin())
  const [open, setOpen] = useState(false)
  const [vol, setVol] = useState(getVolume())
  const [muted, setM] = useState(isMuted())
  const [replay, setReplay] = useState<Replay>(loadReplay())
  const [confirmQuit, setConfirmQuit] = useState(false)
  const [glossary, setGlossary] = useState(false)
  const [share, setShare] = useState(sharing())
  const [pin, setPin] = useState<string | null>(null) // admin mode needs its PIN to switch on
  const { installable, installed, ios } = useInstallable()
  useEffect(() => {
    const show = () => { setVol(getVolume()); setM(isMuted()); setConfirmQuit(false); setGlossary(false); setPin(null); setOpen(true) }
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
  if (glossary) return <Glossary onClose={() => setGlossary(false)} />

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

        <div className="settings__row settings__row--inline">
          <span className="cl-label">Glossary</span>
          <button type="button" className="cl-btn cl-btn--small" onClick={() => { play('click'); setGlossary(true) }}>What the words mean</button>
        </div>

        <div className="settings__row">
          <div className="settings__row--inline">
            <span className="cl-label">Share anonymous play data</span>
            <button type="button" role="switch" aria-checked={share} className={`switch ${share ? 'is-on' : ''}`}
              onClick={() => { const v = !share; setShare(v); setSharing(v); play('click') }}>
              <span className="switch__knob" /><span className="switch__text">{share ? 'On' : 'Off'}</span>
            </button>
          </div>
          <p className="res-note">How far runs get and how long people play, linked to a random ID. Never your name or location.</p>
        </div>

        <div className="settings__row">
          <span className="cl-label">Home screen</span>
          {installed ? <p className="res-note">Installed. Open Tycoon from your home screen.</p>
            : installable ? <button type="button" className="cl-btn cl-btn--primary" onClick={() => void install()}>Install Tycoon</button>
            : ios ? <p className="res-note">In Safari, tap Share <ShareIcon />, then <b>Add to Home Screen</b>.</p>
            : <p className="res-note">Use your browser's menu to install or add it to your home screen.</p>}
        </div>
        <div className="settings__row settings__row--inline">
          <span className="cl-label">Admin mode</span>
          <button type="button" role="switch" aria-checked={adminOn} className={`switch ${adminOn ? 'is-on' : ''}`}
            onClick={() => {
              play('click')
              if (adminOn) { setAdminOn(false); saveAdmin(false); admin?.onToggle(false); setPin(null); return }
              setPin(pin === null ? '' : null) // ask for the PIN first
            }}>
            <span className="switch__knob" /><span className="switch__text">{adminOn ? 'On' : 'Off'}</span>
          </button>
        </div>
        {pin !== null && !adminOn && (
          <form className="settings__row admin-pin" onSubmit={e => {
            e.preventDefault()
            if (pin === ADMIN_PIN) { setAdminOn(true); saveAdmin(true); admin?.onToggle(true); setPin(null); play('coin') }
            else { setPin(''); play('hit') }
          }}>
            <label className="cl-label" htmlFor="admin-pin">PIN</label>
            <div className="admin-pin__row">
              <input id="admin-pin" className="admin-pin__input" type="password" inputMode="numeric" autoComplete="off" maxLength={4} autoFocus
                value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, ''))} aria-label="Admin PIN" />
              <button type="submit" className="cl-btn cl-btn--small" disabled={pin.length < 4}>Unlock</button>
            </div>
          </form>
        )}
        {adminOn && admin?.onAdmin && <AdminTools onAdmin={admin.onAdmin} inTurn={admin.inTurn} stage={admin.stage} />}
        {onQuit && (
          <div className="settings__row settings__quit">
            <span className="cl-label">This run</span>
            {!confirmQuit
              ? <button type="button" className="cl-btn" onClick={() => setConfirmQuit(true)}>Quit run</button>
              : <div className="settings__confirm">
                  <p>Walk away from this run? It's recorded as a quit in your history.</p>
                  <div className="settings__confirm-buttons">
                    <button type="button" className="cl-btn" onClick={() => setConfirmQuit(false)}>Keep playing</button>
                    <button type="button" className="cl-btn cl-btn--danger" onClick={() => { setOpen(false); setConfirmQuit(false); onQuit() }}>Quit run</button>
                  </div>
                </div>}
          </div>
        )}
      </section>
    </div>
  )
}

export function ShareIcon() {
  return <svg className="share-icon" viewBox="0 0 24 24" width="16" height="16" aria-label="Share"><path fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="M12 15V3m0 0L8 7m4-4 4 4M7 11H5v10h14V11h-2" /></svg>
}
