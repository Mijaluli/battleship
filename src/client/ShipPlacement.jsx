import { useState } from 'react';
import GameBoard from './GameBoard';

const COLUMNS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

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

  const currentShip = selectedShip || shipsToPlace[0];
  const preview = currentShip && hoverCoord
    ? computePreview(hoverCoord, orientation, currentShip.size, humanBoard.cells)
    : { coords: [], valid: false };

  async function handleCellClick(coord) {
    if (!currentShip) return;
    const { coords, valid } = computePreview(coord, orientation, currentShip.size, humanBoard.cells);
    if (!valid || coords.length === 0) return;
    setError(null);
    try {
      const res = await fetch(`/api/games/${gameId}/place-ship`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shipName: currentShip.name, startCoordinate: coord, orientation }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error?.message || 'Placement failed'); return; }
      onShipPlaced(data);
      if (data.remainingShipsToPlace?.length > 0) {
        setSelectedShip(data.remainingShipsToPlace[0]);
      }
    } catch (e) {
      setError('Network error');
    }
  }

  return (
    <div className="ship-placement">
      <h2>Place Your Ships</h2>
      {error && <div className="error-msg">{error}</div>}
      <div className="placement-controls">
        <div className="ship-list">
          {shipsToPlace.map(ship => (
            <div
              key={ship.name}
              className={`ship-item ${currentShip?.name === ship.name ? 'selected' : ''}`}
              onClick={() => setSelectedShip(ship)}
            >
              {ship.name} ({ship.size})
            </div>
          ))}
        </div>
        <div className="orientation-toggle">
          <button
            className={orientation === 'horizontal' ? 'active' : ''}
            onClick={() => setOrientation('horizontal')}
          >Horizontal</button>
          <button
            className={orientation === 'vertical' ? 'active' : ''}
            onClick={() => setOrientation('vertical')}
          >Vertical</button>
        </div>
      </div>
      {currentShip && <p aria-label="placing-hint">Click the board to place your next ship ({currentShip.size} cells)</p>}
      <div
        onMouseLeave={() => setHoverCoord(null)}
      >
        <GameBoard
          cells={humanBoard.cells}
          mode="placement"
          onCellClick={handleCellClick}
          previewCells={preview.valid ? preview.coords : []}
          disabled={false}
        />
      </div>
    </div>
  );
}
