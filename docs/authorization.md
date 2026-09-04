# Authorization

Two layers, enforced in two different places. Both are mandatory; neither
substitutes for the other.

## Layer 1 — the execution gate (authentication)

Every GraphQL operation is gated **outside resolvers** by an Apollo plugin in
`firebase/functions/src/Graphql/GraphqlServer.ts`. Before execution starts,
`authorizeExecution` requires an authenticated principal (a verified token on
the request context) for every operation. This makes authentication
fail-closed: a new resolver added without any auth check is still unreachable
anonymously.

- Public root fields are an explicit allowlist (`publicQueryRootFields` /
  `publicMutationRootFields`); introspection (`__schema`, `__type`) and the
  Shop domain's anonymous checkout are the only entries. An operation is
  public only when _every_ root field it selects is allowlisted for its
  operation type, so a public field can never smuggle a protected one through
  in the same document. To expose another public field, add its name to the
  matching set — never weaken the gate itself — and keep the resolver's
  service methods safe without a principal (see `docs/payments.md` for the
  shop exemplar: server-side prices, mode-guarded test completion).
- The gate throws `RpcError("UNAUTHENTICATED", ...)`. Clients receive it as
  `extensions.code = "UNAUTHENTICATED"`.
- The gate proves _who is calling_, not _what they may touch_. It never
  inspects arguments or rows.

## Layer 2 — per-resource checks (authorization)

Checks that a caller may touch a specific row live **in the service layer**,
never in resolvers. The exemplar is `ProjectService.updateProject`
(`firebase/functions/src/Services/Project/ProjectService.ts`): it requires the
acting user to hold a writer role on the project before applying the update.

```ts
async updateProject(request: UpdateProjectRequest): Promise<Project> {
    await this.requireProjectRole(request.objectId, request.actingUserId, ["OWNER", "EDITOR"])
    // ... validate + write
}
```

Conventions:

- Services take the acting user explicitly (`actingUserId` on the request
  object). Resolvers extract it from `context.principal` and throw
  `UNAUTHENTICATED` when the caller has no application user.
- Missing or insufficient membership throws
  `RpcError("PERMISSION_DENIED", ...)` with the roles that would have been
  accepted. Use `UNAUTHENTICATED` for "we don't know who you are",
  `PERMISSION_DENIED` for "we know who you are and the answer is no".
- Membership lookups go through the owning domain service
  (`projectMembershipService.getMembershipForProjectAndUser`), not ad-hoc
  queries at the call site.
- Because the check lives in the service, every entry point (GraphQL,
  pubsub subscribers, future HTTP endpoints) inherits it.

## Testing

Blackbox tests cover both layers in
`firebase/functions/test/Project/AuthorizationTest.ts`:

- anonymous operations are rejected with `UNAUTHENTICATED` before any
  resolver runs, while introspection stays public;
- non-members and read-only members receive `PERMISSION_DENIED`;
  writer roles succeed.

The test harness executes operations with an authenticated-but-userless
principal by default (`testHarnessPrincipal` in `test/Utils/Gql/GqlUtils.ts`).
Act as a specific user with `asUser(user)`; pass `null` to execute
anonymously when testing the gate itself.

## Adding authorization to a new domain

1. Decide the resource's membership/ownership model in the Data layer
   (see `project_memberships` for the shape).
2. Add a `requireXyzRole`-style private helper to the domain service and call
   it at the top of every mutating method (and any read that exposes
   restricted data), taking `actingUserId` on the request object.
3. Resolvers only translate `context.principal` into `actingUserId`.
4. Add blackbox tests: anonymous, non-member, insufficient role, allowed role.
