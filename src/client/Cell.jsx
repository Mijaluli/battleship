export default function Cell({ coordinate, hasShip, isHit, isMiss, isSunk, isPreview, isDisabled, onClick }) {
  const classes = ['cell'];
  if (isSunk) classes.push('cell-sunk');
  else if (isHit) classes.push('cell-hit');
  else if (isMiss) classes.push('cell-miss');
  else if (hasShip) classes.push('cell-ship');
  if (isPreview) classes.push('cell-preview-valid');
  if (isDisabled) classes.push('cell-disabled');

  return (
    <div
      className={classes.join(' ')}
      data-coordinate={coordinate}
      onClick={!isDisabled ? onClick : undefined}
      role="button"
      aria-label={coordinate}
    />
  );
}
