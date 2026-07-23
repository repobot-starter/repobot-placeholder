# Testing

Tests are blackbox and user-perspective: they execute real GraphQL operations against the in-process Apollo server and assert on API-visible results. Exemplars: `firebase/functions/test/Project/ProjectTest.ts`, `firebase/functions/test/Identity/UserTest.ts`.

## The harness (read once, then rely on it)

- `firebase/functions/test/MochaHooks.ts` — root hooks: patches `pg` for transaction-per-test (every test runs in a transaction rolled back afterward — never clean up manually), builds a fresh Apollo server, wires the inline test pubsub wrapper, stubs external boundaries, restores sinon.
- `firebase/functions/test/Utils/TestContext.ts` — types the Mocha context (`this.identityHelper`, `this.projectHelper`, `this.defaults`, `this.fakes`) and provides `addDefaults(this, ["account", "user", "project"])` for prerequisite provisioning.
- `firebase/functions/test/Utils/Gql/GqlUtils.ts` — `executeGql` / `executeGqlSuccess` run operations with a constructed principal; use the `asUser(...)` helper to act as a specific user.
- Domain helpers extend `BaseTestHelper` and speak GraphQL only (`firebase/functions/test/Project/ProjectTestHelper.ts`).
- Factories build inputs with unique values (`firebase/functions/test/Utils/Factories/`).

## Writing a test

```typescript
it("archives a project", async function () {
    await addDefaults(this, ["account", "user", "project"])
    const updated = await this.projectHelper.updateProject({
        objectId: this.defaults.project!.id,
        idempotencyKey: secureKey(),
        fields: { doArchive: true },
    })
    assert.equal(updated.status, "ARCHIVED")
})
```

Use `function () {}` (not arrows) whenever you touch `this`.

## Running

```bash
npm run dev:db:test && npm run migrate:test   # once
npm test
```

## Web tests

The web app has a vitest + Testing Library harness (`web/app/vitest.config.ts`; happy-dom environment, vanilla-extract compiled). Tests live in `web/app/tests/` and render components directly, mocking the generated GraphQL hooks module (`src/generated/graphql/types`) with `vi.mock` — exemplar: `web/app/tests/View/Shop/ShopPage.test.tsx`. No database or emulator is needed.

```bash
npm run test:web
```

## Never

- Never call services or the database directly when a GraphQL path exists.
- Never add an external dependency without a default stub in `MochaHooks.ts` — the `assertAllMethodsStubbed` guard will fail the suite.
- Never write cleanup code; the rollback handles it.
- Never use timeouts in tests — no sleeps/delays (`setTimeout`, `sleep`) to wait for async work, no raising timeout budgets (Mocha `--timeout`, `this.timeout(...)`) to make a failing test pass, and no wall-clock timing assertions. Await the actual promise, event, or condition; for time-dependent logic (debounce, polling, retries), use fake timers (`sinon.useFakeTimers`) or inject the interval so the test controls time deterministically. A timeout failure is a correctness signal (hanging async work, missing stub, leaked handle) — fix the root cause.
