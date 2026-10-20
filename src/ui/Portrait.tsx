// An enemy portrait. Enemies without art yet get an engraved monogram in its place.
import { useState } from 'react'

export function Portrait({ portrait, name, className }: { portrait: string; name: string; className: string }) {
  const [missing, setMissing] = useState(false)
  if (missing) {
    const initials = name.replace(/^The /, '').split(/\s+/).map(w => w[0]).join('').slice(0, 2)
    return <span className={`${className} portrait--blank`} aria-hidden="true"><span className="cl-display">{initials}</span></span>
  }
  return <img className={className} src={`${import.meta.env.BASE_URL}art/enemies/${portrait}.jpg`} alt="" onError={() => setMissing(true)} />
}
