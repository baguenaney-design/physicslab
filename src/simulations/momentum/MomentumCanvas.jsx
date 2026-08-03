import { useEffect, useRef } from 'react'
import { elasticCollision, inelasticCollision, kineticEnergy } from './physics.js'

const BLOCK_A_START_X = 150
const BLOCK_B_START_X = 500

const PIXELS_PER_METER = 55 // scales m/s velocities to canvas px/s for animation

// block size scales with mass so heavier blocks read as visually heavier
function blockSizeForMass(mass) {
  return 40 + mass * 10
}

function createInitialSimState(velocityA, velocityB) {
  return {
    x1: BLOCK_A_START_X,
    x2: BLOCK_B_START_X,
    v1: velocityA,
    v2: velocityB,
    joined: false, // true once a perfectly inelastic collision has stuck the blocks together
    running: false,
    keLoss: null,
  }
}

// Wall bounce, modelled as an elastic collision with an immovable wall: the
// block keeps its speed and reverses direction.
// source: elastic collision v1f = ((m1-m2)*u1 + 2*m2*u2) / (m1+m2) with a
//         stationary wall (u2=0) as m2 → ∞ reduces to v1f = -u1
// test: block at x=-3 travelling at -2.0 m/s → x=0, v=+2.0 m/s
//
// NOTE: the wall exerts an external impulse on the two-block system, so the
// total momentum readout legitimately changes at every wall strike. Momentum
// is conserved only for the isolated system, i.e. between wall contacts.
function applyWalls(sim, width, widthA, widthB) {
  // after a perfectly inelastic collision the blocks are a single combined body,
  // so they must bounce off the wall together or they would drift apart
  if (sim.joined) {
    if (sim.x1 <= 0) {
      const overshoot = -sim.x1
      sim.x1 += overshoot
      sim.x2 += overshoot
      sim.v1 = -sim.v1
      sim.v2 = -sim.v2
    } else if (sim.x2 + widthB >= width) {
      const overshoot = sim.x2 + widthB - width
      sim.x1 -= overshoot
      sim.x2 -= overshoot
      sim.v1 = -sim.v1
      sim.v2 = -sim.v2
    }
    return
  }

  if (sim.x1 <= 0) {
    sim.x1 = 0
    sim.v1 = -sim.v1
  } else if (sim.x1 + widthA >= width) {
    sim.x1 = width - widthA
    sim.v1 = -sim.v1
  }

  if (sim.x2 <= 0) {
    sim.x2 = 0
    sim.v2 = -sim.v2
  } else if (sim.x2 + widthB >= width) {
    sim.x2 = width - widthB
    sim.v2 = -sim.v2
  }

  // The blocks are exactly touching straight after an elastic collision, so a
  // wall correction on one of them can shove it into the other. Push the
  // neighbour clear — the canvas is always wider than both blocks combined, so
  // one pass is enough. Velocities are untouched: if the pair is still closing,
  // the approach test resolves it as a normal collision on the next frame.
  if (sim.x1 + widthA > sim.x2) {
    if (sim.x2 + widthB >= width) {
      sim.x1 = sim.x2 - widthA // block B is pinned against the right wall
    } else {
      sim.x2 = sim.x1 + widthA
    }
  }
}

function draw(ctx, width, height, x1, x2, sizeA, sizeB) {
  const styles = getComputedStyle(document.documentElement)
  const bgColor = styles.getPropertyValue('--instrument-bg').trim()
  const gridColor = styles.getPropertyValue('--instrument-grid').trim()
  const blockAColor = styles.getPropertyValue('--instrument-block-a').trim()
  const blockBColor = styles.getPropertyValue('--instrument-block-b').trim()

  ctx.clearRect(0, 0, width, height)

  ctx.fillStyle = bgColor
  ctx.fillRect(0, 0, width, height)

  const trackY = height / 2
  ctx.strokeStyle = gridColor
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(0, trackY)
  ctx.lineTo(width, trackY)
  ctx.stroke()

  ctx.fillStyle = blockAColor
  ctx.fillRect(x1, trackY - sizeA, sizeA, sizeA)

  ctx.fillStyle = blockBColor
  ctx.fillRect(x2, trackY - sizeB, sizeB, sizeB)
}

function MomentumCanvas({
  massA = 2,
  velocityA = 3,
  massB = 3,
  velocityB = -1,
  mode = 'elastic',
  onFrame,
}) {
  const containerRef = useRef(null)
  const canvasRef = useRef(null)
  const simRef = useRef(createInitialSimState(velocityA, velocityB))
  const rafRef = useRef(null)
  const lastTimeRef = useRef(null)

  const redraw = () => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const sim = simRef.current
    draw(ctx, canvas.width, canvas.height, sim.x1, sim.x2, blockSizeForMass(massA), blockSizeForMass(massB))

    if (onFrame) {
      onFrame({
        momentumA: massA * sim.v1,
        momentumB: massB * sim.v2,
        totalMomentum: massA * sim.v1 + massB * sim.v2,
        keLoss: sim.keLoss,
      })
    }
  }

  const step = (timestamp) => {
    if (lastTimeRef.current === null) lastTimeRef.current = timestamp
    const dt = (timestamp - lastTimeRef.current) / 1000
    lastTimeRef.current = timestamp

    const sim = simRef.current
    const canvas = canvasRef.current
    const widthA = blockSizeForMass(massA)
    const widthB = blockSizeForMass(massB)
    sim.x1 += sim.v1 * PIXELS_PER_METER * dt
    sim.x2 += sim.v2 * PIXELS_PER_METER * dt

    // collision: block A's right edge reaches block B's left edge.
    // Gated on the blocks actually closing (v1 > v2) rather than a one-shot
    // latch, so blocks returning off the walls can collide again, while a
    // contact that has already been resolved is not resolved twice — after an
    // elastic collision v1 < v2 and after an inelastic one v1 === v2.
    if (sim.v1 > sim.v2 && sim.x1 + widthA >= sim.x2) {
      sim.x2 = sim.x1 + widthA // snap to touching, no overlap
      const uBeforeA = sim.v1
      const uBeforeB = sim.v2
      const collide = mode === 'inelastic' ? inelasticCollision : elasticCollision
      const { v1f, v2f } = collide(massA, sim.v1, massB, sim.v2)
      sim.v1 = v1f
      sim.v2 = v2f

      if (mode === 'inelastic') {
        sim.joined = true
        const keBefore = kineticEnergy(massA, uBeforeA) + kineticEnergy(massB, uBeforeB)
        const keAfter = kineticEnergy(massA, v1f) + kineticEnergy(massB, v2f)
        sim.keLoss = keBefore - keAfter
      }
    }

    applyWalls(sim, canvas.width, widthA, widthB)

    redraw()

    if (sim.running) {
      rafRef.current = requestAnimationFrame(step)
    }
  }

  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current

    const resize = () => {
      const { width, height } = container.getBoundingClientRect()
      canvas.width = width
      canvas.height = height
      redraw()
    }

    resize()

    const observer = new ResizeObserver(resize)
    observer.observe(container)

    return () => {
      observer.disconnect()
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  // sliders only take effect before Launch — sync starting velocities while idle.
  // Redraws so the readout reflects the new momenta and bar scale immediately.
  useEffect(() => {
    if (simRef.current.running) return
    simRef.current.v1 = velocityA
    simRef.current.v2 = velocityB
    redraw()
  }, [velocityA, velocityB])

  // block size reflects mass immediately, even before Launch
  useEffect(() => {
    if (simRef.current.running) return
    redraw()
  }, [massA, massB])

  const handleLaunch = () => {
    const sim = simRef.current
    if (sim.running) return
    sim.running = true
    lastTimeRef.current = null
    rafRef.current = requestAnimationFrame(step)
  }

  const handleReset = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    lastTimeRef.current = null
    simRef.current = createInitialSimState(velocityA, velocityB)
    redraw()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
      <div ref={containerRef} style={{ flex: 1, minHeight: 0 }}>
        <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
      </div>
      <div
        style={{
          display: 'flex',
          gap: '12px',
          padding: '12px',
          background: 'var(--instrument-panel)',
          borderTop: '1px solid var(--instrument-grid)',
        }}
      >
        <button
          type="button"
          onClick={handleLaunch}
          style={{
            fontFamily: 'var(--instrument-body-font)',
            fontSize: '14px',
            padding: '8px 20px',
            borderRadius: 'var(--radius-max)',
            border: 'none',
            background: 'var(--instrument-phosphor-green)',
            color: 'var(--instrument-bg)',
            cursor: 'pointer',
          }}
        >
          Launch
        </button>
        <button
          type="button"
          onClick={handleReset}
          style={{
            fontFamily: 'var(--instrument-body-font)',
            fontSize: '14px',
            padding: '8px 20px',
            borderRadius: 'var(--radius-max)',
            border: '1px solid var(--instrument-grid)',
            background: 'transparent',
            color: 'var(--instrument-text)',
            cursor: 'pointer',
          }}
        >
          Reset
        </button>
      </div>
    </div>
  )
}

export default MomentumCanvas
