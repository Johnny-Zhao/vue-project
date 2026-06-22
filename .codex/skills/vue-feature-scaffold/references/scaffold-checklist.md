# Scaffold Checklist

Use this checklist before writing code and again before finishing.

## 1. Scope the Change

Decide whether the request needs:

- a new view
- a new feature folder
- an update to an existing feature
- a route entry
- a store
- API wiring
- tests

Avoid creating all of them by default.

## 2. Choose the Smallest Suitable Shape

Prefer:

- extending an existing feature over creating a parallel one
- a composable over a store for page-local logic
- a shared component only when at least two flows benefit
- feature-local types and schema files over dumping domain types into global folders

## 3. Build the UI with Existing Primitives

Check whether the feature should reuse:

- `EntityForm`
- `SmartFormFields`
- `CrudTable`
- existing option constants
- existing permission helpers

If shared primitives are close but not enough, extend them carefully instead of bypassing them with a one-off pattern.

## 4. Wire Data Carefully

For async flows, confirm:

- request helper choice is consistent
- loading state is visible
- empty state is handled
- error state or message path exists
- submit buttons disable or show loading during pending work
- re-fetch or optimistic update logic has one clear source of truth

## 5. Keep Routing and Auth Consistent

If the feature is a page, confirm:

- route is added in the correct route module
- route name and path match nearby naming
- auth metadata is present
- role or permission checks reflect existing policy
- menu exposure is intentional

## 6. Check Mobile and Layout Behavior

Confirm the page or component:

- wraps on narrow screens
- avoids fixed desktop-only widths where possible
- keeps actions reachable on mobile
- does not rely on hover-only affordances

## 7. Add Tests Intentionally

Use unit tests for:

- composables
- stores
- derived state
- branching logic

Use E2E tests for:

- critical navigation
- auth-protected flows
- create or edit workflows that span multiple pieces

If a change fixes a bug, prefer a regression test.
