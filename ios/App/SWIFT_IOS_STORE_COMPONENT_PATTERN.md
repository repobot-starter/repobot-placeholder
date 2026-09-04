# Swift iOS Store and Component Pattern

This document defines the canonical pattern for Swift iOS agent-driven development in this codebase.

Use this when adding new features, refactoring flows, or reviewing architecture.

## Goals

- Keep architecture predictable: `Store -> Component -> View`.
- Keep stores as state containers only.
- Keep business logic, workflows, and side effects in components.
- Keep views declarative and thin.
- Prefer leaf store injection in SwiftUI (`SessionStore`, `AppAlertStore`) instead of parent-store republish relays.

## Layer Responsibilities

### Store Layer (state only)

Stores are `ObservableObject` state containers. They should represent UI-observable state and nothing else.

**Store must contain:**

- `@Published` state properties.
- lightweight read-only computed properties derived from store state.
- simple state mutator methods (setters/resetters/reporters) with no external side effects.

**Store must not contain:**

- network calls.
- GraphQL/Apollo client usage.
- references to components or other dependency wrappers.
- business workflow orchestration.
- cross-layer side effects (navigation decisions based on API results, auth callbacks, etc.).

### Component Layer (behavior and side effects)

Components own all behavior:

- API and dependency wrapper calls.
- workflow sequencing (auth restore -> hydrate user -> load page data).
- error/success handling policy.
- state transitions written into stores.
- cross-component orchestration.

Components read/write store state directly, but stores remain dependency-free.

### View Layer (declarative rendering)

Views should:

- observe leaf stores via `@EnvironmentObject` or `@ObservedObject`.
- render from state.
- call component methods from user actions (`Task { await ... }`).
- keep local ephemeral UI state in `@State`/`@StateObject` (text fields, sheet visibility, toggles, local selection).

Views should not:

- call GraphQL directly.
- embed business rules beyond UI validation.
- implement multi-step workflows.

## Global vs Local State

### Global stores (environment-injected)

Use global stores for cross-screen app state:

- `SessionStore`: auth/session/auth status.
- `AppAlertStore`: top-level alerts and toast-like app notifications.

### Component-owned runtime state (not in store)

Use component/dependency-wrapper state for transport/runtime internals that are not UI domain state:

- active web auth session handles.
- callback parsing helpers.
- temporary request internals and retry mechanics.

### View-local state

Keep ephemeral UI-only state in views:

- sheet open/close.
- local form draft text.
- local dropdown expansion/search text.
- temporary route-selection staging for UI transitions.

## Formulating a New Store

When creating a store, follow this template:

1. Define a focused state domain (auth, workspace, alerts, etc.).
2. Add only published state and pure derived properties.
3. Add minimal mutators needed by components.
4. Avoid importing integration libraries.
5. Avoid depending on other stores/components.

Example shape:

```swift
@MainActor
final class ExampleStore: ObservableObject {
  @Published var items: [Item] = []
  @Published var isLoading = false
  @Published var errorMessage: String?

  var hasItems: Bool { !items.isEmpty }

  func setItems(_ value: [Item]) { items = value }
  func setLoading(_ value: Bool) { isLoading = value }
  func setError(_ value: String?) { errorMessage = value }
}
```

## Formulating a New Component

When creating a component:

1. Keep it `@MainActor` if it writes observable store state.
2. Read dependencies from app-global composition (`gql`, `appAuthClient`, `store`, `components`) as established.
3. Perform side effects and API calls.
4. Write resulting state transitions into stores.
5. Keep methods workflow-oriented and intent-named.

Example shape:

```swift
@MainActor
final class ExampleComponent {
  private var exampleStore: ExampleStore { store.exampleStore }

  func loadInitialData() async {
    exampleStore.setLoading(true)
    defer { exampleStore.setLoading(false) }
    do {
      let rows = try await gql.fetchRows()
      exampleStore.setItems(rows)
      exampleStore.setError(nil)
    } catch {
      exampleStore.setError(error.localizedDescription)
    }
  }
}
```

## SwiftUI Injection Pattern

Prefer leaf injection:

```swift
RootView()
  .environmentObject(store.sessionStore)
  .environmentObject(store.appAlertStore)
  .environmentObject(components)
```

Why:

- avoids parent-store publish forwarding glue.
- makes ownership explicit.
- keeps observation direct: each view watches exactly the leaf state it renders.

## Common Anti-Patterns to Avoid

- store performs GraphQL requests.
- store depends on component or auth client.
- view contains multi-step bootstrap logic.
- deferred auth starts tied to sheet-dismiss lifecycle when immediate tap intent is available.
- unconditional global reloads after unrelated URL events.
- naming workflow entrypoints as vague `bootstrap` when intent can be explicit.

## Practical Review Checklist

Before shipping, verify:

- store files contain state + mutators only.
- components own all side effects and workflow sequencing.
- views are declarative and call components.
- global and local state are separated correctly.
- auth callback handling is gated to expected redirect URL.
- startup and post-auth loading paths are explicit and non-duplicated.
