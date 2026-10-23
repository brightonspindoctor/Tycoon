// The Achievements page (from the front page) and the Trophy Cabinet (from the Scoreboard).
import { ACHIEVEMENTS, ACHIEVEMENT_KEYS } from '../engine/achievements'
import { TACTICS, type TacticKey } from '../engine/tactics'
import { badgeCounts, loadAchieved } from '../storage'
import { iconUrl } from './icons'

const date = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

export function Achievements({ onBack }: { onBack: () => void }) {
  const got = loadAchieved()
  const done = ACHIEVEMENT_KEYS.filter(k => got[k]).length
  const groups = [...new Set(ACHIEVEMENT_KEYS.map(k => ACHIEVEMENTS[k].group))]
  return (
    <div className="screen history achievements" data-theme="victorian">
      <header className="game__head">
        <div><span className="cl-label">Tycoon · {done} of {ACHIEVEMENT_KEYS.length}</span><h1 className="cl-display game__title">Achievements</h1></div>
        <button type="button" className="cl-btn" onClick={onBack}>Back</button>
      </header>
      <div className="achievements__body">
        {groups.map(g => (
          <section key={g} className="achievements__group">
            <h2 className="cl-label">{g}</h2>
            <ul className="achievements__list">
              {ACHIEVEMENT_KEYS.filter(k => ACHIEVEMENTS[k].group === g).map(k => {
                const a = ACHIEVEMENTS[k], when = got[k]
                return (
                  <li key={k} className={`feat ${when ? 'is-earned' : ''}`}>
                    <img className="feat__icon" src={iconUrl(a.icon)} alt="" />
                    <div className="feat__text">
                      <b className="cl-display">{a.name}</b>
                      <span>{a.goal}</span>
                      {when && <span className="res-note feat__date">{date(when)}</span>}
                    </div>
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}

export function TrophyCabinet({ onBack }: { onBack: () => void }) {
  const counts = badgeCounts()
  const keys = Object.keys(TACTICS) as TacticKey[]
  const have = keys.filter(k => counts[TACTICS[k].name]).length
  return (
    <div className="screen history cabinet" data-theme="victorian">
      <header className="game__head">
        <div><span className="cl-label">Tycoon · {have} of {keys.length} badges</span><h1 className="cl-display game__title">Trophy cabinet</h1></div>
        <button type="button" className="cl-btn" onClick={onBack}>Back</button>
      </header>
      <div className="cabinet__shelves">
        {keys.map(k => {
          const t = TACTICS[k], n = counts[t.name] ?? 0
          return (
            <div key={k} className={`trophy ${n ? 'is-earned' : ''}`}>
              <div className="trophy__plinth">{n ? <img className="trophy__icon" src={iconUrl(t.icon)} alt="" /> : <span className="trophy__unknown" aria-hidden="true">?</span>}</div>
              <b className="cl-display">{n ? t.name : 'Not yet won'}</b>
              <span className="res-note">{n ? t.text : '—'}</span>
              {n > 0 && <span className="cl-label trophy__count">Won {n === 1 ? 'once' : `${n} times`}</span>}
            </div>
          )
        })}
      </div>
      <p className="res-note">Each game you win as Chairman earns one badge, for how you played it.</p>
    </div>
  )
}
