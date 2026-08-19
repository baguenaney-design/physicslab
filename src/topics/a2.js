// The A.2 topic folder.
//
// IB A.2 is one syllabus topic that is wider than the simulations behind it. Two of its items are
// built — Newton's second law and momentum — and the rest (the first and third laws, force types,
// inclined planes, connected bodies) have no simulation, and several may never need one. This
// file is the original experiment in showing a topic as a folder of its items rather than as a
// link to whichever item happens to have a canvas. That experiment is now the model A.1 and A.3
// follow; this file moved from src/simulations/a2Folder.js to sit beside them, and its copy came
// with it unchanged.
//
// Data only, no JSX — the same split registry.js makes, so the page component owns layout and
// this file owns what is in the topic.
//
// `kind` decides how TopicFolder renders an item:
//   'sim'       — a built simulation; `to` carries the real route, nothing is forked or rebuilt
//   'taught'    — reviewed content with no simulation; shows a PromissoryNote
//   'extension' — an optional tangent, explicitly not required for either exam
//
// A `taught` item here still has no `content` key, so its card shows no "Read →" link — A.2's
// taught pages are not written. A.1 and A.3 show what a filled one looks like.
//
// PLACEHOLDER: every taught item's `summary`, and the extension's, is a TODO line. The titles are
// real and final; that prose is not written and has not been through review. The two simulation
// summaries are real, because they describe pages that exist. Nothing in this file asserts a
// physical claim — the drag expression on the last item is a topic label, not a result — so there
// is no physics here to get wrong. The prose replacing the TODOs will need Peter's review.

export const A2_FOLDER = {
  // The syllabus's own title for the topic. Not a coined one: the folder is claiming to BE A.2,
  // so it takes A.2's name.
  title: 'Forces and momentum',
  descriptor:
    'The application of forces, equilibrium, and momentum across a range of physical scenarios.',
  body:
    'Everything the syllabus covers under this topic lives here — whether or not an interactive ' +
    'simulation exists for it yet. Items marked live are interactive; the rest are full taught ' +
    'content, with a note wherever a simulation is planned.',

  // The header's code line, chosen by the ?from= origin the student arrived with — the same
  // convention registry.js `eyebrows` uses, so a student who came from one curriculum is never
  // shown the other's numbering. No `ap` key: A.2 is reached from the IB map only, and it
  // straddles two AP units (Unit 2 and Unit 4), so there is no single AP number to assert.
  // TopicFolder falls back to `ib` when the origin has no entry.
  codes: { ib: 'A.2' },

  // Where this topic sits in each syllabus — keyed by curriculum, see the same key in a1.js. No
  // `ap` key, for the reason `codes` has none: A.2 straddles AP Unit 2 and Unit 4, so this topic
  // claims its IB location only and a taught page reached from AP falls back to it. The honest fix
  // the day A.2 gets taught content is per-item tags — each item does sit in one AP unit — not a
  // made-up topic-level number. An item may carry its own `tags` to override.
  tags: { ib: 'IB A.2' },

  // Ordered the way the topic is taught, NOT by which items have been built. Grouping the two
  // simulations at the top would order the topic by our progress rather than by the physics, and
  // would leave the taught items reading as a backlog. The LIVE label is what makes the
  // interactive items findable; it does not need position to do that job as well.
  items: [
    {
      id: 'first-and-third-laws',
      kind: 'taught',
      title: "Newton's First and Third Laws",
      summary: 'TODO — concept prose to be written and reviewed.',
    },
    {
      id: 'newtons-second',
      kind: 'sim',
      title: "Newton's Second Law",
      summary:
        'Push a block against static and kinetic friction and watch the free-body diagram resolve ' +
        'in real time. Four views: simulation, concept, practice and the grounded tutor.',
      // The existing route, unchanged and bare. TopicFolder appends ?from= and ?via= when it
      // renders the card — the origin is the page's business, not this file's.
      to: '/sim/newtons-second',
    },
    {
      id: 'force-types',
      kind: 'taught',
      title: 'Force Types',
      // Scope, not a claim — it says which sub-topics this item will cover.
      subtitle: 'Including terminal velocity and Stokes’ law',
      summary: 'TODO — concept prose to be written and reviewed.',
    },
    {
      id: 'inclined-planes',
      kind: 'taught',
      title: 'Inclined Planes',
      summary: 'TODO — concept prose to be written and reviewed.',
    },
    {
      id: 'connected-bodies',
      kind: 'taught',
      title: 'Connected Bodies and Tension',
      summary: 'TODO — concept prose to be written and reviewed.',
    },
    {
      id: 'momentum',
      kind: 'sim',
      title: 'Momentum and Impulse',
      summary:
        'Collide two blocks on an isolated track. Total momentum is conserved in both modes; ' +
        'kinetic energy only in the elastic one, and the inelastic mode shows how much is lost.',
      // As above: the real momentum route, reached through the folder instead of through its own
      // map card. The simulation itself is untouched.
      to: '/sim/momentum',
    },
    {
      id: 'quadratic-drag',
      kind: 'extension',
      title: 'Quadratic Drag',
      // The subject of the extension, named. Not a derived or asserted result — see the header
      // note. KaTeX source, rendered by TopicFolder: CLAUDE.md forbids equations as plain text.
      // Symbols follow the IB data booklet.
      formula: 'F_\\mathrm{d} = \\tfrac{1}{2}\\rho v^2 C_\\mathrm{d} A',
      subtitle: 'Why real falling objects leave the linear model behind',
      summary: 'TODO — extension prose to be written and reviewed.',
    },
  ],
}

export default A2_FOLDER
