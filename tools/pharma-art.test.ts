// Every Pharmaceutical card has its icon and every liability its portrait.
import { describe, expect, it } from 'vitest'
import { existsSync } from 'fs'
import { PCARDS, PTHREATS } from '../src/engine/pharma/data'

describe('pharmaceutical art', () => {
  it('every card has its icon and every liability its portrait', () => {
    expect(Object.values(PCARDS).map(d => d.icon).filter(i => !existsSync(`public/art/icons/${i}.png`))).toEqual([])
    expect(Object.values(PTHREATS).map(d => d.portrait).filter(p => !existsSync(`public/art/enemies/${p}.jpg`))).toEqual([])
  })
})
