// Shared by the settings button, the settings panel and the install banner.
import { useEffect, useState } from 'react'
import { canInstall, isInstalled, isIOS, onInstallChange } from '../install'

export const OPEN_SETTINGS = 'tycoon:settings'
export const openSettings = () => window.dispatchEvent(new Event(OPEN_SETTINGS))
/** Opens the glossary straight away, from the board or the shop. */
export const OPEN_GLOSSARY = 'tycoon:glossary'
export const openGlossary = () => window.dispatchEvent(new Event(OPEN_GLOSSARY))

/** Re-renders when the browser says the game can (or no longer can) be installed. */
export function useInstallable() {
  const [, tick] = useState(0)
  useEffect(() => onInstallChange(() => tick(n => n + 1)), [])
  return { installable: canInstall(), installed: isInstalled(), ios: isIOS() }
}
