import momentumContent from './momentum/momentumContent.js'
import MomentumSimulationView from './momentum/SimulationView.jsx'
import projectileContent from './projectile/projectileContent.js'
import ProjectileSimulationView from './projectile/SimulationView.jsx'
import newtonsContent from './newtons-second/newtonsContent.js'
import NewtonsSimulationView from './newtons-second/SimulationView.jsx'
// g is fixed for the Newton's second law simulation and defined once, in its Controls. Imported
// rather than restated so the tutor and the control strip cannot disagree about which g produced N.
import { GRAVITY as NEWTONS_GRAVITY } from './newtons-second/Controls.jsx'

// Every simulation the site can route to, keyed by its URL slug (/sim/<slug>).
//
// SimulationPage is a shell: it owns the sidebar, the four-view switch, the Concept→Ask gate and
// the readout/frame refs, none of which differ between topics. Everything that does differ lives
// in an entry below, so adding a simulation means adding a key here rather than editing the page.
//
// Only `SimulationView` is a topic-specific component. Concept and Practice are shared and take
// their parsed content as a prop; Ask is the shared ChatPanel, which takes `buildSimState` from
// the entry because each topic reports a different state shape to the tutor.
//
// A note on `eyebrows`: the two curricula number the same physics differently, and the map card
// a student arrives from is sometimes broader than the simulation behind it. Projectile motion
// is not its own unit in either syllabus — it sits inside AP Physics 1 Unit 1 and IB A.1, both
// titled "Kinematics" — so its eyebrow names the narrower scope the simulation actually covers.
// A student who came from one map is never shown the other's numbering.

const registry = {
  momentum: {
    slug: 'momentum',
    // The name as it reads mid-sentence in the Practice panel's in-drafting copy
    // ("...the AP free response set for momentum"). Lowercase for that reason; the display
    // title comes from the content file's `# ` heading.
    topicName: 'momentum',
    content: momentumContent,
    SimulationView: MomentumSimulationView,
    eyebrows: {
      // Names the whole topic, which was right while the IB map card for A.2 was this simulation.
      // Kept unchanged so bookmarked and pasted ?from=ib links still resolve.
      ib: 'IB Physics · Topic A.2',
      ap: 'AP Physics 1 · Unit 4',
      // Arriving from the A.2 topic folder, where this simulation is one item among several, so
      // the eyebrow names the narrower scope — the convention the other two entries follow.
      // Without this key the eyebrow falls back to DEFAULT_EYEBROW in SimulationPage.jsx.
      a2: 'IB Physics · A.2 — Momentum and Impulse',
    },
    // Shown in the Simulation nav item, under the label.
    simulationSublabel: 'Interactive track',
    emptyChatHint: 'Ask about the collision you are running — the tutor can see your current setup.',
    initialState: {
      massA: 2,
      velocityA: 3,
      massB: 3,
      velocityB: -1,
      mode: 'elastic',
    },
    // Key names match the ChatRequest docstring in backend/main.py — subscript notation, not the
    // frontend's massA/velocityA. v1/v2 are the velocities the student dialled in; post_v1/post_v2
    // are what the blocks are actually moving at, and are only meaningful once they have collided.
    buildSimState(simState, frame) {
      return {
        m1: simState.massA,
        v1: simState.velocityA,
        m2: simState.massB,
        v2: simState.velocityB,
        mode: simState.mode,
        collided: frame?.collided ?? false,
        post_v1: frame?.collided ? frame.v1 : null,
        post_v2: frame?.collided ? frame.v2 : null,
      }
    },
  },

  projectile: {
    slug: 'projectile',
    topicName: 'projectile motion',
    content: projectileContent,
    SimulationView: ProjectileSimulationView,
    // Projectile motion is not its own unit in either syllabus — it sits inside AP Physics 1
    // Unit 1 and IB A.1, both titled "Kinematics". The curriculum maps link those cards here, so
    // the eyebrow names the narrower scope the simulation actually covers; otherwise a student
    // arrives expecting the whole of kinematics.
    eyebrows: {
      ib: 'IB Physics · A.1 — Projectile Motion',
      ap: 'AP Physics 1 · Unit 1 — Projectile Motion',
      // Arriving from the A.1 topic folder, where this simulation is one item among several, so
      // the eyebrow names the narrower scope — the same convention the ib and ap keys follow and
      // the same key the other two entries carry for A.2. Only the back link differs.
      // Without this key the eyebrow falls back to DEFAULT_EYEBROW in SimulationPage.jsx.
      a1: 'IB Physics · A.1 — Projectile Motion',
    },
    simulationSublabel: 'Interactive trajectory',
    emptyChatHint: 'Ask about the launch you are running — the tutor can see your current setup.',
    initialState: {
      // The reference case physics.js is verified against: R=40.82 m, H=10.20 m, T=2.886 s.
      // A student who opens the page and presses Launch gets the canonical 45° parabola.
      launchSpeed: 20,
      launchAngle: 45,
      gravity: 9.8,
    },
    // Flat, unit-bearing names — the projectile prompt has no subscript convention to match the
    // way momentum's m1/v1 matches its two-block notation. See format_message in backend/main.py.
    buildSimState(simState, frame) {
      return {
        v0: simState.launchSpeed,
        angle_deg: simState.launchAngle,
        g: simState.gravity,
        launched: frame?.launched ?? false,
        in_flight: frame?.inFlight ?? false,
        // Null until the student has actually launched — before that there is no flight to
        // describe, and sending zeros would read to the tutor as a projectile sitting still
        // mid-simulation rather than one that has not been fired.
        elapsed_s: frame?.launched ? frame.elapsed : null,
        x_m: frame?.launched ? frame.x : null,
        y_m: frame?.launched ? frame.y : null,
        vx_ms: frame?.launched ? frame.vx : null,
        vy_ms: frame?.launched ? frame.vy : null,
        speed_ms: frame?.launched ? frame.speed : null,
      }
    },
  },

  'newtons-second': {
    slug: 'newtons-second',
    // Reads mid-sentence in the Practice panel's in-drafting copy ("...the AP free response set
    // for Newton's second law"), so lowercase after the proper noun. The display title comes from
    // the content file's `# ` heading.
    topicName: "Newton's second law",
    content: newtonsContent,
    SimulationView: NewtonsSimulationView,
    // AP Unit 2 and IB A.2 are both broader than this simulation — Unit 2 includes connected
    // systems and Atwood machines, A.2 includes equilibrium — and this sim is one block on a flat
    // surface. The eyebrow names the narrower scope actually covered, the projectile convention.
    // The ib eyebrow is carried even though no IB map card points here yet (A.2 links to momentum);
    // repointing it later needs no other change.
    eyebrows: {
      ib: "IB Physics · A.2 — Newton's Second Law",
      ap: "AP Physics 1 · Unit 2 — Friction & Newton's Second Law",
      // Arriving from the A.2 topic folder is still arriving from IB, so the eyebrow matches the
      // ib one; only the back link differs. Without this key the eyebrow would fall back to the
      // generic "Mechanics" — see DEFAULT_EYEBROW in SimulationPage.jsx.
      a2: "IB Physics · A.2 — Newton's Second Law",
    },
    simulationSublabel: 'Interactive free-body diagram',
    emptyChatHint: 'Ask about the block you are pushing — the tutor can see your current setup.',
    initialState: {
      // The reference case physics.js is verified against: N = 19.6, f_s,max = 9.8, f_k = 5.88,
      // and 12 > 9.8, so a student who opens the page and presses Run watches it break away at
      // a = 3.06 m/s².
      appliedForce: 12,
      mass: 2,
      muS: 0.5,
      muK: 0.3,
    },
    // Flat, unit-bearing names — this topic has no subscript convention to match the way momentum's
    // m1/v1 matches its two-block notation. See format_message in backend/main.py.
    buildSimState(simState, frame) {
      return {
        f_applied_n: simState.appliedForce,
        mass_kg: simState.mass,
        mu_s: simState.muS,
        mu_k: simState.muK,
        g_ms2: NEWTONS_GRAVITY,
        // Deliberately NOT sent: N, f_s,max, f_k and a. The prompt file tells the tutor to derive
        // them from the values above and show its working, and sending the answers would
        // contradict that instruction — the same reason the momentum and projectile mappers
        // withhold their derived quantities.
        //
        // Nothing here is gated on having started, unlike projectile's launched/in_flight fields.
        // A projectile that has not been fired has no flight to describe, but a block at rest with
        // friction holding it IS the physics — velocity 0 in the static regime is a real state, not
        // an absence of one. These fall back to null only when frame itself is null, which means
        // the student never opened the Simulation view at all.
        regime: frame?.regime ?? null,
        velocity_ms: frame?.velocity ?? null,
        displacement_m: frame?.position ?? null,
        elapsed_s: frame?.elapsed ?? null,
        running: frame?.running ?? false,
      }
    },
  },
}

export default registry
