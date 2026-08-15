# Phase 6 — Newton's Second Law — **IN PROGRESS**

Handoff note, not prose. Plan: `docs/NEWTONS_PLAN.md` (committed `76ff865`), mirrored at
`~/.claude/plans/phase-6-newton-s-ethereal-comet.md`.

Target: `/sim/newtons-second`, linked from AP Physics 1 Unit 2. Built into the generalized shell
from phase 5.2 — a registry entry plus one folder, no shell edits.

**Model:** one block, one dimension, flat surface. Applied force against Coulomb dry friction, with
split static and kinetic coefficients. Constant `g = 9.8`. **Not** coupled blocks, Atwood machines
or connected systems — those are their own future simulation. Not inclined planes.

## Physics verification — **PASSED**

Numeric, run through node against `physics.js` at step 1. Reference block
`m = 2 kg, μ_s = 0.5, μ_k = 0.3, g = 9.8`:

- **Required case, MOVING** `F = 12 N` → `N = 19.6`, `f_s,max = 9.8`, `12 > 9.8` so it breaks away,
  `f_k = 5.88`, `F_net = 6.12`, **`a = 3.06 m/s²`**. Exact.
- **Required case, STATIC** `F = 8 N` → `8 < 9.8` so it holds, **friction `= 8 N` (not 9.8)**,
  `F_net = 0`, **`a = 0`**. Exact.
- **Independent cross-check** on `a = 3.06` by the work-energy theorem, a route that never divides
  a net force by a mass: from rest for 2 s, `W_net = 6.12 × 6.12 = 37.4544 J` and
  `ΔKE = ½ × 2 × 6.12² = 37.4544 J`. Absolute difference **0**.
- **Threshold sweep** — friction tracks the applied force exactly up to the ceiling, then drops
  discontinuously: `F = 9.79` → friction 9.79, `a = 0`; `F = 9.80` → friction 9.80, `a = 0` (held
  at exactly `f_s,max`, per the `≤` convention); `F = 9.81` → friction **5.88**, `a = 1.965`.
- **Moving block** decelerates at `−1.44` under a 3 N forward push (below `f_k` — a standard exam
  trap); `F = 5.88` gives exactly `a = 0`, dynamic equilibrium; `μ = 0` gives `a = F/m = 6`.
- **Stop-at-rest guard.** `v₀ = 1, F = 0, dt = 1` would give `v = −1.94` under unguarded Euler —
  friction driving the block backwards, impossible. Guarded gives `v = 0` and
  `0.17006802721088435 m`, exactly `1/(2 × 2.94)`. A block coasting under `F = 3` reaches `v = 0`,
  flips to `static`, friction becomes `−3.00 (= −F)`, and holds with no jitter across zero.
- **60 fps sanity**: `v₀ = 6, a = −2.94, dt = 0.0167` → `v = 5.950902`, ordinary step, guard not
  triggered.

Visual eye-test in a real browser: **not yet done** — no canvas exists until step 3.

## Status

| Step | What | Commit |
|---|---|---|
| pre | approved build plan, no code | `76ff865` |
| 0 | progress tracker | `8521d72` |
| 1 | `newtons-second/physics.js` — **accuracy gate, PASSED** | `fbad8de` |
| 2 | `Controls.jsx` | — |
| 3 | `NewtonsCanvas.jsx` | — |
| 4 | Readout + SimulationView + content + registry entry — goes live | — |
| 5 | AP curriculum map link | — |
| 6 | `backend/prompts/newtons-second.txt` + `format_newtons_state` | — |
| 7 | cross-sim roster sweep — **report only, no silent edits** | — |

## Decisions

- **2026-08-15 (planning)** — **Split `μ_s`/`μ_k`, not a single μ.** The drop in friction at
  breakaway is the teaching moment of this simulation; a single coefficient makes
  `f_s,max == f_k` and erases it — the block would go from `a=0` straight to `a=(F−μN)/m`
  continuously, with nothing to see. Two sliders, `μ_k` clamped to `≤ μ_s` on change because
  `μ_k > μ_s` is unphysical.
- **2026-08-15 (planning)** — **Surface presets carry real coefficient pairs**, not decoration.
  Ice 0.10/0.03, Wood 0.50/0.30, Rubber 0.80/0.70, each setting both coefficients. This is the
  `GRAVITIES` convention from `projectile/Controls.jsx`, which carries real g values a student can
  check against a data booklet rather than round numbers.
- **2026-08-15 (planning)** — **Sliders stay live during motion, numeric integration** — not
  projectile's lock-at-Launch. The student drags applied force up and watches the block break loose
  exactly as F crosses `μ_s·N`; locking params at Apply would make the breakaway unobservable
  except by resetting. This is what makes the `dt ≤ 1/30 s` clamp load-bearing here rather than
  inherited from projectile.
- **2026-08-15 (planning)** — **IB A.2 stays pointed at `/sim/momentum`.** The brief said to replace
  "coming soon" on A.2, but A.2 is not coming soon — it already links to momentum, and `TopicCard`
  takes one `to` per card. This sim is reachable from the **AP map only** for now. The registry
  still carries both `ib` and `ap` eyebrows, so repointing later needs no other change. See Open
  questions.
- **2026-08-15 (step 1)** — **`advance()` integrates rather than using a closed form**, and it
  lives in `physics.js` rather than the canvas so the canvas computes nothing physical. Semi-implicit
  Euler, because the live sliders mean acceleration can change mid-run and a closed form would have
  to freeze the parameters. It carries a **stop-at-rest guard**: when `v` changes sign inside a
  step, friction brought the block to rest partway through the frame, and unguarded Euler carries it
  out the other side — friction driving a body backwards, which is impossible. Clamped to `v = 0`
  and advanced by the true stopping distance `v₀²/(2|a|)` instead, so the next frame re-enters the
  static test at rest.
- **2026-08-15 (step 1)** — `direction()` is used instead of `Math.sign`, because `Math.sign(-0)`
  is `-0` and a `-0` leaking into a friction direction renders as `-0.00 N` in the readout.
- **2026-08-15 (planning)** — Three corrections to the original brief, verified against the repo:
  `src/App.jsx` needs **no edit** (`/sim/:topic` already serves every registry slug); there is no
  `src/pages/CurriculumMap.jsx` (it is `APCurriculumMap.jsx` + `IBCurriculumMap.jsx` over a shared
  `TopicCard`); `MANUAL_QA.md` §6 is a reminder log, not the roster sweep — those checkboxes are
  in §5.

## Open questions

1. **How do IB students reach this simulation?** Currently they cannot — A.2 points at momentum.
   Options parked: split A.2 into two cards with a qualifier field (`Momentum & impulse` /
   `Newton's second law`), or leave it AP-only until the IB map is reworked. Not blocking the build.
2. **Roster sweep, step 7 — awaiting a decision, no file touched.** Both `momentum.txt:240` and
   `projectile.txt:142` mark `Unit 2  Force and Translational Dynamics ... not yet covered`, which
   goes false the moment this sim ships. IB A.2 is already `COVERED` in both via momentum, but its
   partial-coverage caveat is prose-only (`momentum.txt:320-323`) and **absent entirely from
   `projectile.txt`**, whose tutor therefore reads A.2 as flatly covered. `momentum.txt:256`
   (AP Physics C: Mechanics Unit 2, not covered) stays correct — these sims are algebra-based.

## REMAINING

Steps 2–7. Content artefacts will ship as marked TODO placeholders on the content track
(founders draft → Peter Syrenne reviews → drop in), exactly as projectile's did:

1. **Concept summary** — `docs/content/newtons-second.md`, `## Concept Summary`. Must cover: that
   friction below the threshold equals the applied force and `μ_s·N` is only its *cap*; why
   friction drops at breakaway; that `N = mg` holds only because the surface is flat and the
   applied force horizontal; and the Coulomb model's limits.
2. **Practice questions** — same file, four `PENDING` groups. CLAUDE.md sets a minimum of three.
3. **Tutor grounding summary** — `backend/prompts/newtons-second.txt` section 2, between the
   `--- BEGIN REVIEWED CONTENT ---` / `--- END REVIEWED CONTENT ---` markers, under a
   `NOT GROUNDABLE` banner. **This tutor must not be served to students until it is filled.**

## Resume

On "resume newtons": read CLAUDE.md, this file, `git log --oneline | grep "phase 6"`, and the
projectile sim as template. Report where we are in 3–4 lines. Wait for go. Do not start building.

**The physics gate is PASSED as of `fbad8de`** — both required cases verified against real output.
Steps 2 onward may build on `physics.js`. Next up is step 2, `Controls.jsx`.
