Build Gomoku in THIS folder: C:\xampp\htdocs\gomoku

A recruiter-ready browser five-in-a-row. Playable, polished, no backend.

## Game
- Call it "Five Ember". Original stones, no licensed branding.
- 13×13 board. Player (amber) vs CPU (cyan). Place a stone on an empty intersection. First to five in a row (row, column, or diagonal) wins. Full board with no five is a draw.
- Click/tap a cell. Keyboard: arrows move a highlight, Enter/Space places. R restarts.
- CPU: take a winning five if available, else block the player, else pick a nearby empty cell. Local wins in localStorage.

## UI
- Dark board, glowing stones, winning-line highlight. Not a default Vite page. No Vue logo.
- 390px phone and 1280px desktop. Cells must stay tappable on a phone.

## Tests
- Vitest (pure logic): five in a row is a win; placing on an occupied cell is rejected; a full board with no five is a draw.
- `npm test` and `npm run build` must pass.

## GitHub
- Repo: https://github.com/oscarmmi/gomoku
- Pages: https://oscarmmi.github.io/gomoku/
- vite base `/gomoku/`
- Commit: feat: add gomoku
- First commit must `git add -A` so package.json, vite.config.ts, tsconfigs, src/main.ts, index.html, .gitignore, and .github/workflows/pages.yml ship with the game.
- gh repo edit --description "Five Ember gomoku vs CPU in Vue 3 + TypeScript, playable on GitHub Pages." --add-topic vue --add-topic typescript --add-topic game --add-topic gomoku --add-topic board-game
- Stop. Print the repo URL and Pages URL.
