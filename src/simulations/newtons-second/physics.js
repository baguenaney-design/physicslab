// Newton's second law — one block, one dimension, flat surface. Calculations only, no rendering.
//
// MODEL AND ITS LIMITS
// A single body on level ground, pushed horizontally against dry friction. The surface is flat and
// the applied force is horizontal, so the vertical direction is in equilibrium and the normal force
// is just the weight. Nothing here handles ramps, connected bodies, pulleys or air resistance —
// each of those changes the free-body diagram, and a simulation that quietly extended to them
// would be drawing a diagram it had not solved.
//
// FRICTION: THE COULOMB MODEL
// Dry friction is modelled as it is on the AP formula sheet and in the IB data booklet:
//
//   f_s ≤ μ_s·N     static friction is an INEQUALITY — μ_s·N is a ceiling, not a value
//   f_k = μ_k·N     kinetic friction is an equality, independent of speed
//
// That inequality is the whole point of this file, and the single most common student error in
// this topic is collapsing it into an equality. A block at rest under a 3 N push does not
// experience μ_s·N of friction. It experiences 3 N — exactly enough to hold it still, and no more.
// Friction only equals μ_s·N at the instant the block is on the verge of moving. Below that, it
// matches whatever is applied; above it, the block breaks away and kinetic friction takes over at
// the lower value μ_k·N.
//
// resolveDynamics() below is written around that distinction, and it is why the static branch
// returns -appliedForce rather than -maxStatic.
//
// The Coulomb model's own limits, worth stating because the simulation presents it as exact:
// real f_k varies slightly with speed, real surfaces have contact area effects the model ignores,
// and μ is not a constant of a material but of a PAIR of surfaces. AP 1 and IB both examine the
// idealised model, so that is what this module implements.
//
// SIGN CONVENTION
// One axis, +x to the right. appliedForce, velocity, friction, netForce and acceleration are all
// signed along it. Friction is returned SIGNED and already opposing — callers add it to the applied
// force rather than subtracting a magnitude, so `F_net = F_applied + f` holds without the caller
// having to know which way the block is going.
//
// ---------------------------------------------------------------------------------------------
// REFERENCE TEST CASE — the setup every function below is verified against.
//
//   m = 2 kg, μ_s = 0.5, μ_k = 0.3, g = 9.8
//
//   F = 12 N →  N = 19.6, f_s,max = 9.8. 12 > 9.8, so the block breaks away.
//               f_k = 5.88, F_net = 6.12, a = 3.06 m/s²
//   F =  8 N →  8 < 9.8, so the block stays put.
//               friction = 8 N (NOT 9.8), F_net = 0, a = 0
//
// Cross-check on a = 3.06, by a route that never divides a net force by a mass — the work-energy
// theorem. Starting from rest under constant a = 3.06 for t = 2 s: v = a·t = 6.12 m/s and
// x = ½·a·t² = 6.12 m. Then
//     W_net = F_net · x = 6.12 × 6.12 = 37.4544 J
//     ΔKE   = ½·m·v²   = ½ × 2 × 6.12² = 37.4544 J
// Two independent routes to the same number is what makes this a real check rather than a
// restated formula.
// ---------------------------------------------------------------------------------------------

// Signed unit step. Math.sign is not used directly because Math.sign(-0) is -0, and a -0 leaking
// into a friction direction would render as "-0.00 N" in the readout.
// test: 5 → 1 ; -5 → -1 ; 0 → 0 ; -0 → 0
function direction(value) {
  if (value > 0) return 1
  if (value < 0) return -1
  return 0
}

// Normal force on flat ground.
// N = m·g
// source: Newton's second law applied vertically. The surface is level and the applied force is
//         horizontal, so there is no vertical acceleration and no vertical component to carry:
//         ΣF_y = N − mg = 0.
//
// This is the one place the flat-surface assumption is load-bearing. On an incline the normal
// force is mg·cosθ and every friction figure below changes with it — which is exactly why
// inclined planes are out of scope for this simulation rather than a slider away.
//
// test: m=2,  g=9.8 → 19.6 N   ← REFERENCE CASE
// test: m=10, g=9.8 → 98.0 N
// test: m=0.5, g=9.8 → 4.9 N   (the lightest the mass slider allows)
export function normalForce(mass, g) {
  return mass * g
}

// The largest friction force the surface can supply before the block slips.
// f_s,max = μ_s·N
// source: Coulomb model of dry friction, f_s ≤ μ_s·N. This returns the CEILING of that
//         inequality, not the friction actually acting — see resolveDynamics.
//
// test: μ_s=0.5, N=19.6 → 9.8 N   ← REFERENCE CASE. A push of 9.8 N or less does not move it.
// test: μ_s=0,   N=19.6 → 0.0 N   (frictionless — any push at all starts it moving)
// test: μ_s=0.8, N=19.6 → 15.68 N (the grippiest the slider allows, on the reference block)
export function maxStaticFriction(muS, normal) {
  return muS * normal
}

// Kinetic friction on a block that is already sliding.
// f_k = μ_k·N
// source: Coulomb model of dry friction. An equality, not an inequality, and independent of speed —
//         a block sliding at 20 m/s feels the same friction as one at 0.1 m/s.
//
// test: μ_k=0.3, N=19.6 → 5.88 N  ← REFERENCE CASE
// test: μ_k=0,   N=19.6 → 0.0 N
//
// Because μ_k < μ_s for real surface pairs, f_k is always below f_s,max — which is why a block is
// harder to start than to keep moving, and why friction visibly DROPS at the moment of breakaway.
export function kineticFriction(muK, normal) {
  return muK * normal
}

// The complete force resolution for the current instant. Everything the readout, the canvas and
// the tutor need, from one call.
//
// Returns { normal, maxStatic, kinetic, friction, netForce, acceleration, regime }, where friction
// is SIGNED and already opposing, and regime is 'static' or 'kinetic'.
//
// THE STATIC BRANCH IS THE SUBTLE PART.
// At rest with |F| ≤ f_s,max, static friction takes whatever value holds the block still. By
// Newton's second law with a = 0, that value is exactly −F. It is NOT −μ_s·N. Writing μ_s·N here
// would give a block under a 1 N push a 9.8 N friction force, which would accelerate it BACKWARDS
// out from under the hand pushing it.
//
// At the threshold the comparison is `≤`: at exactly F = f_s,max the block is still held. That is
// the standard convention and matches how both syllabi state the inequality.
//
// Once |F| exceeds the ceiling the block breaks away, and kinetic friction applies from that
// instant at the LOWER value μ_k·N. The discontinuous drop from f_s,max to f_k is real, physical,
// and the reason a heavy box lurches when it finally starts to slide.
//
// test: m=2, μ_s=0.5, μ_k=0.3, g=9.8, F=12, v=0  ← REFERENCE CASE, MOVING
//       → normal 19.6, maxStatic 9.8, kinetic 5.88
//         12 > 9.8, so: friction −5.88, netForce 6.12, acceleration 3.06, regime 'kinetic'
// test: m=2, μ_s=0.5, μ_k=0.3, g=9.8, F=8, v=0   ← REFERENCE CASE, STATIC
//       → 8 ≤ 9.8, so: friction −8 (not −9.8), netForce 0, acceleration 0, regime 'static'
// test: same block, F=9.8, v=0 → exactly at the ceiling: friction −9.8, a=0, regime 'static'
// test: same block, F=9.81, v=0 → just over: friction −5.88, a=(9.81−5.88)/2=1.965, 'kinetic'
//       (note friction DROPS from 9.8 to 5.88 across a 0.01 N change in the push)
// test: same block moving, v=5, F=0 → friction −5.88, netForce −5.88, a=−2.94 (coasting to a stop)
// test: same block moving, v=5, F=3 → friction −5.88, netForce −2.88, a=−1.44
//       Still SLOWING DOWN while being pushed forwards, because the push is below f_k. A standard
//       exam trap and worth a student discovering on the slider.
// test: same block moving, v=5, F=5.88 → netForce 0, a=0 — constant velocity, the equilibrium case
// test: m=2, μ_s=0, μ_k=0, g=9.8, F=12, v=0 → frictionless: friction 0, a=6.0
//
// test: the asymmetry, worth its own case — F=8 on the reference block.
//       at rest (v=0)  → regime 'static',  a = 0     because 8 ≤ f_s,max = 9.8
//       moving (v=1)   → regime 'kinetic', a = 1.06  because 8 > f_k = 5.88
//       The same 8 N push cannot START the block but comfortably keeps it accelerating once it is
//       going. Nothing about the push changed; only which side of the inequality applies. This is
//       the clearest single demonstration that f_s,max and f_k are different quantities, and it is
//       reachable on the sliders.
export function resolveDynamics({ mass, g, muS, muK, appliedForce, velocity }) {
  const normal = normalForce(mass, g)
  const maxStatic = maxStaticFriction(muS, normal)
  const kinetic = kineticFriction(muK, normal)

  // At rest, and the push is within what static friction can hold.
  if (velocity === 0 && Math.abs(appliedForce) <= maxStatic) {
    return {
      normal,
      maxStatic,
      kinetic,
      // equal and opposite to the applied force — NOT μ_s·N. See the note above.
      friction: -appliedForce,
      netForce: 0,
      acceleration: 0,
      regime: 'static',
    }
  }

  // Sliding, or about to. Friction opposes the motion if there is any; at the instant of breakaway
  // there is no velocity yet, so it opposes the applied force instead.
  const opposing = velocity !== 0 ? direction(velocity) : direction(appliedForce)
  const friction = -opposing * kinetic
  const netForce = appliedForce + friction

  return {
    normal,
    maxStatic,
    kinetic,
    friction,
    netForce,
    // Newton's second law: a = F_net / m
    // source: ΣF = ma, AP Physics 1 formula sheet / IB data booklet
    acceleration: netForce / mass,
    regime: 'kinetic',
  }
}

// One integration step. EXACT integration of constant acceleration, not an Euler approximation:
//
//   v₁ = v₀ + a·dt
//   x₁ = x₀ + v₀·dt + ½·a·dt²
//
// source: the constant-acceleration kinematic equations, v = u + at and s = ut + ½at²,
//         AP Physics 1 formula sheet / IB data booklet.
//
// Exact, not approximate, and the distinction matters. resolveDynamics is called once per step and
// the acceleration it returns is held constant across that whole step, so acceleration is
// piecewise-constant by construction — one value per frame. The closed form above integrates a
// constant acceleration with no truncation error at all, so within a frame this is not a numerical
// method with an error term. It is the answer.
//
// This REPLACES semi-implicit Euler (x₁ = x₀ + v₁·dt, position advanced by the end-of-step
// velocity), which was wrong in a case the sliders can reach — see the exact-zero-landing test
// below, where it loses 1.47 m of real travel.
//
// It is still a stepper rather than one closed form over the whole run, because the parameters are
// re-resolved every frame: the sliders stay live while the block moves, so the student can change
// the applied force mid-run and the acceleration changes under them. A single closed form over the
// run would have to freeze the parameters at the start, and the whole point of this simulation is
// watching the block break loose as the force is dialled up past the threshold. Constant a WITHIN
// a frame; free to change BETWEEN frames.
//
// STOP-AT-REST — the guard that makes friction honest.
// A decelerating block can cross v = 0 partway through a frame. Left alone, the integrator carries
// the velocity straight through zero and out the other side: the block reverses, driven backwards
// by friction. That is physically impossible — kinetic friction removes energy, it never supplies
// it, and it cannot push a body in a direction it was never going.
//
// The closed form does NOT remove the need for this guard, and it is worth being clear why. Being
// exact for constant acceleration is only worth anything while the acceleration IS constant, and
// past the instant the block stops it is not: the block goes static, friction switches from −f_k to
// −F_applied, and this frame's `a` no longer describes it. So when the sign of v flips within a
// step, the velocity is clamped to exactly zero and the position advanced by the true stopping
// distance instead:
//
//   d = v₀² / (2·|a|)      from v² = u² + 2as with v = 0
//
// The next frame then re-enters resolveDynamics at v = 0, where the static test runs again. That
// is what lets a block coast to a halt and STAY halted under a force below the static ceiling —
// without this guard it would jitter back and forth across zero forever.
//
// test: THE EXACT-ZERO LANDING — v₀=2.94, F=0, m=2, μ_k=0.3, g=9.8 → a = −2.94, dt=1
//       v₁ = 2.94 + (−2.94)(1) = 0 EXACTLY. The sign never flips, so the stop-at-rest guard does
//       not fire — and it should not, because the block stops precisely at the end of the frame
//       rather than partway through it. The step is an ordinary one; it is the position formula
//       that has to be right.
//         semi-implicit Euler: x = v₁·dt = 0 × 1 = 0 m   ← the block stopped but never travelled.
//                                                          1.47 m lost, in a single frame. WRONG.
//         closed form:         x = 2.94(1) + ½(−2.94)(1²) = 1.47 m
//       Cross-check by a route with no dt in it at all — v² = u² + 2as with v = 0 gives
//       d = v₀²/(2|a|) = 8.6436/5.88 = 1.47 m. Same number, so the closed form and the guard agree
//       exactly at the boundary between them, which is what makes the two branches one method
//       rather than two.
// test: SIGN FLIP, guard fires — v₀=1, F=0, same block → a = −2.94, dt=1
//       unguarded: v₁ = 1 + (−2.94)(1) = −1.94  ← block reverses under friction. WRONG.
//       guarded:   v₁ = 0, distance = 1²/(2×2.94) = 0.17006802721088435 m
//       (the closed form would give 1(1) + ½(−2.94)(1²) = −0.47 m here: past the stop point it is
//       integrating an acceleration that no longer applies, which is exactly what the guard is for)
// test: ORDINARY STEP, 60 fps — v₀=6, F=0, same block, dt=0.0167
//       v₁ = 5.950902, x = 6(0.0167) + ½(−2.94)(0.0167²) = 0.0997900317 m. No sign flip.
// test: v₀=0, F=8 on the reference block → static, a=0, so v₁=0 and x is unchanged: 0(dt) + 0 = 0.
//       The block does not move at all, which is the whole content of the static case.
// test: v₀=0, F=12 on the reference block, dt=1 → breaks away, a=3.06
//       x = 0(1) + ½(3.06)(1²) = 1.53 m. Semi-implicit Euler gave a·dt² = 3.06 m here — twice the
//       real distance — so the fix corrects the launch frame as well as the landing one.
export function advance({ position, velocity, mass, g, muS, muK, appliedForce }, dt) {
  const dynamics = resolveDynamics({ mass, g, muS, muK, appliedForce, velocity })
  const nextVelocity = velocity + dynamics.acceleration * dt

  // The sign flipped, so the block came to rest inside this frame rather than at its end.
  if (velocity !== 0 && direction(nextVelocity) === -direction(velocity)) {
    const stoppingDistance = (velocity * velocity) / (2 * Math.abs(dynamics.acceleration))
    return {
      position: position + direction(velocity) * stoppingDistance,
      velocity: 0,
      dynamics,
    }
  }

  return {
    // x₁ = x₀ + v₀·dt + ½·a·dt²  — the ½·a·dt² term is the travel that semi-implicit Euler
    // (x₀ + v₁·dt) folded into its use of the end-of-step velocity, and dropped entirely when
    // that velocity landed on zero.
    position: position + velocity * dt + 0.5 * dynamics.acceleration * dt * dt,
    velocity: nextVelocity,
    dynamics,
  }
}
