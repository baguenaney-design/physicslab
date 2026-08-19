// Where the student came from, carried in ?from= by every link into a simulation or a topic
// folder. A query param rather than router history state so the breadcrumb survives a refresh or
// a pasted link, both of which would leave state undefined.
//
// Lifted out of SimulationPage.jsx now that topic folders read the same param: the folder's back
// link and the simulation's back link have to agree about what `ap` means, and two copies of this
// map would eventually disagree.
//
// The curriculum origins (ib, ap) are where a student enters from a map. The topic origins (a1,
// a2) are where one enters from a folder — a student who reached a simulation through a folder
// goes back to the folder, not past it to the whole syllabus. A.3 has no simulation, so it needs
// no origin entry; add one the day an energy simulation lands in it.

export const ORIGINS = {
  ib: { label: '← Back to IB', to: '/ib' },
  ap: { label: '← Back to AP', to: '/ap' },
  a1: { label: '← Back to A.1', to: '/topic/a1' },
  a2: { label: '← Back to A.2', to: '/topic/a2' },
}

export const DEFAULT_ORIGIN = { label: '← Home', to: '/' }

export default ORIGINS
