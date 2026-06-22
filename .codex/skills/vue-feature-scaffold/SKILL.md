---
name: vue-feature-scaffold
description: Scaffold new Vue 3 + TypeScript frontend features in this repository using the existing views, features, router, component, Pinia, and request-layer conventions. Use when asked to add a new page, CRUD screen, form flow, dashboard card, route, feature module, composable, or client-side integration that should match this repo's current structure and reuse its shared building blocks instead of inventing a new pattern.
---

# Vue Feature Scaffold

Read [references/project-patterns.md](references/project-patterns.md) before deciding where files belong.

Read [references/scaffold-checklist.md](references/scaffold-checklist.md) before implementation and again before finishing.

## Classify the Request

Start by placing the change in one of these buckets:

- simple page: mostly presentation and local state
- feature slice: shared business logic, schema, API wrappers, or store-backed state
- CRUD flow: list, filter, create, edit, delete, form schema, async states
- extension: add to an existing page or feature without changing the project shape

Prefer extending an existing feature folder over creating a new top-level pattern.

## Choose File Placement

Use the existing repository boundaries:

- put page entry files in `src/views`
- put domain logic in `src/features/<domain>`
- put cross-domain primitives in `src/components`
- put reusable cross-page logic in `src/composables` only when it is not feature-owned
- put route records in `src/router/modules`
- put request wrappers in feature `api.ts` or shared `src/api` only when genuinely global
- put state in Pinia only when multiple screens or long-lived session state need it

Do not create new architectural buckets unless the request explicitly requires it.

## Implementation Workflow

1. Read nearby files first.
   Match naming, state ownership, async handling, and UI composition to the closest existing feature.

2. Reuse shared building blocks before writing new ones.
   Prefer existing abstractions such as schema-driven forms, shared table components, and the request helpers.

3. Keep data flow obvious.
   Prefer:

- page shell in `views`
- feature-specific form logic in a composable
- feature API calls in `features/<domain>/api.ts`
- derived state in `computed`
- local state for single-screen concerns
- Pinia only for cross-screen or session-like state

4. Add route and permission metadata when a page is navigable.
   Follow the route-module pattern and set `requiresAuth`, `roles`, `permissions`, and menu metadata consistently with adjacent routes.

5. Handle user-facing states explicitly.
   Include loading, empty, error, submit-pending, and permission-restricted states as needed.

6. Keep mobile behavior in scope.
   New layout should wrap, shrink, and remain usable on narrow screens without hover-only interaction.

7. Add or update tests when the change introduces important behavior.
   At minimum, cover the risky logic branch or the user flow most likely to regress.

## Conventions to Preserve

Preserve the current split between:

- feature-local API modules and shared request infrastructure
- page containers and reusable feature logic
- shared UI primitives and business-specific components
- auth or permission concerns and generic UI concerns

Prefer schema-driven forms and shared tables when the target UI matches those patterns closely enough. Only introduce a custom component when the shared primitive would become awkward or misleading.

Avoid unnecessary dependencies. This project already has Vue, Pinia, Element Plus, Axios, Vitest, and Playwright.

## Output

When the user asks to build a feature, implement the code directly instead of returning only a plan.

When assumptions matter, state them briefly after the implementation. Do not stop to ask where a file should go if the surrounding code already makes the placement obvious.

If the request is really a review rather than implementation, use `$frontend-code-review` after scaffolding or instead of scaffolding as appropriate.
