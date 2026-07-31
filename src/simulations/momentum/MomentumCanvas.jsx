import { useEffect, useRef } from 'react'
import { elasticCollision, inelasticCollision } from './physics.js'

const BLOCK_WIDTH = 60
const BLOCK_HEIGHT = 60
const BLOCK_A_START_X = 150
const BLOCK_B_START_X = 500

const PIXELS_PER_METER = 55 // scales m/s velocities to canvas px/s for animation

function createInitialSimState(velocityA, velocityB) {
  return {
    x1: BLOCK_A_START_X,
    x2: BLOCK_B_START_X,
    v1: velocityA,
    v2: velocityB,
    collided: false,
    running: false,
  }
}

function draw(ctx, width, height, x1, x2) {
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
  ctx.fillRect(x1, trackY - BLOCK_HEIGHT, BLOCK_WIDTH, BLOCK_HEIGHT)

  ctx.fillStyle = blockBColor
  ctx.fillRect(x2, trackY - BLOCK_HEIGHT, BLOCK_WIDTH, BLOCK_HEIGHT)
}

function MomentumCanvas({ massA = 2, velocityA = 3, massB = 3, velocityB = -1, mode = 'elastic' }) {
  const containerRef = useRef(null)
  const canvasRef = useRef(null)
  const simRef = useRef(createInitialSimState(velocityA, velocityB))
  const rafRef = useRef(null)
  const lastTimeRef = useRef(null)

  const redraw = () => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const sim = simRef.current
    draw(ctx, canvas.width, canvas.height, sim.x1, sim.x2)
  }

  const step = (timestamp) => {
    if (lastTimeRef.current === null) lastTimeRef.current = timestamp
    const dt = (timestamp - lastTimeRef.current) / 1000
    lastTimeRef.current = timestamp

    const sim = simRef.current
    sim.x1 += sim.v1 * PIXELS_PER_METER * dt
    sim.x2 += sim.v2 * PIXELS_PER_METER * dt

    // collision: block A's right edge reaches block B's left edge
    if (!sim.collided && sim.x1 + BLOCK_WIDTH >= sim.x2) {
      sim.x2 = sim.x1 + BLOCK_WIDTH // snap to touching, no overlap
      const collide = mode === 'inelastic' ? inelasticCollision : elasticCollision
      const { v1f, v2f } = collide(massA, sim.v1, massB, sim.v2)
      sim.v1 = v1f
      sim.v2 = v2f
      sim.collided = true
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

  // sliders only take effect before Launch — sync starting velocities while idle
  useEffect(() => {
    if (simRef.current.running) return
    simRef.current.v1 = velocityA
    simRef.current.v2 = velocityB
  }, [velocityA, velocityB])

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
