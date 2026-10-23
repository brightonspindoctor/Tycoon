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
  baronSilo: 1, // beat the Rival Baron once: every later run starts with this much more storage, silently
  siloStorage: 2, // the Land Office's Silo item (the boss reward Silo is separate)
  maxPlots: 5,
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
  badBloodCost: 5, // from stage 3 Bad Blood can't start fires: must play, pay this instead
  inspectorReserve: 12, // end a turn holding this much and the Inspector loses Hold
  inspectorReserveDamage: 2,
  skimRate: { 0: 1, 1: 1, 2: 2, 3: 3, 4: 4 } as Record<number, number>, // $ per gold, by round (stage 1)
  skimRate2: { 0: 10, 1: 10, 2: 12, 3: 14, 4: 16 } as Record<number, number>, // stage 2: the Expense Account card, from $10 a gold
  bossGold: 3, // gold for beating a stage's boss
  // stage 2
  incorporatePicks: 2, // new cards you pick at incorporation, from the offer
  stage2Loan: 10, // offered at incorporation
  stage2LoanDebt: 1, // Bank Debt it adds per turn
  derrickPrice: 6, // the Steel Derrick, a stage 2 Well the Exchange always stocks; rises by derrickStep each time
  derrickStep: 2,
  silo2Price: 12, // the Exchange's Silo: +silo2Storage oil storage, offered every visit
  silo2Storage: 3,
  silo2Max: 2, // at most this many Exchange Silos in stage 2
  stage2Output: 1, // every Well and Field pumps this in stage 2, and none runs dry
  fieldValue: 8, // selling a Field
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
  thinkTankCover: 3, // the Think Tank item (and Clean Image, a free one): Cover at the start of every turn
  auditingFirmCover: 2, // the Auditing Firm: Cover at the start of every turn
  supertankerPrice: 30,
  supertankerCut: 1, // each Supertanker: oil sells this much less
  paperShredderPrice: 35,
  grudgeMarkup: 2, // Board Grudge: every shop item costs this much more
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

  // stage 4 · 2010s · Big Oil · the Truth clock
  oilPrice4: 4,
  maxStorage4: 16, // Strategic Reserves stop here
  strategicReserve: 4, // storage a Strategic Reserve adds
  stage4Fights: 5, // four enemies, then the Truth (round 5); progress still reads out of 16
  stage4HoldStep: 6, // each stage 4 enemy after the first is this much tougher
  worldBankLoan: 30, // offered as you become Big Oil
  worldBankDebt: 2, // a turn
  clearOut: 3, // free destroys as you become Big Oil
  destroyCost4: 15, // stage 4: destroying and upgrading start at least here, and rise by cost3Step
  upgradeCost4: 15,
  rigPrice4: 40,
  clockStart: 1, // the Truth clock: 1 o'clock
  clockMax: 12, // midnight: the run is lost
  skimRate4: { 0: 40, 1: 40, 2: 45, 3: 50, 4: 55, 5: 60 } as Record<number, number>,
  chip4: 4, // every stage 4 enemy move also takes this (3 for the cash enemies)
  warPrice: 10, // while War lasts: oil sells for this...
  warOutput: 1, // ...but only this much is pumped a turn
  cheapGas: 2, // Fracking: oil −$2 for the round
  moratorium: 10,
  subsidies: 6, // Green Alternatives: Hold it regains
  undercut4: 10,
  blowout4: 12, // Deepwater Disaster
  containment: 8, // its Cover the turn after Containment Fails
  cleanupBill4: 12,
  claimCost: 5, // a Compensation Claim: must play, pay this
  windfallGold: 2, // Green Politicians
  freezeGold: 3,
  subpoenaCards: 3, // most cards you can play the turn after a Subpoena
  requisition: 2, // War: oil lost
  pipelineStrike: 12,
  profiteering: 10,
  truthPhaseHold: 25, // each of the Truth's four phases
  seaLevel: 14, // the Truth's attacks, plus truthPerHour for each hour past 1 on the clock as you arrive
  cropFailure: 12,
  asthmaGold: 2, // plus 1 for every truthGoldHours past 1
  truthPerHour: 2,
  truthGoldHours: 4,
  truthTickEvery: 5, // the Truth moves the clock on with every 5th move it makes
  lobbyistAP: 1,
  prAgencyCover: 4,
  subsidyCash: 3,

  destroyCost: 2, // rises by $1 each time (players find out)
  prospectPrice: 3,
  turnLimit: 25,
  claimJumperFires: 1, // fires the Claim Jumper starts as he's beaten
  oilCarriesOver: true,
  // hidden tactics: the bar each one has to clear to earn its badge at the end of a won game
  tactics: {
    quickTurns: 2, // a round won in this many turns or fewer counts towards Blitz
    leanDeckMax: 15, // Lean Operation: the deck you finish with is this size or smaller
    blockWorth: 6, // Fortress: each blocked move counts as this much Cover used
    clockHourWorth: 10, // Spin Doctor: each hour you wind the Truth clock back counts as this much Heat cooled
    earlyHour: 2, // Business as Usual: beat the Truth with the clock at this hour or earlier
    // set on full-game (stage 4) wins: about 6 in 10 earn a badge; the clock badges are yes-or-no, so their bar sets how strongly they win out
    bar: { leanOperation: 10, fortress: 75, oilBaron: 232, spinDoctor: 50, lawyeredUp: 0.61, blitz: 0.24, capturedState: 0.25, oneMinute: 0.5, businessAsUsual: 0.6 },
  },
} as const
