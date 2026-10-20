# Notes for working on Tycoon

- Rules live in `src/engine/` and must stay free of React so the tests and simulator can use them. Every balance number belongs in `src/engine/config.ts`.
- After changing rules, run `npm test`, `npm run fuzz` and `npm run sim` and report the stage 1, 2 and 3 win rates.
- Engine text with money (`$4`) goes through `units()` in `src/engine/format.ts` on screen, so it reads `$4K` in stage 2 and `$4M` in stage 3.
- Styling uses the Crude Ledger design system in `src/styles/tokens.css` and `ledger.css`; add game layout to `app.css`. The theme (`data-theme`) is the stage's era.
- Money is always shown through `money()` in `src/engine/format.ts` so the unit changes by stage.
- Game copy is deadpan and short. Cards say what they do, not why.
- The full design is in `docs/design.md`; keep it current when rules change.
- Stage 3 art that isn't drawn yet borrows an existing icon through `src/ui/icons.ts`; drop the line there once the real file is in `public/art/icons`.
