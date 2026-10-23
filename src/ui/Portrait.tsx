// An enemy portrait. If the picture fails to load (a dropped connection, say), it tries again
// twice before showing an engraved monogram, and it starts afresh for each new enemy.
import { useEffect, useState } from 'react'

const RETRIES = 2
export function Portrait({ portrait, name, className }: { portrait: string; name: string; className: string }) {
  const [tries, setTries] = useState(0)
  useEffect(() => setTries(0), [portrait])
  if (tries > RETRIES) {
    const initials = name.replace(/^The /, '').split(/\s+/).map(w => w[0]).join('').slice(0, 2)
    return <span className={`${className} portrait--blank`} aria-hidden="true"><span className="cl-display">{initials}</span></span>
  }
  const src = `${import.meta.env.BASE_URL}art/enemies/${portrait}.jpg${tries ? `?try=${tries}` : ''}`
  return <img key={src} className={className} src={src} alt="" onError={() => setTimeout(() => setTries(n => n + 1), 1200)} />
}
