# Phase 5 — Projectile Motion — **DONE (code)**

Handoff note, not prose. Plan: `~/.claude/plans/phase-5-projectile-shiny-crayon.md`.

The simulation is built, verified and live at `/sim/projectile`, linked from AP Physics 1 Unit 1
and IB A.1. **All that remains is content drop-in** — see REMAINING at the bottom. No code work
is outstanding.

**Model:** closed-form kinematics, level ground (y0 = 0), no air resistance. Drag is deferred to
Beyond-the-Classroom — no closed form, and AP1/IB test the no-drag case.

## Status — all steps committed

| Step | What | Commit |
|---|---|---|
| pre | phase 4 momentum four-view shell (was uncommitted; the pre-Phase-5 restore point) | `49d1b6e` |
| 0 | progress tracker | `dbae539` |
| 1 | `projectile/physics.js` — **accuracy gate, PASSED** | `f9487c7` |
| 2 | shared shell: registry, `/sim/:topic`, four files → `components/sim`, contentParser | `17eff8c` |
| 3 | `projectile/Controls.jsx` | `521b679` |
| 4 | `projectile/ProjectileCanvas.jsx` | `794cf3f` |
| 5 | `projectile/Readout.jsx` | see 5.6 |
| 6 | Readout + SimulationView + content + registry entry — projectile goes live | `d02e797` |
| 7 | routing + AP/IB curriculum map links | `f3531f6` |
| 8 | `backend/prompts/projectile.txt` + per-sim `format_message` | `cb68f6e` |
| — | θ slider floored at 1°, docs to DONE | `PENDING_HASH` |

## Physics verification — PASSED

Numeric, against `physics.js` (run through node at step 1):

- **Reference case** v0=20, θ=45°, g=9.8 → R=40.816326530612244 (40.82 m),
  H=10.204081632653057 (10.20 m), T=2.8861501272920305 (2.886 s). All three exact.
- **Independent cross-check** R = vx·T reaches the range through uniform horizontal motion,
  never touching the sin(2θ) identity, and lands on the same float — absolute difference 0.
- **vy = 0 at the apex** (t = T/2), and y there equals H exactly.
- **vx constant** across the whole flight; **symmetry** — landing speed equals launch speed
  (20.00 m/s), vy mirrors +14.14 → −14.14. No drag, so no energy lost.
- **Complementary angles** 30° and 60° share a range (35.35 m each).
- **45° gives maximum range**; **θ=90° gives R ≈ 0** with H=20.41 m, T=4.082 s.
- **Gravity scaling tracks 1/g**: Earth 9.8 against Moon 1.6 is a 6.125× ratio, and range scales
  by the same factor (40.82 m → 250.00 m at v0=20, θ=45°).

Visual, eyeballed by Yani in a real browser window:

- **Parabola shape correct** at full frame rate.
- **Per-run pixels-per-metre freeze holds** — the scale locks at launch and neither drifts nor
  rescales mid-flight. Confirmed stable across a 22 s Moon flight.

(The animation could not be checked from the automation harness: Chrome freezes
requestAnimationFrame in a backgrounded tab — measured, 3 s of wall clock advanced 0.03 s of
simulated time. Hence the human pass above.)

## Decisions

- **2026-08-15 (step 2)** — Shell generalized rather than duplicated: `src/simulations/registry.js`
  (slug → views/content/chat mapper), `/sim/:topic` route, ChatPanel promoted to
  `src/components/sim/` (where CLAUDE.md's file structure already puts it), markdown parser
  extracted to `src/simulations/contentParser.js`. Momentum behaviour unchanged.
- **2026-08-15 (step 2)** — ConceptPanel and PracticePanel moved to `src/components/sim/` too.
  Both were topic-agnostic apart from a single content import, so per-topic copies would have
  differed by one line. They take parsed `content` as a prop; PracticePanel also takes
  `topicName`. Only `SimulationView` stays topic-specific.
- **2026-08-15 (step 2)** — `SimulationPage` wrapped in a `SimulationRoute` that keys it on the
  slug. React Router reuses a component across param changes, so without the key a move between
  two simulations would carry the previous topic's slider state and Concept gate across.
- **2026-08-15 (step 4)** — Canvas scale derived per run from `range()`/`maxHeight()`, not the
  fixed `PIXELS_PER_METER = 55` momentum uses. Range spans ~0 m to 562.5 m (v0=30 on the Moon);
  no fixed scale holds both. It is **uniform across both axes** — separate x and y scales would
  stretch the parabola so a 45° launch did not leave the ground at 45°. Frozen at launch, so the
  view never rescales mid-flight.
- **2026-08-15 (step 6)** — `dt` clamped to 1/30 s per frame. A backgrounded tab throttles rAF to
  ~1 Hz, and one unclamped frame that size carries the projectile from launch to landing: the
  flight is skipped and the trace left as a straight line, drawing a parabola as though it were
  flat. Clamping makes a stall run slow rather than teleport. At 60fps dt is 0.0167 s, so it
  never bites in normal use.
- **2026-08-15 (step 8)** — `momentum.txt`'s roster claimed IB A.1 / AP Unit 1 were not covered,
  false the moment projectile went live. Swept to COVERED (projectile motion only), and its SCOPE
  rule now tells the momentum tutor to cite projectile motion as covered while still outlining
  only and pointing at the simulation that owns it. AP Physics C: Mechanics Unit 1 stays not
  covered — these simulations are pitched at the algebra-based course.
- **2026-08-15 (this commit)** — **Launch-angle slider floored at 1°**, resolving the dead-launch
  open question. A ground-level launch at exactly 0° has T = 0 — correct physics for this model,
  but a dead Launch button, which reads as a broken control rather than as a result. The clamp
  lives in `Controls.jsx`, **not** in `physics.js`: the equations are right, the affordance was
  wrong, and guarding θ=0 inside physics.js would mean returning a number the equations do not
  give. 1° still shows the shallow case (T = 0.0712 s, R = 1.42 m at 20 m/s on Earth).
  Documented in the `timeOfFlight` comment block.
  - `physics.js` stays unclamped and callers must still tolerate T = 0: **v0 = 0 reaches it by
    the other route**, and the speed slider does go to zero. `ProjectileCanvas` handles both in
    one branch at launch, so that guard is still load-bearing.

## Open questions

None. The θ=0 dead-launch question is resolved above; the `contentPrimitives.jsx` location
question was resolved at step 2 (moved to `src/components/sim/`).

## REMAINING — content drop-in only

No code work outstanding. Three content artefacts, all TODO-marked in place, all on the content
track (founders draft → Peter Syrenne reviews → drop in):

1. **Concept summary** — `docs/content/projectile.md`, `## Concept Summary`. Currently a marked
   TODO placeholder. Must cover: the independence of horizontal and vertical motion, why vx is
   constant and vy is not, what the trajectory's symmetry does and does not imply, and the
   explicit no-air-resistance assumption including where it breaks down in reality.
   *The `## Key Equations` section of the same file is already complete and canonical — eight
   formula-sheet equations — and needs no drafting, only a correctness check.*

2. **Practice questions** — `docs/content/projectile.md`, four groups under
   `## Practice Questions`, each currently the single word `PENDING`, which the parser renders as
   the in-drafting state. Needs IB Multiple Choice, IB Paper 2 Written Response, AP Multiple
   Choice and AP Free Response. CLAUDE.md sets a minimum of three questions per simulation.

3. **Tutor grounding summary** — `backend/prompts/projectile.txt`, section 2, between the
   `--- BEGIN REVIEWED CONTENT ---` / `--- END REVIEWED CONTENT ---` markers. Currently **empty**,
   under a `NOT GROUNDABLE` banner at the top of the file.
   **The projectile tutor must not be served to students until this is filled** — it has no
   authoritative content to reason from. Sections 1 and 3–8 are complete. Once item 1 is
   reviewed, paste it here: the student reads the same text in the Concept panel, so the two
   must not drift.

## Resume

On "resume projectile": read CLAUDE.md, this file, `git log --oneline | grep "phase 5"`, and the
momentum sim template. Report where we are in 3–4 lines. Wait for go. Do not start building.
