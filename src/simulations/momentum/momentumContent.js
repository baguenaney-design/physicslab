// Momentum curriculum content, parsed from docs/content/momentum.md.
//
// The markdown file is the single source of truth and is pending review by Peter Syrenne. The
// parser itself is shared across topics — see src/simulations/contentParser.js.
//
// Vite's ?raw suffix inlines the file as a string at build time. docs/ sits inside the project
// root so it is already covered by the default server.fs.allow — no vite.config.js change.
import raw from '../../../docs/content/momentum.md?raw'
import { parseTopicContent } from '../contentParser.js'

// Expected parse of the current momentum.md — if a content edit breaks a rule in the parser,
// these counts change and the panel will visibly lose a section:
//   summary        4 paragraphs
//   examTips       1 tip (hoisted out of Concept Summary)
//   equations      3
//   questionGroups 4  →  IB Multiple Choice (2 questions, both with answers)
//                        IB Paper 2 Written Response (1 question, 6 parts, no answer)
//                        AP Multiple Choice (2 questions, both with answers)
//                        AP Free Response (1 question, 3 parts, 4 figures, 3 solution parts)

export default parseTopicContent(raw, 'Momentum')
