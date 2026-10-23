// Achievements: goals shown on the home screen from the start. Each one is checked against the
// run as it changes (see App); the last two are checked against what's kept on the device.
import { CONFIG } from './config'
import { wellCount, type Run } from './engine'

export type AchievementKey =
  | 'gusher' | 'cashRich' | 'bulletproof' | 'skeletonCrew' | 'hostileTakeover' | 'notAScratch' | 'mercyRule'
  | 'squeakyClean' | 'coolCustomer' | 'aboveBoard' | 'leanMachine' | 'paperTrail' | 'dynasty'
  | 'fluentInSpin' | 'fullCabinet' | 'shortCareer' | 'richCompany' | 'stoppedClock'

export interface Achievement { name: string; goal: string; icon: string; group: string; check?: (r: Run) => boolean }

const A = CONFIG.achievements
const won = (r: Run) => r.stage >= 4 && r.phase === 'stageComplete' // the Truth is beaten: the game is won
const lostTo = (r: Run, why: string) => r.phase === 'lost' && r.loss?.reason === why

export const ACHIEVEMENTS: Record<AchievementKey, Achievement> = {
  gusher: { name: 'Gusher', goal: `Pump ${A.gusher} oil in one run.`, icon: 'derrick', group: 'In a run', check: r => (r.feats?.pumped ?? 0) >= A.gusher },
  cashRich: { name: 'Cash Rich', goal: `Have $${A.cashRich} at once in stage 1.`, icon: 'cashbox', group: 'In a run', check: r => r.stage === 1 && r.capital >= A.cashRich },
  bulletproof: { name: 'Bulletproof', goal: `Have ${A.bulletproof} Cover or more in one turn.`, icon: 'insurance', group: 'In a run', check: r => r.phase === 'turn' && r.cover >= A.bulletproof },
  skeletonCrew: { name: 'Skeleton Crew', goal: 'Beat the Truth with only 1 Rig.', icon: 'rig', group: 'In a run', check: r => won(r) && wellCount(r) === 1 },
  hostileTakeover: { name: 'Hostile Takeover', goal: 'Beat a boss on your first turn.', icon: 'buyOut', group: 'In a run', check: r => !!r.feats?.quickBoss },
  notAScratch: { name: 'Not a Scratch', goal: 'Win a fight in stage 3 or 4 without an enemy taking any Capital.', icon: 'personalLawyer', group: 'In a run', check: r => !!r.feats?.cleanFight },
  mercyRule: { name: 'Mercy Rule', goal: `Remove ${A.mercyRule} Hold or more with one card.`, icon: 'dynamite', group: 'In a run', check: r => (r.feats?.bestHit ?? 0) >= A.mercyRule },

  squeakyClean: { name: 'Squeaky Clean', goal: 'Finish stage 2 with 0 Board Exposure.', icon: 'cleanHouse', group: 'Clean hands', check: r => r.stage === 2 && r.phase === 'stageComplete' && r.exposure === 0 },
  coolCustomer: { name: 'Cool Customer', goal: `Finish stage 3 with Heat under ${A.coolCustomer}.`, icon: 'cleanImage', group: 'Clean hands', check: r => r.stage === 3 && r.phase === 'stageComplete' && r.heat < A.coolCustomer },
  aboveBoard: { name: 'Above Board', goal: 'Win the game without skimming.', icon: 'expenseAccount', group: 'Clean hands', check: r => won(r) && r.stats.skims === 0 },

  leanMachine: { name: 'Lean Machine', goal: `Win the game with ${A.leanMachine} cards or fewer.`, icon: 'restructure', group: 'The deck', check: r => won(r) && r.deck.length <= A.leanMachine },
  paperTrail: { name: 'Paper Trail', goal: `Destroy ${A.paperTrail} cards in one run.`, icon: 'paperShredder', group: 'The deck', check: r => (r.tally?.destroyed ?? 0) >= A.paperTrail },

  dynasty: { name: 'Dynasty', goal: `Win the game with ${A.dynasty} gold or more.`, icon: 'inheritance3', group: 'Collecting', check: r => won(r) && r.gold >= A.dynasty },
  fluentInSpin: { name: 'Fluent in Spin', goal: 'Unlock every term in the glossary.', icon: 'pressOffice', group: 'Collecting' },
  fullCabinet: { name: 'Full Cabinet', goal: 'Earn all nine badges.', icon: 'payDividend', group: 'Collecting' },

  shortCareer: { name: 'Short Career', goal: 'Go bankrupt in the first round.', icon: 'iou', group: 'Failures', check: r => lostTo(r, 'bankrupt') && r.stage === 1 && r.round <= 1 },
  richCompany: { name: 'Rich Company, Poor Chairman', goal: `Be ruined with $${A.richCompany} or more still in the company.`, icon: 'offshoreTrust', group: 'Failures', check: r => lostTo(r, 'ruined') && r.capital >= A.richCompany },
  stoppedClock: { name: 'Stopped Clock', goal: 'Lose at midnight.', icon: 'onFile', group: 'Failures', check: r => lostTo(r, 'midnight') },
}

export const ACHIEVEMENT_KEYS = Object.keys(ACHIEVEMENTS) as AchievementKey[]

/** The achievements this run state meets. */
export function achievedBy(r: Run): AchievementKey[] {
  return ACHIEVEMENT_KEYS.filter(k => ACHIEVEMENTS[k].check?.(r))
}
