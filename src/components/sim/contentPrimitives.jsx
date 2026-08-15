import { InlineMath, BlockMath } from 'react-katex'
// KaTeX ships its own stylesheet and equations render unstyled without it. This module is the
// single import site: ConceptPanel and PracticePanel both render through the primitives below,
// so importing it once here covers both. .katex sets no colour, so equations inherit
// --instrument-text from their container.
import 'katex/dist/katex.min.css'

// Curriculum accents map to the two block colours used on the canvas, so a student reads the
// same amber/blue language in the content panels as in the simulation.
export const ACCENT = {
  IB: 'var(--instrument-block-b)', // amber — Block B
  AP: 'var(--instrument-block-a)', // blue  — Block A
}

export const BODY = 'var(--instrument-body-font)'
export const MONO = 'var(--instrument-data-font)'

// The editorial feel inside the instrument register comes from typography, not from a light
// background: a longer measure, looser leading and real paragraph spacing, against the tight
// 13px rhythm of Controls and Readout.
export const prose = {
  fontFamily: BODY,
  fontSize: '14px',
  lineHeight: 1.65,
  color: 'var(--instrument-text)',
  maxWidth: '65ch',
}

export const card = {
  background: 'var(--instrument-bg)',
  border: '1px solid var(--instrument-grid)',
  borderRadius: 'var(--radius-max)',
  padding: '14px 16px',
}

export const microLabel = {
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
export function renderInline(text, keyPrefix) {
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

export function Section({ title, children }) {
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
export function Paragraph({ text, id, style }) {
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

// A source file keeps its authoring notes at the end of the question; the panel shows them
// against the sub-part they describe. In momentum.md: the missing F-t graph for IB part (b)(ii),
// and the missing AP FRQ figures.
export function PendingNote({ text, id }) {
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
      <div style={{ ...microLabel, color: 'var(--instrument-warning)', marginBottom: '4px' }}>
        {/figure/i.test(text) ? 'Figures pending' : 'Graph pending'}
      </div>
      <div style={{ ...prose, fontSize: '13px' }}>{renderInline(text, id)}</div>
    </div>
  )
}

// Exam figures are black-line diagrams on white, so they sit on the editorial background rather
// than the instrument one — a document inset inside the console, the same move the content panel
// makes with its typography. Reproducing them on a dark surface would invert the linework.
function FigureSlot({ block, id }) {
  if (!block.src) {
    return (
      <div
        style={{
          margin: '0 0 12px',
          padding: '12px 14px',
          border: '1px dashed var(--instrument-grid)',
          borderRadius: 'var(--radius-max)',
        }}
      >
        <div style={{ ...microLabel, color: 'var(--editorial-text-secondary)', marginBottom: '6px' }}>
          {block.label} — image pending
        </div>
        <div style={{ ...prose, fontSize: '13px', color: 'var(--editorial-text-secondary)' }}>
          {renderInline(block.caption, `${id}-cap`)}
        </div>
      </div>
    )
  }

  return (
    <figure style={{ margin: '0 0 12px' }}>
      <div
        style={{
          background: 'var(--editorial-bg)',
          border: '1px solid var(--editorial-border)',
          borderRadius: 'var(--radius-max)',
          padding: '10px',
        }}
      >
        <img
          src={block.src}
          // The authored caption is the alt text: it is the description Peter reviews, so the
          // screen-reader text and the reviewed description can never drift apart.
          alt={block.caption.replace(/\$/g, '')}
          style={{ display: 'block', width: '100%', maxWidth: '420px', height: 'auto', margin: '0 auto' }}
        />
      </div>
      <figcaption
        style={{
          ...microLabel,
          color: 'var(--editorial-text-secondary)',
          marginTop: '6px',
        }}
      >
        {block.label}
      </figcaption>
    </figure>
  )
}

export function Answer({ answer, accent, id }) {
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

// One markdown block from the parser. Shared by the question body and the worked solution so
// a solution's **(a)** part is laid out identically to the **(a)** it answers.
export function renderBlock(block, id, accent) {
  if (block.type === 'options') return <Options key={id} items={block.items} id={id} />
  if (block.type === 'table') return <Table key={id} header={block.header} rows={block.rows} id={id} />
  if (block.type === 'part') return <Part key={id} block={block} accent={accent} id={id} />
  if (block.type === 'figure') return <FigureSlot key={id} block={block} id={id} />
  if (block.type === 'total') {
    return (
      <div key={id} style={{ fontFamily: MONO, fontSize: '12px', color: 'var(--editorial-text-secondary)', marginTop: '4px' }}>
        {block.text}
      </div>
    )
  }
  return <Paragraph key={id} text={block.text} id={id} />
}

export function SolutionPanel({ blocks, accent, id }) {
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
      <div style={{ ...microLabel, color: accent, marginBottom: '6px' }}>Solutions</div>
      {blocks.map((block, i) => renderBlock(block, `${id}-sol${i}`, accent))}
    </div>
  )
}
