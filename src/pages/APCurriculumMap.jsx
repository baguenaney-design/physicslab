import EditorialShell from '../components/ui/EditorialShell'
import { CurriculumSection } from '../components/ui/TopicCard'

// The four AP Physics courses. Kinematics and Linear Momentum in Physics 1 are
// the only topics with a simulation built; everything else is greyed rather
// than hidden. The same MECHANICS_UNITS list backs Physics C: Mechanics, which
// is passed no links — the simulations are pitched at the algebra-based course.
//
// Unit numbers are asserted only for Physics 1 and C: Mechanics, whose seven
// units are listed here in full. The Physics 2 and C: E&M entries are topic
// groupings rather than the official CED unit breakdown, so they carry no
// number — worth reconciling against the current CED before those go live.
//
// The `from=ap` query param is what the simulation page reads to render its
// back link — see SimulationPage.jsx.

const MECHANICS_UNITS = [
  'Kinematics',
  'Force and Translational Dynamics',
  'Work, Energy, and Power',
  'Linear Momentum',
  'Torque and Rotational Dynamics',
  'Energy and Momentum of Rotating Systems',
  'Oscillations',
]

const numbered = (titles, links = {}) =>
  titles.map((title, i) => ({ code: `Unit ${i + 1}`, title, to: links[title] }))

const unnumbered = (titles) => titles.map((title) => ({ title }))

const COURSES = [
  {
    heading: 'AP Physics 1',
    subheading: 'Algebra-based. Seven units.',
    // Kinematics links to the projectile simulation. The unit is broader than the simulation —
    // it also covers 1-D motion and motion graphs — so the simulation's sidebar eyebrow names
    // the narrower scope on arrival. See the projectile entry in src/simulations/registry.js.
    topics: numbered(MECHANICS_UNITS, {
      Kinematics: '/sim/projectile?from=ap',
      'Linear Momentum': '/sim/momentum?from=ap',
    }),
  },
  {
    heading: 'AP Physics 2',
    subheading: 'Algebra-based, second year.',
    topics: unnumbered(['Thermodynamics', 'Fluids', 'Electromagnetism', 'Optics', 'Modern Physics']),
  },
  {
    heading: 'AP Physics C: Mechanics',
    subheading: 'Calculus-based. Seven units.',
    topics: numbered(MECHANICS_UNITS),
  },
  {
    heading: 'AP Physics C: Electricity and Magnetism',
    subheading: 'Calculus-based.',
    topics: unnumbered([
      'Electrostatics',
      'Conductors and Capacitors',
      'Circuits',
      'Magnetic Fields',
      'Electromagnetism',
    ]),
  },
]

function APCurriculumMap() {
  return (
    <EditorialShell>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 600, letterSpacing: '-0.02em', margin: '0 0 8px' }}>
          AP Physics
        </h1>
        <p
          style={{
            fontSize: '15px',
            color: 'var(--editorial-text-secondary)',
            margin: '0 0 40px',
            maxWidth: '620px',
          }}
        >
          All four courses. Two simulations are live so far — the rest are on the way.
        </p>

        {COURSES.map((course) => (
          <CurriculumSection
            key={course.heading}
            heading={course.heading}
            subheading={course.subheading}
            topics={course.topics}
          />
        ))}
      </div>
    </EditorialShell>
  )
}

export default APCurriculumMap
