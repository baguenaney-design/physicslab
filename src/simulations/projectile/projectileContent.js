// Projectile curriculum content, parsed from docs/content/projectile.md by the shared parser in
// src/simulations/contentParser.js.
//
// STATUS: the Key Equations section is complete and canonical — those are formula-sheet
// statements, not authored explanation. The Concept Summary is a marked TODO placeholder and
// every question group is PENDING. Both are written by the founders and reviewed by Peter
// Syrenne before publish; nothing here invents them.
import raw from '../../../docs/content/projectile.md?raw'
import { parseTopicContent } from '../contentParser.js'

// Expected parse of the current projectile.md:
//   summary        2 paragraphs (both TODO placeholder text)
//   examTips       0 — none authored yet
//   equations      8
//   questionGroups 4, all status 'pending' → the panel shows the in-drafting state for each

export default parseTopicContent(raw, 'Projectile Motion')
