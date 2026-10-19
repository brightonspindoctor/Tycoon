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
- A Prospect, if you own one, is always in each round's opening hand.
- Prospect (2 AP, single use: it is destroyed once played; buy more at the Land Office) claims 2 plots and puts 2 Well cards in your hand. They join your deck: build them now, or they are discarded at end of turn and come back in a later hand. Maximum 5 plots, filled in order 1–5. Once all 5 are claimed, Prospect still gives 2 Well cards while any plot is empty.
- A Well card (1 AP) builds a Well on the next free plot and is used up. A Well pumps 1 oil a turn and runs dry after 6 barrels (Wildcat: 2 a turn, 8 barrels); the plot then frees up for a new Well. Oil pumped while storage is full is lost but still drains the Well.
- Oil starts at $3 a barrel and never drops below $1, freight included.
- Sell oil (1 AP) sells the whole stockpile. Oil carries over between rounds. Sell a Well (1 AP) for $1 per barrel still in it.
- Enemies have **Hold** (health). Cards remove Hold. There are two kinds, **Legal** and **Dirty**; an enemy can be weak to one (double), resist one (half) or be immune. No card is tied to one enemy.
- Starting deck (9): Prospect, Hired Hand ×2, Lawyer Up, Shore Up, Bucket of Water ×2, Improve Gear, Hard Graft.
- Starting bonus (pick one): Extra Prospect, 3 Oil, Petty Cash (skim 1 gold, 0 AP, 3 uses), Improve Gear + Hard Graft.
- Bailout bonus: **Trust Fund** ($15 and no Bank Debt for stage 1; normal Bank Debt from stage 2). Offered only after 3 runs in a row lost in stage 1 (bankrupt or out of time); finishing stage 1 resets the streak.
- Junk: Loose Thread (must play, 0 AP, −$1), Bad Blood (must play, 0 AP, 1 in 3 chance of a fire, destroyed after 2 plays; Dynamite, Bribe the Sheriff and a refused Bribe put one in your discard pile; Dirty cards alone never do), Margin Call (must play, −$2), IOU (−$1 a turn until cleared).

### Before and after the boss
- After round 3 the Land Office offers one small, single-use item for **1 gold**: A Spare Hand (+1 AP on the first boss turn), Spare Rigs (2 Well cards), Fire Brigade (card), Inheritance (a card: +$5 once) or Temporary Silo (+4 storage for the boss round).
- Beating the Baron gives a lasting item of a **different type** from the one bought: Steam Pump (+1 AP every turn), Dividends (a card: +$3 each play), Silo (+4 storage) or Wildcat Rights (2 Wildcat Well cards).

### After each round
A card is offered (weighted by rarity, like the shop): take it into your deck or turn it down for $3. What happens when an enemy is beaten is not shown in advance.

### Cards changed in play-testing
- Shore Up: stop one enemy's next move this turn (with two enemies, you choose). The move is skipped; the enemy's cycle carries on.
- Lawyer Up deals 3 (was 4). Bribe the Sheriff: pay $2, 5 Hold. Hired Hand and Pay Wages are Dirty.
- Pay Wages: pay $2, remove 4 Hold (Dirty). Costs $1 to buy. No card is tied to one enemy; enemy weaknesses and resistances decide what works.
- Hard Graft (+1 AP, 0 AP to play) can be played once per round: it then sits out until the next round. It is never destroyed. It can be bought ($4).
- **Bribe** ($4): pay 1 gold from your fortune; 50% chance of 4 Hold (Dirty, so doubled against the Strike, Claim Jumper and Baron), otherwise it is refused and adds Bad Blood.
- Enemies that move first show what they opened with on turn 1, above their next move.

### Fire (a hazard, not an enemy)
Fire is counted as a number of fires (up to 3); new outbreaks add to it. Each end of turn every fire burns 1 oil from the stockpile; with no oil it destroys the highest-numbered Well. Pumps stop while it burns. It can't touch Capital. A Bucket of Water puts out one fire and never wears out; Fire Brigade puts out every fire. Or cut a Firebreak (2 AP): lose your weakest Well (lowest output, then fewest barrels left) and every fire goes out. Sources: Claim Jumper (when beaten), Strike (round 3), Bad Blood, the Baron.

### Enemies
Only a few enemies resist a kind of card (the Blowout, the Railroad Agent and the Baron). Round 1 is always a cash enemy (it drains your money), round 2 always an engine enemy (it breaks your Wells, cards or turns), round 3 one of each at once, and round 4 the boss.

| Enemy | Role | Hold | Weak | Resists | Cycle | Notes |
|---|---|---|---|---|---|---|
| Blowout | Engine | 5 | — | Legal | Rumble → Spray → Blow | Beaten = +3 oil |
| Strike | Engine | 8 | Dirty | — | Picket → Sabotage (a random Well) (+ Torch in R3) | Moves first: Walkout (−1 AP) |
| Bank Inspector | Cash | 6 | Legal | Dirty (immune) | Audit → Fine | Ending a turn with $12+ removes 2 of his Hold; beaten = 2 Loose Threads |
| Railroad Agent | Cash | 7 | — | Legal | Raise Rates → Refuse | Owns the railway: freight is her toll per barrel sold, and Raise Rates adds $1 to it |
| Claim Jumper | Engine | 6 | Dirty | — | Jump → Scout | Moves first: Scout. Beaten = 2 fires |
| Speculator | Cash | 7 | Legal | — | Short → Margin Call → Rumours (+ IOU in R3) | Beaten = price recovers |
| **Rival Baron** (boss) | Boss | 20 | Dirty | Legal | Sabotage (a random Well) → Lease → Arson | Moves first: Arson (1). Arson grows each cycle |

Round modifiers: Dry Season, Glut, Hard Rock, Bank Squeeze, Bad Weather, Boomtown.

### Shop
3 cards, one Prospect and one Bucket of Water ($2) per visit (they then sell out; Prospect's price rises quietly), Destroy a card from $2 (rises quietly by $1 each time), no hint of the next enemy, 1 item, the Cheap Loan, Destroy a card, Reinforce, Reroll, and Skim. Items: Storage Tank, Silo, Steam Pump, Lookout.

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
