<p align="center"><img src="public/icons/icon-192.png" width="96" alt="Tycoon" /></p>

<h1 align="center">Tycoon</h1>

<p align="center"><em>Industry. Influence. Plausible deniability.</em></p>

<p align="center"><a href="https://brightonspindoctor.github.io/Tycoon/"><b>▶ Play in your browser</b></a></p>

---

A satirical solo roguelike deckbuilder by Jonny Sadler, in the spirit of Slay the Spire. You run a harmful industry from the 1860s to today. Get rich, stay Chairman, and skim as much as you dare into your own fortune. The game is built so that corruption wins and doing the right thing is hard.

## What's playable

**Oil**, all four stages:

| Stage | Era | The fight | Extra meter | Boss |
|---|---|---|---|---|
| 1 · Growth | Victorian, 1860s | Prospect, build wells, sell oil | — | The Rival Baron |
| 2 · Technical race | Art Deco, 1900s–30s | Incorporate and keep the board on side | Board Exposure | The Proxy Fight |
| 3 · Diversifying | 1970s flower power | Go multinational without getting broken up | Heat | The Geneva Climate Summit |
| 4 · Battling the Truth | 2010s flat greenwash | Become Big Oil and keep the clock off midnight | The Truth | The Truth |

Each stage has four rounds and a boss, and the whole look changes with the era. Money keeps its value but grows a unit: $15 → $15K → $15M → $15B. Your score is the gold in your personal account, and it only counts if you finish all four stages as Chairman.

**Pharmaceutical** is next (shown as Coming soon). Fishing, Tech and a hidden fifth path follow.

## Download it

Tycoon installs like an app: it opens full-screen and plays offline. The first time you open it, a **Download** button appears at the bottom of the screen. It's also under Settings (the gear) whenever you want it.

| Device | How |
|---|---|
| Android, Windows, Mac, Linux in Chrome or Edge | Tap **Download**, then **Install**. |
| iPhone or iPad | Tap Share, then **Add to Home Screen**. |
| Mac in Safari | **File** → **Add to Dock**. |
| Firefox | Not supported for installing. Play in the browser, or open it in Chrome, Edge or Safari. |

Progress, run history and unlocks are saved on the device.

## Run it locally

You need Node.js 20 or newer.

```bash
npm install
npm run dev      # play at http://localhost:5173
npm test         # rules tests
npm run fuzz     # random play, checking the game never reaches an impossible state
npm run sim      # balance check: bot runs per starting bonus, win rate by stage
npm run audit    # every enemy move: what it promised next to what changed
npm run lint
npm run build    # production build in dist/
```

Type-check with `npx tsc -b`.

Every push to `main` runs the tests, builds the game and deploys it to GitHub Pages (`.github/workflows/deploy.yml`). Work on a branch and merge when a batch of changes is ready.

### Jump to a screen

Add `?preview=` to the URL to land straight on a screen, for design checks:

- `summary`, `shop`, `bossshop`, `round3` (two liabilities), `boss`, `crash`, `complete`. Add `&stage=2`, `3` or `4` for a later stage.
- Between stages: `incorporate`, `multinational`, `bigoil`.
- `cards` shows every card. `sounds` plays every sound.

## How it's built

React and TypeScript on Vite. No backend for play: everything runs in the browser.

| Folder | What lives there |
|---|---|
| `src/engine/` | The rules, as plain TypeScript with no React. `config.ts` holds every balance number, `data.ts` the cards, enemies and items, `engine.ts` runs the game. |
| `src/ui/` | The screens. |
| `src/styles/` | The Crude Ledger design system (`tokens.css`, `ledger.css`) and game layout and animation (`app.css`). Each era is a `data-theme`. |
| `src/sound.ts` | Sounds synthesised in the browser, with one master volume. |
| `src/install.ts`, `public/sw.js`, `public/manifest.webmanifest` | Downloading the game and playing offline. |
| `src/storage.ts` | Run history, best scores and unlocks, saved on the device. |
| `src/telemetry.ts` | Anonymous play data and the global scoreboard (Supabase). Players can switch sharing off in Settings. |
| `public/art/` | Card and item icons, enemy portraits, title and era art. |
| `tools/` | The bot player, balance simulator, fuzzer and enemy audit. |
| `docs/design.md` | The full design: rules, enemies, shops, stages and balance. |

The same engine drives the game, the tests and the simulator, so balance results match what players feel.

## Support

If you enjoy it, you can [buy me a coffee](https://buymeacoffee.com/jonnysadler).
