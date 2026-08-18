// The console strip beneath the block. Same shape as momentum's and projectile's Controls: a row
// of sliders with the value in the data font, then a row of preset buttons.
//
// Slider and toggleButtonStyle are deliberately duplicated from projectile/Controls.jsx rather
// than shared — the reasoning recorded there carries over unchanged. They are twenty lines of
// layout each simulation tunes to its own row, and hoisting them would produce a shared component
// with a prop for every difference. This copy takes projectile's version, which carries the
// `decimals` prop momentum's lacks (the friction coefficients need two places), with `unit` made
// optional so a dimensionless coefficient does not render a trailing space.
//
// Every control here stays live while the block moves. That is the point of the simulation: the
// student drags the applied force up and watches the block break loose at the instant F crosses
// mu_s*N. Locking the parameters at Run, the way projectile locks at Launch, would make the
// breakaway unobservable except by resetting.

// The three surfaces the block can sit on. Real coefficient PAIRS, not decoration — the same
// convention as projectile's GRAVITIES, which carries real g values a student can check against a
// data booklet.
//
// source: standard textbook tables of dry-friction coefficients. mu is a property of a PAIR of
//         surfaces, not of one material, so each entry names both.
//   Ice on ice           0.10 / 0.03
//   Wood on wood         0.50 / 0.30  <- the reference case physics.js is verified against
//   Rubber on dry concrete is usually quoted near 1.0 / 0.8, which is above this simulation's 0.8
//   slider ceiling. It is entered at 0.80 / 0.70 — the grippiest pair the controls can express —
//   and is flagged here as clipped rather than passed off as the book value.
//
// Each preset sets BOTH coefficients, so the mu_k <= mu_s invariant below can never be broken by
// the preset row.
export const SURFACES = [
  { id: 'ice', label: 'Ice', muS: 0.1, muK: 0.03 },
  { id: 'wood', label: 'Wood', muS: 0.5, muK: 0.3 },
  { id: 'rubber', label: 'Rubber', muS: 0.8, muK: 0.7 },
]

// g is fixed. This simulation is about the free-body diagram and the static-to-kinetic transition,
// not about gravity — projectile is where g is a control. It is still displayed, because N = mg is
// unreadable without knowing which g produced it.
// source: AP Physics 1 formula sheet / IB data booklet value for Earth's surface
export const GRAVITY = 9.8

function Slider({ label, value, min, max, step, unit, decimals, accentColor, onChange }) {
  return (
    // flex:1 with minWidth:0 lets the four sliders share the control row evenly and keeps a long
    // label from widening its own column
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ fontFamily: 'var(--instrument-body-font)', fontSize: '13px', color: 'var(--instrument-text)' }}>
          {label}
        </span>
        <span style={{ fontFamily: 'var(--instrument-data-font)', fontSize: '13px', color: 'var(--instrument-text)' }}>
          {/* unit is optional: the friction coefficients are dimensionless, and "0.50 " with a
              trailing space reads as a value whose unit failed to load */}
          {value.toFixed(decimals)}{unit ? ` ${unit}` : ''}
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

function Controls({ appliedForce, mass, muS, muK, onChange }) {
  return (
    <div
      style={{
        padding: '16px',
        background: 'var(--instrument-panel)',
        borderTop: '1px solid var(--instrument-grid)',
      }}
    >
      {/* One row of four, momentum's geometry. The 24px gap is sized off the narrowest supported
          viewport: at 1024px each slider gets (1024 - 237 sidebar - 32 padding - 3 gaps) / 4, and
          this sim's widest label/value pair ("Kinetic friction mu_k" against "0.80") sits inside
          what that leaves. Widening the gap would wrap the labels. */}
      <div style={{ display: 'flex', gap: '24px', marginBottom: '16px' }}>
        <Slider
          label="Applied force"
          value={appliedForce}
          // Non-negative: one direction only. The block is always pushed in +x, so motion is always
          // in +x and the signed friction logic in physics.js is exercised without the on-screen
          // free-body diagram ever becoming ambiguous about which way "forward" is.
          min={0}
          max={30}
          step={0.5}
          unit="N"
          decimals={1}
          accentColor="var(--instrument-block-a)"
          onChange={(v) => onChange({ appliedForce: v })}
        />
        <Slider
          label="Block mass"
          value={mass}
          min={0.5}
          max={10}
          step={0.1}
          unit="kg"
          decimals={1}
          accentColor="var(--instrument-block-a)"
          onChange={(v) => onChange({ mass: v })}
        />
        <Slider
          label={
            <>
              Static friction μ<sub>s</sub>
            </>
          }
          value={muS}
          min={0}
          max={0.8}
          step={0.01}
          decimals={2}
          accentColor="var(--instrument-block-b)"
          // Lowering mu_s drags mu_k down with it rather than blocking the drag. See the note on
          // the mu_k slider below: the invariant is mu_k <= mu_s, and it has to hold from both
          // sides. onChange merges a partial into simState, so one call can set both.
          onChange={(v) => onChange({ muS: v, muK: Math.min(muK, v) })}
        />
        <Slider
          label={
            <>
              Kinetic friction μ<sub>k</sub>
            </>
          }
          value={muK}
          min={0}
          max={0.8}
          step={0.01}
          decimals={2}
          accentColor="var(--instrument-block-b)"
          // Clamped to <= mu_s. mu_k > mu_s is unphysical: it would make a block harder to keep
          // moving than to start moving, and would invert the drop in friction at breakaway that
          // this whole simulation exists to show. Clamped here in the UI rather than in physics.js
          // — the equations are correct for any coefficients handed to them; it is the control that
          // must not offer an impossible surface.
          onChange={(v) => onChange({ muK: Math.min(v, muS) })}
        />
      </div>

      {/* Presets rather than a second pair of sliders: these are three named surface pairs, not a
          continuum. Same affordance as projectile's gravity selector. */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span
          style={{
            fontFamily: 'var(--instrument-body-font)',
            fontSize: '13px',
            color: 'var(--instrument-text)',
            marginRight: '8px',
          }}
        >
          Surface
        </span>
        {SURFACES.map((surface) => (
          <button
            key={surface.id}
            type="button"
            onClick={() => onChange({ muS: surface.muS, muK: surface.muK })}
            // active only when BOTH coefficients still match — dragging either slider off the
            // preset must clear the highlight, or the row would claim a surface that is no longer
            // the one being simulated
            style={toggleButtonStyle(muS === surface.muS && muK === surface.muK)}
          >
            {surface.label}
            <span
              style={{
                fontFamily: 'var(--instrument-data-font)',
                fontSize: '12px',
                marginLeft: '8px',
                opacity: 0.75,
              }}
            >
              {surface.muS.toFixed(2)} / {surface.muK.toFixed(2)}
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
          μs / μk
        </span>

        {/* Not a control — a stated constant. Every normal force, and therefore every friction
            figure in the readout, is computed from this g. */}
        <span
          style={{
            fontFamily: 'var(--instrument-data-font)',
            fontSize: '12px',
            color: 'var(--instrument-text)',
            opacity: 0.45,
            marginLeft: 'auto',
          }}
        >
          g {GRAVITY.toFixed(2)} m/s²
        </span>
      </div>
    </div>
  )
}

export default Controls
