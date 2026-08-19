// Conservation of Energy — taught content for IB A.3 / AP Physics 1 Unit 3.
//
// PLACEHOLDER. Every field below is an empty slot: no prose, no equation, no question and no
// solution has been written or reviewed. Filling this file is the whole job of writing this
// section — TaughtItem.jsx owns the layout and never needs editing to add content.
//
// The slot shape, and what each field renders as while it is null, is documented once at the top
// of src/components/ui/TaughtItem.jsx. The section title and its syllabus tags are NOT here: they
// live on the item in the topic folder file, so the card and the page cannot disagree.
//
// `equations` is seeded with two empty slots purely so the shape is visible on the page. The
// count is arbitrary — add or remove entries to match what the section actually needs. A slot
// with `latex: null` renders as a marked TODO; the moment it holds a LaTeX string it renders
// through KaTeX. Nothing is seeded, so nothing false can render.

export default {
  concept: null,

  equations: [
    { latex: null, caption: null },
    { latex: null, caption: null },
  ],

  workedExample: null,

  // CLAUDE.md sets a floor of three questions per topic. One of each tag is a starting spread,
  // not a rule — retag or add as the section demands.
  questions: [
    { id: 'q1', type: 'AP FRQ', text: null, solution: null },
    { id: 'q2', type: 'IB Paper 2', text: null, solution: null },
    { id: 'q3', type: 'Conceptual', text: null, solution: null },
  ],
}
