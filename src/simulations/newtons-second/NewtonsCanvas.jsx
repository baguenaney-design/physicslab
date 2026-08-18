import { useEffect, useRef, useState } from 'react'
import { advance, resolveDynamics } from './physics.js'
import { GRAVITY } from './Controls.jsx'

// The block view, and the free-body diagram drawn on it. Rendering only — every physical quantity
// on screen comes from physics.js. Nothing here computes a force, an acceleration or a position;
// this file's job is turning newtons and metres into pixels.
//
// Same architecture as ProjectileCanvas: mutable per-frame state in simRef so animation never
// triggers a React render, the frame handle in rafRef, the clock in lastTimeRef, a ResizeObserver
// on the container, and cancellation on unmount.
//
// ONE STRUCTURAL DIFFERENCE FROM PROJECTILE, and it is the reason this simulation exists.
// ProjectileCanvas snapshots its parameters into sim.params at Launch and a run in the air ignores
// the sliders. Here the sliders stay LIVE while the block moves: the student drags the applied
// force up and watches the block break loose at the instant F crosses mu_s*N. Locking the
// parameters would make the breakaway unobservable except by resetting. So the parameters travel
// through paramsRef instead of a snapshot — see the note on the ref below.

// Canvas padding, in px.
//
// MARGIN_LEFT is far wider than projectile's 56 because the LEFT of the block is where the
// friction arrow and its label live, and the block never travels left of this margin — the camera
// holds it here until it has moved far enough downrange to start scrolling. The margin therefore
// has to hold the whole left half of the free-body diagram: the longest arrow (MAX_VECTOR_PX)
// plus its label. At 56 the friction label was clipped by the canvas edge on the very first frame.
const MARGIN_LEFT = 140
const MARGIN_RIGHT = 40
const MARGIN_TOP = 40
// Deeper than projectile's 44. The weight arrow is drawn downward from the block's centre and
// crosses the ground line — standard free-body practice, and unavoidable for a body sitting on the
// surface it is pressing against. The distance labels therefore sit below the deepest arrow a
// slider can produce rather than just below the ground; see LABEL_DROP.
const MARGIN_BOTTOM = 96

// A fixed scale, momentum's approach rather than projectile's. ProjectileCanvas derives its scale
// per run from a closed-form range; there is no range here to derive one from, because a block
// under a net force accelerates indefinitely. The camera scrolls instead.
const PIXELS_PER_METRE = 55

// Fraction of the usable width the block may reach before the view starts scrolling to follow it.
// Below this the block moves and the world is still, which is what makes the early acceleration
// readable; past it the world moves and the block is still, which is what keeps it on screen.
const SCROLL_AT = 0.4

// Length in px of the LONGEST force arrow. Forces are not lengths, so they cannot share the
// world's px-per-metre scale; they get their own, derived per frame so the diagram fills the same
// space whether the block weighs 4.9 N or 98 N.
const MAX_VECTOR_PX = 72

// Where the distance labels sit below the ground line: clear of the deepest possible arrow tip,
// which is (MAX_VECTOR_PX - blockSize/2) below the ground and therefore always above this.
const LABEL_DROP = MAX_VECTOR_PX + 10

// All canvas text. The data font, per CLAUDE.md's rule that numbers are always JetBrains Mono —
// ProjectileCanvas predates the font being loaded and uses the bare ui-monospace fallback.
const CANVAS_FONT = "11px 'JetBrains Mono', ui-monospace, monospace"

// Largest simulated time a single frame may advance, in seconds — 1/30 s.
//
// A backgrounded tab throttles requestAnimationFrame to about 1 Hz, and a stalled main thread can
// do worse, so the next frame can hand back a dt of a second or more. Unclamped, one such step
// would carry the block metres downrange in a single jump: the acceleration it is supposed to be
// demonstrating never gets drawn, and a student watching would see a teleport rather than a force
// doing work over time.
//
// Clamping means simulated time falls behind wall-clock time during a stall and the block runs
// late. That is the right trade for a teaching simulation — the motion stays consistent with the
// equations and with the readout's elapsed time, which is what the student is reading.
//
// It also bounds the one discretisation error left in the model. advance() is EXACT within a frame
// (acceleration is piecewise-constant by construction and integrated in closed form), so the only
// thing the frame rate costs is WHEN a regime change is noticed — at most one frame, 33 ms at this
// clamp. That is not worth sub-stepping for.
const MAX_FRAME_DT = 1 / 30

// The four vectors of the free-body diagram, each independently toggleable. Order is the order
// they appear in the legend.
const VECTORS = [
  { key: 'applied', label: 'Applied', color: 'var(--instrument-block-a)' },
  { key: 'friction', label: 'Friction', color: 'var(--instrument-block-b)' },
  { key: 'normal', label: 'Normal', color: 'var(--instrument-text)' },
  { key: 'weight', label: 'Weight', color: 'var(--instrument-text)' },
]

// Nice round tick spacing for the distance axis — 1, 2, 5, 10, 20, 50, … metres, whichever gives
// roughly TARGET_TICKS divisions across the visible span. A raw span/8 would label the ground in
// steps of 1.7 m.
//
// Duplicated from ProjectileCanvas.jsx:55 rather than exported from it. That file is on the phase 6
// do-not-modify list, and duplicating small view helpers is this repo's recorded convention (see
// the header of projectile/Controls.jsx on Slider and toggleButtonStyle).
//
// test: span=13.6 → raw 1.70, magnitude 1,   normalised 1.70 → 2 m ticks
// test: span=5    → raw 0.63, magnitude 0.1, normalised 6.25 → 1 m ticks
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

// The drawn size of the block, in px, from its mass. Momentum's blockSizeForMass refitted to this
// simulation's 0.5-10 kg range: 38.5 px at the lightest, 86 px at the heaviest.
//
// Not decoration. Mass is half of N = mg, and a 10 kg block that looked identical to a 0.5 kg one
// while its weight arrow quadrupled would be hiding the relationship the diagram is teaching.
function blockSizeForMass(mass) {
  return 36 + mass * 5
}

function createInitialSimState() {
  return {
    t: 0, // seconds since Run was first pressed
    position: 0, // metres from the start marker
    velocity: 0, // m/s, +x
    running: false,
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

// Force magnitudes are formatted from their absolute value: the sign is carried by which way the
// arrow points, and physics.js can legitimately return -0 for friction on a stationary block under
// no applied force, which would print as "-0.0 N".
function forceLabel(symbol, newtons) {
  return `${symbol} ${Math.abs(newtons).toFixed(1)} N`
}

function drawGround(ctx, colors, layout, canvasWidth, rightInset, cameraX) {
  const { groundY, originX } = layout
  const rightEdge = canvasWidth - rightInset

  // The ground runs the full width of the canvas. rightInset governs where the block and its
  // labels may go, not where the world ends — a ground line stopping in mid-air under the readout
  // card would read as a drawing fault.
  ctx.strokeStyle = colors.grid
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(0, groundY)
  ctx.lineTo(canvasWidth, groundY)
  ctx.stroke()

  // Distance ticks, so displacement can be read off the drawing and checked against the readout
  // rather than taken on trust. They carry ABSOLUTE displacement and scroll with the world, which
  // is the only reason the camera move stays legible: a ruler fixed to the viewport would tell the
  // student nothing once the block stopped moving across the screen.
  const visibleSpan = Math.max((rightEdge - originX) / PIXELS_PER_METRE, 1)
  const step = niceTickStep(visibleSpan)
  const firstTick = Math.floor(cameraX / step) * step

  ctx.save()
  ctx.lineWidth = 1
  ctx.font = CANVAS_FONT
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'

  // Counted rather than accumulated: `metres += step` would drift on a fractional step.
  for (let i = 0; ; i += 1) {
    const metres = firstTick + i * step
    const px = originX + (metres - cameraX) * PIXELS_PER_METRE
    if (px > rightEdge - 4) break
    if (px < originX - 0.5) continue

    ctx.strokeStyle = colors.grid
    ctx.globalAlpha = 1
    ctx.beginPath()
    ctx.moveTo(px, groundY)
    ctx.lineTo(px, groundY + 6)
    ctx.stroke()

    // The labels are chrome, not data — dimmed text rather than the grid colour, which is dark
    // enough against the background to be unreadable at 11px.
    ctx.globalAlpha = 0.5
    ctx.fillStyle = colors.text
    // Sub-metre steps need a decimal place; whole-metre steps would read "5.0" for no reason.
    ctx.fillText(step < 1 ? metres.toFixed(1) : String(Math.round(metres)), px, groundY + LABEL_DROP)
  }

  // Unit label, once, rather than on every tick.
  ctx.globalAlpha = 0.5
  ctx.fillStyle = colors.text
  ctx.textAlign = 'left'
  ctx.fillText('m', 8, groundY + LABEL_DROP)
  ctx.restore()
}

// The origin displacement is measured from. Scrolls off once the block is far enough downrange,
// which is correct — by then the ground ticks are carrying the same information.
function drawStartMarker(ctx, colors, layout, cameraX, rightEdge) {
  const { groundY, originX } = layout
  const px = originX - cameraX * PIXELS_PER_METRE
  if (px < originX - 0.5 || px > rightEdge) return

  ctx.save()
  ctx.globalAlpha = 0.5
  ctx.strokeStyle = colors.text
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(px, groundY - 10)
  ctx.lineTo(px, groundY)
  ctx.stroke()
  ctx.restore()
}

// The block is drawn as a tinted fill with a solid outline rather than momentum's flat block-a
// rectangle. The applied-force arrow is block-a and starts at the block's centre, so a solid
// block-a block would swallow the first half of it — the arrow has to be legible over the body it
// acts on, because that is what a free-body diagram is.
function drawBlock(ctx, colors, layout, blockPx, size, mass) {
  const { groundY } = layout
  const left = blockPx - size / 2
  const top = groundY - size

  ctx.save()
  ctx.globalAlpha = 0.25
  ctx.fillStyle = colors.blockA
  ctx.fillRect(left, top, size, size)
  ctx.restore()

  ctx.strokeStyle = colors.blockA
  ctx.lineWidth = 1.5
  ctx.strokeRect(left, top, size, size)

  ctx.save()
  ctx.globalAlpha = 0.7
  ctx.fillStyle = colors.text
  ctx.font = CANVAS_FONT
  ctx.textAlign = 'center'
  ctx.textBaseline = 'bottom'
  ctx.fillText(`${mass.toFixed(1)} kg`, blockPx, groundY - 6)
  ctx.restore()
}

// THE FREE-BODY DIAGRAM. This is the simulation; the block sliding is the least interesting thing
// on screen.
//
// All four vectors share ONE px-per-newton scale, so their lengths are honestly comparable — a
// friction arrow half the length of the applied arrow means half the force, and normal and weight
// are drawn on the same line and visibly cancel because N = mg exactly on a flat surface under a
// horizontal push.
function drawVectors(ctx, colors, layout, blockPx, size, dynamics, appliedForce, velocity, show, maxVectorPx) {
  const { groundY } = layout
  const centreX = blockPx
  const centreY = groundY - size / 2
  const { normal, maxStatic, friction } = dynamics

  // The reference deliberately EXCLUDES the instantaneous friction. If friction fed the scale, its
  // drop from f_s,max to mu_k*N at breakaway would rescale every arrow on the same frame and
  // cancel itself out on screen — the one thing this diagram exists to show would be invisible.
  const reference = Math.max(normal, Math.abs(appliedForce), maxStatic)
  if (reference <= 0 || maxVectorPx <= 0) return
  const pxPerNewton = maxVectorPx / reference

  ctx.save()
  ctx.font = CANVAS_FONT
  ctx.textBaseline = 'middle'

  // The side friction acts on: opposite the motion, or opposite the impending motion when at rest.
  // Falls back to the left so the f_s,max ceiling still has a side to be drawn on when nothing is
  // pushing and nothing is moving.
  let oppose = -1
  if (velocity > 0) oppose = -1
  else if (velocity < 0) oppose = 1
  else if (appliedForce > 0) oppose = -1
  else if (appliedForce < 0) oppose = 1

  // The static ceiling, drawn as a ghost the friction arrow grows toward. Below the threshold the
  // solid friction arrow tracks the applied force 1:1 and creeps up on this tick; at breakaway it
  // SNAPS BACK to mu_k*N while the tick stays where it is. That snap, measured against something
  // that did not move, is the whole lesson.
  if (show.friction && maxStatic > 0) {
    const ghostX = centreX + oppose * maxStatic * pxPerNewton
    ctx.save()
    ctx.globalAlpha = 0.45
    ctx.setLineDash([3, 3])
    ctx.strokeStyle = colors.blockB
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(ghostX, centreY - 9)
    ctx.lineTo(ghostX, centreY + 9)
    ctx.stroke()
    ctx.setLineDash([])
    ctx.fillStyle = colors.blockB
    // Clamped inside the drawable area: at low mu the tick sits close to the block, but at the
    // start of a run the block itself is at the left margin, and a centred label would be cut off
    // by the canvas edge.
    // Clamped to the canvas edge as a backstop; MARGIN_LEFT is sized so it never actually binds.
    ctx.textAlign = 'center'
    const half = ctx.measureText('f_s,max').width / 2
    ctx.fillText('f_s,max', Math.max(ghostX, half + 4), centreY + 24)
    ctx.restore()
  }

  // LABELS GO BEYOND THE ARROWHEAD, never at the arrow's midpoint.
  //
  // A midpoint label sits on top of its own arrow and, for anything shorter than the block, inside
  // the block itself — where it collides with the mass label and with the opposite arrow's label.
  // Past the tip, each label is in empty space on its own side of the diagram, and the four can
  // never overlap each other because they are on four different sides.
  //
  // The horizontal pair are additionally pushed clear of the block's own edge, so a small force —
  // whose arrowhead stops inside the block — still gets its label outside it.
  const clearRight = Math.max(centreX + size / 2, centreX) + 6
  const clearLeft = Math.min(centreX - size / 2, centreX) - 6

  if (show.normal) {
    const tipY = centreY - normal * pxPerNewton
    arrow(ctx, centreX, centreY, centreX, tipY, colors.text)
    ctx.fillStyle = colors.text
    ctx.textAlign = 'center'
    ctx.fillText(forceLabel('N', normal), centreX, tipY - 10)
  }

  if (show.weight) {
    // W = mg = N here. Drawn downward through the ground line, which is where MARGIN_BOTTOM's
    // depth comes from — and its label still lands above the distance ticks, because LABEL_DROP is
    // sized off the full MAX_VECTOR_PX.
    const tipY = centreY + normal * pxPerNewton
    arrow(ctx, centreX, centreY, centreX, tipY, colors.text)
    ctx.fillStyle = colors.text
    ctx.textAlign = 'center'
    ctx.fillText(forceLabel('W', normal), centreX, tipY + 10)
  }

  if (show.applied) {
    const tipX = centreX + appliedForce * pxPerNewton
    arrow(ctx, centreX, centreY, tipX, centreY, colors.blockA)
    ctx.fillStyle = colors.blockA
    ctx.textAlign = 'left'
    ctx.fillText(forceLabel('F', appliedForce), Math.max(tipX, clearRight) + 4, centreY)
  }

  if (show.friction) {
    const tipX = centreX + friction * pxPerNewton
    arrow(ctx, centreX, centreY, tipX, centreY, colors.blockB)
    ctx.fillStyle = colors.blockB
    ctx.textAlign = 'right'
    ctx.fillText(forceLabel('f', friction), Math.min(tipX, clearLeft) - 4, centreY)
  }

  ctx.restore()
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
  }
}

// --- component -------------------------------------------------------------------------------

function NewtonsCanvas({
  appliedForce = 12,
  mass = 2,
  muS = 0.5,
  muK = 0.3,
  // px of the canvas's right end kept clear, so the block never runs behind the readout card
  rightInset = 0,
  onFrame,
}) {
  const containerRef = useRef(null)
  const canvasRef = useRef(null)
  const simRef = useRef(createInitialSimState())
  const rafRef = useRef(null)
  const lastTimeRef = useRef(null)

  // THE LIVE-PARAMETER REF. step() closes over the props of the render that created it, so a
  // running loop reading `appliedForce` directly would read the value as it was when Run was
  // pressed and never see the slider move — the opposite of what this simulation is for. The
  // parameters therefore go through a ref the loop reads fresh each frame. Same reasoning as
  // ProjectileCanvas's showVectorsRef, applied to the physics inputs rather than a view option.
  const paramsRef = useRef({ appliedForce, mass, muS, muK })

  const [showVectors, setShowVectors] = useState({
    applied: true,
    friction: true,
    normal: true,
    weight: true,
  })
  const showVectorsRef = useRef(showVectors)

  // Mirrors sim.running into React so the Run/Pause button re-renders. The loop itself reads
  // simRef, never this.
  const [running, setRunning] = useState(false)

  const redraw = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const sim = simRef.current
    const colors = readColors()
    const params = paramsRef.current

    const layout = {
      originX: MARGIN_LEFT,
      groundY: canvas.height - MARGIN_BOTTOM,
    }
    const rightEdge = canvas.width - rightInset
    const usableWidth = Math.max(canvas.width - MARGIN_LEFT - MARGIN_RIGHT - rightInset, 1)

    // The world scrolls only once the block has crossed SCROLL_AT of the usable width. Before
    // that the block moves against a fixed world, which is what makes the early acceleration
    // readable; after it the world moves and the block holds station, which is what keeps it on
    // screen while it accelerates indefinitely.
    const leadMetres = (usableWidth * SCROLL_AT) / PIXELS_PER_METRE
    const cameraX = Math.max(0, sim.position - leadMetres)
    const blockPx = MARGIN_LEFT + (sim.position - cameraX) * PIXELS_PER_METRE

    // Resolved for the CURRENT instant — the same velocity the block is drawn at — rather than
    // reusing the dynamics advance() returned, which describe the interval just integrated. This
    // keeps the arrows and the position on screen describing the same moment. It is still
    // physics.js doing the work; the canvas computes nothing.
    const dynamics = resolveDynamics({
      mass: params.mass,
      g: GRAVITY,
      muS: params.muS,
      muK: params.muK,
      appliedForce: params.appliedForce,
      velocity: sim.velocity,
    })

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = colors.bg
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    drawGround(ctx, colors, layout, canvas.width, rightInset, cameraX)
    drawStartMarker(ctx, colors, layout, cameraX, rightEdge)

    const size = blockSizeForMass(params.mass)

    // The longest arrow the canvas has room for. MAX_VECTOR_PX is the design length, but the
    // normal arrow runs upward from the block's centre and a short viewport — or a 10 kg block,
    // whose 86 px body eats into the same space — would push its head off the top. Capped to the
    // clear height above the block rather than allowed to draw outside the canvas.
    //
    // LABEL_DROP is deliberately NOT reduced to match: it is sized off the full MAX_VECTOR_PX, so
    // a shortened weight arrow only ever lands further above the distance labels, never on them.
    const maxVectorPx = Math.min(MAX_VECTOR_PX, layout.groundY - MARGIN_TOP - size / 2)

    drawBlock(ctx, colors, layout, blockPx, size, params.mass)
    drawVectors(
      ctx,
      colors,
      layout,
      blockPx,
      size,
      dynamics,
      params.appliedForce,
      sim.velocity,
      showVectorsRef.current,
      maxVectorPx,
    )

    if (onFrame) {
      onFrame({
        elapsed: sim.t,
        position: sim.position,
        velocity: sim.velocity,
        appliedForce: params.appliedForce,
        friction: dynamics.friction,
        netForce: dynamics.netForce,
        acceleration: dynamics.acceleration,
        normal: dynamics.normal,
        maxStatic: dynamics.maxStatic,
        regime: dynamics.regime,
        running: sim.running,
      })
    }
  }

  const step = (timestamp) => {
    if (lastTimeRef.current === null) lastTimeRef.current = timestamp
    const dt = Math.min((timestamp - lastTimeRef.current) / 1000, MAX_FRAME_DT)
    lastTimeRef.current = timestamp

    const sim = simRef.current
    const params = paramsRef.current

    // The only physics call in this file.
    const next = advance(
      {
        position: sim.position,
        velocity: sim.velocity,
        mass: params.mass,
        g: GRAVITY,
        muS: params.muS,
        muK: params.muK,
        appliedForce: params.appliedForce,
      },
      dt,
    )

    sim.position = next.position
    sim.velocity = next.velocity
    sim.t += dt

    redraw()

    // Deliberately keeps running when the block is at rest. A block held below the static
    // threshold is not a finished run — it is the state the student drags the force slider out of,
    // and it is also where a block that has coasted to a stop must sit without jittering. There is
    // no terminating condition in this simulation.
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

  // Slider changes reach the running loop through this ref. The redraw is for the idle canvas —
  // the free-body diagram is fully meaningful before Run is ever pressed, and it must follow the
  // sliders so a student can find the breakaway threshold without starting the clock. A running
  // loop redraws itself.
  //
  // The effect runs after paint, so a running loop can read the parameters one frame stale
  // (17 ms at 60 fps). That is below the threshold of anything a student can perceive and does not
  // warrant writing to the ref during render.
  useEffect(() => {
    paramsRef.current = { appliedForce, mass, muS, muK }
    if (!simRef.current.running) redraw()
  }, [appliedForce, mass, muS, muK, rightInset])

  const handleRun = () => {
    const sim = simRef.current
    if (sim.running) return
    sim.running = true
    setRunning(true)
    lastTimeRef.current = null
    rafRef.current = requestAnimationFrame(step)
  }

  // Stops the clock with position and velocity intact, so the diagram can be read at a chosen
  // instant. Not the same as Reset.
  const handlePause = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    lastTimeRef.current = null
    simRef.current.running = false
    setRunning(false)
    redraw()
  }

  const handleReset = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    lastTimeRef.current = null
    simRef.current = createInitialSimState()
    setRunning(false)
    redraw()
  }

  const toggleVector = (key) => {
    const next = { ...showVectorsRef.current, [key]: !showVectorsRef.current[key] }
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
          gap: '10px',
          padding: '12px',
          background: 'var(--instrument-panel)',
          borderTop: '1px solid var(--instrument-grid)',
        }}
      >
        {/* Run rather than projectile's Launch. Launch means "lock these parameters and fire";
            nothing is locked here, so the button only starts and stops the clock. */}
        <button
          type="button"
          onClick={running ? handlePause : handleRun}
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
          {running ? 'Pause' : 'Run'}
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

        {/* One toggle per vector, doubling as the diagram's key — the swatch is the only thing
            telling a student which colour is which force, and normal and weight share a colour
            because they are the pair that cancels. View options, so outlined rather than phosphor.
            Each writes to showVectorsRef for the same stale-closure reason the params do. */}
        {VECTORS.map((vector) => (
          <button
            key={vector.key}
            type="button"
            onClick={() => toggleVector(vector.key)}
            aria-pressed={showVectors[vector.key]}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              fontFamily: 'var(--instrument-body-font)',
              fontSize: '12px',
              padding: '6px 12px',
              borderRadius: 'var(--radius-max)',
              border: '1px solid var(--instrument-grid)',
              background: showVectors[vector.key] ? 'var(--instrument-bg)' : 'transparent',
              color: 'var(--instrument-text)',
              opacity: showVectors[vector.key] ? 1 : 0.45,
              cursor: 'pointer',
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                background: vector.color,
                display: 'inline-block',
              }}
            />
            {vector.label}
          </button>
        ))}

        {/* States the model the numbers assume, exactly as the momentum and projectile consoles do. */}
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
          1-D · Flat surface · Coulomb friction
        </span>
      </div>
    </div>
  )
}

export default NewtonsCanvas
