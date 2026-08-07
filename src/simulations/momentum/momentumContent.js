// Parses docs/content/momentum.md into the structure ContentPanel renders.
//
// The markdown file is the single source of truth for momentum curriculum content and is
// pending review by Peter Syrenne — nothing here writes back to it. Ordering, the Exam Tips
// section, and the position of the F-t note are all derived at parse time so the file stays
// exactly as authored.
//
// Vite's ?raw suffix inlines the file as a string at build time. docs/ sits inside the project
// root so it is already covered by the default server.fs.allow — no vite.config.js change.
import raw from '../../../docs/content/momentum.md?raw'

// Expected parse of the current momentum.md — if a content edit breaks a rule below, these
// counts change and the panel will visibly lose a section:
//   summary        4 paragraphs
//   examTips       1 tip (hoisted out of Concept Summary)
//   equations      3
//   questionGroups 4  →  IB Multiple Choice (2 questions, both with answers)
//                        IB Paper 2 Written Response (1 question, 6 parts, no answer)
//                        AP Multiple Choice (pending)
//                        AP Free Response (pending)

const EXAM_TIP_RE = /^\*\*Exam Tips?:\*\*\s*/
const QUESTION_RE = /^\*\*(Question\s+\d+)\*\*\s*(?:\*\(([^)]*)\)\*)?\s*$/
const CITATION_RE = /^\*([^*].*)\*$/
const ANSWER_RE = /^\*\*Answer:\s*([^*]+?)\s*\*\*\s*[—–-]?\s*([\s\S]*)$/
const NOTE_RE = /^Note:\s*/
const PART_RE = /^\*\*\(([^)]+)\)\*\*\s*([\s\S]*)$/
const MARKS_RE = /\s*\*\*\[(\d+)\]\*\*\s*$/
const TOTAL_RE = /^\*\*Total:/
const OPTION_RE = /^([A-Z])\)\s*(.*)$/
const PENDING_RE = /^PENDING\b/
const TABLE_SEPARATOR_RE = /^[\s|:-]+$/

// Splits text on a heading marker ('## ' / '### '). Safe against deeper headings because
// '### x'.startsWith('## ') is false — the third character is '#', not a space.
function splitByHeading(text, marker) {
  const sections = []
  let current = null
  for (const line of text.split('\n')) {
    if (line.startsWith(marker)) {
      current = { heading: line.slice(marker.length).trim(), lines: [] }
      sections.push(current)
    } else if (current) {
      current.lines.push(line)
    }
  }
  return sections.map((s) => ({ heading: s.heading, body: s.lines.join('\n').trim() }))
}

// Markdown paragraphs: blank-line-separated runs. Lines inside a block may still be
// meaningful individually (MC options use trailing-double-space hard breaks, table rows are
// one line each), so blocks keep their newlines for the classifier below.
function toBlocks(body) {
  return body
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean)
}

function slug(heading) {
  return heading.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function parseTable(block) {
  const rows = block.split('\n').filter((l) => l.trim().startsWith('|'))
  const cells = (row) =>
    row.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim())
  return {
    type: 'table',
    header: cells(rows[0]),
    rows: rows.slice(1).filter((r) => !TABLE_SEPARATOR_RE.test(r)).map(cells),
  }
}

function parseOptions(lines) {
  return {
    type: 'options',
    items: lines.map((l) => {
      const [, letter, text] = l.trim().match(OPTION_RE)
      return { letter, text }
    }),
  }
}

function parsePart(block) {
  const [, label, rest] = block.match(PART_RE)
  const marks = rest.match(MARKS_RE)
  return {
    type: 'part',
    label,
    text: rest.replace(MARKS_RE, '').trim(),
    marks: marks ? Number(marks[1]) : null,
  }
}

// Turns one markdown block into a renderable block, or into answer/note metadata on the
// question it belongs to. Returns null when the block was consumed as metadata.
function classifyBlock(block, question) {
  const answer = block.match(ANSWER_RE)
  if (answer) {
    question.answer = { key: answer[1].trim(), explanation: answer[2].trim() }
    return null
  }
  if (NOTE_RE.test(block)) {
    question.notes.push(block.replace(NOTE_RE, '').trim())
    return null
  }
  if (block.startsWith('|')) return parseTable(block)
  if (TOTAL_RE.test(block)) return { type: 'total', text: block.replace(/\*\*/g, '').trim() }
  if (PART_RE.test(block)) return parsePart(block)

  const lines = block.split('\n').map((l) => l.trim()).filter(Boolean)
  if (lines.length > 1 && lines.every((l) => OPTION_RE.test(l))) return parseOptions(lines)

  return { type: 'para', text: block }
}

function parseQuestions(groupId, body) {
  const questions = []
  let current = null

  const start = (label, citation) => {
    current = { id: `${groupId}-q${questions.length + 1}`, label, citation, blocks: [], answer: null, notes: [] }
    questions.push(current)
    return current
  }

  for (const block of toBlocks(body)) {
    const marker = block.match(QUESTION_RE)
    if (marker) {
      start(marker[1], marker[2] ? marker[2].trim() : null)
      continue
    }
    // A written-response group has no **Question N** marker — the whole group is one
    // question built from its **(a)** / **(i)** parts, and its citation is a standalone
    // italic line at the top.
    if (!current) {
      const citation = block.match(CITATION_RE)
      if (citation) {
        start(null, citation[1].trim())
        continue
      }
      start(null, null)
    }
    const parsed = classifyBlock(block, current)
    if (parsed) current.blocks.push(parsed)
  }

  return questions
}

// IB before AP, and within each curriculum multiple choice before longer written responses.
// Derived from the headings, so the source file needs no reordering: its order is
// IB-MC / AP-MC / AP-FRQ / IB-Paper-2 and it renders IB-MC / IB-Paper-2 / AP-MC / AP-FRQ.
const CURRICULUM_ORDER = { IB: 0, AP: 1 }
const FORMAT_ORDER = { mc: 0, written: 1 }

function parseGroup(section) {
  const curriculum = /^AP\b/.test(section.heading) ? 'AP' : 'IB'
  const format = /multiple choice/i.test(section.heading) ? 'mc' : 'written'
  const pending = PENDING_RE.test(section.body)
  return {
    id: slug(section.heading),
    heading: section.heading,
    curriculum,
    format,
    status: pending ? 'pending' : 'ready',
    questions: pending ? [] : parseQuestions(slug(section.heading), section.body),
  }
}

function parseEquations(body) {
  return body
    .split('\n')
    .map((l) => l.replace(/^[-*]\s+/, '').trim())
    .filter(Boolean)
    .map((line) => {
      // $$...$$ (display) is checked first so it is not mistaken for two empty $...$ spans.
      const math = line.match(/\$\$([\s\S]+?)\$\$/) || line.match(/\$([^$]+)\$/)
      if (!math) return { tex: null, caption: line }
      const caption = (line.slice(0, math.index) + line.slice(math.index + math[0].length)).trim()
      return { tex: math[1].trim(), caption }
    })
}

function parseMomentumContent(markdown) {
  const titleMatch = markdown.match(/^#\s+(.+)$/m)
  const title = titleMatch ? titleMatch[1].trim() : 'Momentum'
  const sections = splitByHeading(markdown, '## ')
  const find = (name) => sections.find((s) => s.heading.toLowerCase() === name)

  const summaryBlocks = toBlocks(find('concept summary')?.body || '')
  const summary = summaryBlocks.filter((b) => !EXAM_TIP_RE.test(b))
  // The exam tip lives inline in Concept Summary in the source; the panel shows it as its
  // own section, so it is hoisted here rather than by editing the reviewed markdown.
  const examTips = summaryBlocks.filter((b) => EXAM_TIP_RE.test(b)).map((b) => b.replace(EXAM_TIP_RE, ''))

  const questionGroups = splitByHeading(find('practice questions')?.body || '', '### ')
    .map(parseGroup)
    .sort(
      (a, b) =>
        CURRICULUM_ORDER[a.curriculum] - CURRICULUM_ORDER[b.curriculum] ||
        FORMAT_ORDER[a.format] - FORMAT_ORDER[b.format],
    )

  return {
    title,
    summary,
    examTips,
    equations: parseEquations(find('key equations')?.body || ''),
    questionGroups,
  }
}

export default parseMomentumContent(raw)
export { parseMomentumContent }
