import { useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import MomentumCanvas from '../simulations/momentum/MomentumCanvas'
import Controls from '../simulations/momentum/Controls'
import Readout from '../simulations/momentum/Readout'
import ContentPanel from '../simulations/momentum/ContentPanel'
import ChatPanel from '../simulations/momentum/ChatPanel'

// Section label for the right column.
function SectionLabel({ children }) {
  return (
    <div
      style={{
        fontFamily: 'var(--instrument-body-font)',
        fontSize: '11px',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: 'var(--instrument-text)',
        padding: '12px 16px',
        borderBottom: '1px solid var(--instrument-grid)',
      }}
    >
      {children}
    </div>
  )
}

// Where the student came from, carried in ?from= by the curriculum map links.
// A query param rather than router history state so the breadcrumb survives a
// refresh or a pasted link, both of which would leave state undefined.
const ORIGINS = {
  ib: { label: '← Back to IB', to: '/ib' },
  ap: { label: '← Back to AP', to: '/ap' },
}
const DEFAULT_ORIGIN = { label: '← Home', to: '/' }

// Instrument register — deliberately not phosphor green, which CLAUDE.md reserves
// for live data readouts and primary CTAs.
function Breadcrumb() {
  const [searchParams] = useSearchParams()
  const [hovered, setHovered] = useState(false)
  const origin = ORIGINS[searchParams.get('from')] ?? DEFAULT_ORIGIN

  return (
    <div
      style={{
        flex: '0 0 auto',
        padding: '10px 16px',
        borderBottom: '1px solid var(--instrument-grid)',
        background: 'var(--instrument-bg)',
      }}
    >
      <Link
        to={origin.to}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          fontFamily: 'var(--instrument-body-font)',
          fontSize: '12px',
          color: 'var(--instrument-text)',
          opacity: hovered ? 1 : 0.6,
          textDecoration: 'none',
        }}
      >
        {origin.label}
      </Link>
    </div>
  )
}

function SimulationPage() {
  const [simState, setSimState] = useState({
    massA: 2,
    velocityA: 3,
    massB: 3,
    velocityB: -1,
    mode: 'elastic',
  })
  const readoutRef = useRef(null)
  // latest frame, held in a ref for the same reason: ChatPanel reads it once per
  // message sent, so there is no reason to re-render on every frame for it
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

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100vw',
        height: '100vh',
        minWidth: '1024px', // desktop only — see CLAUDE.md design rules
        overflow: 'hidden',
        background: 'var(--instrument-bg)',
      }}
    >
      <Breadcrumb />

      <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
        {/* Left: canvas (with its own Launch/Reset bar) above the controls */}
        <div style={{ flex: '0 0 60%', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <div style={{ flex: 1, minHeight: 0 }}>
            <MomentumCanvas {...simState} onFrame={handleFrame} />
          </div>
          <Controls {...simState} onChange={handleControlsChange} />
        </div>

        {/* Right: live readout, concept content, AI tutor */}
        <div
          style={{
            flex: '0 0 40%',
            display: 'flex',
            flexDirection: 'column',
            minWidth: 0,
            borderLeft: '1px solid var(--instrument-grid)',
          }}
        >
          <Readout ref={readoutRef} {...simState} />

          <div
            style={{
              flex: 1,
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
              background: 'var(--instrument-panel)',
              borderTop: '1px solid var(--instrument-grid)',
            }}
          >
            <SectionLabel>Concept</SectionLabel>
            <ContentPanel />
          </div>

          <div
            style={{
              flex: 1,
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
              background: 'var(--instrument-panel)',
              borderTop: '1px solid var(--instrument-grid)',
            }}
          >
            <SectionLabel>AI Tutor</SectionLabel>
            <ChatPanel simState={simState} frameRef={frameRef} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default SimulationPage
