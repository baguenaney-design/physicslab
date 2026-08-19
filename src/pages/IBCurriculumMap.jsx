import EditorialShell from '../components/ui/EditorialShell'
import { CurriculumSection } from '../components/ui/TopicCard'

// IB Physics syllabus, first teaching 2023. A.1 and A.2 are the only topics
// with a simulation built; everything else is shown greyed rather than hidden
// so a student can see the whole roadmap.
//
// A.2 is ONE syllabus topic across TWO cards, because it is one syllabus topic
// with two simulations behind it — its forces half and its momentum half were
// built separately. TopicCard carries a single destination per card, so a second
// card is how both stay reachable, and the shared code 'A.2' is what says they
// are the same topic. Their titles must differ: CurriculumSection keys its cards
// on topic.title.
//
// Each topic is broader than the simulation behind it, so each simulation's
// sidebar eyebrow names the narrower scope on arrival — see the entries in
// src/simulations/registry.js.
//
// The `from=ib` query param is what the simulation page reads to render its
// back link — see SimulationPage.jsx.

const SECTIONS = [
  {
    heading: 'Section A — Space, time and motion',
    topics: [
      { code: 'A.1', title: 'Kinematics', to: '/sim/projectile?from=ib' },
      // DEMO: this card now opens the A.2 topic folder rather than a simulation directly — the
      // simulation is the folder's first item. The momentum card below still goes straight to its
      // simulation, so the two A.2 cards currently behave differently on purpose.
      { code: 'A.2', title: "Forces and momentum — Newton's second law", to: '/topic/a2', cta: 'Open topic →' },
      { code: 'A.2', title: 'Forces and momentum — momentum and impulse', to: '/sim/momentum?from=ib' },
      { code: 'A.3', title: 'Work, energy and power' },
      { code: 'A.4', title: 'Rigid body mechanics' },
      { code: 'A.5', title: 'Relativity' },
    ],
  },
  {
    heading: 'Section B — The particulate nature of matter',
    topics: [
      { code: 'B.1', title: 'Thermal energy transfers' },
      { code: 'B.2', title: 'Greenhouse effect' },
      { code: 'B.3', title: 'Gas laws' },
      { code: 'B.4', title: 'Thermodynamics' },
      { code: 'B.5', title: 'Current and circuits' },
    ],
  },
  {
    heading: 'Section C — Wave behaviour',
    topics: [
      { code: 'C.1', title: 'Simple harmonic motion' },
      { code: 'C.2', title: 'Wave model' },
      { code: 'C.3', title: 'Wave phenomena' },
      { code: 'C.4', title: 'Standing waves and resonance' },
      { code: 'C.5', title: 'Doppler effect' },
    ],
  },
  {
    heading: 'Section D — Fields',
    topics: [
      { code: 'D.1', title: 'Gravitational fields' },
      { code: 'D.2', title: 'Electric and magnetic fields' },
      { code: 'D.3', title: 'Motion in electromagnetic fields' },
      { code: 'D.4', title: 'Induction' },
    ],
  },
  {
    heading: 'Section E — Nuclear and quantum physics',
    topics: [
      { code: 'E.1', title: 'Structure of the atom' },
      { code: 'E.2', title: 'Quantum physics' },
      { code: 'E.3', title: 'Radioactive decay' },
      { code: 'E.4', title: 'Fission' },
      { code: 'E.5', title: 'Fusion and stars' },
    ],
  },
]

function IBCurriculumMap() {
  return (
    <EditorialShell>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 600, letterSpacing: '-0.02em', margin: '0 0 8px' }}>
          IB Physics
        </h1>
        <p
          style={{
            fontSize: '15px',
            color: 'var(--editorial-text-secondary)',
            margin: '0 0 40px',
            maxWidth: '620px',
          }}
        >
          The full syllabus, sections A through E. Three simulations are live so far — the rest are
          on the way.
        </p>

        {SECTIONS.map((section) => (
          <CurriculumSection key={section.heading} heading={section.heading} topics={section.topics} />
        ))}
      </div>
    </EditorialShell>
  )
}

export default IBCurriculumMap
