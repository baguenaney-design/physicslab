# Phase 6 — Newton's Second Law simulation

## Context

PhysicsLab has two simulations live (`/sim/momentum`, `/sim/projectile`) behind a generalized
shell: `SimulationPage` owns the sidebar, the four-view switch, the Concept→Ask gate and the
readout/frame refs, and every topic-specific difference lives in a `src/simulations/registry.js`
entry. Adding a topic is a registry key plus one folder — the shell needs zero edits.

Phase 6 adds the third: **a single block on a flat surface, applied force against friction.**
One body, one dimension. Explicitly NOT coupled blocks, Atwood machines or connected systems —
those need their own simulation.

The point of this sim is the **free-body diagram** and the **static→kinetic transition**. The most
common student misconception is that friction is always `μN`. It is not: below the breakaway
threshold friction equals the applied force, and `μ_s·N` is only its *cap*. `physics.js` must get
that right, and the canvas and readout must make it visible.

---

## Three corrections to the brief (repo doesn't match)

1. **`src/App.jsx` needs no edit.** There are no per-sim routes — `<Route path="/sim/:topic">`
   already serves every slug via the registry. `/sim/newtons-second` works the moment the registry
   entry exists.
2. **There is no `src/pages/CurriculumMap.jsx`.** It is two files, `APCurriculumMap.jsx` and
   `IBCurriculumMap.jsx`, both rendering the shared `src/components/ui/TopicCard.jsx`, where
   "Coming soon" is purely `Boolean(to)`.
3. **`MANUAL_QA.md` §6 is not the roster sweep** — it is a bare reminder log. The roster-sweep
   checkboxes are in **§5** (`Every curriculum roster in backend/prompts/*.txt matches what is
   actually live`). Step 7 below targets §5 and appends to §6.

**Decided (2026-08-15):** IB A.2 is *not* "coming soon" — it already links to `/sim/momentum`, and
`TopicCard` takes one `to` per card. A.2 stays pointed at momentum; this sim is reachable from the
**AP map only** for now. The registry still carries both `ib` and `ap` eyebrows, so repointing
later needs no other change. Logged as an open item, not silently accepted.

**Decided (2026-08-15):** split `μ_s`/`μ_k`, not a single μ. The breakaway drop in friction is the
teaching moment; a single μ makes `f_s,max == f_k` and erases it. The surface selector carries real
coefficient *pairs* (the `GRAVITIES` convention in `projectile/Controls.jsx`, which carries real g
values rather than being decorative).

**Decided (2026-08-15):** sliders stay **live during motion**, with numeric integration — not
projectile's lock-at-Launch. The student drags applied force up and watches the block break loose
exactly as F crosses `μ_s·N`. Locking params would make that unobservable. This is what makes the
`dt ≤ 1/30 s` clamp load-bearing rather than inherited.

---

## Step 1 — `src/simulations/newtons-second/physics.js` — THE ACCURACY GATE

Pure functions, no rendering. Every function carries its source formula and known-I/O test cases in
comments, exactly as `projectile/physics.js` does. **Stop after this step and show both test
outputs before anything else is written.**

### Primitives

| Function | Formula | Source |
|---|---|---|
| `normalForce(mass, g)` | `N = m·g` | Newton's second law vertically, flat ground, no vertical component of applied force → `ΣF_y = 0` |
| `maxStaticFriction(muS, N)` | `f_s,max = μ_s·N` | Coulomb model of dry friction |
| `kineticFriction(muK, N)` | `f_k = μ_k·N` | Coulomb model of dry friction |

### The composer — `resolveDynamics({ mass, g, muS, muK, appliedForce, velocity })`

Returns `{ normal, maxStatic, kinetic, friction, netForce, acceleration, regime }` where `regime`
is `'static' | 'kinetic'`. Friction is **signed** — it opposes motion, or opposes impending motion
when at rest.

```
N      = mass · g
fsMax  = muS · N
fk     = muK · N

if velocity === 0:
    if |appliedForce| <= fsMax:
        friction = -appliedForce        // equal and opposite, NOT μ_s·N
        netForce = 0
        a        = 0
        regime   = 'static'
    else:
        friction = -sign(appliedForce) · fk
        netForce = appliedForce + friction
        a        = netForce / mass
        regime   = 'kinetic'            // breaks away; kinetic friction applies immediately
else:
    friction = -sign(velocity) · fk     // opposes motion, whatever the applied force does
    netForce = appliedForce + friction
    a        = netForce / mass
    regime   = 'kinetic'
```

`<=` at the threshold, per the brief: at exactly `F = f_s,max` the block is still static.

### The integrator — `advance(state, dt)`

Kept in `physics.js`, not the canvas, so the canvas computes nothing physical (CLAUDE.md rule, and
the discipline `ProjectileCanvas` already keeps). Semi-implicit Euler:

```
v1 = v0 + a·dt
x1 = x0 + v1·dt
```

**Stop-at-rest — the subtle case.** If `v0` and `v1` have opposite signs, friction brought the block
to rest *within* this frame. Without a guard, friction would reverse the block's direction, which is
physically wrong — kinetic friction cannot drive a body backwards. So: clamp `v1 = 0` and advance
position by the exact stopping distance `d = v0² / (2|a|)` (from `v² = u² + 2as` with `v = 0`),
signed with `v0`. The next frame's `resolveDynamics` then re-runs the static test at `v = 0`, which
is what lets a block coast to a stop and *stay* stopped under a force below the static cap.

### Embedded test cases (comments), verified by running node against the module

**Your two required cases** — `m=2 kg, μ_s=0.5, μ_k=0.3, g=9.8`:

| | `F = 12 N` (MOVING) | `F = 8 N` (STATIC) |
|---|---|---|
| `N` | 19.6 | 19.6 |
| `f_s,max` | 9.8 | 9.8 |
| threshold | 12 > 9.8 → breaks away | 8 < 9.8 → holds |
| friction | −5.88 (= μ_k·N) | −8 (= −F, **not** −9.8) |
| `F_net` | 6.12 | 0 |
| **`a`** | **3.06 m/s²** | **0** |

**Independent cross-check for a = 3.06**, by a second route that never touches `F_net/m` — the
work-energy theorem. From rest under constant `a = 3.06` for `t = 2 s`: `v = 6.12 m/s`,
`x = 6.12 m`. Then `W_net = F_net·x = 6.12 × 6.12 = 37.4544 J` and `KE = ½mv² = ½·2·6.12² =
37.4544 J`. Two routes, one number — that is what makes it a check rather than a restated formula.

**Additional embedded cases:**
- `F = 9.8` exactly → static, friction = −9.8, a = 0 (boundary, `<=`)
- moving at `v = 5`, `F = 0` → friction = −5.88, a = −2.94 (decelerating)
- moving at `v = 5`, `F = 3` → net = −2.88, a = −1.44 (**still decelerating while being pushed** —
  a genuinely counter-intuitive exam case)
- `μ_s = μ_k = 0` → a = F/m = 6.0 (frictionless)
- **stop-at-rest:** `v = 1, F = 0, a = −2.94, dt = 1` → naive Euler gives `v = −1.94` (block reverses,
  wrong); guard clamps to `v = 0` and advances `1²/(2·2.94) = 0.1701 m`

**Commit `phase 6.1: newtons-second physics.js` only after both required outputs are shown and you
confirm them.**

---

## Step 2 — `Controls.jsx`

Mirrors `projectile/Controls.jsx`: local `Slider` and `toggleButtonStyle` duplicated rather than
hoisted (same reasoning already recorded in that file), values in `var(--instrument-data-font)`.

Sliders: **Applied force** 0–30 N step 0.5 (block-a) · **Block mass** 0.5–10 kg step 0.1 ·
**μ_s** 0–0.8 step 0.01 · **μ_k** 0–0.8 step 0.01, **clamped to ≤ μ_s on change** (μ_k > μ_s is
unphysical and would make a moving block harder to keep moving than to start).

Applied force is non-negative — one direction only, so motion is always +x and the sign logic in
`physics.js` is exercised but never ambiguous on screen.

`SURFACES` preset row below, exactly the shape of `GRAVITIES`, carrying real textbook pairs and
setting both coefficients:

```js
export const SURFACES = [
  { id: 'ice',    label: 'Ice',    muS: 0.10, muK: 0.03 },
  { id: 'wood',   label: 'Wood',   muS: 0.50, muK: 0.30 },  // the reference case
  { id: 'rubber', label: 'Rubber', muS: 0.80, muK: 0.70 },
]
```

Source-cited in comments like `GRAVITIES` is. `g` is fixed at 9.8 — this sim is not about gravity.

---

## Step 3 — `NewtonsCanvas.jsx`

Instrument register. rAF loop via `useRef` (`simRef` / `rafRef` / `lastTimeRef`), `ResizeObserver`
on the container, cancellation on unmount — the `ProjectileCanvas` architecture. `MAX_FRAME_DT =
1/30` reused verbatim, comment adapted: an unclamped 1 Hz frame from a backgrounded tab would
teleport the block metres downrange and skip the acceleration entirely.

**Camera.** Fixed `PIXELS_PER_METRE` (momentum's approach, not projectile's per-run scale — there is
no closed-form extent here to scale to, since the block accelerates indefinitely). The view scrolls
once the block passes ~40% of the width, so it never leaves the frame; ground ticks scroll with the
world, so displacement stays readable off the drawing. Reuses projectile's `niceTickStep`.

**The free-body diagram is the point, not decoration.** Four vectors drawn from the block's centre,
**all at one shared px-per-newton scale** so their lengths are honestly comparable:

| Vector | Colour token | Direction |
|---|---|---|
| Applied force | `--instrument-block-a` | right |
| Friction | `--instrument-block-b` | left (opposes motion / impending motion) |
| Normal | `--instrument-text` | up |
| Weight | `--instrument-text` | down |

Normal and weight are equal and opposite and visibly cancel. Below threshold, the friction arrow
grows to **exactly match** the applied arrow; at breakaway it **snaps shorter** to `μ_k·N`. That
snap is the whole lesson, drawn.

One `Force vectors` toggle, outlined not phosphor (a view option, not a primary action) — the
`showVectorsRef` pattern from `ProjectileCanvas`, because the running loop closes over its first
`step` and would otherwise read a stale state value.

Buttons: **Run** (phosphor, primary) and **Reset**. Footer status label
`1-D · Flat surface · Coulomb friction`, mirroring projectile's `2-D flight · No air resistance`.

`onFrame({ elapsed, position, velocity, appliedForce, friction, netForce, acceleration, normal,
maxStatic, regime, running })`.

---

## Step 4 — `Readout.jsx`, `SimulationView.jsx`, content, registry entry → goes live

**`Readout.jsx`** — `forwardRef` + `useImperativeHandle(ref, () => ({ update(frame) {…} }))`,
writing `textContent` and bar widths directly so animating never re-renders React.

LIVE block (phosphor for live values, `--instrument-data-font` throughout):
- **State** — the word `STATIC` or `MOVING`. The teaching moment: while static the row reads
  `STATIC · friction = applied force`, making explicit that friction is *not* `μ_s·N` here.
- Applied force (block-a) · **Friction force (block-b), bar ceiling = `f_s,max`** — it climbs 1:1
  with applied force, hits the cap, then visibly *drops* to `μ_k·N` at breakaway
- Net force (phosphor, centre-anchored signed bar — it goes negative when friction wins)
- Acceleration (phosphor, signed bar) · Velocity (phosphor) · Displacement (phosphor)

PREDICTED block below the rule, non-phosphor, from the sliders (mirrors projectile's "Predicted for
this setup"): Normal force `N`, Max static friction `μ_s·N`, Kinetic friction `μ_k·N`.

**`SimulationView.jsx`** — the 4-prop contract `({ simState, readoutRef, onFrame, onControlsChange })`,
readout card floating over the canvas with `READOUT_INSET` derived from the same constants.

**`docs/content/newtons-second.md`** — the parser's heading contract. `## Key Equations` complete and
canonical (formula-sheet statements, not authored explanation), rendered by KaTeX:
`$\Sigma F = ma$`, `$N = mg$`, `$f_s \le \mu_s N$`, `$f_k = \mu_k N$`, `$F_{net} = F_{app} - f$`,
`$v = u + at$`, `$s = ut + \frac{1}{2}at^2$`.
`## Concept Summary` is a **marked TODO placeholder** naming what it must cover. All four
`## Practice Questions` groups are the single word `PENDING`. **I will not invent summary prose or
questions** — founders draft, Peter Syrenne reviews.

**`newtonsContent.js`** — raw import + `parseTopicContent(raw, "Newton's Second Law")`.

**Registry entry** — two imports plus one keyed object with all nine keys:

```js
'newtons-second': {
  slug: 'newtons-second',
  topicName: "Newton's second law",
  content: newtonsContent,
  SimulationView: NewtonsSimulationView,
  // AP Unit 2 and IB A.2 are both broader than this simulation — Unit 2 includes connected
  // systems and Atwood machines, A.2 includes equilibrium and circular motion. The eyebrow
  // names the narrower scope actually covered, per the projectile convention.
  eyebrows: {
    ib: "IB Physics · A.2 — Newton's Second Law",
    ap: "AP Physics 1 · Unit 2 — Friction & Newton's Second Law",
  },
  simulationSublabel: 'Interactive free-body diagram',
  emptyChatHint: 'Ask about the block you are pushing — the tutor can see your current setup.',
  initialState: { appliedForce: 12, mass: 2, muS: 0.5, muK: 0.3 },  // the verified reference case
  buildSimState(simState, frame) { /* flat unit-bearing keys, projectile convention */ },
}
```

Ask stays gated behind Concept by the shell — no work needed.

---

## Step 5 — curriculum map link

- `src/pages/APCurriculumMap.jsx` — add `'Force and Translational Dynamics':
  '/sim/newtons-second?from=ap'` to the `numbered(MECHANICS_UNITS, {…})` link table. AP Physics C:
  Mechanics keeps `numbered(MECHANICS_UNITS)` with no links, so its Unit 2 still reads "Coming soon"
  — correct, these sims are pitched at the algebra-based course.
- Intro copy on **both** maps: "Two simulations are live so far" → "Three".
- `IBCurriculumMap.jsx` otherwise unchanged (see the decision above).

---

## Step 6 — backend

- **`backend/prompts/newtons-second.txt`** — scaffold mirroring the eight-section skeleton of
  `projectile.txt` (`1. ROLE` … `8. SAFETY`), carrying the same `!!! NOT GROUNDABLE` banner at the
  top and an **empty section 2** between `--- BEGIN REVIEWED CONTENT ---` / `--- END REVIEWED
  CONTENT ---`. Section 6 states what the sim models (single body, flat surface, Coulomb friction,
  no connected systems), the real control ranges, and what the tutor must derive itself. Section 7
  SCOPE marks inclined planes, connected systems/Atwood, circular motion and drag as off-topic.
  **The tutor is not groundable and must not be served until section 2 is filled.**
- **`backend/main.py`** — add `format_newtons_state(sim_state)` following the projectile formatter's
  shape, and register `"newtons-second": format_newtons_state` in `STATE_FORMATTERS`. Like the other
  two, it deliberately does **not** compute `N`, `f_s,max`, `f_k` or `a` — section 6 tells the tutor
  to derive them and show the working, and sending them would contradict that.

---

## Step 7 — CROSS-SIM ROSTER SWEEP (report only — no silent edits)

I already ran the check. **Finding, for your decision — I will not touch these files without your
go-ahead:**

- **The real hit.** Both `momentum.txt:240` and `projectile.txt:142` mark
  `Unit 2  Force and Translational Dynamics ......... not yet covered`. **That becomes false the
  moment this sim goes live**, in both files. `momentum.txt:256` says the same for AP Physics C:
  Mechanics Unit 2 — that one stays correct (algebra-based only).
- **IB A.2 is already `COVERED` (unqualified) in both files** — via momentum. So no false
  "not covered" claim there. But the partial-coverage caveat is prose-only, lives at
  `momentum.txt:320-323` ("The PhysicsLab momentum simulation covers only the momentum and impulse
  portion of A.2"), and needs widening once Newton's laws are also covered.
- **`projectile.txt` has no A.2 caveat at all** — its tutor reads `A.2 ... COVERED` flat, with
  nothing saying which parts are unbuilt. Pre-existing gap, surfaced not fixed.
- **Both SCOPE sections still list "inclined planes" as off-topic** — correct and unchanged, this
  sim is flat-surface only. `momentum.txt:515-530` would want a forces carve-out mirroring the
  projectile one it already carries.

Also append a line to `MANUAL_QA.md` §6 (reminder log) and add the physics sub-block to §4.

---

## Files

**Create (9)**
```
docs/NEWTONS_PROGRESS.md
docs/content/newtons-second.md
src/simulations/newtons-second/physics.js
src/simulations/newtons-second/Controls.jsx
src/simulations/newtons-second/NewtonsCanvas.jsx
src/simulations/newtons-second/Readout.jsx
src/simulations/newtons-second/SimulationView.jsx
src/simulations/newtons-second/newtonsContent.js
backend/prompts/newtons-second.txt
```

**Modify (5)**
```
src/simulations/registry.js        two imports + one keyed entry
src/pages/APCurriculumMap.jsx      one link + intro copy
src/pages/IBCurriculumMap.jsx      intro copy only
backend/main.py                    format_newtons_state + STATE_FORMATTERS entry
docs/MANUAL_QA.md                  §4 physics sub-block, §6 reminder line
```

**Explicitly NOT modified** — `src/App.jsx`, `SimulationPage.jsx`, `TopicSidebar.jsx`,
`ChatPanel.jsx`, `ConceptPanel.jsx`, `PracticePanel.jsx`, `contentPrimitives.jsx`,
`contentParser.js`, `tokens.css`. The shell generalization from phase 5.2 holds; if any of these
turns out to need a change, that is a finding worth stopping to report.

**Pending your approval** — `backend/prompts/momentum.txt`, `backend/prompts/projectile.txt`
(step 7 roster sweep).

---

## Constraints held throughout

Instrument register only (`#15171C` bg, `#1B1E25` panels, phosphor `#7CFFB2` for live data and
primary CTAs only) · colours only via `tokens.css` custom properties, never literals · `border-radius:
var(--radius-max)` (4px) · no drop shadows · all numbers in `--instrument-data-font` · equations via
KaTeX · desktop only, no breakpoints under 1024px · no animation libraries in sim code · every
formula comment-cited with a known-I/O test case.

---

## Verification

- **Step 1 is a hard gate.** Run `node` against `physics.js` and print both required cases plus the
  stop-at-rest guard. Show you `a = 3.06` (moving) and `a = 0, friction = 8 N` (static) and **wait
  for your confirmation** before writing anything else.
- `npm run build` and `npx oxlint` clean before each commit.
- Browser eye-test per `MANUAL_QA.md`, by you — rAF is frozen in a backgrounded tab, so the
  automation harness cannot check the animation (measured in phase 5: 3 s wall clock advanced 0.03 s
  simulated). Specifically: drag applied force up through the threshold and confirm the friction
  arrow tracks it 1:1, then snaps shorter at breakaway; confirm a block coasting under a sub-threshold
  force stops and stays stopped rather than reversing.
- Curriculum: AP Unit 2 card opens the sim with the narrowed eyebrow; momentum and projectile
  unaffected; both intro lines read "Three".

## Resume protocol

Commit each numbered step that builds clean, as `phase 6.N: <what>` — each is a restore point.
Keep `docs/NEWTONS_PROGRESS.md` current after every step (done + commit hash, next, decisions, open
questions), in the `PROJECTILE_PROGRESS.md` format. On "resume newtons": read CLAUDE.md, that file,
`git log --oneline | grep "phase 6"`, and the projectile sim — then report where we are in 3–4 lines
and **wait**. Do not build. If a cutoff lands before you have confirmed both physics outputs, the
progress file gets **UNVERIFIED** at the top so it is re-checked before anything builds on it.
