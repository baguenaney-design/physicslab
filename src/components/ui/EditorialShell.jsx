import { Link } from 'react-router-dom'

// Page frame for every editorial-register page: landing and both curriculum maps.
// Header carries the wordmark only — donate and sign-in land later (see CLAUDE.md
// out-of-scope list; auth is gated on all simulations being complete).

const FOOTER_TEXT = 'Built by two students from the UAE. Best experienced on desktop.'

function EditorialShell({ children }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        minWidth: '1024px', // desktop only — see CLAUDE.md design rules
        background: 'var(--editorial-bg)',
        color: 'var(--editorial-text)',
        fontFamily: 'var(--editorial-font)',
      }}
    >
      <header
        style={{
          padding: '20px 48px',
          borderBottom: '1px solid var(--editorial-border)',
        }}
      >
        <Link
          to="/"
          style={{
            fontSize: '16px',
            fontWeight: 600,
            letterSpacing: '-0.01em',
            color: 'var(--editorial-text)',
            textDecoration: 'none',
          }}
        >
          PhysicsLab
        </Link>
      </header>

      <main style={{ flex: 1, padding: '48px' }}>{children}</main>

      <footer
        style={{
          padding: '24px 48px',
          borderTop: '1px solid var(--editorial-border)',
          fontSize: '13px',
          color: 'var(--editorial-text-secondary)',
        }}
      >
        {FOOTER_TEXT}
      </footer>
    </div>
  )
}

export default EditorialShell
