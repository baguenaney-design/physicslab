# PhysicsLab — Implementation Plan
**Version:** 0.2  
**Status:** Active  
**Philosophy:** Ship one working simulation before building anything else. Every phase ends with something real a human can use.

---

## The Critical Path

The order of build is not arbitrary. Each phase unlocks the next:

```
Simulation works → Summary written → Peter reviews → AI grounded in that content
```

You cannot build the AI tutor before the summary exists.  
You cannot have Peter review before the simulation is stable.  
You cannot build the landing page hero before simulations exist.  
You cannot add accounts before the thing worth saving progress on exists.

Everything flows from the simulation. Build that first.

---

## Phase 0 — Foundation
**Goal:** A working React project on your machine. Nothing visual yet.  
**Time estimate:** 1 day  
**Done when:** `npm run dev` opens a browser tab without errors.

### Steps

**0.1 — Create the project folder**
```bash
cd ~/Desktop
mkdir physicslab
cd physicslab
git init
```

**0.2 — First Claude Code message: create CLAUDE.md**
Paste the full CLAUDE.md (see `CLAUDE.md` in this folder) as your first message.  
Tell CC: *"Create a file called CLAUDE.md in the root of this project with the following content exactly: [paste]"*

**0.3 — Second Claude Code message: scaffold the project**
> "Read the CLAUDE.md. Scaffold a new React + Vite project in this folder with Tailwind CSS configured. Create the folder structure exactly as defined in CLAUDE.md under the File Structure section. Create `src/styles/tokens.css` with all design tokens from both visual registers. Do not create any page components yet. Confirm when done and show me the file tree."

**0.4 — Verify it runs**
```bash
npm run dev
```
You should see a blank React app. If yes: commit.
```bash
git add .
git commit -m "phase 0: scaffold complete"
```

**0.5 — Install remaining dependencies**
Tell CC:
> "Install the following dependencies and explain each one before installing: react-router-dom for page routing, katex and react-katex for equation rendering. Do not install anything else."

---

## Phase 1 — First Simulation (Momentum & Impulse)
**Goal:** A working, physics-accurate 2D momentum simulation inside a React component.  
**Time estimate:** 3–5 days  
**Done when:** Elastic and inelastic collisions work correctly, momentum is conserved to floating point precision, a physics teacher can look at the numbers and not find an error.

### Steps

**1.1 — Canvas component skeleton**
> "In `src/simulations/momentum/MomentumCanvas.jsx`, create a React component that renders an HTML5 canvas. The canvas should fill its container. Use the instrument register background colour from tokens.css. Draw a horizontal track line across the vertical center. Draw two rectangles on the track — one blue (Block A) on the left, one amber (Block B) on the right. Sizes should be fixed for now. No movement yet. Just the initial state."

Verify: open the page, see two coloured blocks on a dark track. Commit.

**1.2 — Physics engine**
> "In `src/simulations/momentum/physics.js`, write the physics functions for this simulation. Include: (1) elastic collision outcome — v1f and v2f using the standard 1D elastic collision formulae, with the formula cited in a comment. (2) perfectly inelastic collision outcome — combined velocity, with formula cited. (3) KE calculation before and after. (4) Add a comment block with known test cases: m1=2, u1=3, m2=3, u2=-1 elastic → v1f=-1.8, v2f=2.2. Do not touch the canvas component."

Verify: write a quick console.log test of the known case. Numbers must match exactly. Commit.

**1.3 — Animation loop**
> "In `MomentumCanvas.jsx`, add a `requestAnimationFrame` animation loop. Blocks should move horizontally based on their velocity. On collision (when edges touch), call the physics functions from physics.js to update velocities. After collision, blocks continue with new velocities. Add a Launch button that starts the animation and a Reset button that returns blocks to starting positions. Use `useRef` for the animation frame."

Verify: click Launch, blocks move, collide, continue. Click Reset, they return. Commit.

**1.4 — Controls**
> "Create `src/simulations/momentum/Controls.jsx`. Add four sliders: Block A mass (0.5–6 kg), Block A velocity (0–8 m/s), Block B mass (0.5–6 kg), Block B velocity (-8–0 m/s). Display current value next to each label using JetBrains Mono from tokens.css. Add an elastic/inelastic toggle. Wire all controls to React state in a parent component. Pass state down to MomentumCanvas. Do not start the animation — just connect the controls to the initial state."

Verify: drag sliders, see values update. Commit.

**1.5 — Live readout panel**
> "Create `src/simulations/momentum/Readout.jsx`. Display: momentum of Block A (p = mv), momentum of Block B, total momentum. Show each as a horizontal bar graph that fills proportionally, plus the numeric value in JetBrains Mono. Bars for A use Block A blue, bars for B use Block B amber, total uses phosphor green. Update in real time during animation. Add a KE loss display that only appears after an inelastic collision."

Verify: launch elastic collision, watch bars shift — total should stay constant. Launch inelastic, KE loss appears. Commit.

**1.6 — Assemble the simulation page**
> "Create `src/pages/SimulationPage.jsx`. Layout: full instrument register background. Left side (roughly 60% width): MomentumCanvas + Controls below it. Right side (40%): Readout panel at top, placeholder divs for concept panel and AI chat below. No content in the placeholders yet — just the structure and background colour."

Verify: page looks like the intended two-panel layout. Commit.

---

## Phase 2 — Content Panel
**Goal:** The curriculum content for momentum is written, formatted, and live on the simulation page.  
**Time estimate:** 2–3 days (including Peter review time)  
**Done when:** Peter has reviewed and signed off on the content.

### Steps

**2.1 — Write the content (you and Anay, offline)**
Write in a Google Doc first, not in code. Include:
- Concept summary (3–4 paragraphs, no jargon unless curriculum-required)
- Key equations in LaTeX notation (matching AP formula sheet + IB data booklet)
- 3 practice questions: one AP FRQ style, one IB Paper 2 style, one conceptual
- Exam tips specific to momentum questions from personal experience
- Any "Beyond the Classroom" extension if relevant (optional for v1)

**2.2 — Peter review**
Send the Google Doc to Peter. Do not code the content panel until he has reviewed it. Fix any errors he finds.

**2.3 — Content panel component**
> "Create `src/simulations/momentum/ContentPanel.jsx`. It should display: a concept summary section with paragraph text in Inter, a key equations section rendering equations using react-katex, a practice questions section with each question tagged with a coloured label (AP blue, IB amber). Use the editorial content feel inside the instrument register — the text should feel like a clean inset, not a dark console. Wire it into SimulationPage.jsx in the right panel."

Verify: content appears correctly, equations render properly with KaTeX, not as plain text. Commit.

**2.4 — Commit with Peter's approval noted**
```bash
git commit -m "phase 2: momentum content panel — reviewed by P. Syrenne"
```

---

## Phase 3 — AI Tutor
**Goal:** A working AI tutor grounded in Peter-reviewed content, streamed into the simulation page.  
**Time estimate:** 3–5 days  
**Done when:** A student can ask a question, get a streamed response grounded in the reviewed summary, and the response references the actual variable values they have set.

### Steps

**3.1 — FastAPI backend skeleton**
> "Create `backend/main.py`. Set up a FastAPI app with a single POST endpoint at `/api/chat`. It should accept a JSON body with `message` (string) and `sim_state` (object: m1, v1, m2, v2, mode, collided, post_v1, post_v2). Return a placeholder string for now. Add CORS so the React frontend can call it. Do not call any external API yet."

Verify: run `uvicorn main:app --reload`, call the endpoint with curl, get a response. Commit.

**3.2 — Write the system prompt**
Write `backend/prompts/momentum.txt`. This is the most important prompt engineering you will do. Include:
- The full Peter-reviewed momentum summary
- AP Physics 1 learning objectives for momentum (Unit 4)
- IB Physics Topic A.2 Forces and momentum assessment statements
- IB command term definitions relevant to this topic (state, explain, derive, calculate, discuss)
- AP science practice conventions
- Instruction: "You are a physics tutor helping a student understand momentum and impulse. The student is currently using an interactive simulation. Their current setup is provided in every message. Ground your responses in the content provided above. If a question falls outside this content, say so explicitly rather than guessing. Guide reasoning with questions where possible rather than giving direct answers."

**3.3 — Wire up the Claude API**
> "In `backend/main.py`, update the `/api/chat` endpoint to call the Anthropic Claude API using the `anthropic` Python package. Load the system prompt from `backend/prompts/momentum.txt`. Construct the user message as: the sim_state formatted as readable text, then the student's message. Stream the response back to the frontend using FastAPI's `StreamingResponse`. Use the model `claude-sonnet-4-6`. Load the API key from an environment variable called `ANTHROPIC_API_KEY` — never hardcode it."

**3.4 — Chat panel component**
> "Create `src/simulations/momentum/ChatPanel.jsx`. Display a scrollable message log, a text input, and a Send button. On send, POST to `/api/chat` with the message and current sim_state from props. Stream the response into the message log token by token. Show a subtle loading indicator while waiting for the first token. Add a visible disclaimer below the input: 'AI responses are grounded in reviewed content. Always verify against your syllabus.' Style it in the instrument register."

Verify: ask "why does momentum conserve?", get a streamed response. Ask "I have m1=2 and v1=3, what is the momentum?" — response should reference the actual values. Commit.

---

## Phase 4 — Curriculum Navigation
**Goal:** Students can navigate between AP and IB tracks and see the full simulation library.  
**Time estimate:** 2–3 days  
**Done when:** AP and IB curriculum maps exist with momentum linked, other simulations shown as coming soon.

### Steps

**4.1 — React Router setup**
> "Set up React Router in `src/App.jsx`. Add routes for: `/` (Landing), `/ap` (AP curriculum map), `/ib` (IB curriculum map), `/sim/momentum` (momentum simulation page). Use the existing SimulationPage for the momentum route."

**4.2 — Curriculum map page**
> "Create `src/pages/CurriculumMap.jsx`. Accept a prop for the track (AP or IB). Display units as sections. Within each unit, show simulation cards. Available simulations link to their page. Unavailable simulations are greyed out with a 'coming soon' label — never hidden. Use the editorial visual register. For AP, show: AP Physics 1 (with Momentum & Impulse available, Projectile Motion and Newton's Second Law coming soon), AP Physics 2, AP-C Mechanics, AP-C E&M all coming soon."

**4.3 — Basic landing page shell**
> "Create `src/pages/Landing.jsx`. For now: header with placeholder logo, Donate button, Sign In/Up button. Below that, a placeholder hero section with a neutral background and the text 'Simulations loading soon' centred. Below that, two large buttons: AP and IB, linking to their curriculum maps. Below that, a footer with both founders' names, one-liner each, and the text 'Built by two students from the UAE — for students everywhere. Best experienced on desktop.' Use the editorial register."

Verify: navigation works end to end — land on landing, click AP, see curriculum map, click momentum, enter simulation. Commit.

---

## Phase 5 — Second and Third Simulations
**Goal:** Projectile motion and Newton's Second Law added, same pattern as momentum.  
**Time estimate:** 5–7 days  
**Done when:** Both simulations are physics-accurate, content is Peter-reviewed, AI tutor is wired up for each.

Follow the same pattern as Phases 1–3 for each simulation. The infrastructure is already built — you are reusing it, not rebuilding it.

For each new simulation, create:
- `src/simulations/[topic]/[Topic]Canvas.jsx`
- `src/simulations/[topic]/physics.js`
- `src/simulations/[topic]/Controls.jsx`
- `src/simulations/[topic]/Readout.jsx`
- `src/simulations/[topic]/ContentPanel.jsx`
- `src/simulations/[topic]/ChatPanel.jsx` (can reuse momentum's, parameterised)
- `backend/prompts/[topic].txt`

---

## Phase 6 — Landing Page (Cinematic)
**Goal:** The real landing page — live simulation previews running in the background, animated intro sequence.  
**Time estimate:** 5–7 days  
**Done when:** A student lands on the page and sees physics happening before reading a word.

**Only build this after Phase 5 is complete.** The hero needs real simulations to show.

**6.1 — Replace placeholder hero with live canvas previews**
Mini versions of 3–4 simulations running simultaneously in the background. Reduced to decorative — no sliders, no interaction, just the physics animating.

**6.2 — GSAP animation sequence**
The opening: blank page → a ball launches → slows → its physics labels itself (path arc, velocity vector, acceleration vector, variable values appearing). Timed with GSAP timeline.

**6.3 — Founders photo and footer**
Add the real founders photo to `public/founders/`. Write real one-liner bios. Finalise the footer text.

**6.4 — Polish pass**
React Bits components for text reveals on scroll (editorial sections only, never inside simulations). Typography refinement. Spacing consistency pass. Transition from editorial → instrument register fully polished.

---

## Phase 7 — Pre-launch
**Goal:** The site is ready for Peter and then the wider UAE physics teacher community.  
**Time estimate:** 2–3 days

- Deploy frontend to Vercel (connect GitHub repo, automatic)
- Deploy backend to Railway (connect GitHub repo, set `ANTHROPIC_API_KEY` env variable)
- Test the full user journey end to end on a real browser, not localhost
- Send to Peter for final review
- Add error reporting tab on each simulation page (simple form, emails you directly)
- Decide the real name, update everywhere
- Send the link

---

## Commit discipline

Every working state gets a commit. No exceptions.

```bash
# After every phase step that works:
git add .
git commit -m "phase X.Y: [what you just built]"

# Before any risky change:
git checkout -b experiment/[what-you're-trying]
# If it works: merge back
# If it breaks: git checkout main, start again
```

---

## When school starts

If the project isn't finished when September arrives — and there's a real chance it won't be — the rule is:

**Alive but paused is not the same as dead.**

Keep what's live, live. Don't take it down. Don't add new simulations during term if you don't have time. Come back to it in the next break. A working momentum simulation with a live URL and Peter's name on it is a real thing that helps real students. That is not failure.

---

## The one metric that matters

**A live public URL before school starts.**  
Everything else is secondary to that.
