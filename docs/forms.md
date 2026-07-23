# Backend-Driven Forms (SchemaForm)

Entity create/edit forms are defined on the backend and rendered generically. Adding a form is backend work only; the web app has zero per-form code.

## How it works end to end

1. Codegen converts every GraphQL input type ending in `Fields` (e.g. `CreateProjectFields`) into a JSON Schema definition (`firebase/functions/prebuild.sh` → `generated/`).
2. A form resolver builds `{ jsonSchema, uiSchema, defaultData }` with `buildSchemaForm` (`firebase/functions/src/Utils/SchemaForms.ts`): display order, human field titles, per-field overrides (e.g. multiline description), and — for update forms — `defaultData` from the existing row.
3. It is exposed as a query (`projectCreateFormSchema`, `projectUpdateFormSchema(input: { objectId })`) in `Graphql/Core/Schema.gql`.
4. The web page passes the payload to `UiQueryViewFormModal` (from `@base/design-system`), which parses it and renders with `SchemaFormRuntime` — RJSF core + ajv validation with our own Radix/vanilla-extract widgets.
5. Submit fires the corresponding mutation with `{ idempotencyKey: crypto.randomUUID(), fields: formData }`.

## Recipe: add a form for a new entity

Imitate `firebase/functions/src/Graphql/Resolvers/Project/ProjectSchemaFormResolvers.ts`; wire the queries into the SDL; run `npm run codegen`; point the page's QueryView modal at the new queries. Done.

## Never

- Never hand-build entity CRUD forms in `web/app` (login is the only hand-built form).
- Never encode form layout in the client — display order, titles, and widgets come from the backend `uiSchema`.
