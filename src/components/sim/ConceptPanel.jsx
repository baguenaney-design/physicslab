import { BlockMath } from 'react-katex'
import { BODY, Paragraph, Section, card } from './contentPrimitives.jsx'

// The theory half of the old ContentPanel: what the student reads before running anything.
// Exam Tips sits here rather than under Practice — it is guidance about the topic, not a
// question to attempt.
//
// Shared across simulations: the parsed content arrives as a prop from the topic registry, so
// this component knows nothing about which topic it is rendering. A topic whose summary or tips
// are still awaiting review simply parses to fewer blocks and renders fewer sections.
//
// The measure is capped rather than left to fill the view pane: at 1024px+ a full-width rule
// under each section heading would run further than the prose beneath it.
const MEASURE = '780px'

function ConceptPanel({ content }) {
  return (
    <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '24px 32px' }}>
      <div style={{ maxWidth: MEASURE }}>
        {/* Sections are skipped rather than drawn empty. A topic mid-review can have equations
            (canonical, written first) with no summary or exam tips yet, and a heading with a
            rule under it and nothing beneath reads as a rendering fault rather than as content
            that has not been written. */}
        {content.summary.length > 0 && (
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
        )}

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

        {content.examTips.length > 0 && (
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
        )}
      </div>
    </div>
  )
}

export default ConceptPanel
