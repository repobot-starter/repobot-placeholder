# Pack: trade

Client-only vertical pack: TradeBot, a one-page marketing site for a trade / supply-chain business at `web/app/src/View/Trade/`, rendered entirely from a single typed content file.

## What ships

- An editorial paper-and-ink page (serif statements, black CTAs) wrapped around ops-grade components: a KPI stat strip, commodity cards with spec chips, a supply-chain journey timeline, a live shipment board with status pills, certifications, and a partner wall (owns `/` when this pack is active; otherwise preview at `/trade`)
- Everything renders from [`content.ts`](../../web/app/src/View/Trade/content.ts) — company, stats, commodities, journey steps, shipments, partners, certifications, contact. Edit it (or ask the agent to) and the site updates; no backend, no CMS
- The sample content is a timber exporter, but the shape fits any trade business — coffee lots, steel coils, produce pallets
- Native ports of the site as the home surface of the iOS app (`ios/App/View/Trade/`) and the Android app (`android/.../view/trade/`), rendered from the same content mirrored natively

Set [`../active.json`](../active.json) to `{ "key": "trade" }` to make this pack the home surface.

## Agent recipe: make it yours

- Swap the company, commodities, shipments, and stats in `content.ts` — the page and both native apps re-render from data alone (mirror content edits into `TradeContent.swift` / `TradeContent.kt`).
- Shipment rows carry a `tone` (`success` / `info` / `warning` / `neutral`) that maps to the status pill palette.
- Add real quote intake by following `docs/adding-a-domain.md` (SQL migration + service + GraphQL + typed hooks), then flip `clientOnly` in `catalog.json` so deploys provision the backend.

## Non-goals for this pack

- Auth / accounts (platform flow; see the auth pack)
- A real logistics backend — the shipment board is marketing content, edited like everything else
