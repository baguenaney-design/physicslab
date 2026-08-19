import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom'
import EditorialShell from '../components/ui/EditorialShell'
import TaughtItem from '../components/ui/TaughtItem'
import topicRegistry from '../topics/topicRegistry.js'
import { resolveCurriculum } from '../topics/origins.js'

// One taught section, opened from its topic folder. A thin route shell: it resolves :code and
// :itemId against the topic registry and hands the item to TaughtItem, which owns every pixel of
// the layout. Nothing topic-specific lives here.
//
// The mirror of SimulationPage for reading material — same shape, same redirect-rather-than-blank
// behaviour, editorial register rather than instrument.

function TaughtItemPage() {
  const { code, itemId } = useParams()
  const [searchParams] = useSearchParams()
  const from = searchParams.get('from')

  const topic = topicRegistry[code]
  const item = topic?.items.find((candidate) => candidate.id === itemId)

  // A mistyped code, a mistyped id, or an id that resolves to a simulation or an extension rather
  // than to taught content — all land somewhere real rather than on a blank shell, the same
  // choice SimulationPage makes for an unknown slug. `content` is required too: a taught item
  // whose data file has not been created has no page to show, and its folder card carries no link
  // to here in the first place.
  if (!topic || !item || item.kind !== 'taught' || !item.content) return <Navigate to="/" replace />

  // Back to the folder, carrying the origin through so the folder still knows which curriculum
  // the student came from and shows that curriculum's numbering.
  const backTo = from ? `/topic/${code}?from=${from}` : `/topic/${code}`

  // ONE tag: where this section sits in the syllabus the student is actually reading. The folder
  // card this page was opened from shows both curricula side by side, which is where the
  // cross-mapping belongs; repeating it here would make a one-line label carry a second job and
  // lead an AP student with an IB number, which is what it used to do.
  //
  // Falls back to the IB tag when no curriculum is named, or when the topic claims no number for
  // the one that is — the same fallback the folder's own code line uses.
  const tags = item.tags ?? topic.tags ?? {}
  const tag = tags[resolveCurriculum(from)] ?? tags.ib ?? null

  return (
    <EditorialShell>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <Link
          to={backTo}
          style={{
            display: 'inline-block',
            fontSize: '13px',
            marginBottom: '24px',
            color: 'var(--editorial-text-secondary)',
            textDecoration: 'none',
          }}
        >
          ← Back to {topic.title}
        </Link>

        <TaughtItem item={item} tag={tag} content={item.content} />
      </div>
    </EditorialShell>
  )
}

export default TaughtItemPage
