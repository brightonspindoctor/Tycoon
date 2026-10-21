// Every balance number in one place. Change these to tune the game.
export const CONFIG = {
  startCapital: 15,
  startDebt: 1, // Bank Debt per turn; loans raise it
  duplicateCost: 5, // incorporation: the first duplicate costs this; each one after costs 1 more
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
  skimRate2: { 0: 10, 1: 10, 2: 12, 3: 14, 4: 16 } as Record<number, number>, // stage 2: the Expense Account card, from $10 a gold
  bossGold: 3, // gold for beating a stage's boss
  // stage 2
  incorporatePicks: 2, // new cards you pick at incorporation, from the offer
  stage2Loan: 10, // offered at incorporation
  stage2LoanDebt: 1, // Bank Debt it adds per turn
  surveyPrice: 5, // (unused since stage 2 sells Wells instead)
  derrickPrice: 6, // the Steel Derrick, a stage 2 Well the Exchange always stocks; rises by derrickStep each time
  derrickStep: 2,
  silo2Price: 5, // the Exchange's Silo: +silo2Storage oil storage, offered every visit
  silo2Storage: 2,
  silo2Max: 2, // at most this many Exchange Silos in stage 2
  stage2Output: 1, // every Well and Field pumps this in stage 2, and none runs dry
  fieldValue: 8, // selling a Field
  wreckReserve: 3, // a wrecked Field becomes a Well with this many barrels
  exposureMax: 8, // Board Exposure at this: ousted
  exposureHigh: 5, // 5 or more counts as high
  exposureLow: 2, // 2 or less at the end of stage 2: Loyal Directors
  exposureStartCap: 3, // stage 2 starts with 1 Exposure per exposureStartPer gold skimmed in stage 1, up to this
  exposureStartPer: 3,
  quickWinTurns: 3, // win a fight within this many turns (stage 2 on)...
  quickWinDrop: 2, // ...and Board Exposure falls by this much
  dividendCost: 4, // the shop's dividend: $ for −dividendDrop Exposure, once per visit
  dividendDrop: 2,
  upgradeCost: 3, // rises by $1 each time
  muckrakerGold: 1, // the Muckraker's Expose
  headline: 4, // stage 2 cash attacks at round 1 strength; doubled from cashDoubleFrom
  squeeze: 3,
  clawbackCash: 4,
  royaltyPer: 1, // per Well and Field
  hostileBid: 3, // the Proxy Fight, +hostileBidStep each cycle (doubled too: it's round 4)
  hostileBidStep: 1,
  cashDoubleFrom: 2, // the round from which stage 2 cash attacks hit twice as hard
  clawbackGold: 2, // the Clawback Committee, when Exposure is high
  inspectionAP: 2, // the Railroad Commission's Inspection takes this much AP next turn
  leakyTanksShare: 0.25, // Leaky Tanks: all your stored oil, and this share of your Capital
  prorationCap: 2, // production cap under the Railroad Commission's Proration

  // stage 3 · 1970s · Heat
  oilPrice3: 5, // the oil shocks
  heatMax: 100, // Heat at this: the company is broken up
  heatPerAP: 2, // every AP you spend adds this much Heat
  sellAP3: 2, // stage 3: selling oil takes 2 AP
  earthDayHeat: 8, // the Earth Day modifier
  heatPerSkims: 5, // stage 3 starts with this much Heat for every heatSkimsEvery gold skimmed in stage 2...
  heatSkimsEvery: 3,
  heatStartCap: 15, // ...up to this
  thinkTankCover: 3, // the Think Tank item: Cover at the start of every turn
  destroyCost3: 10, // stage 3: destroying and upgrading start at least here, and rise by cost3Step
  upgradeCost3: 10,
  cost3Step: 5,
  rigPrice: 30, // an Offshore Rig, built straight from the shop; rises by rigStep each time
  rigStep: 10,
  rigOutput: 2, // every Rig pumps this and never runs dry
  rigValue: 10, // selling a Rig
  maxStorage: 12, // Supertankers stop here
  supertanker: 4, // storage a Supertanker adds
  handMax: 7, // Rolodexes stop here
  bribeFeedsScandal: 3, // every bribe you pay: a Bribery Scandal on the board gains this much Hold
  lobbyFirmCost: 25, // the Trading Floor's Lobbying Firm: $ for −lobbyFirmDrop Heat, once per visit
  lobbyFirmDrop: 10,
  heatLow: 30, // stage 3 ends at or below this: Clean Image
  heatHigh: 70, // at or above this: On File
  skimRate3: { 0: 20, 1: 20, 2: 24, 3: 28, 4: 32 } as Record<number, number>, // stage 3: the Expense Account, from $20 a gold
  // stage 3 enemies
  slickOil: 2, // the Spill's Slick: stored oil lost
  cleanupBill: 5,
  measureHeat: 5, // Climate Science
  publishHeat: 8,
  consensusHeat: 10, // round 3 only
  peerReview: 3, // Hold it regains
  undercut: 4, // Rival Companies
  poachContracts: 6,
  runningCosts: 4, // Diversified Assets
  writeDown: 8,
  leakGold: 1, // the Bribery Scandal
  hearing: 5,
  exposeCash: 8, // the Bribery Scandal's Exposé
  indictGold: 2, // round 3 only
  genevaOpening: 6, // the Geneva Climate Summit: Heat as it opens
  testimonyHeat: 8, // Expert Testimony, +testimonyStep each cycle
  testimonyStep: 4,
  resolutionCash: 6, // Resolution, +resolutionStep each cycle
  resolutionStep: 2,
  personalGuaranteeCash: 6,
  dipTrustCash: 20,
  dipTrustGold: 3,

  destroyCost: 2, // rises by $1 each time (players find out)
  prospectPrice: 3,
  turnLimit: 25,
  claimJumperFires: 1, // fires the Claim Jumper starts as he's beaten
  oilCarriesOver: true,
  // hidden tactics: the bar each one has to clear to earn its badge at the end of a won game
  tactics: {
    quickTurns: 2, // a round won in this many turns or fewer counts towards Blitz
    leanDeckMax: 14, // Lean Operation: the deck you finish with is this size or smaller
    blockWorth: 6, // Fortress: each blocked move counts as this much Cover used
    bar: { leanOperation: 8, fortress: 32, oilBaron: 130, spinDoctor: 44, lawyeredUp: 0.5, blitz: 0.3 },
  },
} as const
