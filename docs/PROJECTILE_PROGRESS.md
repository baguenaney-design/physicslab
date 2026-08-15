> **physics.js VERIFIED 2026-08-15.** v0=20, θ=45°, g=9.8 → R=40.816326530612244 (40.82 m),
> H=10.204081632653057 (10.20 m), T=2.8861501272920305 (2.886 s). All three PASS against the
> reference case. Independent cross-check R = vx·T agrees to 0 absolute difference.

# Phase 5 — Projectile Motion — progress

Handoff note, not prose. Plan: `~/.claude/plans/phase-5-projectile-shiny-crayon.md`.

**Model:** closed-form kinematics, level ground (y0 = 0), no air resistance. Drag is deferred to
Beyond-the-Classroom — no closed form, and AP1/IB test the no-drag case.

## Status

| Step | What | Commit |
|---|---|---|
| pre | phase 4 momentum four-view shell (was uncommitted; committed as the Phase 5 restore point) | `49d1b6e` |
| 0 | progress tracker | `dbae539` |
| 1 | `projectile/physics.js` — **accuracy gate, PASSED** | `f9487c7` |
| 2 | shared shell: registry, ChatPanel → components/sim, contentParser | — |
| 3 | `projectile/Controls.jsx` | — |
| 4 | `projectile/ProjectileCanvas.jsx` | — |
| 5 | `projectile/Readout.jsx` | — |
| 6 | SimulationView + content + Concept/Practice panels | — |
| 7 | routing + AP/IB curriculum map links | — |
| 8 | `backend/prompts/projectile.txt` + per-sim `format_message` | — |

**Next:** step 2 — shared shell refactor (registry, ChatPanel → `components/sim/`, contentParser
extracted). **Paused: waiting on Yani to confirm the step-1 test output before continuing.**

Also verified beyond the reference case: apex at t=T/2 has vy=0 and y=H; landing speed equals
launch speed (20.00 m/s — no drag, so the flight is symmetric); complementary angles 30°/60°
share a range (35.35 m); θ=90° gives R=0, H=20.41, T=4.082; θ=0 gives T=0 (see open question 1).

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
