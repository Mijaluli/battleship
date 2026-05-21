function formatShotMsg(shot) {
  if (!shot) return '';
  const { shooter, coordinate, outcome, shipName } = shot;
  const who = shooter === 'human' ? 'You' : 'Computer';
  if (outcome === 'sunk') return `${who} sunk ${shipName} at ${coordinate}!`;
  if (outcome === 'hit') return `${who} hit at ${coordinate}!`;
  return `${who} missed at ${coordinate}.`;
}

export default function StatusBar({ status, currentTurn, lastShotResult, onReset }) {
  let message = '';

  if (status === 'placement') {
    message = 'Place your ships to begin the battle.';
  } else if (status === 'player_won') {
    message = 'You win! All enemy ships sunk!';
  } else if (status === 'computer_won') {
    message = 'You lose! Your fleet has been destroyed.';
  } else if (status === 'in_progress') {
    if (currentTurn === 'human') {
      message = 'Your turn — click a cell to fire.';
    } else {
      message = "Computer's turn...";
    }
  }

  const shotMsg = formatShotMsg(lastShotResult);

  const isOver = status === 'player_won' || status === 'computer_won';

  return (
    <div className={`status-bar ${isOver ? 'game-over' : ''}`}>
      <span className="status-message">{message}</span>
      {shotMsg && <span className="shot-result">{shotMsg}</span>}
      {isOver && (
        <button className="reset-btn" onClick={onReset}>Play Again</button>
      )}
    </div>
  );
}
