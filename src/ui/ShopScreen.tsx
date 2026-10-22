import { useState } from 'react'
import { boonInfo, CARDS, ITEMS, PROSPECT_FOR, WATER_FOR } from '../engine/data'
import { canBuild, canDuplicate, canUpgrade, rigCount, skimRate, waterPrice, type Action, type Run } from '../engine/engine'
import { ERA_THEME, SHOP_NAME, money, units } from '../engine/format'
import { ExposureMeter } from './Exposure'
import { HeatMeter } from './Heat'
import { CONFIG } from '../engine/config'
import { CardView } from './CardView'
import { iconUrl } from './icons'
import { SettingsButton } from './Settings'

interface Props { run: Run; dispatch: (a: Action) => void }
type Mode = null | 'destroy' | 'upgrade' | 'duplicate'

export function ShopScreen({ run, dispatch }: Props) {
  const [mode, setMode] = useState<Mode>(null)
  const st = run.stage
  const rate = skimRate(run)
  const nextRate = (st >= 3 ? CONFIG.skimRate3 : st >= 2 ? CONFIG.skimRate2 : CONFIG.skimRate)[run.round + 1] ?? rate
  const plotsLeft = CONFIG.maxPlots - run.plots.length
  const can = (cost: number) => run.capital - cost >= 1
  const stage2 = st >= 2
  const only2 = st === 2 // the Silo and dividends belong to the board years
  const stage3 = st >= 3
  const prospectKey = PROSPECT_FOR[st] ?? 'derrick'
  const waterKey = WATER_FOR[st] // stage 2 sells no fire card

  return (
    <div className="screen shop" data-theme={ERA_THEME[st] ?? 'victorian'}>
      <header className="game__head">
        <div>
          <span className="cl-label">Stage {st} · {run.round === 0 ? 'Before you start' : `After round ${run.round}`}</span>
          <h1 className="cl-display game__title">{SHOP_NAME[st] ?? SHOP_NAME[2]}</h1>
        </div>
        <div className="shop__head-right"><SettingsButton /><div className="shop__next"><span className="cl-label">Next: Round {run.round + 1}</span></div></div>
      </header>

      <div className="shop__grid">
        <div className="shop__main">
          <section>
            <div className="shop__row-head"><span className="cl-label">Cards</span><button type="button" className="cl-btn cl-btn--small" disabled={!can(1)} onClick={() => dispatch({ type: 'reroll' })}>Reroll · {money(1, st)}</button></div>
            <div className="shop__cards">
              {run.shop.cards.map((k, i) => k ? (
                <CardView key={i} card={{ id: -i - 1, key: k, uses: CARDS[k].uses }} stage={st} price={money(CARDS[k].price!, st)} playable={can(CARDS[k].price!)}
                  why={can(CARDS[k].price!) ? undefined : 'Too expensive'} onClick={() => dispatch({ type: 'buyCard', slot: i })} />
              ) : <div key={i} className="sold">Sold</div>)}
              {waterKey && <div className="prospect-slot">
                {run.shop.bucketSold ? <div className="sold">Sold out</div> : <CardView card={{ id: -8, key: waterKey, uses: CARDS[waterKey].uses }} stage={st} price={money(waterPrice(), st)} playable={can(waterPrice())} onClick={() => dispatch({ type: 'buyBucket' })} />}
                <span className="res-note">One per visit.</span>
              </div>}
              {stage3 ? <div className="prospect-slot">
                {run.shop.prospectSold ? <div className="sold">Built</div> : (
                  <button type="button" className={`cl-card card rig-slot ${canBuild(run) && can(run.prospectPrice) ? 'card--playable' : 'card--dim'}`} disabled={!canBuild(run) || !can(run.prospectPrice)} onClick={() => dispatch({ type: 'buyProspect' })}>
                    <span className="cl-tag card-price">{money(run.prospectPrice, st)}</span>
                    <div className="cl-card__top"><div className="cl-card__cost">–</div><div className="cl-card__name">Offshore Rig</div></div>
                    <div className="cl-card__art"><img src={iconUrl('rig')} alt="" /></div>
                    <div className="cl-card__band">Production</div>
                    <div className="cl-card__effect">Built at once: {CONFIG.rigOutput} oil a turn, never runs dry.</div>
                  </button>
                )}
                <span className="res-note">One per visit. {rigCount(run)} of {CONFIG.maxPlots} Rigs. The price climbs {money(CONFIG.rigStep, st)} each time.</span>
              </div> : <div className="prospect-slot">
                {run.shop.prospectSold ? <div className="sold">Sold out</div> : <CardView card={{ id: -9, key: prospectKey, uses: CARDS[prospectKey].uses }} stage={st} price={money(run.prospectPrice, st)} playable={can(run.prospectPrice)} onClick={() => dispatch({ type: 'buyProspect' })} />}
                <span className="res-note">{stage2
                  ? `One per visit. The price climbs ${money(CONFIG.derrickStep, st)} each time. ${run.plots.length >= CONFIG.maxPlots && !run.plots.some(p => !p) ? 'All 5 plots are working.' : 'Claims its own plot.'}`
                  : `One per visit. ${plotsLeft > 1 ? `${plotsLeft} plots left to claim.` : plotsLeft === 1 ? 'Only 1 plot left to claim.' : run.plots.some(p => !p) ? 'All land claimed; fills empty plots.' : 'All land claimed.'}`}</span>
              </div>}
            </div>
          </section>

          {run.shop.boon && (
            <section className="boon" aria-label="Before the Baron">
              <img src={iconUrl(boonInfo(run.shop.boon, st).icon)} alt="" />
              <div className="boon__text">
                <span className="cl-label">Before the boss · one offer</span>
                <b className="cl-display">{boonInfo(run.shop.boon, st).name}</b>
                <span>{units(boonInfo(run.shop.boon, st).text, st)}</span>
              </div>
              <button type="button" className="cl-btn cl-btn--skim" disabled={run.gold < CONFIG.boonGold} onClick={() => dispatch({ type: 'buyBoon' })}>
                {run.gold < CONFIG.boonGold ? `Needs ${CONFIG.boonGold} gold` : `Buy · ${CONFIG.boonGold} gold`}
              </button>
            </section>
          )}
          {run.boon && run.round === 3 && !run.shop.boon && <div className="boon boon--bought"><span className="cl-label">Bought for the boss</span><b className="cl-display">{boonInfo(run.boon, st).name}</b></div>}
          <section className="shop__deals">
            {run.shop.item ? (
              <div className="cl-slot slot">
                <span className="cl-tag">{money(ITEMS[run.shop.item].price, st)}</span>
                <div className="cl-slot__name">{ITEMS[run.shop.item].name}</div>
                <div className="cl-slot__desc">{units(ITEMS[run.shop.item].text, st)}</div>
                <button type="button" className="cl-btn" disabled={!can(ITEMS[run.shop.item].price)} onClick={() => dispatch({ type: 'buyItem' })}>Buy</button>
              </div>
            ) : <div className="cl-slot slot sold">Item sold</div>}
            {!stage2 && <div className="cl-slot slot">
              <span className="cl-tag">{money(8, st, true)}</span>
              <div className="cl-slot__name">Cheap Loan</div>
              <div className="cl-slot__desc"><span className="cl-plus">{money(8, st, true)} Capital now.</span> <span className="cl-minus">Bank Debt rises by {money(1, st)} a turn, for good.</span></div>
              <button type="button" className="cl-btn" disabled={run.shop.loanTaken} onClick={() => dispatch({ type: 'takeLoan' })}>{run.shop.loanTaken ? 'Signed' : 'Sign'}</button>
            </div>}
            <div className="cl-slot slot">
              <span className="cl-tag">{money(run.destroyCost, st)}</span>
              <div className="cl-slot__name">Destroy a card</div>
              <div className="cl-slot__desc">Remove it for good.</div>
              <button type="button" className="cl-btn" disabled={!can(run.destroyCost)} onClick={() => setMode(mode === 'destroy' ? null : 'destroy')}>{mode === 'destroy' ? 'Cancel' : 'Choose'}</button>
            </div>
            {stage2 && (
              <div className="cl-slot slot">
                <span className="cl-tag">{money(run.upgradeCost, st)}</span>
                <div className="cl-slot__name">Upgrade a card</div>
                <div className="cl-slot__desc">{stage3 ? 'Twice per card in this stage.' : 'Once per card.'} The price rises each time.</div>
                <button type="button" className="cl-btn" disabled={!can(run.upgradeCost) || !run.deck.some(c => canUpgrade(c, st))} onClick={() => setMode(mode === 'upgrade' ? null : 'upgrade')}>{mode === 'upgrade' ? 'Cancel' : 'Choose'}</button>
              </div>
            )}
            {only2 && (
              <div className="cl-slot slot">
                <span className="cl-tag">{money(CONFIG.silo2Price, st)}</span>
                <div className="cl-slot__name">Silo</div>
                <div className="cl-slot__desc">+{CONFIG.silo2Storage} oil storage, for good. Now {run.storage}. {CONFIG.silo2Max - (run.silos ?? 0)} of {CONFIG.silo2Max} left to build.</div>
                <button type="button" className="cl-btn" disabled={!!run.shop.siloSold || (run.silos ?? 0) >= CONFIG.silo2Max || !can(CONFIG.silo2Price)} onClick={() => dispatch({ type: 'buySilo' })}>{(run.silos ?? 0) >= CONFIG.silo2Max ? 'All built' : run.shop.siloSold ? 'Built' : 'Build'}</button>
              </div>
            )}
            {stage2 && (
              <div className="cl-slot slot">
                <span className="cl-tag">Card's price</span>
                <div className="cl-slot__name">Duplicate a card</div>
                <div className="cl-slot__desc">A second copy, upgrade and all. Once per visit.</div>
                <button type="button" className="cl-btn" disabled={!!run.shop.duplicated || !run.deck.some(c => canDuplicate(c) && can(CARDS[c.key].price!))} onClick={() => setMode(mode === 'duplicate' ? null : 'duplicate')}>{run.shop.duplicated ? 'Done' : mode === 'duplicate' ? 'Cancel' : 'Choose'}</button>
              </div>
            )}
            {stage3 && (
              <div className="cl-slot slot">
                <span className="cl-tag">{money(CONFIG.lobbyFirmCost, st)}</span>
                <div className="cl-slot__name">Hire a lobbying firm</div>
                <div className="cl-slot__desc">Heat −{CONFIG.lobbyFirmDrop}. Once per visit.</div>
                <button type="button" className="cl-btn" disabled={run.shop.dividendPaid || run.heat === 0 || !can(CONFIG.lobbyFirmCost)} onClick={() => dispatch({ type: 'payDividends' })}>{run.shop.dividendPaid ? 'Retained' : 'Retain'}</button>
              </div>
            )}
            {only2 && (
              <div className="cl-slot slot">
                <span className="cl-tag">{money(CONFIG.dividendCost, st)}</span>
                <div className="cl-slot__name">Pay dividends</div>
                <div className="cl-slot__desc">Board Exposure −{CONFIG.dividendDrop}. Once per visit.</div>
                <button type="button" className="cl-btn" disabled={run.shop.dividendPaid || run.exposure === 0 || !can(CONFIG.dividendCost)} onClick={() => dispatch({ type: 'payDividends' })}>{run.shop.dividendPaid ? 'Paid' : 'Pay'}</button>
              </div>
            )}
          </section>

          <section className="deck">
            <span className="cl-label">Your deck · {run.deck.length} cards{mode ? ` · choose a card to ${mode}` : ''}</span>
            <div className="deck__list">
              {run.deck.map(c => {
                const ok = mode === 'destroy' || (mode === 'upgrade' && canUpgrade(c, st)) || (mode === 'duplicate' && canDuplicate(c) && can(CARDS[c.key].price!))
                return <CardView key={c.id} card={c} small stage={st} playable={!mode || ok} marked={ok && mode ? (mode === 'duplicate' ? 'upgrade' : mode) : undefined}
                  price={mode === 'duplicate' && canDuplicate(c) ? money(CARDS[c.key].price!, st) : undefined} onClick={() => {
                  if (mode === 'destroy') dispatch({ type: 'destroyCard', cardId: c.id })
                  if (mode === 'upgrade' && ok) dispatch({ type: 'upgradeCard', cardId: c.id })
                  if (mode === 'duplicate' && ok) dispatch({ type: 'duplicateCard', cardId: c.id })
                  if (ok) setMode(null)
                }} />
              })}
            </div>
          </section>
        </div>

        <aside className="col-money">
          <section className="cl-ledger ledger">
            <div className="cl-ledger__head"><span className="cl-label">Capital</span><span className="cl-ledger__total">{money(run.capital, st)}</span></div>
            <ul className="cl-ledger__rows">
              {run.ledger.slice(-5).map((l, i) => <li key={i} className="ink-in"><span>{units(l.label, st)}</span><span className={l.amount < 0 ? 'cl-minus' : 'cl-plus'}>{money(l.amount, st, true)}</span></li>)}
              {!stage3 && <li className="next-debt"><span>Debt in round {run.round + 1}, per turn</span><span className="cl-minus">{run.debt ? `(${money(-run.debt, st)})` : 'None'}</span></li>}
            </ul>
          </section>
          <ExposureMeter run={run} />
          <HeatMeter run={run} />
          <section className="fortune fortune--skim">
            <div><span className="cl-label">Your fortune</span><b className="cl-num">{run.gold} gold</b></div>
            <p>{stage3 ? 'Skim with an Expense Account card during a round. Personal Guarantee and Dip into the Trust turn gold back into Capital.' : stage2 ? 'Skimming is done with an Expense Account card during a round: one gold at a time, +1 Board Exposure each.' : "Gold can't buy anything here. Every dollar you skim comes off the company's health."}</p>
            <span className="res-note">Rate now: <b>{money(rate, st)} → 1 gold</b>{nextRate !== rate ? ` · Round ${run.round + 1}: ${money(nextRate, st)}` : ''}</span>
            {!stage2 && <div className="skim-buttons">
              {[1, 2, 3].map(g => <button key={g} type="button" className="cl-btn cl-btn--skim" disabled={!can(g * rate)} onClick={() => dispatch({ type: 'skim', gold: g })}>{g} gold · {money(g * rate, st)}</button>)}
            </div>}
          </section>
          <div className="events">{run.events.slice(0, 2).map((e, i) => <p key={i}>{units(e, st)}</p>)}</div>
          <button type="button" className="cl-btn cl-btn--primary leave" onClick={() => dispatch({ type: 'leaveShop' })}>{run.round === 0 ? 'Begin round 1' : 'Leave shop'}</button>
        </aside>
      </div>
    </div>
  )
}
