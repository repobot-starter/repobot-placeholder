# Backend-Driven Forms (SchemaForm)

Entity create/edit forms are defined on the backend and rendered generically. Adding a form is backend work only; the web app has zero per-form code.

## How it works end to end

1. Codegen converts every GraphQL input type ending in `Fields` (e.g. `CreateProjectFields`) into a JSON Schema definition (`firebase/functions/prebuild.sh` → `generated/`).
2. A form resolver builds `{ jsonSchema, uiSchema, defaultData }` with `buildSchemaForm` (`firebase/functions/src/Utils/SchemaForms.ts`): display order, human field titles, per-field overrides (e.g. multiline description), and — for update forms — `defaultData` from the existing row.
3. It is exposed as a query (`projectCreateFormSchema`, `projectUpdateFormSchema(input: { objectId })`) in `Graphql/Core/Schema.gql`.
4. The web page passes the payload to `UiQueryViewFormModal` (from `@base/design-system`), which parses it and renders with `SchemaFormRuntime` — RJSF core + ajv validation with our own Radix/vanilla-extract widgets. How the form presents (centered `modal`, in-flow `inline` card, or full `page`) follows the `ui.forms` preset in `repobot.theme.json`; a view overrides it per form with the `presentation`/`width` props (a multi-step ship-order flow wants `page`, a quick-add wants `modal`).
5. Submit fires the corresponding mutation with `{ idempotencyKey: crypto.randomUUID(), fields: formData }`.

## Widget surface

Everything below is driven by the schema and uiSchema the backend ships —
the client renders it all with token-styled controls. Preview every widget
live at `/theme/app?surface=forms`.

| You want                      | Schema / uiSchema                                                       | Renders as                                         |
| ----------------------------- | ----------------------------------------------------------------------- | -------------------------------------------------- |
| Text / email / URL / password | `type: "string"` (+ `format: "email" \| "uri" \| "password"`)           | Themed input with the right keyboard/validation    |
| Long text                     | `"ui:widget": "textarea"`                                               | Auto-growing textarea                              |
| Number                        | `type: "number" \| "integer"` (+ `minimum`/`maximum`)                   | Numeric input                                      |
| Date / datetime / time        | `format: "date" \| "date-time" \| "time"`                               | Native picker; datetimes stored as UTC RFC 3339    |
| Single choice, many options   | `enum` or `oneOf` consts                                                | Select dropdown                                    |
| Single choice, 2–5 options    | + `"ui:widget": "radio"` (`"ui:options": { "inline": true }` for a row) | Radio group with optional descriptions             |
| Yes/no                        | `type: "boolean"`                                                       | Checkbox (schema `description` renders under it)   |
| Yes/no, settings idiom        | + `"ui:widget": "switch"`                                               | Toggle switch                                      |
| Multi-select                  | `type: "array", uniqueItems: true, items: { enum \| oneOf }`            | Checkbox group (never a multi-dropdown)            |
| Repeating rows                | `type: "array", items: { type: "object", ... }`                         | Entry cards with add / remove / reorder            |
| Grouped fields                | nested `type: "object"` with a `title`                                  | Titled section set off by a hairline               |
| Live reference picker         | `"ui:widget": "entityRef"` (see below)                                  | Searchable select over app data, opt. quick-create |

The add button on repeating rows derives "+ Add {noun}" from the array's
title; override it with `"ui:options": { "addLabel": "+ Product" }` on the
array's uiSchema entry.

## Nested objects and arrays from the backend

The codegen recurses into input-object types and lists, so a `*Fields` input
like `containers: [ContainerFields!]` becomes a repeatable entry-card array
with a full nested schema — no frontend work. In `buildSchemaForm`,
`fieldTitles` and `overrides` address nested fields with dotted paths, where
array items use the literal segment `items`:

```ts
buildSchemaForm({
    baseSchemaKey: "CreateOrderFields",
    fieldTitles: { "containers.items.products.items.sku": "SKU" },
    overrides: {
        containers: { uiSchema: { "ui:options": { addLabel: "+ Container" } } },
        "containers.items.internalNote": { omit: true },
        "containers.items.products": { uiSchema: { "ui:options": { addLabel: "+ Product" } } },
    },
})
```

## Reference pickers (`entityRef`) and quick-create

The backend declares the field; the app supplies the data:

```json
"customerId": { "ui:widget": "entityRef", "ui:options": { "reference": "customers", "allowCreate": true } }
```

The page passes `referenceResolvers` (to `UiQueryViewFormModal` or
`SchemaFormRuntime`), keyed by the `reference` name. `search` backs the
type-ahead, optional `resolve` labels stored values on edit forms, and
optional `create` renders the quick-create link (`allowCreate` must also be
set) — typically the app opens a nested `UiQueryViewFormModal` over that
entity's own create SchemaForm and resolves with the new row:

```ts
const referenceResolvers: SchemaFormReferenceResolvers = {
    customers: {
        search: async (query) =>
            (await searchCustomers({ query })).map((c) => ({ value: c.id, label: c.name })),
        resolve: async (id) => {
            const c = await fetchCustomer(id)
            return c && { value: c.id, label: c.name }
        },
        create: { label: "+ Add customer", run: () => openCustomerCreateModal() },
    },
}
```

Without a registered resolver the widget falls back to the plain select over
the schema's `enum`/`oneOf` snapshot, so forms keep working while wiring
catches up.

## Reactivity: the `ui:derived` vocabulary

A root-level `"ui:derived"` rule list makes forms compute as the user types —
evaluated client-side by the runtime on every change, so the backend stays
the single owner of the form definition. Each rule names a `target` path
(`[]` after an array field scopes the rule per item) plus exactly one of:

```json
"ui:derived": [
    { "target": "containers",             "arraySize": "containerCount" },
    { "target": "containers[].reference", "template": "${contractNumber}.C${index + 1}" },
    { "target": "containers[].products[].lineTotal", "expr": "qty * sellPrice" },
    { "target": "totalValue",             "expr": "sum(containers[].products[].lineTotal)" },
    { "target": "oceanFreight",           "visibleWhen": "freightBillable" },
    { "target": "notifyParty2",           "enabledWhen": "notifyParty != ''" }
]
```

- **`template`** — literal text with `${expression}` placeholders. `index` is
  the 0-based position inside a `[]` target.
- **`expr`** — the expression's value is written to the target. Targets of
  `template`/`expr` render read-only; opt out with `"readOnly": false`.
- **`arraySize`** — binds the target array's length to a number (grow appends
  empty rows, shrink truncates) — the "container count drives N sections"
  stepper pattern.
- **`visibleWhen` / `enabledWhen`** — when falsy the target field hides /
  disables. Data is kept while hidden; pair with optional fields (required
  fields still validate). This is the supported conditional-visibility
  mechanism — don't reach for ajv `if`/`then`.

Expressions are a small safe grammar (no eval): field paths resolved from the
nearest array item outward, `+ - * / %`, comparisons, `&& || !`, parentheses,
strings, and `sum()`, `count()`, `round()`, `min()`, `max()`, `currency()`,
`percent()`. Aggregates flatten `[]` paths: `sum(containers[].products[].qty)`.
Rules run in declaration order, so derived line totals can feed a grand total.

## Computed summary band (`ui:summary`)

A root-level `"ui:summary"` renders a read-only totals table under the form
(the "line economics" band), recomputed from live data. Cells use the same
template/expression grammar:

```json
"ui:summary": {
    "title": "Line economics",
    "columns": [
        { "key": "line", "title": "Line" },
        { "key": "qty", "title": "Qty", "align": "right" },
        { "key": "total", "title": "Total", "align": "right" }
    ],
    "rows": [
        { "forEach": "containers[].products[]",
          "cells": { "line": "${description}", "qty": "${qty}", "total": "${currency(qty * sellPrice)}" } },
        { "cells": { "line": "Total", "total": "${currency(totalValue)}" }, "emphasis": true }
    ]
}
```

`forEach` repeats a row per item of an array path; rows without it evaluate
once at the root. `emphasis` bolds totals rows.

## Layout and flows

- **Two-column**: `"ui:options": { "columns": 2 }` on an object (including
  the root) pairs its scalar fields in a responsive grid. Textareas,
  arrays, and nested objects keep the full row automatically; force either
  way per field with `"ui:options": { "fullWidth": true | false }`.
- **Wizard**: a root-level `"ui:steps"` turns the form into a multi-step
  flow — numbered step header, one page at a time, per-step validation on
  Next, a single submit at the end (the modal's button relabels itself):

```json
"ui:steps": [
    { "title": "Account", "description": "Who's setting this up?", "fields": ["name", "email"] },
    { "title": "Plan", "fields": ["plan", "seats"] },
    { "title": "Review", "fields": ["notes", "terms"] }
]
```

Steps list root property names; don't combine `ui:steps` with `$ref`-heavy
root schemas (the per-step subschema doesn't chase refs).

## Recipe: add a form for a new entity

Imitate `firebase/functions/src/Graphql/Resolvers/Project/ProjectSchemaFormResolvers.ts`; wire the queries into the SDL; run `npm run codegen`; point the page's QueryView modal at the new queries. Done.

## Never

- Never hand-build entity CRUD forms in `web/app` (login is the only hand-built form).
- Never encode form layout in the client — display order, titles, and widgets come from the backend `uiSchema`.
- Never reach for a custom form component because a field type seems missing — check the widget table above first; most "complex form" needs are a uiSchema hint away.

Marketing-site lead capture is a different system (`lead-form` section,
including the multi-field `detail-form` variant) — see `docs/landing.md`.
