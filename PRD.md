# PhysicsLab — Product Requirements Document
**Version:** 0.2  
**Status:** Active Draft  
**Authors:** [Your Name] · Anay [Last Name]  
**Academic Reviewer:** Peter Syrenne — Accredited Physics & Chemistry Teacher  
**Last updated:** Summer 2025

---

## 1. The Problem

AP and IB physics students face a consistent and well-documented gap: they can follow a lecture, read a textbook, and watch a video — and still not understand why the physics works. They lack the ability to *touch* it. To break it. To ask "what happens if I double the mass?" and immediately see the answer.

Existing tools each solve part of this problem but none solve it completely:

| Tool | What it does well | What it misses |
|---|---|---|
| PhET Simulations | Best-in-class interactive simulations | No curriculum alignment, no attached content, no exam prep, no AI. Teachers spend class time finding separate worksheets that are often inaccurate to the model. |
| AP Classroom | Official AP content, practice questions | No simulations, no interactivity, no IB support |
| Kognity | IB-aligned textbook content | No simulations, no interactivity |
| Revision Village | Strong IB question bank | No simulations, purely passive |
| Generic AI (ChatGPT etc.) | Answers physics questions | Not curriculum-aware, not grounded in reviewed content, not context-aware of what the student is doing |

**The gap no one fills:** A simulation you can interact with, attached directly to curriculum-specific content written by people who have sat the exams, reviewed by a credentialed teacher, with an AI tutor grounded in that reviewed content and aware of exactly what the student is currently doing.

---

## 2. The Solution

PhysicsLab is a free, browser-based physics simulation platform built specifically for AP and IB students. It combines three things that have never been in the same place:

1. **Interactive simulations** — real physics, real variables, real consequences. Tweak a mass and watch momentum redistribute in real time.
2. **Attached curriculum content** — concept summaries, KaTeX-rendered equations, and exam-style practice questions written by people who have sat AP Physics 1, IB Physics SL/HL, and are currently self-studying AP Physics C — all reviewed by a named, accredited teacher.
3. **A grounded AI tutor** — context-aware (knows what the student is simulating and what variables they've set), and anchored to teacher-reviewed content so it reasons from a trusted foundation rather than generating physics explanations from scratch.

---

## 3. Users

### Primary — Students
- AP Physics 1, AP Physics 2, AP Physics C (Mechanics + E&M)
- IB Physics SL/HL Year 1 and Year 2
- Age: approximately 15–19
- Use case: self-directed exam preparation, concept reinforcement, homework support
- Key need: understand the *why*, then immediately connect it to how an exam question will ask about it
- Device: **desktop or laptop only** (explicitly not mobile — site will state this clearly)

### Secondary — Teachers
- Physics teachers evaluating the tool for student recommendation
- Need: trust that physics is accurate, AI does not contradict marking schemes, content is curriculum-aligned
- Primary entry point: Peter Syrenne (accredited physics and chemistry teacher) who serves as both first adopter and named academic reviewer

### Tertiary — Physics Departments
- Schools in the UAE and internationally considering adoption
- Need: a credible tool they can recommend without liability
- Satisfied by: Peter's name as reviewer, feedback/error reporting tab, explicit desktop-only note, no ads, no data harvesting

---

## 4. Differentiation — The Honest Version

After pressure-testing this idea, the genuine differentiation comes down to three things:

**1. Content attached to the simulation, not separate from it.**
PhET is excellent. But a teacher searching for a PhET worksheet spends class time, finds something 50% accurate to the model, and distributes it anyway. We eliminate this entirely — the summary and questions are part of the simulation page, written specifically for that simulation, reviewed before publishing.

**2. Written by students who have sat these exact exams.**
Not a generic curriculum writer. Not an AI. People who have personally navigated AP Physics 1, IB Physics SL/HL, and are actively sitting AP Physics C. The exam tips aren't theoretical — they're from lived experience.

**3. AI grounded in reviewed content.**
The AI tutor doesn't generate physics explanations from scratch. Every response is anchored to the Peter-reviewed summary for that topic, plus the current simulation state. This dramatically constrains hallucination risk and makes the AI defensible to teachers and department heads.

---

## 5. What We Are Not Building (v1)

These are explicitly out of scope for the first release. They are not abandoned — they are deferred.

- ❌ Mobile support (desktop only, stated clearly on the site)
- ❌ Student accounts and progress tracking (infrastructure exists via Supabase, not built until simulations are solid)
- ❌ Teacher dashboard or LMS integration
- ❌ EE/IA support (IB extended essay / internal assessment) — possibly later
- ❌ Chemistry, biology, or any subject beyond physics
- ❌ Offline / downloadable version
- ❌ CMS for content management
- ❌ Native mobile app

---

## 6. Curriculum Scope

### AP Track
- AP Physics 1 (primary focus, ships first)
- AP Physics 2 (secondary, overlaps with IB Y2)
- AP Physics C: Mechanics (self-study content)
- AP Physics C: E&M (self-study content)

### IB Track
- IB Physics Year 1
- IB Physics Year 2
- EE/IA support — **high emphasis on maybe**, deferred

### Simulation library — Phase 1 (ships first)
| Simulation | Curriculum coverage |
|---|---|
| Momentum & Impulse | AP Physics 1 Unit 4, IB Topic 2.4 |
| Projectile Motion | AP Physics 1 Unit 1, IB Topic 2.1 |
| Newton's Second Law | AP Physics 1 Unit 2, IB Topic 2.2 |

### Phase 2
- Conservation of Energy
- Circular Motion & Gravitation
- Simple Harmonic Motion

### Phase 3
- Coulomb's Law & Electric Fields
- Circuit Builder
- Electromagnetic Induction

### Phase 4
- Wave Interference
- Photoelectric Effect
- Radioactive Decay

---

## 7. Feature Specifications

### 7.1 Landing Page

**Header:** Logo/wordmark (left) · Donate button · Sign In/Up (right). Nothing else.

**Hero — live simulation previews:**  
Static placeholder PNGs of physics phenomena (kinematics, thermodynamics, gravitation, wave motion) during development. Replaced with live running simulations once they are built. This is the cinematic moment — students see physics happening before they read a word.

> **Decision made during review:** Physicist portraits were considered and rejected. Live simulations running in the background are a stronger argument for the site than decorative faces few students would recognise. Every visual element must do real work.

**Central CTA:** Two buttons — AP and IB. The fork in the road.

**"Desktop only" note:** A single quiet line. Not a warning, not a banner. Just honest expectation-setting.

**Footer:**
- Founders section: one photo, both full names, one-liner each
- "Built by two students from the UAE — for students everywhere"
- Note on continuing development through university
- Feedback / error reporting link

### 7.2 Curriculum Map

One page per track (AP / IB). Shows all units and simulations within them. Unavailable simulations are greyed out with "coming soon" — never hidden. Students should be able to see the full scope of what's coming, not just what exists today.

Editorial visual register throughout.

### 7.3 Simulation Page

The instrument visual register activates here. The transition from editorial → instrument must feel like entering a different environment.

**Layout:**
- Main canvas (left/center): the simulation
- Right panel: concept summary · KaTeX equations · practice questions tagged AP/IB · AI tutor chat
- Optional tab (select topics): "Beyond the Classroom" extension

**Simulation requirements:**
- Real-time variable controls (sliders)
- Live readout of conserved quantities (momentum, KE, etc.)
- Velocity / force vectors drawn on canvas, toggleable
- All physics calculations mathematically correct, commented with source formula
- Known input/output test case in comments on every complex calculation

**Content panel requirements:**
- Concept summary: written by founders, reviewed by Peter
- Equations: KaTeX only, notation matching AP formula sheet and IB data booklet
- Practice questions: minimum 3 per simulation — one AP FRQ style, one IB Paper 2 style, one conceptual. Tagged by type and difficulty.
- Exam tips: specific to this topic, from personal experience sitting these papers

**AI Tutor:**
- Every message sends: student's question + current simulation state (all variable values) + Peter-reviewed summary for this topic
- Model reasons *through* reviewed content, not from scratch
- Streamed responses (no waiting for full reply)
- Visible disclaimer: "AI responses are grounded in reviewed content but should be verified against your syllabus"
- Socratic mode planned for later: guides reasoning rather than giving answers directly

### 7.4 "Beyond the Classroom" Extensions

Optional tab on select simulation pages. For the curious student, the one writing an IA, or the one who wants to know why the model breaks down.

Examples:
- Ideal Gas Law → real gas behaviour, Van der Waals corrections
- Elastic collisions → relativistic momentum at high velocities
- Simple circuits → non-ideal components, internal resistance

Not every simulation gets one. Only where the extension is genuinely intellectually interesting and Peter has reviewed it.

### 7.5 Authentication (deferred)

Supabase for auth + database. Not built until simulations are complete and stable.

Signed-in users: progress tracked per simulation, resume where they left off.  
Signed-out users: full access to everything, no nags, no paywalls. Ever.

### 7.6 Donations

Single Stripe payment link. One button in the header. No banner, no guilt, no subscription. A student who wants to keep the AI running can contribute. No one who can't afford it is disadvantaged.

---

## 8. Content Quality & Accuracy

This is the most important non-technical requirement in the document.

**Review process:**
1. Founders write simulation summary + equations + practice questions
2. Peter Syrenne reviews for physics accuracy, curriculum alignment, and marking scheme conventions
3. Corrections made before publishing
4. Peter's name appears on the site as academic reviewer

**Error reporting:**
A dedicated feedback/error tab on every simulation page. Reports go directly to founders. Errors are fixed and logged. If a material error is found post-launch, the simulation is temporarily removed until corrected — not left live with a disclaimer.

**AI tutor grounding:**
The system prompt for every simulation's AI tutor includes:
- The full Peter-reviewed summary for that topic
- The current simulation state (all variable values, mode, etc.)
- The relevant AP and IB learning objectives
- IB command term definitions relevant to this topic
- AP science practice conventions
- An explicit instruction: reason from the provided content, flag if a question falls outside it

---

## 9. Visual Design Philosophy

### Two registers, never mixed

The site operates in two distinct visual modes. The transition between them is intentional and meaningful.

**Editorial register** (landing, nav, curriculum map, content panels):
Clean, typographically confident, like a well-designed academic journal. Warm off-white background, near-black text, mid-blue accent. Inter typeface throughout. No decoration, no fuss.

**Instrument register** (inside every simulation):
Dark graphite environment. Phosphor green for live data readouts only. JetBrains Mono for every number, label, and equation value. The feel of precision scientific equipment. No rounded corners, no shadows, no consumer-app softness.

The moment a student enters a simulation, the world changes. That transition is the product's signature moment.

### Rules that never break
- Max border-radius: 4px on all UI chrome
- No drop shadows on layout elements
- No colours invented outside the design token file
- No lorem ipsum — all text is real content before a page is built
- All equations rendered with KaTeX, never plain text
- "Desktop only" — no responsive breakpoints below 1024px

---

## 10. Success Metrics — v1

| Metric | Target |
|---|---|
| Live public URL | Before school starts, September 2025 |
| Simulations shipped | Minimum 1, target 3 |
| Teacher adoptions | Peter + at least 1 other UAE teacher |
| Physics accuracy errors reported | 0 on launch, fixed within 48h if found post-launch |
| Page load time | Under 3 seconds on a standard school network |
| AI tutor response | Streamed, first token under 1 second |
| Student feedback | ≥ 70% find AI tutor helpful in first survey |

---

## 11. The One Thing

Ship something publicly before school starts. One simulation, one summary, Peter's name on it, live URL. The moment it's real and other people can see it, the motivation to continue becomes external. That is more reliable than enthusiasm alone.

---

*This document is a living draft. It will be updated as the project develops. All physics content is subject to review by Peter Syrenne before publication.*
