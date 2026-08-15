import { forwardRef, useImperativeHandle, useRef } from 'react'
import { maxHeight, range, timeOfFlight, velocityAt } from './physics.js'

// Two blocks of numbers, and the distinction between them is the point of the panel.
//
// LIVE — what the projectile is doing right now, pushed straight in from the canvas through the
// imperative handle below so that animating never re-renders React. Phosphor, per CLAUDE.md.
//
// PREDICTED — what the closed-form equations say the current setup will produce, computed here
// from the slider values. Deliberately not phosphor and deliberately visible before launch: the
// student can read the prediction, run it, and watch the live numbers arrive at it. That is the
// whole exercise, and it is why the predicted block is not hidden until the flight ends.

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

// Bars are only drawn where a value has an honest ceiling to be read against. Height and distance
// do — their maxima are exactly the predicted max height and range, both of which the flight
// reaches — so those bars fill 0→1 over the run and are full at the moment of landing.
//
// vx has no bar: it is constant for the whole flight, so a bar would be a rectangle that never
// moves. vy gets a centre-anchored bar because it is signed — positive climbing, negative
// falling, through zero at the apex — and a 0→1 bar would hide the sign change that matters most.
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

const Readout = forwardRef(function Readout({ launchSpeed, launchAngle, gravity }, ref) {
  const vxRef = useRef(null)
  const vyBarRef = useRef(null)
  const vyRef = useRef(null)
  const speedRef = useRef(null)
  const heightBarRef = useRef(null)
  const heightRef = useRef(null)
  const distanceBarRef = useRef(null)
  const distanceRef = useRef(null)
  const elapsedRef = useRef(null)

  // The three closed-form predictions for the current setup. Recomputed on every slider change,
  // which is what makes the panel useful before Launch as well as during a run.
  const predictedRange = range(launchSpeed, launchAngle, gravity)
  const predictedHeight = maxHeight(launchSpeed, launchAngle, gravity)
  const predictedTime = timeOfFlight(launchSpeed, launchAngle, gravity)

  // vy runs from +v0·sinθ at launch to −v0·sinθ at landing, so the launch value is an exact
  // symmetric bound for the signed bar — it can never clip. Taken from velocityAt at t=0 rather
  // than written out here: v0·sinθ is physics, and physics lives in physics.js.
  const vyScale = Math.abs(velocityAt(launchSpeed, launchAngle, gravity, 0).vy)

  useImperativeHandle(
    ref,
    () => ({
      update({ vx, vy, speed: currentSpeed, x, y, elapsed }) {
        vxRef.current.textContent = `${vx.toFixed(2)} m/s`
        setSignedBar(vyBarRef.current, vyRef.current, vy, vyScale, `${vy.toFixed(2)} m/s`)
        speedRef.current.textContent = `${currentSpeed.toFixed(2)} m/s`
        setProgressBar(heightBarRef.current, heightRef.current, y, predictedHeight, `${y.toFixed(2)} m`)
        setProgressBar(distanceBarRef.current, distanceRef.current, x, predictedRange, `${x.toFixed(2)} m`)
        elapsedRef.current.textContent = `${elapsed.toFixed(2)} s`
      },
    }),
    [vyScale, predictedHeight, predictedRange],
  )

  return (
    // Card chrome — border, radius, header — belongs to whatever mounts this, exactly as in the
    // momentum readout.
    <div style={{ padding: '16px', background: 'var(--instrument-panel)' }}>
      <SectionLabel live>Live</SectionLabel>

      <ValueRow label="Horizontal velocity" color="var(--instrument-block-a)" valueRef={vxRef} placeholder="0.00 m/s" />
      <BarRow
        label="Vertical velocity"
        color="var(--instrument-block-b)"
        barRef={vyBarRef}
        valueRef={vyRef}
        placeholder="0.00 m/s"
        centreMark
      />
      <ValueRow label="Speed" color={PHOSPHOR} valueRef={speedRef} placeholder="0.00 m/s" />
      <BarRow label="Height" color={PHOSPHOR} barRef={heightBarRef} valueRef={heightRef} placeholder="0.00 m" />
      <BarRow
        label="Horizontal distance"
        color={PHOSPHOR}
        barRef={distanceBarRef}
        valueRef={distanceRef}
        placeholder="0.00 m"
      />
      <ValueRow label="Elapsed time" color={PHOSPHOR} valueRef={elapsedRef} placeholder="0.00 s" />

      <div
        style={{
          marginTop: '16px',
          paddingTop: '14px',
          borderTop: '1px solid var(--instrument-grid)',
        }}
      >
        <SectionLabel>Predicted for this setup</SectionLabel>
        <PredictedRow label="Range" value={`${predictedRange.toFixed(2)} m`} />
        <PredictedRow label="Max height" value={`${predictedHeight.toFixed(2)} m`} />
        <PredictedRow label="Time of flight" value={`${predictedTime.toFixed(3)} s`} />
      </div>
    </div>
  )
})

export default Readout
