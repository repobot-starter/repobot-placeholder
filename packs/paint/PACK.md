# Pack: paint

Client-only vertical pack: a retro paint studio (stacked paper/overlay canvases, flood fill, shape previews, emoji stickers) at `web/app/src/View/Games/Paint/`.

## What ships

- Paint window with tool palette, brush settings, sticker tray, and swatch palette (owns `/` when this pack is active; otherwise preview at `/paint`)
- `PaintCanvas` component: committed "paper" canvas plus a live-preview overlay, with undo/redo history and PNG export
- Drawing helpers (`tools.ts`) — scanline flood fill, shape stroking, custom tool cursors; no assets, no network, no backend
- Native ports of the studio as the home surface of the iOS app (`ios/App/View/Games/Paint/`) and the Android app (`android/.../view/games/paint/`) — finger drawing, fill, shapes, stickers, undo/redo, PNG export via the iOS share sheet; no backend

Set [`../active.json`](../active.json) to `{ "key": "paint" }` to make this pack the home surface.

## Agent recipe: extend the studio

- Tools, shapes, stickers, swatches, and status-bar tips are plain arrays at the top of `PaintPage.tsx`.
- Stroke behavior (brush/pencil/eraser widths, sticker stamping, history depth) lives in `PaintCanvas.tsx`; flood fill and shape drawing live in `tools.ts`.
- Add a persistent gallery by following `docs/adding-a-domain.md` (SQL migration + service + GraphQL + typed hooks), then flip `clientOnly` in `catalog.json` so deploys provision the backend.

## Non-goals for this pack

- Auth / accounts (platform flow; see the auth pack)
- Server-side state — the shipped studio is fully client-side
