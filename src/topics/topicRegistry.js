import A1_FOLDER from './a1.js'
import A2_FOLDER from './a2.js'
import A3_FOLDER from './a3.js'

// Every topic folder the site can route to, keyed by its URL code (/topic/<code>).
//
// The same shape-and-lookup split src/simulations/registry.js makes for simulations: TopicFolder
// is a shell that owns the header, the key and the item list, none of which differ between
// topics, and everything that does differ lives in a file below. Adding a topic folder means
// adding a key here rather than editing the page.
//
// Keys are lowercase because they are URL segments. The code a student SEES is the folder's
// `codes` entry, which depends on which curriculum map they arrived from.

const topicRegistry = {
  a1: A1_FOLDER,
  a2: A2_FOLDER,
  a3: A3_FOLDER,
}

export default topicRegistry
