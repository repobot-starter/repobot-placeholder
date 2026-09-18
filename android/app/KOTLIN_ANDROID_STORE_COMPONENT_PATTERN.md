# Kotlin Android Store and Component Pattern

This document defines the canonical pattern for Kotlin Android agent-driven development in this codebase. It is the Android twin of `ios/App/SWIFT_IOS_STORE_COMPONENT_PATTERN.md`.

Use this when adding new features, refactoring flows, or reviewing architecture.

## Goals

- Keep architecture predictable: `Store -> Component -> View`.
- Keep stores as state containers only.
- Keep business logic, workflows, and side effects in components.
- Keep composables declarative and thin.
- Observe leaf stores directly (`SessionStore`, `AppAlertStore`) via `collectAsState()` instead of relay layers.

## Layer Responsibilities

### Store Layer (state only)

Stores are plain classes exposing `StateFlow` state. They should represent UI-observable state and nothing else.

**Store must contain:**

- a private `MutableStateFlow` and a public read-only `StateFlow`.
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

Composables should:

- observe leaf stores via `store.<leaf>.state.collectAsState()`.
- render from state.
- call component suspend methods from user actions (`scope.launch { ... }`).
- keep local ephemeral UI state in `remember { mutableStateOf(...) }` (text fields, sheet visibility, toggles, local selection).

Composables should not:

- call GraphQL directly.
- embed business rules beyond UI validation.
- implement multi-step workflows.

## Global vs Local State

### Global stores (app composition)

Use global stores for cross-screen app state:

- `SessionStore`: auth/session/auth status.
- `AppAlertStore`: top-level alerts and toast-like app notifications.

### Component-owned runtime state (not in store)

Use component/dependency-wrapper state for transport/runtime internals that are not UI domain state:

- in-flight refresh coordination.
- callback parsing helpers.
- temporary request internals and retry mechanics.

### View-local state

Keep ephemeral UI-only state in composables:

- sheet open/close.
- local form draft text.
- local dropdown expansion/search text.
- temporary selection staging for UI transitions.

## Formulating a New Store

When creating a store, follow this template:

1. Define a focused state domain (auth, workspace, alerts, etc.).
2. Add only flow state and pure derived properties.
3. Add minimal mutators needed by components.
4. Avoid importing integration libraries.
5. Avoid depending on other stores/components.

Example shape:

```kotlin
class ExampleStore {
    data class State(
        val items: List<Item> = emptyList(),
        val isLoading: Boolean = false,
        val errorMessage: String? = null,
    )

    private val _state = MutableStateFlow(State())
    val state: StateFlow<State> = _state.asStateFlow()

    val hasItems: Boolean get() = _state.value.items.isNotEmpty()

    fun setItems(value: List<Item>) { _state.value = _state.value.copy(items = value) }
    fun setLoading(value: Boolean) { _state.value = _state.value.copy(isLoading = value) }
    fun setError(value: String?) { _state.value = _state.value.copy(errorMessage = value) }
}
```

## Formulating a New Component

When creating a component:

1. Read dependencies from app-global composition (`gql`, `appAuthClient`, `store`, `components` in `components/AppComponents.kt`) as established.
2. Perform side effects and API calls in suspend functions.
3. Write resulting state transitions into stores.
4. Keep methods workflow-oriented and intent-named.

Example shape:

```kotlin
class ExampleComponent {
    private val exampleStore: ExampleStore get() = store.exampleStore

    suspend fun loadInitialData() {
        exampleStore.setLoading(true)
        try {
            val rows = gql.fetchRows()
            exampleStore.setItems(rows)
            exampleStore.setError(null)
        } catch (error: Exception) {
            exampleStore.setError(error.message)
        } finally {
            exampleStore.setLoading(false)
        }
    }
}
```

## Compose Observation Pattern

Prefer direct leaf observation:

```kotlin
@Composable
fun ExampleScreen() {
    val sessionState by store.sessionStore.state.collectAsState()
    val scope = rememberCoroutineScope()
    // render from sessionState; call components from actions:
    // scope.launch { components.example.loadInitialData() }
}
```

Why:

- avoids parent-store publish forwarding glue.
- makes ownership explicit.
- keeps observation direct: each composable watches exactly the leaf state it renders.

## Common Anti-Patterns to Avoid

- store performs GraphQL requests.
- store depends on component or auth client.
- composable contains multi-step bootstrap logic.
- unconditional global reloads after unrelated deep-link events.
- naming workflow entrypoints as vague `bootstrap` when intent can be explicit.

## Practical Review Checklist

Before shipping, verify:

- store files contain state + mutators only.
- components own all side effects and workflow sequencing.
- composables are declarative and call components.
- global and local state are separated correctly.
- auth callback handling is gated to the expected redirect URL.
- startup and post-auth loading paths are explicit and non-duplicated.
