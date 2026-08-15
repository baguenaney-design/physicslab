# PhysicsLab — Manual QA Checklist

Run before any deploy, and after any change that touches a simulation, the shell, or content.
Desktop only — CLAUDE.md rules out breakpoints below 1024px, so there is no mobile pass.

> **Structure note.** This scaffold was reconstructed from the project's own constraints, not
> from the original MANUAL_QA spec, which was not available when the file was created. If the
> original structure differs, overwrite §1–§5 — but keep §6, which carries the running reminder
> log other docs point at.

---

## §1 — Build and console

- [ ] `npm run build` completes with no errors
- [ ] `npm run lint` clean (oxlint, no warnings)
- [ ] `python3 -m py_compile backend/main.py` clean
- [ ] Browser console clean on every route: no errors, no React warnings, no failed requests
- [ ] No KaTeX rendering faults (see the rolldown surrogate bug — equations silently render as
      raw text when that regresses, so check a real equation, not just the absence of an error)

## §2 — Editorial register

Landing, curriculum maps, content panels. Background `#F8F7F4`, text `#1A1A1A`, accent `#2563EB`,
Inter.

- [ ] Landing renders; both AP and IB entry cards navigate
- [ ] `/ap` — all four courses listed; live topics link, everything else greyed with "Coming soon"
- [ ] `/ib` — sections A–E listed; same rule
- [ ] Live-simulation count in the intro copy matches reality on both maps
- [ ] No instrument-register colours have leaked in
- [ ] Radius ≤ 4px everywhere; no drop shadows on layout elements

## §3 — Instrument register and the four-view shell

Inside a simulation. Background `#15171C`, panels `#1B1E25`, phosphor `#7CFFB2` **only** for live
data readouts and primary CTAs, JetBrains Mono for every number.

For each live simulation:

- [ ] The register visibly changes on entry — this transition is the site's signature moment
- [ ] Sidebar: eyebrow matches the `?from=` origin, back link returns to the right map
- [ ] All four views mount: Simulation, Concept, Practice, Ask
- [ ] Ask is **locked** until Concept has been visited, and unlocks after
- [ ] Practice sublabel shows a real count, or "In drafting" when every group is pending
- [ ] Canvas animates; readout updates live; Launch and Reset both work
- [ ] Leaving and re-entering Simulation starts a clean run (no orphaned animation frame)
- [ ] Phosphor has not crept onto nav, back links, or predicted (non-live) values
- [ ] Unknown slug (`/sim/does-not-exist`) redirects home rather than blanking

## §4 — Physics accuracy

Zero tolerance: a wrong number here costs a student exam marks. Check the readout against the
reference case, not against the drawing.

**Momentum** — `/sim/momentum`

- [ ] Elastic, m1=2 u1=3, m2=3 u2=−1 → v1f=−1.8, v2f=2.2
- [ ] Total momentum identical before and after the collision, to displayed precision
- [ ] Inelastic: both blocks share one velocity; KE loss shown and positive
- [ ] Elastic mode reports no KE loss

**Projectile** — `/sim/projectile`

- [ ] Reference case v0=20, θ=45°, g=9.8 → R=40.82 m, H=10.20 m, T=2.886 s
- [ ] A completed run lands at the predicted range, height 0.00 m, elapsed ≈ T
- [ ] vy mirrors launch to landing (+14.14 → −14.14); landing speed equals launch speed
- [ ] vx constant for the whole flight
- [ ] Complementary angles 30° and 60° give the same range
- [ ] θ=90° gives range ≈ 0; the slider floors at 1°, so there is no dead Launch
- [ ] Moon and Mars visibly rescale the flight; the view scale freezes at launch and does not
      drift mid-flight (worth one long Moon run to confirm)

## §5 — AI tutor grounding

- [ ] Backend reachable; `/api/health` returns ok
- [ ] Tutor answers stream, and cite curriculum topics before answering
- [ ] Response-mode menu appears, and the choice holds across follow-ups
- [ ] The tutor refuses to invent content outside its reviewed grounding, and says so plainly
- [ ] Simulation state reaches the tutor in the right shape — **no `None` fields** (each sim has
      its own renderer in `STATE_FORMATTERS`, `backend/main.py`)
- [ ] Every curriculum roster in `backend/prompts/*.txt` matches what is actually live
- [ ] **No simulation whose grounding slot is still empty is being served to students**

## §6 — Reminder log

Running log of things that changed and must not be forgotten. Newest last.

- Projectile live as of phase 5 — kinematics now COVERED; swept momentum.txt roster.
