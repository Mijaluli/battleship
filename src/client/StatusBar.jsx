function shotClass(outcome) {
  if (outcome === 'sunk') return 'sunk';
  if (outcome === 'hit')  return 'hit';
  return 'miss';
}

function shotLabel(shot, who) {
  if (!shot) return null;
  const { coordinate, outcome, shipName } = shot;
  if (outcome === 'sunk') return `${who} sunk ${shipName} at ${coordinate}!`;
  if (outcome === 'hit')  return `${who} hit at ${coordinate}`;
  return `${who} missed at ${coordinate}`;
}

export default function StatusBar({ status, lastHumanShot, lastComputerShot, onReset }) {
  let message = '';
  if (status === 'placement')      message = 'Place your ships to begin the battle.';
  else if (status === 'player_won')   message = '🏆 You win! All enemy ships sunk!';
  else if (status === 'computer_won') message = 'Defeated — your fleet has been destroyed.';
  else if (status === 'in_progress')  message = 'Your turn — fire at the enemy grid.';

  const isOver = status === 'player_won' || status === 'computer_won';
  const humanLabel    = shotLabel(lastHumanShot, 'You');
  const computerLabel = shotLabel(lastComputerShot, 'Enemy');

  return (
    <div className={`status-bar${isOver ? ' game-over' : ''}`}>
      <span className="status-message">{message}</span>

      {(humanLabel || computerLabel) && (
        <div className="shot-results">
          {humanLabel && (
            <span className={`shot-result ${shotClass(lastHumanShot?.outcome)}`}>
              ▶ {humanLabel}
            </span>
          )}
          {computerLabel && (
            <span className={`shot-result ${shotClass(lastComputerShot?.outcome)}`}>
              ◀ {computerLabel}
            </span>
          )}
        </div>
      )}

      {isOver && (
        <button className="reset-btn" onClick={onReset}>Play Again</button>
      )}
    </div>
  );
}
