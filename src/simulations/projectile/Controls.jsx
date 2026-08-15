// The console strip beneath the trajectory. Same shape as momentum's Controls: a row of sliders
// with the value in the data font, then a row of mode buttons.
//
// Slider and toggleButtonStyle are deliberately duplicated from momentum/Controls.jsx rather than
// shared. They are twenty lines of layout that each simulation tunes to its own row — momentum
// fits four sliders across, this fits two and a selector — and hoisting them would produce a
// shared component with a prop for every difference.

// The three gravities the simulation can run under. Real values, not round numbers: a student
// should be able to check them against a data booklet.
//
// source: standard surface gravitational field strengths
//   Earth 9.8 — the value the AP formula sheet and IB data booklet both use for problems
//   Moon  1.6 — about 1/6 of Earth's, the figure quoted in every textbook treatment
//   Mars  3.7 — about 3/8 of Earth's
//
// Changing g rescales the whole flight: at v0=20, θ=45° the range is 40.82 m on Earth, 250.00 m
// on the Moon and 108.11 m on Mars. That 6× spread is the point of the control — it is also why
// ProjectileCanvas derives its scale per run rather than using a fixed pixels-per-metre.
export const GRAVITIES = [
  { id: 'earth', label: 'Earth', value: 9.8 },
  { id: 'moon', label: 'Moon', value: 1.6 },
  { id: 'mars', label: 'Mars', value: 3.7 },
]

function Slider({ label, value, min, max, step, unit, decimals, accentColor, onChange }) {
  return (
    // flex:1 with minWidth:0 lets the sliders share the control row evenly and keeps a long
    // label from widening its own column
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ fontFamily: 'var(--instrument-body-font)', fontSize: '13px', color: 'var(--instrument-text)' }}>
          {label}
        </span>
        <span style={{ fontFamily: 'var(--instrument-data-font)', fontSize: '13px', color: 'var(--instrument-text)' }}>
          {value.toFixed(decimals)} {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ width: '100%', accentColor }}
      />
    </div>
  )
}

function toggleButtonStyle(active) {
  return {
    fontFamily: 'var(--instrument-body-font)',
    fontSize: '13px',
    padding: '6px 16px',
    borderRadius: 'var(--radius-max)',
    border: active ? 'none' : '1px solid var(--instrument-grid)',
    background: active ? 'var(--instrument-phosphor-green)' : 'transparent',
    color: active ? 'var(--instrument-bg)' : 'var(--instrument-text)',
    cursor: 'pointer',
  }
}

function Controls({ launchSpeed, launchAngle, gravity, onChange }) {
  return (
    <div
      style={{
        padding: '16px',
        background: 'var(--instrument-panel)',
        borderTop: '1px solid var(--instrument-grid)',
      }}
    >
      {/* Two sliders rather than momentum's four, so they are held to half the row and left-
          aligned. Letting them fill the full width would put the launch-angle value most of a
          screen away from its own label. */}
      <div style={{ display: 'flex', gap: '24px', marginBottom: '16px' }}>
        <Slider
          label="Launch speed"
          value={launchSpeed}
          min={0}
          max={30}
          step={0.5}
          unit="m/s"
          decimals={1}
          accentColor="var(--instrument-block-a)"
          onChange={(v) => onChange({ launchSpeed: v })}
        />
        <Slider
          label="Launch angle"
          value={launchAngle}
          // Floored at 1°, not 0°. A ground-level launch at exactly 0° has a time of flight of
          // zero — correct physics for this model, but it makes Launch a dead button at the
          // bottom of the slider, which reads as a broken control rather than as a result. The
          // clamp is here in the UI and not in physics.js: the equations are right, it is the
          // affordance that was wrong. 1° still shows the shallow-launch case (T = 0.07 s at
          // 20 m/s on Earth) for a student who wants to see it.
          min={1}
          max={90}
          step={1}
          unit="°"
          // whole degrees — the slider steps by 1, so a decimal place would always read ".0"
          decimals={0}
          accentColor="var(--instrument-block-b)"
          onChange={(v) => onChange({ launchAngle: v })}
        />
        {/* the row is sized for four columns like momentum's; two sliders take half of it */}
        <div style={{ flex: 2, minWidth: 0 }} />
      </div>

      {/* A selector rather than a slider: these are three named worlds, not a continuum. A
          student dragging through 5.2 m/s² would be looking at a planet that does not exist. */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span
          style={{
            fontFamily: 'var(--instrument-body-font)',
            fontSize: '13px',
            color: 'var(--instrument-text)',
            marginRight: '8px',
          }}
        >
          Gravity
        </span>
        {GRAVITIES.map((g) => (
          <button
            key={g.id}
            type="button"
            onClick={() => onChange({ gravity: g.value })}
            style={toggleButtonStyle(gravity === g.value)}
          >
            {g.label}
            <span
              style={{
                fontFamily: 'var(--instrument-data-font)',
                fontSize: '12px',
                marginLeft: '8px',
                opacity: 0.75,
              }}
            >
              {g.value.toFixed(1)}
            </span>
          </button>
        ))}
        <span
          style={{
            fontFamily: 'var(--instrument-data-font)',
            fontSize: '12px',
            color: 'var(--instrument-text)',
            opacity: 0.45,
            marginLeft: '4px',
          }}
        >
          m/s²
        </span>
      </div>
    </div>
  )
}

export default Controls
