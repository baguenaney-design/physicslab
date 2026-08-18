// Newton's second law curriculum content, parsed from docs/content/newtons-second.md by the shared
// parser in src/simulations/contentParser.js.
//
// STATUS: the Key Equations section is complete and canonical — those are formula-sheet
// statements, not authored explanation. The Concept Summary is a marked TODO placeholder and
// every question group is PENDING. Both are written by the founders and reviewed by Peter
// Syrenne before publish; nothing here invents them.
import raw from '../../../docs/content/newtons-second.md?raw'
import { parseTopicContent } from '../contentParser.js'

// Expected parse of the current newtons-second.md:
//   summary        2 paragraphs (both TODO placeholder text)
//   examTips       0 — none authored yet
//   equations      8
//   questionGroups 4, all status 'pending' → the panel shows the in-drafting state for each,
//                  and countQuestions() returns 0, which is what makes the Practice nav sublabel
//                  read "In drafting" rather than "0 questions"

export default parseTopicContent(raw, "Newton's Second Law")
