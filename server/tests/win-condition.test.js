'use strict';

/**
 * Deterministic win-condition test.
 *
 * The original test in api.test.js was flaky: it fired at every cell A1..J10
 * in order, but each /fire call also triggers a random computer shot. With
 * 17 human-ship cells, the random computer sometimes sank all human ships
 * before the ordered sweep finished sinking the computer's ships.
 *
 * Fix: mock both `randomPlaceShips` (so the computer's ships are placed in
 * columns A-E, which the ordered human sweep covers in its first 50 shots)
 * and `computerPickShot` (so the computer only ever fires in columns F-J,
 * which contain no human ships). This guarantees the human wins before the
 * computer can do any damage.
 *
 * jest.mock is scoped to this file only, so other test suites are unaffected.
 */

jest.mock("../gameLogic", () => {
  const actual = jest.requireActual("../gameLogic");

  // ----- Deterministic computer-ship placement -----------------------------
  // All 5 computer ships placed inside columns A-E, rows 6-10.
  // (Human ships live in rows 1-5, columns A-E. No overlap.)
  // The human sweep order is A1..A10, B1..B10, ..., E1..E10, so by shot #50
  // the human has fired at every cell in columns A-E -> every computer ship
  // cell has been hit -> human wins.
  function deterministicPlaceComputerShips() {
    const fleet = [
      { name: 'Carrier',     coords: ['A6', 'B6', 'C6', 'D6', 'E6'] },
      { name: 'Battleship',  coords: ['A7', 'B7', 'C7', 'D7'] },
      { name: 'Destroyer',   coords: ['A8', 'B8', 'C8'] },
      { name: 'Submarine',   coords: ['A9', 'B9', 'C9'] },
      { name: 'Patrol Boat', coords: ['A10', 'B10'] },
    ];
    let board = actual.createEmptyBoard();
    const newCells = { ...board.cells };
    const ships = [];
    for (const ship of fleet) {
      const id = `ship_${ship.name.toLowerCase().replace(' ', '_')}_computer_test`;
      for (const c of ship.coords) {
        newCells[c] = { ...newCells[c], hasShip: true, shipId: id };
      }
      ships.push({
        id,
        name: ship.name,
        size: ship.coords.length,
        coordinates: ship.coords,
        orientation: 'horizontal',
        isSunk: false,
      });
    }
    return { cells: newCells, ships };
  }

  // ----- Deterministic computer shot picker --------------------------------
  // The computer only ever fires in columns F-J -> no human ship is ever hit.
  const SAFE_COLS = new Set(['F', 'G', 'H', 'I', 'J']);

  function safeComputerPickShot(shotsRemaining) {
    const safe = shotsRemaining.find((c) => SAFE_COLS.has(c[0]));
    // If we somehow ran out of safe cells the human has already won (we only
    // need ~50 safe cells and there are 50 of them), but guard anyway.
    return safe || shotsRemaining[0];
  }

  return {
    ...actual,
    randomPlaceShips: deterministicPlaceComputerShips,
    computerPickShot: safeComputerPickShot,
  };
});

const request = require('supertest');
const app = require("../app.js");

async function createReadyGame() {
  const createRes = await request(app).post('/api/games').send({});
  const gId = createRes.body.gameId;

  // Human ships in odd rows 1-9, columns A-E (1-cell gap between each).
  await request(app)
    .post(`/api/games/${gId}/place-ship`)
    .send({ shipName: 'Carrier', startCoordinate: 'A1', orientation: 'horizontal' });
  await request(app)
    .post(`/api/games/${gId}/place-ship`)
    .send({ shipName: 'Battleship', startCoordinate: 'A3', orientation: 'horizontal' });
  await request(app)
    .post(`/api/games/${gId}/place-ship`)
    .send({ shipName: 'Destroyer', startCoordinate: 'A5', orientation: 'horizontal' });
  await request(app)
    .post(`/api/games/${gId}/place-ship`)
    .send({ shipName: 'Submarine', startCoordinate: 'A7', orientation: 'horizontal' });
  await request(app)
    .post(`/api/games/${gId}/place-ship`)
    .send({ shipName: 'Patrol Boat', startCoordinate: 'A9', orientation: 'horizontal' });

  return gId;
}

describe('POST /api/games/:gameId/fire — win condition (deterministic)', () => {
  test('game status becomes player_won after all computer ships are sunk', async () => {
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

        if (
          fireRes.status === 400 &&
          fireRes.body.error &&
          fireRes.body.error.code === 'CELL_ALREADY_TARGETED'
        ) {
          continue;
        }

        lastRes = fireRes;

        if (
          fireRes.body.status === 'player_won' ||
          fireRes.body.status === 'computer_won'
        ) {
          break outer;
        }
      }
    }

    expect(lastRes).toBeDefined();
    expect(lastRes.body.status).toBe('player_won');
    expect(lastRes.body.winner).toBe('human');
  }, 30000);
});
