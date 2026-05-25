export default function ScoreBoard({ side, ships, sunkShips }) {
  const title = side === 'own' ? 'Your Fleet' : 'Enemy Fleet';
  const sunkList = side === 'own' ? sunkShips.human : sunkShips.computer;

  return (
    <div className="score-side">
      <div className="score-side-title">{title}</div>
      {ships.map(ship => {
        const sunk = sunkList.includes(ship.name);
        return (
          <div key={ship.name} className={`score-ship ${sunk ? 'sunk' : 'afloat'}`}>
            <div className="ship-dot" />
            {ship.name}
          </div>
        );
      })}
    </div>
  );
}
