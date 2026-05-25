export default function Cell({ coordinate, hasShip, isHit, isMiss, isSunk, isPreview, isPreviewValid, isDisabled, onClick, onHover, onDragOver, onDrop }) {
  const classes = ['cell'];
  if (isSunk)       classes.push('cell-sunk');
  else if (isHit)   classes.push('cell-hit');
  else if (isMiss)  classes.push('cell-miss');
  else if (hasShip) classes.push('cell-ship');

  if (isPreview) {
    classes.push(isPreviewValid ? 'cell-preview-valid' : 'cell-preview-invalid');
  }
  if (isDisabled) classes.push('cell-disabled');

  return (
    <div
      className={classes.join(' ')}
      data-coordinate={coordinate}
      onClick={!isDisabled ? onClick : undefined}
      onMouseEnter={onHover}
      onDragOver={onDragOver ? (e) => { e.preventDefault(); onDragOver(); } : undefined}
      onDrop={onDrop ? (e) => { e.preventDefault(); onDrop(); } : undefined}
      role="button"
      aria-label={coordinate}
    />
  );
}
