# Phase 6 — Newton's Second Law — **IN PROGRESS**

Handoff note, not prose. Plan: `docs/NEWTONS_PLAN.md` (committed `76ff865`), mirrored at
`~/.claude/plans/phase-6-newton-s-ethereal-comet.md`.

Target: `/sim/newtons-second`, linked from AP Physics 1 Unit 2. Built into the generalized shell
from phase 5.2 — a registry entry plus one folder, no shell edits.

**Model:** one block, one dimension, flat surface. Applied force against Coulomb dry friction, with
split static and kinetic coefficients. Constant `g = 9.8`. **Not** coupled blocks, Atwood machines
or connected systems — those are their own future simulation. Not inclined planes.

## Physics verification — **PASSED**

Numeric, run through node against `physics.js` — first at step 1, re-run in full after the
step 1b integrator amendment. Reference block
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
- **Exact-zero landing (found 2026-08-18, fixed in the amendment).** `v₀ = 2.94, F = 0, dt = 1`
  puts `v₁` on **exactly** 0, so the sign never flips and the stop-at-rest guard correctly does not
  fire — the block stops precisely at the frame boundary. Semi-implicit Euler then advanced the
  position by `v₁·dt = 0` and **lost 1.47 m of real travel in one frame**. The closed form gives
  `2.94(1) + ½(−2.94)(1²) = 1.47 m`, matching `v₀²/(2|a|) = 1.47 m` from `v² = u² + 2as` — a route
  with no `dt` in it. Verified against the module: `position 1.47, velocity 0`.
- **Launch frame, same fix.** `v₀ = 0, F = 12, dt = 1` → `½(3.06)(1²) = 1.53 m`. Semi-implicit
  Euler gave `a·dt² = 3.06 m`, twice the real distance, so the amendment corrects the frame a block
  breaks away on as well as the frame it lands on.
- **60 fps sanity**: `v₀ = 6, a = −2.94, dt = 0.0167` → `v = 5.950902`, `x = 0.0997900317 m`,
  ordinary step, guard not triggered.

Visual eye-test in a real browser: **not yet done** — nothing renders until step 4 wires
`SimulationView` and the registry entry.

## Frame-loop verification — step 3, **PASSED (numerically)**

The canvas's loop driven through node at `dt = 1/60`, the same call sequence `step()` makes, on the
reference block. This checks the three regimes the simulation has to show; it does **not** check a
single pixel.

- **Held.** `F = 8` for 120 frames → `x` stays exactly `0`, regime `static` throughout, friction
  `−8.00 N` (`= −F`, not `−9.8`). No creep.
- **Breakaway.** `F = 12` for 60 frames → `v = 3.060000`, `x = 1.530000`. Matches `a·t = 3.06` and
  `½at² = 1.53` to the displayed digit — 60 accumulated steps reproducing the closed form is what
  "exact for piecewise-constant `a`" means in practice, and it would not hold under the old Euler.
- **Coast to rest.** `F = 12` for 60 frames, then `F = 0` for 300 → `v = 0` exactly,
  `x = 3.122449 m`. Hand check: `1.53 + 3.06²/(2×2.94) = 1.53 + 1.592449 = 3.122449`. Regime flips
  `kinetic → static`, **zero reversals, minimum velocity 0** — it never goes negative and does not
  oscillate across zero over the remaining ~200 frames it sits at rest.

## Status

| Step | What | Commit |
|---|---|---|
| pre | approved build plan, no code | `76ff865` |
| 0 | progress tracker | `8521d72` |
| 1 | `newtons-second/physics.js` — **accuracy gate, PASSED** | `fbad8de` |
| 1b | `advance()` closed-form integrator — approved plan amendment, gate re-run | `4a81cf7` |
| 2 | `Controls.jsx` | `f874221` |
| 3 | `NewtonsCanvas.jsx` | `70dac9e` |
| 4 | Readout + SimulationView + content + registry entry — **LIVE** | `6ed13c3` |
| 5 | AP **and IB** curriculum map links | `79c8dcc` |
| 6 | `backend/prompts/newtons-second.txt` + `format_newtons_state` | — |
| 7 | cross-sim roster sweep — **applied, 2 lines** | `ff90cba` |

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
- **2026-08-15 (step 1), SUPERSEDED 2026-08-18** — `advance()` steps rather than solving the whole
  run in closed form, and it lives in `physics.js` rather than the canvas so the canvas computes
  nothing physical. Originally **semi-implicit Euler**, because the live sliders mean acceleration
  can change mid-run and a single closed form would have to freeze the parameters. It carries a
  **stop-at-rest guard**: when `v` changes sign inside a step, friction brought the block to rest
  partway through the frame, and unguarded integration carries it out the other side — friction
  driving a body backwards, which is impossible. Clamped to `v = 0` and advanced by the true
  stopping distance `v₀²/(2|a|)` instead, so the next frame re-enters the static test at rest.
  *The stepper and the guard both stand. The position formula does not — see below.*
- **2026-08-18 (step 1b, approved plan amendment)** — **the position update is now the closed form
  `x₁ = x₀ + v₀·dt + ½·a·dt²`**, replacing semi-implicit Euler's `x₁ = x₀ + v₁·dt`. This is not a
  precision tweak, it is a correctness fix: `resolveDynamics` is called once per step and its
  acceleration held constant across it, so `a` is piecewise-constant by construction and the closed
  form is **exact** within a frame, with no truncation error. Semi-implicit Euler was wrong in a
  case the sliders can reach — a block landing on exactly `v = 0` travelled 0 m instead of 1.47 m
  (see Physics verification). The live-slider reasoning above is untouched: `a` is still re-resolved
  every frame, constant *within* a frame and free to change *between* frames. The stop-at-rest guard
  is **still required** and unchanged — being exact for constant acceleration is worth nothing past
  the instant the block stops, where friction switches from `−f_k` to `−F_applied` and the frame's
  `a` stops describing it.
- **2026-08-15 (step 1)** — `direction()` is used instead of `Math.sign`, because `Math.sign(-0)`
  is `-0` and a `-0` leaking into a friction direction renders as `-0.00 N` in the readout.
- **2026-08-15 (planning)** — Three corrections to the original brief, verified against the repo:
  `src/App.jsx` needs **no edit** (`/sim/:topic` already serves every registry slug); there is no
  `src/pages/CurriculumMap.jsx` (it is `APCurriculumMap.jsx` + `IBCurriculumMap.jsx` over a shared
  `TopicCard`); `MANUAL_QA.md` §6 is a reminder log, not the roster sweep — those checkboxes are
  in §5.

- **2026-08-18 (step 2)** — **The `μ_k ≤ μ_s` clamp is enforced from both sides.** Raising `μ_k`
  past `μ_s` is blocked, and lowering `μ_s` below `μ_k` drags `μ_k` down with it rather than
  refusing the drag — a slider that silently stops responding reads as broken. Each is a single
  `onChange` call, because the shell merges a partial into `simState` (`SimulationPage.jsx:76`) and
  one call can therefore set both keys. The clamp lives in the UI and not in `physics.js`: the
  equations are correct for whatever coefficients they are handed; it is the *control* that must
  not offer an impossible surface.
- **2026-08-18 (step 2)** — **The Rubber preset is clipped, and the file says so.** Rubber on dry
  concrete is usually quoted near `1.0 / 0.8`, above this simulation's `0.8` slider ceiling. It is
  entered as `0.80 / 0.70` — the grippiest pair the controls can express — and the comment above
  `SURFACES` flags it as clipped rather than passing it off as the book value. Ice `0.10 / 0.03`
  and Wood `0.50 / 0.30` are the tabulated values, unclipped.
- **2026-08-18 (step 2)** — **`g` is displayed but not controllable.** Fixed at 9.8 and exported as
  `GRAVITY` from `Controls.jsx`, shown dimmed at the end of the surface row. It is not a control —
  this sim is not about gravity — but every normal force and therefore every friction figure in the
  readout comes from it, and `N = mg` is unreadable without knowing which `g`.
- **2026-08-18 (step 2)** — **Slider labels take JSX, not a plain string**, so `μ`'s subscript is
  real markup (`μ<sub>s</sub>`) rather than a Unicode subscript glyph Inter may not carry. `Slider`
  already renders `{label}` into a span, so the component needed no change.

- **2026-08-18 (step 3)** — **Live parameters travel through `paramsRef`, not a snapshot.**
  `ProjectileCanvas` locks its parameters into `sim.params` at Launch; `step()` here would
  otherwise close over the applied force as it was when Run was pressed and never see the slider
  move — the opposite of what this sim is for. The ref is written in an effect, so a running loop
  can read parameters one frame stale (17 ms at 60 fps); below perception, and not worth a
  write-during-render to avoid.
- **2026-08-18 (step 3)** — **`Run` / `Pause`, not projectile's `Launch`.** Launch means "lock
  these parameters and fire". Nothing is locked here, so the button only starts and stops the
  clock; Pause keeps position and velocity, Reset returns to `t = x = v = 0`. Divergence from the
  brief's "Apply/Launch" wording, for that reason.
- **2026-08-18 (step 3)** — **Four independent vector toggles, superseding the plan's single
  `Force vectors` toggle** (per the step 3 brief). Rendered as a clickable legend — swatch plus
  name — because the swatch is the only thing telling a student which colour is which force, and
  normal/weight share a colour precisely because they are the pair that cancels.
- **2026-08-18 (step 3)** — **The vector scale's reference excludes the instantaneous friction**,
  taking `max(N, |F|, f_s,max)` instead. If friction fed the shared px-per-newton scale, its drop
  from `f_s,max` to `μ_k·N` at breakaway would rescale every arrow on the same frame and cancel
  itself out on screen — erasing the one thing the diagram exists to show.
- **2026-08-18 (step 3)** — **Two additions beyond the plan's step 3, flagged not slipped in.**
  (a) An `f_s,max` **ghost tick**: a dashed marker the solid friction arrow grows toward below the
  threshold and snaps back from at breakaway. The plan says the snap is the lesson drawn; the ghost
  is what the snap is measured against. (b) A **regime tag** (`STATIC`/`MOVING`) above the block, in
  dimmed text rather than phosphor — until step 4 nothing on screen names the regime, and dimming
  keeps it from competing with the readout's phosphor STATE row once that exists. **Reconsider (b)
  at step 4** if it reads as duplication.
- **2026-08-18 (step 3)** — **Layout is correct by construction, not by eye**, because nothing can
  be eye-tested at this step. `MARGIN_BOTTOM = 96` and distance labels at `groundY + MAX_VECTOR_PX
  + 10` sit below the deepest arrow tip any slider combination can produce, so a label and an
  arrowhead can never collide; and the arrow length is capped to `groundY − MARGIN_TOP − size/2`,
  so the normal arrow cannot leave the top of a short viewport under a 10 kg block.
- **2026-08-18 (step 3)** — **The block is a tinted fill with a solid outline, not momentum's flat
  block-a rectangle.** The applied-force arrow is block-a and starts at the block's centre; a solid
  block-a body would swallow its first half, and an arrow has to be legible over the body it acts
  on for the drawing to be a free-body diagram at all.
- **2026-08-18 (step 3)** — **`redraw()` re-resolves the forces at the instant it draws**, rather
  than reusing the `dynamics` `advance()` returned (which describe the interval just integrated),
  so the arrows and the position on screen always describe the same moment. Still `physics.js`
  doing the work — the canvas computes nothing physical.
- **2026-08-18 (step 3)** — `niceTickStep` and `arrow` are **duplicated** from `ProjectileCanvas`
  rather than exported from it: that file is on the phase 6 do-not-modify list, and duplicating
  small view helpers is this repo's recorded convention. Canvas text uses
  `'JetBrains Mono', ui-monospace, monospace` — projectile predates the font being loaded and uses
  the bare fallback stack.

- **2026-08-18 (step 4)** — **The shell needed no edits, as designed.** `SimulationPage`,
  `ConceptPanel`, `PracticePanel`, `ChatPanel` and `contentParser` are all fully generic; the
  four-view split, the Concept→Ask gate and the question count came free from the registry entry.
  The phase 5.2 generalisation holds.
- **2026-08-18 (step 4)** — **The state indicator has THREE states, not two.** `resolveDynamics`
  returns the `kinetic` regime the instant `F` passes `f_s,max` — correctly, since kinetic friction
  applies from that instant — but the block is still at `v = 0` until the next frame, and before Run
  it never moves at all. Labelling that `MOVING` is a lie the student can see in the velocity row
  right beneath it. So: `STATIC` / `BREAKING AWAY` (kinetic regime, `v = 0`) / `MOVING`. Found by
  looking at the rendered page, not by reasoning about it.
- **2026-08-18 (step 4)** — **One bar scale for the whole panel, `f_s,max`.** Applied force and
  friction share it so the two bars are directly comparable — below the threshold they are
  identical lengths and grow together 1:1; at breakaway the applied bar fills the track and friction
  visibly drops back to `μ_k/μ_s` of it. The applied bar saturating above the threshold is the
  signal, not a defect. Net force uses the same scale signed, acceleration uses it over the mass.
- **2026-08-18 (step 4)** — **Normal force is a LIVE row, not a predicted one**, despite changing
  only with the mass slider — the precedent is projectile rendering horizontal velocity live while
  noting it is constant for the whole flight. It gets no bar, for that same reason. Colour in the
  readout matches the arrow in the canvas (applied block-a, friction block-b, normal plain text),
  with phosphor kept for the *results*: state, net force, acceleration, velocity, displacement, time.
- **2026-08-18 (step 4)** — `buildSimState` **is not gated on having started**, unlike projectile's
  `launched`/`in_flight` nulling. A projectile that has not been fired has no flight to describe; a
  block at rest with friction holding it *is* the physics. It still withholds `N`, `f_s,max`, `f_k`
  and `a` — the prompt file tells the tutor to derive those and show its working.
- **2026-08-18 (step 4)** — **Four rendering defects found by loading the page, none by the build.**
  (a) Arrow labels were placed at each arrow's midpoint, which put them on top of their own arrow
  and inside the block, colliding with the mass label and each other — moved beyond the arrowheads,
  four labels on four different sides. (b) `MARGIN_LEFT` was projectile's 56, but the *left* of the
  block is where the friction arrow and its label live and the camera holds the block at that
  margin, so the friction label was clipped by the canvas edge on the very first frame — now 140,
  sized to hold `MAX_VECTOR_PX` plus a label. (c) The `f_s,max` ghost label was clipped for the same
  reason. (d) The canvas regime tag added at step 3 both duplicated the new readout STATE row and
  collided with the normal-force label — **removed**, which is what step 3's own note said to
  reconsider here.

- **2026-08-18 (step 5)** — **IB A.2 is now TWO cards, resolving open question 1.** A.2 was never
  "coming soon" — it already pointed at `/sim/momentum`, and `TopicCard` carries one destination per
  card. Repointing it would have delinked momentum from the IB map entirely. So A.2 is split: two
  cards sharing the code `A.2`, titled `Forces and momentum — Newton's second law` and
  `Forces and momentum — momentum and impulse`. Their titles *must* differ —
  `CurriculumSection` keys its cards on `topic.title` — which is also why this needed no change to
  the shared `TopicCard` component. Decided by the founders when the options were put to them.
- **2026-08-18 (step 5)** — **The IB card says "Newton's second law", not "Newton's laws".** The
  simulation models one block on a flat surface and covers neither the first nor the third law. A
  card title is a claim about what sits behind it.
- **2026-08-18 (step 5)** — **AP Physics C: Mechanics deliberately still reads "Coming soon"** on
  Unit 2. It shares the `MECHANICS_UNITS` list with Physics 1 but is passed no links, the same
  reasoning already recorded for Unit 4: these simulations are pitched at the algebra-based course.
  Verified on the rendered page as a negative check, not assumed.
- **2026-08-18 (step 7)** — **The roster sweep changed exactly two lines**, one in each of
  `momentum.txt:240` and `projectile.txt:142`, both from `not yet covered` to
  `COVERED (friction and Newton's second law only)`. The qualifier is what keeps it honest: AP
  Unit 2 also covers connected systems, Atwood machines and inclined planes, none of which this
  simulation models. The 53-character prefix is preserved byte-for-byte so the status column stays
  aligned, and `momentum.txt:256` — the *C: Mechanics* Unit 2 line, which matches the same text —
  was targeted by line number rather than by string so it could not be caught by a global replace.
- **2026-08-18 (step 7)** — **The change does not wait on step 6.** The roster's own definition
  (`momentum.txt:197`) is that COVERED means "a simulation is live on PhysicsLab today", not that a
  tutor exists for it. The simulation is live and linked from both maps; only its own tutor is
  missing.
- **2026-08-18 (step 7)** — **Checked and deliberately NOT changed:** `momentum.txt:256`
  (C: Mechanics Unit 2, correctly still uncovered); IB A.2, already `COVERED` unqualified in both
  files, so there was no false claim to fix — that line arguably became *more* accurate today;
  `momentum.txt:320-323`, the prose caveat saying the momentum sim covers "only the momentum and
  impulse portion of A.2", now stale in spirit but **grounding prose, out of the roster-only scope
  set for this step**; and `projectile.txt`, which carries no A.2 caveat at all so its tutor reads
  A.2 as flatly covered. The last two are open items for step 6.

## Open questions

1. ~~**How do IB students reach this simulation?**~~ **RESOLVED 2026-08-18 (step 5)** — A.2 split
   into two cards, both live. See the step 5 decisions above.
2. ~~**Roster sweep, step 7**~~ **RESOLVED 2026-08-18 (step 7)** — applied, two lines. The
   original finding, for the record: both `momentum.txt:240` and `projectile.txt:142` marked `Unit 2  Force and Translational Dynamics ... not yet covered`, which
   goes false the moment this sim ships. IB A.2 is already `COVERED` in both via momentum, but its
   partial-coverage caveat is prose-only (`momentum.txt:320-323`) and **absent entirely from
   `projectile.txt`**, whose tutor therefore reads A.2 as flatly covered. `momentum.txt:256`
   (AP Physics C: Mechanics Unit 2, not covered) stays correct — these sims are algebra-based.

## REMAINING

Step 6 only. Content artefacts will ship as marked TODO placeholders on the content track
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

**The physics gate is PASSED, re-run and still passing after the step 1b amendment** — `a = 3.06`
(moving, `F = 12`) and `a = 0` with `friction = −8 N` (static, `F = 8`), both verified against
real module output, plus the exact-zero landing at `1.47 m`.

**The simulation is LIVE at `/sim/newtons-second`** as of step 4, and has been rendered in a real
browser for the first time: the free-body diagram draws, the readout reads, Concept renders its
KaTeX, Practice shows four in-drafting groups, and the Concept→Ask gate unlocks. Console clean. The
static regime was verified on screen — `F = 7.5 N` gives `friction = −7.50 N` (**not** `−9.8`),
`F_net = 0`, `a = 0`, with the applied and friction bars at identical lengths.

**Not yet eye-tested: motion.** rAF is throttled in an automated tab (phase 5 measured 3 s wall
clock advancing 0.03 s simulated), so breakaway, the camera scroll and the coast-to-rest guard have
been verified numerically but never *watched*. That check is the founders', at
`http://localhost:5173/sim/newtons-second`.

**Steps 5 and 7 are done.** The simulation is linked from AP Physics 1 Unit 2 and from both IB
A.2 cards, and the two stale roster lines are corrected.

**Only step 6 remains** — `backend/prompts/newtons-second.txt` plus `format_newtons_state` in
`backend/main.py`. Until it lands, the Ask tab unlocks and then fails with a clean "No system
prompt for simulation" error, which is correct: this tutor **must not be served until section 2
holds Peter-reviewed content**.