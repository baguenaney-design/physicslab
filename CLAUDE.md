# PhysicsLab — Claude Code Context & Rules

## What this project is
A free, browser-based interactive physics simulation platform for AP and IB Physics students.
Built by two students from the UAE. Free forever. Universal in ambition.

Each simulation contains:
- A 2D interactive HTML5 Canvas with real-time variable controls
- A curriculum content panel (concept summary, KaTeX equations, exam-style practice questions)
- An AI tutor grounded in teacher-reviewed content, context-aware of the current simulation state
- An optional "Beyond the Classroom" extension tab on select topics

## Who built this
Founders: [Your Name] + Anay [Last Name]  
Academic reviewer: Peter Syrenne — accredited physics and chemistry teacher  
All simulation content must be reviewed by Peter before publishing.

## Working name
"physicslab" — use this as the slug everywhere (URLs, folder names, etc.).  
Final name TBD. When chosen: single find-and-replace across the project.

---

## Stack

| Layer | Technology | Notes |
|---|---|---|
| Frontend framework | React + Vite | Component-based, fast HMR |
| Styling | Tailwind CSS + tokens.css | Never invent colours outside tokens.css |
| Simulation rendering | HTML5 Canvas (2D) | All simulation physics lives here |
| Math rendering | KaTeX via react-katex | All equations, never plain text |
| Landing animation | GSAP | Landing page intro sequence only |
| Backend | Python + FastAPI | Thin AI proxy in /backend |
| AI | Anthropic Claude API (claude-sonnet-4-6) | Streamed responses |
| Routing | react-router-dom | Page navigation |
| Auth + DB (later) | Supabase | DO NOT implement until simulations are complete |
| Donations | Stripe payment link | No backend code needed |
| Hosting | Vercel (frontend) + Railway (backend) | |

---

## Visual design — two registers, never mixed

### Editorial register
Used for: landing page, navigation, curriculum map, content panels

```
Background:     #F8F7F4
Text:           #1A1A1A
Accent:         #2563EB
Secondary text: #6B7280
Border:         #E5E3DF
Font:           Inter
Feel:           Clean, typographically confident — like a well-designed academic journal
```

### Instrument register
Used for: inside every simulation — canvas, controls, readouts, AI chat

```
Background:     #15171C
Panel:          #1B1E25
Grid lines:     #2A2D35
Phosphor green: #7CFFB2   ← ONLY for live data readouts and primary CTAs
Block A:        #6FA8FF   ← blue
Block B:        #FFB454   ← amber
Warning/loss:   #FFB454
Body font:      Inter
Data font:      JetBrains Mono ← ALL numbers, readouts, variable labels, equation values
Feel:           Physics lab instrument. Precise. No decoration.
```

### The transition
The moment a student enters a simulation, the visual world changes — background, font, colour register all shift. This transition is intentional and is the site's signature moment. It must feel like entering a different environment, not just a different page.

---

## Design rules — never break these

- **Border radius:** max 4px on all UI chrome. No rounded-xl.
- **Shadows:** no drop shadows on layout elements.
- **Colours:** never use a colour not defined in `src/styles/tokens.css`.
- **Text:** no lorem ipsum. All text must be real content before a component is built.
- **Equations:** always rendered with KaTeX. Never plain text.
- **Numbers:** always JetBrains Mono inside simulation components.
- **Mobile:** this site is desktop only. No responsive breakpoints below 1024px. Do not add them.
- **Animation libraries:** GSAP on the landing page only. React Bits components in the editorial register only. Never inside simulation canvas code.

---

## Physics rules — non-negotiable

These rules exist because a wrong answer in a physics simulation can cost a student exam marks. There is zero tolerance for incorrect physics.

- All calculations must be mathematically correct.
- Every formula must have a comment citing it:
  ```js
  // elastic collision: v1f = ((m1-m2)*u1 + 2*m2*u2) / (m1+m2)
  // source: standard 1D elastic collision derivation
  ```
- Momentum must be conserved in elastic collisions to floating point precision.
- KE loss must be calculated and displayed in inelastic collisions.
- Every complex calculation must include a known input/output test case in comments:
  ```js
  // test: m1=2, u1=3, m2=3, u2=-1 → v1f=-1.8, v2f=2.2
  ```
- When in doubt about a formula: ask before implementing. Do not guess.

---

## File structure

```
physicslab/
├── CLAUDE.md                        ← this file
├── src/
│   ├── App.jsx                      ← routing
│   ├── styles/
│   │   └── tokens.css               ← all CSS custom properties
│   ├── pages/
│   │   ├── Landing.jsx
│   │   ├── CurriculumMap.jsx
│   │   └── SimulationPage.jsx
│   ├── components/
│   │   ├── ui/                      ← editorial components (Button, Nav, Card etc.)
│   │   └── sim/                     ← shared simulation components (Slider, Readout, ChatPanel)
│   └── simulations/
│       ├── momentum/
│       │   ├── MomentumCanvas.jsx
│       │   ├── physics.js           ← physics calculations only, no rendering
│       │   ├── Controls.jsx
│       │   ├── Readout.jsx
│       │   ├── ContentPanel.jsx
│       │   └── ChatPanel.jsx
│       ├── projectile/              ← same structure
│       └── newtons-second/          ← same structure
├── backend/
│   ├── main.py                      ← FastAPI app
│   └── prompts/
│       ├── momentum.txt             ← AI system prompt for momentum tutor
│       ├── projectile.txt
│       └── newtons-second.txt
└── public/
    └── founders/                    ← founder photo goes here
```

---

## Session rules — always follow these

1. **One task at a time.** Complete and confirm before moving to the next.
2. **Scope discipline.** Never modify files outside the current task's scope.
3. **Report back.** After every task: list exactly which files were created or changed.
4. **Ask, don't assume.** If anything is ambiguous, ask before implementing.
5. **Dependency transparency.** Never install a new package without naming it and explaining why before installing.
6. **Start every new session** by reading CLAUDE.md and the files relevant to today's task before doing anything else.
7. **Physics questions:** if uncertain about a formula or calculation, say so explicitly. Do not guess.

---

## AI tutor architecture — important

The AI tutor is NOT a free-range physics assistant. It is a grounded tutor.

Every call to the Claude API from the backend must include:
1. The full Peter-reviewed summary for the current simulation topic (from the relevant `prompts/` file)
2. The current simulation state as structured text (all variable values, mode, collision state)
3. The relevant AP and IB learning objectives for this topic
4. IB command term definitions relevant to this topic
5. An explicit instruction to reason from the provided content and flag if a question falls outside it

This is non-negotiable. It is what makes the AI defensible to teachers and departments.

---

## Content rules

- All simulation summaries are written by the founders, then reviewed by Peter Syrenne before publishing
- Equations use notation matching the AP formula sheet and IB data booklet — no deviations in symbol choice
- Practice questions are tagged: AP FRQ, IB Paper 2, or Conceptual
- Minimum 3 practice questions per simulation
- "Beyond the Classroom" extensions are optional and only included where genuinely intellectually interesting
- Content panels cover only what the simulation demonstrates. Impulse, Newton's Third Law applied to collision pairs, and force-time analysis of collisions are on-topic for the momentum simulation because they are mechanisms of momentum change. Off-topic examples: inclined planes, centripetal motion, projectile motion. If a topic requires physics the simulation does not model (a ramp, a curved path, gravity as primary force), it belongs in its own future simulation.

---

## What is explicitly out of scope (do not build)

- ❌ Mobile responsive layout
- ❌ Supabase auth (until all simulations are complete)
- ❌ CMS or content management system
- ❌ Teacher dashboard
- ❌ LMS integration
- ❌ EE/IA content (deferred)
- ❌ Any subject other than physics
- ❌ 3D rendering (Three.js for simulations is Phase 2+, not v1)
- ❌ Personalisation or per-user recommendations

---

## Future Features

- Add friction toggle to momentum sim for deceleration during approach phase — deferred post-v1.
- Beyond the Classroom extension for momentum — add a note explaining that perfectly inelastic collisions are modelled as instantaneous in AP/IB but in reality occur over milliseconds. Real collision involves deformation, heat generation, and sound release at the molecular level. The simulation's instantaneous KE loss is physically correct for the model but a simplification of reality. This distinction is worth exploring for IB HL and AP-C students.
- Beyond the Classroom mode for momentum — 3Blue1Brown pi collision demo. Walled version with mass ratio slider that produces digits of pi via collision count. Optional showcase feature separate from the main isolated-system simulation.
- Upgrade momentum simulation to model brief contact duration during collision (currently instantaneous). Would enable live F-t curve generation, letting practice questions reference the student's actual simulation output. Phase 1.5 revisit — requires reworking collision resolution from single-frame to short interpolated force pulse.

### External Libraries

Deferred UI libraries for editorial polish (never inside simulations):

1. **React Bits** (reactbits.dev) — copy-paste animated components for landing page text reveals and scroll effects. Zero dependencies.
2. **Skiper UI** — niche animated components for standout landing moments.

Both restricted to editorial register only. Introduce during Phase 7 (landing page polish), not before.

3. **motion.dev** — React hover/drag/layout transitions, consider for Phase 4 curriculum map interactions.
4. **Recharts** — if charts are needed later (F-t curves, projectile trajectories), this is the default choice.
