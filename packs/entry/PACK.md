# Pack: entry

A full-stack data-capture workbook (title: Data Capture; the in-app brand stays Capture Data). The user designs
the fields their work needs; the backend builds the entry form from those
live definitions; records live in Postgres. There is deliberately NO landing
page — the tool is the front door: the home route sessions the visitor
(anonymous when signed out) and lands on `/records` with the entry form
already open, so the main flow IS the first paint — fill the modal form,
submit, watch the save in flight, see the table refresh with the new row.
The whole product is dark, black-and-white (the saas register's conviction,
carried by the catalog theme since there is no marketing page to set tone).

## What ships

- No marketing pages (manifest `marketing.pages` is empty by design);
  `marketing.siteName` still brands the app shell, and the kernel's account
  flows (email code or password) remain for users who want a named account.
  `App.tsx homePageByPack.entry` (`EntryEnterPage.tsx`) is the front door:
  ensure a session, then `/records?new=1` (the records view model consumes
  the param and opens the create form)
- The dashboard (manifest `dashboard.destinations`, wired by scaffold-ia;
  Records leads so it is also the post-sign-in default):
    - `/records` — `web/app/src/View/EntryRecords/`: the workbook table.
      Columns are generated from the field definitions; search hits every
      cell; create/edit run through the backend-built modal form
      (`useEntryRecordFormModal.ts`); rows edit/delete inline
    - `/fields` — `web/app/src/View/EntryFields/`: the field designer (text,
      number, date, yes/no, select). Every change reshapes the entry form and
      the table
    - `/overview` — `web/app/src/View/EntryOverview/`: record/field stat
      cards, the latest entries feed, and the New Record action
- The Entry backend domain (`docs/adding-a-domain.md` shape):
  `firebase/functions/src/{Data,Services,Graphql/Resolvers}/Entry/` over the
  `entry_field` / `entry_record` tables. The record form schema
  (`entryRecordCreateFormSchema`) is built dynamically from the live field
  definitions — the headline of backend-driven forms
- A seeded contact log (5 fields, 6 records) so the first paint shows the
  product
- The standalone feature surface at `/entry` (`EntryStandalonePage.tsx`):
  the records workbook with an anonymous-session gate, for when the pack is
  added as a feature into an existing app

## The dashboard as a remix surface

The catalog's `theme` overlay pins the dashboard's look, and each knob is
vocabulary a derived template can flip (see `docs/shell.md` and
`repobot.theme.json`):

- `shell.variant` — sidebar placement/chrome (`sidebar`, `sidebar-inset`,
  `sidebar-topbar`, `top-nav`, `logo-rail`, ...)
- `ui.table.style` — table design (`minimalist` | `standard` | `detailed`)
  and `ui.table.pagination` (`loadMore` | `pages`)
- `ui.forms.presentation` — how the entry form appears
- `brand.primary` / marketing `style.preset` — the visual register

A remix of this pack (`remixOf: "entry"` + a content seed + a theme block)
wears a visibly different dashboard over the same pages.

## Agent recipe: build on the workbook

1. Reshape the starter: use the in-app field designer, or edit the seed in
   the `create_entry` migration for a different first paint.
2. Add a field type (currency, rating, URL): extend the `EntryFieldType`
   enum end to end — migration CHECK, `Entry.gql`, the dynamic form builder
   in `EntrySchemaFormResolvers.ts`, and the cell renderers in
   `EntryRecordsColumns.tsx` / `entryValues.ts`.
3. Validation rules beyond `required`: the record form schema is plain JSON
   Schema — add `minimum`, `pattern`, or enum constraints per field in the
   dynamic builder and the form enforces them with zero frontend changes.
4. CSV import: parse a dropped file into `createEntryRecord` calls keyed by
   `fieldKey`.

## Non-goals for this pack

- Multiple workbooks/tables per project (one book, kept fast; specialize
  per project)
- Row-level ownership or sharing controls (the workspace shares the book;
  AUTH gates access)
- Formulas or computed columns (keep the entry loop fast)
