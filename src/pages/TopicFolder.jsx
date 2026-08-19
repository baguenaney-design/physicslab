import { useState } from 'react'
import { Link } from 'react-router-dom'
import { InlineMath } from 'react-katex'
// Imported here for the same reason contentPrimitives.jsx imports it: this page is a separate
// entry point into KaTeX, and equations render unstyled without the stylesheet.
import 'katex/dist/katex.min.css'
import EditorialShell from '../components/ui/EditorialShell'
import PromissoryNote from '../components/ui/PromissoryNote'
import { A2_FOLDER } from '../simulations/a2Folder.js'

// A topic folder — DEMO, currently only A.2. Sits between the curriculum map and a simulation:
// the map card opens the topic, and the topic lists everything in it, of which only some items
// have a simulation behind them.
//
// Editorial register throughout. This is curriculum-map territory, not instrument territory —
// the register switch happens when the student opens the simulation item, not when they open
// the folder. See CLAUDE.md "Visual design".
//
// Items render as one full-width column rather than the three-up grid CurriculumSection uses.
// These cards carry a summary and, on taught items, a note; three across would crush both.

const LABELS = {
  sim: 'Live simulation',
  taught: 'Taught content',
  extension: 'Beyond the classroom',
}

function ItemLabel({ kind }) {
  return (
    <div
      style={{
        fontSize: '11px',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        marginBottom: '8px',
        color: kind === 'sim' ? 'var(--editorial-accent)' : 'var(--editorial-text-secondary)',
      }}
    >
      {LABELS[kind]}
    </div>
  )
}

// The body copy claims that items marked live are interactive and the rest are taught content.
// This is what lets a reader check that claim before scrolling: the same ItemLabel component the
// cards use, so a chip in the key and a chip on a card cannot drift apart.
function Key() {
  return (
    <div
      style={{
        display: 'flex',
        gap: '32px',
        alignItems: 'baseline',
        paddingTop: '14px',
        marginBottom: '20px',
        borderTop: '1px solid var(--editorial-border)',
      }}
    >
      {[
        { kind: 'sim', gloss: 'interactive now' },
        { kind: 'taught', gloss: 'simulation planned' },
      ].map(({ kind, gloss }) => (
        <div key={kind} style={{ display: 'flex', gap: '8px', alignItems: 'baseline' }}>
          {/* ItemLabel carries its own bottom margin for use inside a card; zeroed here so the
              key sits on one baseline. */}
          <div style={{ marginBottom: '-8px' }}>
            <ItemLabel kind={kind} />
          </div>
          <span style={{ fontSize: '13px', color: 'var(--editorial-text-secondary)' }}>{gloss}</span>
        </div>
      ))}
    </div>
  )
}

function ItemBody({ item }) {
  return (
    <>
      <ItemLabel kind={item.kind} />
      <div style={{ fontSize: '17px', fontWeight: 600, letterSpacing: '-0.01em', color: 'var(--editorial-text)' }}>
        {item.title}
      </div>
      {/* .katex sets no colour, so the equation inherits the secondary text colour of its row. */}
      {(item.formula || item.subtitle) && (
        <div style={{ fontSize: '13px', marginTop: '6px', color: 'var(--editorial-text-secondary)' }}>
          {item.formula && <InlineMath math={item.formula} />}
          {item.formula && item.subtitle && <span> — </span>}
          {item.subtitle}
        </div>
      )}
      <div
        style={{
          fontSize: '14px',
          lineHeight: 1.6,
          marginTop: '8px',
          maxWidth: '68ch',
          color: 'var(--editorial-text-secondary)',
        }}
      >
        {item.summary}
      </div>
    </>
  )
}

// Only the simulation item is a link — a taught item has nowhere to go yet, so it is a plain
// card with no hover and no pointer cursor rather than a link that lands on an empty page.
function SimItem({ item }) {
  const [hovered, setHovered] = useState(false)
  return (
    <Link
      to={item.to}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'block',
        padding: '16px',
        border: '1px solid',
        borderColor: hovered ? 'var(--editorial-accent)' : 'var(--editorial-border)',
        borderRadius: 'var(--radius-max)',
        textDecoration: 'none',
      }}
    >
      <ItemBody item={item} />
      <div
        style={{
          marginTop: '12px',
          fontSize: '12px',
          color: 'var(--editorial-accent)',
          textDecoration: hovered ? 'underline' : 'none',
        }}
      >
        Open simulation →
      </div>
    </Link>
  )
}

function TaughtItem({ item }) {
  return (
    <div
      style={{
        padding: '16px',
        border: '1px solid var(--editorial-border)',
        borderRadius: 'var(--radius-max)',
      }}
    >
      <ItemBody item={item} />
      <PromissoryNote />
    </div>
  )
}

// The dashed rule and the exam line are the two signals that separate an optional tangent from
// taught content at a glance — an extension should never read as something a student has to sit.
function ExtensionItem({ item }) {
  return (
    <div
      style={{
        padding: '16px',
        border: '1px dashed var(--editorial-border)',
        borderRadius: 'var(--radius-max)',
      }}
    >
      <ItemBody item={item} />
      <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--editorial-text-secondary)' }}>
        Optional — not required for AP or IB exams.
      </div>
    </div>
  )
}

function ItemCard({ item }) {
  if (item.kind === 'sim') return <SimItem item={item} />
  if (item.kind === 'extension') return <ExtensionItem item={item} />
  return <TaughtItem item={item} />
}

function TopicFolder() {
  const topic = A2_FOLDER

  return (
    <EditorialShell>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <Link
          to={topic.backLink.to}
          style={{
            display: 'inline-block',
            fontSize: '13px',
            marginBottom: '24px',
            color: 'var(--editorial-text-secondary)',
            textDecoration: 'none',
          }}
        >
          {topic.backLink.label}
        </Link>

        {/* Matches the code treatment on a curriculum-map card, so the syllabus reference reads
            the same on the card the student clicked and on the page it opened. */}
        <div style={{ fontSize: '12px', marginBottom: '6px', color: 'var(--editorial-accent)' }}>
          {topic.code}
        </div>
        <h1 style={{ fontSize: '32px', fontWeight: 600, letterSpacing: '-0.02em', margin: '0 0 8px' }}>
          {topic.title}
        </h1>
        {/* The syllabus's own description of the topic, set in italic to read as a quoted scope
            line rather than as our own prose — the paragraph below it is ours. */}
        <p
          style={{
            fontSize: '16px',
            fontStyle: 'italic',
            lineHeight: 1.5,
            color: 'var(--editorial-text-secondary)',
            margin: '0 0 16px',
            maxWidth: '620px',
          }}
        >
          {topic.descriptor}
        </p>
        <p
          style={{
            fontSize: '15px',
            lineHeight: 1.6,
            color: 'var(--editorial-text-secondary)',
            margin: '0 0 28px',
            maxWidth: '620px',
          }}
        >
          {topic.body}
        </p>

        <Key />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {topic.items.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </EditorialShell>
  )
}

export default TopicFolder
