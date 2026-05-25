const { v4: uuidv4 } = require('uuid');

const COLUMNS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
const ROWS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const FLEET = [
  { name: 'Carrier', size: 5 },
  { name: 'Battleship', size: 4 },
  { name: 'Destroyer', size: 3 },
  { name: 'Submarine', size: 3 },
  { name: 'Patrol Boat', size: 2 },
];

function getAllCoordinates() {
  const coords = [];
  for (const col of COLUMNS) {
    for (const row of ROWS) {
      coords.push(`${col}${row}`);
    }
  }
  return coords;
}

function parseCoordinate(coord) {
  if (typeof coord !== 'string') return null;
  const col = coord[0];
  const row = parseInt(coord.slice(1), 10);
  if (!COLUMNS.includes(col)) return null;
  if (!ROWS.includes(row)) return null;
  return { col, row };
}

function createEmptyBoard() {
  const cells = {};
  for (const coord of getAllCoordinates()) {
    cells[coord] = { coordinate: coord, hasShip: false, isHit: false, isMiss: false, isSunk: false, shipId: null };
  }
  return { cells, ships: [] };
}

function getShipCoordinates(startCoord, orientation, size) {
  const parsed = parseCoordinate(startCoord);
  if (!parsed) return null;
  const { col, row } = parsed;
  const colIdx = COLUMNS.indexOf(col);
  const coords = [];
  for (let i = 0; i < size; i++) {
    if (orientation === 'horizontal') {
      const newColIdx = colIdx + i;
      if (newColIdx >= COLUMNS.length) return null;
      coords.push(`${COLUMNS[newColIdx]}${row}`);
    } else {
      const newRow = row + i;
      if (newRow > 10) return null;
      coords.push(`${col}${newRow}`);
    }
  }
  return coords;
}

function placeShip(board, shipName, startCoord, orientation) {
  if (!parseCoordinate(startCoord)) return { ok: false, errorCode: 'INVALID_COORDINATE' };
  const shipDef = FLEET.find(s => s.name === shipName);
  if (!shipDef) return { ok: false, errorCode: 'INVALID_SHIP_NAME' };
  if (orientation !== 'horizontal' && orientation !== 'vertical') return { ok: false, errorCode: 'INVALID_ORIENTATION' };
  if (board.ships.some(s => s.name === shipName)) return { ok: false, errorCode: 'SHIP_ALREADY_PLACED' };

  const coords = getShipCoordinates(startCoord, orientation, shipDef.size);
  if (!coords) return { ok: false, errorCode: 'OUT_OF_BOUNDS' };

  for (const coord of coords) {
    if (board.cells[coord].hasShip) return { ok: false, errorCode: 'OVERLAP' };
  }
  for (const coord of getBufferCoords(coords)) {
    if (board.cells[coord].hasShip) return { ok: false, errorCode: 'TOO_CLOSE' };
  }

  const shipId = `ship_${shipName.toLowerCase().replaceAll(' ', '_')}_human_${uuidv4().slice(0, 8)}`;
  const newCells = { ...board.cells };
  for (const coord of coords) {
    newCells[coord] = { ...newCells[coord], hasShip: true, shipId };
  }
  const ship = { id: shipId, name: shipName, size: shipDef.size, coordinates: coords, orientation, isSunk: false };
  return { ok: true, board: { cells: newCells, ships: [...board.ships, ship] } };
}

function randomPlaceShips() {
  let board = createEmptyBoard();
  for (const shipDef of FLEET) {
    let placed = false;
    while (!placed) {
      const colIdx = Math.floor(Math.random() * COLUMNS.length);
      const row = Math.floor(Math.random() * ROWS.length) + 1;
      const orientation = Math.random() < 0.5 ? 'horizontal' : 'vertical';
      const startCoord = `${COLUMNS[colIdx]}${row}`;
      const result = placeShipForComputer(board, shipDef, startCoord, orientation);
      if (result.ok) {
        board = result.board;
        placed = true;
      }
    }
  }
  return board;
}

function placeShipForComputer(board, shipDef, startCoord, orientation) {
  if (orientation !== 'horizontal' && orientation !== 'vertical') return { ok: false };
  const coords = getShipCoordinates(startCoord, orientation, shipDef.size);
  if (!coords) return { ok: false };
  for (const coord of coords) {
    if (board.cells[coord].hasShip) return { ok: false };
  }
  for (const coord of getBufferCoords(coords)) {
    if (board.cells[coord].hasShip) return { ok: false };
  }
  const shipId = `ship_${shipDef.name.toLowerCase().replaceAll(' ', '_')}_computer_${uuidv4().slice(0, 8)}`;
  const newCells = { ...board.cells };
  for (const coord of coords) {
    newCells[coord] = { ...newCells[coord], hasShip: true, shipId };
  }
  const ship = { id: shipId, name: shipDef.name, size: shipDef.size, coordinates: coords, orientation, isSunk: false };
  return { ok: true, board: { cells: newCells, ships: [...board.ships, ship] } };
}

function fireShot(board, coordinate, shotsRemaining, shotsTaken) {
  const cell = board.cells[coordinate];
  const newCells = { ...board.cells };
  const newShips = board.ships.map(s => ({ ...s }));
  let outcome, shipName = null;

  if (cell.hasShip) {
    newCells[coordinate] = { ...cell, isHit: true };
    const ship = newShips.find(s => s.coordinates.includes(coordinate));
    const allHit = ship.coordinates.every(c => newCells[c].isHit);
    if (allHit) {
      ship.isSunk = true;
      for (const c of ship.coordinates) {
        newCells[c] = { ...newCells[c], isSunk: true };
      }
      outcome = 'sunk';
      shipName = ship.name;
    } else {
      outcome = 'hit';
      // shipName intentionally null on plain hit — only revealed on 'sunk'
    }
  } else {
    newCells[coordinate] = { ...cell, isMiss: true };
    outcome = 'miss';
  }

  return {
    outcome,
    shipName,
    updatedBoard: { cells: newCells, ships: newShips },
    updatedShotsRemaining: shotsRemaining.filter(c => c !== coordinate),
    updatedShotsTaken: [...shotsTaken, coordinate],
  };
}

function checkAllSunk(board) {
  return board.ships.length === FLEET.length && board.ships.every(s => s.isSunk);
}

function getBufferCoords(shipCoords) {
  const coordSet = new Set(shipCoords);
  const buffer = new Set();
  for (const coord of shipCoords) {
    const colIdx = COLUMNS.indexOf(coord[0]);
    const row = parseInt(coord.slice(1), 10);
    for (let dc = -1; dc <= 1; dc++) {
      for (let dr = -1; dr <= 1; dr++) {
        if (dc === 0 && dr === 0) continue;
        const ni = colIdx + dc;
        const nr = row + dr;
        if (ni >= 0 && ni < COLUMNS.length && nr >= 1 && nr <= 10) {
          const nc = `${COLUMNS[ni]}${nr}`;
          if (!coordSet.has(nc)) buffer.add(nc);
        }
      }
    }
  }
  return [...buffer];
}

function getAdjacentCoords(coord) {
  const col = coord[0];
  const row = parseInt(coord.slice(1), 10);
  const colIdx = COLUMNS.indexOf(col);
  const result = [];
  if (colIdx > 0)               result.push(`${COLUMNS[colIdx - 1]}${row}`);
  if (colIdx < COLUMNS.length - 1) result.push(`${COLUMNS[colIdx + 1]}${row}`);
  if (row > 1)  result.push(`${col}${row - 1}`);
  if (row < 10) result.push(`${col}${row + 1}`);
  return result;
}

// Hunt mode uses a checkerboard pattern — guaranteed to intersect every ship ≥2 cells,
// halving the expected shots needed to find the first hit.
// Target mode fires adjacent cells when an unsunk hit exists.
function computerPickShot(shotsRemaining, humanBoard) {
  const remaining = new Set(shotsRemaining);

  if (humanBoard) {
    // Target mode: find cells that were hit but belong to a ship not yet sunk
    const unsunkHits = Object.entries(humanBoard.cells)
      .filter(([, cell]) => cell.isHit && !cell.isSunk)
      .map(([coord]) => coord);

    if (unsunkHits.length > 0) {
      const candidates = new Set();

      if (unsunkHits.length >= 2) {
        const hitRows = new Set(unsunkHits.map(c => parseInt(c.slice(1), 10)));
        const hitCols = new Set(unsunkHits.map(c => c[0]));

        if (hitRows.size === 1) {
          // Horizontal axis established — extend left/right only
          const row = [...hitRows][0];
          const colIdxs = unsunkHits.map(c => COLUMNS.indexOf(c[0])).sort((a, b) => a - b);
          const lo = colIdxs[0];
          const hi = colIdxs[colIdxs.length - 1];
          if (lo > 0) { const c = `${COLUMNS[lo - 1]}${row}`; if (remaining.has(c)) candidates.add(c); }
          if (hi < COLUMNS.length - 1) { const c = `${COLUMNS[hi + 1]}${row}`; if (remaining.has(c)) candidates.add(c); }
        } else if (hitCols.size === 1) {
          // Vertical axis established — extend up/down only
          const col = [...hitCols][0];
          const rows = unsunkHits.map(c => parseInt(c.slice(1), 10)).sort((a, b) => a - b);
          const lo = rows[0];
          const hi = rows[rows.length - 1];
          if (lo > 1)  { const c = `${col}${lo - 1}`; if (remaining.has(c)) candidates.add(c); }
          if (hi < 10) { const c = `${col}${hi + 1}`; if (remaining.has(c)) candidates.add(c); }
        }
      }

      // Fall back to all adjacent (single hit or ambiguous axis)
      if (candidates.size === 0) {
        for (const hit of unsunkHits) {
          for (const adj of getAdjacentCoords(hit)) {
            if (remaining.has(adj)) candidates.add(adj);
          }
        }
      }

      if (candidates.size > 0) {
        const arr = [...candidates];
        return arr[Math.floor(Math.random() * arr.length)];
      }
    }
  }

  // Hunt mode: checkerboard (even parity only)
  const checkerboard = shotsRemaining.filter(coord => {
    const colIdx = COLUMNS.indexOf(coord[0]);
    const row = parseInt(coord.slice(1), 10);
    return (colIdx + row) % 2 === 0;
  });
  const pool = checkerboard.length > 0 ? checkerboard : shotsRemaining;
  return pool[Math.floor(Math.random() * pool.length)];
}

function sanitizeComputerBoard(board) {
  const sunkCoords = new Set(board.ships.filter(s => s.isSunk).flatMap(s => s.coordinates));
  const newCells = {};
  for (const [coord, cell] of Object.entries(board.cells)) {
    if (cell.hasShip && !sunkCoords.has(coord)) {
      newCells[coord] = { ...cell, hasShip: false, shipId: null };
    } else if (sunkCoords.has(coord)) {
      newCells[coord] = { ...cell, hasShip: false, shipId: null, isSunk: true, isHit: true };
    } else {
      newCells[coord] = { ...cell };
    }
  }
  return {
    cells: newCells,
    ships: board.ships.filter(s => s.isSunk).map(s => ({ ...s })),
  };
}

module.exports = {
  FLEET,
  getAllCoordinates,
  parseCoordinate,
  createEmptyBoard,
  getShipCoordinates,
  placeShip,
  randomPlaceShips,
  fireShot,
  checkAllSunk,
  computerPickShot,
  sanitizeComputerBoard,
};
