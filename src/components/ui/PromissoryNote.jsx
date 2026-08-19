// The note shown on a topic-folder item that has taught content but no simulation yet.
// Editorial register — it appears on curriculum pages, never inside a simulation.
//
// This is the editorial twin of PendingNote in src/components/sim/contentPrimitives.jsx:
// same left-rule idiom, but that one is wired to the instrument tokens and to the KaTeX
// inline parser, so it cannot be dropped onto a light page. The look is shared
// deliberately; the code is not.

const DEFAULT_TEXT =
  'An interactive simulation for this is planned — the full taught content is here for now.'

function PromissoryNote({ children }) {
  return (
    <div
      style={{
        marginTop: '12px',
        padding: '10px 12px',
        borderLeft: '2px solid var(--editorial-accent)',
        borderRadius: 'var(--radius-max)',
        fontSize: '13px',
        lineHeight: 1.5,
        color: 'var(--editorial-text-secondary)',
      }}
    >
      {children ?? DEFAULT_TEXT}
    </div>
  )
}

export default PromissoryNote
