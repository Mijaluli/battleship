# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development (run in separate terminals)
```bash
# Backend
cd server && npm install && npm run dev      # port 3001, hot-reloads via --watch

# Frontend
cd client && API_PORT=3001 npm run dev       # port 5173, proxies /api → backend
```

If port 3001 is taken by another project, pick a free port and pass it via `API_PORT`:
```bash
PORT=3002 node server/index.js &
cd client && API_PORT=3002 npm run dev
```

### Tests
```bash
cd server && npm test                        # Jest — runs server/tests/*.test.js
cd client && npm test                        # Vitest — runs client/tests/*.test.jsx

# Single test file
cd server && npx jest tests/api.test.js
cd client && npx vitest run tests/components.test.jsx
```

### Build (production)
```bash
cd client && npm run build                   # outputs to client/dist/
```

## Architecture

### Deployment model (two targets)
- **Netlify** (frontend + serverless): `client/dist/` is the static site; `/api/*` redirects to `netlify/functions/api.js`, which wraps the Express app via `serverless-http`. The same `server/app.js` runs as both a standalone server and a Netlify Function.
- **Render** (standalone API): runs `server/index.js` directly (rootDir: `server`). Used when the backend needs to be a persistent process.

### Server (`server/`)
Pure Express, no database. All state is in-memory.

- **`gameStore.js`** — a `Map<gameId, game>` with a 1000-game FIFO cap. Use `addGame(id, game)` for new games; `games.set(id, game)` for updates to existing ones.
- **`gameLogic.js`** — all pure functions, no side effects. Key functions:
  - `fireShot(board, coord, shotsRemaining, shotsTaken)` — returns `{ outcome, shipName, updatedBoard, ... }`. `shipName` is `null` on a plain hit; only populated on `'sunk'`.
  - `computerPickShot(shotsRemaining, humanBoard)` — two-mode AI: *hunt* (checkerboard pattern) when no active hits, *target* (axis-locked) when unsunk hits exist.
  - `sanitizeComputerBoard(board)` — strips `hasShip`/`shipId` from non-sunk computer cells before sending to client.
- **`routes/games.js`** — single router mounted at `/api/games`. Each request fetches the game from the Map, mutates it, and puts it back with `games.set()`.

### Client (`client/`)
React with no state management library. All game state lives in a single `useState` object in `App.jsx`.

- **`App.jsx`** — owns all state and async API calls. `handleFire` uses a `useRef` flag (`isFiringRef`) — not `useState` — to synchronously prevent double-fires.
- **`ShipPlacement.jsx`** — drag-and-drop placement. Drag events are handled via `onCellDragOver`/`onCellDrop` props threaded through `GameBoard → Cell`; Cell calls `e.preventDefault()` to enable drops.
- **`GameBoard.jsx`** — pure rendering; maps the `cells` object to a grid of `Cell` components. The `mode` prop (`'placement'`, `'battle-own'`, `'battle-enemy'`) controls what's shown.
- **`gameLogic.js` (server) is the source of truth** — the client has its own `computePreview` in `ShipPlacement.jsx` for local validation, but the server re-validates all placements.

### Board data model
A board is `{ cells: { [coord]: CellState }, ships: Ship[] }`. Coordinates are strings like `"A1"` through `"J10"`. A `CellState` has `{ hasShip, isHit, isMiss, isSunk, shipId, coordinate }`. The computer's board is always sent through `sanitizeComputerBoard` which zeroes out `hasShip` and `shipId` for non-sunk cells.

### CORS
Allows `http://localhost:5173`, `*.netlify.app`, and `process.env.CLIENT_ORIGIN` (set in Render dashboard to the production Netlify URL).
