import topicRegistry from './topicRegistry.js'

// Where the student came from, carried in the query string by every link into a simulation or a
// topic folder. Query params rather than router history state so the breadcrumb survives a refresh
// or a pasted link, both of which would leave state undefined.
//
// TWO facts, TWO params. They used to share one:
//
//   ?from=  WHICH CURRICULUM the student is in. Only ever 'ib' or 'ap'. This is what the
//           simulation's eyebrow and the folder's code line key on, so that a student who came
//           from one map is never shown the other's numbering.
//   ?via=   WHICH FOLDER they came through, if any. Only ever a topic code. This is what the
//           back link keys on — a student who reached a simulation through a folder goes back to
//           the folder, not past it to the whole syllabus.
//
// They are the same answer on a direct map → simulation link and different answers the moment a
// folder sits in between, which is why one param could not carry both: the folder had to pick,
// picked the back link, and dropped the curriculum. An AP student then got an IB eyebrow. Splitting
// them also retired the eyebrow keys named after folders — with `from` always a curriculum,
// registry.js needs an `ib` and an `ap` string and nothing else.

export const ORIGINS = {
  ib: { label: '← Back to IB', to: '/ib' },
  ap: { label: '← Back to AP', to: '/ap' },
}

export const DEFAULT_ORIGIN = { label: '← Home', to: '/' }

// The curriculum a page should be worded for, given a raw ?from= value. 'ib' and 'ap' pass
// through. A legacy folder code resolves to 'ib' — links in that shape predate the split, and
// every folder they pointed at was reachable from the IB map only, so IB is what they showed when
// they were made. Anything else, including no param at all, resolves to null and the caller falls
// back to its own generic default rather than picking a curriculum for a student who named none.
export function resolveCurriculum(from) {
  if (ORIGINS[from]) return from
  if (topicRegistry[from]) return 'ib'
  return null
}

// The back link for any page reached with an origin. One function so the simulation page and the
// folder cannot disagree about what a given pair means.
//
// A folder's label comes from its title rather than its code, because a code has to pick a
// curriculum — '← Back to A.1' is the wrong thing to show an AP student, and '← Back to Unit 1' is
// the wrong thing to show an IB one. The title is neither, and it is already how TaughtItemPage
// labels the same link. The curriculum rides along in the returned link so the folder still knows
// which numbering to show when the student lands back on it.
export function resolveBackLink({ from, via }) {
  // Legacy links: ?from=a1 and ?from=a2 were written before the split, when one param carried the
  // folder and the curriculum was lost. Read as the `via` they meant. The curriculum they never
  // recorded stays unknown, so the folder they land on falls back to its IB code — which is what
  // those links showed when they were made.
  const folderCode = topicRegistry[via] ? via : topicRegistry[from] ? from : null
  const curriculum = ORIGINS[from] ? from : null

  if (folderCode) {
    return {
      label: `← Back to ${topicRegistry[folderCode].title}`,
      to: `/topic/${folderCode}${curriculum ? `?from=${curriculum}` : ''}`,
    }
  }

  return ORIGINS[from] ?? DEFAULT_ORIGIN
}

export default ORIGINS
