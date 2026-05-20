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
    cells[coord] = { coordinate: coord, hasShip: false, isHit: false, isMiss: false, shipId: null };
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

  const shipId = `ship_${shipName.toLowerCase().replace(' ', '_')}_human_${uuidv4().slice(0, 8)}`;
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
  const shipId = `ship_${shipDef.name.toLowerCase().replace(' ', '_')}_computer_${uuidv4().slice(0, 8)}`;
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
      outcome = 'sunk';
      shipName = ship.name;
    } else {
      outcome = 'hit';
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
  return board.ships.length === 5 && board.ships.every(s => s.isSunk);
}

function computerPickShot(shotsRemaining) {
  const idx = Math.floor(Math.random() * shotsRemaining.length);
  return shotsRemaining[idx];
}

function sanitizeComputerBoard(board) {
  const sunkShipIds = new Set(board.ships.filter(s => s.isSunk).flatMap(s => s.coordinates));
  const newCells = {};
  for (const [coord, cell] of Object.entries(board.cells)) {
    if (cell.hasShip && !sunkShipIds.has(coord)) {
      newCells[coord] = { ...cell, hasShip: false, shipId: null };
    } else {
      newCells[coord] = { ...cell };
    }
  }
  return { cells: newCells, ships: board.ships };
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
