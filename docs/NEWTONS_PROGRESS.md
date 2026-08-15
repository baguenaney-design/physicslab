# Phase 6 — Newton's Second Law — **IN PROGRESS**

Handoff note, not prose. Plan: `docs/NEWTONS_PLAN.md` (committed `76ff865`), mirrored at
`~/.claude/plans/phase-6-newton-s-ethereal-comet.md`.

Target: `/sim/newtons-second`, linked from AP Physics 1 Unit 2. Built into the generalized shell
from phase 5.2 — a registry entry plus one folder, no shell edits.

**Model:** one block, one dimension, flat surface. Applied force against Coulomb dry friction, with
split static and kinetic coefficients. Constant `g = 9.8`. **Not** coupled blocks, Atwood machines
or connected systems — those are their own future simulation. Not inclined planes.

## ⚠ PHYSICS VERIFICATION — **UNVERIFIED**

`physics.js` does not exist yet. The two required cases have been checked **by hand only** and have
never been run against code. **Nothing may be built on top of them until step 1 runs and Yani
confirms both outputs.**

Hand-checked, `m=2 kg, μ_s=0.5, μ_k=0.3, g=9.8`:

- `F = 12 N` → `N=19.6`, `f_s,max=9.8`, `12 > 9.8` so it moves, `a = (12−5.88)/2 = 3.06 m/s²`
- `F = 8 N` → `8 < 9.8` so it stays put, friction `= 8 N` (**not** 9.8), `a = 0`

## Status

| Step | What | Commit |
|---|---|---|
| pre | approved build plan, no code | `76ff865` |
| 0 | progress tracker | this commit |
| 1 | `newtons-second/physics.js` — **accuracy gate, NOT YET RUN** | — |
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

All of steps 1–7. Content artefacts will ship as marked TODO placeholders on the content track
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
If the UNVERIFIED banner above is still present, the physics gate has not been passed and nothing
may be built on top of `physics.js`.
