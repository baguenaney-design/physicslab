// The A.3 topic folder — Work, energy and power.
//
// A.3 has no simulation at all yet. An energy simulation is planned separately, and until it
// lands every item here is taught content with a promissory note. That makes A.3 the clearest
// case for the folder model: without it the topic is a greyed-out card on both maps and a student
// sees nothing, when in fact the whole topic is teachable text.
//
// Data only, no JSX — the same split registry.js makes. `kind` semantics are documented in a2.js,
// the first folder written.
//
// PLACEHOLDER: `descriptor` and `body` are TODO copy, and every item's `summary` is a TODO line.
// The topic `title` is the IB syllabus's own — it matches the A.3 card on the IB map — but the
// descriptor is NOT quoted syllabus wording and is left marked so it gets written from the
// syllabus rather than from memory. The item titles are ours, as A.2's are.
//
// The expressions on the `work` and `power` subtitles are topic LABELS, naming which relation
// each section is about — the role A.2's drag expression plays. Nothing here is derived, and no
// claim is made about any of them; they are rendered by KaTeX because CLAUDE.md forbids equations
// as plain text, not because they are results. Symbols follow the IB data booklet.

import work from './taught/a3-work.js'
import kineticPotential from './taught/a3-kinetic-potential-energy.js'
import conservation from './taught/a3-conservation-of-energy.js'
import power from './taught/a3-power.js'

export const A3_FOLDER = {
  // The syllabus's own title for the topic, matching the A.3 card on the IB map.
  title: 'Work, energy and power',

  // TODO copy — the syllabus's scope line for A.3, set in italic on the page. Not written.
  descriptor: '[TODO copy — syllabus scope line for A.3]',

  // TODO copy — our own coverage promise, the A.2 body's third-part counterpart. Not written.
  body: '[TODO copy — what this folder covers, and that an energy simulation is planned]',

  // The header's code line, chosen by the ?from= origin — see the same key in a2.js.
  codes: { ib: 'A.3', ap: 'AP Physics 1 · Unit 3' },

  // Where this topic sits in each syllabus — keyed by curriculum, see the same key in a1.js.
  tags: { ib: 'IB A.3', ap: 'AP Physics 1 · Unit 3' },

  // Ordered the way the topic is taught, the a2.js convention: work defines the energy transfer,
  // the two stores follow, conservation ties them together, and power puts a rate on all of it.
  items: [
    {
      id: 'work',
      kind: 'taught',
      title: 'Work Done by a Force',
      // A topic label, not a result — see the file header.
      formula: 'W = Fd\\cos\\theta',
      summary: 'TODO — concept prose to be written and reviewed.',
      // The data file holding this section's content slots. Its presence is what gives the card
      // its "Read →" link and puts the page at /topic/a3/work.
      content: work,
    },
    {
      id: 'kinetic-potential-energy',
      kind: 'taught',
      title: 'Kinetic and Potential Energy',
      // Scope, not a claim — it names the sub-topics this section will cover.
      subtitle: 'Kinetic, gravitational potential and elastic potential stores',
      summary: 'TODO — concept prose to be written and reviewed.',
      content: kineticPotential,
    },
    {
      id: 'conservation-of-energy',
      kind: 'taught',
      title: 'Conservation of Energy',
      subtitle: 'Energy transfer between stores, and efficiency',
      summary: 'TODO — concept prose to be written and reviewed.',
      content: conservation,
    },
    {
      id: 'power',
      kind: 'taught',
      title: 'Power',
      // Topic labels, not results — see the file header.
      formula: 'P = \\frac{W}{t} \\qquad P = Fv',
      summary: 'TODO — concept prose to be written and reviewed.',
      content: power,
    },
  ],
}

export default A3_FOLDER
