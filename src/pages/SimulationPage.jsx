import { useRef, useState } from 'react'
import { Navigate, useParams, useSearchParams } from 'react-router-dom'
import TopicSidebar from '../components/sim/TopicSidebar'
import ConceptPanel from '../components/sim/ConceptPanel'
import PracticePanel from '../components/sim/PracticePanel'
import ChatPanel from '../components/sim/ChatPanel'
import registry from '../simulations/registry.js'
import { countQuestions } from '../simulations/contentParser.js'

// The shell every simulation is rendered into. It owns the sidebar, the four-view switch and the
// Concept→Ask gate; everything topic-specific comes from src/simulations/registry.js, keyed by
// the :topic route param.

// Where the student came from, carried in ?from= by the curriculum map links.
// A query param rather than router history state so the breadcrumb survives a
// refresh or a pasted link, both of which would leave state undefined.
const ORIGINS = {
  ib: { label: '← Back to IB', to: '/ib' },
  ap: { label: '← Back to AP', to: '/ap' },
}
const DEFAULT_ORIGIN = { label: '← Home', to: '/' }
const DEFAULT_EYEBROW = 'Mechanics'

// The tutor is the one view that is earned. It opens once the student has been to Concept —
// the reviewed summary the tutor itself is grounded in, so the two are reading the same source.
// In-session only: no persistence until Supabase, which CLAUDE.md defers.
//
// The Practice sublabel is counted from the parsed content rather than written in, so it stays
// honest when a review adds or cuts a question. A topic whose question sets are all still
// pending counts zero — "0 questions" reads like a fault, so it says so in words instead.
function navItems(topic, questionCount, conceptSeen) {
  return [
    { id: 'simulation', label: 'Simulation', sublabel: topic.simulationSublabel },
    { id: 'concept', label: 'Concept', sublabel: 'Read the theory' },
    {
      id: 'practice',
      label: 'Practice',
      sublabel: questionCount > 0 ? `${questionCount} questions` : 'In drafting',
    },
    {
      id: 'ask',
      label: 'Ask',
      sublabel: conceptSeen ? 'Grounded tutor' : 'Locked',
      locked: !conceptSeen,
    },
  ]
}

function SimulationPage({ slug }) {
  const [searchParams] = useSearchParams()
  const from = searchParams.get('from')

  const topic = registry[slug]

  const [view, setView] = useState('simulation')
  const [conceptSeen, setConceptSeen] = useState(false)

  // Seeded from the registry entry, copied so a run's slider changes never write back into it.
  // `topic` is undefined for an unknown slug, which the redirect below handles — but hooks
  // cannot be called conditionally, so this has to stay legal on the render that redirects.
  // Spreading undefined is a no-op, which is exactly the empty state that render wants.
  const [simState, setSimState] = useState(() => ({ ...topic?.initialState }))
  const readoutRef = useRef(null)
  // latest frame, held in a ref for the same reason: ChatPanel reads it once per
  // message sent, so there is no reason to re-render on every frame for it.
  // Lives on the page rather than in the topic's SimulationView so it survives that view
  // unmounting — the tutor can still describe the run the student just watched.
  const frameRef = useRef(null)

  // A mistyped or retired slug lands somewhere real rather than on a blank shell.
  if (!topic) return <Navigate to="/" replace />

  const { SimulationView, content } = topic

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
        eyebrow={topic.eyebrows[from] ?? DEFAULT_EYEBROW}
        title={content.title}
        items={navItems(topic, countQuestions(content), conceptSeen)}
        activeId={view}
        onSelect={handleSelect}
      />

      {/* The four views are mutually exclusive: only the active one is mounted. Leaving
          Simulation therefore ends the current run — a topic's canvas cancels its own animation
          frame on unmount — and returning starts fresh. */}
      <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {view === 'simulation' && (
          <SimulationView
            simState={simState}
            readoutRef={readoutRef}
            onFrame={handleFrame}
            onControlsChange={handleControlsChange}
          />
        )}
        {view === 'concept' && <ConceptPanel content={content} />}
        {view === 'practice' && <PracticePanel content={content} topicName={topic.topicName} />}
        {view === 'ask' && (
          <ChatPanel
            simulation={topic.slug}
            simState={simState}
            frameRef={frameRef}
            buildSimState={topic.buildSimState}
            emptyHint={topic.emptyChatHint}
          />
        )}
      </main>
    </div>
  )
}

// All four views share one route, /sim/:topic, so React Router keeps the same SimulationPage
// mounted when only the param changes. Without a key, moving between two simulations would carry
// the previous topic's control values, view selection and Concept gate across — momentum's
// massA/velocityA sliders would still be sitting in projectile's state. Keying on the slug makes
// a topic change a remount, which is what it is.
function SimulationRoute() {
  const { topic: slug } = useParams()
  return <SimulationPage key={slug} slug={slug} />
}

export default SimulationRoute
