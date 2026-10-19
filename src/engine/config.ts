// Every balance number in one place. Change these to tune the game.
export const CONFIG = {
  startCapital: 15,
  startDebt: 1, // Bank Debt per turn; loans raise it
  trustFundDebt: 0, // the Trust Fund bonus pays no Bank Debt in stage 1; normal debt from stage 2
  trustFundStreak: 3, // stage 1 losses in a row before the Trust Fund is offered
  baseAP: 2,
  handSize: 5,
  oilPrice: 3, // starting price per barrel
  oilFloor: 1, // the price never drops below this, freight included
  startStorage: 3,
  maxPlots: 5,
  plotsPerProspect: 2,
  wellCardsPerProspect: 2,
  wellReserve: 6, // barrels a Well pumps before it runs dry
  wildcatReserve: 8,
  sellWellValue: 5,
  firebreakAP: 2, // Firebreak: lose your weakest Well, put out every fire
  capWellDamage: 3,
  fireMax: 3, // most fires burning at once
  bucketPrice: 2, // Bucket of Water, always for sale at the Land Office
  shoreUpCover: 1,
  bribeGold: 1, // Bribe: costs this much of your own fortune to play
  bribeChance: 0.5, // chance the bribe is taken
  bribeDamage: 4,
  spoilsCash: 3, // turning down the card offered after a round
  boonGold: 1, // the item offered before the boss costs this much of your fortune
  inheritance: 5, // Inheritance card: $ once, then gone
  dividends: 3, // Dividends card: $ every time it's played
  tempSilo: 4, // Temporary Silo: storage for the boss round only
  badBloodFireChance: 1 / 3,
  inspectorReserve: 12, // end a turn holding this much and the Inspector loses Hold
  inspectorReserveDamage: 2,
  skimRate: { 0: 1, 1: 1, 2: 2, 3: 3, 4: 4 } as Record<number, number>, // $ per gold, by round
  destroyCost: 2, // rises by $1 each time (players find out)
  prospectPrice: 3,
  turnLimit: 25,
  oilCarriesOver: true,
} as const
