# Project Patterns

Use this file to place new frontend code in the same shape as the current repository.

## Directory Map

- `src/views`
  Use for route-level page entries such as `TaskCreateView.vue`, `HomeView.vue`, and folder-based entries like `Login/index.vue`.
- `src/features/<domain>`
  Use for domain-specific API wrappers, types, form schemas, composables, and stores. Current examples include `features/auth` and `features/task`.
- `src/components`
  Use for reusable UI primitives that are not owned by one business area, such as `EntityForm.vue`, `CrudTable.vue`, and shared schema helpers.
- `src/router/modules`
  Use for route groups. Add new navigable pages here rather than hardcoding routes in `router/index.ts`.
- `src/api`
  Use for shared request infrastructure, not per-feature endpoints.
- `src/stores`
  Keep for shared store infrastructure. Prefer domain stores inside the feature when the store is feature-owned.

## Reuse First

Before creating a new abstraction, check whether the change can reuse:

- `src/api/request.ts` for request, auth header injection, dedupe, and error handling
- `src/components/EntityForm.vue` and related schema helpers for form screens
- `src/components/CrudTable.vue` for tabular list screens
- nearby feature composables for form submission, list loading, and dialog orchestration

## Page Pattern

For a new route-backed screen:

- create the page entry in `src/views`
- keep the page focused on composition and layout
- move domain logic into `src/features/<domain>`
- register the route in `src/router/modules/<domain>.ts` when the page belongs to an existing domain, or add a new route module only when a new domain is clearly needed

## State Pattern

Prefer local component state or a feature composable for:

- one page
- one dialog
- one form
- one fetch sequence

Prefer Pinia for:

- authenticated session state
- cross-route shared state
- data reused by multiple screens over time

Use `computed` for derived state. Avoid duplicating props, store values, or filtered collections into writable state unless synchronization is intentional and necessary.

## Async Pattern

Follow the existing request layering:

- use shared request helpers for real network calls
- keep per-feature endpoint wrappers in feature `api.ts`
- track loading or submitting state close to the UI or store that owns the action
- make empty and error states visible instead of silently failing

## Route and Permission Pattern

If a page is navigable, define route metadata such as:

- `requiresAuth`
- `title`
- `menu`
- `menuOrder`
- `roles`
- `permissions`

Match nearby route records so auth and menu behavior stay consistent.
