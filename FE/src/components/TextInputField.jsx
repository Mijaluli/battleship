import { useEffect, useState } from "react";

export default function TextInputField({ label, placeholder = "" }) {
  const [value, setValue] = useState("");

  useEffect(() => {
    console.log(`[create] TEXT_INPUT "${label}"`);
    return () => console.log(`[destroy] TEXT_INPUT "${label}"`);
    // Intentionally empty deps: we want one log per mount and one per unmount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const inputId = `field-${label.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <div className="field">
      <label className="field-label" htmlFor={inputId}>
        {label}
      </label>
      <div className="field-control">
        <input
          id={inputId}
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </div>
    </div>
  );
}
