import { useEffect, useRef, useState } from 'react'
import { maxHeight, positionAt, range, speed, timeOfFlight, velocityAt } from './physics.js'

// The trajectory view. Rendering only — every physical quantity on screen comes from physics.js.
// Nothing here computes a position, a velocity or a flight time; this file's job is turning
// metres into pixels and drawing them.
//
// Same architecture as MomentumCanvas: mutable per-frame state in simRef so animation never
// triggers a React render, the frame handle in rafRef, the clock in lastTimeRef, a ResizeObserver
// on the container, and cancellation on unmount.

// Canvas padding, in px. The bottom margin leaves room for the distance labels under the ground
// line; the top margin keeps the apex clear of the canvas edge.
const MARGIN_LEFT = 56
const MARGIN_RIGHT = 40
const MARGIN_TOP = 40
const MARGIN_BOTTOM = 44

// The smallest span, in metres, the view will scale to. Without it a run with no extent — θ=0
// gives R=0 and H=0 — would divide by zero and scale to infinity.
const MIN_WORLD_SPAN = 5

// Length in px of the resultant velocity arrow at launch. Velocity is not a length, so it cannot
// share the trajectory's metres-per-pixel scale; it gets its own, derived per run so that the
// arrow reads the same size whether the launch is 3 m/s or 30 m/s. Its components are then drawn
// at that same scale, which is what makes vx and vy visually comparable to each other.
const VECTOR_LAUNCH_PX = 64

const PROJECTILE_RADIUS = 6

// Largest simulated time a single frame may advance, in seconds — 1/30 s.
//
// The trace is sampled once per frame, so the drawn path is only as smooth as the frame rate. A
// browser that stops painting — a backgrounded tab throttles requestAnimationFrame to about 1 Hz,
// and a stalled main thread can do worse — hands back a dt of a second or more on the next frame.
// Unclamped, that single step can carry the projectile from launch to landing: the flight is
// missed entirely and the trace is left as a straight line between two points, which draws a
// parabola as though it were flat.
//
// Clamping means simulated time falls behind wall-clock time during a stall, and the flight
// finishes late. That is the right trade for a teaching simulation: the shape of the trajectory
// and the readout's elapsed time stay consistent with each other and with the equations, which is
// what the student is reading. A projectile that teleports is wrong in a way a projectile that
// runs slow is not.
const MAX_FRAME_DT = 1 / 30

// Nice round tick spacing for the distance axis — 1, 2, 5, 10, 20, 50, … metres, whichever gives
// roughly TARGET_TICKS divisions across the visible span. A raw span/8 would label the ground in
// steps of 5.1 m.
//
// test: span=40.82 → raw 5.10, magnitude 1,   normalised 5.10 → 10 m ticks (5 across the span)
// test: span=562.5 → raw 70.3, magnitude 10,  normalised 7.03 → 100 m ticks
// test: span=5     → raw 0.63, magnitude 0.1, normalised 6.25 → 1 m ticks
const TARGET_TICKS = 8
function niceTickStep(span) {
  const raw = span / TARGET_TICKS
  const magnitude = 10 ** Math.floor(Math.log10(raw))
  const normalised = raw / magnitude
  if (normalised <= 1) return magnitude
  if (normalised <= 2) return 2 * magnitude
  if (normalised <= 5) return 5 * magnitude
  return 10 * magnitude
}

// How many metres-per-pixel the view draws at, and where the world origin sits on the canvas.
//
// The scale is UNIFORM — one number for both axes, taken as the tighter of the two fits. A
// separate horizontal and vertical scale would stretch the parabola: a 45° launch would not leave
// the ground at 45°, and the apex would sit in the wrong place relative to the range. For a
// simulation a student is meant to read angles off, that would be a lie.
//
// Derived per run from the predicted range and height rather than fixed, because the span the
// controls can produce is enormous — 0 m at θ=0 up to 562.5 m at v0=30 on the Moon. MomentumCanvas
// can hold a fixed 55 px/m because its blocks always travel the same track; this cannot.
//
// test: canvas 1000x600, inset 0, R=40.82, H=10.20
//       availW = 1000-56-40 = 904, availH = 600-40-44 = 516
//       904/40.82 = 22.14 px/m ; 516/10.20 = 50.6 px/m → scale 22.14 (width-limited, as a
//       45° launch always is: its range is four times its height)
// test: same canvas, θ=90 → R=0, H=20.41
//       width falls back to the 5 m floor: 904/5 = 180.8 ; 516/20.41 = 25.3 → scale 25.3
//       (height-limited, so a vertical launch fills the view rather than vanishing)
function viewTransform(canvasWidth, canvasHeight, rightInset, worldRange, worldHeight) {
  const availableWidth = Math.max(canvasWidth - MARGIN_LEFT - MARGIN_RIGHT - rightInset, 1)
  const availableHeight = Math.max(canvasHeight - MARGIN_TOP - MARGIN_BOTTOM, 1)

  const spanX = Math.max(worldRange, MIN_WORLD_SPAN)
  const spanY = Math.max(worldHeight, MIN_WORLD_SPAN)

  const scale = Math.min(availableWidth / spanX, availableHeight / spanY)

  return {
    scale,
    originX: MARGIN_LEFT,
    groundY: canvasHeight - MARGIN_BOTTOM,
  }
}

function createInitialSimState() {
  return {
    t: 0, // seconds since launch
    running: false,
    finished: false,
    launched: false,
    // trajectory so far, in METRES. Stored in world units rather than pixels so a resize
    // re-projects the whole path instead of bending it.
    trace: [],
    // launch parameters, locked in at Launch. The sliders move freely mid-flight without
    // deforming a run that is already in the air — the same rule MomentumCanvas applies.
    params: null,
  }
}

// --- drawing helpers -------------------------------------------------------------------------

function arrow(ctx, fromX, fromY, toX, toY, color) {
  const dx = toX - fromX
  const dy = toY - fromY
  const length = Math.hypot(dx, dy)
  if (length < 1) return // too short to carry a head; drawing one would just make a blob

  const head = Math.min(8, length * 0.4)
  const angle = Math.atan2(dy, dx)

  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = 1.5

  ctx.beginPath()
  ctx.moveTo(fromX, fromY)
  ctx.lineTo(toX, toY)
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(toX, toY)
  ctx.lineTo(toX - head * Math.cos(angle - Math.PI / 6), toY - head * Math.sin(angle - Math.PI / 6))
  ctx.lineTo(toX - head * Math.cos(angle + Math.PI / 6), toY - head * Math.sin(angle + Math.PI / 6))
  ctx.closePath()
  ctx.fill()
}

function drawGround(ctx, colors, view, canvasWidth, rightInset, spanX) {
  const { scale, originX, groundY } = view
  const rightEdge = canvasWidth - rightInset

  // The ground runs the full width of the canvas. rightInset governs where the flight and its
  // labels may go, not where the world ends — a ground line stopping in mid-air under the
  // readout card would read as a drawing fault.
  ctx.strokeStyle = colors.grid
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(0, groundY)
  ctx.lineTo(canvasWidth, groundY)
  ctx.stroke()

  // Distance ticks along the ground, so the range can be read off the drawing and checked
  // against the readout rather than taken on trust. These do stop at the inset: a label sliding
  // under the card is unreadable.
  const step = niceTickStep(spanX)
  ctx.lineWidth = 1
  ctx.font = '11px ui-monospace, monospace'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'

  // Counted rather than accumulated: `metres += step` would drift on a fractional step.
  ctx.save()
  // The labels are chrome, not data — dimmed text rather than the grid colour, which is dark
  // enough against the background to be unreadable at 11px.
  ctx.globalAlpha = 0.5
  ctx.fillStyle = colors.text

  for (let i = 0; ; i += 1) {
    const metres = i * step
    const px = originX + metres * scale
    if (px > rightEdge - 4) break

    ctx.strokeStyle = colors.grid
    ctx.globalAlpha = 1
    ctx.beginPath()
    ctx.moveTo(px, groundY)
    ctx.lineTo(px, groundY + 6)
    ctx.stroke()

    ctx.globalAlpha = 0.5
    // Sub-metre steps need a decimal place; whole-metre steps would read "5.0" for no reason.
    ctx.fillText(step < 1 ? metres.toFixed(1) : String(Math.round(metres)), px, groundY + 10)
  }

  // Unit label, once, rather than on every tick.
  ctx.textAlign = 'left'
  ctx.fillText('m', 8, groundY + 10)
  ctx.restore()
}

function drawLaunchMarker(ctx, colors, view) {
  const { originX, groundY } = view
  ctx.save()
  ctx.globalAlpha = 0.5
  ctx.strokeStyle = colors.text
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(originX, groundY - 10)
  ctx.lineTo(originX, groundY)
  ctx.stroke()
  ctx.restore()
}

function drawTrace(ctx, colors, view, trace) {
  if (trace.length < 2) return
  const { scale, originX, groundY } = view

  ctx.save()
  // Held back from full brightness so the projectile itself stays the thing the eye lands on.
  ctx.globalAlpha = 0.7
  ctx.strokeStyle = colors.trace
  ctx.lineWidth = 1.5
  ctx.beginPath()
  trace.forEach((point, i) => {
    const px = originX + point.x * scale
    const py = groundY - point.y * scale
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  })
  ctx.stroke()
  ctx.restore()
}

// Velocity, decomposed. vx and vy are drawn from the projectile as the two legs of the right
// angle whose hypotenuse is the resultant — the decomposition every projectile question asks the
// student to perform, drawn on the object doing it.
function drawVelocity(ctx, colors, view, position, velocity, pxPerMps) {
  const { scale, originX, groundY } = view
  const px = originX + position.x * scale
  const py = groundY - position.y * scale

  const dx = velocity.vx * pxPerMps
  const dy = -velocity.vy * pxPerMps // canvas y grows downward; world y grows up

  // components first, so the resultant draws over them where they overlap
  arrow(ctx, px, py, px + dx, py, colors.blockA)
  arrow(ctx, px, py, px, py + dy, colors.blockB)

  // the dashed legs closing the rectangle, which is what makes it read as a decomposition
  // rather than three unrelated arrows
  ctx.save()
  ctx.setLineDash([3, 3])
  ctx.strokeStyle = colors.grid
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(px + dx, py)
  ctx.lineTo(px + dx, py + dy)
  ctx.moveTo(px, py + dy)
  ctx.lineTo(px + dx, py + dy)
  ctx.stroke()
  ctx.restore()

  arrow(ctx, px, py, px + dx, py + dy, colors.text)
}

function drawProjectile(ctx, colors, view, position) {
  const { scale, originX, groundY } = view
  ctx.fillStyle = colors.phosphor
  ctx.beginPath()
  ctx.arc(originX + position.x * scale, groundY - position.y * scale, PROJECTILE_RADIUS, 0, Math.PI * 2)
  ctx.fill()
}

function readColors() {
  const styles = getComputedStyle(document.documentElement)
  const token = (name) => styles.getPropertyValue(name).trim()
  return {
    bg: token('--instrument-bg'),
    grid: token('--instrument-grid'),
    text: token('--instrument-text'),
    phosphor: token('--instrument-phosphor-green'),
    blockA: token('--instrument-block-a'),
    blockB: token('--instrument-block-b'),
    // The trace is the path already travelled — a record, not a live value — so it is drawn in
    // the grid colour's register rather than phosphor, which CLAUDE.md reserves for live data.
    trace: token('--instrument-text'),
  }
}

// --- component -------------------------------------------------------------------------------

function ProjectileCanvas({
  launchSpeed = 20,
  launchAngle = 45,
  gravity = 9.8,
  // px of the canvas's right end kept clear, so a run never flies behind the readout card
  rightInset = 0,
  onFrame,
}) {
  const containerRef = useRef(null)
  const canvasRef = useRef(null)
  const simRef = useRef(createInitialSimState())
  const rafRef = useRef(null)
  const lastTimeRef = useRef(null)

  const [showVectors, setShowVectors] = useState(true)
  // The running rAF loop closes over the first `step` it was handed, so a state value read inside
  // it would be the one captured at Launch. The toggle therefore writes to a ref, which the loop
  // reads live; the state exists only to re-render the button.
  const showVectorsRef = useRef(showVectors)

  // Predicted values for the CURRENT slider positions. Used to frame the view before launch, so
  // the scale is already right for the run about to happen rather than snapping once it starts.
  const predictedRange = range(launchSpeed, launchAngle, gravity)
  const predictedHeight = maxHeight(launchSpeed, launchAngle, gravity)

  const redraw = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const sim = simRef.current
    const colors = readColors()

    // A run in the air keeps the scale it launched with; an idle canvas follows the sliders.
    // Rescaling mid-flight would have the projectile appear to change speed as the view zoomed.
    const source = sim.params ?? { range: predictedRange, maxHeight: predictedHeight }
    const view = viewTransform(canvas.width, canvas.height, rightInset, source.range, source.maxHeight)
    const spanX = Math.max(source.range, MIN_WORLD_SPAN)

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = colors.bg
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    drawGround(ctx, colors, view, canvas.width, rightInset, spanX)
    drawLaunchMarker(ctx, colors, view)
    drawTrace(ctx, colors, view, sim.trace)

    const params = sim.params ?? { v0: launchSpeed, thetaDeg: launchAngle, g: gravity }
    const position = positionAt(0, 0, params.v0, params.thetaDeg, params.g, sim.t)
    const velocity = velocityAt(params.v0, params.thetaDeg, params.g, sim.t)
    // The final frame lands at t = T, where y is zero to within floating point — a -1e-15 would
    // otherwise draw the projectile a hair under the ground line.
    if (sim.finished) position.y = Math.max(position.y, 0)

    if (showVectorsRef.current) {
      // Scaled so the resultant is VECTOR_LAUNCH_PX long at launch, whatever the launch speed.
      // v0 = 0 has no vector to draw, and would divide by zero here.
      const pxPerMps = params.v0 > 0 ? VECTOR_LAUNCH_PX / params.v0 : 0
      if (pxPerMps > 0) drawVelocity(ctx, colors, view, position, velocity, pxPerMps)
    }

    drawProjectile(ctx, colors, view, position)

    if (onFrame) {
      onFrame({
        elapsed: sim.t,
        x: position.x,
        y: Math.max(position.y, 0),
        vx: velocity.vx,
        vy: velocity.vy,
        speed: speed(velocity.vx, velocity.vy),
        launched: sim.launched,
        inFlight: sim.running,
      })
    }
  }

  const step = (timestamp) => {
    if (lastTimeRef.current === null) lastTimeRef.current = timestamp
    const dt = Math.min((timestamp - lastTimeRef.current) / 1000, MAX_FRAME_DT)
    lastTimeRef.current = timestamp

    const sim = simRef.current
    sim.t += dt

    // The flight ends at the time of flight, not at whatever the frame clock happens to land on.
    // Clamping to T rather than stopping on the first frame where y < 0 is what makes the drawn
    // landing point match the range the readout predicts — a long frame could otherwise carry the
    // projectile metres past it before anything noticed.
    if (sim.t >= sim.params.T) {
      sim.t = sim.params.T
      sim.running = false
      sim.finished = true
    }

    const { x, y } = positionAt(0, 0, sim.params.v0, sim.params.thetaDeg, sim.params.g, sim.t)
    sim.trace.push({ x, y: Math.max(y, 0) })

    redraw()

    if (sim.running) rafRef.current = requestAnimationFrame(step)
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

  // Slider changes reframe the idle view and push a fresh frame to the readout, so the predicted
  // figures update as the student drags. A run already in the air is left alone.
  useEffect(() => {
    if (simRef.current.running) return
    redraw()
  }, [launchSpeed, launchAngle, gravity, rightInset])

  const handleLaunch = () => {
    const sim = simRef.current
    if (sim.running) return

    const T = timeOfFlight(launchSpeed, launchAngle, gravity)

    simRef.current = createInitialSimState()
    simRef.current.launched = true
    simRef.current.params = {
      v0: launchSpeed,
      thetaDeg: launchAngle,
      g: gravity,
      T,
      range: range(launchSpeed, launchAngle, gravity),
      maxHeight: maxHeight(launchSpeed, launchAngle, gravity),
    }

    // θ=0 (or v0=0) from ground level gives T=0: the projectile is already where it lands, so
    // there is no flight to animate. It is launched and immediately finished, which is the
    // physically correct outcome for a flat launch off the ground rather than an error.
    if (T <= 0) {
      simRef.current.finished = true
      redraw()
      return
    }

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
    simRef.current = createInitialSimState()
    redraw()
  }

  const toggleVectors = () => {
    const next = !showVectorsRef.current
    showVectorsRef.current = next
    setShowVectors(next)
    if (!simRef.current.running) redraw()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
      <div ref={containerRef} style={{ flex: 1, minHeight: 0 }}>
        <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
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
        {/* A view option rather than a primary action, so it stays outlined — phosphor is
            reserved for live data and primary CTAs. */}
        <button
          type="button"
          onClick={toggleVectors}
          aria-pressed={showVectors}
          style={{
            fontFamily: 'var(--instrument-body-font)',
            fontSize: '13px',
            padding: '7px 16px',
            borderRadius: 'var(--radius-max)',
            border: '1px solid var(--instrument-grid)',
            background: showVectors ? 'var(--instrument-bg)' : 'transparent',
            color: 'var(--instrument-text)',
            opacity: showVectors ? 1 : 0.6,
            cursor: 'pointer',
          }}
        >
          Velocity vectors
        </button>

        {/* States the model the numbers assume, exactly as the momentum console does. */}
        <span
          style={{
            marginLeft: 'auto',
            alignSelf: 'center',
            fontFamily: 'var(--instrument-data-font)',
            fontSize: '11px',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--instrument-text)',
            opacity: 0.45,
          }}
        >
          2-D flight · No air resistance
        </span>
      </div>
    </div>
  )
}

export default ProjectileCanvas
