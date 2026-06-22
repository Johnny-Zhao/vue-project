# Frontend Review Checklist

Use this file for the detailed review pass after reading the surrounding code.

## 1. Existing Component Conventions

Check whether the patch preserves established conventions for:

- component API shape: prop names, emitted events, slot contracts, controlled vs uncontrolled usage
- composition boundaries: shared primitives, composables/hooks, store ownership, route responsibilities
- styling approach: utility classes, CSS modules, scoped styles, design tokens, breakpoint conventions
- data flow: parent-child ownership, fetch location, cache/store access, form state ownership
- file organization: naming, colocated tests, story/demo usage, barrel exports

Treat as a likely finding when the patch introduces a one-off pattern beside a clearly reusable existing one.

## 2. Unnecessary Dependencies

Check whether any new dependency:

- duplicates platform APIs or an existing package already in the repo
- adds a large library for one tiny helper
- can be replaced by a local utility or existing design-system component
- adds runtime code when build-time code would suffice
- introduces transitive security or maintenance burden without clear value

Inspect `package.json`, lockfile changes, and imports. If a new dependency is used in only one simple place, assume higher scrutiny.

## 3. Reactive State Confusion

Check for multiple sources of truth and synchronization hazards:

- copying props into local state without a clear sync strategy
- storing derived data instead of computing it
- watchers/effects that write back into the state they depend on
- async requests that can resolve out of order and overwrite fresher data
- store state mirrored into local refs/state and drifting apart
- optimistic updates without rollback or reconciliation

Vue-specific smells:

- `watch` used where `computed` would be simpler
- mutating props or nested prop objects directly
- mixing `ref` and `reactive` in ways that obscure ownership
- `watchEffect` with implicit dependencies that can surprise future edits

React-specific smells:

- `useEffect` used to derive render-only values
- stale closures in async callbacks or event handlers
- duplicated local and global state for the same concern
- dependency arrays that hide reactivity bugs rather than model intent

## 4. Loading, Empty, and Error States

Check every async or conditionally rendered surface for:

- initial loading
- refresh/loading-after-data
- empty success state
- error state
- retry path when recovery is realistic
- disabled/submitting states for forms and actions

Treat missing states as more severe when the feature is user-facing, network-backed, or replaces an existing handled state with a blank screen.

## 5. Mobile Adaptation

Check responsive behavior for:

- fixed widths, min-widths, or tables/cards that can overflow narrow screens
- touch target size and spacing
- hover-only affordances
- sticky/fixed UI that can cover content or conflict with mobile browser chrome
- long text, chips, filters, and button groups that fail to wrap
- safe-area handling for bottom sheets, tabs, or fixed footers
- viewport-unit usage that may break with mobile keyboard/browser UI

If no browser run is available, infer likely breakpoints from class names, CSS, and layout structure.

## 6. XSS Risk

Inspect every path where untrusted content reaches:

- `v-html`, `innerHTML`, `dangerouslySetInnerHTML`
- markdown/HTML renderers
- `href`, `src`, `style`, or CSS custom properties
- injected iframe URLs, preview URLs, or downloadable file names
- third-party widgets that render raw content

Treat user input, CMS content, server-returned rich text, query params, and postMessage payloads as untrusted unless sanitization is explicit.

## 7. Necessary Tests

Check whether tests cover:

- newly introduced branches or conditions
- loading, empty, and error states
- state synchronization edge cases
- security-sensitive rendering paths
- responsive/UI regressions when the repo has a pattern for this
- bug fixes that should be locked in with a regression test

Treat missing tests as a finding when the repo already tests comparable behavior or when the change is easy to regress manually.

## Reporting Pattern

Use findings-first output:

`[severity] path/to/file:line - issue. Why it matters.`

Keep summaries short. If nothing rises to the level of a finding, say `No findings` and mention any residual risk, such as unverified mobile behavior or missing runtime validation.
