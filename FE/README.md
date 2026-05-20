# Grid Text Renderer (FE)

A small React + Vite app that reads a text description of a grid of form elements
and renders them live to the page.

## Run

```bash
cd FE
npm install
npm run dev
```

Then open the URL Vite prints (default `http://localhost:5173`).

## Build

```bash
npm run build
npm run preview
```

## Input format

One element per line:

```
LINE;COLUMN;LABEL;TYPE;VALUE
```

- `LINE`, `COLUMN` — 1-based grid position (any positive integer).
- `LABEL` — text shown next to the field.
- `TYPE` — `TEXT_INPUT` or `SELECT`.
- `VALUE`:
  - For `TEXT_INPUT`: placeholder text (may be empty).
  - For `SELECT`: comma-separated list of options (e.g. `Male,Female`).

Lines may appear in any order. Malformed or partial lines are ignored so the
preview stays usable while you type. If two lines target the same cell, the
later line wins (a warning is printed to the console).

### Example

```
2;1;gender;SELECT;Male,Female
1;1;First Name;TEXT_INPUT;Enter your first name
2;2;marital status;SELECT;Single,Maried,Divorced
1;2;Last Name;TEXT_INPUT;Enter your last name
```

## Behavior

- The grid re-renders on every textarea change (no button required).
- Each rendered field logs `[create] TYPE "Label"` on mount and
  `[destroy] TYPE "Label"` on unmount to the browser console. Moving an element
  to a different cell or changing its type unmounts the old component and
  mounts a new one.
- Responsive: at viewport widths under 600px the grid collapses to a single
  column.

## Project layout

- [src/App.jsx](src/App.jsx) — top-level state, textarea, wires parser to renderer.
- [src/parseGrid.js](src/parseGrid.js) — pure parser, returns element descriptors.
- [src/GridRenderer.jsx](src/GridRenderer.jsx) — CSS Grid layout sized to
  `max(line) x max(column)`.
- [src/components/TextInputField.jsx](src/components/TextInputField.jsx)
- [src/components/SelectField.jsx](src/components/SelectField.jsx)
- [src/styles.css](src/styles.css) — layout + responsive media query.
