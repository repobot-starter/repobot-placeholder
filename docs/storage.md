# Storage

Storage is a modular kernel capability with the same three-layer shape as
payments (`docs/payments.md`) and documents (`docs/documents.md`): it moves
file bytes between clients and durable object storage, with ownership and
visibility enforced server-side. The defining design choice is that **the
backend never proxies browser upload bytes in deployed mode** — clients PUT
directly to a V4 signed GCS URL, so a 20 MB avatar never rides through a
Cloud Function. Server-side flows are the one exception: `writeFile` files
bytes the server already holds (a generated PDF, an export), inline through
GraphQL under the same size cap.

| Layer   | Where                                                       | What it owns                                                                                                                                 |
| ------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Data    | `firebase/functions/src/Data/Storage/`                      | The `uploads` table: owner, storage key, content type, size, `PUBLIC`/`PRIVATE` visibility, `PENDING`/`READY` status, file name.             |
| Service | `firebase/functions/src/Services/Storage/`                  | `StorageService` (create/finalize/writeFile/url/delete), the config allowlist (`StorageConfig.ts`), local disk store, and capability tokens. |
| Client  | `web/core/src/Storage/StorageApi.ts`                        | Endpoint derivation, URL resolution, and `putUploadBytes` (the byte PUT against either slot flavor).                                         |
| HTTP    | `firebase/functions/src/CloudFunctions/Storage.ts`          | `storage__request__api`: local-mode `PUT /upload` and the stable `GET /file/<id>` serving URL (both modes).                                  |
| GCS     | `firebase/functions/src/DependencyWrappers/StorageWrapper/` | The ONLY GCS call site: V4 signed upload/download URLs, inline object writes, object verification, object delete.                            |

## Two modes, one lifecycle

Like payments and AI, storage runs in two modes chosen by `STORAGE_MODE`
(see `docs/environments-and-secrets.md`):

- `STORAGE_MODE=local` — the sandbox default and the dev-posture fallback.
  Bytes live on disk under `.devdata/storage` (override with
  `STORAGE_LOCAL_DIR`); the upload URL is a token-guarded `PUT /upload` on
  the storage function. Production boot refuses this mode.
- `STORAGE_MODE=gcs` — deployed environments with the `STORAGE` capability.
  Bytes live in the platform-provisioned `STORAGE_BUCKET` under
  `STORAGE_PREFIX` (the environment's own key namespace inside a shared
  per-posture bucket). Upload PUTs and private downloads use V4 signed URLs
  minted with the runtime's default service account — no key files.

The lifecycle is identical in both modes:

1. `createUpload` validates the declared content type against the
   `StorageConfig.ts` allowlist and the size cap, inserts a `PENDING` row,
   and returns `{ uploadId, uploadUrl, headersJson }`.
2. The client PUTs the bytes to `uploadUrl` with the returned headers
   (`putUploadBytes` in web/core handles both flavors).
3. `finalizeUpload` verifies the bytes actually exist (disk stat locally,
   object metadata on GCS), records the actual size, and flips the row to
   `READY`. Nothing is ever served from a `PENDING` row.

## Server-side writes: `writeFile`

Domain services and API-only clients can't drive the browser-shaped
create/PUT/finalize round-trip — a service that just generated a PDF already
holds the bytes. `writeFile(input)` files them in one call:
`{ contentType, bytesBase64, visibility, fileName? }` plus an idempotency
key, returning the same `Upload` record `finalizeUpload` returns.

The path reuses the browser flow's machinery rather than paraphrasing it:
the same admission validation (allowlist + cap, shared with `createUpload`),
the same storage backends (local disk; the bucket via the wrapper's inline
write, riding the runtime service account's existing `objectAdmin` grant —
no signed URL, no new IAM), and the same finalize verification before the
row flips to `READY`. Downstream code cannot tell which path filed an
upload; `fileName` (nullable) is the only record field browser uploads never
set. Replaying the idempotency key returns the original row without
rewriting the bytes.

Because the bytes ride inside the GraphQL JSON body (~4/3 base64
inflation), the GraphQL function's JSON limit derives from
`storageConfig.maxSizeBytes`; the cap itself is unchanged, so an inline
write can never carry what a browser upload couldn't.

## Serving

`GET /file/<id>` on `storage__request__api` is the stable serving URL in
both modes — the one URL apps embed in `<img>` tags. PUBLIC files serve
freely; PRIVATE files require the short-lived download token that `fileUrl`
mints after an owner check. Local mode streams the bytes from disk; gcs mode
302s to a fresh short-lived signed GCS URL. One consistent consequence: the
bucket never needs public ACLs, and the client never sees anything but
signed URLs.

`fileUrl(uploadId)` resolves the right URL per visibility: the stable
`/file/<id>` path for PUBLIC files, a short-lived owner-checked URL for
PRIVATE ones. URLs that are paths (they start with `/`) are resolved
client-side against the storage endpoint derived from the GraphQL URL
(`deriveStorageEndpoint`); signed GCS URLs are absolute and pass through.

## Ownership and authorization

All five GraphQL operations (`createUpload`, `finalizeUpload`, `writeFile`,
`fileUrl`, `deleteUpload`) are authenticated — none join the public
allowlists in `GraphqlServer.ts`. The upload row records the creator's user
id; finalize, private download, and delete re-check it in the service
(layer 2 of `docs/authorization.md`). Local-mode HTTP surfaces are guarded
by single-upload, single-scope JWTs (`StorageTokens.ts`) signed with the
environment's existing secret, so an upload URL can never read and a
download link can never write.

## The consumer exemplar: the Settings avatar

`web/app/src/View/Settings/SettingsPage.tsx` (`AvatarCard`) is the kernel
rubric's real consumer: pick an image → upload through the kernel → persist
the upload id on the user row (`users.avatar_upload_id`, exposed as
`User.avatarUploadId`) → the app shell renders it in the profile affordance
(`AppShellProfile.avatarUrl`). Avatars are PUBLIC uploads: anyone with the
stable URL can view one, and replacing an avatar best-effort deletes the
previous upload.

## Invariants

- Uploads are never hand-built: all file persistence goes through the
  storage kernel — never bespoke bucket wiring, never raw filesystem writes.
- Private files are never served without an owner check (service-layer, on
  every mint of a download URL or token).
- The client never receives bucket credentials — only signed URLs and
  short-lived capability tokens.
- Nothing is served from a `PENDING` row; `READY` is only set after the
  kernel verified the bytes exist — on both the browser and the `writeFile`
  path.
- `StorageConfig.ts` is the single tuning surface (allowlist, size cap,
  URL TTLs); consuming features never re-validate on their own, and
  `writeFile` shares `createUpload`'s validation rather than copying it.

## Testing

`firebase/functions/test/Storage/StorageTest.ts` pins the kernel blackbox
through GraphQL: the create → PUT → finalize → serve → delete happy path on
real local disk (a temp `STORAGE_LOCAL_DIR`), owner checks on PRIVATE files
and delete, content-type/size refusals, gcs-mode URL minting against a
stubbed `StorageWrapper`, and the production-refuses-local boot check. The
`writeFile` block pins the server-side path the same way: local-mode round
trip with record parity against the browser flow, HTML/allowlist and size
refusals, strict base64, idempotent replay, owner checks, and gcs-mode
inline writes through the stubbed wrapper.
