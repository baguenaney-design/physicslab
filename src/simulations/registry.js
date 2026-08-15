import momentumContent from './momentum/momentumContent.js'
import MomentumSimulationView from './momentum/SimulationView.jsx'

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
      ib: 'IB Physics · Topic A.2',
      ap: 'AP Physics 1 · Unit 4',
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
}

export default registry
