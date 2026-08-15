import ProjectileCanvas from './ProjectileCanvas'
import Controls from './Controls'
import Readout from './Readout'

// The Simulation view: trajectory, live readout, controls. Same layout as momentum's — the
// readout floats over the canvas rather than sitting in a column beside it, so the flight gets
// the full width of the view pane.
//
// The card is wider and taller than momentum's: it carries six live rows plus three predicted
// ones, and the widest pair ("Horizontal distance" against "562.50 m") does not fit in 300px.
const READOUT_WIDTH = 320 // px
const READOUT_OFFSET = 16 // px inset from the canvas's top and right edges
const READOUT_CLEARANCE = 12 // px of sky left visible between the card and the flight

// What the canvas keeps clear on its right so a trajectory never flies behind the card. Derived
// from the same constants the card is laid out with, so the two cannot drift apart.
const READOUT_INSET = READOUT_WIDTH + READOUT_OFFSET + READOUT_CLEARANCE

function ReadoutCard({ readoutRef, simState }) {
  return (
    <div
      style={{
        position: 'absolute',
        top: `${READOUT_OFFSET}px`,
        right: `${READOUT_OFFSET}px`,
        width: `${READOUT_WIDTH}px`,
        background: 'var(--instrument-panel)',
        border: '1px solid var(--instrument-grid)',
        borderRadius: 'var(--radius-max)',
      }}
    >
      <div
        style={{
          padding: '10px 16px',
          borderBottom: '1px solid var(--instrument-grid)',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--instrument-data-font)',
            fontSize: '11px',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--instrument-text)',
            opacity: 0.6,
          }}
        >
          Readout
        </span>
      </div>
      {/* The live indicator sits on the readout's own LIVE section label rather than on the card
          header, because half of this card is not live — the predicted block below the rule is
          computed from the sliders, not from the flight. */}
      <Readout ref={readoutRef} {...simState} />
    </div>
  )
}

function SimulationView({ simState, readoutRef, onFrame, onControlsChange }) {
  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      {/* anchors the readout card over the trajectory */}
      <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        <ProjectileCanvas {...simState} onFrame={onFrame} rightInset={READOUT_INSET} />
        <ReadoutCard readoutRef={readoutRef} simState={simState} />
      </div>
      <Controls {...simState} onChange={onControlsChange} />
    </div>
  )
}

export default SimulationView
