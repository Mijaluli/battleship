import { useState } from 'react';
import GameBoard from './GameBoard';

const COLUMNS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

const SHIP_COLORS = {
  'Carrier':     '#3b82f6',
  'Battleship':  '#8b5cf6',
  'Destroyer':   '#f59e0b',
  'Submarine':   '#10b981',
  'Patrol Boat': '#ef4444',
};

function computePreview(startCoord, orientation, size, cells) {
  if (!startCoord) return { coords: [], valid: false };
  const col = startCoord[0];
  const row = parseInt(startCoord.slice(1), 10);
  const colIdx = COLUMNS.indexOf(col);
  const coords = [];
  for (let i = 0; i < size; i++) {
    if (orientation === 'horizontal') {
      const newColIdx = colIdx + i;
      if (newColIdx >= COLUMNS.length) return { coords: [], valid: false };
      coords.push(`${COLUMNS[newColIdx]}${row}`);
    } else {
      const newRow = row + i;
      if (newRow > 10) return { coords: [], valid: false };
      coords.push(`${col}${newRow}`);
    }
  }
  const valid = coords.every(c => cells[c] && !cells[c].hasShip);
  return { coords, valid };
}

export default function ShipPlacement({ gameId, humanBoard, shipsToPlace, onShipPlaced }) {
  const [orientation, setOrientation] = useState('horizontal');
  const [hoverCoord, setHoverCoord] = useState(null);
  const [selectedShip, setSelectedShip] = useState(shipsToPlace[0] || null);
  const [error, setError] = useState(null);
  const [draggingShip, setDraggingShip] = useState(null);

  const currentShip = selectedShip || shipsToPlace[0];
  const preview = currentShip && hoverCoord
    ? computePreview(hoverCoord, orientation, currentShip.size, humanBoard.cells)
    : { coords: [], valid: false };

  function showError(msg) {
    setError(msg);
    setTimeout(() => setError(null), 3500);
  }

  function handleShipDragStart(ship) {
    setSelectedShip(ship);
    setDraggingShip(ship.name);
  }

  function handleShipDragEnd() {
    setDraggingShip(null);
  }

  function handleBoardDragLeave(e) {
    if (!e.currentTarget.contains(e.relatedTarget)) setHoverCoord(null);
  }

  async function placeShip(coord) {
    if (!currentShip) return;
    const { coords, valid } = computePreview(coord, orientation, currentShip.size, humanBoard.cells);
    if (!valid || coords.length === 0) {
      showError(
        coords.length === 0
          ? `${currentShip.name} (${currentShip.size} cells) doesn't fit here in ${orientation} orientation.`
          : `Those cells are already occupied. Choose a different spot.`
      );
      return;
    }
    setError(null);
    try {
      const res = await fetch(`/api/games/${gameId}/place-ship`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shipName: currentShip.name, startCoordinate: coord, orientation }),
      });
      const data = await res.json();
      if (!res.ok) {
        // Server error messages mirror ERROR_MESSAGES in routes/games.js — keep in sync if those change
        showError(data.error?.message || 'Placement failed.');
        return;
      }
      onShipPlaced(data);
      if (data.remainingShipsToPlace?.length > 0) {
        setSelectedShip(data.remainingShipsToPlace[0]);
      }
    } catch {
      showError('Network error — check your connection.');
    }
  }

  return (
    <div className="ship-placement">
      <h2>Place Your Fleet</h2>

      <div className="placement-layout">
        {/* ── Fleet panel ── */}
        <div className="fleet-panel">
          <div className="fleet-panel-title">Your Ships</div>
          {shipsToPlace.map(ship => (
            <div
              key={ship.name}
              className={`ship-card${currentShip?.name === ship.name ? ' selected' : ''}${draggingShip === ship.name ? ' dragging-from' : ''}`}
              onClick={() => setSelectedShip(ship)}
              draggable
              onDragStart={() => handleShipDragStart(ship)}
              onDragEnd={handleShipDragEnd}
            >
              <div className="ship-card-name">{ship.name}</div>
              <div className="ship-card-cells">
                {Array.from({ length: ship.size }).map((_, i) => (
                  <div
                    key={i}
                    className="ship-card-cell"
                    style={{ background: SHIP_COLORS[ship.name] ?? '#64ffda' }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* ── Board + controls ── */}
        <div className="placement-board-section">
          <div className="placement-controls-row">
            <button
              className={`orientation-btn${orientation === 'vertical' ? ' vertical' : ''}`}
              onClick={() => setOrientation(o => o === 'horizontal' ? 'vertical' : 'horizontal')}
            >
              <span className="orientation-icon">↔</span>
              {orientation === 'horizontal' ? 'Horizontal' : 'Vertical'}
            </button>
            {currentShip && (
              <span className="placement-hint">
                Placing: <strong style={{ color: SHIP_COLORS[currentShip.name] ?? '#64ffda' }}>{currentShip.name}</strong>
                {' '}({currentShip.size} cells)
              </span>
            )}
          </div>

          {error && <div className="placement-error">{error}</div>}

          <div
            onDragLeave={handleBoardDragLeave}
            onMouseLeave={() => setHoverCoord(null)}
          >
            <GameBoard
              cells={humanBoard.cells}
              mode="placement"
              onCellClick={placeShip}
              onCellHover={setHoverCoord}
              onCellDragOver={setHoverCoord}
              onCellDrop={placeShip}
              previewCells={preview.coords}
              previewValid={preview.valid}
              disabled={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
