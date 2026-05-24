export default function ScoreBoard({ sunkShips, fleet }) {
  return (
    <div className="scoreboard">
      <div className="score-side">
        <div className="score-side-title">Your Fleet</div>
        {fleet.map(ship => {
          const sunk = sunkShips.human.includes(ship.name);
          return (
            <div key={ship.name} className={`score-ship ${sunk ? 'sunk' : 'afloat'}`}>
              <div className="ship-dot" />
              {ship.name}
            </div>
          );
        })}
      </div>
      <div className="score-side">
        <div className="score-side-title">Enemy Fleet</div>
        {fleet.map(ship => {
          const sunk = sunkShips.computer.includes(ship.name);
          return (
            <div key={ship.name} className={`score-ship ${sunk ? 'sunk' : 'afloat'}`}>
              <div className="ship-dot" />
              {ship.name}
            </div>
          );
        })}
      </div>
    </div>
  );
}
