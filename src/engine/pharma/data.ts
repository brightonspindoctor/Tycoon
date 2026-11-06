// Pharmaceutical: the cards, remedies and liabilities. Stage 1 only so far (Patent Medicines, 1880s–1900s).
import type { Family } from '../data'

export type PCardKey =
  | 'produce' | 'salesman' | 'kickback' | 'expertWitness' | 'nda' | 'freeSamples' | 'charityGala'
  | 'hireSalesmen' | 'medicineShow' | 'biopiracy' | 'inventAilment' | 'testimonials' | 'smearCampaign'
  | 'generic' | RemedyKey

export type RemedyKey = 'snakeOil' | 'vegetableCompound' | 'cocaineTonic' | 'soothingSyrup' | 'heroinSyrup'

export interface PCardDef {
  name: string
  ap: number | null // null: can't be played (remedies go in with Produce; Generics just sit there)
  cost?: number // $ to play
  family: Family | 'Remedy'
  power?: number // Hold removed
  all?: boolean // hits every liability
  trust?: number // Trust gained (or lost) when played
  uses?: number // played this many times, then gone
  oncePerFight?: boolean
  price?: number // in the shop
  icon: string
  text: string
}

export interface RemedyDef { pays: number[]; caseChance: number; produceTrust?: number }

/** What a live remedy pays each turn: one entry per turn, from the turn it was researched. */
export const REMEDIES: Record<RemedyKey, RemedyDef> = {
  snakeOil: { pays: [1, 2, 2, 3], caseChance: 0 },
  vegetableCompound: { pays: [1, 1, 2, 2, 3], caseChance: 0 },
  cocaineTonic: { pays: [2, 3, 5], caseChance: 0.25 },
  soothingSyrup: { pays: [2, 4, 6], caseChance: 0.4 },
  heroinSyrup: { pays: [1, 3, 5, 7], caseChance: 0.3, produceTrust: -1 },
}
export const REMEDY_KEYS = Object.keys(REMEDIES) as RemedyKey[]
export const isRemedy = (k: PCardKey): k is RemedyKey => k in REMEDIES

const remedyText = (k: RemedyKey) => {
  const d = REMEDIES[k]
  const risk = d.caseChance >= 0.35 ? 'High risk of Patient Cases.' : d.caseChance > 0 ? 'Can cause Patient Cases.' : 'Safe.'
  return `${risk}${d.produceTrust ? ` ${d.produceTrust} Trust when produced.` : ''}`
}

export const PCARDS: Record<PCardKey, PCardDef> = {
  produce: { name: 'Produce', ap: 1, family: 'Production', price: 6, icon: 'produce', text: 'Put a remedy from your hand into an empty factory.' },
  salesman: { name: 'Travelling Salesman', ap: 1, family: 'Dirty', power: 3, uses: 3, price: 3, icon: 'salesman', text: 'Remove 3 Hold.' },
  kickback: { name: 'Kickback', ap: 1, family: 'Dirty', power: 5, trust: -1, price: 4, icon: 'kickback', text: 'Remove 5 Hold. −1 Trust.' },
  expertWitness: { name: 'Expert Witness', ap: 1, cost: 1, family: 'Legal', power: 4, price: 4, icon: 'expertWitness', text: 'Pay $1. Remove 4 Hold.' },
  nda: { name: 'NDA', ap: 1, cost: 1, family: 'Bury', price: 4, icon: 'nda', text: "Pay $1. Cancel the first hit of a liability's next move." },
  freeSamples: { name: 'Free Samples', ap: 1, family: 'Fortune', trust: 1, price: 3, icon: 'freeSamples', text: '+1 Trust. Live remedies pay $1 more this turn.' },
  charityGala: { name: 'Charity Gala', ap: 1, cost: 2, family: 'Fortune', trust: 2, price: 4, icon: 'charityGala', text: 'Pay $2. +2 Trust.' },
  hireSalesmen: { name: 'Hire Salesmen', ap: 1, family: 'Tempo', price: 4, icon: 'hireSalesmen', text: 'Add 2 Travelling Salesmen to your hand.' },
  medicineShow: { name: 'Medicine Show', ap: 1, family: 'Dirty', power: 2, trust: 1, price: 5, icon: 'medicineShow', text: 'Remove 2 Hold. +1 Trust. Add a Salesman to your hand.' },
  biopiracy: { name: 'Biopiracy', ap: 1, family: 'Production', trust: -1, price: 4, icon: 'biopiracy', text: 'Add a remedy to your hand. −1 Trust.' },
  inventAilment: { name: 'Invent an Ailment', ap: 1, family: 'Production', price: 4, icon: 'inventAilment', text: 'Your next Research gives two remedies.' },
  testimonials: { name: 'Testimonials', ap: 1, family: 'Fortune', trust: 2, price: 3, icon: 'testimonials', text: '+2 Trust, −1 for each open Patient Case.' },
  smearCampaign: { name: 'Smear Campaign', ap: 1, family: 'Bury', power: 2, all: true, price: 5, icon: 'smearCampaign', text: 'Remove 2 Hold from every liability.' },
  generic: { name: 'Generic', ap: null, family: 'Junk', icon: 'generic', text: 'An expired patent. Takes up space.' },
  snakeOil: { name: 'Snake Oil Liniment', ap: null, family: 'Remedy', icon: 'snakeOil', text: remedyText('snakeOil') },
  vegetableCompound: { name: 'Vegetable Compound', ap: null, family: 'Remedy', icon: 'vegetableCompound', text: remedyText('vegetableCompound') },
  cocaineTonic: { name: 'Cocaine Tonic', ap: null, family: 'Remedy', icon: 'cocaineTonic', text: remedyText('cocaineTonic') },
  soothingSyrup: { name: 'Soothing Syrup', ap: null, family: 'Remedy', icon: 'soothingSyrup', text: remedyText('soothingSyrup') },
  heroinSyrup: { name: 'Heroin Cough Syrup', ap: null, family: 'Remedy', icon: 'heroinSyrup', text: remedyText('heroinSyrup') },
}

export const PSTARTER: PCardKey[] = ['produce', 'salesman', 'salesman', 'kickback', 'expertWitness', 'nda', 'freeSamples', 'charityGala']
/** Cards the shop and the after-round offer draw from. */
export const PSHOP_POOL: PCardKey[] = ['produce', 'salesman', 'kickback', 'expertWitness', 'nda', 'freeSamples', 'charityGala', 'hireSalesmen', 'medicineShow', 'biopiracy', 'inventAilment', 'testimonials', 'smearCampaign']

// ---- liabilities ----
/** One hit of a move. A move can be several hits; an NDA cancels the first. */
export type Hit =
  | { k: 'trust'; n: number }
  | { k: 'cash'; n: number }
  | { k: 'copy' } // Illegal Copy: halves a live remedy's returns
  | { k: 'case' } // a new Patient Case
  | { k: 'worsen' } // every open case one step worse
  | { k: 'block' } // a live remedy pays nothing next turn
  | { k: 'widow'; n: number } // −$n, and −$n again if a case is open

export interface PMove { name: string; hits: Hit[] }
export type PThreatKind =
  | 'temperance' | 'localDoctor' | 'widow' | 'rivalQuack' | 'classAction' | 'claimant'
  | 'reporter' | 'customer' | 'preacher' | 'copycat' | 'pharmacist' | 'coroner'
  | 'fraud'
export interface PThreatDef {
  name: string; hold: number; weak?: Family; resist?: Family; moves: PMove[]; portrait: string; boss?: boolean
  arrives?: Hit[] // what happens when it turns up
  spawn?: { every: number; kind: PThreatKind; max: number } // every Nth turn another liability joins, up to max at once
}

export const PTHREATS: Record<PThreatKind, PThreatDef> = {
  // the big ones: several hits a move
  temperance: { name: 'The Temperance League', hold: 10, weak: 'Legal', resist: 'Dirty', portrait: 'ph-temperance',
    moves: [{ name: 'Sermon', hits: [{ k: 'trust', n: 1 }, { k: 'trust', n: 1 }] }, { name: 'Petition', hits: [{ k: 'trust', n: 1 }, { k: 'cash', n: 3 }] }] },
  localDoctor: { name: 'The Local Doctor', hold: 10, weak: 'Dirty', portrait: 'ph-localDoctor',
    moves: [{ name: 'Diagnosis', hits: [{ k: 'trust', n: 1 }, { k: 'case' }] }, { name: 'Second Opinion', hits: [{ k: 'trust', n: 1 }, { k: 'trust', n: 1 }] }] },
  widow: { name: 'The Grieving Widow', hold: 9, weak: 'Bury', portrait: 'ph-widow',
    moves: [{ name: 'Lawsuit', hits: [{ k: 'cash', n: 2 }, { k: 'widow', n: 2 }] }, { name: 'Tells the Papers', hits: [{ k: 'trust', n: 1 }, { k: 'cash', n: 2 }] }] },
  rivalQuack: { name: 'The Rival Quack', hold: 14, weak: 'Legal', portrait: 'ph-rivalQuack',
    moves: [{ name: 'Knock-off', hits: [{ k: 'copy' }, { k: 'cash', n: 2 }] }, { name: 'Undercut', hits: [{ k: 'cash', n: 2 }, { k: 'cash', n: 2 }] }] },
  classAction: { name: 'The Class Action', hold: 10, weak: 'Legal', resist: 'Dirty', portrait: 'ph-classAction',
    arrives: [{ k: 'case' }],
    spawn: { every: 3, kind: 'claimant', max: 3 },
    moves: [{ name: 'Discovery', hits: [{ k: 'trust', n: 1 }, { k: 'cash', n: 2 }] }, { name: 'Depositions', hits: [{ k: 'cash', n: 1 }, { k: 'cash', n: 1 }] }] },
  // joins the Class Action every 3rd turn
  claimant: { name: 'A Claimant', hold: 4, weak: 'Legal', portrait: 'ph-claimant', moves: [{ name: 'Damages', hits: [{ k: 'cash', n: 1 }] }] },
  // the weak ones: they come in packs, one hit a move
  reporter: { name: 'The Penny Paper Reporter', hold: 5, weak: 'Legal', portrait: 'ph-reporter', moves: [{ name: 'Column', hits: [{ k: 'trust', n: 1 }] }] },
  customer: { name: 'The Disgruntled Customer', hold: 5, weak: 'Legal', portrait: 'ph-customer', moves: [{ name: 'Refund', hits: [{ k: 'cash', n: 2 }] }] },
  preacher: { name: 'The Town Preacher', hold: 6, weak: 'Bury', resist: 'Dirty', portrait: 'ph-preacher', moves: [{ name: 'Fire and Brimstone', hits: [{ k: 'trust', n: 1 }] }] },
  copycat: { name: 'The Copycat Peddler', hold: 5, weak: 'Dirty', portrait: 'ph-copycat', moves: [{ name: 'Illegal Copy', hits: [{ k: 'copy' }] }] },
  pharmacist: { name: 'The Suspicious Pharmacist', hold: 6, weak: 'Dirty', portrait: 'ph-pharmacist', moves: [{ name: 'Off the Shelf', hits: [{ k: 'block' }] }] },
  coroner: { name: 'The Coroner', hold: 5, weak: 'Bury', portrait: 'ph-coroner', moves: [{ name: 'Inquest', hits: [{ k: 'worsen' }] }] },
  // the boss
  fraud: { name: 'The Great American Fraud', hold: 20, weak: 'Bury', resist: 'Legal', portrait: 'ph-fraud', boss: true,
    moves: [
      { name: 'Investigation', hits: [{ k: 'trust', n: 1 }, { k: 'trust', n: 1 }] },
      { name: 'Lab Results', hits: [{ k: 'cash', n: 4 }, { k: 'block' }, { k: 'trust', n: 1 }] },
      { name: 'Exposé', hits: [{ k: 'worsen' }, { k: 'trust', n: 1 }] },
    ] },
}

export const BIG_ONES: PThreatKind[] = ['temperance', 'localDoctor', 'widow']
export const WEAK_ONES: PThreatKind[] = ['reporter', 'customer', 'preacher', 'copycat', 'pharmacist', 'coroner']

export const CASE_STEPS = ['Complaint', 'Hospitalised', 'Critical', 'Death'] as const

export function hitText(h: Hit): string {
  switch (h.k) {
    case 'trust': return `−${h.n} Trust`
    case 'cash': return `−$${h.n}`
    case 'copy': return 'Illegal Copy'
    case 'case': return 'New Patient Case'
    case 'worsen': return 'Cases worsen'
    case 'block': return 'A remedy pays nothing'
    case 'widow': return `−$${h.n} (−$${h.n * 2} if a case is open)`
  }
}
/** "2× −1 Trust" or "−1 Trust, −$3". */
export function moveText(m: PMove): string {
  const t = m.hits.map(hitText)
  return t.every(x => x === t[0]) && t.length > 1 ? `${t.length}× ${t[0]}` : t.join(', ')
}
