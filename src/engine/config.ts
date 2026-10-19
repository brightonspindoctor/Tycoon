// Every balance number in one place. Change these to tune the game.
export const CONFIG = {
  startCapital: 15,
  startDebt: 1, // Bank Debt per turn; loans raise it
  trustFundDebt: 0, // the Trust Fund bonus starts debt-free
  trustFundUnlock: 3, // runs lost in stage 1 before the Trust Fund is offered
  baseAP: 2,
  handSize: 5,
  oilPrice: 3,
  startStorage: 3,
  maxPlots: 5,
  plotsPerProspect: 2,
  wellCardsPerProspect: 2,
  wellReserve: 6, // barrels a Well pumps before it runs dry
  wildcatReserve: 8,
  sellWellValue: 5,
  firebreakPlot: 1, // index: Plot 2
  firebreakAP: 2,
  capWellDamage: 3,
  fireMax: 3,
  badBloodFireChance: 1 / 3,
  inspectorReserve: 12, // end a turn holding this much and the Inspector loses Hold
  inspectorReserveDamage: 2,
  skimRate: { 0: 1, 1: 1, 2: 2, 3: 3, 4: 4 } as Record<number, number>, // $ per gold, by round
  destroyCost: 3,
  prospectPrice: 3,
  turnLimit: 25,
  oilCarriesOver: true,
} as const
