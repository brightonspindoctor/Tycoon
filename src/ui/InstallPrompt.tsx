// Shown the first time the game is opened: a Download button that installs it as an app.
// Chrome and Edge install in one tap. Every other browser gets its own short steps.
import { useState } from 'react'
import { install, installRoute, type InstallRoute } from '../install'
import { installPromptSeen, markInstallPromptSeen } from '../storage'
import { play } from '../sound'
import { useInstallable } from './settingsBus'

/** The manual steps for browsers with no install dialog of their own. */
export function InstallSteps({ route }: { route: InstallRoute }) {
  switch (route) {
    case 'ios': return <span>Tap Share <ShareIcon />, then <b>Add to Home Screen</b>.</span>
    case 'macSafari': return <span>In Safari's <b>File</b> menu, choose <b>Add to Dock</b>.</span>
    case 'android': return <span>Open your browser's menu <b>⋮</b> and choose <b>Install app</b> or <b>Add to Home screen</b>.</span>
    case 'chromium': return <span>Click the install icon at the right of the address bar, or choose <b>Install Tycoon</b> from the browser menu.</span>
    case 'firefox': return <span>Firefox can't install games. Open this page in Chrome, Edge or Safari to download it.</span>
    default: return <span>Open your browser's menu and choose <b>Install</b> or <b>Add to Home Screen</b>.</span>
  }
}

export function InstallPrompt() {
  const [seen, setSeen] = useState(installPromptSeen())
  const [steps, setSteps] = useState(false)
  const { installable, installed } = useInstallable()
  if (seen || installed) return null
  const done = () => { markInstallPromptSeen(); setSeen(true) }
  const download = () => {
    play('click')
    if (installable) void install().then(ok => { if (ok) done() })
    else setSteps(true)
  }
  return (
    <aside className="install" role="dialog" aria-label="Download Tycoon" data-theme="victorian">
      <img className="install__icon" src={`${import.meta.env.BASE_URL}icons/icon-192.png`} alt="" />
      <div className="install__text">
        <b className="cl-display">Download Tycoon</b>
        {steps ? <InstallSteps route={installRoute()} /> : <span>Free. Opens full-screen and plays offline.</span>}
      </div>
      <div className="install__buttons">
        {!steps && <button type="button" className="cl-btn cl-btn--primary" onClick={download}>Download</button>}
        <button type="button" className="cl-btn" onClick={() => { play('click'); done() }}>{steps ? 'Got it' : 'Not now'}</button>
      </div>
    </aside>
  )
}

export function ShareIcon() {
  return <svg className="share-icon" viewBox="0 0 24 24" width="16" height="16" aria-label="Share"><path fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="M12 15V3m0 0L8 7m4-4 4 4M7 11H5v10h14V11h-2" /></svg>
}
