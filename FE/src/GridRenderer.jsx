import { useMemo } from "react";
import { ELEMENT_TYPES } from "./parseGrid.js";
import TextInputField from "./components/TextInputField.jsx";
import SelectField from "./components/SelectField.jsx";

export default function GridRenderer({ descriptors }) {
  const { maxLine, maxColumn } = useMemo(() => {
    let ml = 0;
    let mc = 0;
    for (const d of descriptors) {
      if (d.line > ml) ml = d.line;
      if (d.column > mc) mc = d.column;
    }
    return { maxLine: ml, maxColumn: mc };
  }, [descriptors]);

  if (descriptors.length === 0) {
    return <div className="empty-state">No valid elements to render yet.</div>;
  }

  const gridStyle = {
    gridTemplateColumns: `repeat(${maxColumn}, minmax(0, 1fr))`,
    gridTemplateRows: `repeat(${maxLine}, auto)`,
  };

  return (
    <div className="grid" style={gridStyle}>
      {descriptors.map((d) => {
        const cellStyle = {
          gridRow: d.line,
          gridColumn: d.column,
        };

        // Composite key includes type so swapping the type at the same cell
        // unmounts the old component and mounts a new one (per spec).
        const reactKey = `${d.key}-${d.type}`;

        if (d.type === ELEMENT_TYPES.SELECT) {
          return (
            <div key={reactKey} style={cellStyle}>
              <SelectField label={d.label} options={d.options} />
            </div>
          );
        }
        return (
          <div key={reactKey} style={cellStyle}>
            <TextInputField label={d.label} placeholder={d.placeholder} />
          </div>
        );
      })}
    </div>
  );
}
