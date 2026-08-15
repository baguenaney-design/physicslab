function Slider({ label, value, min, max, step, unit, accentColor, onChange }) {
  return (
    // flex:1 with minWidth:0 lets the four sliders share the control row evenly and keeps a long
    // label from widening its own column
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ fontFamily: 'var(--instrument-body-font)', fontSize: '13px', color: 'var(--instrument-text)' }}>
          {label}
        </span>
        <span style={{ fontFamily: 'var(--instrument-data-font)', fontSize: '13px', color: 'var(--instrument-text)' }}>
          {value.toFixed(1)} {unit}
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

function Controls({ massA, velocityA, massB, velocityB, mode, onChange }) {
  return (
    <div
      style={{
        padding: '16px',
        background: 'var(--instrument-panel)',
        borderTop: '1px solid var(--instrument-grid)',
      }}
    >
      {/* One row of four, beneath the track — the sliders read as a console strip rather than a
          column beside the canvas.
          The gap is sized off the narrowest supported viewport: at 1024px each slider gets
          (1024 - 237 sidebar - 32 padding - 3 gaps) / 4, and the widest label/value pair
          ("Block B velocity" against "-8.0 m/s") measures 159px. 24px gaps leave that ~12px of
          slack; 32px leaves 6px, which a font fallback would eat and wrap the label. */}
      <div style={{ display: 'flex', gap: '24px', marginBottom: '16px' }}>
        <Slider
          label="Block A mass"
          value={massA}
          min={0.5}
          max={6}
          step={0.1}
          unit="kg"
          accentColor="var(--instrument-block-a)"
          onChange={(v) => onChange({ massA: v })}
        />
        <Slider
          label="Block A velocity"
          value={velocityA}
          min={0}
          max={8}
          step={0.1}
          unit="m/s"
          accentColor="var(--instrument-block-a)"
          onChange={(v) => onChange({ velocityA: v })}
        />
        <Slider
          label="Block B mass"
          value={massB}
          min={0.5}
          max={6}
          step={0.1}
          unit="kg"
          accentColor="var(--instrument-block-b)"
          onChange={(v) => onChange({ massB: v })}
        />
        <Slider
          label="Block B velocity"
          value={velocityB}
          min={-8}
          max={0}
          step={0.1}
          unit="m/s"
          accentColor="var(--instrument-block-b)"
          onChange={(v) => onChange({ velocityB: v })}
        />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span
          style={{
            fontFamily: 'var(--instrument-body-font)',
            fontSize: '13px',
            color: 'var(--instrument-text)',
            marginRight: '8px',
          }}
        >
          Collision mode
        </span>
        <button
          type="button"
          onClick={() => onChange({ mode: 'elastic' })}
          style={toggleButtonStyle(mode === 'elastic')}
        >
          Elastic
        </button>
        <button
          type="button"
          onClick={() => onChange({ mode: 'inelastic' })}
          style={toggleButtonStyle(mode === 'inelastic')}
        >
          Inelastic
        </button>
      </div>
    </div>
  )
}

export default Controls
