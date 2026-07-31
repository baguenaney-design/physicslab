// test: m1=2, u1=3, m2=3, u2=-1 → v1f=-1.8, v2f=2.2
// (momentum: 2*3 + 3*-1 = 3 before; 2*-1.8 + 3*2.2 = 3 after — conserved)
// (KE: 0.5*2*3^2 + 0.5*3*-1^2 = 10.5 before; 0.5*2*-1.8^2 + 0.5*3*2.2^2 = 10.5 after — conserved)

// elastic collision: v1f = ((m1-m2)*u1 + 2*m2*u2) / (m1+m2)
//                    v2f = ((m2-m1)*u2 + 2*m1*u1) / (m1+m2)
// source: standard 1D elastic collision derivation (conservation of momentum + KE)
export function elasticCollision(m1, u1, m2, u2) {
  const v1f = ((m1 - m2) * u1 + 2 * m2 * u2) / (m1 + m2)
  const v2f = ((m2 - m1) * u2 + 2 * m1 * u1) / (m1 + m2)
  return { v1f, v2f }
}

// perfectly inelastic collision: v = (m1*u1 + m2*u2) / (m1+m2)
// source: conservation of momentum, both bodies move with combined velocity after impact
export function inelasticCollision(m1, u1, m2, u2) {
  const v = (m1 * u1 + m2 * u2) / (m1 + m2)
  return { v1f: v, v2f: v }
}

// kinetic energy: KE = 0.5 * m * v^2
export function kineticEnergy(m, v) {
  return 0.5 * m * v * v
}
