// Every piece of art the game asks for is on disk, and the service worker fetches every enemy portrait ahead.
import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync } from 'fs'
import { CARDS, ITEMS, THREATS } from '../src/engine/data'
import { TACTICS } from '../src/engine/tactics'
import { ACHIEVEMENTS } from '../src/engine/achievements'

const STAND_IN: Record<string, string> = { slushFund: 'envelope' } // keep in step with src/ui/icons.ts (this test lives in tools so it can read files)
const icon = (i: string) => `public/art/icons/${STAND_IN[i] ?? i}.png`

describe('art', () => {
  it('every card, item, badge and achievement icon exists', () => {
    const icons = [...Object.values(CARDS), ...Object.values(ITEMS), ...Object.values(TACTICS), ...Object.values(ACHIEVEMENTS)].map(d => d.icon as string).filter(Boolean)
    expect(icons.filter(i => !existsSync(icon(i)))).toEqual([])
  })
  it('every enemy has a portrait, and the service worker precaches it', () => {
    const sw = readFileSync('public/sw.js', 'utf8')
    const portraits = [...new Set(Object.values(THREATS).map(t => t.portrait))]
    expect(portraits.filter(p => !existsSync(`public/art/enemies/${p}.jpg`))).toEqual([])
    expect(portraits.filter(p => !sw.includes(`'${p}'`))).toEqual([])
  })
})
