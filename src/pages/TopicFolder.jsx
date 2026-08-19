import { useState } from 'react'
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom'
import { InlineMath } from 'react-katex'
// Imported here for the same reason contentPrimitives.jsx imports it: this page is a separate
// entry point into KaTeX, and equations render unstyled without the stylesheet.
import 'katex/dist/katex.min.css'
import EditorialShell from '../components/ui/EditorialShell'
import PromissoryNote from '../components/ui/PromissoryNote'
import topicRegistry from '../topics/topicRegistry.js'
import { resolveBackLink, resolveCurriculum } from '../topics/origins.js'

// A topic folder. Sits between the curriculum map and a simulation: the map card opens the topic,
// and the topic lists everything in it, of which only some items have a simulation behind them.
//
// A shell, like SimulationPage: the header, the key and the item list are the same for every
// topic, and everything that differs comes from src/topics/topicRegistry.js keyed by the :code
// route param. A.1, A.2 and A.3 all render through here.
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

const microLabel = {
  fontSize: '11px',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
}

function ItemLabel({ kind }) {
  return (
    <div
      style={{
        ...microLabel,
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

// Where in each syllabus this item sits. Structural, not prose: it is the item's address, and it
// comes from the topic unless an item overrides it. Sits opposite the kind label so the two
// classifications — what this item IS, and where it BELONGS — read as one row.
function Tags({ tags }) {
  if (!tags || tags.length === 0) return null
  return (
    <div style={{ display: 'flex', gap: '14px' }}>
      {tags.map((tag) => (
        <span key={tag} style={{ ...microLabel, color: 'var(--editorial-text-secondary)' }}>
          {tag}
        </span>
      ))}
    </div>
  )
}

function ItemBody({ item, tags }) {
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <ItemLabel kind={item.kind} />
        <Tags tags={item.tags ?? tags} />
      </div>
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

// The shared card chrome. A card that goes somewhere is a Link and lights its border on hover; a
// card that does not is a plain div with no hover and no pointer cursor, rather than a link that
// lands on an empty page.
function ItemCardShell({ to, dashed, children }) {
  const [hovered, setHovered] = useState(false)

  const style = {
    display: 'block',
    padding: '16px',
    border: dashed ? '1px dashed var(--editorial-border)' : '1px solid var(--editorial-border)',
    borderColor: to && hovered ? 'var(--editorial-accent)' : 'var(--editorial-border)',
    borderRadius: 'var(--radius-max)',
    textDecoration: 'none',
  }

  if (!to) return <div style={style}>{children(false)}</div>

  return (
    <Link
      to={to}
      style={style}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children(hovered)}
    </Link>
  )
}

function Cta({ label, hovered }) {
  return (
    <div
      style={{
        marginTop: '12px',
        fontSize: '12px',
        color: 'var(--editorial-accent)',
        textDecoration: hovered ? 'underline' : 'none',
      }}
    >
      {label}
    </div>
  )
}

function SimItem({ item, tags, to }) {
  return (
    <ItemCardShell to={to}>
      {(hovered) => (
        <>
          <ItemBody item={item} tags={tags} />
          <Cta label="Open simulation →" hovered={hovered} />
        </>
      )}
    </ItemCardShell>
  )
}

// A taught item links to its own page once it has a content data file. Until then it is a plain
// card — the promissory note is the whole of what there is to say, and a "Read →" leading to an
// empty container would be a worse promise than no link at all.
function TaughtItemCard({ item, tags, to }) {
  return (
    <ItemCardShell to={to}>
      {(hovered) => (
        <>
          <ItemBody item={item} tags={tags} />
          <PromissoryNote />
          {to && <Cta label="Read →" hovered={hovered} />}
        </>
      )}
    </ItemCardShell>
  )
}

// The dashed rule and the exam line are the two signals that separate an optional tangent from
// taught content at a glance — an extension should never read as something a student has to sit.
function ExtensionItem({ item, tags }) {
  return (
    <ItemCardShell dashed>
      {() => (
        <>
          <ItemBody item={item} tags={tags} />
          <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--editorial-text-secondary)' }}>
            Optional — not required for AP or IB exams.
          </div>
        </>
      )}
    </ItemCardShell>
  )
}

function ItemCard({ item, tags, href }) {
  if (item.kind === 'sim') return <SimItem item={item} tags={tags} to={href(item)} />
  if (item.kind === 'extension') return <ExtensionItem item={item} tags={tags} />
  return <TaughtItemCard item={item} tags={tags} to={href(item)} />
}

function TopicFolder() {
  const { code } = useParams()
  const [searchParams] = useSearchParams()
  const from = searchParams.get('from')

  const topic = topicRegistry[code]

  // A mistyped or retired code lands somewhere real rather than on a blank shell — the same
  // choice SimulationPage makes for an unknown slug.
  if (!topic) return <Navigate to="/" replace />

  // Both the back link and the code line follow the curriculum the student arrived from, so a
  // student who came from one map is never shown the other's numbering — the convention
  // registry.js `eyebrows` established for simulations. A folder reached without an origin, or
  // from an origin the topic carries no number for, falls back to the IB code.
  const backLink = resolveBackLink({ from })
  const displayCode = topic.codes[resolveCurriculum(from)] ?? topic.codes.ib

  // Every link out of a folder carries the curriculum forward, so the whole chain — map, folder,
  // item, back — keeps showing one curriculum's numbering.
  //
  // A simulation link also carries ?via=, naming this folder as the hop, which is what its back
  // link returns to. The two facts stay in two params: without that, a folder link had to choose
  // between telling the simulation which curriculum to word itself for and telling it where to go
  // back to, and choosing the second is what showed AP students an IB eyebrow.
  //
  // Composed here rather than written into the topic data files, which is where the old
  // ?from=<code> strings lived. A data file should say WHICH simulation an item is, not how the
  // student got to it — that is this page's business, and only this page knows the origin.
  const curriculum = resolveCurriculum(from)
  const query = (params) =>
    Object.entries(params)
      .filter(([, value]) => value)
      .map(([key, value]) => `${key}=${value}`)
      .join('&')

  const href = (item) => {
    if (item.kind === 'sim') {
      const search = query({ from: curriculum, via: code })
      return search ? `${item.to}?${search}` : item.to
    }
    // A taught item with no data file yet has no page to link to.
    if (!item.content) return null
    const search = query({ from: curriculum })
    return search ? `/topic/${code}/${item.id}?${search}` : `/topic/${code}/${item.id}`
  }

  return (
    <EditorialShell>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <Link
          to={backLink.to}
          style={{
            display: 'inline-block',
            fontSize: '13px',
            marginBottom: '24px',
            color: 'var(--editorial-text-secondary)',
            textDecoration: 'none',
          }}
        >
          {backLink.label}
        </Link>

        {/* Matches the code treatment on a curriculum-map card, so the syllabus reference reads
            the same on the card the student clicked and on the page it opened. */}
        <div style={{ fontSize: '12px', marginBottom: '6px', color: 'var(--editorial-accent)' }}>
          {displayCode}
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
            <ItemCard key={item.id} item={item} tags={topic.tags} href={href} />
          ))}
        </div>
      </div>
    </EditorialShell>
  )
}

// All folders share one route, /topic/:code, so React Router keeps the same TopicFolder mounted
// when only the param changes. Keying on the code makes a topic change a remount, which is what
// it is — the same reason SimulationPage keys on its slug.
function TopicFolderRoute() {
  const { code } = useParams()
  return <TopicFolder key={code} />
}

export default TopicFolderRoute
