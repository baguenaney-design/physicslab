import { useState } from 'react'
import { InlineMath, BlockMath } from 'react-katex'
// KaTeX ships its own stylesheet and equations render unstyled without it. This is the first
// component-level CSS import in the project — it lives here because ContentPanel is the only
// consumer. .katex sets no colour, so equations inherit --instrument-text from their container.
import 'katex/dist/katex.min.css'
import content from './momentumContent.js'

// Curriculum accents map to the two block colours used on the canvas, so a student reads the
// same amber/blue language in the content panel as in the simulation.
const ACCENT = {
  IB: 'var(--instrument-block-b)', // amber — Block B
  AP: 'var(--instrument-block-a)', // blue  — Block A
}

const BODY = 'var(--instrument-body-font)'
const MONO = 'var(--instrument-data-font)'

// The editorial feel inside the instrument register comes from typography, not from a light
// background: a longer measure, looser leading and real paragraph spacing, against the tight
// 13px rhythm of Controls and Readout.
const prose = {
  fontFamily: BODY,
  fontSize: '14px',
  lineHeight: 1.65,
  color: 'var(--instrument-text)',
  maxWidth: '65ch',
}

const card = {
  background: 'var(--instrument-bg)',
  border: '1px solid var(--instrument-grid)',
  borderRadius: 'var(--radius-max)',
  padding: '14px 16px',
}

const microLabel = {
  fontFamily: MONO,
  fontSize: '11px',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
}

// --- inline markdown -------------------------------------------------------------------

// Emphasis inside a plain text run. Bold first so **x** is not read as two *x* spans.
function renderEmphasis(text, keyPrefix) {
  const out = []
  const re = /\*\*([^*]+)\*\*|\*([^*]+)\*/g
  let last = 0
  let match
  let i = 0
  while ((match = re.exec(text)) !== null) {
    if (match.index > last) out.push(text.slice(last, match.index))
    if (match[1] !== undefined) {
      out.push(<strong key={`${keyPrefix}-b${i}`} style={{ fontWeight: 600 }}>{match[1]}</strong>)
    } else {
      out.push(<em key={`${keyPrefix}-i${i}`}>{match[2]}</em>)
    }
    last = re.lastIndex
    i += 1
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

// Splits a text run into KaTeX and non-KaTeX segments. $$...$$ is matched before $...$ so a
// display block is never read as two empty inline spans.
function renderInline(text, keyPrefix) {
  const out = []
  const re = /\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g
  let last = 0
  let match
  let i = 0
  while ((match = re.exec(text)) !== null) {
    if (match.index > last) out.push(...renderEmphasis(text.slice(last, match.index), `${keyPrefix}-t${i}`))
    if (match[1] !== undefined) {
      out.push(<BlockMath key={`${keyPrefix}-d${i}`} math={match[1]} />)
    } else {
      out.push(<InlineMath key={`${keyPrefix}-m${i}`} math={match[2]} />)
    }
    last = re.lastIndex
    i += 1
  }
  if (last < text.length) out.push(...renderEmphasis(text.slice(last), `${keyPrefix}-t${i}`))
  return out
}

// --- layout primitives -----------------------------------------------------------------

function Section({ title, children }) {
  return (
    <section style={{ marginBottom: '28px' }}>
      <h2
        style={{
          margin: '0 0 12px',
          paddingBottom: '6px',
          borderBottom: '1px solid var(--instrument-grid)',
          fontFamily: BODY,
          fontSize: '11px',
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--editorial-text-secondary)',
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  )
}

// Paragraphs render as <div>, not <p>: display maths emits a block-level element and nesting
// that inside a <p> is invalid markup.
function Paragraph({ text, id, style }) {
  return <div style={{ ...prose, marginBottom: '12px', ...style }}>{renderInline(text, id)}</div>
}

// --- question pieces -------------------------------------------------------------------

function Options({ items, id }) {
  return (
    <div style={{ marginBottom: '12px' }}>
      {items.map((option) => (
        <div key={option.letter} style={{ display: 'flex', gap: '10px', marginBottom: '4px' }}>
          <span style={{ fontFamily: MONO, fontSize: '14px', color: 'var(--instrument-text)', minWidth: '1.6em' }}>
            {option.letter})
          </span>
          <span style={prose}>{renderInline(option.text, `${id}-${option.letter}`)}</span>
        </div>
      ))}
    </div>
  )
}

function Table({ header, rows, id }) {
  const cell = {
    padding: '6px 8px',
    borderBottom: '1px solid var(--instrument-grid)',
    textAlign: 'left',
    verticalAlign: 'top',
  }
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '12px' }}>
      <thead>
        <tr>
          {header.map((heading, i) => (
            <th
              key={`${id}-h${i}`}
              style={{ ...cell, fontFamily: BODY, fontSize: '12px', fontWeight: 600, color: 'var(--editorial-text-secondary)' }}
            >
              {heading}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, r) => (
          <tr key={`${id}-r${r}`}>
            {row.map((value, c) => (
              <td
                key={`${id}-r${r}c${c}`}
                // first column holds the option letter — a label, so it takes the data font
                style={{ ...cell, fontFamily: c === 0 ? MONO : BODY, fontSize: '13px', lineHeight: 1.5, color: 'var(--instrument-text)' }}
              >
                {renderInline(value, `${id}-r${r}c${c}`)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function Part({ block, accent, id }) {
  return (
    <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
      <span style={{ fontFamily: MONO, fontSize: '14px', color: accent, minWidth: '2.4em' }}>({block.label})</span>
      <div style={prose}>
        {renderInline(block.text, id)}
        {block.marks !== null && (
          <span style={{ fontFamily: MONO, fontSize: '12px', color: 'var(--editorial-text-secondary)', marginLeft: '6px' }}>
            [{block.marks}]
          </span>
        )}
      </div>
    </div>
  )
}

// The source keeps its authoring notes at the end of the file; the panel shows them against
// the sub-part they describe. Currently this is the missing F-t graph for part (b)(ii).
function PendingGraphNote({ text, id }) {
  return (
    <div
      style={{
        margin: '0 0 12px',
        padding: '10px 12px',
        borderLeft: `2px solid var(--instrument-warning)`,
        background: 'var(--instrument-panel)',
        borderRadius: 'var(--radius-max)',
      }}
    >
      <div style={{ ...microLabel, color: 'var(--instrument-warning)', marginBottom: '4px' }}>Graph pending</div>
      <div style={{ ...prose, fontSize: '13px' }}>{renderInline(text, id)}</div>
    </div>
  )
}

function Answer({ answer, accent, id }) {
  return (
    <div
      style={{
        marginTop: '10px',
        padding: '10px 12px',
        borderLeft: `2px solid ${accent}`,
        background: 'var(--instrument-panel)',
        borderRadius: 'var(--radius-max)',
      }}
    >
      <div style={{ ...microLabel, color: accent, marginBottom: '6px' }}>
        Answer <span style={{ fontSize: '13px' }}>{answer.key}</span>
      </div>
      <div style={{ ...prose, fontSize: '13px' }}>{renderInline(answer.explanation, `${id}-ans`)}</div>
    </div>
  )
}

function Question({ question, accent, isFirst }) {
  const [revealed, setRevealed] = useState(false)

  // Notes attach to the sub-part they describe; anything unmatched falls to the end.
  const noteAnchor = question.blocks.findIndex((b) => b.type === 'part' && /graph/i.test(b.text))
  const notes = question.notes.map((text, i) => (
    <PendingGraphNote key={`${question.id}-note${i}`} text={text} id={`${question.id}-note${i}`} />
  ))

  return (
    <div
      style={{
        paddingTop: isFirst ? 0 : '16px',
        marginTop: isFirst ? 0 : '16px',
        borderTop: isFirst ? 'none' : '1px solid var(--instrument-grid)',
      }}
    >
      {question.label && (
        <div style={{ ...microLabel, fontSize: '12px', color: 'var(--instrument-text)', marginBottom: '8px' }}>
          {question.label}
        </div>
      )}

      {question.blocks.map((block, i) => {
        const id = `${question.id}-b${i}`
        const rendered = (() => {
          if (block.type === 'options') return <Options key={id} items={block.items} id={id} />
          if (block.type === 'table') return <Table key={id} header={block.header} rows={block.rows} id={id} />
          if (block.type === 'part') return <Part key={id} block={block} accent={accent} id={id} />
          if (block.type === 'total') {
            return (
              <div key={id} style={{ fontFamily: MONO, fontSize: '12px', color: 'var(--editorial-text-secondary)', marginTop: '4px' }}>
                {block.text}
              </div>
            )
          }
          return <Paragraph key={id} text={block.text} id={id} />
        })()
        return i === noteAnchor ? [rendered, ...notes] : rendered
      })}

      {noteAnchor === -1 && notes}

      {question.citation && (
        <div
          style={{
            fontFamily: BODY,
            fontSize: '12px',
            fontStyle: 'italic',
            color: 'var(--editorial-text-secondary)',
            marginTop: '10px',
          }}
        >
          {question.citation}
        </div>
      )}

      {question.answer && (
        <>
          <button
            type="button"
            onClick={() => setRevealed((r) => !r)}
            style={{
              marginTop: '10px',
              fontFamily: BODY,
              fontSize: '13px',
              padding: '6px 16px',
              borderRadius: 'var(--radius-max)',
              border: '1px solid var(--instrument-grid)',
              background: 'transparent',
              color: 'var(--instrument-text)',
              cursor: 'pointer',
            }}
          >
            {revealed ? 'Hide answer' : 'Reveal answer'}
          </button>
          {revealed && <Answer answer={question.answer} accent={accent} id={question.id} />}
        </>
      )}
    </div>
  )
}

function PendingGroup({ heading, accent }) {
  // Real project status, not filler text — these sets are being written now.
  return (
    <div style={{ ...prose, fontSize: '13px' }}>
      <div style={{ ...microLabel, color: accent, marginBottom: '6px' }}>In drafting</div>
      Anay is writing the {heading.toLowerCase()} set for momentum. It follows the same path as the
      questions above — drafted by the founders, then reviewed by Peter Syrenne before it appears here.
    </div>
  )
}

function QuestionGroup({ group }) {
  const accent = ACCENT[group.curriculum]
  // The tag already says IB or AP, so the heading drops its redundant prefix.
  const label = group.heading.replace(/^(IB|AP)\s+/, '')

  return (
    <div style={{ ...card, borderLeft: `3px solid ${accent}`, marginBottom: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '12px' }}>
        <span style={{ ...microLabel, color: accent }}>{group.curriculum}</span>
        <span style={{ fontFamily: BODY, fontSize: '13px', color: 'var(--instrument-text)' }}>{label}</span>
      </div>

      {group.status === 'pending' ? (
        <PendingGroup heading={label} accent={accent} />
      ) : (
        group.questions.map((question, i) => (
          <Question key={question.id} question={question} accent={accent} isFirst={i === 0} />
        ))
      )}
    </div>
  )
}

// --- panel -----------------------------------------------------------------------------

function ContentPanel() {
  return (
    <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '16px' }}>
      <Section title="Concept Summary">
        <div style={card}>
          {content.summary.map((text, i) => (
            <Paragraph
              key={`summary-${i}`}
              text={text}
              id={`summary-${i}`}
              style={i === content.summary.length - 1 ? { marginBottom: 0 } : undefined}
            />
          ))}
        </div>
      </Section>

      <Section title="Key Equations">
        <div style={card}>
          {content.equations.map((equation, i) => (
            <div
              key={`equation-${i}`}
              style={{
                marginBottom: i === content.equations.length - 1 ? 0 : '10px',
                color: 'var(--instrument-text)',
              }}
            >
              <BlockMath math={equation.tex} />
              {equation.caption && (
                <div
                  style={{
                    fontFamily: BODY,
                    fontSize: '12px',
                    color: 'var(--editorial-text-secondary)',
                    textAlign: 'center',
                  }}
                >
                  {equation.caption}
                </div>
              )}
            </div>
          ))}
        </div>
      </Section>

      <Section title="Practice Questions">
        {content.questionGroups.map((group) => (
          <QuestionGroup key={group.id} group={group} />
        ))}
      </Section>

      <Section title="Exam Tips">
        <div style={card}>
          {content.examTips.map((text, i) => (
            <Paragraph
              key={`tip-${i}`}
              text={text}
              id={`tip-${i}`}
              style={i === content.examTips.length - 1 ? { marginBottom: 0 } : undefined}
            />
          ))}
        </div>
      </Section>
    </div>
  )
}

export default ContentPanel
