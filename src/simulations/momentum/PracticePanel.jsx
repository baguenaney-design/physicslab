import { useState } from 'react'
import content from './momentumContent.js'
import {
  ACCENT,
  Answer,
  BODY,
  PendingNote,
  Section,
  SolutionPanel,
  card,
  microLabel,
  prose,
  renderBlock,
} from './contentPrimitives.jsx'

// The question half of the old ContentPanel. Reveal state stays local to each Question, exactly
// as before — nothing above this component reads it.
const MEASURE = '780px'

function Question({ question, accent, isFirst }) {
  const [revealed, setRevealed] = useState(false)

  const solution = question.solution || []
  const hasReveal = Boolean(question.answer) || solution.length > 0
  const revealNoun = question.answer ? 'answer' : 'solutions'

  // Notes attach to the sub-part they describe; anything unmatched falls to the end. A note
  // about figures is not about any one part, so it is left to fall through even when the
  // question happens to contain a part that mentions a graph.
  const anchorsToPart = question.notes.some((n) => /graph/i.test(n) && !/figure/i.test(n))
  const noteAnchor = anchorsToPart
    ? question.blocks.findIndex((b) => b.type === 'part' && /graph/i.test(b.text))
    : -1
  const notes = question.notes.map((text, i) => (
    <PendingNote key={`${question.id}-note${i}`} text={text} id={`${question.id}-note${i}`} />
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
        const rendered = renderBlock(block, `${question.id}-b${i}`, accent)
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

      {hasReveal && (
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
            {revealed ? `Hide ${revealNoun}` : `Reveal ${revealNoun}`}
          </button>
          {revealed &&
            (question.answer ? (
              <Answer answer={question.answer} accent={accent} id={question.id} />
            ) : (
              <SolutionPanel blocks={solution} accent={accent} id={question.id} />
            ))}
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

function PracticePanel() {
  return (
    <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '24px 32px' }}>
      <div style={{ maxWidth: MEASURE }}>
        <Section title="Practice Questions">
          {content.questionGroups.map((group) => (
            <QuestionGroup key={group.id} group={group} />
          ))}
        </Section>
      </div>
    </div>
  )
}

export default PracticePanel
