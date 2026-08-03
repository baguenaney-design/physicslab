import { forwardRef, useImperativeHandle, useRef } from 'react'
import { inelasticCollision, kineticEnergy } from './physics.js'

// All three bars share one scale so Block A, Block B and the total stay directly
// comparable against each other. The scale bounds every momentum this setup can
// reach, including after the blocks return off the walls and collide again.
//
// The starting momenta alone are not a valid scale: a block can leave a collision
// with more momentum than either block started with. For m1=2, u1=3, m2=3, u2=-1
// the largest starting magnitude is 6.00 kg·m/s, but Block B leaves the first
// collision at 3 * 2.2 = 6.60 and reaches 7.80 after later wall-mediated ones.
function scaleForSetup(massA, velocityA, massB, velocityB, mode) {
  const pTotal = Math.abs(massA * velocityA + massB * velocityB)

  // Perfectly inelastic: the blocks collide once, then travel as a single body
  // and only ever bounce off walls, which preserves speed. So the momenta below
  // are the complete set of values the readout can ever show.
  // test: m1=2, u1=3, m2=3, u2=-1 → v=0.6, max(6.00, 3.00, 1.20, 1.80, 3.00) = 6.00
  if (mode === 'inelastic') {
    const { v1f, v2f } = inelasticCollision(massA, velocityA, massB, velocityB)
    return Math.max(
      Math.abs(massA * velocityA),
      Math.abs(massB * velocityB),
      Math.abs(massA * v1f),
      Math.abs(massB * v2f),
      pTotal,
    )
  }

  // Elastic: blocks return off the walls and re-collide indefinitely, so the
  // scale must bound every collision rather than just the first. Both elastic
  // collisions and wall bounces conserve the system's kinetic energy, and by
  // Cauchy-Schwarz that caps every bar drawn here — either block, or the total:
  //   |p1 + p2| = sqrt(m1)*(sqrt(m1)*v1) + sqrt(m2)*(sqrt(m2)*v2)
  //             <= sqrt(m1+m2) * sqrt(m1*v1^2 + m2*v2^2)
  //             =  sqrt(2 * KE0 * (m1+m2))
  // Setting v2=0 shows this also dominates each block's own sqrt(2*m_i*KE0),
  // so it is the only term needed. The total needs covering separately from the
  // blocks because the walls apply an external impulse: once both blocks travel
  // the same way the total exceeds its starting value (3.00 -> 9.00 for the
  // case below), so the starting total is not an upper bound.
  // test: m1=2, u1=3, m2=3, u2=-1 → KE0=10.5, sqrt(2*10.5*5) = 10.25
  const ke0 = kineticEnergy(massA, velocityA) + kineticEnergy(massB, velocityB)
  return Math.sqrt(2 * ke0 * (massA + massB))
}

function setBar(barEl, valueEl, value, scale) {
  // scale is 0 only when both blocks start at rest — nothing to draw
  const pct = scale > 0 ? Math.min(Math.abs(value) / scale, 1) * 50 : 0 // half-track width max
  if (value >= 0) {
    barEl.style.left = '50%'
    barEl.style.width = `${pct}%`
  } else {
    barEl.style.left = `${50 - pct}%`
    barEl.style.width = `${pct}%`
  }
  valueEl.textContent = `${value.toFixed(2)} kg·m/s`
}

function BarRow({ label, color, barRef, valueRef }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ fontFamily: 'var(--instrument-body-font)', fontSize: '13px', color: 'var(--instrument-text)' }}>
          {label}
        </span>
        <span
          ref={valueRef}
          style={{ fontFamily: 'var(--instrument-data-font)', fontSize: '13px', color }}
        >
          0.00 kg·m/s
        </span>
      </div>
      <div
        style={{
          position: 'relative',
          height: '10px',
          background: 'var(--instrument-grid)',
          borderRadius: 'var(--radius-max)',
        }}
      >
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
        <div
          ref={barRef}
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: '50%',
            width: '0%',
            background: color,
            borderRadius: 'var(--radius-max)',
          }}
        />
      </div>
    </div>
  )
}

const Readout = forwardRef(function Readout({ massA, velocityA, massB, velocityB, mode }, ref) {
  const barARef = useRef(null)
  const valueARef = useRef(null)
  const barBRef = useRef(null)
  const valueBRef = useRef(null)
  const barTotalRef = useRef(null)
  const valueTotalRef = useRef(null)
  const keLossRowRef = useRef(null)
  const keLossValueRef = useRef(null)

  // recomputed whenever the sliders or mode change, so the bars rescale to the
  // current setup rather than to a fixed worst case
  const scale = scaleForSetup(massA, velocityA, massB, velocityB, mode)

  useImperativeHandle(
    ref,
    () => ({
      update({ momentumA, momentumB, totalMomentum, keLoss }) {
        setBar(barARef.current, valueARef.current, momentumA, scale)
        setBar(barBRef.current, valueBRef.current, momentumB, scale)
        setBar(barTotalRef.current, valueTotalRef.current, totalMomentum, scale)

        if (keLoss !== null && keLoss > 0) {
          keLossRowRef.current.style.display = 'block'
          keLossValueRef.current.textContent = `${keLoss.toFixed(2)} J`
        } else {
          keLossRowRef.current.style.display = 'none'
        }
      },
    }),
    [scale],
  )

  return (
    <div
      style={{
        padding: '16px',
        background: 'var(--instrument-panel)',
        borderTop: '1px solid var(--instrument-grid)',
      }}
    >
      <BarRow
        label="Momentum — Block A"
        color="var(--instrument-block-a)"
        barRef={barARef}
        valueRef={valueARef}
      />
      <BarRow
        label="Momentum — Block B"
        color="var(--instrument-block-b)"
        barRef={barBRef}
        valueRef={valueBRef}
      />
      <BarRow
        label="Total momentum"
        color="var(--instrument-phosphor-green)"
        barRef={barTotalRef}
        valueRef={valueTotalRef}
      />
      <div ref={keLossRowRef} style={{ display: 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span
            style={{
              fontFamily: 'var(--instrument-body-font)',
              fontSize: '13px',
              color: 'var(--instrument-block-b)',
            }}
          >
            KE lost (inelastic)
          </span>
          <span
            ref={keLossValueRef}
            style={{
              fontFamily: 'var(--instrument-data-font)',
              fontSize: '13px',
              color: 'var(--instrument-block-b)',
            }}
          >
            0.00 J
          </span>
        </div>
      </div>
    </div>
  )
})

export default Readout
