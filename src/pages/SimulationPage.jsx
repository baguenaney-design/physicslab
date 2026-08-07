import { useRef, useState } from 'react'
import MomentumCanvas from '../simulations/momentum/MomentumCanvas'
import Controls from '../simulations/momentum/Controls'
import Readout from '../simulations/momentum/Readout'
import ContentPanel from '../simulations/momentum/ContentPanel'

// Section label for the right column. Sections are named even while empty so the
// layout reads correctly before ChatPanel (phase 3) lands.
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

function SimulationPage() {
  const [simState, setSimState] = useState({
    massA: 2,
    velocityA: 3,
    massB: 3,
    velocityB: -1,
    mode: 'elastic',
  })
  const readoutRef = useRef(null)

  const handleControlsChange = (partial) => {
    setSimState((prev) => ({ ...prev, ...partial }))
  }

  // per-frame values bypass React state — the canvas pushes straight into the
  // readout's imperative handle so animation does not trigger re-renders
  const handleFrame = (frame) => {
    readoutRef.current?.update(frame)
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
      {/* Left: canvas (with its own Launch/Reset bar) above the controls */}
      <div style={{ flex: '0 0 60%', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div style={{ flex: 1, minHeight: 0 }}>
          <MomentumCanvas {...simState} onFrame={handleFrame} />
        </div>
        <Controls {...simState} onChange={handleControlsChange} />
      </div>

      {/* Right: live readout, then placeholders for phases 2 and 3 */}
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
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }} />
        </div>
      </div>
    </div>
  )
}

export default SimulationPage
