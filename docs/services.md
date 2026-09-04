# Services

Location: `firebase/functions/src/Services/<Domain>/`. Exemplars: `firebase/functions/src/Services/Project/ProjectService.ts` (CRUD + event publish) and `firebase/functions/src/Services/Identity/UserService.ts` (auth-adjacent, batch loading).

## Shape

- Class with a singleton export: `export const projectService = new ProjectService()`.
- Public methods take a single request object and return typed results. Naming: `create<X>`, `update<X>`, `list<X>s` (returns `{ nodes, pageInfo }`), `get<X>ByIdOrThrow`, `orderedBatchLoadByIds`.
- Body shape is always: zod parse/validate → database operations via the domain's database module → typed return; failures throw `RpcError` with a meaningful code.
- Creates go through `idempotentInsertAndGet` with the caller-provided `idempotencyKey` — services never generate idempotency keys.
- Request/response types are exported at the bottom of the file.

## Cross-domain calls

Import another domain through its module export (`firebase/functions/src/Services/Identity/index.ts`), never deep paths, and never its tables. Domain events (pubsub) are the preferred decoupling for side effects — see `docs/pubsub-events.md`.

## Never

- Never throw bare `Error` — always `RpcError`.
- Never accept positional arguments on public methods.
- Never touch another domain's database module.
