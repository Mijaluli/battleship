'use strict';

/**
 * Backend API contract tests — derived from SPEC.md section 6.
 *
 * These tests import the Express app from ../../src/server/app.js.
 * Until that file is implemented the entire suite will fail with
 * "Cannot find module '../../src/server/app.js'" — the correct red state.
 */

const request = require('supertest');
const app = require('../../src/server/app.js');

// ---------------------------------------------------------------------------
// Helper: extract just the cells map from a board response object
// ---------------------------------------------------------------------------
function boardCells(board) {
  return board && board.cells;
}

// ---------------------------------------------------------------------------
// 6.1  POST /api/games  — Create Game
// ---------------------------------------------------------------------------
describe('POST /api/games — Create Game', () => {
  let res;

  beforeAll(async () => {
    res = await request(app).post('/api/games').send({});
  });

  test('returns HTTP 201', () => {
    expect(res.status).toBe(201);
  });

  test('returns Content-Type application/json', () => {
    expect(res.headers['content-type']).toMatch(/application\/json/);
  });

  test('response contains a gameId string', () => {
    expect(typeof res.body.gameId).toBe('string');
    expect(res.body.gameId.length).toBeGreaterThan(0);
  });

  test('status is "placement"', () => {
    expect(res.body.status).toBe('placement');
  });

  test('shipsToPlace contains exactly 5 ships', () => {
    expect(Array.isArray(res.body.shipsToPlace)).toBe(true);
    expect(res.body.shipsToPlace).toHaveLength(5);
  });

  test('shipsToPlace contains the correct ship names', () => {
    const names = res.body.shipsToPlace.map((s) => s.name);
    expect(names).toContain('Carrier');
    expect(names).toContain('Battleship');
    expect(names).toContain('Destroyer');
    expect(names).toContain('Submarine');
    expect(names).toContain('Patrol Boat');
  });

  test('shipsToPlace contains correct sizes', () => {
    const byName = Object.fromEntries(
      res.body.shipsToPlace.map((s) => [s.name, s.size])
    );
    expect(byName['Carrier']).toBe(5);
    expect(byName['Battleship']).toBe(4);
    expect(byName['Destroyer']).toBe(3);
    expect(byName['Submarine']).toBe(3);
    expect(byName['Patrol Boat']).toBe(2);
  });

  test('humanBoard is present', () => {
    expect(res.body.humanBoard).toBeDefined();
  });

  test('humanBoard has exactly 100 cells', () => {
    const cells = boardCells(res.body.humanBoard);
    expect(cells).toBeDefined();
    expect(Object.keys(cells)).toHaveLength(100);
  });

  test('all humanBoard cells start empty (no hits, no misses, no ships)', () => {
    const cells = boardCells(res.body.humanBoard);
    Object.values(cells).forEach((cell) => {
      expect(cell.isHit).toBe(false);
      expect(cell.isMiss).toBe(false);
      expect(cell.hasShip).toBe(false);
    });
  });

  test('humanBoard has no ships array with placed ships', () => {
    expect(Array.isArray(res.body.humanBoard.ships)).toBe(true);
    expect(res.body.humanBoard.ships).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// 6.2  POST /api/games/:gameId/place-ship  — Place Ship
// ---------------------------------------------------------------------------
describe('POST /api/games/:gameId/place-ship — Place Ship', () => {
  let gameId;

  beforeAll(async () => {
    const res = await request(app).post('/api/games').send({});
    gameId = res.body.gameId;
  });

  // ---- success: place the Carrier ----------------------------------------
  describe('valid placement', () => {
    let res;

    beforeAll(async () => {
      res = await request(app)
        .post(`/api/games/${gameId}/place-ship`)
        .send({ shipName: 'Carrier', startCoordinate: 'A1', orientation: 'horizontal' });
    });

    test('returns HTTP 200', () => {
      expect(res.status).toBe(200);
    });

    test('response contains updated gameId', () => {
      expect(res.body.gameId).toBe(gameId);
    });

    test('status is still "placement" after first ship', () => {
      expect(res.body.status).toBe('placement');
    });

    test('humanBoard is returned', () => {
      expect(res.body.humanBoard).toBeDefined();
    });

    test('humanBoard reflects the placed ship (cells have hasShip true)', () => {
      const cells = boardCells(res.body.humanBoard);
      // Carrier placed horizontally from A1: cells A1, B1, C1, D1, E1
      expect(cells['A1'].hasShip).toBe(true);
      expect(cells['B1'].hasShip).toBe(true);
      expect(cells['C1'].hasShip).toBe(true);
      expect(cells['D1'].hasShip).toBe(true);
      expect(cells['E1'].hasShip).toBe(true);
    });

    test('placedShips contains the Carrier', () => {
      expect(Array.isArray(res.body.placedShips)).toBe(true);
      const carrier = res.body.placedShips.find((s) => s.name === 'Carrier');
      expect(carrier).toBeDefined();
    });

    test('remainingShipsToPlace has 4 ships left', () => {
      expect(Array.isArray(res.body.remainingShipsToPlace)).toBe(true);
      expect(res.body.remainingShipsToPlace).toHaveLength(4);
    });
  });

  // ---- error: duplicate ship ---------------------------------------------
  describe('error: SHIP_ALREADY_PLACED', () => {
    let res;

    beforeAll(async () => {
      // Carrier was already placed in the outer beforeAll
      res = await request(app)
        .post(`/api/games/${gameId}/place-ship`)
        .send({ shipName: 'Carrier', startCoordinate: 'A3', orientation: 'horizontal' });
    });

    test('returns HTTP 400', () => {
      expect(res.status).toBe(400);
    });

    test('error code is SHIP_ALREADY_PLACED', () => {
      expect(res.body.error.code).toBe('SHIP_ALREADY_PLACED');
    });
  });

  // ---- error: OUT_OF_BOUNDS -----------------------------------------------
  describe('error: OUT_OF_BOUNDS', () => {
    let gameId2;
    let res;

    beforeAll(async () => {
      const createRes = await request(app).post('/api/games').send({});
      gameId2 = createRes.body.gameId;

      // Carrier (size 5) placed horizontally from J1 goes beyond column J
      res = await request(app)
        .post(`/api/games/${gameId2}/place-ship`)
        .send({ shipName: 'Carrier', startCoordinate: 'J1', orientation: 'horizontal' });
    });

    test('returns HTTP 400', () => {
      expect(res.status).toBe(400);
    });

    test('error code is OUT_OF_BOUNDS', () => {
      expect(res.body.error.code).toBe('OUT_OF_BOUNDS');
    });
  });

  // ---- error: OVERLAP -----------------------------------------------------
  describe('error: OVERLAP', () => {
    let gameId3;
    let res;

    beforeAll(async () => {
      const createRes = await request(app).post('/api/games').send({});
      gameId3 = createRes.body.gameId;

      // Place Carrier at A1 horizontal (occupies A1–E1)
      await request(app)
        .post(`/api/games/${gameId3}/place-ship`)
        .send({ shipName: 'Carrier', startCoordinate: 'A1', orientation: 'horizontal' });

      // Place Battleship overlapping — also at A1 horizontal (occupies A1–D1)
      res = await request(app)
        .post(`/api/games/${gameId3}/place-ship`)
        .send({ shipName: 'Battleship', startCoordinate: 'A1', orientation: 'horizontal' });
    });

    test('returns HTTP 400', () => {
      expect(res.status).toBe(400);
    });

    test('error code is OVERLAP', () => {
      expect(res.body.error.code).toBe('OVERLAP');
    });
  });

  // ---- error: INVALID_SHIP_NAME ------------------------------------------
  describe('error: INVALID_SHIP_NAME', () => {
    let gameId4;
    let res;

    beforeAll(async () => {
      const createRes = await request(app).post('/api/games').send({});
      gameId4 = createRes.body.gameId;

      res = await request(app)
        .post(`/api/games/${gameId4}/place-ship`)
        .send({ shipName: 'Dreadnought', startCoordinate: 'A1', orientation: 'horizontal' });
    });

    test('returns HTTP 400', () => {
      expect(res.status).toBe(400);
    });

    test('error code is INVALID_SHIP_NAME', () => {
      expect(res.body.error.code).toBe('INVALID_SHIP_NAME');
    });
  });

  // ---- error: GAME_NOT_FOUND ----------------------------------------------
  describe('error: GAME_NOT_FOUND', () => {
    test('returns HTTP 404 with GAME_NOT_FOUND for unknown gameId', async () => {
      const res = await request(app)
        .post('/api/games/nonexistent-game-id/place-ship')
        .send({ shipName: 'Carrier', startCoordinate: 'A1', orientation: 'horizontal' });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('GAME_NOT_FOUND');
    });
  });

  // ---- placing all 5 ships transitions status to in_progress -------------
  describe('placing the last ship transitions to in_progress', () => {
    let gameId5;
    let res;

    beforeAll(async () => {
      const createRes = await request(app).post('/api/games').send({});
      gameId5 = createRes.body.gameId;

      await request(app)
        .post(`/api/games/${gameId5}/place-ship`)
        .send({ shipName: 'Carrier', startCoordinate: 'A1', orientation: 'horizontal' });
      await request(app)
        .post(`/api/games/${gameId5}/place-ship`)
        .send({ shipName: 'Battleship', startCoordinate: 'A2', orientation: 'horizontal' });
      await request(app)
        .post(`/api/games/${gameId5}/place-ship`)
        .send({ shipName: 'Destroyer', startCoordinate: 'A3', orientation: 'horizontal' });
      await request(app)
        .post(`/api/games/${gameId5}/place-ship`)
        .send({ shipName: 'Submarine', startCoordinate: 'A4', orientation: 'horizontal' });
      res = await request(app)
        .post(`/api/games/${gameId5}/place-ship`)
        .send({ shipName: 'Patrol Boat', startCoordinate: 'A5', orientation: 'horizontal' });
    });

    test('returns HTTP 200', () => {
      expect(res.status).toBe(200);
    });

    test('status transitions to in_progress after last ship placed', () => {
      expect(res.body.status).toBe('in_progress');
    });

    test('remainingShipsToPlace is empty', () => {
      expect(res.body.remainingShipsToPlace).toHaveLength(0);
    });
  });
});

// ---------------------------------------------------------------------------
// 6.3  POST /api/games/:gameId/fire  — Fire Shot
// ---------------------------------------------------------------------------
describe('POST /api/games/:gameId/fire — Fire Shot', () => {
  // Helper: create a game and place all 5 ships so it becomes in_progress
  async function createReadyGame() {
    const createRes = await request(app).post('/api/games').send({});
    const gId = createRes.body.gameId;

    await request(app)
      .post(`/api/games/${gId}/place-ship`)
      .send({ shipName: 'Carrier', startCoordinate: 'A1', orientation: 'horizontal' });
    await request(app)
      .post(`/api/games/${gId}/place-ship`)
      .send({ shipName: 'Battleship', startCoordinate: 'A2', orientation: 'horizontal' });
    await request(app)
      .post(`/api/games/${gId}/place-ship`)
      .send({ shipName: 'Destroyer', startCoordinate: 'A3', orientation: 'horizontal' });
    await request(app)
      .post(`/api/games/${gId}/place-ship`)
      .send({ shipName: 'Submarine', startCoordinate: 'A4', orientation: 'horizontal' });
    await request(app)
      .post(`/api/games/${gId}/place-ship`)
      .send({ shipName: 'Patrol Boat', startCoordinate: 'A5', orientation: 'horizontal' });

    return gId;
  }

  // ---- basic fire response shape -----------------------------------------
  describe('valid fire: basic response shape', () => {
    let gId;
    let res;

    beforeAll(async () => {
      gId = await createReadyGame();
      res = await request(app)
        .post(`/api/games/${gId}/fire`)
        .send({ coordinate: 'A6' }); // row 6 — no human ships placed there
    });

    test('returns HTTP 200', () => {
      expect(res.status).toBe(200);
    });

    test('response contains gameId', () => {
      expect(res.body.gameId).toBe(gId);
    });

    test('response contains humanShot with coordinate and outcome', () => {
      expect(res.body.humanShot).toBeDefined();
      expect(res.body.humanShot.coordinate).toBe('A6');
      expect(['hit', 'miss', 'sunk']).toContain(res.body.humanShot.outcome);
    });

    test('response contains computerShot (or null if game ended)', () => {
      // computerShot is null only if human won on this shot; otherwise it is present
      if (res.body.status !== 'player_won') {
        expect(res.body.computerShot).toBeDefined();
        expect(res.body.computerShot).not.toBeNull();
        expect(res.body.computerShot.coordinate).toBeDefined();
        expect(['hit', 'miss', 'sunk']).toContain(res.body.computerShot.outcome);
      }
    });

    test('response contains updated humanBoard', () => {
      expect(res.body.humanBoard).toBeDefined();
      expect(Object.keys(boardCells(res.body.humanBoard))).toHaveLength(100);
    });

    test('response contains updated computerBoard', () => {
      expect(res.body.computerBoard).toBeDefined();
      expect(Object.keys(boardCells(res.body.computerBoard))).toHaveLength(100);
    });

    test('computerBoard cells for unsunk ships do not expose hasShip', () => {
      const cells = boardCells(res.body.computerBoard);
      Object.values(cells).forEach((cell) => {
        // hasShip must be absent (or false) for cells that are not part of a sunk ship
        // The spec says hasShip is NEVER sent for unsunk ships
        if (!cell.isSunk) {
          expect(cell.hasShip).toBeFalsy();
        }
      });
    });

    test('response contains sunkShips with human and computer arrays', () => {
      expect(res.body.sunkShips).toBeDefined();
      expect(Array.isArray(res.body.sunkShips.human)).toBe(true);
      expect(Array.isArray(res.body.sunkShips.computer)).toBe(true);
    });

    test('status is one of the valid game status values', () => {
      expect(['in_progress', 'player_won', 'computer_won']).toContain(res.body.status);
    });
  });

  // ---- CELL_ALREADY_TARGETED ---------------------------------------------
  describe('error: CELL_ALREADY_TARGETED', () => {
    let gId;
    let res;

    beforeAll(async () => {
      gId = await createReadyGame();
      // Fire once at A6
      await request(app).post(`/api/games/${gId}/fire`).send({ coordinate: 'A6' });
      // Fire again at the same coordinate
      res = await request(app).post(`/api/games/${gId}/fire`).send({ coordinate: 'A6' });
    });

    test('returns HTTP 400', () => {
      expect(res.status).toBe(400);
    });

    test('error code is CELL_ALREADY_TARGETED', () => {
      expect(res.body.error.code).toBe('CELL_ALREADY_TARGETED');
    });
  });

  // ---- GAME_NOT_IN_PROGRESS (game in placement status) -------------------
  describe('error: GAME_NOT_IN_PROGRESS — game still in placement', () => {
    test('returns 409 when game status is placement', async () => {
      const createRes = await request(app).post('/api/games').send({});
      const gId = createRes.body.gameId;

      const res = await request(app)
        .post(`/api/games/${gId}/fire`)
        .send({ coordinate: 'A1' });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('GAME_NOT_IN_PROGRESS');
    });
  });

  // ---- GAME_NOT_FOUND ----------------------------------------------------
  describe('error: GAME_NOT_FOUND', () => {
    test('returns 404 for unknown gameId', async () => {
      const res = await request(app)
        .post('/api/games/unknown-game/fire')
        .send({ coordinate: 'A1' });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('GAME_NOT_FOUND');
    });
  });

  // ---- status becomes player_won when all computer ships are sunk ---------
  describe('win condition: status becomes player_won', () => {
    /**
     * We need the computer's ship coordinates to fire at them.
     * We use GET /api/games/:id to obtain computerBoard cells with hasShip
     * after the game ends — but we must sink ships one by one.
     *
     * Strategy: use the server-side knowledge by reading the game state
     * immediately after creation (during placement status) via GET.
     * At placement time the spec says hasShip may still be hidden; however
     * the test simply fires at all 100 cells exhaustively until player_won.
     * This guarantees all computer ships are hit regardless of their position.
     */
    // NOTE: The deterministic player_won assertion lives in
    // tests/win-condition.test.js, which mocks gameLogic.computerPickShot to
    // guarantee the computer never sinks human ships. The original test here
    // was a race condition (the random computer sometimes won first).
    test('sweeping every cell deterministically ends the game', async () => {
      const gId = await createReadyGame();

      const columns = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
      const rows = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
      let lastRes;

      outer: for (const col of columns) {
        for (const row of rows) {
          const coord = `${col}${row}`;
          const fireRes = await request(app)
            .post(`/api/games/${gId}/fire`)
            .send({ coordinate: coord });

          if (fireRes.status === 400 && fireRes.body.error && fireRes.body.error.code === 'CELL_ALREADY_TARGETED') {
            continue;
          }

          lastRes = fireRes;

          if (fireRes.body.status === 'player_won' || fireRes.body.status === 'computer_won') {
            break outer;
          }
        }
      }

      // The game must have ended with one side or the other winning.
      expect(lastRes).toBeDefined();
      expect(['player_won', 'computer_won']).toContain(lastRes.body.status);
    }, 30000);

    test('computerShot is null when human wins on their own shot', async () => {
      const gId = await createReadyGame();

      const columns = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
      const rows = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
      let winRes = null;

      outer: for (const col of columns) {
        for (const row of rows) {
          const coord = `${col}${row}`;
          const fireRes = await request(app)
            .post(`/api/games/${gId}/fire`)
            .send({ coordinate: coord });

          if (fireRes.status === 400) continue;

          if (fireRes.body.status === 'player_won') {
            winRes = fireRes;
            break outer;
          }
        }
      }

      if (winRes) {
        expect(winRes.body.computerShot).toBeNull();
      }
    }, 30000);

    test('firing after game is over returns 409 GAME_NOT_IN_PROGRESS', async () => {
      const gId = await createReadyGame();

      const columns = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
      const rows = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

      // Fire at every cell to end the game
      for (const col of columns) {
        for (const row of rows) {
          const coord = `${col}${row}`;
          const fireRes = await request(app)
            .post(`/api/games/${gId}/fire`)
            .send({ coordinate: coord });

          if (fireRes.status === 400) continue;
          if (fireRes.body.status === 'player_won' || fireRes.body.status === 'computer_won') {
            break;
          }
        }
      }

      // Now fire one more shot on a fresh coordinate — game is over
      const afterRes = await request(app)
        .post(`/api/games/${gId}/fire`)
        .send({ coordinate: 'A1' });

      expect(afterRes.status).toBe(409);
      expect(afterRes.body.error.code).toBe('GAME_NOT_IN_PROGRESS');
    }, 30000);
  });
});

// ---------------------------------------------------------------------------
// 6.4  GET /api/games/:gameId  — Get Game State
// ---------------------------------------------------------------------------
describe('GET /api/games/:gameId — Get Game State', () => {
  let gId;
  let res;

  beforeAll(async () => {
    const createRes = await request(app).post('/api/games').send({});
    gId = createRes.body.gameId;
    res = await request(app).get(`/api/games/${gId}`);
  });

  test('returns HTTP 200', () => {
    expect(res.status).toBe(200);
  });

  test('returns Content-Type application/json', () => {
    expect(res.headers['content-type']).toMatch(/application\/json/);
  });

  test('response contains gameId', () => {
    expect(res.body.gameId).toBe(gId);
  });

  test('response contains status', () => {
    expect(['placement', 'in_progress', 'player_won', 'computer_won']).toContain(res.body.status);
  });

  test('response contains currentTurn', () => {
    // During placement, currentTurn may be "human" or null depending on implementation
    expect(res.body).toHaveProperty('currentTurn');
  });

  test('response contains humanBoard with 100 cells', () => {
    expect(res.body.humanBoard).toBeDefined();
    expect(Object.keys(boardCells(res.body.humanBoard))).toHaveLength(100);
  });

  test('response contains computerBoard with 100 cells', () => {
    expect(res.body.computerBoard).toBeDefined();
    expect(Object.keys(boardCells(res.body.computerBoard))).toHaveLength(100);
  });

  test('computerBoard cells do not expose hasShip for unsunk ships', () => {
    const cells = boardCells(res.body.computerBoard);
    Object.values(cells).forEach((cell) => {
      if (!cell.isSunk) {
        expect(cell.hasShip).toBeFalsy();
      }
    });
  });

  test('response contains shipsToPlace array', () => {
    expect(Array.isArray(res.body.shipsToPlace)).toBe(true);
  });

  test('shipsToPlace has 5 items when status is placement', () => {
    if (res.body.status === 'placement') {
      expect(res.body.shipsToPlace).toHaveLength(5);
    }
  });

  test('response contains sunkShips with human and computer arrays', () => {
    expect(res.body.sunkShips).toBeDefined();
    expect(Array.isArray(res.body.sunkShips.human)).toBe(true);
    expect(Array.isArray(res.body.sunkShips.computer)).toBe(true);
  });

  test('response contains winner field', () => {
    expect(res.body).toHaveProperty('winner');
  });

  // ---- error: GAME_NOT_FOUND ---------------------------------------------
  test('returns 404 GAME_NOT_FOUND for unknown gameId', async () => {
    const notFound = await request(app).get('/api/games/does-not-exist-xyz');
    expect(notFound.status).toBe(404);
    expect(notFound.body.error.code).toBe('GAME_NOT_FOUND');
  });
});

// ---------------------------------------------------------------------------
// 6.5  POST /api/games/:gameId/reset  — Reset Game
// ---------------------------------------------------------------------------
describe('POST /api/games/:gameId/reset — Reset Game', () => {
  let gId;
  let resetRes;

  beforeAll(async () => {
    // Create a game, place some ships, then reset
    const createRes = await request(app).post('/api/games').send({});
    gId = createRes.body.gameId;

    await request(app)
      .post(`/api/games/${gId}/place-ship`)
      .send({ shipName: 'Carrier', startCoordinate: 'A1', orientation: 'horizontal' });

    resetRes = await request(app).post(`/api/games/${gId}/reset`).send({});
  });

  test('returns HTTP 200', () => {
    expect(resetRes.status).toBe(200);
  });

  test('returns the same gameId', () => {
    expect(resetRes.body.gameId).toBe(gId);
  });

  test('status is back to "placement"', () => {
    expect(resetRes.body.status).toBe('placement');
  });

  test('humanBoard is empty (no ships, no hits)', () => {
    const cells = boardCells(resetRes.body.humanBoard);
    expect(Object.keys(cells)).toHaveLength(100);
    Object.values(cells).forEach((cell) => {
      expect(cell.hasShip).toBe(false);
      expect(cell.isHit).toBe(false);
      expect(cell.isMiss).toBe(false);
    });
  });

  test('shipsToPlace contains all 5 ships again', () => {
    expect(Array.isArray(resetRes.body.shipsToPlace)).toBe(true);
    expect(resetRes.body.shipsToPlace).toHaveLength(5);
  });

  test('shipsToPlace has correct ship names after reset', () => {
    const names = resetRes.body.shipsToPlace.map((s) => s.name);
    expect(names).toContain('Carrier');
    expect(names).toContain('Battleship');
    expect(names).toContain('Destroyer');
    expect(names).toContain('Submarine');
    expect(names).toContain('Patrol Boat');
  });

  test('can place ships again after reset (board was truly cleared)', async () => {
    const placeRes = await request(app)
      .post(`/api/games/${gId}/place-ship`)
      .send({ shipName: 'Carrier', startCoordinate: 'A1', orientation: 'horizontal' });
    expect(placeRes.status).toBe(200);
  });

  // ---- error: GAME_NOT_FOUND ---------------------------------------------
  test('returns 404 GAME_NOT_FOUND for unknown gameId', async () => {
    const res = await request(app).post('/api/games/nonexistent-id/reset').send({});
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('GAME_NOT_FOUND');
  });
});
