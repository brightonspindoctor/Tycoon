# Tycoon: design

## The idea
A solo roguelike deckbuilder in the style of Slay the Spire. You are the head of a harmful industry, from the 1860s to today. The message: corruption wins for big tycoons, and it is very hard for anyone to stop them. The tension in every turn is how much money to take for yourself and how much to leave in the company.

## Industries
Unlocked one after another: **Oil → Big Pharma → Fishing → Tech** (Big Pharma is shown as Coming soon from the start), then a hidden fifth path, the **eco-warrior**, who plays against the tycoons. Only Oil exists so far.

## Structure
- 4 stages × 4 rounds. Round 4 of each stage is a boss. A shop follows every round (there is none before round 1: picking a starting bonus goes straight into the first fight); the shop after a boss has a new card pool.
- Rounds get harder: round 1 one threat (weaker pool); round 2 one threat and a modifier; round 3 two threats; round 4 the boss.
- Stages are eras, and the whole look changes: Victorian (1860s–90s), Art Deco (1900s–30s), 1970s flower power (1970–79), 2010s flat-design greenwash (2010–19). Cards keep the look of the era they came from.
- Money gets a unit per stage but keeps its value: $15 → $15K → $15M → $15B.
- Unlocks for every later run on the device (never from admin playtests): beat the Rival Baron once and runs start with 4 storage instead of 3 (silently); beat the Proxy Fight once and **Old Faithful** joins the starting bonuses: a Well that pumps 1, never runs dry, and nothing can target (fires, enemies, Firebreak, selling). It stops pumping in a fire, and becomes a Field and a Rig with the rest.
- Front page: three industry tiles (Oil, Big Pharma as Coming soon, then one sealed), and Run history, Settings, About and a locked **?** button. The **?** becomes the Scoreboard (finished games on this device, best gold first) the first time you win the game. About credits Jonny Sadler and links to buymeacoffee.com/jonnysadler.
- Each stage adds one meter that lasts only for that stage, and leaves a residue item behind:
  - Stage 1: none. Capital only.
  - Stage 2: Board Exposure, 0 to 8 (5+ is high; 8 = ousted).
  - Stage 3: Heat, 0 to 100 (every AP spent adds 2; 100 = broken up).
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
- Bailout bonus: **Trust Fund** ($15 and no Bank Debt for stage 1). Offered only after 3 runs in a row lost in stage 1 (bankrupt or out of time); finishing stage 1 resets the streak.
- Junk: Loose Thread (must play, 0 AP, −$1), Bad Blood (must play, 0 AP, 1 in 3 chance of a fire, destroyed after 2 plays; Dynamite, Bribe the Sheriff and a refused Bribe put one in your discard pile; Dirty cards alone never do), Margin Call (must play, −$2), IOU (−$1 a turn until cleared).

### Before and after the boss
- After round 3 the Land Office offers one small, single-use item for **1 gold**: A Spare Hand (+1 AP on the first boss turn), Spare Wells (2 Well cards; called Spare Rigs and gives 2 Rig cards in stage 3), Fire Brigade (card), Inheritance (a card: +$5 once) or Temporary Silo (+4 storage for the boss round).
- Beating the Baron gives a lasting item of a **different type** from the one bought (never the Steam Pump: no third AP from a boss): Dividends (a card: +$3 each play), Silo (+4 storage) or Drilling Rights (2 Well cards; from the stage 2 boss on, 2 Rig cards instead, so they survive going multinational).

### After each round
A card is offered (weighted by rarity, like the shop): take it into your deck or turn it down for $3. What happens when an enemy is beaten is not shown in advance.

### Cards changed in play-testing
- Send a Telegram: the random attack card it adds costs no AP (any $ cost still applies). It's gone at the end of the turn.
- Shore Up: stop one enemy's next move this turn (with two enemies, you choose). Each copy plays once per round: it then leaves your draw and discard piles and comes back for the next round, so two copies give two blocks a round. The move is skipped; the enemy's cycle carries on.
- Lawyer Up deals 3 (was 4). Bribe the Sheriff: pay $2, 5 Hold. Hired Hand and Pay Wages are Dirty.
- Pay Wages: pay $2, remove 4 Hold (Dirty). Costs $1 to buy. No card is tied to one enemy; enemy weaknesses and resistances decide what works.
- Hard Graft (+1 AP, 0 AP to play) can be played once per round: it then sits out until the next round. It is never destroyed. It can be bought ($4).
- **Bribe** ($4): pay 1 gold from your fortune; 50% chance of 4 Hold (Dirty, so doubled against the Strike, Claim Jumper and Baron), otherwise it is refused and adds Bad Blood.
- Enemies that move first show what they opened with on turn 1, above their next move.
- **Infiltrate** ($4, Common, 2 AP, stage 1 shop): Dirty, remove 3 Hold now, then 2 and 1 more as your next two turns end (before the enemies move; the follow-ups go past enemy Cover). Weakness and immunity apply to every hit, so it's 6/4/2 against the Strike and useless on the Inspector. The enemy shows what's still to land. Upgraded: 4, then 3 and 2. Fair in stage 1, falls behind in stages 2–3.

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
3 cards, one Prospect and one Bucket of Water ($2) per visit (they then sell out; Prospect's price rises quietly), Destroy a card from $2 (rises quietly by $1 each time), no hint of the next enemy, 1 item, the Cheap Loan, Destroy a card, Reroll, and Skim. Items: Storage Tank, Silo (+2 storage), Steam Pump, Accountant ($4: Cover you don't use carries over to the next turn within a round; Cover is used up as it blocks, and resets every round).

## Stage 2 rules (as built) · 1901–1930 · Technical race · Art Deco
### Incorporation (between stages)
Beating the Baron pays **3 gold** (every boss does). Then the company incorporates:
- A page-turn transition: the Victorian ledger page lifts away, the year rolls 1890 → 1901, INCORPORATED is stamped (tap to skip). Then the Incorporated screen.
- Every standing Well becomes a **Field**: 1 oil a turn, never runs dry. Unstable is cleared. A Field, like any stage 2 Well, sells for $8.
- **Prospecting is over.** Every Prospect left in your deck becomes a **Worn Prospect** (2 AP: 1 Well card).
- **Pick 2 new cards** from 4 on offer: Steel Derrick, Pay a Dividend, Patent Thicket and Ticker Tape. The ones you leave go on sale at the first Exchange visit (not said on screen; the Derrick is on sale every visit anyway).
- The **Expense Account** is the card offered after the first stage 2 fight (take it, or turn it down for $3K). It's how you skim from here on.
- **Bank Debt is wiped clean**: everyone starts stage 2 owing nothing a turn. The bank offers a **10K loan**: +$10K now, Bank Debt +$1K a turn for good. Take it or leave it.
- You can **upgrade** cards (from $3, rising $1 each time; once per card), **destroy** cards (the usual rising price) and **duplicate** cards (a second copy, upgrade and all; from $5K, rising $1K each time, as many as you can pay for).
- Board Exposure starts at 1 for every 3 gold skimmed in stage 1, up to 3 (not explained on screen; the meter shows it).
- The screen keeps only the Fields tile, the Exposure meter, the card pick, the loan, upgrade, duplicate and destroy. It no longer explains Wells vs Prospects, gold being at risk or the Expense Account; those show up in play.

### Economy
- Oil sells at **$4** (the motor car arrives).
- **Every Well pumps 1 oil and never runs dry** in stage 2, old Well and Wildcat cards included. A Well card claims a new plot if none is empty (5 plots at most).
- **Skimming is a card**: the Expense Account (0 AP, pay the rate for 1 gold, +1 Exposure; $5 in the shop). The rate starts at $10 a gold and rises each round: $10, $10, $12, $14, $16. The Exchange has no skim buttons.
- **Fire only burns oil** and stops the pumps; it never destroys a Well or Field. With no oil left, one fire dies down each turn.
- The shop is **The Exchange**. It always offers a **Silo** ($12: +3 oil storage, once a visit, 2 in the whole stage), **Duplicate a card** (a second copy, upgrade and all, for the card's shop price; once a visit), and sells **only stage 2 cards**, stronger and dearer than stage 1's ($4–8). Its staples: a **Steel Derrick** (a Well) one per visit from $6, rising $2 each time. It sells no fire card: you put fires out with the water cards you brought from stage 1.
- Exchange extras: **Upgrade a card**, and **Pay dividends** ($4: Exposure −2, once per visit). No Cheap Loan.
- Items (stage 2 only; the stage 1 items stay in stage 1): Offshore Account ($5: enemies take 1 less gold), Press Office ($9: Exposure −1 as each round begins), Filling Stations ($8: +$1 a turn), Auditing Firm ($6: +2 Cover every turn).

### Board Exposure (0 to 8)
- **Rises:** +1 per Expense Account or Petty Cash skim, Shred the Files and Industrial Espionage, +1 when a round ends with less Capital than it started (a bad quarter), and from enemies.
- **Falls:** winning a fight within 3 turns (−2, the boss included), Pay a Dividend card (−1; upgraded −2), the Exchange's dividends (−2), +Capital over a round (a good quarter, −1), beating the Muckraker or the Clawback Committee (−1). The quarter check doesn't apply after the boss.
- **High at 5+:** the Clawback Committee takes gold instead of cash.
- **At 8: ousted.**
- **Residue** at the end of stage 2: 5+ leaves **Board Grudge** (every shop item costs $2 more); 2 or less leaves **Loyal Directors** (+1 AP in boss fights). Both apply from stage 3.

### Your fortune
From stage 2 some enemies take gold. **Below 0 gold you're ruined** (run over). Personal Lawyer blocks the next gold taken that turn; Offshore Account takes 1 off each theft.

### Upgrades
Each card can be upgraded once (shown with a +). Attacks hit harder (Hired Hand 3, Lawyer Up 5, Pay Wages 6, Dynamite 9, Patent Thicket 7, Espionage 8, Poach 4), Bribe the Sheriff loses its Bad Blood, Bribe lands 75%, Shore Up adds 2 Cover, Bucket puts out 2 fires, Fire Brigade/Streamline/Clean House/Personal Lawyer cost 0 AP, Improve Gear is free for 4 Cover, Hard Graft gives +2 AP, Petty Cash stops raising Exposure, Dividends pays $5, Telegram costs $1, draw cards draw one more, Night Shift gives +3, Scrap for Parts pays $2, Shred the Files stops raising Exposure, R&D Sprint makes 2 per Field, Pay a Dividend takes 2, a Worn Prospect claims a plot again, Prospect costs 1 AP.

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
| Security Detail | 1 AP | Block one enemy move, +2 Cover. Each copy once per round |
| Insurance Policy | 1 AP, $1 | +5 Cover |
| Expense Account | 0 AP | Skim: pay the rate, 1 gold, +1 Exposure |
| Pay a Dividend | 1 AP, $3 | −1 Exposure |
| Personal Lawyer | 1 AP | Block the next gold an enemy takes this turn |
Destroy cards can be played even with a Must play card in hand (so they can destroy it). Shop prices run $4–8. The Rotary Rig is gone: Wells become Fields when you incorporate, and every stage 2 Well already lasts.

### Stage 2 enemies
| Enemy | Role | Hold | Weak | Resists | Cycle | Notes |
|---|---|---|---|---|---|---|
| The Muckraker | Cash | 11 | Legal | — | Dig (+1 Exposure) → Expose (−1 gold) → Headline (−$4; −$8 from round 2) (+ Front Page: +2 Exposure in R3) | Beaten: −1 Exposure |
| The Combine | Cash | 11 | — | Legal | Price War (oil −$1) → Rail Deal (freight +$1: you get $1 less a barrel sold) → Squeeze (−$3; −$6 from round 2) → Hired Muscle (Bad Blood in your next hand) | Beaten: prices and freight recover |
| The Clawback Committee | Cash | 10 | Dirty | — | Clawback → Clawback (each −$4, −$8 from round 2; or −2 gold at 5+ Exposure) → Minutes (+1 Exposure) | 2 Cover every turn (blocks 2 of your damage; never stacks). Beaten: −1 Exposure |
| The Patent Holder | Engine | 12 | Legal | — | Cease and Desist (must-play card in your next hand: 1 AP, does nothing) → New Patent Claim (an unplayable card takes a slot in your next hand) → Royalty (−$1 per Well/Field; −$2 from round 2) | |
| The Saboteur | Engine | 10 | Dirty | — | Wreck (destroys the marked Field or Well) → Lit Fuse (Bad Blood in your next hand) → Infiltrate (marks your best Field) | Moves first: Infiltrate. Beaten: starts a fire |
| The Railroad Commission | Engine | 8 (a weak enemy) | Dirty | — | Proration (next turn pump 2 at most) → Inspection (−2 AP next turn) → Leaky Tanks (lose all stored oil and 25% of Capital) | |
| **The Proxy Fight** (boss) | Boss | 46 | Legal | Dirty | Hostile Bid (−$6, +$2 each cycle) → Proxy Meeting (does nothing) → The Vote (+1 Exposure, +1 each cycle) | Moves first: Canvass (+1 Exposure) |
Round 2 modifiers in stage 2: Glut, Hard Rock, Bank Squeeze, Bad Weather, Boomtown, Scandal (+1 Exposure). Dry Season is stage 1 only.

## Stage 3 rules (as built) · 1970–1979 · Diversifying · 1970s flower power
Money is in millions ($M). Rounds are 1970, 1973, 1976 and 1979. The shop is **the Trading Floor**. The look is 1970s flower power: oatmeal paper, espresso ink, burnt orange, mustard and avocado, a rounded brown–orange–mustard stripe under the header (and filling the Heat meter), and Fraunces at 900 with its Soft axis for a Cooper Black feel.

### Going multinational (between stages)
Winning the Proxy Fight pays 3 gold, then a page-turn to 1970 stamped MULTINATIONAL, then the Multinational screen:
- Every Field and Well becomes an **offshore Rig**: 2 oil a turn, never runs dry, sells for $10M. Empty plots go. At most 5 Rigs.
- **Some old cards turn to junk.** Land cards (Prospects, Steel Derricks, Well cards) become **Dry Leases** (1 AP, do nothing, destroyed once played). Fire and board cards (Bucket, Fire Brigade, Pay a Dividend) become **Dead Weight** (unplayable). Shore Up carries over, like Security Detail: both still block a move once per fight. Every other old card works exactly as before, upgrades included; stage 3 enemies are simply far tougher. Bad Blood is gone (no fires in stage 3).
- **Pick 2 new cards** from 4: Bury Evidence, Lobby Congress, Buy Out and Advertorial. The 2 you leave are on sale at the first Trading Floor visit.
- **No Bank Debt** in stage 3, and no loans. Heat is the only clock.
- Heat starts at 0, +5 for every 3 gold skimmed in stage 2 (15 at most).
- Upgrade and destroy cards (from $10M each, rising $5M each time). In stage 3 a card can be **upgraded twice** (++): the second upgrade repeats the first one's gain, if it has a number to grow. Stage 2's residue applies (Board Grudge: every item costs $2M more; Loyal Directors gives +1 AP against the summit).

### Economy
- Oil sells at **$5M**. **Selling oil takes 2 AP.** Storage carries over; Supertankers raise it to 12 at most, so a sale pays about $60M at most before boosts.
- The Trading Floor always offers an **Offshore Rig**, built at once (from $30M, rising $10M each time, one per visit, 5 at most), and a **lobbying firm** ($25M: Heat −10, once per visit). No Silo, no dividends. Upgrade, duplicate and destroy as above. Cards cost $12–22M, items $15–20M.
- Skimming is still the Expense Account: $20M a gold, rising $20M, $20M, $24M, $28M, $32M by round.
- No fires, no Board Exposure. Round 2 modifiers: Glut (oil −$1M), Bad Weather, **OPEC Embargo** (oil +$2M), **Earth Day** (+8 Heat as the round begins).

### Heat (0 to 100)
- **Every AP you spend adds 2 Heat**: cards, selling oil (2 AP, so 4 Heat), selling a Rig. 0 AP cards add none.
- Climate Science and the Geneva Climate Summit add Heat besides that, and Earth Day. **Cover blocks Heat from enemies**, like cash (not the Heat from your own AP).
- **Lobbying takes it down**: Lobby Congress (−6), Fund a Think Tank (−10), the Trading Floor's lobbying firm (−10). A card's own Heat and its AP Heat land together.
- **At 100: broken up.** A blow that wins the round or the stage still counts if it tips Heat over (Heat holds at 99).
- **Residue** at the end of stage 3: 70+ leaves **On File** (The Truth starts 1 step further on in stage 4); 30 or less leaves **Clean Image** (a free Think Tank: +3 Cover every turn, stacking with a bought one). Neither does anything until stage 4 is built.

### Damage kinds
Four damage types: Legal, Dirty, **Bury** (hiding evidence) and **Lobby** (Washington; Lobby cards also cool Heat). Buy Out is a Legal card paid for in Capital. Enemies are weak to, resist or are immune to them.

### Stage 3 cards (Trading Floor pool)
| Card | Cost | Effect | Upgraded |
|---|---|---|---|
| Embargo Rumours | 1 AP | Oil +$1M this turn | 0 AP |
| Queues at the Pump | 2 AP | Oil +$2M for the rest of the round | 1 AP (++: 0 AP) |
| Telex | 1 AP | Draw 3 | Draw 4 (++: 5) |
| Memo | 1 AP | Discard the rest of your hand, draw that many +1 | 0 AP |
| Ticker Tape | 1 AP | (from stage 2) Draw 2, oil +$1M this turn | Draw 3 |
| Restructure | 1 AP | Destroy a card in hand, draw 1 | **Write It Off**: also +$2M |
| Personal Guarantee | 1 AP | Pay 1 gold: +$6M | +$8M |
| Dip into the Trust | 0 AP, one use | Pay 3 gold: +$20M | — |
| Bury Evidence | 1 AP | Bury, remove 6 Hold | 9 (++: 12) |
| Lobby Congress | 1 AP, $6M | Lobby, remove 9 Hold, −6 Heat | −9 Heat (++: −12) |
| Fund a Think Tank | 1 AP, $5M | −10 Heat | $3M, −14 Heat |
| Bribe an Official | 1 AP, $3M | Dirty, remove 8 Hold. A Bribery Scandal on the board gains 3 Hold | 11 |
| Retain Counsel | 1 AP, $2M | Legal, remove 7 Hold | 10 |
| **Buy Out** | 1 AP, $8M | Legal, remove 14 Hold | 18 (++: 22) |
| **Advertorial** | 1 AP, $4M | +6 Cover (blocks enemy Heat too) | +9 (++: +12) |
| **Oil Shock** | 0 AP, one use | Your next oil sale this turn pays double. Sold once a run ($15M) | — |
Every bribe (Bribe the Sheriff, Bribe, Bribe an Official) feeds a Bribery Scandal. Junk: Dead Weight, Dry Lease, Draft Declaration (the summit's: must play, 1 AP, does nothing).

### Stage 3 items
**Refinery** ($22M: oil sells +$1M; moved here from stage 2), Rolodex ($20M: +1 hand size, up to 7, buy more than one), Paper Shredder ($35M: once a round, destroy a card in hand for free), Supertanker ($30M: +4 storage, up to 12; each one makes oil sell $1M less), **Think Tank** ($15M: +3 Cover every turn).

### Stage 3 enemies
**Every stage 3 enemy move also takes Capital** ($1–3M, the last column), on top of what the move does. Cover blocks it.
| Enemy | Role | Hold | Weak | Resists | Immune | Cycle | Per move |
|---|---|---|---|---|---|---|---|
| Rival Companies | Cash | 30 | Legal | Dirty | — | Price War (oil −$1M) → Undercut (−$4M) → Poach Contracts (−$6M). Beaten: prices recover | $3M |
| Diversified Assets | Cash | 27 | Legal | — | — | Running Costs (−$4M) → Bad Quarter (−$4M) → Write-down (−$8M) | $3M |
| The Bribery Scandal | Cash | 28 | Legal | Lobby | — | Leak (−1 gold) → Hearing (−$5M) → Exposé (−$8M) (+ Indictment: −2 gold in R3). Grows 3 Hold for every bribe you pay | $2M |
| The Spill | Engine | 29 | Bury | Legal | — | Slick (lose 2 stored oil) → Shut Down (a Rig pumps nothing next turn) → Clean-up Bill (−$5M) | $2M |
| Climate Science | Engine | 31 | Bury | Dirty | — | Measure (+5 Heat) → Publish (+8 Heat) → Peer Review (regains 3 Hold) (+ Consensus: +10 Heat in R3) | $1M |
| **The Geneva Climate Summit** (boss, 1979) | Boss | 47 | — | Dirty | — | Expert Testimony (+8 Heat, +4 each cycle) → Draft Declaration (must-play junk in your next hand) → Resolution (−$6M, +$2M each cycle). Moves first: Opening Session (+6 Heat) | $3M |

## Endings
- Bankrupt (Capital 0) · Ousted (Exposure 8, stage 2) · Ruined (gold below 0, stage 2 on) · Broken up (Heat 100, stage 3) · Out of time · later: Stranded (stage 4).
- Each stage complete continues into the next. Stage 3 complete ends the playtest for now, showing the residue item.
- Finishing: retire as Chairman, then a reveal of the hidden totals (emissions, years of delay, the patent you buried).

## Later stages (ideas agreed so far)
- Stage 4: greenwashing items built on the seven sins of greenwashing; the Breakthrough clean-power card you must bury. Boss: The Truth.
- Mixed cards (Upside and Catch) and forced junk cards appear more as the game goes on.

## Balance
`npm run sim` plays 2,000 runs per starting bonus with a simple bot, through stages 1, 2 and 3, and reports each round. Current target: a careful player wins stage 1 about a quarter to a third of the time; the bot beats stage 2 about a third of the time it gets there, with the Proxy Fight the main wall and about a quarter of stage 2 losses by being ousted; the bot beats stage 3 about 60% of the time it gets there (players who reach it are strong), with the Geneva Climate Summit the wall and most losses broken up by Heat.
`npx vite-node tools/stage3.ts` plays stage 3 from a middling admin start ($30M, 3 Rigs, starter deck) and breaks it down by round and enemy; `npx vite-node tools/trace3.ts [seed]` prints one stage 3 run turn by turn.
`npm run fuzz` plays thousands of random runs through all three stages (a third of them start in stage 3) checking the rules never reach an impossible state.
**Admin mode** (playtesting): turn it on in Settings (or open the game with `?admin=1`; `?admin=0` turns it off). The title screen then shows **Admin · jump in**: pick stage 1, 2 or 3, where to start (incorporation or going multinational, round 1–3 or the boss), Wells/Fields/Rigs, Capital, gold, Board Exposure or Heat, the bonus and a starter or strong deck. During an admin run, Settings has tools: +10 Capital, +1 gold, Exposure ±1, Heat ±10, +1 AP, win the round, and add any card. Admin runs are never recorded in history and don't touch the Trust Fund streak.
Preview pages for design checks: `?preview=incorporate`, `?preview=complete2`, `?preview=crash2`, `?preview=multinational`, `?preview=complete3`, `?preview=crash3`, and any of shop, bossshop, summary, round3, boss with `&stage=2` or `&stage=3`.

## Hidden tactics

Never shown during play. The run keeps a quiet tally (damage by card family, moves blocked, Cover used, cards destroyed, Heat cooled, rounds won quickly). When the whole game is won, the results page awards one badge: the tactic furthest past its bar (bars in `CONFIG.tactics`), or none if nothing stands out. The badge is also kept in the run history.

| Badge | Earned by |
|---|---|
| Lean Operation | Destroying cards and finishing with a small deck (14 or fewer) |
| Fortress | Blocking moves and soaking damage and Heat with Cover |
| Oil Baron | Barrels sold across the run |
| Spin Doctor | Heat taken off by your own cards |
| Lawyered Up | Legal cards doing most of the damage |
| Blitz | Winning rounds in 2 turns or fewer |

Bars were set so roughly 6 in 10 winning bot runs earn a badge, spread fairly evenly across the six. Later: shop and spoils offers will lean towards the tactics a deck is already using.

## Stage 4 rules (as built) · 2010–2019 · Battling the Truth

### Shape
- **Five fights:** four single enemies (rounds 1–4, never two at once), then **The Truth** (round 5). A full run is now 17 rounds, but progress still reads out of 16: the Truth arrives as a surprise round 17.
- The four enemies are drawn from the six below, getting tougher by round (+6 Hold per round after the first). **No enemy is met twice in a run.** Rounds are 2010, 2012, 2014, 2016, then 2019 for the Truth.
- A shop (the Investor Portal) follows every fight.

### The Truth clock (replaces Heat)
- Starts at **1 o'clock** (2 with On File). **Midnight loses the run**, at any point, boss fight included.
- **Every enemy's 2nd and 5th move moves it forward 1 hour.** Nothing else ticks it on its own.
- **Winding it back:** Carbon Footprint (−1 hour), Net Zero by 2050 (−2 hours, once a run).
- Heat is worth nothing in stage 4: old cards keep only their other effects (Lobby Congress still removes Hold; Advertorial still gives Cover; Fund a Think Tank does nothing). The Think Tank item still gives Cover.

### Transition (multinational → Big Oil)
- Any loan from earlier is **paid off**. The **World Bank** offers **$30B** of "development finance": $2B a turn in debt, and a **Green Project** card in your deck.
- **Clear-out:** destroy up to 3 cards for free.
- Pick 2 of 4 stage 4 cards offered; the other two go on sale at the first visit.
- Rigs carry over (2 oil a turn). Money is in $B.

### Economy
- Oil sells at **$4B** (balance-tested down from $6B: the Rigs made stage 4 too easy); selling takes 2 AP; storage up to 16. Skimming from $40B a gold. Upgrades and destroys from $15B, rising $5B. New Rigs from $40B.

### Cards (era 4)
| Card | AP · cost | Effect | Upgraded | Price |
|---|---|---|---|---|
| Recycling | 1 | Shuffle your discard pile into your draw pile. Draw 2. | 0 AP | $25B |
| Propaganda | 1 | Lobby: remove 10 Hold. Draw 1. | 13 Hold | $28B |
| On the Payroll | 1 · $4B | Legal: remove 10 Hold. +1 AP. | 13 Hold | $30B |
| Climate Breakdown | 1 | Dirty: remove 12 Hold. Oil sells +$2B this round. | 15 Hold | $30B |
| Astroturfing | 1 | Dirty: remove 7 Hold. +4 Cover. | 9 Hold, +6 Cover | $25B |
| Sustainability Report | 1 | Bury: remove 9 Hold. Draw 1. | 12 Hold | $25B |
| Eco-Friendly Rebrand | 1 · $3B | +8 Cover. Draw 1. | +11 Cover | $22B |
| Bridge Fuel | 0 | +2 AP. Once a round. | +3 AP | $30B |
| Carbon Footprint | 1 | The clock goes back 1 hour. Draw 1. | 0 AP | $35B (Uncommon) |
| Net Zero by 2050 | 1 | The clock goes back 2 hours. Once a run. | — | $40B (Rare) |
| Influencers | 0 · $3B | The next card's Hold damage or Cover is doubled. Only one in the game; can't be duplicated or destroyed by the clear-out. | — | $35B (Rare) |
| Green Project (junk) | 1 | Does nothing. Not forced: it sits in your hand until you pay to play it. | — | — |

### Items
| Item | Effect | Price |
|---|---|---|
| Lobbyist on Retainer | +1 AP every turn | $40B |
| Strategic Reserve | +4 oil storage (up to 16) | $30B |
| PR Agency | +4 Cover every turn | $30B |
| Fossil Fuel Subsidy | +$3B every turn | $30B |
| Offshore Trust | Enemies take 1 less gold from your fortune | $25B |

### Enemies (each cycles five moves; ⏰ = the clock moves forward 1 hour)
| Enemy | Hold | Weak · Resists | Its thing | Moves |
|---|---|---|---|---|
| Fracking | 58 | Legal · Dirty | Cuts you to 1 AP | Cheap Gas (oil −$2B this round) → ⏰ Earthquake Swarm → Tremors (next turn you have 1 AP) → Moratorium (−$6B) → ⏰ Flaming Taps |
| Green Alternatives | 60 | Lobby · Legal | Heals itself | Subsidies (+6 Hold) → ⏰ Price Parity → Undercut (−$6B) → Grid Deal (+6 Hold) → ⏰ Cheaper Every Year |
| Deepwater Disaster | 62 | Bury · Lobby | 4 Cover every turn | Blowout (−$8B) → ⏰ Live Footage → Containment Fails (8 Cover this turn) → Clean-up Bill (−$8B) → ⏰ Inquiry |
| Spilled Tanker | 56 | Bury · Dirty | Junk in your hand | Oiled Seabirds (a Compensation Claim in your hand) → ⏰ Beach Closures → Claims Pile Up (2 Compensation Claims) → Lost Cargo (lose your stored oil) → ⏰ Documentary |
| Green Politicians | 56 | Dirty · Lobby | Personal attacks and limits | Windfall Tax (−2 gold) → ⏰ Hearings → Subpoena (play at most 3 cards next turn) → Asset Freeze (−3 gold) → ⏰ Climate Bill |
| War | 54 | Legal · Bury | While it lasts you produce only 1 barrel a turn, but oil sells for $10B | Requisition (lose 2 oil) → ⏰ Refugee Crisis → Pipeline Strike (−$8B) → Profiteering Probe (−$6B) → ⏰ Ceasefire Talks |

Money moves as built: Moratorium and Undercut −$10B, Blowout, Clean-up Bill and Pipeline Strike −$12B, Profiteering Probe −$10B. Compensation Claim (junk): must play, pay $5B. Every enemy move also takes $4B ($5B for Green Alternatives, Deepwater Disaster and War; Cover blocks it).

### The Truth (boss)
- **Four phases of 25 Hold, one after another.** Each phase is weak to one damage type; every other type still does normal damage (no resistances, no immunities):
  1. **Consensus Report** · Dirty
  2. **Lawsuits** · Legal
  3. **Whistleblower** · Bury
  4. **Breakthrough** · Lobby
- **Its attacks are the consequences:** Sea Level Rise (−$14B), Childhood Asthma (−2 gold), Water Pollution (a Compensation Claim in your hand), Suppressed Development (−1 AP next turn), Wildfire Season (lose your stored oil), Crop Failure (−$12B). Every 5th move moves the clock forward 1 hour.
- **The later the hour you arrive, the harder it is:** every cash attack does +$2B for each hour past 1, Childhood Asthma takes 1 more gold for every 4 hours past 1, and it has Cover equal to the hour every turn.
- No modifiers in stage 4.

### Balance (bot, 600 runs per bonus)
Stage 4 is won by about 2 in 3 bots that reach it, close to stage 3. Bots meet the Truth at about 5 o'clock; most losses are to the Truth itself (ruined or bankrupt), a few at midnight.

### Completion
- Beat the Truth: the well-done screen (victory banner): **"Big Oil beats the Truth. Good for you and your gold."**
- **Score = the gold in your Personal Account only.** The run is recorded as completed, with any badge earned.
- First win: the **?** becomes the Scoreboard (world-on-fire banner); Oil counts as finished.

## Stage 4 look (planned, not built) · 2010–2019 · Battling the Truth · 2010s flat design
The company is now **Big Oil**, and money is in billions ($B). Rounds are 2010, 2013, 2016 and 2019 (Deepwater Horizon, the fracking boom, Paris 2015, the school strikes). The shop is **the Investor Portal**, and the header tagline reads "Powering a better tomorrow™".

The look is a cheerful corporate sustainability report made by a tech start-up: the leaves, wind turbines and friendly type Big Oil sold in the 2010s.
- **Palette:** clean white with a pale grey-green paper, leaf green as the main colour, sky blue second, one accent of millennial pink. Oil black is used sparingly, only for the Truth clock and losses, so the real business shows through the green.
- **Type:** a rounded geometric sans (Poppins or Nunito) throughout. No serifs, no ink and no ledger texture: the first era where the ledger is hidden.
- **Shapes:** flat colour with no gradients, rounded cards, pill buttons, soft drop shadows and plenty of white space. Meters are infographics (donut charts, big percentages, smiling icons). The Truth clock is a clean, minimal analogue face.
- **Icons:** flat vector with the 2013 long shadow, in a solid green circle with a white subject. ChatGPT style line: *Circular game icon, 2010s flat vector design, solid leaf-green circle with a crisp white subject and a long diagonal flat shadow, minimal shapes, no gradients, no outlines, no text, transparent background outside the circle.*
