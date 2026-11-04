# Net Zero Desk

A choice-based climate policy game for secondary students. You are the Prime Minister of a new "Real Action Party".
Over 12 terms (2026-2050) you stamp APPROVE or REJECT on policy papers, juggling points, votes and pollution, and
watch out for papers that are not what they seem. A full game takes about 15 minutes.

Play: open `index.html` (or the GitHub Pages site). No build step, no dependencies.

## Files
- `index.html`, `style.css`, `app.js` - interface
- `core.js` - game logic (pure, runs in the browser and in Node)
- `data.js` - the 48 policy papers, 12 events and 3 advisers
- `assets/` - illustrations (SVG, optionally replaced by images in `assets/manifest.js`)
- `art_mapper.html` - tool for turning AI-generated image palettes into the individual game images
- `tools/` - balance simulator (`node tools/sim.js`), SVG renderer/linter and the art brief

## Keyboard shortcuts (desk screen)
A = approve, X = reject, F = fact-check, R = read the fine print. Arrow keys also work (right = approve, left = reject). A key guide shows on the left of wide screens.
