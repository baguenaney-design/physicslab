import EditorialShell from '../components/ui/EditorialShell'
import { CurriculumSection } from '../components/ui/TopicCard'

// The four AP Physics courses. Kinematics, Force and Translational Dynamics,
// Work, Energy, and Power, and Linear Momentum in Physics 1 are the only topics
// that open; everything else is greyed rather than hidden. The same
// MECHANICS_UNITS list backs Physics C: Mechanics, which is passed no links —
// the simulations are pitched at the algebra-based course, so its Unit 2 still
// reads "Coming soon" even though Physics 1's now links.
//
// Two of those four open a TOPIC FOLDER rather than a simulation. Unit 1 and
// Unit 3 are each wider than what is built — Unit 1 has one simulation covering
// projectile motion only, Unit 3 has none at all — so they open the folder of
// their items, where the taught sections sit alongside whatever is interactive.
// The folders are numbered by IB code internally; ?from=ap is what makes them
// show AP numbering on arrival. See src/topics/topicRegistry.js.
//
// Unit numbers are asserted only for Physics 1 and C: Mechanics, whose seven
// units are listed here in full. The Physics 2 and C: E&M entries are topic
// groupings rather than the official CED unit breakdown, so they carry no
// number — worth reconciling against the current CED before those go live.
//
// The `from=ap` query param is what the folder and the simulation page read to
// render their back link and their code line — see src/topics/origins.js.

const MECHANICS_UNITS = [
  'Kinematics',
  'Force and Translational Dynamics',
  'Work, Energy, and Power',
  'Linear Momentum',
  'Torque and Rotational Dynamics',
  'Energy and Momentum of Rotating Systems',
  'Oscillations',
]

// A link value is either a path or a [path, cta] pair — the pair form is for a unit that opens a
// topic folder rather than a simulation, and needs TopicCard's call to action to say so.
const numbered = (titles, links = {}) =>
  titles.map((title, i) => {
    const link = links[title]
    const [to, cta] = Array.isArray(link) ? link : [link, undefined]
    return { code: `Unit ${i + 1}`, title, to, cta }
  })

const unnumbered = (titles) => titles.map((title) => ({ title }))

const COURSES = [
  {
    heading: 'AP Physics 1',
    subheading: 'Algebra-based. Seven units.',
    // Kinematics and Work, Energy, and Power open topic folders; Force and Translational
    // Dynamics and Linear Momentum still open their simulations directly. Every one of these
    // units is broader than the simulation behind it — Unit 1 also covers 1-D motion and motion
    // graphs, Unit 2 also covers connected systems, Atwood machines and inclined planes — so a
    // unit that opens a simulation names the narrower scope in that simulation's sidebar eyebrow
    // (see src/simulations/registry.js), and a unit that opens a folder shows the whole topic
    // instead. Unit 3 has no simulation at all, which is exactly why it gets a folder.
    topics: numbered(MECHANICS_UNITS, {
      Kinematics: ['/topic/a1?from=ap', 'Open topic →'],
      'Force and Translational Dynamics': '/sim/newtons-second?from=ap',
      'Work, Energy, and Power': ['/topic/a3?from=ap', 'Open topic →'],
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
          All four courses. Three simulations are live so far — the rest are on the way.
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
