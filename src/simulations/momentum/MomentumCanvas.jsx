import { useEffect, useRef } from 'react'
import { elasticCollision, inelasticCollision, kineticEnergy } from './physics.js'

const BLOCK_A_START_X = 150
const BLOCK_B_START_X = 500

const PIXELS_PER_METER = 55 // scales m/s velocities to canvas px/s for animation

// The blocks run on an open track. Nothing acts on them from outside, so the two
// of them are an isolated system and total momentum is constant for the whole
// run — that is the claim the readout makes, and it has to hold on screen.
//
// The canvas edge is therefore the end of the run, not a wall. A wall would have
// to reverse a block, and reversing a block is an external impulse: the total
// momentum would visibly jump every time one was struck. Instead the first block
// to reach an edge settles the run — see startSettle below.
const EDGE_FREEZE_PX = 10 // gap at which the run starts settling
const SETTLE_SECONDS = 0.2 // wall-clock length of the settle
const AT_REST = 1e-9 // |v| in m/s below which a block counts as stopped

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
    running: false,
    finished: false, // true once the run has ended at an edge or come to rest
    settle: null, // set while the run is easing to its final stop
    keLoss: null,
  }
}

// Gap from a block's leading edge to the canvas edge it is heading for, and the
// time it still needs to cover that gap. Both are Infinity for a block at rest:
// it never arrives.
function approachToEdge(x, blockWidth, velocity, canvasWidth) {
  if (velocity === 0) return { gap: Infinity, time: Infinity }
  const gap = velocity > 0 ? canvasWidth - (x + blockWidth) : x
  return { gap, time: gap / (Math.abs(velocity) * PIXELS_PER_METER) }
}

// The settle is how the run ends on screen: rather than the blocks being cut off
// mid-frame, the last tEff seconds of travel are stretched over SETTLE_SECONDS of
// wall clock and eased to rest, leaving the leading block flush against the edge.
//
// It is presentation, not physics. Velocities are never touched, so every value
// the readout shows — both momenta and the total — stays exactly where the last
// collision left it. Nothing decelerates the blocks; the animation slows down.
//
// Both blocks share one normalised profile s(u) = 1 - (1-u)^n, so each position
// advances as though sim time ran forward by tEff * s(u). Their spacing therefore
// evolves exactly as it would at constant velocity, only slower, and no block can
// close on another that it was not already going to reach.
//
// n = duration / tEff makes ds/dt at u=0 match the speed the blocks were already
// travelling at, so the motion has no visible kink where the settle begins, then
// decays to rest at u=1. A block slow enough to need longer than SETTLE_SECONDS
// to cover its gap gets n = 1 — it simply coasts the rest of the way and stops.
function startSettle(sim, timestamp, tEff) {
  const duration = Math.max(SETTLE_SECONDS, tEff)
  sim.settle = {
    startTime: timestamp,
    duration,
    tEff,
    exponent: duration / tEff,
    x1: sim.x1,
    x2: sim.x2,
  }
}

function applySettle(sim, timestamp) {
  const { startTime, duration, tEff, exponent, x1, x2 } = sim.settle
  const u = Math.min((timestamp - startTime) / 1000 / duration, 1)
  const s = 1 - (1 - u) ** exponent

  sim.x1 = x1 + sim.v1 * PIXELS_PER_METER * tEff * s
  sim.x2 = x2 + sim.v2 * PIXELS_PER_METER * tEff * s

  if (u >= 1) {
    sim.running = false
    sim.finished = true
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
    const width = canvas.width
    const widthA = blockSizeForMass(massA)
    const widthB = blockSizeForMass(massB)

    if (sim.settle) {
      applySettle(sim, timestamp)
    } else {
      sim.x1 += sim.v1 * PIXELS_PER_METER * dt
      sim.x2 += sim.v2 * PIXELS_PER_METER * dt

      // collision: block A's right edge reaches block B's left edge.
      // Gated on the blocks actually closing (v1 > v2) rather than a one-shot
      // latch, so a contact that has already been resolved is not resolved
      // twice — after an elastic collision v1 < v2 and after an inelastic one
      // v1 === v2, so once the blocks have touched they can only separate.
      if (sim.v1 > sim.v2 && sim.x1 + widthA >= sim.x2) {
        sim.x2 = sim.x1 + widthA // snap to touching, no overlap
        const uBeforeA = sim.v1
        const uBeforeB = sim.v2
        const collide = mode === 'inelastic' ? inelasticCollision : elasticCollision
        const { v1f, v2f } = collide(massA, sim.v1, massB, sim.v2)
        sim.v1 = v1f
        sim.v2 = v2f

        if (mode === 'inelastic') {
          const keBefore = kineticEnergy(massA, uBeforeA) + kineticEnergy(massB, uBeforeB)
          const keAfter = kineticEnergy(massA, v1f) + kineticEnergy(massB, v2f)
          sim.keLoss = keBefore - keAfter
        }
      }

      const a = approachToEdge(sim.x1, widthA, sim.v1, width)
      const b = approachToEdge(sim.x2, widthB, sim.v2, width)

      if (Math.abs(sim.v1) < AT_REST && Math.abs(sim.v2) < AT_REST) {
        // nothing left to animate — either both blocks were launched at rest, or
        // an inelastic collision brought a zero-momentum system to a standstill
        sim.running = false
        sim.finished = true
      } else if (Math.min(a.gap, b.gap) <= EDGE_FREEZE_PX) {
        // The run ends at the first arrival, which is not always the block that
        // tripped the threshold: a faster block a little further out can still
        // reach its edge first. Folding in no more travel than the earliest
        // arrival is what keeps the other block from sliding off the canvas.
        const tEff = Math.min(a.time, b.time)

        if (tEff > 0) {
          startSettle(sim, timestamp, tEff)
        } else {
          // a long frame carried a block past its edge: rewind both by the
          // excess (tEff is negative here) so the leading one finishes flush
          sim.x1 += sim.v1 * PIXELS_PER_METER * tEff
          sim.x2 += sim.v2 * PIXELS_PER_METER * tEff
          sim.running = false
          sim.finished = true
        }
      }
    }

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
    if (simRef.current.running) return
    // a run that has already ended replays from the start, so Launch is never a
    // dead button once the blocks have settled against an edge
    if (simRef.current.finished) simRef.current = createInitialSimState(velocityA, velocityB)
    simRef.current.running = true
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
