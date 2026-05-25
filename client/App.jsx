import { useState, useEffect, useRef } from 'react';
import ShipPlacement from './ShipPlacement';
import GameBoard from './GameBoard';
import StatusBar from './StatusBar';
import ScoreBoard from './ScoreBoard';
import './styles.css';

export default function App() {
  const [game, setGame] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => { startNewGame(); }, []);

  async function startNewGame() {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/games', { method: 'POST', headers: { 'Content-Type': 'application/json' } });
      const data = await res.json();
      setGame({
        gameId: data.gameId,
        status: data.status,
        humanBoard: data.humanBoard,
        computerBoard: null,
        fleet: data.shipsToPlace,
        shipsToPlace: data.shipsToPlace,
        sunkShips: { human: [], computer: [] },
        lastHumanShot: null,
        lastComputerShot: null,
        currentTurn: data.currentTurn ?? null,
        winner: null,
      });
    } catch {
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
      setGame({
        gameId: data.gameId,
        status: data.status,
        humanBoard: data.humanBoard,
        computerBoard: null,
        fleet: data.shipsToPlace,
        shipsToPlace: data.shipsToPlace,
        sunkShips: { human: [], computer: [] },
        lastHumanShot: null,
        lastComputerShot: null,
        currentTurn: data.currentTurn ?? null,
        winner: null,
      });
    } catch {
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

  const isFiringRef = useRef(false);
  async function handleFire(coordinate) {
    if (!game || game.status !== 'in_progress' || isFiringRef.current) return;
    isFiringRef.current = true;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/games/${game.gameId}/fire`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coordinate }),
      });
      const data = await res.json();
      if (!res.ok) return;
      setGame(prev => ({
        ...prev,
        status: data.status,
        winner: data.winner,
        humanBoard: data.humanBoard,
        computerBoard: data.computerBoard,
        sunkShips: data.sunkShips ?? prev.sunkShips,
        lastHumanShot: data.humanShot ?? prev.lastHumanShot,
        lastComputerShot: data.status === 'player_won' ? null : (data.computerShot ?? prev.lastComputerShot),
      }));
    } catch {
      // silent — user can retry by clicking again
    } finally {
      isFiringRef.current = false;
      setIsLoading(false);
    }
  }

  if (isLoading && !game) return (
    <div>
      <AppHeader />
      <div className="app"><div className="loading">LOADING BATTLESHIP…</div></div>
    </div>
  );

  if (error && !game) return (
    <div>
      <AppHeader />
      <div className="app">
        <div className="page-error">
          {error}
          <br />
          <button onClick={startNewGame}>Retry</button>
        </div>
      </div>
    </div>
  );

  if (!game) return null;

  const inBattle = game.status === 'in_progress' || game.status === 'player_won' || game.status === 'computer_won';

  return (
    <div>
      <AppHeader />
      <div className="app">
        <StatusBar
          status={game.status}
          lastHumanShot={game.lastHumanShot}
          lastComputerShot={game.lastComputerShot}
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
            <div className="boards-row">
              <div className="board-section">
                <ScoreBoard side="own" ships={game.fleet} sunkShips={game.sunkShips} />
                <div className="board-wrap">
                  <div className="board-label">Your Fleet</div>
                  <GameBoard
                    cells={game.humanBoard.cells}
                    mode="battle-own"
                    disabled
                  />
                </div>
              </div>
              <div className="board-section">
                <div className="board-wrap">
                  <div className="board-label">Enemy Waters</div>
                  <GameBoard
                    cells={game.computerBoard?.cells || {}}
                    mode="battle-enemy"
                    onCellClick={handleFire}
                    disabled={isLoading || game.status !== 'in_progress'}
                  />
                </div>
                <ScoreBoard side="enemy" ships={game.fleet} sunkShips={game.sunkShips} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AppHeader() {
  return (
    <header className="app-header">
      {/* Replace the src below with your actual Stampli logo asset */}
      <div className="stampli-logo">
        <span className="s1">STAM</span><span className="s2">PLI</span>
      </div>
      <h1 className="game-title">Battleship</h1>
      <div className="header-spacer" />
    </header>
  );
}
