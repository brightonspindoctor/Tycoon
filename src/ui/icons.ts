// Card and item art. Art not drawn yet borrows an existing one
// until the new file lands in public/art/icons (delete a line here once it does).
import type { Icon } from '../engine/data'

const STAND_IN: Partial<Record<Icon, Icon>> = {
  // stage 4: still to be drawn
  compensationClaim: 'iou',
  lobbyist: 'onThePayroll',
  strategicReserve: 'rig4',
  prAgency: 'propaganda',
  fossilSubsidy: 'worldBank',
  offshoreTrust: 'offshore',
}

export const iconUrl = (icon: Icon | string) => `${import.meta.env.BASE_URL}art/icons/${STAND_IN[icon as Icon] ?? icon}.png`
