// The A.2 topic folder — DEMO.
//
// IB A.2 is one syllabus topic that is wider than the simulations behind it. Two of its items are
// built — Newton's second law and momentum — and the rest (the first and third laws, force types,
// inclined planes, connected bodies) have no simulation, and several may never need one. This
// file is the experiment in showing a topic as a folder of its items rather than as a link to
// whichever item happens to have a canvas.
//
// Data only, no JSX — the same split registry.js makes, so the page component owns layout and
// this file owns what is in the topic.
//
// `kind` decides how TopicFolder renders an item:
//   'sim'       — a built simulation; `to` carries the real route, nothing is forked or rebuilt
//   'taught'    — reviewed content with no simulation; shows a PromissoryNote
//   'extension' — an optional tangent, explicitly not required for either exam
//
// PLACEHOLDER: every taught item's `summary`, and the extension's, is a TODO line. The titles are
// real and final; that prose is not written and has not been through review. The two simulation
// summaries are real, because they describe pages that exist. Nothing in this file asserts a
// physical claim — the drag expression on the last item is a topic label, not a result — so there
// is no physics here to get wrong. The prose replacing the TODOs will need Peter's review.

export const A2_FOLDER = {
  code: 'A.2',
  // The syllabus's own title for the topic. Not a coined one: the folder is claiming to BE A.2,
  // so it takes A.2's name.
  title: 'Forces and momentum',
  descriptor:
    'The application of forces, equilibrium, and momentum across a range of physical scenarios.',
  body:
    'Everything the syllabus covers under this topic lives here — whether or not an interactive ' +
    'simulation exists for it yet. Items marked live are interactive; the rest are full taught ' +
    'content, with a note wherever a simulation is planned.',
  backLink: { label: '← Back to IB', to: '/ib' },

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
      // The existing route, unchanged. ?from=a2 is an origin key in SimulationPage's ORIGINS map,
      // so the back link inside the simulation returns here rather than to the full map.
      to: '/sim/newtons-second?from=a2',
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
      to: '/sim/momentum?from=a2',
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
