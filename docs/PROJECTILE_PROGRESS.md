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
| 2 | shared shell: registry, `/sim/:topic`, four files → components/sim, contentParser | `17eff8c` |
| 3 | `projectile/Controls.jsx` | `521b679` |
| 4 | `projectile/ProjectileCanvas.jsx` | `794cf3f` |
| 5 | `projectile/Readout.jsx` | see 5.6 |
| 6 | Readout + SimulationView + content + registry entry — **projectile is live** | `d02e797` |
| 7 | routing + AP/IB curriculum map links | — |
| 8 | `backend/prompts/projectile.txt` + per-sim `format_message` | — |

**Next:** step 7 — routing and AP/IB curriculum map links.

Step-6 browser check on `/sim/projectile?from=ap`: predicted block reads 40.82 m / 10.20 m /
2.886 s, matching the verified physics exactly. A completed run lands at horizontal distance
40.82 m with height 0.00 m, elapsed 2.89 s, vy −14.14 m/s (mirror of the +14.14 at launch) and
speed back to 20.00 m/s. Ground ticks land where the scale says they should (the "40" tick at
canvas x=830 against a computed 56 + 40×19.36). Concept renders the TODO banner and all eight
KaTeX equations, with the empty Exam Tips section correctly skipped; Practice shows all four
groups in drafting; the Concept→Ask gate works.

**NOT yet eyeballed — needs a human:** the animated trajectory at full frame rate. Chrome
freezes requestAnimationFrame in the backgrounded automation tab (measured: 3 s of wall clock
advanced 0.03 s of simulated time), so the flight cannot be frame-stepped from here. Every
number and the x-axis pixel mapping check out, and the y mapping is the same expression on the
same scale, but the parabola's shape has not been seen at speed. Open a real window and launch
one.
step 6, once its SimulationView exists; until then `/sim/projectile` redirects home, which is
the correct behaviour for a slug that is not yet registered. Steps 3–5 build components that
nothing renders yet — each still builds and lints clean on its own.

Step-1 checks beyond the reference case: apex at t=T/2 has vy=0 and y=H; landing speed equals
launch speed (20.00 m/s — no drag, so the flight is symmetric); complementary angles 30°/60°
share a range (35.35 m); θ=90° gives R=0, H=20.41, T=4.082; θ=0 gives T=0 (see open question 1).

Step-2 regression check (browser, all clean): momentum canvas runs and the readout updates;
Concept renders with KaTeX; Practice shows all 6 questions; Concept→Ask gate still locks and
unlocks; `?from=ap` and `?from=ib` give the right eyebrow and back link; `/sim/does-not-exist`
redirects home; console has no errors or warnings.

## Decisions

- **2026-08-15** — Shell is generalized rather than duplicated: `src/simulations/registry.js`
  (slug → views/content/chat mapper), `/sim/:topic` route, ChatPanel promoted to
  `src/components/sim/` (where CLAUDE.md's file structure already puts it), markdown parser
  extracted to `src/simulations/contentParser.js`. Momentum behaviour unchanged.
- **2026-08-15 (step 2)** — ConceptPanel and PracticePanel moved to `src/components/sim/` too,
  not just ChatPanel. Both were already topic-agnostic apart from a single content import, so
  per-topic copies would have differed by one line. They now take parsed `content` as a prop.
  PracticePanel also takes `topicName` — its in-drafting copy names the topic, and it dropped
  the "follows the same path as the questions above" clause, which is false for a topic whose
  question sets are all still pending. Only `SimulationView` stays topic-specific.
- **2026-08-15 (step 2)** — `SimulationPage` is split into a `SimulationRoute` wrapper that keys
  the page on the slug. React Router reuses a component across param changes, so without the key
  a move between two simulations would carry the previous topic's slider state, view selection
  and Concept gate across.
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
2. ~~**`contentPrimitives.jsx`** location.~~ **Resolved at step 2** — moved to
   `src/components/sim/`, along with ConceptPanel and PracticePanel. See the step-2 decision
   below; no action needed.

## Resume

On "resume projectile": read CLAUDE.md, this file, `git log --oneline | grep "phase 5"`, and the
momentum sim template. Report where we are in 3–4 lines. Wait for go. Do not start building.
