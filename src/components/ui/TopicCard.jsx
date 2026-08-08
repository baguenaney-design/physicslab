import { useState } from 'react'
import { Link } from 'react-router-dom'

// One topic in a curriculum map. Unavailable topics are greyed but never hidden —
// students should be able to see the whole roadmap, not just what is built.
// `code` is the syllabus reference (IB "A.2", AP "Unit 4"); omitted where the
// course's official unit numbering is not being asserted.

function CardBody({ code, title, available, hovered }) {
  return (
    <>
      {code && (
        <div
          style={{
            fontSize: '12px',
            marginBottom: '6px',
            color: available ? 'var(--editorial-accent)' : 'var(--editorial-text-secondary)',
          }}
        >
          {code}
        </div>
      )}
      <div
        style={{
          fontSize: '15px',
          lineHeight: 1.35,
          color: available ? 'var(--editorial-text)' : 'var(--editorial-text-secondary)',
        }}
      >
        {title}
      </div>
      <div
        style={{
          marginTop: '10px',
          fontSize: '12px',
          color: available ? 'var(--editorial-accent)' : 'var(--editorial-text-secondary)',
          textDecoration: available && hovered ? 'underline' : 'none',
        }}
      >
        {available ? 'Open simulation →' : 'Coming soon'}
      </div>
    </>
  )
}

function TopicCard({ code, title, to }) {
  const [hovered, setHovered] = useState(false)
  const available = Boolean(to)

  const style = {
    display: 'block',
    padding: '16px',
    border: '1px solid var(--editorial-border)',
    borderRadius: 'var(--radius-max)',
    background: available && hovered ? 'var(--editorial-bg)' : 'transparent',
    borderColor: available && hovered ? 'var(--editorial-accent)' : 'var(--editorial-border)',
    textDecoration: 'none',
    cursor: available ? 'pointer' : 'default',
    opacity: available ? 1 : 0.55,
  }

  if (!available) {
    return (
      <div style={style}>
        <CardBody code={code} title={title} available={false} hovered={false} />
      </div>
    )
  }

  return (
    <Link
      to={to}
      style={style}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <CardBody code={code} title={title} available hovered={hovered} />
    </Link>
  )
}

// Shared section wrapper — a heading plus a three-column grid of TopicCards.
export function CurriculumSection({ heading, subheading, topics }) {
  return (
    <section style={{ marginBottom: '40px' }}>
      <h2
        style={{
          fontSize: '18px',
          fontWeight: 600,
          margin: '0 0 4px',
          letterSpacing: '-0.01em',
        }}
      >
        {heading}
      </h2>
      {subheading && (
        <p style={{ fontSize: '13px', color: 'var(--editorial-text-secondary)', margin: '0 0 16px' }}>
          {subheading}
        </p>
      )}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '12px',
          marginTop: subheading ? 0 : '16px',
        }}
      >
        {topics.map((topic) => (
          <TopicCard key={topic.title} code={topic.code} title={topic.title} to={topic.to} />
        ))}
      </div>
    </section>
  )
}

export default TopicCard
