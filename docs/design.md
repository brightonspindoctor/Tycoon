# Tycoon: design

## The idea
A solo roguelike deckbuilder in the style of Slay the Spire. You are the head of a harmful industry, from the 1860s to today. The message: corruption wins for big tycoons, and it is very hard for anyone to stop them. The tension in every turn is how much money to take for yourself and how much to leave in the company.

## Industries
Unlocked one after another: **Oil → Fishing → Pharma → Tech**, then a hidden fifth path, the **eco-warrior**, who plays against the tycoons. Only Oil exists so far.

## Structure
- 4 stages × 4 rounds. Round 4 of each stage is a boss. A shop follows every round (there is none before round 1: picking a starting bonus goes straight into the first fight); the shop after a boss has a new card pool.
- Rounds get harder: round 1 one threat (weaker pool); round 2 one threat and a modifier; round 3 two threats; round 4 the boss.
- Stages are eras, and the whole look changes: Victorian (1860s–90s), Art Deco (1900s–30s), mid-century (1940s–70s), corporate greenwash (1980s–now). Cards keep the look of the era they came from.
- Money gets a unit per stage but keeps its value: $15 → $15K → $15M → $15B.
- Each stage adds one meter that lasts only for that stage, and leaves a residue item behind:
  - Stage 1: none. Capital only.
  - Stage 2: Board Exposure (skimming raises it; full = ousted).
  - Stage 3: Heat (costs Capital each turn; full = broken up).
  - Stage 4: The Truth vs Influence (The Truth advances every turn; full = stranded).
- From stage 2, some enemies attack your personal fortune. Below 0 gold you lose.

## Two currencies
- **Capital ($)**: the company's money and your health. At $0 you are bankrupt.
- **Gold**: your personal fortune and your score. Skimming turns $ into gold at a rate that rises each round ($1, $2, $3, $4 per gold in stage 1). Gold buys nothing.
- A score is only recorded if you finish all four stages as Chairman.

## Stage 1 rules (as built)
- Start: $15 Capital, 0 gold, 2 AP a turn, a hand of 5 (each turn you draw back up to 5; cards left in hand, such as an IOU or a Margin Call, take a slot), Bank Debt −$1 a turn (loans raise it), storage for 3 oil.
- Prospect (2 AP) claims 2 plots and puts 2 Well cards in your hand. They join your deck: build them now, or they are discarded at end of turn and come back in a later hand. Maximum 5 plots, filled in order 1–5. Once all 5 are claimed, Prospect still gives 2 Well cards while any plot is empty.
- A Well card (1 AP) builds a Well on the next free plot and is used up. A Well pumps 1 oil a turn and runs dry after 6 barrels (Wildcat: 2 a turn, 8 barrels); the plot then frees up for a new Well. Oil pumped while storage is full is lost but still drains the Well.
- Sell oil (1 AP) sells the whole stockpile. Oil carries over between rounds. Sell a Well (1 AP) for $5.
- Enemies have **Hold** (health). Attack cards deal Hold damage by family; enemies are weak to some families (double damage) and resist others (half).
- Starting deck (10): Prospect, Hired Hand ×2, Lawyer Up, Shore Up, Bucket of Water ×2, Improve Gear ×2, Hard Graft.
- Starting bonus (pick one): Extra Prospect, 3 Oil, Petty Cash (skim 1 gold, 0 AP, 3 uses), Improve Gear + Hard Graft.
- Junk: Loose Thread (must play, −$1), Bad Blood (unplayable; 1 in 3 chance of fire while in hand), Margin Call (must play, −$2), IOU (−$1 a turn until cleared).

### Fire (a hazard, not an enemy)
Starts in the stockpile. Each end of turn it burns oil equal to its intensity (1–3); with no oil it destroys the highest-numbered Well. Pumps stop while it burns. It can't touch Capital. Put it out with water, or cut a Firebreak at Plot 2 (2 AP, lose that Well) to save Plot 1. Sources: Claim Jumper (when beaten), Strike (round 3), Bad Blood, the Baron.

### Enemies
Round 1 is always a cash enemy (it drains your money), round 2 always an engine enemy (it breaks your Wells, cards or turns), round 3 one of each at once, and round 4 the boss.

| Enemy | Role | Hold | Weak | Resists | Cycle | Notes |
|---|---|---|---|---|---|---|
| Blowout | Engine | 5 | Fix | Muscle | Rumble → Spray → Blow | Cap the Well (1 AP) for 3 damage; beaten = +3 oil |
| Strike | Engine | 8 | Muscle | Legal | Picket → Sabotage (+ Torch in R3) | Moves first: Walkout (−1 AP). Muscle adds Bad Blood |
| Bank Inspector | Cash | 6 | Legal | Muscle (0) | Audit → Fine | Ending a turn with $12+ costs him 2 Hold; beaten = 2 Loose Threads |
| Railroad Agent | Cash | 7 | Legal | Muscle | Raise Rates → Refuse | Freight charge per oil sold |
| Claim Jumper | Engine | 6 | Muscle | Legal | Jump → Scout | Moves first: Scout. Beaten = Fire (2) |
| Speculator | Cash | 6 | Legal | Muscle | Short → Margin Call → Rumours (+ IOU in R3) | Beaten = price recovers |
| **Rival Baron** (boss) | Boss | 20 | Dirty | Legal | Sabotage → Lease → Arson | Moves first: Arson (1). Ramps each cycle |

Round modifiers: Dry Season, Glut, Hard Rock, Bank Squeeze, Bad Weather, Boomtown.

### Shop
3 cards, an always-stocked Prospect (price rises each time), 1 item, the Cheap Loan, Destroy a card, Reinforce, Reroll, and Skim. Items: Storage Tank, Silo, Steam Pump, Lookout.

## Endings
- Stage 1 Bankrupt · Stage 2 Ousted · Stage 3 Broken up · Stage 4 Stranded.
- Finishing: retire as Chairman, then a reveal of the hidden totals (emissions, years of delay, the patent you buried).

## Later stages (ideas agreed so far)
- Stage 2 shop: draw cards (Telegraph Line, Night Shift, Efficiency Expert, Ticker Tape) and destroy-in-hand cards (Streamline, Shred the Files, Scrap for Parts, Clean House). Bosses: the Proxy Fight.
- Stage 3: diversify (plastics, gas, concessions). Boss: the Trust-Buster.
- Stage 4: greenwashing items built on the seven sins of greenwashing; the Breakthrough clean-power card you must bury. Boss: The Truth.
- Mixed cards (Upside and Catch) and forced junk cards appear more as the game goes on.

## Balance
`npm run sim` plays 2,000 runs per starting bonus with a simple bot. Current target: a careful player wins stage 1 about a quarter to a third of the time.
