# PhysicsLab — Technical Design Document
**Version:** 0.1  
**Audience:** Founders + any future collaborators  
**Purpose:** How the system actually works under the hood

---

## 1. System Overview

```
┌─────────────────────────────────────────────────────────┐
│                        BROWSER                          │
│                                                         │
│   ┌─────────────────┐       ┌─────────────────────┐    │
│   │   React + Vite  │       │   HTML5 Canvas       │    │
│   │   (UI shell)    │◄─────►│   (simulation)       │    │
│   └────────┬────────┘       └─────────────────────┘    │
│            │                                            │
│            │  POST /api/chat                            │
│            │  {message, sim_state}                      │
└────────────┼────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────┐
│     FastAPI Backend         │
│     (Railway)               │
│                             │
│  1. Load system prompt      │
│  2. Inject sim_state        │
│  3. Call Claude API         │
│  4. Stream response back    │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│    Anthropic Claude API     │
│    claude-sonnet-4-6        │
└─────────────────────────────┘
```

---

## 2. Frontend Architecture

### 2.1 Routing structure

```
/                    → Landing.jsx
/ap                  → CurriculumMap.jsx (track="ap")
/ib                  → CurriculumMap.jsx (track="ib")
/sim/momentum        → SimulationPage.jsx (sim="momentum")
/sim/projectile      → SimulationPage.jsx (sim="projectile")
/sim/newtons-second  → SimulationPage.jsx (sim="newtons-second")
```

React Router handles all navigation. No full page reloads.

### 2.2 SimulationPage — the core layout

```
┌──────────────────────────────────────────────────────────┐
│  INSTRUMENT REGISTER — full page                         │
│                                                          │
│  ┌────────────────────────┐  ┌───────────────────────┐  │
│  │                        │  │  Readout panel        │  │
│  │   Canvas               │  │  (live bars +         │  │
│  │   (60% width)          │  │   numeric values)     │  │
│  │                        │  │                       │  │
│  │                        │  │  Content panel        │  │
│  │                        │  │  (summary, equations, │  │
│  │                        │  │   questions)          │  │
│  │                        │  │                       │  │
│  │                        │  │  AI Chat panel        │  │
│  │                        │  │  (input + log)        │  │
│  └────────────────────────┘  └───────────────────────┘  │
│  ┌────────────────────────┐                              │
│  │   Controls             │                              │
│  │   (sliders, toggles,   │                              │
│  │    launch/reset)       │                              │
│  └────────────────────────┘                              │
└──────────────────────────────────────────────────────────┘
```

### 2.3 State management

State lives in `SimulationPage.jsx` and flows down. No Redux or Zustand needed at this scale.

```js
// The sim state object — passed to canvas, readout, and chat
const [simState, setSimState] = useState({
  m1: 2.0,      // Block A mass (kg)
  v1: 3.0,      // Block A velocity (m/s)
  m2: 3.0,      // Block B mass (kg)
  v2: -1.0,     // Block B velocity (m/s)
  mode: 'elastic',        // 'elastic' | 'inelastic'
  running: false,         // animation active
  collided: false,        // post-collision state
  postV1: null,           // Block A velocity after collision
  postV2: null,           // Block B velocity after collision
  keLoss: 0,              // KE lost in inelastic collision (J)
});
```

This same object is sent verbatim to the backend on every AI chat message. The AI always knows exactly what the student is looking at.

### 2.4 Canvas rendering pattern

Each simulation follows this pattern:

```js
// MomentumCanvas.jsx
const canvasRef = useRef(null);
const animRef = useRef(null);
const stateRef = useRef(simState); // avoid stale closure in RAF

useEffect(() => {
  stateRef.current = simState;
}, [simState]);

useEffect(() => {
  const canvas = canvasRef.current;
  const ctx = canvas.getContext('2d');
  
  function draw(timestamp) {
    // 1. Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // 2. Update physics state
    // 3. Draw track
    // 4. Draw blocks
    // 5. Draw vectors (if toggled)
    // 6. Next frame
    animRef.current = requestAnimationFrame(draw);
  }
  
  animRef.current = requestAnimationFrame(draw);
  return () => cancelAnimationFrame(animRef.current);
}, []); // only mount/unmount
```

Physics calculations are **never in the canvas component**. They live in `physics.js` and are called from the canvas component. Separation of concerns — physics can be tested independently of rendering.

### 2.5 Physics module pattern

```js
// physics.js — pure functions, no side effects, no imports

/**
 * 1D elastic collision
 * v1f = ((m1-m2)*u1 + 2*m2*u2) / (m1+m2)
 * v2f = ((m2-m1)*u2 + 2*m1*u1) / (m1+m2)
 * 
 * Test: m1=2, u1=3, m2=3, u2=-1 → v1f=-1.8, v2f=2.2
 */
export function elasticCollision(m1, u1, m2, u2) {
  const v1f = ((m1 - m2) * u1 + 2 * m2 * u2) / (m1 + m2);
  const v2f = ((m2 - m1) * u2 + 2 * m1 * u1) / (m1 + m2);
  return { v1f, v2f };
}

/**
 * Perfectly inelastic collision (objects stick)
 * vf = (m1*u1 + m2*u2) / (m1+m2)
 */
export function inelasticCollision(m1, u1, m2, u2) {
  const vf = (m1 * u1 + m2 * u2) / (m1 + m2);
  return { v1f: vf, v2f: vf };
}

/**
 * Kinetic energy
 * KE = 0.5 * m * v^2
 */
export function kineticEnergy(m, v) {
  return 0.5 * m * v * v;
}
```

---

## 3. Backend Architecture

### 3.1 FastAPI app structure

```
backend/
├── main.py          ← app, routes, CORS
├── ai.py            ← Claude API call + streaming logic
├── prompts/
│   ├── momentum.txt
│   ├── projectile.txt
│   └── newtons-second.txt
└── requirements.txt
```

### 3.2 The /api/chat endpoint

```python
# main.py
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import anthropic
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://physicslab.vercel.app"],
    allow_methods=["POST"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str
    sim_state: dict
    simulation: str  # "momentum" | "projectile" | "newtons-second"

client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

@app.post("/api/chat")
async def chat(req: ChatRequest):
    system_prompt = load_prompt(req.simulation)
    user_message = format_message(req.sim_state, req.message)
    
    def stream():
        with client.messages.stream(
            model="claude-sonnet-4-6",
            max_tokens=1000,
            system=system_prompt,
            messages=[{"role": "user", "content": user_message}]
        ) as stream:
            for text in stream.text_stream:
                yield text
    
    return StreamingResponse(stream(), media_type="text/plain")
```

### 3.3 Message formatting

The sim_state is formatted into human-readable text before being sent to the model:

```python
def format_message(sim_state: dict, student_message: str) -> str:
    return f"""
Current simulation state:
- Block A: mass = {sim_state['m1']} kg, velocity = {sim_state['v1']} m/s
- Block B: mass = {sim_state['m2']} kg, velocity = {sim_state['v2']} m/s
- Collision mode: {sim_state['mode']}
- Momentum of A: {sim_state['m1'] * sim_state['v1']:.2f} kg·m/s
- Momentum of B: {sim_state['m2'] * sim_state['v2']:.2f} kg·m/s
- Total momentum: {sim_state['m1'] * sim_state['v1'] + sim_state['m2'] * sim_state['v2']:.2f} kg·m/s
{f"- KE lost in collision: {sim_state['keLoss']:.2f} J" if sim_state.get('keLoss') else ""}

Student's question:
{student_message}
"""
```

### 3.4 System prompt structure

Each `prompts/[topic].txt` file follows this structure:

```
ROLE
You are a physics tutor helping a student understand [topic]. 
The student is using an interactive simulation. Their current 
setup is described in every message.

GROUNDING CONTENT
[Full Peter-reviewed summary for this topic]

CURRICULUM CONTEXT
AP Physics 1 learning objectives: [list]
IB Physics assessment statements: [list]
IB command terms relevant to this topic: [definitions]
AP science practices: [list]

RESPONSE RULES
- Ground responses in the content provided above
- Reference the student's actual simulation values when relevant
- If a question falls outside this content, say so explicitly
- Guide reasoning with questions where possible
- Use IB command term conventions when explaining exam technique
- Flag uncertainty rather than guessing
```

---

## 4. Data Flow — Complete Picture

### Student asks a question

```
1. Student types in ChatPanel.jsx
2. ChatPanel reads simState from props
3. POST to /api/chat:
   {
     message: "why didn't Block A move much?",
     simulation: "momentum",
     sim_state: { m1: 2, v1: 3, m2: 5, v2: -1, mode: "elastic", ... }
   }
4. FastAPI loads prompts/momentum.txt
5. Formats sim_state into readable text
6. Calls Claude API with system prompt + formatted message
7. Streams response tokens back to frontend
8. ChatPanel appends tokens to message log in real time
```

### Student adjusts a slider

```
1. Slider onChange fires in Controls.jsx
2. setSimState() called in SimulationPage.jsx
3. New state flows down to:
   - MomentumCanvas.jsx (blocks resize, initial position updates)
   - Readout.jsx (momentum bars update instantly)
   - ChatPanel.jsx (simState prop updates — next message will include new values)
```

---

## 5. Design Token System

All colours, fonts, and spacing live in `src/styles/tokens.css`. Tailwind is configured to use these tokens. No hardcoded colour values anywhere in components.

```css
/* src/styles/tokens.css */
:root {
  /* Editorial register */
  --color-bg-editorial:      #F8F7F4;
  --color-text-primary:      #1A1A1A;
  --color-text-secondary:    #6B7280;
  --color-accent:            #2563EB;
  --color-border:            #E5E3DF;

  /* Instrument register */
  --color-bg-instrument:     #15171C;
  --color-bg-panel:          #1B1E25;
  --color-grid:              #2A2D35;
  --color-phosphor:          #7CFFB2;
  --color-block-a:           #6FA8FF;
  --color-block-b:           #FFB454;

  /* Typography */
  --font-body:               'Inter', sans-serif;
  --font-data:               'JetBrains Mono', monospace;

  /* Spacing scale */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;

  /* Borders */
  --radius-sm: 2px;
  --radius-md: 4px;   /* max allowed */
}
```

---

## 6. Deployment Architecture

```
GitHub repository
       │
       ├──► Vercel (automatic deploy on push to main)
       │     Frontend: React + Vite build
       │     URL: physicslab.vercel.app (temporary)
       │
       └──► Railway (automatic deploy on push to main)
             Backend: Python FastAPI
             Environment variable: ANTHROPIC_API_KEY (set in Railway dashboard)
             URL: physicslab-backend.railway.app (internal)
```

### Environment variables

**Frontend (.env.local — never commit this):**
```
VITE_API_URL=http://localhost:8000    # local development
```

**Frontend (Vercel dashboard — production):**
```
VITE_API_URL=https://physicslab-backend.railway.app
```

**Backend (Railway dashboard — never in code):**
```
ANTHROPIC_API_KEY=sk-ant-...
```

---

## 7. Simulation-Specific Physics Notes

### 7.1 Momentum & Impulse

**Key formulae:**
```
p = mv
Σp_initial = Σp_final (closed system)

Elastic: v1f = ((m1-m2)u1 + 2m2·u2) / (m1+m2)
         v2f = ((m2-m1)u2 + 2m1·u1) / (m1+m2)

Inelastic: vf = (m1·u1 + m2·u2) / (m1+m2)

KE = ½mv²
ΔKE = KE_after - KE_before (negative in inelastic)
```

**Known test cases:**
```
Elastic:   m1=2, u1=3, m2=3, u2=-1  → v1f=-1.8,  v2f=2.2
Elastic:   m1=m2,      u2=0          → v1f=0,      v2f=u1  (velocities exchange)
Inelastic: m1=2, u1=3, m2=3, u2=-1  → vf=0.6
```

**Canvas coordinate system:**
- World x=0 maps to canvas center
- Positive x = right, negative x = left
- PIXELS_PER_METER constant converts world units to pixels
- Block size scales with mass for visual intuition

### 7.2 Projectile Motion (planned)

**Key formulae:**
```
x(t) = x0 + v0·cos(θ)·t
y(t) = y0 + v0·sin(θ)·t - ½g·t²
vx = v0·cos(θ)           (constant)
vy(t) = v0·sin(θ) - g·t  (changes)
Range = v0²·sin(2θ) / g  (level ground)
```

**Variables to expose:**
- Launch speed (0–30 m/s)
- Launch angle (0–90°)
- Toggle: air resistance (none / low / high)
- g value (Earth 9.8, Moon 1.6, Mars 3.7)

### 7.3 Newton's Second Law (planned)

**Key formulae:**
```
ΣF = ma
F_net = F_applied - F_friction
F_friction = μ·N = μ·mg (on flat surface)
a = F_net / m
```

**Variables to expose:**
- Applied force
- Object mass
- Friction coefficient (μ) — 0 for frictionless, up to 0.8
- Surface type (visual only)

---

## 8. Error Handling

### Physics errors
- Division by zero: check (m1 + m2) > 0 before collision calculation
- NaN propagation: validate all slider inputs before passing to physics functions
- Floating point drift: round displayed values to 2 decimal places, but keep internal calculations at full precision

### API errors
```js
// Frontend chat call
try {
  const response = await fetch('/api/chat', { ... });
  if (!response.ok) {
    setChatError("Couldn't reach the tutor. Check your connection.");
    return;
  }
  // stream...
} catch (err) {
  setChatError("Something went wrong. Try again.");
}
```

```python
# Backend
@app.post("/api/chat")
async def chat(req: ChatRequest):
    try:
        # ... Claude API call
    except anthropic.APIError as e:
        raise HTTPException(status_code=502, detail="AI service unavailable")
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"No prompt found for {req.simulation}")
```

---

## 9. Testing Strategy

No formal test framework for v1. Testing is manual and comment-based.

**Physics unit tests — manual:**
For every physics function, paste the known test cases into the browser console on first implementation and verify:
```js
import { elasticCollision } from './physics.js';
console.assert(Math.abs(elasticCollision(2,3,3,-1).v1f - (-1.8)) < 0.001, 'elastic test 1 failed');
console.assert(Math.abs(elasticCollision(2,3,3,-1).v2f - 2.2) < 0.001, 'elastic test 2 failed');
```

**Integration tests — human:**
Before committing any simulation:
1. Run elastic collision with equal masses, one stationary → velocities should exchange
2. Run inelastic collision → blocks stick, KE loss appears
3. Total momentum before = total momentum after in elastic (check readout)
4. KE before > KE after in inelastic (check readout)

**Peter review:**
All simulation content reviewed by Peter before publishing. This is the academic equivalent of a test suite for the curriculum content.

---

## 10. Future Technical Considerations

### When accounts are added (Supabase)
- User table: id, email, created_at
- Progress table: user_id, simulation_slug, completed_at, questions_attempted
- Auth: Supabase built-in email/password + Google OAuth
- RLS (row-level security) enabled — users can only read their own progress

### When 3D is added (Phase 2+)
- Three.js via React Three Fiber
- Landing page hero only in v1
- Simulations upgrade to 3D only after 2D versions are stable and Peter-reviewed
- Camera control: OrbitControls for exploration, locked camera for clarity in exams

### If traffic grows and AI cost becomes an issue
- Rate limit: 10 AI messages per session (session = tab lifetime)
- Cache common question patterns (Redis on Railway)
- Apply for Anthropic educational credits
- The simulation works completely without the AI — it's an enhancement, not a dependency
