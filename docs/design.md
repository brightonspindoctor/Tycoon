# Tycoon: design

## The idea
A solo roguelike deckbuilder in the style of Slay the Spire. You are the head of a harmful industry, from the 1860s to today. The message: corruption wins for big tycoons, and it is very hard for anyone to stop them. The tension in every turn is how much money to take for yourself and how much to leave in the company.

## Industries
Unlocked one after another: **Oil → Fishing → Pharma → Tech**, then a hidden fifth path, the **eco-warrior**, who plays against the tycoons. Only Oil exists so far.

## Structure
- 4 stages × 4 rounds. Round 4 of each stage is a boss. A shop follows every round (there is none before round 1: picking a starting bonus goes straight into the first fight); the shop after a boss has a new card pool.
- Rounds get harder: round 1 one threat (weaker pool); round 2 one threat and a modifier; round 3 two threats; round 4 the boss.
- Stages are eras, and the whole look changes: Victorian (1860s–90s), Art Deco (1900s–30s), 1970s flower power (1971–79), corporate greenwash (1980s–now). Cards keep the look of the era they came from.
- Money gets a unit per stage but keeps its value: $15 → $15K → $15M → $15B.
- Each stage adds one meter that lasts only for that stage, and leaves a residue item behind:
  - Stage 1: none. Capital only.
  - Stage 2: Board Exposure, 0 to 8 (5+ is high; 8 = ousted).
  - Stage 3: Heat, 0 to 100 (every AP adds 2; 100 = broken up).
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
- Beating the Baron gives a lasting item of a **different type** from the one bought (never the Steam Pump: no third AP from a boss): Dividends (a card: +$3 each play), Silo (+4 storage) or Drilling Rights (2 Well cards).

### After each round
A card is offered (weighted by rarity, like the shop): take it into your deck or turn it down for $3. What happens when an enemy is beaten is not shown in advance.

### Cards changed in play-testing
- Send a Telegram: the random attack card it adds costs no AP (any $ cost still applies). It's gone at the end of the turn.
- Shore Up: stop one enemy's next move this turn; only one Shore Up per round, however many you own (with two enemies, you choose). The move is skipped; the enemy's cycle carries on.
- Lawyer Up deals 3 (was 4). Bribe the Sheriff: pay $2, 5 Hold. Hired Hand and Pay Wages are Dirty.
- Pay Wages: pay $2, remove 4 Hold (Dirty). Costs $1 to buy. No card is tied to one enemy; enemy weaknesses and resistances decide what works.
- Hard Graft (+1 AP, 0 AP to play) can be played once per round: it then sits out until the next round. It is never destroyed. It can be bought ($4).
- **Bribe** ($4): pay 1 gold from your fortune; 50% chance of 4 Hold (Dirty, so doubled against the Strike, Claim Jumper and Baron), otherwise it is refused and adds Bad Blood.
- Enemies that move first show what they opened with on turn 1, above their next move.

### Settings during a run
The gear on the board and in the Land Office opens Settings (volume, sound, enemy-turn replay) plus Quit run, which asks to confirm, records the run as "Quit" in history and returns to the title. A quit neither counts towards nor breaks the Trust Fund losing streak.

### First run
Before your first run ever, after picking a starting bonus, a screen stamps out the game in four lines (Prospect fields. Build wells. Sell oil. Grow your capital.) with a Begin button. It never shows again.

### The enemy turn
When you end your turn, everything that happens is played back on a ticker tape, one line at a time, with the enemy (or fire, stockpile, ledger or draw pile) it concerns lit up: unplayed Must play cards, fire, each enemy's move (or "Stopped"), fines, then the new turn's debt, pumping, any reshuffle (with a riffle animation) and "Your move". Rounds open the same way. Tap to hurry, Skip to jump ahead; Settings sets it to Play it out, Fast or Off.

### Fire (a hazard, not an enemy)
Fire is counted as a number of fires (up to 3); new outbreaks add to it. Each end of turn every fire burns 1 oil from the stockpile; with no oil it destroys the highest-numbered Well. Pumps stop while it burns. It can't touch Capital. A Bucket of Water puts out one fire and never wears out; Fire Brigade puts out every fire. Or cut a Firebreak (2 AP): lose your weakest Well (lowest output, then fewest barrels left) and every fire goes out. Sources: Claim Jumper (when beaten), Strike (round 3), Bad Blood, the Baron. A round never ends with a fire burning: if you beat the last enemy while one burns (the Claim Jumper and the Saboteur start one as they go), you keep taking turns, with debt and the fire doing their work and no enemy moves, until it is out.

### Enemies
Only a few enemies resist a kind of card (the Railroad Agent and the Baron); the Blowout is immune to Legal. Rumble shakes your highest stable Well, and only hits an already-unstable one when none are stable. Round 1 is always a cash enemy (it drains your money), round 2 always an engine enemy (it breaks your Wells, cards or turns), round 3 one of each at once, and round 4 the boss.

| Enemy | Role | Hold | Weak | Resists | Cycle | Notes |
|---|---|---|---|---|---|---|
| Blowout | Engine | 5 | — | Legal (immune) | Rumble → Spray → Blow | Beaten = +3 oil |
| Strike | Engine | 8 | Dirty | — | Picket (lose $2) → Sabotage (a random Well) (+ Torch in R3) | Moves first: Walkout (−1 AP) |
| Bank Inspector | Cash | 6 | Legal | Dirty (immune) | Audit → Fine | Ending a turn with $12+ removes 2 of his Hold; beaten = 2 Loose Threads |
| Railroad Agent | Cash | 7 | — | Legal | Raise Rates → Refuse | Owns the railway: freight is her toll per barrel sold, and Raise Rates adds $1 to it |
| Claim Jumper | Engine | 6 | Dirty | — | Jump → Scout | Moves first: Scout. Beaten = 1 fire |
| Speculator | Cash | 7 | Legal | — | Short → Margin Call → Rumours (+ IOU in R3) | Beaten = price recovers |
| **Rival Baron** (boss) | Boss | 20 | Dirty | Legal | Sabotage (a random Well) → Lease → Arson | Moves first: Arson (1). Arson grows each cycle |

Round modifiers: Dry Season, Glut, Hard Rock, Bank Squeeze, Bad Weather, Boomtown.

### Shop
3 cards, one Prospect and one Bucket of Water ($2) per visit (they then sell out; Prospect's price rises quietly), Destroy a card from $2 (rises quietly by $1 each time), no hint of the next enemy, 1 item, the Cheap Loan, Destroy a card, Reroll, and Skim. Items: Storage Tank, Silo, Steam Pump, Accountant ($4: Cover you don't use carries over to the next turn within a round; Cover is used up as it blocks, and resets every round).

## Stage 2 rules (as built) · 1901–1930 · Technical race · Art Deco
### Incorporation (between stages)
Beating the Baron pays **3 gold** (every boss does). Then the company incorporates:
- A page-turn transition: the Victorian ledger page lifts away, the year rolls 1890 → 1901, INCORPORATED is stamped (tap to skip). Then the Incorporated screen.
- Every standing Well becomes a **Field**: 1 oil a turn, never runs dry. Unstable is cleared. A Field, like any stage 2 Well, sells for $8.
- **Prospecting is over.** Every Prospect left in your deck becomes a **Worn Prospect** (2 AP: 1 Well card). A **Steel Derrick**, a **Pay a Dividend** and an **Expense Account** join your deck.
- The bank offers a **10K loan**: +$10K now, Bank Debt +$1K a turn for good. Take it or leave it.
- You can **upgrade** cards (from $3, rising $1 each time; once per card) and **destroy** cards (the usual rising price).
- Board Exposure starts at 1 for every 3 gold skimmed in stage 1, up to 3.
- The Trust Fund's debt relief ends: normal Bank Debt from here.

### Economy
- Oil sells at **$4** (the motor car arrives).
- **Every Well pumps 1 oil and never runs dry** in stage 2, old Well and Wildcat cards included. A Well card claims a new plot if none is empty (5 plots at most).
- **Skimming is a card**: the Expense Account (0 AP, pay the rate for 1 gold, +1 Exposure; $5 in the shop). The rate starts at $10 a gold and rises each round: $10, $10, $12, $14, $16. The Exchange has no skim buttons.
- **Fire only burns oil** and stops the pumps; it never destroys a Well or Field. With no oil left, one fire dies down each turn.
- The shop is **The Exchange**. It always offers a **Silo** ($5: +2 oil storage, once a visit, 2 in the whole stage), **Duplicate a card** (a second copy, upgrade and all, for the card's shop price; once a visit), and sells **only stage 2 cards**, stronger and dearer than stage 1's ($4–8). Its staples: a **Steel Derrick** (a Well) one per visit from $6, rising $2 each time. It sells no fire card: you put fires out with the water cards you brought from stage 1.
- Exchange extras: **Upgrade a card**, and **Pay dividends** ($4: Exposure −2, once per visit). No Cheap Loan.
- Items (stage 2 only; the stage 1 items stay in stage 1): Refinery ($10: oil +$1), Offshore Account ($5: enemies take 1 less gold), Pumping Station ($12: +1 AP a turn), Press Office ($9: Exposure −1 as each round begins), Filling Stations ($8: +$1 a turn), Auditing Firm ($6: unused Cover carries over).

### Board Exposure (0 to 8)
- **Rises:** +1 per Expense Account or Petty Cash skim, Shred the Files and Industrial Espionage, +1 when a round ends with less Capital than it started (a bad quarter), and from enemies.
- **Falls:** winning a fight within 3 turns (−2, the boss included), Pay a Dividend card (−1; upgraded −2), the Exchange's dividends (−2), +Capital over a round (a good quarter, −1), beating the Muckraker or the Clawback Committee (−1). The quarter check doesn't apply after the boss.
- **High at 5+:** the Clawback Committee takes gold instead of cash.
- **At 8: ousted.**
- **Residue** at the end of stage 2: 5+ leaves **Board Grudge** (the board takes $1 every shop visit); 2 or less leaves **Loyal Directors** (+1 AP in boss fights). Both apply from stage 3.

### Your fortune
From stage 2 some enemies take gold. **Below 0 gold you're ruined** (run over). Personal Lawyer blocks the next gold taken that turn; Offshore Account takes 1 off each theft.

### Upgrades
Each card can be upgraded once (shown with a +). Attacks hit harder (Hired Hand 3, Lawyer Up 5, Pay Wages 6, Dynamite 9, Patent Thicket 7, Espionage 8, Poach 4), Bribe the Sheriff loses its Bad Blood, Bribe lands 75%, Shore Up adds 2 Cover, Bucket puts out 2 fires, Fire Brigade/Streamline/Clean House/Rotary Rig/Personal Lawyer cost 0 AP, Improve Gear is free for 4 Cover, Hard Graft gives +2 AP, Petty Cash stops raising Exposure, Dividends pays $5, Telegram costs $1, draw cards draw one more, Night Shift gives +3, Scrap for Parts pays $2, Shred the Files stops raising Exposure, R&D Sprint makes 2 per Field, Pay a Dividend takes 2, a Worn Prospect claims a plot again, Prospect and Survey cost 1 AP.

### Stage 2 cards (Exchange pool)
| Card | Cost | Effect |
|---|---|---|
| Telegraph Line | 0 AP | Draw 1 |
| Ticker Tape | 1 AP | Draw 2. Oil +$1 this turn |
| Night Shift | 0 AP | +2 AP now, −1 AP next turn |
| Efficiency Expert | 1 AP, $2 | Draw 3 |
| Streamline | 1 AP | Destroy a card in hand (you choose) |
| Shred the Files | 0 AP | Destroy a card in hand. +1 Exposure |
| Scrap for Parts | 0 AP | Destroy a card in hand. +$2 |
| Clean House | 1 AP | Destroy every junk card in hand, draw that many |
| Patent Thicket | 1 AP, $2 | Legal, remove 7 Hold |
| Industrial Espionage | 1 AP | Dirty, remove 9 Hold. +1 Exposure |
| Poach an Engineer | 1 AP | Dirty, remove 5 Hold. Draw 1 |
| R&D Sprint | 1 AP | +1 oil from every Well and Field now |
| Security Detail | 1 AP | Block one enemy move, +2 Cover. Once per round |
| Insurance Policy | 1 AP, $1 | +5 Cover |
| Expense Account | 0 AP | Skim: pay the rate, 1 gold, +1 Exposure |
| Pay a Dividend | 1 AP, $3 | −1 Exposure |
| Personal Lawyer | 1 AP | Block the next gold an enemy takes this turn |
Destroy cards can be played even with a Must play card in hand (so they can destroy it). Shop prices run $4–8. The Rotary Rig is no longer sold (every stage 2 Well already lasts).

### Stage 2 enemies
| Enemy | Role | Hold | Weak | Resists | Cycle | Notes |
|---|---|---|---|---|---|---|
| The Muckraker | Cash | 11 | Legal | — | Dig (+1 Exposure) → Expose (−1 gold) → Headline (−$4; −$8 from round 2) (+ Front Page: +2 Exposure in R3) | Beaten: −1 Exposure |
| The Combine | Cash | 11 | — | Legal | Price War (oil −$1) → Rail Deal (freight +$1: you get $1 less a barrel sold) → Squeeze (−$3; −$6 from round 2) → Hired Muscle (Bad Blood in your next hand) | Beaten: prices and freight recover |
| The Clawback Committee | Cash | 10 | Dirty | — | Clawback → Clawback (each −$4, −$8 from round 2; or −2 gold at 5+ Exposure) → Minutes (+1 Exposure) | 2 Cover every turn (blocks 2 of your damage; never stacks). Beaten: −1 Exposure |
| The Patent Holder | Engine | 12 | Legal | — | Cease and Desist (must-play card in your next hand: 1 AP, does nothing) → New Patent Claim (an unplayable card takes a slot in your next hand) → Royalty (−$1 per Well/Field; −$2 from round 2) | |
| The Saboteur | Engine | 10 | Dirty | — | Wreck (destroys the marked Field or Well) → Lit Fuse (Bad Blood in your next hand) → Infiltrate (marks your best Field) | Moves first: Infiltrate. Beaten: starts a fire |
| The Railroad Commission | Engine | 8 (a weak enemy) | Dirty | — | Proration (next turn pump 2 at most) → Inspection (−2 AP next turn) → Leaky Tanks (lose all stored oil and 25% of Capital) | |
| **The Proxy Fight** (boss) | Boss | 26 | Legal | Dirty | Hostile Bid (−$6, +$2 each cycle) → Proxy Meeting (does nothing) → The Vote (+1 Exposure, +1 each cycle) | Moves first: Canvass (+1 Exposure) |
Round 2 modifiers in stage 2: Glut, Hard Rock, Bank Squeeze, Bad Weather, Boomtown, Scandal (+1 Exposure). Dry Season is stage 1 only.

## Stage 3 rules (designed, not built) · 1971–1979 · Diversifying · 1970s flower power
### Incorporation (between stages)
- Beating the Proxy Fight pays 3 gold. Board Grudge or Loyal Directors carries over.
- A page-turn transition, 1930 → 1971, stamped MULTINATIONAL.
- Every Field becomes a **Rig**: 2 oil a turn, never runs dry. 5 Rigs at most; Fields over 5 sell for $8M each.
- **No Bank Debt** in stage 3. The only clock is Heat.
- Heat starts at 0, +5 for every 3 gold skimmed in stage 2, up to 15.
- **Fading:** Bucket of Water and Fire Brigade become **Dead Weight** (unplayable, takes a hand slot). Well cards, Steel Derricks, Surveys and Worn Prospects become **Dry Lease** (1 AP, does nothing). Pay a Dividend becomes Heat −3. Stage 1 and 2 attacks keep their strength; stage 3 enemies are simply far tougher.
- **Bury Evidence**, **Lobbying** and **Buy Out** join your deck.
- Upgrade and destroy cards, as in stage 2. In stage 3 a card can be upgraded **twice** (++).

### Economy
- Oil sells at **$5M**. **Selling oil costs 2 AP.** Storage tops out at 12, so one sale pays $60M at most before boosts.
- Skimming (Expense Account) costs **$30M a gold**, rising $30M, $30M, $35M, $40M, $45M by round.
- The shop is **the Trading Floor**: a **Rig** every visit (from $30M, +$10M each time, built at once, 5 at most), 3 stage 3 cards, 1 item, Destroy (from $10M, +$5M), Upgrade (from $10M, +$5M), Duplicate, Reroll, and **Lobby Congress** ($25M: Heat −10, once a visit).
- **Oil Shock** ($15M, the shop sells only one per run): a single-use card, 0 AP. Your next sale this turn pays double.

### Heat (0 to 100)
- Every AP spent adds 2 Heat. Climate Science, the Spill, the Bribery Scandal and the boss add Heat directly. Lobby cards take it away.
- **At 100: broken up.** Heat never resets within the stage.
- **Residue:** 70+ at the end of stage 3 leaves **On File** (The Truth starts 1 step further on); 30 or less leaves **Clean Image** (the first greenwash card each round costs 1 less).

### Damage kinds
Legal and Dirty as before, plus **Lobby** (every Lobby card also lowers Heat) and **Buy Out** (paid in Capital).

### Stage 3 cards
| Card | Cost | Effect |
|---|---|---|
| Bury Evidence | 1 AP | Dirty, remove 7 Hold |
| Legal Team | 1 AP, $3M | Legal, remove 8 Hold |
| Lobbying | 1 AP, $5M | Lobby, remove 10 Hold. Heat −6 |
| Campaign Contribution | 0 AP, 1 gold | Lobby, remove 8 Hold. Heat −3 |
| Buy Out | 1 AP, $8M | Buy Out, remove 14 Hold |
| Embargo Rumours | 1 AP | Oil +$1M a barrel this turn |
| Queues at the Pump | 2 AP | Oil +$2M a barrel for the rest of the round |
| Telex | 1 AP | Draw 3 |
| Memo | 1 AP | Discard any number of cards, draw that many +1 |
| Restructure | 1 AP | Destroy a card in hand, draw 1. Upgrades into Write It Off |
| Write It Off | 1 AP | Destroy a card in hand, +$2M |
| Personal Guarantee | 1 AP | −1 gold, +$6M |
| Dip into the Trust | 0 AP | −3 gold, +$20M. Single use |
| Oil Shock | 0 AP | Your next sale this turn pays double. Single use; one per run |
Ticker Tape carries over from stage 2. Second upgrades repeat the first upgrade's gain.
Items: Rolodex (+1 hand size, 7 at most), Paper Shredder (once a round, destroy a card in hand for free), Supertanker (+4 storage).

### Stage 3 enemies
| Enemy | Role | Hold | Weak | Resists | Cycle | Notes |
|---|---|---|---|---|---|---|
| The Spill | Engine | 29 | Buy Out | Legal | Slick (lose all stored oil) → Cameras (+6 Heat) → Clean-up Bill (−$6M; −$10M from round 2) | Moves first: Leak (one Rig pumps nothing next turn) |
| The Rival Company | Cash | 30 | Buy Out | Dirty | Price War (oil −$1M this round) → Undercut (−$5M; −$9M from round 2) → Poach (a card in your next hand costs 1 more AP) | Beaten by a Buy Out: Merger, a free Rig if there's room |
| Climate Science | Engine | 31 | Dirty | Buy Out (immune) | Measure (+4 Heat) → Publish (+6 Heat, +2 each cycle) → Inconvenient Data (must play: 1 AP, does nothing) | Beaten: Heat −5 |
| Diversified Assets | Cash | 27 | Legal | — | Acquisition (a Subsidiary joins your deck: must play, 0 AP, −$2M) → Losses (−$4M; −$8M from round 2) → Board Meeting (−1 AP next turn) | Each card you destroy while it's in play removes 3 of its Hold. Beaten: +$10M |
| The Bribery Scandal | Cash | 28 | Legal | Lobby | Leak (−1 gold) → Hearings (+5 Heat) → Indictment (−2 gold) | Every gold you spend while it's in play adds 2 Hold |
| **The Geneva Climate Summit** (boss) | Boss | 47 | Lobby | Buy Out (immune) | Expert Testimony (+6 Heat, +2 each cycle) → Draft Declaration (must play: 2 AP, does nothing) → Resolution (−$8M, +$4M each cycle) | Moves first: Opening Session (+5 Heat). Beaten: 3 gold and Further Research Needed (The Truth moves more slowly in stage 4's first round) |
Round 2 modifiers: Oil Shock (oil +$2M), Recession (oil −$1M), Windfall Tax (sales pay $1M less a barrel), Earth Day (+8 Heat), Gas Lines (the first sale each turn pays +$1M a barrel).
Before the boss (1 gold): Hush Money (Heat −10), Spare Tanker (+4 storage for the boss round) or Junket (+1 AP on the first boss turn).

## Endings
- Bankrupt (Capital 0) · Ousted (Exposure 8, stage 2) · Ruined (gold below 0, stage 2 on) · Out of time · later: Broken up (stage 3), Stranded (stage 4).
- Stage 1 complete continues into stage 2. Stage 2 complete ends the playtest for now, showing the residue item.
- Finishing: retire as Chairman, then a reveal of the hidden totals (emissions, years of delay, the patent you buried).

## Later stages (ideas agreed so far)
- Stage 4: greenwashing items built on the seven sins of greenwashing; the Breakthrough clean-power card you must bury. Boss: The Truth.
- Mixed cards (Upside and Catch) and forced junk cards appear more as the game goes on.

## Balance
`npm run sim` plays 2,000 runs per starting bonus with a simple bot, through stage 1 and on into stage 2, and reports each round for both. Current target: a careful player wins stage 1 about a quarter to a third of the time; the bot beats stage 2 about a third of the time it gets there, with the Proxy Fight the main wall and about a quarter of stage 2 losses by being ousted.
`npm run fuzz` plays thousands of random runs through both stages checking the rules never reach an impossible state.
**Admin mode** (playtesting): turn it on in Settings (or open the game with `?admin=1`; `?admin=0` turns it off). The title screen then shows **Admin · jump in**: pick stage 1 or 2, where to start (stage 2: incorporation, round 1–3 or the boss), Wells/Fields, Capital, gold, Board Exposure, the bonus and a starter or strong deck. During an admin run, Settings has tools: +10 Capital, +1 gold, Exposure ±1, +1 AP, win the round, and add any card. Admin runs are never recorded in history and don't touch the Trust Fund streak.
Preview pages for design checks: `?preview=incorporate`, `?preview=complete2`, `?preview=crash2`, and any of shop, bossshop, summary, round3, boss with `&stage=2`.
