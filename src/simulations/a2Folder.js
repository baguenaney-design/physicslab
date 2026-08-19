// The A.2 topic folder — DEMO.
//
// IB A.2 is one syllabus topic that is much broader than the one simulation behind it: a single
// block on a flat surface. Inclined planes, the first and third laws, force types and connected
// bodies are all A.2 and have no simulation, and several of them may never need one. This file
// is the experiment in showing a topic as a folder of items rather than as a link to whichever
// item happens to have a canvas.
//
// Data only, no JSX — the same split registry.js makes, so the page component owns layout and
// this file owns what is in the topic.
//
// `kind` decides how TopicFolder renders an item:
//   'sim'       — a built simulation; `to` carries the real route, nothing is forked or rebuilt
//   'taught'    — reviewed content with no simulation; shows a PromissoryNote
//   'extension' — an optional tangent, explicitly not required for either exam
//
// PLACEHOLDER: every `summary` below except the simulation's is a TODO line. The titles are real
// and final; the prose is not written and has not been through review. Nothing in this file
// asserts a physical claim — the drag expression in item 6 is a topic label, not a result — so
// there is no physics here to get wrong. The prose that replaces these TODOs will need Peter's
// review before it ships.

export const A2_FOLDER = {
  code: 'A.2',
  title: 'Forces and Dynamics',
  blurb:
    'Everything in the syllabus topic, whether or not a simulation exists for it yet. One item is ' +
    'live and interactive; the rest are taught content, with a note where a simulation is planned.',
  backLink: { label: '← Back to IB', to: '/ib' },

  items: [
    {
      id: 'newtons-second',
      kind: 'sim',
      title: "Newton's Second Law",
      summary:
        'Push a block against static and kinetic friction and watch the free-body diagram resolve ' +
        'in real time. Four views: simulation, concept, practice and the grounded tutor.',
      // The existing route, unchanged. ?from=a2 is a new origin key in SimulationPage's ORIGINS
      // map, so the back link inside the simulation returns here rather than to the full map.
      to: '/sim/newtons-second?from=a2',
    },
    {
      id: 'inclined-planes',
      kind: 'taught',
      title: 'Inclined Planes',
      summary: 'TODO — concept prose to be written and reviewed.',
    },
    {
      id: 'first-and-third-laws',
      kind: 'taught',
      title: "Newton's First and Third Laws",
      summary: 'TODO — concept prose to be written and reviewed.',
    },
    {
      id: 'force-types',
      kind: 'taught',
      title: 'Force Types',
      // The parenthetical is scope, not a claim — it says which sub-topics this item will cover.
      subtitle: 'Including terminal velocity and Stokes’ law',
      summary: 'TODO — concept prose to be written and reviewed.',
    },
    {
      id: 'connected-bodies',
      kind: 'taught',
      title: 'Connected Bodies and Tension',
      summary: 'TODO — concept prose to be written and reviewed.',
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
