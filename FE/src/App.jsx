import { useMemo, useState } from "react";
import { parseGrid } from "./parseGrid.js";
import GridRenderer from "./GridRenderer.jsx";

const EXAMPLE = `2;1;gender;SELECT;Male,Female
1;1;First Name;TEXT_INPUT;Enter your first name
2;2;marital status;SELECT;Single,Maried,Divorced
1;2;Last Name;TEXT_INPUT;Enter your last name`;

export default function App() {
  const [text, setText] = useState(EXAMPLE);

  const descriptors = useMemo(() => parseGrid(text), [text]);

  return (
    <div className="app">
      <h1>Grid Text Renderer</h1>

      <section className="panel">
        <div className="panel-title">Elements Drawer</div>
        <textarea
          className="input-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          spellCheck={false}
          aria-label="Grid definition input"
        />
        <div className="hint">
          Format: <code>LINE;COLUMN;LABEL;TYPE;VALUE</code>. TYPE is{" "}
          <code>TEXT_INPUT</code> or <code>SELECT</code>. SELECT options are
          comma-separated.
        </div>
        <div className="panel-divider" />
        <GridRenderer descriptors={descriptors} />
      </section>
    </div>
  );
}
