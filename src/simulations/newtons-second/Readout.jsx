import { forwardRef, useImperativeHandle, useRef } from 'react'
import { kineticFriction, maxStaticFriction, normalForce } from './physics.js'
import { GRAVITY } from './Controls.jsx'

// Two blocks of numbers, and the distinction between them is the point of the panel.
//
// LIVE — what the block is doing right now, pushed straight in from the canvas through the
// imperative handle below so that animating never re-renders React.
//
// PREDICTED — the two thresholds the current setup implies, computed here from the slider values.
// Deliberately not phosphor and deliberately visible before Run: a student should be able to read
// f_s,max off this panel, predict whether the push will move the block, and then run it and find
// out. That is the exercise.
//
// COLOUR CARRIES MEANING, and it is the same meaning as on the canvas: a row is the colour of its
// arrow in the free-body diagram — applied force block-a, friction block-b, normal the plain
// instrument text — and phosphor is reserved for the RESULTS those forces produce (state, net
// force, acceleration, velocity, displacement, time). Per CLAUDE.md, phosphor is live data only.
//
// Slider and bar helpers are duplicated from projectile/Readout.jsx rather than hoisted, the same
// convention recorded in projectile/Controls.jsx for Slider and toggleButtonStyle.

const ROW_LABEL = {
  fontFamily: 'var(--instrument-body-font)',
  fontSize: '13px',
  color: 'var(--instrument-text)',
}

function liveValueStyle(color) {
  return {
    fontFamily: 'var(--instrument-data-font)',
    fontSize: '13px',
    color,
  }
}

function setProgressBar(barEl, valueEl, value, ceiling, text) {
  const pct = ceiling > 0 ? Math.min(Math.abs(value) / ceiling, 1) * 100 : 0
  barEl.style.left = '0%'
  barEl.style.width = `${pct}%`
  valueEl.textContent = text
}

function setSignedBar(barEl, valueEl, value, scale, text) {
  const pct = scale > 0 ? Math.min(Math.abs(value) / scale, 1) * 50 : 0 // half-track max each way
  if (value >= 0) {
    barEl.style.left = '50%'
    barEl.style.width = `${pct}%`
  } else {
    barEl.style.left = `${50 - pct}%`
    barEl.style.width = `${pct}%`
  }
  valueEl.textContent = text
}

function BarRow({ label, color, barRef, valueRef, placeholder, centreMark }) {
  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={ROW_LABEL}>{label}</span>
        <span ref={valueRef} style={liveValueStyle(color)}>
          {placeholder}
        </span>
      </div>
      <div
        style={{
          position: 'relative',
          height: '8px',
          background: 'var(--instrument-grid)',
          borderRadius: 'var(--radius-max)',
        }}
      >
        {centreMark && (
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: 0,
              bottom: 0,
              width: '1px',
              background: 'var(--instrument-text)',
            }}
          />
        )}
        <div
          ref={barRef}
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: centreMark ? '50%' : '0%',
            width: '0%',
            background: color,
            borderRadius: 'var(--radius-max)',
          }}
        />
      </div>
    </div>
  )
}

// A live number with no bar — nothing meaningful to scale it against.
function ValueRow({ label, color, valueRef, placeholder }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
      <span style={ROW_LABEL}>{label}</span>
      <span ref={valueRef} style={liveValueStyle(color)}>
        {placeholder}
      </span>
    </div>
  )
}

// THE ROW THIS PANEL EXISTS FOR.
//
// The single most common student error in this topic is reading f_s = mu_s*N as an equality. It is
// not: below the threshold friction takes whatever value holds the block still, and mu_s*N is only
// the largest value it can take. So the state is not just a word — it carries a caption naming
// what friction is EQUAL TO right now, which changes from "the applied force" to "mu_k * N" at the
// moment the block breaks loose. A student watching the friction row while dragging the force
// slider sees the rule change under them.
function StateRow({ valueRef, captionRef }) {
  return (
    <div style={{ marginBottom: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={ROW_LABEL}>State</span>
        <span ref={valueRef} style={liveValueStyle('var(--instrument-phosphor-green)')}>
          STATIC
        </span>
      </div>
      <div
        ref={captionRef}
        style={{
          fontFamily: 'var(--instrument-data-font)',
          fontSize: '11px',
          color: 'var(--instrument-text)',
          opacity: 0.55,
          textAlign: 'right',
          marginTop: '2px',
        }}
      >
        friction = applied force
      </div>
    </div>
  )
}

// Predicted values re-render normally with the sliders — they change at human speed, not frame
// speed, so there is no reason to route them through the imperative handle.
function PredictedRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
      <span style={{ ...ROW_LABEL, opacity: 0.7 }}>{label}</span>
      <span
        style={{
          fontFamily: 'var(--instrument-data-font)',
          fontSize: '13px',
          color: 'var(--instrument-text)',
        }}
      >
        {value}
      </span>
    </div>
  )
}

function SectionLabel({ children, live }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontFamily: 'var(--instrument-data-font)',
        fontSize: '10px',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: 'var(--instrument-text)',
        opacity: 0.5,
        marginBottom: '10px',
      }}
    >
      {children}
      {live && (
        <span
          aria-hidden="true"
          style={{
            width: '5px',
            height: '5px',
            borderRadius: '50%',
            background: 'var(--instrument-phosphor-green)',
          }}
        />
      )}
    </div>
  )
}

const PHOSPHOR = 'var(--instrument-phosphor-green)'

const Readout = forwardRef(function Readout({ mass, muS, muK }, ref) {
  const stateRef = useRef(null)
  const stateCaptionRef = useRef(null)
  const appliedBarRef = useRef(null)
  const appliedRef = useRef(null)
  const frictionBarRef = useRef(null)
  const frictionRef = useRef(null)
  const normalRef = useRef(null)
  const netBarRef = useRef(null)
  const netRef = useRef(null)
  const accelBarRef = useRef(null)
  const accelRef = useRef(null)
  const velocityRef = useRef(null)
  const displacementRef = useRef(null)
  const elapsedRef = useRef(null)

  // The thresholds for the current setup. Taken from physics.js rather than written out here —
  // N = mg and mu*N are physics, and physics lives in physics.js.
  const normal = normalForce(mass, GRAVITY)
  const predictedMaxStatic = maxStaticFriction(muS, normal)
  const predictedKinetic = kineticFriction(muK, normal)

  // ONE SCALE FOR EVERY BAR ON THE PANEL, and it is f_s,max.
  //
  // Applied force and friction share it so their bars are directly comparable, which is the whole
  // lesson: below the threshold the two bars are IDENTICAL LENGTHS and grow together 1:1, and at
  // breakaway the applied bar fills the track while the friction bar visibly drops back to
  // mu_k/mu_s of it.
  //
  // The applied bar saturating above the threshold is the signal, not a defect — a full track
  // means "enough to move it" — and the mono value beside it always carries the exact magnitude.
  // Net force uses the same scale signed; acceleration uses it divided by the mass, so every bar
  // on the panel is the same physical scale.
  const forceScale = predictedMaxStatic
  const accelScale = mass > 0 ? predictedMaxStatic / mass : 0

  useImperativeHandle(
    ref,
    () => ({
      update({
        appliedForce,
        friction,
        netForce,
        acceleration,
        normal: liveNormal,
        velocity,
        position,
        elapsed,
        regime,
      }) {
        // THREE states, not two, because "MOVING" on a stationary block is a lie the student can
        // see. resolveDynamics returns the 'kinetic' regime the instant the applied force passes
        // f_s,max — correctly, since kinetic friction applies from that instant — but the block is
        // still at v = 0 until the next frame, and before Run it never moves at all. That instant
        // is this simulation's entire subject, so it gets named rather than mislabelled.
        const isStatic = regime === 'static'
        stateRef.current.textContent = isStatic ? 'STATIC' : velocity === 0 ? 'BREAKING AWAY' : 'MOVING'
        stateCaptionRef.current.textContent = isStatic ? 'friction = applied force' : 'friction = μk · N'

        setProgressBar(appliedBarRef.current, appliedRef.current, appliedForce, forceScale, `${appliedForce.toFixed(2)} N`)
        // Signed, so the row says which way friction is acting rather than only how hard.
        setProgressBar(frictionBarRef.current, frictionRef.current, friction, forceScale, `${friction.toFixed(2)} N`)
        normalRef.current.textContent = `${liveNormal.toFixed(2)} N`
        setSignedBar(netBarRef.current, netRef.current, netForce, forceScale, `${netForce.toFixed(2)} N`)
        setSignedBar(accelBarRef.current, accelRef.current, acceleration, accelScale, `${acceleration.toFixed(2)} m/s²`)
        velocityRef.current.textContent = `${velocity.toFixed(2)} m/s`
        displacementRef.current.textContent = `${position.toFixed(2)} m`
        elapsedRef.current.textContent = `${elapsed.toFixed(2)} s`
      },
    }),
    [forceScale, accelScale],
  )

  return (
    // Card chrome — border, radius, header — belongs to whatever mounts this, exactly as in the
    // momentum and projectile readouts.
    <div style={{ padding: '16px', background: 'var(--instrument-panel)' }}>
      <SectionLabel live>Live</SectionLabel>

      <StateRow valueRef={stateRef} captionRef={stateCaptionRef} />

      <BarRow
        label="Applied force"
        color="var(--instrument-block-a)"
        barRef={appliedBarRef}
        valueRef={appliedRef}
        placeholder="0.00 N"
      />
      <BarRow
        label="Friction force"
        color="var(--instrument-block-b)"
        barRef={frictionBarRef}
        valueRef={frictionRef}
        placeholder="0.00 N"
      />
      {/* No bar: N changes only when the mass slider moves, so there is nothing to scale it
          against. It is still a live row for the same reason projectile shows horizontal velocity
          live while noting it is constant for the whole flight. */}
      <ValueRow label="Normal force" color="var(--instrument-text)" valueRef={normalRef} placeholder="0.00 N" />
      <BarRow
        label="Net force"
        color={PHOSPHOR}
        barRef={netBarRef}
        valueRef={netRef}
        placeholder="0.00 N"
        centreMark
      />
      <BarRow
        label="Acceleration"
        color={PHOSPHOR}
        barRef={accelBarRef}
        valueRef={accelRef}
        placeholder="0.00 m/s²"
        centreMark
      />
      {/* Velocity and displacement have no honest ceiling — a block under a net force accelerates
          indefinitely — so neither gets a bar. */}
      <ValueRow label="Velocity" color={PHOSPHOR} valueRef={velocityRef} placeholder="0.00 m/s" />
      <ValueRow label="Displacement" color={PHOSPHOR} valueRef={displacementRef} placeholder="0.00 m" />
      <ValueRow label="Elapsed time" color={PHOSPHOR} valueRef={elapsedRef} placeholder="0.00 s" />

      <div
        style={{
          marginTop: '16px',
          paddingTop: '14px',
          borderTop: '1px solid var(--instrument-grid)',
        }}
      >
        <SectionLabel>Predicted for this setup</SectionLabel>
        {/* The two thresholds, so the behaviour can be predicted before Run rather than only
            observed after it. Their gap is why the block is harder to start than to keep going. */}
        <PredictedRow label="Max static friction" value={`${predictedMaxStatic.toFixed(2)} N`} />
        <PredictedRow label="Kinetic friction" value={`${predictedKinetic.toFixed(2)} N`} />
      </div>
    </div>
  )
})

export default Readout
