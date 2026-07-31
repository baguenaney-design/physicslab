import { forwardRef, useImperativeHandle, useRef } from 'react'

const MAX_MOMENTUM = 48 // kg·m/s — max mass (6) * max velocity (8), used to scale bar fill

function setBar(barEl, valueEl, value) {
  const pct = Math.min(Math.abs(value) / MAX_MOMENTUM, 1) * 50 // half-track width max
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

const Readout = forwardRef(function Readout(_props, ref) {
  const barARef = useRef(null)
  const valueARef = useRef(null)
  const barBRef = useRef(null)
  const valueBRef = useRef(null)
  const barTotalRef = useRef(null)
  const valueTotalRef = useRef(null)
  const keLossRowRef = useRef(null)
  const keLossValueRef = useRef(null)

  useImperativeHandle(ref, () => ({
    update({ momentumA, momentumB, totalMomentum, keLoss }) {
      setBar(barARef.current, valueARef.current, momentumA)
      setBar(barBRef.current, valueBRef.current, momentumB)
      setBar(barTotalRef.current, valueTotalRef.current, totalMomentum)

      if (keLoss !== null && keLoss > 0) {
        keLossRowRef.current.style.display = 'block'
        keLossValueRef.current.textContent = `${keLoss.toFixed(2)} J`
      } else {
        keLossRowRef.current.style.display = 'none'
      }
    },
  }))

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
