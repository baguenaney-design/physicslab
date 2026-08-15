> **UNVERIFIED: physics.js test case not confirmed — re-check before anything builds on it.**
> Expected for v0=20, θ=45°, g=9.8: R=40.82 m, H=10.20 m, T=2.886 s.
> This line is removed once Yani has seen the raw node output.

# Phase 5 — Projectile Motion — progress

Handoff note, not prose. Plan: `~/.claude/plans/phase-5-projectile-shiny-crayon.md`.

**Model:** closed-form kinematics, level ground (y0 = 0), no air resistance. Drag is deferred to
Beyond-the-Classroom — no closed form, and AP1/IB test the no-drag case.

## Status

| Step | What | Commit |
|---|---|---|
| pre | phase 4 momentum four-view shell (was uncommitted; committed as the Phase 5 restore point) | `49d1b6e` |
| 0 | progress tracker | — |
| 1 | `projectile/physics.js` — **accuracy gate** | — |
| 2 | shared shell: registry, ChatPanel → components/sim, contentParser | — |
| 3 | `projectile/Controls.jsx` | — |
| 4 | `projectile/ProjectileCanvas.jsx` | — |
| 5 | `projectile/Readout.jsx` | — |
| 6 | SimulationView + content + Concept/Practice panels | — |
| 7 | routing + AP/IB curriculum map links | — |
| 8 | `backend/prompts/projectile.txt` + per-sim `format_message` | — |

**Next:** step 1 — write `physics.js`, run the test case through node, show Yani the raw output
before writing any other projectile file.

## Decisions

- **2026-08-15** — Shell is generalized rather than duplicated: `src/simulations/registry.js`
  (slug → views/content/chat mapper), `/sim/:topic` route, ChatPanel promoted to
  `src/components/sim/` (where CLAUDE.md's file structure already puts it), markdown parser
  extracted to `src/simulations/contentParser.js`. Momentum behaviour unchanged.
- **2026-08-15** — Curriculum maps: the existing Kinematics cards link out (AP1 Unit 1,
  IB A.1) rather than adding a sub-entry card. The sidebar eyebrow narrows the scope on
  arrival — `AP Physics 1 · Unit 1 — Projectile Motion` — since the card is broader than
  the sim.
- **2026-08-15** — Canvas scale is derived per run from `range()`/`maxHeight()`, not the fixed
  `PIXELS_PER_METER = 55` momentum uses. Range spans ~0 m to 562.5 m (v0=30 on the Moon); a
  fixed scale cannot hold both.
- **2026-08-15** — Content boundary: equations are canonical and written now; summary prose and
  practice questions are TODO/PENDING placeholders. No invented physics explanations, no
  invented exam questions. `projectile.txt` ships with an empty, clearly-marked grounding slot
  and is **not groundable** until Peter's summary lands.

## Open questions — waiting on Yani

1. **θ = 0 gives T = 0.** With y0 = 0 a flat launch never leaves the ground — physically correct,
   but a dead Launch button. Current default: allow it, guard the divisions, readout shows
   `0.00 s`. Alternatives: floor the angle slider at 1°, or add a launch-height slider (outside
   the stated scope). Not blocking.
2. **`contentPrimitives.jsx`** lives in `simulations/momentum/` and would be imported
   cross-topic by projectile's panels. Move to `src/components/sim/` or leave and import across?
   Decided at step 2, recorded here.

## Resume

On "resume projectile": read CLAUDE.md, this file, `git log --oneline | grep "phase 5"`, and the
momentum sim template. Report where we are in 3–4 lines. Wait for go. Do not start building.
