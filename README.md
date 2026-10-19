# Tycoon

*Industry. Influence. Plausible deniability.*

A satirical solo roguelike deckbuilder by Jonny Sadler. You run a harmful industry from the 1860s to today. Get rich, stay Chairman, and skim as much as you dare into your own fortune. The game is built so that corruption wins and doing the right thing is hard.

This repository holds the first playable slice: **Oil, stage 1** (four rounds and the Rival Baron).

## Run it

You need Node.js 20 or newer.

```bash
npm install
npm run dev      # play at http://localhost:5173
npm test         # rules tests
npm run sim      # balance check: 2,000 bot runs per starting bonus
npm run build    # production build in dist/
```

Design previews: add `?preview=summary`, `?preview=shop`, `?preview=crash` or `?preview=complete` to the URL to jump straight to that screen.

## How it is built

| Folder | What lives there |
|---|---|
| `src/engine/` | The rules, as plain TypeScript with no React. `config.ts` holds every balance number. `data.ts` defines cards, enemies, items and modifiers. `engine.ts` runs the game. |
| `src/ui/` | The screens, in React. |
| `src/styles/` | The Crude Ledger design system (`tokens.css`, `ledger.css`) and game layout and animation (`app.css`). |
| `src/sound.ts` | Placeholder sounds, synthesised in the browser until real recordings are added. |
| `src/storage.ts` | Run history, best scores and unlocks, saved in the browser. |
| `public/art/` | Icons, enemy portraits, card frames and title art. |
| `tools/` | The bot player and balance simulator (`sim.ts`), plus the original Python simulator. |
| `docs/design.md` | The game design: rules, enemies, shop and the plan for stages 2–4. |

The same engine drives the game, the tests and the simulator, so balance results match what players will feel.
