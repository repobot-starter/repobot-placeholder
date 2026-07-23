# Template packs

Vertical overlays for `repobot-base`. Each pack lives under `packs/<key>/` with catalog metadata (`catalog.json`) and an agent recipe (`PACK.md`).

| Key         | Template key          | Meaning                                                                                  |
| ----------- | --------------------- | ---------------------------------------------------------------------------------------- |
| `blank`     | `repobot-placeholder` | **No template** — simple landing; default when the user picks no example                 |
| `paint`     | `repobot-paint`       | Retro paint studio (client-only canvas app)                                              |
| `pong`      | `repobot-pong`        | Classic pong cabinet (client-only canvas game)                                           |
| `snake`     | `repobot-snake`       | Terminal snake (client-only canvas game)                                                 |
| `astro`     | `repobot-astro`       | Neon space shooter (client-only canvas game)                                             |
| `blackjack` | `repobot-blackjack`   | Casino blackjack vs a dealer bot (client-only card game)                                 |
| `chess`     | `repobot-chess`       | Full-rules chess vs a bot or a friend (client-only board game)                           |
| `style`     | `repobot-style`       | Dress-to-impress styling game on a runway timer (client-only)                            |
| `cabin`     | `repobot-cabin`       | Flight-attendant cabin sim: serve snacks, calm passengers (client-only)                  |
| `salon`     | `repobot-salon`       | Hair salon glow-up: wash, cut, color, style (client-only)                                |
| `sitter`    | `repobot-sitter`      | Babysitting chaos: fix mishaps before the parents get home (client-only)                 |
| `code`      | `repobot-code`        | Block-programming puzzles: guide a robot through obstacle courses (client-only)          |
| `ludo`      | `repobot-ludo`        | Classic four-color ludo race vs bots or hotseat friends (client-only)                    |
| `gomoku`    | `repobot-gomoku`      | Five-in-a-row on a 15x15 board vs a three-level bot (client-only)                        |
| `tawla`     | `repobot-tawla`       | Backgammon: race the pips, hit the blots, bear off first (client-only)                   |
| `carrom`    | `repobot-carrom`      | Carrom striker board: flick, pocket, cover the queen (client-only)                       |
| `hanafuda`  | `repobot-hanafuda`    | Koi-Koi with the 48-card hanafuda flower deck (client-only)                              |
| `truco`     | `repobot-truco`       | Brazilian truco: manilhas, bluffs, and raise ladders (client-only)                       |
| `race`      | `repobot-race`        | Neon highway racer: lane changes, nitro, overtake bonuses (client-only)                  |
| `chimney`   | `repobot-chimney`     | Rooftop runner: jump house by house, land in a chimney and you get cooked (client-only)  |
| `link`      | `repobot-link`        | Link-in-bio page: profile, links, socials, theme palettes (client-only)                  |
| `folio`     | `repobot-folio`       | Editorial portfolio: hero statement, filterable projects, contact (client-only)          |
| `trade`     | `repobot-trade`       | Supply-chain business site: commodities, journey timeline, shipment board (client-only)  |
| `launch`    | `repobot-launch`      | Startup landing page: waitlist, features, pricing, FAQ (client-only)                     |
| `blog`      | `repobot-blog`        | Markdown blog: tag-filtered post list, article reader, tiny parser (client-only)         |
| `menu`      | `repobot-menu`        | Café site: menu with dietary filters, live open/closed badge, contact (client-only)      |
| `flash`     | `repobot-flash`       | Flashcards with a five-box spaced-repetition scheduler, progress on device (client-only) |
| `quiz`      | `repobot-quiz`        | Multiple-choice trivia: instant feedback, explained misses, best scores (client-only)    |
| `sugar`     | `repobot-sugar`       | Physical retail landing page: rotating daily menu, live machine statuses (client-only)   |
| `auth`      | `repobot-auth`        | User accounts on the kernel Identity domain (full-stack; built-in auth on deploy)        |
| `shop`      | `repobot-shop`        | Single-product storefront with Stripe checkout, no accounts (full-stack)                 |
| `chat`      | `repobot-chat`        | AI chat thread with streaming answers, reasoning, and tool calls (full-stack; web + iOS) |
| `talk`      | `repobot-talk`        | Push-to-talk AI voice assistant on iOS via OpenAI Realtime (full-stack)                  |

[`active.json`](active.json) records which pack owns `/` in this checkout. Kernel exemplar routes (`/login`, `/users`, `/projects`) always remain for agents; inactive packs keep their preview routes (`/paint`, `/pong`, `/snake`, `/astro`, `/blackjack`, `/chess`, `/style`, `/cabin`, `/salon`, `/sitter`, `/code`, `/ludo`, `/gomoku`, `/tawla`, `/carrom`, `/hanafuda`, `/truco`, `/race`, `/chimney`, `/link`, `/folio`, `/trade`, `/launch`, `/blog`, `/menu`, `/flash`, `/quiz`, `/sugar`, `/shop`, `/chat`, `/talk`).

## catalog.json contract

- `key` — pack key; matches the folder and `active.json`.
- `templateKey` — the platform's template id: the GitHub template repo name and the project picker key.
- `clientOnly` — `true` means deploys ship the built web app statically and skip functions, migrations, and database provisioning until the manifest changes.
- `capabilities` — provisioned-infrastructure badges (`AUTH`, `DATABASE`, `EMAIL`, `BACKEND`, `PAYMENTS`, `AI`) shown in the picker and read by the platform to decide what to provision and inject (`PAYMENTS` adds the deploy-time `STRIPE_SECRET_KEY` from the account's connected Stripe integration; `AI` adds the deploy-time `OPENAI_API_KEY` the same way).
- `authMethods` — optional, packs with `AUTH` only: the sign-in methods this template ships (see `docs/auth.md`), defaulting to `["email-code"]`. Compose emits it into `repobot.deploy.json` (driving the platform's auth provisioning and the deploy-time `VITE_AUTH_METHODS`) and stamps `AUTH_METHODS` into the native config files.

Packs that need user accounts declare the `AUTH` capability and reuse the kernel auth component (`AuthCard`/`AuthScreen` behind `ProtectedRoutes` and the `/login` route; native `SignInView` twins) — never a bespoke login form. Enabled methods and branding are configuration, not new UI: see `docs/auth.md`.

Packs (and upgrades) that want an assistant declare the `AI` capability and reuse the kernel chat surface (`AiChatThread` over `useAiChat` on web; the `AiChatStore`/`AiChatComponent` twins on iOS) — never bespoke streaming plumbing. Customization is the system prompt and domain tools in `AiChatTools.ts`: see `docs/ai.md`. In the sandbox the assistant is simulated for free (`AI_MODE=local`); deploys get the real model via the account's connected OpenAI integration.

## Pack palettes and the theme contract

Packs own their art direction, but the customer's `repobot.theme.json` always
wins. A pack's style file declares its palette as constants routed through the
brand overlay (`@base/design-system/theme`):

```ts
import { packBrand, packFont } from "@base/design-system/theme"

const accent = packBrand?.accent ?? "#d95d43" // the pack's own art palette
const accentSoft = packBrand?.accentSoft ?? "#fbe9e4"
const sans = packFont ?? "Sora, system-ui, sans-serif"
```

`packBrand`/`packFont` are `null` until the project actually customizes the
theme, so fresh templates look exactly as designed while "make it my brand
color" flows into every pack without touching its styles. Never hardcode an
accent directly in a new pack — route it through the overlay.

## Composing a template repo

`scripts/compose-pack.sh <pack-key> <output-dir>` stages the kernel with the pack applied: sets `active.json`, stamps the pack key into the native `ActivePack` constants (`ios/App/Config/ActivePack.swift`, `android/.../config/ActivePack.kt` — the iOS/Android home surfaces switch on it, mirroring the web `homePageByPack`), and emits a root `repobot.deploy.json` (capability manifest read by the deployer). The platform's publish pipeline runs this per pack and pushes each staged tree to its GitHub template repo.

Agents upgrading a project (e.g. adding a backend to a game) should flip `clientOnly`/`capabilities` in `repobot.deploy.json`; the next deploy provisions the newly required infrastructure.
