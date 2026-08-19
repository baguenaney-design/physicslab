import { useState } from 'react'
import { BlockMath, InlineMath } from 'react-katex'
// Imported here for the same reason TopicFolder.jsx and contentPrimitives.jsx import it: this
// component is a separate entry point into KaTeX, and equations render unstyled without it.
import 'katex/dist/katex.min.css'
import PromissoryNote from './PromissoryNote'
// Reused rather than reimplemented: renderInline is the project's one inline-markdown-plus-KaTeX
// parser. It is register-neutral — it returns <strong>, <em>, InlineMath and BlockMath and sets no
// colour of its own — so the same parser serves the instrument-register content panels and this
// editorial page. The rest of contentPrimitives.jsx is wired to --instrument-* tokens and is NOT
// usable here; this is the one export that is.
import { renderInline } from '../sim/contentPrimitives.jsx'

// THE taught-item container. Every taught section on every topic renders through this component,
// so that writing content later means filling a data file and never editing JSX.
//
// Editorial register — a taught item is curriculum-map territory, not instrument territory. The
// register switch happens when a student opens a SIMULATION, not when they open reading material.
// See CLAUDE.md "Visual design".
//
// ---------------------------------------------------------------------------------------------
// THE DATA SHAPE. One object per taught section, living in src/topics/taught/<topic>-<id>.js.
// Every field below is optional; while a field is null or empty the container renders a marked
// TODO slot in its place, so an unwritten section is visibly unwritten rather than silently
// missing. Nothing here invents content — a null equation renders as a slot, never as an equation.
//
//   {
//     concept:       string | string[] | null    // paragraphs; $...$ and $$...$$ render as KaTeX
//     equations:     [{ latex: string|null, caption: string|null }]
//     workedExample: string | string[] | null    // same inline syntax as concept
//     questions:     [{ id, type, text: string|null, solution: string|string[]|null }]
//   }
//
// `type` is one of the three tags CLAUDE.md defines: 'AP FRQ', 'IB Paper 2', 'Conceptual'.
// A question's solution is gated behind a reveal, matching the Practice panel inside the
// simulations; until a solution is written the control is inert and says so.
//
// The section TITLE and its syllabus TAGS are NOT part of this shape. They live on the item in
// the topic folder file, so the card in the folder and the page it opens cannot disagree.
// ---------------------------------------------------------------------------------------------

const MEASURE = '68ch'

const microLabel = {
  fontSize: '11px',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--editorial-text-secondary)',
}

// A slot with nothing in it yet. Dashed, so at a glance an unwritten section reads as scaffolding
// rather than as a design element — the same signal the extension card's dashed border carries in
// TopicFolder.jsx.
function TodoSlot({ label }) {
  return (
    <div
      style={{
        padding: '12px 14px',
        border: '1px dashed var(--editorial-border)',
        borderRadius: 'var(--radius-max)',
        fontSize: '13px',
        color: 'var(--editorial-text-secondary)',
      }}
    >
      TODO — {label}
    </div>
  )
}

function Section({ title, children }) {
  return (
    <section style={{ marginTop: '32px' }}>
      <h2
        style={{
          ...microLabel,
          fontSize: '12px',
          fontWeight: 600,
          margin: '0 0 12px',
          paddingBottom: '8px',
          borderBottom: '1px solid var(--editorial-border)',
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  )
}

// A written field arrives either as one string or as an array of paragraphs; both are normal, and
// the caller should not have to care which. Empty strings are dropped so a stray '' never renders
// as a blank paragraph that looks like a layout bug.
function toParagraphs(value) {
  if (!value) return []
  return (Array.isArray(value) ? value : [value]).filter((p) => typeof p === 'string' && p.trim())
}

function Prose({ value, todoLabel, keyPrefix }) {
  const paragraphs = toParagraphs(value)
  if (paragraphs.length === 0) return <TodoSlot label={todoLabel} />

  return paragraphs.map((paragraph, i) => (
    <p
      key={`${keyPrefix}-p${i}`}
      style={{
        fontSize: '15px',
        lineHeight: 1.7,
        maxWidth: MEASURE,
        margin: i === 0 ? '0 0 12px' : '0 0 12px',
        color: 'var(--editorial-text)',
      }}
    >
      {renderInline(paragraph, `${keyPrefix}-p${i}`)}
    </p>
  ))
}

// An equation slot. `latex` null means nobody has written it yet, and it renders as a slot rather
// than as a guess — this container never supplies a formula of its own.
function Equation({ equation, keyPrefix }) {
  const hasLatex = typeof equation.latex === 'string' && equation.latex.trim()

  return (
    <div
      style={{
        padding: hasLatex ? '14px 16px' : 0,
        marginBottom: '10px',
        border: hasLatex ? '1px solid var(--editorial-border)' : 'none',
        borderRadius: 'var(--radius-max)',
      }}
    >
      {hasLatex ? (
        <BlockMath math={equation.latex} />
      ) : (
        <TodoSlot label="equation LaTeX not written" />
      )}
      {equation.caption && (
        <div
          style={{
            marginTop: '10px',
            fontSize: '13px',
            lineHeight: 1.6,
            maxWidth: MEASURE,
            color: 'var(--editorial-text-secondary)',
          }}
        >
          {renderInline(equation.caption, `${keyPrefix}-cap`)}
        </div>
      )}
    </div>
  )
}

// The question tag. All three types take the same accent — the tag's job is to say which paper a
// question is pitched at, and colour-coding them would need colours tokens.css does not define
// for the editorial register.
function TypeTag({ type }) {
  return <span style={{ ...microLabel, color: 'var(--editorial-accent)' }}>{type}</span>
}

// The gate matches the Practice panel inside a simulation: a student commits to an attempt before
// seeing the working. Until a solution is written there is nothing to gate, so the control is
// disabled and says which of the two states it is in — an inert button that looked live would
// read as a bug.
function Question({ question, index }) {
  const [revealed, setRevealed] = useState(false)

  const solution = toParagraphs(question.solution)
  const hasSolution = solution.length > 0

  return (
    <div
      style={{
        padding: '16px',
        marginBottom: '12px',
        border: '1px solid var(--editorial-border)',
        borderRadius: 'var(--radius-max)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '10px' }}>
        <span style={{ ...microLabel }}>Q{index + 1}</span>
        <TypeTag type={question.type} />
      </div>

      {question.text ? (
        <div style={{ fontSize: '15px', lineHeight: 1.7, maxWidth: MEASURE, color: 'var(--editorial-text)' }}>
          {renderInline(question.text, `${question.id}-text`)}
        </div>
      ) : (
        <TodoSlot label={`${question.type} question text not written`} />
      )}

      <button
        type="button"
        disabled={!hasSolution}
        onClick={() => setRevealed((r) => !r)}
        style={{
          marginTop: '12px',
          fontFamily: 'var(--editorial-font)',
          fontSize: '13px',
          padding: '6px 16px',
          borderRadius: 'var(--radius-max)',
          border: '1px solid var(--editorial-border)',
          background: 'transparent',
          color: hasSolution ? 'var(--editorial-accent)' : 'var(--editorial-text-secondary)',
          cursor: hasSolution ? 'pointer' : 'default',
        }}
      >
        {hasSolution ? (revealed ? 'Hide solution' : 'Reveal solution') : 'Solution — TODO'}
      </button>

      {hasSolution && revealed && (
        <div style={{ marginTop: '12px', borderLeft: '2px solid var(--editorial-accent)', paddingLeft: '12px' }}>
          <Prose value={solution} todoLabel="solution not written" keyPrefix={`${question.id}-sol`} />
        </div>
      )}
    </div>
  )
}

function TaughtItem({ item, tags, content }) {
  const equations = content?.equations ?? []
  const questions = content?.questions ?? []

  return (
    <article>
      {tags.length > 0 && (
        <div style={{ display: 'flex', gap: '16px', marginBottom: '10px' }}>
          {tags.map((tag) => (
            <span key={tag} style={{ ...microLabel, color: 'var(--editorial-accent)' }}>
              {tag}
            </span>
          ))}
        </div>
      )}

      <h1 style={{ fontSize: '30px', fontWeight: 600, letterSpacing: '-0.02em', margin: '0 0 8px' }}>
        {item.title}
      </h1>

      {/* The item's scope line from the folder — a topic label or a list of sub-topics, never a
          derived result. .katex sets no colour, so a formula inherits this row's colour. */}
      {(item.formula || item.subtitle) && (
        <div style={{ fontSize: '14px', color: 'var(--editorial-text-secondary)', maxWidth: MEASURE }}>
          {item.formula && <InlineMath math={item.formula} />}
          {item.formula && item.subtitle && <span> — </span>}
          {item.subtitle}
        </div>
      )}

      <PromissoryNote />

      <Section title="Concept">
        <Prose value={content?.concept} todoLabel="concept prose not written" keyPrefix={`${item.id}-concept`} />
      </Section>

      <Section title="Key equations">
        {equations.length === 0 ? (
          <TodoSlot label="key equations not chosen" />
        ) : (
          equations.map((equation, i) => (
            <Equation key={`${item.id}-eq${i}`} equation={equation} keyPrefix={`${item.id}-eq${i}`} />
          ))
        )}
      </Section>

      <Section title="Worked example">
        <Prose value={content?.workedExample} todoLabel="worked example not written" keyPrefix={`${item.id}-worked`} />
      </Section>

      <Section title="Practice questions">
        {questions.length === 0 ? (
          <TodoSlot label="practice questions not written" />
        ) : (
          questions.map((question, i) => (
            <Question key={question.id} question={question} index={i} />
          ))
        )}
      </Section>
    </article>
  )
}

export default TaughtItem
