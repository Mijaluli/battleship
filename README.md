# Battleship

A single-player Battleship game with a Node.js/Express REST backend and a React/Vite frontend.

---

## Project Structure

```
battleship/
├── client/                  # React/Vite frontend
│   ├── src/App.jsx          # Main game component (state, API calls)
│   ├── src/ShipPlacement    # Drag-and-drop ship placement UI
│   ├── src/GameBoard        # 10×10 grid rendering
│   ├── src/ScoreBoard       # Fleet health tracker (per side)
│   ├── src/StatusBar        # Game status + last shot results
│   ├── src/styles.css       # Dark theme, grid layout, animations
│   ├── tests/               # Vitest + Testing Library (29 tests)
│   └── vitest.config.js
├── server/                  # Node.js/Express backend (stateless, in-memory)
│   ├── index.js             # Express server entry
│   ├── app.js               # Express app (CORS, middleware, routes)
│   ├── gameLogic.js         # Pure game rules (placement, firing, AI)
│   ├── gameStore.js         # In-memory game Map (1000-game FIFO cap)
│   ├── routes/games.js      # REST endpoints (/api/games/*)
│   └── tests/               # Jest + supertest (68 tests)
├── netlify/
│   └── functions/api.js     # Serverless wrapper (serverless-http → Express)
├── netlify.toml             # Netlify build + redirect config
├── render.yaml              # Render.com standalone API config
├── SPEC.md                  # API contract and game rules (source of truth)
└── CLAUDE.md                # Architecture and dev commands for Claude Code
```

---

## How to Run

```bash
# Backend (terminal 1)
cd server && npm install && npm run dev
# Runs on http://localhost:3001

# Frontend (terminal 2)
cd client && npm install && npm run dev
# Opens at http://localhost:5173
# Vite proxies /api/* to the backend
```

---

## How to Run Tests

```bash
cd server && npm test   # 68 backend tests (Jest + supertest)
cd client && npm test   # Vitest + Testing Library
```

---

## Deployment

- **Netlify** — frontend (`client/dist/`) as static site; API calls hit `netlify/functions/api.js` which wraps the same Express app via `serverless-http`. Redirects configured in `netlify.toml`.
- **Render** — backend runs as a standalone Node process (`server/index.js`). Set `CLIENT_ORIGIN` env var in the Render dashboard to the production Netlify URL.

---

## Tech Stack

- **Backend:** Node.js, Express — stateless, in-memory game store
- **Frontend:** React 18, Vite
- **Backend tests:** Jest, supertest
- **Frontend tests:** Vitest, React Testing Library

---

## Game Rules

- Board: 10×10 grid, columns `A`–`J`, rows `1`–`10`
- Fleet:

  | Ship | Size |
  |------|------|
  | Carrier | 5 |
  | Battleship | 4 |
  | Destroyer | 3 |
  | Submarine | 3 |
  | Patrol Boat | 2 |

- Human places ships manually; computer places at random. Players alternate shots. First to sink all five enemy ships wins.
- Full API contract in `SPEC.md`.
