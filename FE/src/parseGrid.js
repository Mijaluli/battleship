export const ELEMENT_TYPES = Object.freeze({
  TEXT_INPUT: "TEXT_INPUT",
  SELECT: "SELECT",
});

const VALID_TYPES = new Set(Object.values(ELEMENT_TYPES));

export function parseGrid(text) {
  if (typeof text !== "string" || text.length === 0) return [];

  const descriptors = [];
  const lines = text.split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (line.length === 0) continue;

    const parts = line.split(";");
    if (parts.length < 4) continue;

    const [lineStr, columnStr, label, type, ...rest] = parts;
    const value = rest.join(";");

    const lineNum = Number.parseInt(lineStr, 10);
    const columnNum = Number.parseInt(columnStr, 10);
    if (!Number.isInteger(lineNum) || lineNum < 1) continue;
    if (!Number.isInteger(columnNum) || columnNum < 1) continue;

    const trimmedLabel = (label ?? "").trim();
    if (trimmedLabel.length === 0) continue;

    const trimmedType = (type ?? "").trim();
    if (!VALID_TYPES.has(trimmedType)) continue;

    if (trimmedType === ELEMENT_TYPES.SELECT) {
      const options = (value ?? "")
        .split(",")
        .map((opt) => opt.trim())
        .filter((opt) => opt.length > 0);
      if (options.length === 0) continue;
      descriptors.push({
        line: lineNum,
        column: columnNum,
        label: trimmedLabel,
        type: trimmedType,
        options,
        key: `${lineNum}-${columnNum}`,
      });
    } else {
      descriptors.push({
        line: lineNum,
        column: columnNum,
        label: trimmedLabel,
        type: trimmedType,
        placeholder: value ?? "",
        key: `${lineNum}-${columnNum}`,
      });
    }
  }

  // If two descriptors land on the same cell, the later line wins.
  const byKey = new Map();
  for (const d of descriptors) {
    if (byKey.has(d.key)) {
      console.warn(
        `[parseGrid] Duplicate cell at ${d.key}; later definition "${d.label}" overrides earlier one.`
      );
    }
    byKey.set(d.key, d);
  }
  return Array.from(byKey.values());
}
