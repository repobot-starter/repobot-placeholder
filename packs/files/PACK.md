# Pack: files

Feature pack (cloud app): Locker, a file-storage app — the drop-box shape.
Every signed-in user gets a private library served from real cloud storage:
a folder tree, drag-and-drop uploads (dropped folders recreate their tree),
inline previews, starring, trash, search, sort, downloads, and public share
links. The library is owner-scoped end to end: files live server-side at a
public URL, so identity is what separates one person's locker from another's
— which is why this pack requires AUTH and is NOT local-first.

The images pack is this pack's sibling: both write the same kernel drive
domain, so a project carrying both features has Photos act as a lens over
the same library.

## What ships

- The locker at `/`: `web/app/src/View/Files/FilesPage.tsx` — session gate
  (anonymous preview sessions get their own empty-then-seeded library),
  folder tree sidebar, list/grid toggle, search, A–Z / newest sort, upload
  tray with per-file progress, drop overlay, preview modal (image / PDF /
  text / audio / video), rename / move / star / trash / restore / delete,
  share-link copy + revoke, download. Display copy lives in
  `filesContent.ts`.
- The drive domain (kernel): `drive_entries` binds finalized uploads into an
  owner-scoped tree over the storage kernel — see
  `firebase/functions/src/Services/Drive/DriveService.ts` and
  `Graphql/Core/Drive/Drive.gql`. This pack reimplements none of it.
- The upload pipeline: `web/app/src/Drive/driveUpload.ts` — the Settings
  avatar flow (createUpload → PUT → finalizeUpload) under the DRIVE
  admission profile (broad type allowlist, 100MB cap, bytes PUT straight to
  signed GCS URLs when deployed), then `registerDriveFile` binds the upload
  into the tree.
- Share links: `shareDriveEntry` flips the underlying upload PUBLIC — the
  stable `/file/<id>` URL the storage function already serves — and back to
  PRIVATE, which revokes the link. Active content (HTML, executables) is
  never admitted, so a shared URL can carry documents and media but never a
  page that executes in the app's origin.
- The demo library: baked assets under `web/app/public/files/demo/` pushed
  through the NORMAL upload flow on first sign-in (works in workspace
  STORAGE_MODE=local and deployed GCS) — a small brand-project file set:
  folders, a budget CSV, an invoice PDF, a logo SVG, moodboards. "Clear
  demo library" (sidebar) runs `clearDriveLibrary` and never re-seeds.

Set [`../active.json`](../active.json) to `{ "key": "files" }` to make this
pack the home surface.

## Access model (and how to change it)

Default: open sign-up with email codes; every user sees only their own
library (owner-scoped rows, `assertOwner` semantics). Locking registration
down is an agent-sized customization:

1. Invite-only: disable public sign-up in the auth kernel's config and
   create users from the Users admin page.
2. Single-tenant locker: after creating the owner account, gate `/login`'s
   sign-up view off (`authMethods` stays `email-code`) so new addresses
   can't register.
3. Shared team library: replace the owner conditions in `DriveService`
   with an account-scoped condition — the tree becomes per-account instead
   of per-user.

## Agent recipes

1. Change the accepted types or the cap: edit the DRIVE profile in
   `firebase/functions/src/Services/Storage/StorageConfig.ts` (keep active
   content off the allowlist; that is the shared-URL safety story).
2. Expiring share links: today a share is a visibility flip. For expiry,
   store `sharedUntil` on the drive entry and flip visibility back in a
   scheduled job (jobs kernel).
3. Previews for more types: extend `drivePreviewKind` in
   `web/app/src/Drive/driveFormat.ts` and the preview modal's switch.

## Non-goals for this pack

- Collaborative shares or per-file permissions (a share link is public;
  everything else is owner-only)
- Server-side thumbnailing or file conversion (functions never run image
  code; the images pack does its processing client-side)
- Sync clients / desktop agents (this is the web surface over the drive
  domain)
