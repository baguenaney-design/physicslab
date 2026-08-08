import { useState } from 'react'
import { Link } from 'react-router-dom'
import EditorialShell from '../components/ui/EditorialShell'

// Minimal landing page. The cinematic version — live simulation previews behind
// the hero, GSAP intro sequence, founder photos — is Phase 6, and is gated on
// there being more than one simulation to show.

function TrackButton({ to, label, description }) {
  const [hovered, setHovered] = useState(false)

  return (
    <Link
      to={to}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'block',
        width: '260px',
        padding: '28px 24px',
        border: `1px solid ${hovered ? 'var(--editorial-accent)' : 'var(--editorial-border)'}`,
        borderRadius: 'var(--radius-max)',
        textDecoration: 'none',
        textAlign: 'left',
      }}
    >
      <div
        style={{
          fontSize: '28px',
          fontWeight: 600,
          letterSpacing: '-0.02em',
          color: hovered ? 'var(--editorial-accent)' : 'var(--editorial-text)',
        }}
      >
        {label}
      </div>
      <div style={{ marginTop: '6px', fontSize: '13px', color: 'var(--editorial-text-secondary)' }}>
        {description}
      </div>
    </Link>
  )
}

function Landing() {
  return (
    <EditorialShell>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          paddingTop: '96px',
        }}
      >
        <h1
          style={{
            fontSize: '40px',
            fontWeight: 600,
            letterSpacing: '-0.03em',
            lineHeight: 1.15,
            margin: 0,
            maxWidth: '620px',
          }}
        >
          Interactive physics simulations for AP and IB students
        </h1>

        <p
          style={{
            marginTop: '16px',
            fontSize: '16px',
            lineHeight: 1.5,
            color: 'var(--editorial-text-secondary)',
            maxWidth: '520px',
          }}
        >
          Change the variables, watch the physics respond, and check your reasoning against
          teacher-reviewed content. Free, always.
        </p>

        <div style={{ display: 'flex', gap: '16px', marginTop: '48px' }}>
          <TrackButton to="/ap" label="AP" description="Physics 1, 2, and C" />
          <TrackButton to="/ib" label="IB" description="Sections A through E" />
        </div>
      </div>
    </EditorialShell>
  )
}

export default Landing
