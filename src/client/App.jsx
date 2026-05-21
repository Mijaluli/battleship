import { useState, useEffect } from 'react';
import ShipPlacement from './ShipPlacement';
import GameBoard from './GameBoard';
import StatusBar from './StatusBar';
import ScoreBoard from './ScoreBoard';

export default function App() {
  const [game, setGame] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    startNewGame();
  }, []);

  async function startNewGame() {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/games', { method: 'POST', headers: { 'Content-Type': 'application/json' } });
      const data = await res.json();
      setGame({ gameId: data.gameId, status: data.status, humanBoard: data.humanBoard, computerBoard: null, fleet: data.shipsToPlace, shipsToPlace: data.shipsToPlace, sunkShips: { human: [], computer: [] }, lastShotResult: null, currentTurn: 'human', winner: null });
    } catch (e) {
      setError('Failed to connect to server.');
    } finally {
      setIsLoading(false);
    }
  }

  async function resetGame() {
    if (!game?.gameId) return startNewGame();
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/games/${game.gameId}/reset`, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
      const data = await res.json();
      setGame({ gameId: data.gameId, status: data.status, humanBoard: data.humanBoard, computerBoard: null, fleet: data.shipsToPlace, shipsToPlace: data.shipsToPlace, sunkShips: { human: [], computer: [] }, lastShotResult: null, currentTurn: 'human', winner: null });
    } catch (e) {
      setError('Failed to reset game.');
    } finally {
      setIsLoading(false);
    }
  }

  function handleShipPlaced(data) {
    setGame(prev => ({
      ...prev,
      status: data.status,
      humanBoard: data.humanBoard,
      shipsToPlace: data.remainingShipsToPlace,
    }));
  }

  async function handleFire(coordinate) {
    if (!game || game.status !== 'in_progress' || isLoading) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/games/${game.gameId}/fire`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coordinate }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error?.message || 'Fire failed'); return; }
      setGame(prev => ({
        ...prev,
        status: data.status,
        winner: data.winner,
        humanBoard: data.humanBoard,
        computerBoard: data.computerBoard,
        sunkShips: data.sunkShips,
        lastShotResult: data.humanShot ? { shooter: 'human', coordinate: data.humanShot.coordinate, outcome: data.humanShot.outcome, shipName: data.humanShot.shipName } : prev.lastShotResult,
        currentTurn: data.status === 'in_progress' ? 'human' : null,
      }));
    } catch (e) {
      setError('Network error.');
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading && !game) return <div className="loading">Loading Battleship...</div>;
  if (error && !game) return <div className="error-msg">{error} <button onClick={startNewGame}>Retry</button></div>;
  if (!game) return null;

  const inBattle = game.status === 'in_progress' || game.status === 'player_won' || game.status === 'computer_won';

  return (
    <div className="app">
      <h1>Battleship</h1>
      <StatusBar
        status={game.status}
        currentTurn={game.currentTurn}
        lastShotResult={game.lastShotResult}
        onReset={resetGame}
      />
      {game.status === 'placement' && (
        <ShipPlacement
          gameId={game.gameId}
          humanBoard={game.humanBoard}
          shipsToPlace={game.shipsToPlace}
          onShipPlaced={handleShipPlaced}
        />
      )}
      {inBattle && (
        <div className="battle-view">
          <ScoreBoard sunkShips={game.sunkShips} fleet={game.fleet} />
          <div className="boards-row">
            <div className="board-section">
              <h3>Your Board</h3>
              <GameBoard
                cells={game.humanBoard.cells}
                mode="battle-own"
                disabled
              />
            </div>
            <div className="board-section">
              <h3>Enemy Board</h3>
              <GameBoard
                cells={game.computerBoard?.cells || {}}
                mode="battle-enemy"
                onCellClick={handleFire}
                disabled={isLoading || game.status !== 'in_progress'}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
