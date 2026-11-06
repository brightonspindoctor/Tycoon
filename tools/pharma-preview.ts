// Pharmaceutical screens in awkward states, for checking layouts at every size.
// Admin only: ?pharma=busy | boss | spoils | shop | won | lost
import { PTHREATS, type PCardKey, type PThreatKind } from '../src/engine/pharma/data'
import { newPharmaRun, type PRun } from '../src/engine/pharma/engine'

export function pharmaPreview(kind: string): PRun {
  const r = newPharmaRun(42)
  const card = (key: PCardKey, extra = {}) => ({ id: r.nextId++, key, ...extra })
  const threat = (k: PThreatKind, hold?: number, nda = false) => ({ id: r.nextId++, kind: k, hold: hold ?? PTHREATS[k].hold, maxHold: PTHREATS[k].hold, step: 1, beaten: false, nda })
  if (kind === 'busy' || kind === 'boss') {
    r.round = kind === 'boss' ? 4 : 3
    r.turn = 22
    r.capital = 128
    r.trust = -4
    r.samples = 1
    r.factories = [
      { cardId: 900, key: 'heroinSyrup', age: 1 }, { cardId: 901, key: 'soothingSyrup', age: 2, copied: true }, { cardId: 902, key: 'snakeOil', age: 0, blocked: true },
      { cardId: 903, key: 'vegetableCompound', age: 3 }, { cardId: 904, key: 'cocaineTonic', age: 0 }, null,
    ]
    r.cases = [{ id: 950, remedy: 'heroinSyrup', step: 0 }, { id: 951, remedy: 'soothingSyrup', step: 1 }, { id: 952, remedy: 'soothingSyrup', step: 2 }]
    r.threats = kind === 'boss' ? [threat('fraud', 13, true)] : [threat('classAction', 6, true), threat('claimant'), threat('claimant', 1), { ...threat('copycat', 0), beaten: true }]
    r.hand = [card('produce'), card('heroinSyrup', { age: 1 }), card('salesman', { uses: 1 }), card('medicineShow'), card('nda'), card('generic'), card('smearCampaign')]
    r.ap = 3
    r.events = ['A Soothing Syrup case is Critical.', 'The Class Action arrives.', 'Research: Heroin Cough Syrup.']
  }
  if (kind === 'spoils') { r.phase = 'roundWon'; r.spoils = ['smearCampaign', 'hireSalesmen', 'testimonials'] }
  if (kind === 'shop') {
    r.phase = 'shop'; r.round = 2; r.capital = 31
    r.shop = { cards: ['medicineShow', 'inventAilment', null, 'biopiracy'], destroyed: false }
    r.factories = [null, null, null]; r.factoryPrice = 2
    for (const k of ['generic', 'generic', 'kickback', 'testimonials', 'salesman', 'charityGala', 'snakeOil', 'nda'] as PCardKey[]) r.discard.push(card(k))
  }
  if (kind === 'won') { r.phase = 'won'; r.round = 4; r.capital = 23; r.trust = 2 }
  if (kind === 'lost') { r.phase = 'lost'; r.round = 3; r.turn = 7; r.loss = { reason: 'disgraced' } }
  return r
}
