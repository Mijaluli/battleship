export default function ScoreBoard({ sunkShips, fleet }) {
  return (
    <div className="scoreboard">
      <div className="score-side">
        <h3>Your Fleet</h3>
        {fleet.map(ship => {
          const sunk = sunkShips.human.includes(ship.name);
          return (
            <div key={ship.name} className={`score-ship ${sunk ? 'sunk' : 'afloat'}`}>
              {sunk ? '✕' : '●'} {ship.name}
            </div>
          );
        })}
      </div>
      <div className="score-side">
        <h3>Enemy Fleet</h3>
        {fleet.map(ship => {
          const sunk = sunkShips.computer.includes(ship.name);
          return (
            <div key={ship.name} className={`score-ship ${sunk ? 'sunk' : 'afloat'}`}>
              {sunk ? '✕' : '●'} {ship.name}
            </div>
          );
        })}
      </div>
    </div>
  );
}
