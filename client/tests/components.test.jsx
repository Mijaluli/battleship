/**
 * Frontend component behavioral tests — derived from SPEC.md sections 7 and 3.
 *
 * These tests import React components from ../.
 * Until those files are implemented, the test suite will fail at the import
 * stage with "Cannot find module '../...'" — the correct red state.
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

import GameBoard from '../GameBoard';
import Cell from '../Cell';
import ShipPlacement from '../ShipPlacement';
import StatusBar from '../StatusBar';
import ScoreBoard from '../ScoreBoard';

// ---------------------------------------------------------------------------
// Test data helpers
// ---------------------------------------------------------------------------

/** Build an empty 10x10 cells map (all cells false/null). */
function buildEmptyCells() {
  const columns = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
  const rows = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
  const cells = {};
  for (const col of columns) {
    for (const row of rows) {
      const coord = `${col}${row}`;
      cells[coord] = {
        coordinate: coord,
        hasShip: false,
        isHit: false,
        isMiss: false,
        shipId: null,
      };
    }
  }
  return cells;
}

/** Standard fleet definition from SPEC.md. */
const FULL_FLEET = [
  { name: 'Carrier', size: 5 },
  { name: 'Battleship', size: 4 },
  { name: 'Destroyer', size: 3 },
  { name: 'Submarine', size: 3 },
  { name: 'Patrol Boat', size: 2 },
];

// ---------------------------------------------------------------------------
// GameBoard — 10×10 grid rendering
// ---------------------------------------------------------------------------
describe('GameBoard', () => {
  const emptyCells = buildEmptyCells();

  test('renders exactly 100 cells', () => {
    render(
      <GameBoard
        cells={emptyCells}
        mode="battle-enemy"
        onCellClick={() => {}}
        previewCells={[]}
        disabled={false}
      />
    );

    // Each cell should render a data-coordinate attribute or a role="gridcell"
    // We count by querying all cell elements.
    // The component must render 100 individual cell elements.
    const cellElements = document.querySelectorAll('[data-coordinate]');
    expect(cellElements.length).toBe(100);
  });

  test('renders column headers A through J', () => {
    render(
      <GameBoard
        cells={emptyCells}
        mode="placement"
        onCellClick={() => {}}
        previewCells={[]}
        disabled={false}
      />
    );

    const columns = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
    columns.forEach((col) => {
      expect(screen.getByText(col)).toBeInTheDocument();
    });
  });

  test('renders row headers 1 through 10', () => {
    render(
      <GameBoard
        cells={emptyCells}
        mode="placement"
        onCellClick={() => {}}
        previewCells={[]}
        disabled={false}
      />
    );

    for (let row = 1; row <= 10; row++) {
      expect(screen.getByText(String(row))).toBeInTheDocument();
    }
  });
});

// ---------------------------------------------------------------------------
// Cell — CSS class visual states
// ---------------------------------------------------------------------------
describe('Cell', () => {
  test('renders a hit cell with a CSS class indicating hit', () => {
    const { container } = render(
      <Cell
        coordinate="B4"
        hasShip={true}
        isHit={true}
        isMiss={false}
        isSunk={false}
        isPreview={false}
        isDisabled={false}
        onClick={() => {}}
      />
    );

    const cell = container.firstChild;
    // The cell element must have a class that communicates the hit state
    expect(cell.className).toMatch(/hit/i);
  });

  test('renders a miss cell with a CSS class indicating miss', () => {
    const { container } = render(
      <Cell
        coordinate="C6"
        hasShip={false}
        isHit={false}
        isMiss={true}
        isSunk={false}
        isPreview={false}
        isDisabled={false}
        onClick={() => {}}
      />
    );

    const cell = container.firstChild;
    expect(cell.className).toMatch(/miss/i);
  });

  test('renders a sunk cell with a CSS class indicating sunk (distinct from hit)', () => {
    const { container } = render(
      <Cell
        coordinate="D2"
        hasShip={true}
        isHit={true}
        isMiss={false}
        isSunk={true}
        isPreview={false}
        isDisabled={false}
        onClick={() => {}}
      />
    );

    const cell = container.firstChild;
    expect(cell.className).toMatch(/sunk/i);
  });

  test('sunk CSS class is different from hit-only CSS class', () => {
    const { container: hitContainer } = render(
      <Cell
        coordinate="E5"
        hasShip={true}
        isHit={true}
        isMiss={false}
        isSunk={false}
        isPreview={false}
        isDisabled={false}
        onClick={() => {}}
      />
    );

    const { container: sunkContainer } = render(
      <Cell
        coordinate="F5"
        hasShip={true}
        isHit={true}
        isMiss={false}
        isSunk={true}
        isPreview={false}
        isDisabled={false}
        onClick={() => {}}
      />
    );

    expect(hitContainer.firstChild.className).not.toBe(sunkContainer.firstChild.className);
  });

  test('renders an empty cell without hit or miss classes', () => {
    const { container } = render(
      <Cell
        coordinate="A1"
        hasShip={false}
        isHit={false}
        isMiss={false}
        isSunk={false}
        isPreview={false}
        isDisabled={false}
        onClick={() => {}}
      />
    );

    const cell = container.firstChild;
    expect(cell.className).not.toMatch(/hit/i);
    expect(cell.className).not.toMatch(/miss/i);
    expect(cell.className).not.toMatch(/sunk/i);
  });

  test('renders a preview cell with a preview CSS class', () => {
    const { container } = render(
      <Cell
        coordinate="G3"
        hasShip={false}
        isHit={false}
        isMiss={false}
        isSunk={false}
        isPreview={true}
        isDisabled={false}
        onClick={() => {}}
      />
    );

    const cell = container.firstChild;
    expect(cell.className).toMatch(/preview/i);
  });

  test('fires onClick when clicked and not disabled', () => {
    const handleClick = vi.fn();
    const { container } = render(
      <Cell
        coordinate="H8"
        hasShip={false}
        isHit={false}
        isMiss={false}
        isSunk={false}
        isPreview={false}
        isDisabled={false}
        onClick={handleClick}
      />
    );

    container.firstChild.click();
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('does NOT fire onClick when disabled', () => {
    const handleClick = vi.fn();
    const { container } = render(
      <Cell
        coordinate="I9"
        hasShip={false}
        isHit={false}
        isMiss={false}
        isSunk={false}
        isPreview={false}
        isDisabled={true}
        onClick={handleClick}
      />
    );

    container.firstChild.click();
    expect(handleClick).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// ShipPlacement — renders all 5 unplaced ships and orientation selector
// ---------------------------------------------------------------------------
describe('ShipPlacement', () => {
  const emptyCells = buildEmptyCells();

  test('renders all 5 unplaced ships', () => {
    render(
      <ShipPlacement
        gameId="game_test_123"
        humanBoard={{ cells: emptyCells, ships: [] }}
        shipsToPlace={FULL_FLEET}
        onShipPlaced={() => {}}
      />
    );

    FULL_FLEET.forEach((ship) => {
      expect(screen.getAllByText(new RegExp(ship.name, 'i')).length).toBeGreaterThanOrEqual(1);
    });
  });

  test('renders an orientation selector with horizontal option', () => {
    render(
      <ShipPlacement
        gameId="game_test_123"
        humanBoard={{ cells: emptyCells, ships: [] }}
        shipsToPlace={FULL_FLEET}
        onShipPlaced={() => {}}
      />
    );

    // The orientation control must offer both horizontal and vertical options
    expect(screen.getByText(/horizontal/i)).toBeInTheDocument();
  });

  test('renders an orientation selector that can toggle to vertical', () => {
    render(
      <ShipPlacement
        gameId="game_test_123"
        humanBoard={{ cells: emptyCells, ships: [] }}
        shipsToPlace={FULL_FLEET}
        onShipPlaced={() => {}}
      />
    );

    const btn = screen.getByRole('button', { name: /horizontal|vertical/i });
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    expect(screen.getByText(/vertical/i)).toBeInTheDocument();
  });

  test('does not show already-placed ships in the unplaced list', () => {
    const remainingShips = FULL_FLEET.filter((s) => s.name !== 'Carrier');

    render(
      <ShipPlacement
        gameId="game_test_456"
        humanBoard={{ cells: emptyCells, ships: [] }}
        shipsToPlace={remainingShips}
        onShipPlaced={() => {}}
      />
    );

    // Carrier should NOT appear in the unplaced list
    // (It may appear elsewhere if placed ships are shown, but we test shipsToPlace)
    const unplacedItems = screen.queryAllByText(/Carrier/i);
    // There should be zero references to Carrier in the unplaced list
    expect(unplacedItems.length).toBe(0);
  });

  test('renders the game board for placement interaction', () => {
    render(
      <ShipPlacement
        gameId="game_test_789"
        humanBoard={{ cells: emptyCells, ships: [] }}
        shipsToPlace={FULL_FLEET}
        onShipPlaced={() => {}}
      />
    );

    // The board must be rendered (100 cells visible)
    const cellElements = document.querySelectorAll('[data-coordinate]');
    expect(cellElements.length).toBe(100);
  });
});

// ---------------------------------------------------------------------------
// StatusBar — contextual status messages
// ---------------------------------------------------------------------------
describe('StatusBar', () => {
  test('displays "Your turn" when currentTurn is "human"', () => {
    render(
      <StatusBar
        status="in_progress"
        currentTurn="human"
        lastShotResult={null}
        onReset={() => {}}
      />
    );

    expect(screen.getByText(/your turn/i)).toBeInTheDocument();
  });

  test('does NOT say "Your turn" during the placement phase', () => {
    render(
      <StatusBar
        status="placement"
        lastHumanShot={null}
        lastComputerShot={null}
        onReset={() => {}}
      />
    );

    expect(screen.queryByText(/your turn/i)).not.toBeInTheDocument();
  });

  test('displays a winner message when status is player_won', () => {
    render(
      <StatusBar
        status="player_won"
        currentTurn={null}
        lastShotResult={null}
        onReset={() => {}}
      />
    );

    // Must show some kind of win/victory message
    const winMessage = screen.queryByText(/won|win|victory|congratulations/i);
    expect(winMessage).toBeInTheDocument();
  });

  test('displays a loss message when status is computer_won', () => {
    render(
      <StatusBar
        status="computer_won"
        currentTurn={null}
        lastShotResult={null}
        onReset={() => {}}
      />
    );

    // Must show some kind of loss/defeat message
    const lossMessage = screen.queryByText(/lost|lose|defeat|game over/i);
    expect(lossMessage).toBeInTheDocument();
  });

  test('displays a Play Again / Reset button when game is over (player_won)', () => {
    const handleReset = vi.fn();
    render(
      <StatusBar
        status="player_won"
        currentTurn={null}
        lastShotResult={null}
        onReset={handleReset}
      />
    );

    const resetButton = screen.getByRole('button', { name: /play again|reset|new game/i });
    expect(resetButton).toBeInTheDocument();
    resetButton.click();
    expect(handleReset).toHaveBeenCalledTimes(1);
  });

  test('displays a Play Again / Reset button when game is over (computer_won)', () => {
    render(
      <StatusBar
        status="computer_won"
        currentTurn={null}
        lastShotResult={null}
        onReset={() => {}}
      />
    );

    expect(screen.getByRole('button', { name: /play again|reset|new game/i })).toBeInTheDocument();
  });

  test('shows last shot result outcome when provided', () => {
    render(
      <StatusBar
        status="in_progress"
        lastHumanShot={{ coordinate: 'C5', outcome: 'hit', shipName: null }}
        lastComputerShot={null}
        onReset={() => {}}
      />
    );

    const hitText = screen.queryByText(/hit/i);
    expect(hitText).toBeInTheDocument();
  });

  test('shows sunk ship name when last shot sunk a ship', () => {
    render(
      <StatusBar
        status="in_progress"
        lastHumanShot={{ coordinate: 'D3', outcome: 'sunk', shipName: 'Destroyer' }}
        lastComputerShot={null}
        onReset={() => {}}
      />
    );

    expect(screen.getByText(/Destroyer/i)).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// ScoreBoard — fleet health for both players
// ---------------------------------------------------------------------------
describe('ScoreBoard', () => {
  test('shows all 5 ship names for the human side', () => {
    render(
      <ScoreBoard
        side="own"
        ships={FULL_FLEET}
        sunkShips={{ human: [], computer: [] }}
      />
    );

    FULL_FLEET.forEach((ship) => {
      expect(screen.getAllByText(new RegExp(ship.name, 'i')).length).toBeGreaterThanOrEqual(1);
    });
  });

  test('shows all 5 ship names for the computer side', () => {
    render(
      <ScoreBoard
        side="enemy"
        ships={FULL_FLEET}
        sunkShips={{ human: [], computer: [] }}
      />
    );

    FULL_FLEET.forEach((ship) => {
      expect(screen.getAllByText(new RegExp(ship.name, 'i')).length).toBeGreaterThanOrEqual(1);
    });
  });

  test('marks sunk ships visually with a sunk CSS class or indicator', () => {
    render(
      <ScoreBoard
        side="own"
        ships={FULL_FLEET}
        sunkShips={{ human: ['Patrol Boat'], computer: [] }}
      />
    );

    const sunkIndicators = document.querySelectorAll('.sunk, [data-sunk="true"], [class*="sunk"]');
    expect(sunkIndicators.length).toBeGreaterThan(0);
  });

  test('afloat ships are not marked as sunk', () => {
    const { container } = render(
      <ScoreBoard
        side="own"
        ships={FULL_FLEET}
        sunkShips={{ human: [], computer: [] }}
      />
    );

    const sunkIndicators = container.querySelectorAll('.sunk, [data-sunk="true"], [class*="sunk"]');
    expect(sunkIndicators.length).toBe(0);
  });

  test('correctly marks only the sunk ships, not the afloat ones', () => {
    const { container } = render(
      <ScoreBoard
        side="own"
        ships={FULL_FLEET}
        sunkShips={{ human: ['Carrier'], computer: [] }}
      />
    );

    const sunkIndicators = container.querySelectorAll('.sunk, [data-sunk="true"], [class*="sunk"]');
    expect(sunkIndicators.length).toBe(1);
  });
});
