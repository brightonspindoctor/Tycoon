// Every balance number in one place. Change these to tune the game.
export const CONFIG = {
  startCapital: 15,
  startDebt: 1, // Bank Debt per turn; loans raise it
  trustFundDebt: 0, // the Trust Fund bonus pays no Bank Debt in stage 1; normal debt from stage 2
  trustFundStreak: 3, // stage 1 losses in a row before the Trust Fund is offered
  baseAP: 2,
  handSize: 5,
  oilPrice: 3, // starting price per barrel
  oilPrice2: 4, // stage 2: the motor car arrives
  oilFloor: 1, // the price never drops below this, freight included
  startStorage: 3,
  maxPlots: 5,
  plotsPerProspect: 2,
  wellCardsPerProspect: 2,
  wellReserve: 6, // barrels a Well pumps before it runs dry
  wildcatReserve: 8,
  sellPerBarrel: 1, // selling a Well pays this for each barrel still in it
  firebreakAP: 2, // Firebreak: lose your weakest Well, put out every fire
  fireMax: 3, // most fires burning at once
  bucketPrice: 2, // Bucket of Water, always for sale at the Land Office
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
  skimRate: { 0: 1, 1: 1, 2: 2, 3: 3, 4: 4 } as Record<number, number>, // $ per gold, by round (stage 1)
  skimRate2: { 0: 4, 1: 4, 2: 5, 3: 6, 4: 7 } as Record<number, number>, // stage 2: the Expense Account card, from $4 a gold
  bossGold: 3, // gold for beating a stage's boss
  // stage 2
  stage2Loan: 10, // offered at incorporation
  stage2LoanDebt: 1, // Bank Debt it adds per turn
  surveyPrice: 5, // (unused since stage 2 sells Wells instead)
  derrickPrice: 6, // the Steel Derrick, a stage 2 Well the Exchange always stocks; rises by derrickStep each time
  derrickStep: 2,
  bucketPrice2: 3, // the Chemical Engine, the Exchange's fire card
  stage2Output: 1, // every Well and Field pumps this in stage 2, and none runs dry
  fieldValue: 8, // selling a Field
  wreckReserve: 3, // a wrecked Field becomes a Well with this many barrels
  exposureMax: 8, // Board Exposure at this: ousted
  exposureHigh: 5, // 5 or more counts as high
  exposureLow: 2, // 2 or less at the end of stage 2: Loyal Directors
  exposureStartCap: 3, // stage 2 starts with 1 Exposure per exposureStartPer gold skimmed in stage 1, up to this
  exposureStartPer: 3,
  dividendCost: 4, // the shop's dividend: $ for −dividendDrop Exposure, once per visit
  dividendDrop: 2,
  upgradeCost: 3, // rises by $1 each time
  muckrakerGold: 1, // the Muckraker's Expose
  clawbackGold: 2, // the Clawback Committee, when Exposure is high
  prorationCap: 2, // production cap under the Railroad Commission's Proration

  destroyCost: 2, // rises by $1 each time (players find out)
  prospectPrice: 3,
  turnLimit: 25,
  oilCarriesOver: true,
} as const
