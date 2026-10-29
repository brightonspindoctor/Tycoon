// Installing the game to the home screen. Chrome and Edge (Android and desktop) fire
// `beforeinstallprompt`, which we keep so our own button can show the install dialog.
// iPhones and iPads have no such event: the player adds it from Safari's Share menu.
interface InstallEvent extends Event { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> }

let deferred: InstallEvent | null = null
const listeners = new Set<() => void>()
const changed = () => listeners.forEach(f => f())

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e as InstallEvent; changed() })
  window.addEventListener('appinstalled', () => { deferred = null; changed() })
}

export const onInstallChange = (f: () => void) => { listeners.add(f); return () => { listeners.delete(f) } }
export const canInstall = () => deferred !== null

export function isInstalled(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia?.('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true
}

/** iPhone or iPad Safari, where the player installs from the Share menu. */
export function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  return /iPhone|iPad|iPod/.test(ua) || (ua.includes('Macintosh') && navigator.maxTouchPoints > 1)
}

/**
 * How this browser downloads the game when it can't show its own install dialog.
 * Chrome and Edge only fire `beforeinstallprompt` once the service worker is ready, so
 * they can briefly land on 'chromium' before the one-tap install becomes available.
 */
export type InstallRoute = 'ios' | 'macSafari' | 'android' | 'firefox' | 'chromium' | 'other'
export function installRoute(): InstallRoute {
  if (typeof navigator === 'undefined') return 'other'
  if (isIOS()) return 'ios'
  const ua = navigator.userAgent
  if (/Android/.test(ua)) return 'android'
  if (/Firefox\//.test(ua)) return 'firefox'
  if (/Edg\/|Chrome\/|Chromium\//.test(ua)) return 'chromium'
  if (/Macintosh/.test(ua) && /Safari\//.test(ua)) return 'macSafari'
  return 'other'
}

export async function install(): Promise<boolean> {
  if (!deferred) return false
  const e = deferred
  await e.prompt()
  const { outcome } = await e.userChoice
  deferred = null; changed()
  return outcome === 'accepted'
}
