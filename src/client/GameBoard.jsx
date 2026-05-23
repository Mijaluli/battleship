import React from 'react';
import Cell from './Cell';

const COLUMNS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
const ROWS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export default function GameBoard({ cells, mode, onCellClick, previewCells = [], disabled = false }) {
  return (
    <div className="board-wrapper">
      <div className="board">
        {/* Corner */}
        <div className="board-header-corner" />
        {/* Column headers */}
        {COLUMNS.map(col => (
          <div key={col} className="board-header-cell">{col}</div>
        ))}
        {ROWS.map(row => (
          <React.Fragment key={row}>
            {/* Row header */}
            <div className="board-header-cell">{row}</div>
            {/* Cells */}
            {COLUMNS.map(col => {
              const coord = `${col}${row}`;
              const cell = cells[coord] || {};
              const isPreview = previewCells.includes(coord);
              const isEnemy = mode === 'battle-enemy';
              const isClickable = !disabled && (mode === 'placement' || isEnemy);
              const alreadyFired = isEnemy && (cell.isHit || cell.isMiss);
              return (
                <Cell
                  key={coord}
                  coordinate={coord}
                  hasShip={mode !== 'battle-enemy' && cell.hasShip}
                  isHit={cell.isHit}
                  isMiss={cell.isMiss}
                  isSunk={cell.isSunk || false}
                  isPreview={isPreview}
                  isDisabled={!isClickable || alreadyFired}
                  onClick={() => onCellClick && onCellClick(coord)}
                />
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
