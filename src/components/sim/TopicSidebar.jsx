import { useState } from 'react'
import { Link } from 'react-router-dom'

// The simulation shell's navigation: one topic, four views. Shared across simulations, so it
// knows nothing about momentum — the topic title, the curriculum eyebrow and the items all
// arrive as props.
//
// 236px is the sketch's width. It is fixed rather than fluid because the pane beside it holds
// the canvas, and a canvas that changes width between topics would change the pixels-per-metre
// the blocks are drawn at.
const WIDTH = '236px'

// Instrument register, and deliberately not phosphor green — CLAUDE.md reserves that for live
// data and primary CTAs, and a back link is neither.
function BackLink({ label, to }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div style={{ padding: '16px', borderBottom: '1px solid var(--instrument-grid)' }}>
      <Link
        to={to}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          fontFamily: 'var(--instrument-body-font)',
          fontSize: '13px',
          color: 'var(--instrument-text)',
          opacity: hovered ? 1 : 0.6,
          textDecoration: 'none',
        }}
      >
        {label}
      </Link>
    </div>
  )
}

// Drawn rather than typed: an emoji padlock renders in the system's colour and weight, which
// reads as a foreign object against the instrument register. currentColor keeps it in step with
// the label's dimmed state.
function LockIcon() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      aria-hidden="true"
      style={{ flex: '0 0 auto' }}
    >
      <rect x="2.5" y="5.5" width="7" height="5.5" />
      <path d="M4.25 5.5V3.75a1.75 1.75 0 0 1 3.5 0V5.5" />
    </svg>
  )
}

function NavItem({ item, active, onSelect }) {
  const [hovered, setHovered] = useState(false)
  const { label, sublabel, locked } = item

  // Locked items stay in the list rather than disappearing: the student needs to see that a
  // tutor exists and that reading the concept is what opens it.
  //
  // Active state is carried by weight, brightness and a neutral rule — never by phosphor, which
  // CLAUDE.md reserves for live data readouts and primary CTAs. A nav item is neither.

  return (
    <button
      type="button"
      onClick={locked ? undefined : () => onSelect(item.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-current={active ? 'page' : undefined}
      aria-disabled={locked || undefined}
      disabled={locked}
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        padding: '12px 16px',
        // the active marker is a rule, so every item reserves its width and the labels do not
        // shift sideways as the selection moves
        borderLeft: `2px solid ${active ? 'var(--instrument-text)' : 'transparent'}`,
        borderTop: 'none',
        borderRight: 'none',
        borderBottom: 'none',
        borderRadius: 0,
        background: active ? 'var(--instrument-panel)' : 'transparent',
        cursor: locked ? 'default' : 'pointer',
        opacity: locked ? 0.4 : 1,
        font: 'inherit',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontFamily: 'var(--instrument-body-font)',
          fontSize: '15px',
          fontWeight: active ? 600 : 400,
          color: 'var(--instrument-text)',
          opacity: active ? 1 : hovered && !locked ? 0.85 : 0.6,
        }}
      >
        {label}
        {locked && <LockIcon />}
      </div>
      <div
        style={{
          fontFamily: 'var(--instrument-body-font)',
          fontSize: '12px',
          color: 'var(--instrument-text)',
          opacity: active ? 0.6 : 0.45,
          marginTop: '2px',
        }}
      >
        {sublabel}
      </div>
    </button>
  )
}

function TopicSidebar({ backLink, eyebrow, title, items, activeId, onSelect }) {
  return (
    <nav
      style={{
        flex: `0 0 ${WIDTH}`,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        borderRight: '1px solid var(--instrument-grid)',
        background: 'var(--instrument-bg)',
      }}
    >
      <BackLink label={backLink.label} to={backLink.to} />

      <div style={{ padding: '20px 16px 16px' }}>
        <div
          style={{
            fontFamily: 'var(--instrument-data-font)',
            fontSize: '11px',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--instrument-text)',
            opacity: 0.5,
            marginBottom: '8px',
          }}
        >
          {eyebrow}
        </div>
        <h1
          style={{
            margin: 0,
            fontFamily: 'var(--instrument-body-font)',
            fontSize: '22px',
            fontWeight: 600,
            lineHeight: 1.25,
            color: 'var(--instrument-text)',
          }}
        >
          {title}
        </h1>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {items.map((item) => (
          <NavItem key={item.id} item={item} active={item.id === activeId} onSelect={onSelect} />
        ))}
      </div>
    </nav>
  )
}

export default TopicSidebar
