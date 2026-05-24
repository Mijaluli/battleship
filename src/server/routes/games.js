const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { games } = require('../gameStore');
const {
  FLEET,
  getAllCoordinates,
  createEmptyBoard,
  randomPlaceShips,
  placeShip,
  fireShot,
  checkAllSunk,
  computerPickShot,
  sanitizeComputerBoard,
  parseCoordinate,
} = require('../gameLogic');

const router = express.Router();

const ERROR_MESSAGES = {
  OUT_OF_BOUNDS: 'Ship placement is out of bounds',
  OVERLAP: 'Ship overlaps with another ship',
  INVALID_COORDINATE: 'Invalid coordinate',
  INVALID_SHIP_NAME: 'Invalid ship name',
  INVALID_ORIENTATION: 'Invalid orientation',
  SHIP_ALREADY_PLACED: 'Ship has already been placed',
};

function buildSunkShips(humanBoard, computerBoard) {
  return {
    human: humanBoard.ships.filter(s => s.isSunk).map(s => s.name),
    computer: computerBoard.ships.filter(s => s.isSunk).map(s => s.name),
  };
}

function createFreshGame(gameId) {
  const allCoords = getAllCoordinates();
  const humanPlayer = {
    type: 'human',
    board: createEmptyBoard(),
    shotsRemaining: [...allCoords],
    shotsTaken: [],
  };
  const computerPlayer = {
    type: 'computer',
    board: randomPlaceShips(),
    shotsRemaining: [...allCoords],
    shotsTaken: [],
  };
  return {
    id: gameId,
    status: 'placement',
    currentTurn: 'human',
    humanPlayer,
    computerPlayer,
    lastShotResult: null,
    winner: null,
  };
}

// POST /api/games — create new game
router.post('/', (req, res) => {
  const gameId = `game_${uuidv4().slice(0, 8)}`;
  const game = createFreshGame(gameId);
  games.set(gameId, game);
  res.status(201).json({
    gameId,
    status: game.status,
    humanBoard: game.humanPlayer.board,
    shipsToPlace: FLEET,
  });
});

// POST /api/games/:gameId/place-ship
router.post('/:gameId/place-ship', (req, res) => {
  const game = games.get(req.params.gameId);
  if (!game) return res.status(404).json({ error: { code: 'GAME_NOT_FOUND', message: 'Game not found.' } });
  if (game.status !== 'placement') return res.status(409).json({ error: { code: 'GAME_NOT_IN_PLACEMENT', message: 'Game is not in placement phase.' } });

  const { shipName, startCoordinate, orientation } = req.body || {};
  const result = placeShip(game.humanPlayer.board, shipName, startCoordinate, orientation);
  if (!result.ok) {
    return res.status(400).json({ error: { code: result.errorCode, message: ERROR_MESSAGES[result.errorCode] || result.errorCode } });
  }

  game.humanPlayer.board = result.board;
  const placedShips = result.board.ships;
  const remainingShipsToPlace = FLEET.filter(f => !placedShips.some(p => p.name === f.name));

  if (placedShips.length === FLEET.length) {
    game.status = 'in_progress';
  }

  games.set(game.id, game);
  res.status(200).json({
    gameId: game.id,
    status: game.status,
    humanBoard: game.humanPlayer.board,
    placedShips,
    remainingShipsToPlace,
  });
});

// POST /api/games/:gameId/fire
router.post('/:gameId/fire', (req, res) => {
  const game = games.get(req.params.gameId);
  if (!game) return res.status(404).json({ error: { code: 'GAME_NOT_FOUND', message: 'Game not found.' } });
  if (game.status !== 'in_progress') return res.status(409).json({ error: { code: 'GAME_NOT_IN_PROGRESS', message: 'Game is not in progress.' } });

  const { coordinate } = req.body || {};
  if (!parseCoordinate(coordinate)) return res.status(400).json({ error: { code: 'INVALID_COORDINATE', message: 'Invalid coordinate.' } });
  if (game.humanPlayer.shotsTaken.includes(coordinate)) return res.status(400).json({ error: { code: 'CELL_ALREADY_TARGETED', message: 'Cell already targeted.' } });

  // Human fires
  const humanResult = fireShot(
    game.computerPlayer.board,
    coordinate,
    game.humanPlayer.shotsRemaining,
    game.humanPlayer.shotsTaken,
  );
  game.computerPlayer.board = humanResult.updatedBoard;
  game.humanPlayer.shotsRemaining = humanResult.updatedShotsRemaining;
  game.humanPlayer.shotsTaken = humanResult.updatedShotsTaken;

  const humanShot = { coordinate, outcome: humanResult.outcome, shipName: humanResult.shipName };

  // Check if human won
  if (checkAllSunk(game.computerPlayer.board)) {
    game.status = 'player_won';
    game.winner = 'human';
    game.currentTurn = null;
    game.lastShotResult = { human: humanShot, computer: null };
    games.set(game.id, game);
    return res.status(200).json({
      gameId: game.id,
      status: game.status,
      winner: game.winner,
      humanShot,
      computerShot: null,
      humanBoard: game.humanPlayer.board,
      computerBoard: sanitizeComputerBoard(game.computerPlayer.board),
      sunkShips: buildSunkShips(game.humanPlayer.board, game.computerPlayer.board),
    });
  }

  // Computer fires
  const compCoord = computerPickShot(game.computerPlayer.shotsRemaining, game.humanPlayer.board);
  const compResult = fireShot(
    game.humanPlayer.board,
    compCoord,
    game.computerPlayer.shotsRemaining,
    game.computerPlayer.shotsTaken,
  );
  game.humanPlayer.board = compResult.updatedBoard;
  game.computerPlayer.shotsRemaining = compResult.updatedShotsRemaining;
  game.computerPlayer.shotsTaken = compResult.updatedShotsTaken;

  const computerShot = { coordinate: compCoord, outcome: compResult.outcome, shipName: compResult.shipName };
  game.lastShotResult = { human: humanShot, computer: computerShot };

  if (checkAllSunk(game.humanPlayer.board)) {
    game.status = 'computer_won';
    game.winner = 'computer';
    game.currentTurn = null;
  }

  games.set(game.id, game);
  res.status(200).json({
    gameId: game.id,
    status: game.status,
    winner: game.winner,
    humanShot,
    computerShot,
    humanBoard: game.humanPlayer.board,
    computerBoard: sanitizeComputerBoard(game.computerPlayer.board),
    sunkShips: buildSunkShips(game.humanPlayer.board, game.computerPlayer.board),
  });
});

// GET /api/games/:gameId
router.get('/:gameId', (req, res) => {
  const game = games.get(req.params.gameId);
  if (!game) return res.status(404).json({ error: { code: 'GAME_NOT_FOUND', message: 'Game not found.' } });

  const placedShips = game.humanPlayer.board.ships;
  const shipsToPlace = game.status === 'placement'
    ? FLEET.filter(f => !placedShips.some(p => p.name === f.name))
    : [];

  res.status(200).json({
    gameId: game.id,
    status: game.status,
    currentTurn: game.currentTurn,
    winner: game.winner,
    humanBoard: game.humanPlayer.board,
    computerBoard: sanitizeComputerBoard(game.computerPlayer.board),
    shipsToPlace,
    sunkShips: buildSunkShips(game.humanPlayer.board, game.computerPlayer.board),
    lastShotResult: game.lastShotResult,
  });
});

// POST /api/games/:gameId/reset
router.post('/:gameId/reset', (req, res) => {
  const existing = games.get(req.params.gameId);
  if (!existing) return res.status(404).json({ error: { code: 'GAME_NOT_FOUND', message: 'Game not found.' } });

  const game = createFreshGame(req.params.gameId);
  games.set(req.params.gameId, game);

  res.status(200).json({
    gameId: game.id,
    status: game.status,
    humanBoard: game.humanPlayer.board,
    shipsToPlace: FLEET,
  });
});

module.exports = router;
