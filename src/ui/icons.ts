// Card and item art. Stage 3 art isn't drawn yet, so those icons borrow an existing one
// until the new file lands in public/art/icons (delete a line here once it does).
import type { Icon } from '../engine/data'

const STAND_IN: Partial<Record<Icon, Icon>> = {
  embargoRumours: 'tickerTape', queuesAtPump: 'barrels', telex: 'telegraphLine', memo: 'deed', restructure: 'streamline',
  personalGuarantee: 'coins', dipTrust: 'will', buryEvidence: 'shovels', lobbyCongress: 'envelope', thinkTank: 'pressOffice',
  bribeOfficial: 'sheriff', retainCounsel: 'personalLawyer', deadWeight: 'timber', dryLease: 'plot', draftDeclaration: 'redtape',
  rolodex: 'efficiencyExpert', paperShredder: 'shredFiles', supertanker: 'barrels', rig: 'derrick',
}

export const iconUrl = (icon: Icon | string) => `${import.meta.env.BASE_URL}art/icons/${STAND_IN[icon as Icon] ?? icon}.png`
