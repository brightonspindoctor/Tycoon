// Card and item art. Stage 3 art not drawn yet borrows an existing one
// until the new file lands in public/art/icons (delete a line here once it does).
import type { Icon } from '../engine/data'

const STAND_IN: Partial<Record<Icon, Icon>> = {
  infiltrate: 'espionage',
}

export const iconUrl = (icon: Icon | string) => `${import.meta.env.BASE_URL}art/icons/${STAND_IN[icon as Icon] ?? icon}.png`
