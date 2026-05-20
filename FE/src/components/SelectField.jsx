import { useEffect, useState } from "react";

export default function SelectField({ label, options }) {
  const [value, setValue] = useState(options[0] ?? "");

  useEffect(() => {
    console.log(`[create] SELECT "${label}"`);
    return () => console.log(`[destroy] SELECT "${label}"`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectId = `field-${label.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <div className="field">
      <label className="field-label" htmlFor={selectId}>
        {label}
      </label>
      <div className="field-control">
        <select
          id={selectId}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        >
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
