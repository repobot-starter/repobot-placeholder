# Pack: images

Feature pack (cloud app): Contact Sheet, a photo-library app — the camera-roll
shape. Every signed-in user gets a private roll served from real cloud
storage: a capture-date timeline, masonry grid, albums, favorites, and a
lightbox with zoom, slideshow, captions, and rotate. The library is
owner-scoped end to end, which is why this pack requires AUTH and is NOT
local-first.

The files pack is this pack's sibling: both write the same kernel drive
domain, so a project carrying both features has the locker and the contact
sheet reading one library — photos imported here appear as files there.

## What ships

- The contact sheet at `/`: `web/app/src/View/Images/ImagesPage.tsx` —
  session gate (anonymous preview sessions get their own empty-then-seeded
  roll), timeline grouped by capture month, masonry grid (CSS columns,
  natural aspect), favorites lens, album shelf with create/delete and
  membership, lightbox (zoom, slideshow, prev/next, keyboard navigation),
  inline caption editing, rotate, trash. Display copy lives in
  `imagesContent.ts`.
- Client-side image processing — the functions backend never runs image
  code:
    - `web/app/src/Drive/exifCapture.ts`: a built-in JPEG APP1/EXIF reader
      (no dependency) pulling DateTimeOriginal + orientation before upload;
      the capture time lands on the drive entry (`capturedTime`) and orders
      the timeline.
    - `web/app/src/Drive/imageThumb.ts`: canvas decode → 640px-long-edge WebP
      thumbnail, filed as a sibling upload (`thumbUploadId`) through the same
      pipeline; the grid reads thumbnails, the lightbox reads originals.
      Rotate re-encodes the full image client-side and rebinds the entry via
      `replaceDriveEntryMedia`.
- The drive domain (kernel): the same `drive_entries` / `drive_albums`
  tables the files pack uses — see
  `firebase/functions/src/Services/Drive/DriveService.ts` and
  `Graphql/Core/Drive/Drive.gql`. Albums are membership rows, not copies:
  deleting an album never touches photos.
- The upload pipeline: `web/app/src/Drive/driveUpload.ts` under the DRIVE
  admission profile (100MB cap, bytes PUT straight to signed GCS URLs when
  deployed), with the images pack's `prepare` seam deriving EXIF + thumbnail
  per file before registration.
- The demo roll: baked assets under `web/app/public/images/demo/` pushed
  through the NORMAL upload flow on first sign-in (works in workspace
  STORAGE_MODE=local and deployed GCS) — twelve frames spanning six months
  with captions, favorites, and a "Selects" album. "Clear demo library"
  runs `clearDriveLibrary` and never re-seeds.

Set [`../active.json`](../active.json) to `{ "key": "images" }` to make this
pack the home surface.

## Access model (and how to change it)

Default: open sign-up with email codes; every user sees only their own roll
(owner-scoped rows, `assertOwner` semantics). Locking registration down is
an agent-sized customization — see the files pack's PACK.md for the three
recipes (invite-only, single-tenant, shared team library); they apply to
this pack unchanged because both packs sit on the same drive domain.

## Agent recipes

1. Public share links for photos: the domain already supports it —
   `shareDriveEntry` flips the underlying upload PUBLIC. Surface the files
   pack's copy-link action in the lightbox.
2. A bigger thumbnail ladder: add rungs in
   `web/app/src/Drive/imageThumb.ts` and extra sibling uploads; the entry
   carries one `thumbUploadId` today, so a ladder wants a small schema
   addition (e.g. `thumb2xUploadId`).
3. Crop / adjust: out of scope for v1 by design. The rotate action shows
   the shape a client-side edit takes: canvas re-encode →
   `replaceDriveEntryMedia`.
4. HEIC support: browsers cannot decode HEIC; imports fall back to no
   thumbnail and no EXIF. A conversion step needs a wasm decoder in the
   client bundle — keep it out of functions.

## Non-goals for this pack

- Server-side image processing of any kind (thumbnails, EXIF, conversion —
  all client-side)
- A crop/adjust pipeline (v1 ships rotate only)
- Face detection, ML tagging, geo maps
- Collaborative albums (the library is single-owner; a share is a public
  URL to one file)
