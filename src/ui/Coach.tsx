// The tutorial's coach panel: the step's words, a Next button when it only needs reading, and a way out.
import { play } from '../sound'
import type { CoachView } from './tutorial'

export function Coach({ view, mobile }: { view: CoachView; mobile?: boolean }) {
  // phones play a card in two taps, so the instruction says so
  const text = mobile && view.play ? (view.text.endsWith('Play it.') ? view.text.replace(/Play it\.$/, 'Tap it, then Play.') : `${view.text} Tap it, then Play.`) : view.text
  return (
    <section className={`coach ${mobile ? 'coach--m' : ''}`} role="status" aria-live="polite" data-theme="victorian">
      <div className="coach__head">
        <span className="cl-label">Tutorial · {view.no} of {view.of}</span>
        <button type="button" className="coach__skip" onClick={() => { play('click'); view.skip() }}>Skip tutorial</button>
      </div>
      <p className="coach__text">{text}</p>
      {view.next && <button type="button" className="cl-btn cl-btn--primary cl-btn--small coach__next" onClick={() => { play('click'); view.next!() }}>Next</button>}
    </section>
  )
}
