# Battleship

A single-player Battleship game with a Node.js/Express REST backend and a React/Vite frontend. What makes this repository unusual is not the game itself but how it was built: every line of application code, every test, and every review note in this project was produced by a team of orchestrated Claude Code agents operating under a **Level 4 Autonomy** workflow. Each agent has a narrow, role-bounded mandate (Architect, QA, Backend Developer, Frontend Developer, Reviewer, Release) and is enforced by hard read/write constraints documented in `CLAUDE.md`. The codebase is the artifact of that process.

---

## The Agent Team

Each role is invoked through a slash command defined in `.claude/commands/`. The role boundaries below are enforced — a Developer agent cannot read tests, a Reviewer cannot modify code, and so on.

| Role | Skill | Can Write | Cannot Touch | Skill file |
|------|-------|-----------|--------------|------------|
| Architect | `/architect` | `SPEC.md` | `src/`, `tests/` | `.claude/commands/architect.md` |
| QA | `/qa` | `tests/` | `src/` | `.claude/commands/qa.md` |
| Backend Developer | `/dev-be` | `BE/src/` | any test file, `FE/` | `.claude/commands/dev-be.md` |
| Frontend Developer | `/dev-fe` | `FE/src/` | any test file, `BE/` | `.claude/commands/dev-fe.md` |
| Reviewer | `/code-review` | `review/report.md` | `src/`, `tests/`, `SPEC.md` | `.claude/commands/code-review.md` |
| Release | `/release` | release branch / tags | `src/`, `tests/`, `SPEC.md` | `.claude/commands/release.md` |

Read the skill files in `.claude/commands/` to see exactly how each role is briefed.

---

## Project Structure

```
battleship-worktrees/
├── BE/                  # Backend worktree (dev/be branch)
│   ├── src/             # Node.js/Express implementation
│   └── tests/           # Jest + supertest behavioral tests
├── FE/                  # Frontend worktree (dev/fe branch)
│   ├── src/             # React/Vite implementation
│   └── tests/           # Vitest + Testing Library tests
├── .claude/commands/    # Slash command skills for each agent role
├── review/              # Code review reports (gitignored content)
├── SPEC.md              # Single source of truth (Architect output)
└── CLAUDE.md            # Workflow rules and agent constraints
```

The backend and frontend live on separate long-running branches (`dev/be`, `dev/fe`) and are developed in isolated git worktrees so that the BE and FE Developer agents cannot see each other's working trees. Integration happens on the `release` branch.

---

## How to Run the Game

```bash
# Backend (terminal 1)
cd BE/src && npm install && node index.js
# Server runs on http://localhost:3001

# Frontend (terminal 2)
cd FE/src && npm install && npm run dev
# Open http://localhost:5173
```

The Vite dev server proxies `/api/*` to the backend on port 3001.

---

## How to Run Tests

```bash
cd BE/tests && npm install && npm test   # 67 backend tests (Jest + supertest)
cd FE/tests && npm install && npm test   # 29 frontend tests (Vitest + Testing Library)
```

All tests were written by the QA agent against `SPEC.md` **before** any implementation existed (red), and the Developer agents implemented code until they passed (green). Developers were never permitted to read or modify tests.

---

## The Workflow (Level 4 Autonomy)

The project moves through strictly ordered phases. Each phase has a gate — the next phase cannot begin until the previous one has produced its required artifact.

1. **Architect** — writes `SPEC.md` (feature list, API contract, data models, component breakdown). No code may be written before this exists.
2. **QA** — writes behavioral tests in `tests/` against `SPEC.md`. Tests must be committed and failing (red).
3. **Backend Developer** + **Frontend Developer** — implement `src/` in parallel on separate worktrees until their respective test suites pass (green). Developers cannot read tests; they consult `SPEC.md` for expected behavior.
4. **Reviewer** — reads `src/` and `tests/`, writes findings to `review/report.md` only. A clean review (no `critical` or `major` issues) is required to proceed.
5. **Developer** — fixes any flagged issues in `src/`. Never touches tests.
6. **QA** — validates by re-running the suite; files bugs if anything regresses.
7. **Release** — integrates `dev/be` and `dev/fe` onto the `release` branch.

The role boundaries (who can read, write, and not touch which paths) are documented in `CLAUDE.md` and are treated as hard constraints, not guidelines. Any diff that violates them is rejected and reverted.

---

## Tech Stack

- **Backend:** Node.js, Express
- **Frontend:** React, Vite
- **Backend tests:** Jest, supertest
- **Frontend tests:** Vitest, React Testing Library

No persistent storage; game state is held in-memory on the server between restarts.

---

## Game Rules

- Board: 10×10 grid, columns `A`–`J` and rows `1`–`10`.
- Fleet (identical for both players):

  | Ship | Size |
  |------|------|
  | Carrier | 5 |
  | Battleship | 4 |
  | Destroyer | 3 |
  | Submarine | 3 |
  | Patrol Boat | 2 |

- Single player vs. a computer opponent. The human places their five ships manually; the computer's fleet is positioned at random.
- Players alternate shots. A shot is a `hit`, a `miss`, or — if it completes a ship — a `sunk`. First side to sink all five enemy ships wins.
- Communication is a REST API (`/api/games/...`); no WebSockets. The full contract is in `SPEC.md`.
