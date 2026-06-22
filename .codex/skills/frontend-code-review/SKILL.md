---
name: frontend-code-review
description: Review frontend changes in Vue, React, TypeScript, and UI-focused web projects with emphasis on broken component conventions, unnecessary dependencies, reactive state confusion, missing loading or empty or error states, mobile responsiveness regressions, XSS risks, and missing tests. Use when asked to review a frontend PR, inspect client-side changes, audit UI regressions, or perform code review on components, composables, hooks, stores, views, routes, or related tests.
---

# Frontend Code Review

Review for regressions and maintainability first. Prioritize concrete, user-facing, or security-relevant findings over style nits.

Read [references/review-checklist.md](references/review-checklist.md) before the detailed pass.

## Build Context

Inspect the diff first, then read the surrounding component, composable, store, route, stylesheet, and test files that define the local conventions.

Infer the project's established patterns before judging a change. Compare against nearby files for naming, composition style, async handling, styling approach, and test conventions.

Treat framework-specific reactivity carefully:

- For Vue, inspect `ref`, `reactive`, `computed`, `watch`, `watchEffect`, props, emits, and store usage.
- For React, inspect props, local state, derived state, effects, memoized values, and store usage.

## Review Workflow

1. Map the changed surface area.
   Identify which screens, states, shared abstractions, and user flows the patch can affect.

2. Check repository conventions before preferences.
   Treat deviations as findings only when they conflict with existing patterns or create maintenance cost.

3. Run the seven primary review passes.
   Review in this order unless another risk is clearly higher:

- component conventions
- dependencies
- reactive state
- loading, empty, and error states
- mobile behavior
- XSS and unsafe rendering
- tests

4. Confirm impact and evidence.
   Prefer findings with a clear failure mode, regression path, or maintainability cost. Avoid speculative comments that are not grounded in the codebase.

5. Report findings first.
   For each finding, include:

- severity
- file and line reference
- what is wrong
- why it matters in this codebase
- what change would likely resolve it

## Review Standards

Flag convention breaks when a change bypasses shared primitives, introduces a new pattern next to an established one, or makes the API of a common component harder to reason about.

Flag dependency issues when a new package duplicates existing capability, adds heavy client cost for a trivial need, or increases maintenance burden without a clear payoff.

Flag reactive-state issues when there are multiple sources of truth, unsynchronized copies of props or store state, race-prone async flows, or watchers/effects that can drift out of sync.

Flag UX-state gaps when the implementation ignores first-load, refresh, empty result, failure, retry, or disabled interaction states that the feature obviously needs.

Flag mobile issues when the layout assumes desktop width, hover-only interaction, fixed pixel sizes, overflow-prone content, or ignores safe-area and touch ergonomics.

Flag XSS risk when untrusted content can reach HTML, URLs, styles, or script-adjacent sinks without sanitization or strict validation.

Flag testing gaps when a new branch, state, security boundary, or regression-prone interaction has no automated coverage and the repo already tests comparable behavior.

## Output

Present findings ordered by severity. Keep summaries brief and secondary.

If no findings are discovered, say so explicitly and mention any residual testing or verification gaps.

Do not ask for follow-up information when the local codebase is sufficient to judge the change. Make reasonable inferences from adjacent files and state the assumptions only when they affect the conclusion.
