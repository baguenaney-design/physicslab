// The A.1 topic folder — Kinematics.
//
// A.1 is the widest gap between what the syllabus covers and what is built: one simulation
// (projectile motion) sits inside a topic that also covers one-dimensional motion, the SUVAT
// relations, and reading displacement and velocity off graphs. The projectile simulation's own
// eyebrow has said so since it shipped — see the note on `projectile` in
// src/simulations/registry.js. This folder is that admission made navigable.
//
// Data only, no JSX — the same split registry.js makes. `kind` semantics are documented in a2.js,
// the first folder written.
//
// PLACEHOLDER: `descriptor` and `body` are TODO copy, and every taught item's `summary` is a TODO
// line. The topic `title` is the IB syllabus's own — it matches the A.1 card on the IB map — but
// the descriptor is NOT quoted syllabus wording and must not be invented; it is left marked so it
// gets written from the syllabus rather than from memory. The item titles are ours, describing
// what each section covers, exactly as A.2's "Force Types" and "Inclined Planes" are.
//
// Nothing in this file asserts a physical claim. No equation appears here.

import motionGraphs from './taught/a1-motion-graphs.js'
import suvat from './taught/a1-suvat.js'

export const A1_FOLDER = {
  // The syllabus's own title for the topic, matching the A.1 card on the IB map.
  title: 'Kinematics',

  // TODO copy — the syllabus's scope line for A.1, set in italic on the page. Not written.
  descriptor: '[TODO copy — syllabus scope line for A.1]',

  // TODO copy — our own coverage promise, the A.2 body's third-part counterpart. Not written.
  body: '[TODO copy — what this folder covers, and what is interactive versus taught]',

  // The header's code line, chosen by the ?from= origin — see the same key in a2.js. A.1 is
  // reached from both maps, so both numbers are carried and neither student sees the other's.
  codes: { ib: 'A.1', ap: 'AP Physics 1 · Unit 1' },

  // Where this topic sits in each syllabus. Keyed by curriculum, the same shape as `codes` above,
  // because the two are read the same way: the folder cards show every tag, and a taught item's
  // page shows only the one for the curriculum the student arrived on. A flat list could not do
  // the second — there was no way to ask it for the AP tag.
  tags: { ib: 'IB A.1', ap: 'AP Physics 1 · Unit 1' },

  // Ordered the way the topic is taught, not by what is built — the a2.js convention. Graphs and
  // the SUVAT relations both precede projectile motion, which applies them in two dimensions.
  // Whether graphs come before or after SUVAT is a teaching-order judgement, not a syllabus fact:
  // swap these two entries if the running order should differ.
  items: [
    {
      id: 'motion-graphs',
      kind: 'taught',
      title: 'Motion Graphs',
      // Scope, not a claim — it names the sub-topics this section will cover.
      subtitle: 'Displacement–time, velocity–time, gradient and area',
      summary: 'TODO — concept prose to be written and reviewed.',
      // The data file holding this section's content slots. Its presence is what gives the card
      // its "Read →" link and puts the page at /topic/a1/motion-graphs.
      content: motionGraphs,
    },
    {
      id: 'suvat',
      kind: 'taught',
      title: 'SUVAT and 1D Kinematics',
      subtitle: 'Motion under constant acceleration in one dimension',
      summary: 'TODO — concept prose to be written and reviewed.',
      content: suvat,
    },
    {
      id: 'projectile',
      kind: 'sim',
      title: 'Projectile Motion',
      summary:
        'Launch a projectile and watch the trajectory, the velocity components and the range ' +
        'resolve in real time. Four views: simulation, concept, practice and the grounded tutor.',
      // The existing route, unchanged and bare. TopicFolder appends ?from= and ?via= when it
      // renders the card — the origin is the page's business, not this file's.
      to: '/sim/projectile',
    },
  ],
}

export default A1_FOLDER
