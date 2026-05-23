# Battleship — SPEC.md

Single source of truth for the Battleship project.
All agents (Architect, QA, BE Developer, FE Developer, Reviewer, Orchestrator) must treat this document as authoritative.

---

## 1. Overview

Battleship is a single-player browser game in which one human player competes against a computer opponent on a 10×10 grid labeled A–J (columns) by 1–10 (rows). At the start of each game the human manually places a fleet of five ships on their own board; the computer's fleet is positioned automatically at random. Players then alternate firing shots at the opponent's board — the human by clicking a grid cell, the computer by selecting a random untargeted cell. A shot that lands on a ship cell is a hit; all other cells are a miss. When every cell of a ship has been hit the ship is sunk. The first side to sink all five of the opponent's ships wins. The game is served by a Node.js REST API backend and a React frontend; no persistent storage is used between server restarts.

---

## 2. Feature List & User Stories

1. As a player, I can start a new game so that a fresh board is created and I can begin placing my fleet.
2. As a player, I can see my own 10×10 board during ship placement so that I know where I have already placed ships.
3. As a player, I can select a ship from the remaining fleet and choose a horizontal or vertical orientation so that I can decide how to position it.
4. As a player, I can see a preview of where a ship will be placed when I hover over a cell so that I can place it accurately.
5. As a player, I can click a valid cell to place the currently selected ship so that it is committed to my board.
6. As a player, I am prevented from placing a ship out of bounds or overlapping an already-placed ship so that the board remains valid.
7. As a player, I am automatically moved to the battle phase once all five ships have been placed so that the game begins without extra steps.
8. As a player, I can see both my own board and the enemy board during battle so that I can track the state of both fleets.
9. As a player, I can click an untargeted cell on the enemy board to fire a shot so that I can attempt to sink enemy ships.
10. As a player, I can see whether my shot was a hit, miss, or sunk a ship so that I know the result of my action.
11. As a player, I can see the computer's return shot and its outcome so that I know what happened on my board each turn.
12. As a player, I can see a running scoreboard listing which ships on each side are afloat or sunk so that I can track the battle at a glance.
13. As a player, I am notified when I win (all enemy ships sunk) or lose (all my ships sunk) so that I know the game is over.
14. As a player, I can click "Play Again" after a game ends so that a new game starts immediately using the same game ID.

---

## 3. API Contract

The backend exposes a REST API at base path `/api/games`. All request and response bodies are `application/json`. The frontend's dev proxy (Vite) forwards `/api/*` to the backend at `http://localhost:3001`. CORS is configured to allow `http://localhost:5173`.

---

### 3.1 POST /api/games

Create a new game. The computer's ships are placed randomly; the human's board is empty.

**Request body:** none

**Success response — 201 Created**

```
{
  "gameId":      string,   // e.g. "game_a1b2c3d4"
  "status":      "placement",
  "humanBoard":  Board,
  "shipsToPlace": ShipDefinition[]
}
```

**Error responses**

| Status | Error Code | Description |
|--------|-----------|-------------|
| 400 | `INVALID_JSON` | Request body could not be parsed as JSON |
| 500 | `INTERNAL_ERROR` | Unexpected server error |

---

### 3.2 POST /api/games/:gameId/place-ship

Place one human ship on the board. The game must be in `placement` status.
When all five ships are placed the response `status` changes to `in_progress`.

**Request body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `shipName` | string | required | Must match one of the five fleet names exactly (case-sensitive) |
| `startCoordinate` | string | required | Top-left/top cell of the ship, e.g. `"A1"`, `"J10"` |
| `orientation` | string | required | `"horizontal"` or `"vertical"` |

**Success response — 200 OK**

```
{
  "gameId":                 string,
  "status":                 "placement" | "in_progress",
  "humanBoard":             Board,
  "placedShips":            Ship[],
  "remainingShipsToPlace":  ShipDefinition[]
}
```

**Error responses**

| Status | Error Code | Description |
|--------|-----------|-------------|
| 404 | `GAME_NOT_FOUND` | No game exists for the given `gameId` |
| 409 | `GAME_NOT_IN_PLACEMENT` | Game status is not `placement` |
| 400 | `INVALID_COORDINATE` | `startCoordinate` is not a valid board cell |
| 400 | `INVALID_SHIP_NAME` | `shipName` does not match any fleet entry |
| 400 | `INVALID_ORIENTATION` | `orientation` is neither `"horizontal"` nor `"vertical"` |
| 400 | `SHIP_ALREADY_PLACED` | A ship with this name has already been placed on the human board |
| 400 | `OUT_OF_BOUNDS` | The ship extends beyond the board boundaries |
| 400 | `OVERLAP` | One or more cells are already occupied by another ship |

---

### 3.3 POST /api/games/:gameId/fire

Fire a shot at the computer's board on behalf of the human player, then have the computer fire one return shot at the human's board. The game must be in `in_progress` status. If the human's shot sinks the last computer ship the game ends immediately and no computer shot is fired.

**Request body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `coordinate` | string | required | Target cell on the computer's board, e.g. `"C5"` |

**Success response — 200 OK**

```
{
  "gameId":        string,
  "status":        "in_progress" | "player_won" | "computer_won",
  "winner":        "human" | "computer" | null,
  "humanShot":     ShotResult,
  "computerShot":  ShotResult | null,   // null only when status is "player_won"
  "humanBoard":    Board,
  "computerBoard": Board,               // ship positions are hidden unless sunk
  "sunkShips":     SunkShips
}
```

`ShotResult` object:

```
{
  "coordinate": string,
  "outcome":    "hit" | "miss" | "sunk",
  "shipName":   string | null   // the name of the ship if outcome is "sunk", else null
}
```

`SunkShips` object:

```
{
  "human":    string[],   // names of the human's sunk ships
  "computer": string[]    // names of the computer's sunk ships
}
```

**Error responses**

| Status | Error Code | Description |
|--------|-----------|-------------|
| 404 | `GAME_NOT_FOUND` | No game exists for the given `gameId` |
| 409 | `GAME_NOT_IN_PROGRESS` | Game status is not `in_progress` |
| 400 | `INVALID_COORDINATE` | `coordinate` is not a valid board cell |
| 400 | `CELL_ALREADY_TARGETED` | The human has already fired at this coordinate |

---

### 3.4 GET /api/games/:gameId

Retrieve the full current state of a game.

**Request body:** none

**Success response — 200 OK**

```
{
  "gameId":         string,
  "status":         "placement" | "in_progress" | "player_won" | "computer_won",
  "currentTurn":    "human" | null,
  "winner":         "human" | "computer" | null,
  "humanBoard":     Board,
  "computerBoard":  Board,   // ship positions hidden unless sunk
  "shipsToPlace":   ShipDefinition[],   // non-empty only when status is "placement"
  "sunkShips":      SunkShips,
  "lastShotResult": { "human": ShotResult | null, "computer": ShotResult | null } | null
}
```

**Error responses**

| Status | Error Code | Description |
|--------|-----------|-------------|
| 404 | `GAME_NOT_FOUND` | No game exists for the given `gameId` |

---

### 3.5 POST /api/games/:gameId/reset

Reset an existing game to a fresh `placement` state. The computer's fleet is re-randomised. The game ID is preserved.

**Request body:** none

**Success response — 200 OK**

```
{
  "gameId":       string,
  "status":       "placement",
  "humanBoard":   Board,
  "shipsToPlace": ShipDefinition[]
}
```

**Error responses**

| Status | Error Code | Description |
|--------|-----------|-------------|
| 404 | `GAME_NOT_FOUND` | No game exists for the given `gameId` |

---

### 3.6 Global error responses

The following errors can be returned by any route:

| Status | Error Code | Description |
|--------|-----------|-------------|
| 404 | `NOT_FOUND` | The requested route does not exist |
| 400 | `INVALID_JSON` | Request body is malformed JSON |
| 500 | `INTERNAL_ERROR` | Unhandled server-side exception |

All error bodies follow this shape:

```
{
  "error": {
    "code":    string,
    "message": string
  }
}
```

---

## 4. Data Models & Game State Schema

### 4.1 Game

```
{
  id:             string,               // e.g. "game_a1b2c3d4"
  status:         "placement" | "in_progress" | "player_won" | "computer_won",
  currentTurn:    "human" | null,       // null when game is over
  humanPlayer:    Player,
  computerPlayer: Player,
  lastShotResult: { human: ShotResult | null, computer: ShotResult | null } | null,
  winner:         "human" | "computer" | null
}
```

### 4.2 Player

```
{
  type:            "human" | "computer",
  board:           Board,
  shotsRemaining:  string[],   // coordinates not yet targeted by this player
  shotsTaken:      string[]    // coordinates already targeted by this player
}
```

### 4.3 Board

```
{
  cells: { [coordinate: string]: Cell },   // keys are all 100 coordinates A1–J10
  ships: Ship[]
}
```

### 4.4 Cell

```
{
  coordinate: string,    // e.g. "A1", "J10"
  hasShip:    boolean,   // true if a ship occupies this cell (hidden on computer board unless sunk)
  isHit:      boolean,   // true if this cell has been hit by a shot
  isMiss:     boolean,   // true if a shot landed here and there was no ship
  isSunk:     boolean,   // true if this cell belongs to a ship that has been fully sunk
  shipId:     string | null   // foreign key to Ship.id; null if no ship
}
```

Notes:
- `isHit` and `isMiss` are mutually exclusive and are both false until the cell is targeted.
- `isSunk` is set to `true` on all cells of a ship simultaneously when the last cell of that ship is hit.
- The computer board returned from the API (`sanitizeComputerBoard`) strips `hasShip` and `shipId` from cells that have not yet been sunk, so ship positions cannot be read from the response.

### 4.5 Ship

```
{
  id:          string,        // e.g. "ship_carrier_human_a1b2c3d4"
  name:        string,        // one of the five fleet names (see §4.6)
  size:        number,        // number of cells the ship occupies
  coordinates: string[],      // ordered list of cell coordinates occupied by this ship
  orientation: "horizontal" | "vertical",
  isSunk:      boolean
}
```

### 4.6 Fleet

The fleet is fixed and identical for both players:

| Name | Size |
|------|------|
| Carrier | 5 |
| Battleship | 4 |
| Destroyer | 3 |
| Submarine | 3 |
| Patrol Boat | 2 |

### 4.7 ShipDefinition

A lightweight descriptor used in placement-phase responses:

```
{
  name: string,
  size: number
}
```

### 4.8 Board coordinates

Columns are the letters `A` through `J`; rows are the integers `1` through `10`. A coordinate is always expressed as `<column><row>`, e.g. `"A1"` (top-left) and `"J10"` (bottom-right). The grid is always 10×10 = 100 cells.

---

## 5. Frontend Component Breakdown

The frontend is implemented in **React** (with Vite as the build tool and dev server). The entry point is `main.jsx` which mounts `<App />` into `#root`.

---

### 5.1 App

**Responsibility:** Root component that owns all game state and orchestrates API calls; renders the correct child components based on `game.status`.

**Props:** none (stateful root)

**Key internal state:**

| Field | Type | Description |
|-------|------|-------------|
| `game` | object \| null | Full client-side game snapshot |
| `isLoading` | boolean | True while any fetch is in flight |
| `error` | string \| null | User-facing error message |

---

### 5.2 GameBoard

**Responsibility:** Renders the 10×10 grid with column (A–J) and row (1–10) header labels, delegating individual cell rendering to `<Cell>`.

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `cells` | `{ [coord: string]: Cell }` | required | Map of all 100 board cells |
| `mode` | `"placement" \| "battle-own" \| "battle-enemy"` | required | Controls which cell state is displayed and whether clicks are active |
| `onCellClick` | `(coordinate: string) => void` | optional | Called when a clickable cell is clicked |
| `previewCells` | `string[]` | optional (default `[]`) | Coordinates to highlight as a ship placement preview |
| `disabled` | `boolean` | optional (default `false`) | When true, all cells are non-interactive |

---

### 5.3 Cell

**Responsibility:** Renders a single board cell with the correct visual class based on its state (ship, hit, miss, sunk, preview, disabled).

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `coordinate` | `string` | required | Cell coordinate, e.g. `"A1"` |
| `hasShip` | `boolean` | required | Whether this cell contains a ship (always false on enemy board for non-sunk ships) |
| `isHit` | `boolean` | required | Whether this cell has been hit |
| `isMiss` | `boolean` | required | Whether a shot missed here |
| `isSunk` | `boolean` | required | Whether the ship occupying this cell is fully sunk |
| `isPreview` | `boolean` | required | Whether this cell is part of the current ship placement preview |
| `isDisabled` | `boolean` | required | Whether the cell is non-interactive |
| `onClick` | `() => void` | optional | Handler called when the cell is clicked (only wired when not disabled) |

**CSS classes applied (in priority order):** `cell-sunk` > `cell-hit` > `cell-miss` > `cell-ship`; additionally `cell-preview-valid` when `isPreview` is true, and `cell-disabled` when `isDisabled` is true.

---

### 5.4 ShipPlacement

**Responsibility:** Manages the interactive ship-placement UI — renders the remaining fleet, an orientation toggle, a placement hint, and a `<GameBoard>` in placement mode with hover previews; fires the `POST /api/games/:id/place-ship` call on cell click.

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `gameId` | `string` | required | ID of the active game |
| `humanBoard` | `Board` | required | Current state of the human's board |
| `shipsToPlace` | `ShipDefinition[]` | required | Ships not yet placed |
| `onShipPlaced` | `(data: PlaceShipResponse) => void` | required | Callback invoked with the API response after a successful placement |

---

### 5.5 StatusBar

**Responsibility:** Displays the current game phase message, the outcome of the last shot (formatted as a human-readable sentence), and a "Play Again" button when the game is over.

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `status` | `"placement" \| "in_progress" \| "player_won" \| "computer_won"` | required | Current game status |
| `currentTurn` | `"human" \| null` | required | Whose turn it is |
| `lastShotResult` | `{ shooter: string, coordinate: string, outcome: string, shipName: string \| null } \| null` | required | The most recent shot to display |
| `onReset` | `() => void` | required | Called when the "Play Again" button is clicked |

---

### 5.6 ScoreBoard

**Responsibility:** Shows the afloat/sunk status of every ship in both the human fleet and the enemy fleet as a side-by-side list.

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `sunkShips` | `{ human: string[], computer: string[] }` | required | Names of ships that have been sunk on each side |
| `fleet` | `ShipDefinition[]` | required | Full ordered fleet used to determine which ships to list |

---

## 6. WebSocket Events

WebSockets: not used — all communication via REST API.

---

## 7. Error Taxonomy

| Error Code | HTTP Status | Endpoint(s) | Description |
|-----------|------------|-------------|-------------|
| `GAME_NOT_FOUND` | 404 | place-ship, fire, GET, reset | No game with the specified `gameId` exists in the server's in-memory store |
| `GAME_NOT_IN_PLACEMENT` | 409 | place-ship | The game's current status is not `placement`; ship placement is only allowed before battle begins |
| `GAME_NOT_IN_PROGRESS` | 409 | fire | The game's current status is not `in_progress`; firing is only allowed during active battle |
| `INVALID_COORDINATE` | 400 | place-ship, fire | The coordinate string is malformed, the column letter is not A–J, or the row number is not 1–10 |
| `INVALID_SHIP_NAME` | 400 | place-ship | `shipName` does not match any of the five fleet names (case-sensitive) |
| `INVALID_ORIENTATION` | 400 | place-ship | `orientation` is neither `"horizontal"` nor `"vertical"` |
| `SHIP_ALREADY_PLACED` | 400 | place-ship | A ship with this name has already been placed on the human board in the current game |
| `OUT_OF_BOUNDS` | 400 | place-ship | The ship's footprint extends beyond column J or row 10 given the start coordinate, size, and orientation |
| `OVERLAP` | 400 | place-ship | One or more cells in the ship's footprint are already occupied by a previously placed ship |
| `CELL_ALREADY_TARGETED` | 400 | fire | The human player has already fired at the specified coordinate in this game |
| `NOT_FOUND` | 404 | any | The requested URL path does not match any registered route |
| `INVALID_JSON` | 400 | any | The request body could not be parsed as valid JSON |
| `INTERNAL_ERROR` | 500 | any | An unhandled exception occurred on the server |
