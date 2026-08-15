import MomentumCanvas from './MomentumCanvas'
import Controls from './Controls'
import Readout from './Readout'

// The Simulation view: track, live readout, controls. The readout floats over the canvas rather
// than sitting in a column beside it, so the track gets the full width of the view pane.
//
// Its width is fixed rather than content-sized: the momentum bars are drawn as percentages of
// their track, and a card that resized with the longest number would rescale the bars every time
// a value crossed a digit.
const READOUT_WIDTH = 300 // px
const READOUT_OFFSET = 16 // px inset from the canvas's top and right edges
const READOUT_CLEARANCE = 12 // px of track left visible between a settled block and the card

// What the canvas keeps clear on its right so a run never settles behind the card. Derived from
// the same constants the card is laid out with, so the two cannot drift apart.
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
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
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
        {/* live-data indicator — phosphor is correct here under CLAUDE.md's colour rule */}
        <span
          aria-hidden="true"
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: 'var(--instrument-phosphor-green)',
          }}
        />
      </div>
      <Readout ref={readoutRef} {...simState} />
    </div>
  )
}

function SimulationView({ simState, readoutRef, onFrame, onControlsChange }) {
  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      {/* anchors the readout card over the track */}
      <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        <MomentumCanvas {...simState} onFrame={onFrame} rightInset={READOUT_INSET} />
        <ReadoutCard readoutRef={readoutRef} simState={simState} />
      </div>
      <Controls {...simState} onChange={onControlsChange} />
    </div>
  )
}

export default SimulationView
