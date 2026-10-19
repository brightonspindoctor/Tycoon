// Shown the first time the game is opened: invites the player to put it on their home screen.
import { useState } from 'react'
import { install } from '../install'
import { installPromptSeen, markInstallPromptSeen } from '../storage'
import { ShareIcon } from './Settings'
import { useInstallable } from './settingsBus'

export function InstallPrompt() {
  const [seen, setSeen] = useState(installPromptSeen())
  const { installable, installed, ios } = useInstallable()
  // Android and desktop Chrome can install directly; iPhone needs the Share menu. Elsewhere there is nothing to offer.
  if (seen || installed || !(installable || ios)) return null
  const done = () => { markInstallPromptSeen(); setSeen(true) }
  return (
    <aside className="install" role="dialog" aria-label="Install Tycoon" data-theme="victorian">
      <img className="install__icon" src={`${import.meta.env.BASE_URL}icons/icon-192.png`} alt="" />
      <div className="install__text">
        <b className="cl-display">Put Tycoon on your home screen</b>
        {installable
          ? <span>It opens full-screen, like an app.</span>
          : <span>Tap Share <ShareIcon />, then <b>Add to Home Screen</b>.</span>}
      </div>
      <div className="install__buttons">
        {installable && <button type="button" className="cl-btn cl-btn--primary" onClick={() => { void install().finally(done) }}>Install</button>}
        <button type="button" className="cl-btn" onClick={done}>{installable ? 'Not now' : 'Got it'}</button>
      </div>
    </aside>
  )
}
