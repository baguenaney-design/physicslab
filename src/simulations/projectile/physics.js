// Projectile motion — closed-form kinematics. Calculations only, no rendering.
//
// MODEL AND ITS LIMITS
// Constant downward acceleration g, no air resistance, flat ground. Under those assumptions the
// horizontal and vertical motions are independent: nothing couples them, so x is uniform motion
// and y is uniform acceleration, and each can be solved in closed form.
//
// Air resistance is deliberately absent. Real drag on a projectile is quadratic in speed
// (F_d ∝ v²) and couples the two axes through the speed term, which leaves a system with no
// closed-form solution — it has to be integrated numerically. AP Physics 1 and IB Physics both
// examine the no-drag case, so this module models exactly what those exams ask for. See
// CLAUDE.md: drag is deferred to a Beyond-the-Classroom extension.
//
// LEVEL GROUND
// range(), maxHeight() and timeOfFlight() below assume launch and landing at the same height
// (y0 = 0). That is the standard form on the AP formula sheet and in the IB data booklet, and
// it is what the simulation draws. positionAt() and velocityAt() take y0 and are general.
//
// ANGLE CONVENTION
// Angles cross this module's boundary in DEGREES, because that is what the student dials in on
// the slider and what exam questions are written in. Every conversion to radians happens inside
// this file, in toRadians() below. Nothing outside physics.js should ever handle radians.
//
// ---------------------------------------------------------------------------------------------
// REFERENCE TEST CASE — the setup every summary function below is verified against.
//
//   v0 = 20 m/s, θ = 45°, g = 9.8 m/s²  →  R = 40.82 m, H = 10.20 m, T = 2.886 s
//
// Cross-check, independent of the sin(2θ) form: horizontal motion is uniform, so the range must
// also equal vx · T = (20 · cos45°) · T = 14.142 × 2.8862 = 40.82 m. ✓
// Two different routes to the same number is what makes this a real check rather than a restated
// formula.
// ---------------------------------------------------------------------------------------------

// The single degrees → radians boundary. Math.sin/cos take radians; the rest of the app speaks
// degrees.
// test: 0 → 0 ; 45 → 0.7853981633974483 (π/4) ; 90 → 1.5707963267948966 (π/2)
function toRadians(degrees) {
  return (degrees * Math.PI) / 180
}

// Position at time t.
// x(t) = x0 + v0·cosθ·t          — uniform motion: no horizontal force, so no horizontal acceleration
// y(t) = y0 + v0·sinθ·t − ½g·t²  — uniform acceleration under gravity
// source: standard 2D projectile kinematics, AP Physics 1 formula sheet / IB data booklet
//         (the s = ut + ½at² SUVAT equation applied to each axis independently)
//
// test: x0=0, y0=0, v0=20, θ=45°, g=9.8, t=1 → x=14.14 m, y=9.24 m
//       (vx = 20cos45 = 14.142, so x = 14.142 × 1 = 14.14;
//        y = 14.142 × 1 − 0.5 × 9.8 × 1 = 14.142 − 4.9 = 9.24)
// test: same setup at t=T=2.886 → x=40.82 m, y=0.00 m — lands at the range, back on the ground
export function positionAt(x0, y0, v0, thetaDeg, g, t) {
  const theta = toRadians(thetaDeg)
  return {
    x: x0 + v0 * Math.cos(theta) * t,
    y: y0 + v0 * Math.sin(theta) * t - 0.5 * g * t * t,
  }
}

// Velocity components at time t.
// vx    = v0·cosθ        — constant for the whole flight; nothing acts horizontally
// vy(t) = v0·sinθ − g·t  — decreases linearly, passes through zero at the apex, then negative
// source: standard 2D projectile kinematics (v = u + at applied to each axis)
//
// test: v0=20, θ=45°, g=9.8, t=0 → vx=14.14, vy=14.14 m/s  (symmetric at 45°)
// test: v0=20, θ=45°, g=9.8, t=1.443 (apex, T/2) → vx=14.14, vy=0.00 m/s
// test: v0=20, θ=45°, g=9.8, t=2.886 (landing)   → vx=14.14, vy=-14.14 m/s
//       (lands at the same speed it launched, mirrored — no drag means no energy lost)
export function velocityAt(v0, thetaDeg, g, t) {
  const theta = toRadians(thetaDeg)
  return {
    vx: v0 * Math.cos(theta),
    vy: v0 * Math.sin(theta) - g * t,
  }
}

// Speed — the magnitude of the velocity vector.
// speed = √(vx² + vy²)
// source: Pythagoras on perpendicular components
//
// test: vx=14.142, vy=14.142 → 20.00 m/s  (recovers v0 at launch, as it must)
// test: vx=14.142, vy=0      → 14.14 m/s  (at the apex the projectile still moves horizontally)
export function speed(vx, vy) {
  return Math.sqrt(vx * vx + vy * vy)
}

// Horizontal range on level ground.
// R = v0²·sin(2θ) / g
// source: standard level-ground range equation. Derived by substituting the time of flight
//         T = 2v0·sinθ/g into x = v0·cosθ·T, then applying the identity 2sinθcosθ = sin2θ.
//
// test: v0=20, θ=45°, g=9.8 → R = 400 × sin90° / 9.8 = 400 / 9.8 = 40.82 m   ← REFERENCE CASE
// test: v0=20, θ=90°, g=9.8 → R = 400 × sin180° / 9.8 = 0.00 m  (straight up, lands on the spot)
// test: v0=20, θ=30°, g=9.8 → R = 400 × sin60° / 9.8 = 400 × 0.86603 / 9.8 = 35.35 m
//       (and θ=60° gives the same 35.35 m — complementary angles share a range, a standard
//        exam result and a good thing for a student to discover on the slider)
export function range(v0, thetaDeg, g) {
  const theta = toRadians(thetaDeg)
  return (v0 * v0 * Math.sin(2 * theta)) / g
}

// Maximum height above the launch point.
// H = v0²·sin²θ / (2g)
// source: vertical component at the apex is zero, so v² = u² + 2as with v=0, u=v0·sinθ, a=−g
//         gives 0 = (v0sinθ)² − 2gH.
//
// test: v0=20, θ=45°, g=9.8 → H = 400 × 0.5 / 19.6 = 200 / 19.6 = 10.20 m   ← REFERENCE CASE
// test: v0=20, θ=90°, g=9.8 → H = 400 × 1 / 19.6 = 20.41 m  (all speed spent climbing)
// test: v0=20, θ=0°,  g=9.8 → H = 0.00 m  (a flat launch from the ground never rises)
export function maxHeight(v0, thetaDeg, g) {
  const theta = toRadians(thetaDeg)
  const sinTheta = Math.sin(theta)
  return (v0 * v0 * sinTheta * sinTheta) / (2 * g)
}

// Total time of flight on level ground.
// T = 2·v0·sinθ / g
// source: the flight is symmetric about the apex. Time to the apex is v0·sinθ/g (from v = u − gt
//         with v = 0), and the descent takes the same again.
//
// test: v0=20, θ=45°, g=9.8 → T = 2 × 20 × 0.70711 / 9.8 = 28.284 / 9.8 = 2.886 s ← REFERENCE CASE
// test: v0=20, θ=90°, g=9.8 → T = 2 × 20 / 9.8 = 4.082 s  (longest flight for a given v0)
// test: v0=20, θ=1°,  g=9.8 → T = 2 × 20 × 0.017452 / 9.8 = 0.0712 s (the shallowest the UI allows)
// test: v0=20, θ=0°,  g=9.8 → T = 0.00 s  (see the note below — this is correct, not a bug)
//
// θ = 0 with y0 = 0 gives T = 0: a projectile launched horizontally from ground level is already
// on the ground, so it has no flight. That is the correct result for this model, not an error.
//
// It is a dead Launch button, though, so the UI does not offer it: the launch-angle slider is
// floored at 1° (see Controls.jsx). The functions here are deliberately NOT clamped — this module
// states the physics, and the physics at θ=0 is a zero-length flight. Guarding it here would mean
// returning a number the equations do not give.
//
// Callers must therefore still tolerate T = 0, because v0 = 0 reaches it by the other route and
// the speed slider does go to zero. ProjectileCanvas handles both in one branch at launch.
export function timeOfFlight(v0, thetaDeg, g) {
  const theta = toRadians(thetaDeg)
  return (2 * v0 * Math.sin(theta)) / g
}
