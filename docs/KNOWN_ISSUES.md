# Known issues

Warts we know about and have decided not to fix yet, plus the ones we have. An entry stays here
after it is fixed, with the commit that fixed it, so that a bug we have already reasoned about is
not rediscovered from scratch.

Physics errors do not belong here. A wrong calculation is a bug to fix now, not to log — see the
physics rules in CLAUDE.md.

---

## Fixed

### The AP track lost its curriculum through the folder → simulation hop
**Fixed on `folder-rollout`.** Introduced by the topic-folder rollout (`605e26a`), where it was
logged in the commit message and understated as cosmetic.

A student going **AP map → Unit 1 (Kinematics) → Projectile Motion** arrived at a simulation whose
sidebar read `IB PHYSICS · A.1 — PROJECTILE MOTION` and whose back link read `← Back to A.1`. Both
IB framing, on an AP journey. Every folder → simulation path had it; only the direct map →
simulation links were correct.

Root cause: `?from=` carried two different facts in one slot — *which curriculum am I in*, which
the eyebrow keys on, and *what page do I go back to*, which the back link keys on. Those are the
same answer on a direct link and different answers once a folder sits in between. The folder link
had to pick one, picked the back link (`?from=a1`), and dropped the curriculum; the sidebar then
found an IB-worded string filed under that folder's code.

Fix: two facts, two params. `?from=` is now only ever `ib` or `ap`; `?via=` names the folder hop.
The eyebrow keys on `from`, the back link on `via`, and folder-code eyebrow keys are gone from
`src/simulations/registry.js` entirely. Both are resolved in one place,
`src/topics/origins.js`. Legacy `?from=a1` / `?from=a2` links are still read as the `via` they
meant.

---

## Open

### Folder and map pages scroll horizontally by a few pixels at a 1120px viewport
Pre-existing, not from the folder work — `/ib` does it too. The editorial shell carries
`minWidth: 1024px` plus `48px` padding each side, and the content column is `1000px`, so the layout
bottoms out a little wider than a 1120px window. Desktop-only site, so it is a narrow band of
window widths, and nothing is cut off that a few pixels of scroll does not reach.

### A.1 and A.3 folder descriptors and body copy are `[TODO copy]`
Deliberate, not an oversight. The topic titles are the IB syllabus's own, but the scope lines are
not quoted syllabus wording and must be written from the syllabus rather than from memory. Marked
in place so they are visibly unwritten. Same for every slot in `src/topics/taught/` — see the
shape documented at the top of `src/components/ui/TaughtItem.jsx`.

### A.2's taught items have no pages
A.2's items carry no `content` data file, so their folder cards show no `Read →` link and
`/topic/a2/<id>` redirects home. Intentional: A.1 and A.3 were built out as the container's first
users. A.2 joins them by adding one data file per item, no JSX.

### Folder tag chips lead with IB on the AP folder
On an AP-origin folder, the chips should lead with the AP tag, not IB. `Tags` in
`src/pages/TopicFolder.jsx` renders `Object.values(topic.tags)`, and the keyed order in the topic
data files is IB then AP, so IB leads on both tracks. Cosmetic metadata ordering, not routing —
the chips deliberately show every curriculum, and which one is shown is already correct; only the
order is track-blind. The taught-item page header does resolve the arriving curriculum and shows
that one alone, so this is confined to the folder cards.

Fix tied to per-item AP unit tagging, a weekend content decision: A.2 carries no AP tag at all
because it straddles AP Unit 2 and Unit 4, and the honest resolution there is per-item tags rather
than a topic-level number. Reordering by origin and adding per-item AP units are the same edit, so
they should land together.
