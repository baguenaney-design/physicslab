import { useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import TopicSidebar from '../components/sim/TopicSidebar'
import SimulationView from '../simulations/momentum/SimulationView'
import ConceptPanel from '../simulations/momentum/ConceptPanel'
import PracticePanel from '../simulations/momentum/PracticePanel'
import ChatPanel from '../simulations/momentum/ChatPanel'
import content from '../simulations/momentum/momentumContent.js'

// Where the student came from, carried in ?from= by the curriculum map links.
// A query param rather than router history state so the breadcrumb survives a
// refresh or a pasted link, both of which would leave state undefined.
const ORIGINS = {
  ib: { label: '← Back to IB', to: '/ib' },
  ap: { label: '← Back to AP', to: '/ap' },
}
const DEFAULT_ORIGIN = { label: '← Home', to: '/' }

// The same param decides the eyebrow, because the two curricula number this topic differently:
// IB carries it as A.2 Forces and momentum (IBCurriculumMap.jsx), AP as Unit 4 Linear Momentum
// (APCurriculumMap.jsx). A student who arrived from one map should not be shown the other's
// numbering.
const EYEBROWS = {
  ib: 'IB Physics · Topic A.2',
  ap: 'AP Physics 1 · Unit 4',
}
const DEFAULT_EYEBROW = 'Mechanics'

// Counted from the parsed content rather than written in, so the sidebar stays honest when
// Peter's review adds or cuts a question.
const QUESTION_COUNT = content.questionGroups.reduce((total, group) => total + group.questions.length, 0)

// The tutor is the one view that is earned. It opens once the student has been to Concept —
// the reviewed summary the tutor itself is grounded in, so the two are reading the same source.
// In-session only: no persistence until Supabase, which CLAUDE.md defers.
function navItems(conceptSeen) {
  return [
    { id: 'simulation', label: 'Simulation', sublabel: 'Interactive track' },
    { id: 'concept', label: 'Concept', sublabel: 'Read the theory' },
    { id: 'practice', label: 'Practice', sublabel: `${QUESTION_COUNT} questions` },
    {
      id: 'ask',
      label: 'Ask',
      sublabel: conceptSeen ? 'Grounded tutor' : 'Locked',
      locked: !conceptSeen,
    },
  ]
}

function SimulationPage() {
  const [searchParams] = useSearchParams()
  const from = searchParams.get('from')

  const [view, setView] = useState('simulation')
  const [conceptSeen, setConceptSeen] = useState(false)

  const [simState, setSimState] = useState({
    massA: 2,
    velocityA: 3,
    massB: 3,
    velocityB: -1,
    mode: 'elastic',
  })
  const readoutRef = useRef(null)
  // latest frame, held in a ref for the same reason: ChatPanel reads it once per
  // message sent, so there is no reason to re-render on every frame for it.
  // Lives on the page rather than in SimulationView so it survives that view
  // unmounting — the tutor can still describe the run the student just watched.
  const frameRef = useRef(null)

  const handleControlsChange = (partial) => {
    setSimState((prev) => ({ ...prev, ...partial }))
  }

  // per-frame values bypass React state — the canvas pushes straight into the
  // readout's imperative handle so animation does not trigger re-renders
  const handleFrame = (frame) => {
    readoutRef.current?.update(frame)
    frameRef.current = frame
  }

  // One place decides what a selection means: the gate is checked here, and visiting Concept is
  // what lifts it. TopicSidebar renders the lock but does not enforce it.
  const handleSelect = (id) => {
    if (id === 'ask' && !conceptSeen) return
    if (id === 'concept') setConceptSeen(true)
    setView(id)
  }

  return (
    <div
      style={{
        display: 'flex',
        width: '100vw',
        height: '100vh',
        minWidth: '1024px', // desktop only — see CLAUDE.md design rules
        overflow: 'hidden',
        background: 'var(--instrument-bg)',
      }}
    >
      <TopicSidebar
        backLink={ORIGINS[from] ?? DEFAULT_ORIGIN}
        eyebrow={EYEBROWS[from] ?? DEFAULT_EYEBROW}
        title={content.title}
        items={navItems(conceptSeen)}
        activeId={view}
        onSelect={handleSelect}
      />

      {/* The four views are mutually exclusive: only the active one is mounted. Leaving
          Simulation therefore ends the current run — MomentumCanvas cancels its own animation
          frame on unmount — and returning starts from a fresh track. */}
      <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {view === 'simulation' && (
          <SimulationView
            simState={simState}
            readoutRef={readoutRef}
            onFrame={handleFrame}
            onControlsChange={handleControlsChange}
          />
        )}
        {view === 'concept' && <ConceptPanel />}
        {view === 'practice' && <PracticePanel />}
        {view === 'ask' && <ChatPanel simState={simState} frameRef={frameRef} />}
      </main>
    </div>
  )
}

export default SimulationPage
