# AI

AI is a modular kernel capability with the same three-layer shape as auth
(`docs/auth.md`). Understanding the split is what lets you restyle the chat
surface, give the assistant new tools, or add AI to a template that never
shipped with it — without touching the other layers.

| Layer   | Where                                               | What it owns                                                                                                                                               |
| ------- | --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Surface | `web/design-system/src/components/AiChatThread.tsx` | The chat UI: thread, reasoning/tool machinery, answer segments, composer. Purely presentational — data and handlers are injected.                          |
| Client  | `web/core/src/Ai/`                                  | The wire types (`AiChatTypes.ts`) and the NDJSON stream client (`AiChatApi.ts`). `useAiChat` in `web/app/src/Ai/` binds them to React state.               |
| Backend | `firebase/functions/src/Services/Ai/`               | The model turn loop (`AiChatService.ts`), the tool registry (`AiChatTools.ts`), the sandbox simulator, and the voice session broker (`AiVoiceService.ts`). |

The iOS app mirrors the client + surface layers natively:
`ios/App/Components/AiChat/` (models, stream client, component),
`ios/App/Store/AiChatStore.swift`, and `ios/App/View/AiChat/AiChatView.swift`.
Voice has its own iOS surface (`ios/App/View/AiVoice/`,
`ios/App/Components/AiVoice/`) — see `packs/talk/PACK.md`.

## Three modes, one protocol

Like auth and payments, the assistant runs in modes chosen by `AI_MODE`
(see `docs/environments-and-secrets.md`):

- `AI_MODE=local` — the sandbox default (emulator and tests; production boot
  refuses `local`). `AiChatSimulation.ts` streams a simulated assistant with
  the identical protocol: reasoning summaries, a real run of the clock tool,
  and token-by-token answers. No key, no cost, so every template can ship an
  AI surface that works out of the box.
- `AI_MODE=openai` — the real model via the OpenAI Responses API, using
  `OPENAI_API_KEY`, which the platform injects at deploy time from the
  account's connected OpenAI integration when the deploy manifest declares
  the `AI` capability.
- `AI_MODE=gateway` — the same real model calls routed through the
  platform's AI gateway: no OpenAI key needed, usage is billed to the
  account's platform credits. The platform injects `AI_GATEWAY_URL` and a
  per-environment `AI_GATEWAY_TOKEN`; the platform picks this mode
  automatically for deploys whose account has no OpenAI integration
  connected. The Responses-API protocol is byte-identical — the endpoint
  and auth-header switch lives entirely in
  `firebase/functions/src/DependencyWrappers/OpenAiWrapper/OpenAiApiWrapper.ts`.

ElevenLabs speech follows the same shape with `ELEVENLABS_MODE`:

- `ELEVENLABS_MODE=local` — sandbox default. Voice turns accept a transcript
  (or a canned catalog question) and skip TTS, so hold-to-talk is free.
- `ELEVENLABS_MODE=elevenlabs` — real STT/TTS on `ELEVENLABS_API_KEY`,
  injected from the account's connected ElevenLabs integration.
- `ELEVENLABS_MODE=gateway` — the same STT/TTS calls through the platform
  AI gateway (`POST /speech-to-text`, `POST /text-to-speech/{voiceId}`),
  billed to platform credits. Keyless deploys pick this automatically.

Because all modes share one protocol, everything below — surfaces, tools,
tests — behaves the same in each.

## The streaming protocol

Chat streams over a single HTTP POST to the `ai__request__chat` function
(`firebase/functions/src/CloudFunctions/Ai.ts`), whose URL every client
derives from the GraphQL URL (`deriveAiChatEndpoint` in web/core; the iOS
twin does the same). The response is newline-delimited JSON: the server
re-sends the same growing `AiChatResponse` snapshot as reasoning summaries
stream in, tools run, and the answer streams token by token; clients upsert
each snapshot by `requestId`.

The server is stateless: the client chains conversation context by sending
the last turn's `responseId` as the next request's `previousResponseId`
(`useAiChat` does this; so does `AiChatStore.swift`).

The wire types live in three mirrored files — backend
`firebase/functions/src/Services/Ai/AiChatTypes.ts`, web
`web/core/src/Ai/AiChatTypes.ts`, iOS
`ios/App/Components/AiChat/AiChatModels.swift`. Change all three together.

## Tools are the extension point

The fastest way to make the assistant genuinely useful in a product is not a
new UI — it is giving the model tools that reach your services and database.
The registry is `firebase/functions/src/Services/Ai/AiChatTools.ts`, which
ships one exemplar (`get_current_time`) demonstrating the full cycle: the
model requests the tool, the service runs it, the output feeds the next model
turn, and both steps stream to the UI on web and iOS with no client changes.

To add a tool:

1. Extend `aiChatTools` with an `OpenAiToolDefinition` — a name, a
   description the model reads, and a JSON-schema `parameters` object.
2. Give it a case in `executeAiChatTool`. Tools run server-side, so they may
   call your services and database (import them like any service does).
   Return a JSON string; return failures as JSON error payloads rather than
   throwing, so the model can recover and the stream stays alive.
3. That's it — the tool call renders in the thread's machinery section on
   every platform automatically.

The assistant's personality and model are config in `AiChatService.ts`
(`AI_CHAT_SYSTEM_PROMPT`, `AI_CHAT_MODEL`). The tool loop is pinned by
`firebase/functions/test/Ai/AiTest.ts`.

## Iterating on the chat surface (no backend needed)

`AiChatThread` is a design-system component with Storybook coverage
(`AiChatThread.stories.tsx`): empty state, a completed exchange exercising
every segment format, mid-stream states, tool-in-flight, errors, and a
stopped stream, all against mock data. To tune styling:

```
npm run storybook   # from the repo root
```

Edit `AiChatThread.styles.css.ts` (theme tokens only) and watch every state
update live. The chat pack's `AiChatPage` is a thin binder that plugs
`useAiChat` into the component inside the `darkTheme` class — so Storybook is
pixel-identical to the product, and any other template gets the same surface
by doing the same two lines of wiring.

## Adding AI to any template

Any project composed from this kernel can grow the AI capability; nothing
about it is specific to the chat/talk packs.

1. Wire a surface: on web, render `AiChatThread` from `@ui` and feed it
   `useAiChat()` (see `web/app/src/View/AiChat/AiChatPage.tsx` — it is ~40
   lines). On iOS, reuse `AiChatStore` + `AiChatComponent` behind your own
   view.
2. Declare the capability: add `"AI"` to `capabilities` in
   `repobot.deploy.json`. In the sandbox the assistant already works
   (`AI_MODE=local`); on the next deploy the platform injects
   `AI_MODE=openai` + `OPENAI_API_KEY` when the account has an OpenAI
   integration connected, or `AI_MODE=gateway` + `AI_GATEWAY_URL` /
   `AI_GATEWAY_TOKEN` (keyless, billed to platform credits) when it does
   not.
3. Make it yours: set the system prompt, then add domain tools
   (`AiChatTools.ts`) so the assistant can act on your product's data.

Chat history is client-held by design; if the product needs saved
conversations, add a domain (`docs/adding-a-domain.md`) and persist the
snapshots.

## Retrieval ("chat with your data")

Retrieval is the embeddings half of the AI kernel: a domain's content is
embedded once, and the assistant answers questions from the most similar
passages, citing them. Composition is config-shaped like everything else —
a domain hands its documents to the kernel and registers a chat tool; the
kernel owns chunking, embedding, storage, and similarity search.

| Piece             | Where                                                                     | What it owns                                                                       |
| ----------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Embeddings client | `firebase/functions/src/Services/Ai/AiEmbeddingsService.ts`               | `embedTexts`: AI_MODE-split text→vector — the only way app code makes embeddings   |
| Retrieval helper  | `firebase/functions/src/Services/Ai/AiRetrievalService.ts`                | `indexDocuments` (chunk + hash + embed + upsert) and `searchTopK` (top-k cosine)   |
| Store             | `firebase/functions/src/Data/Ai/AiEmbedding.ts`                           | `ai_embeddings`: one row per embedded chunk; `real[]` vector, castable to pgvector |
| Migration         | `firebase/functions/migrations/20260731T000014__create_ai_embeddings.sql` | Guarded `CREATE EXTENSION vector` + the store                                      |
| Exemplar          | `firebase/functions/src/Services/BlogKnowledge/`                          | The blog pack's posts indexed for the assistant's `search_blog_posts` tool         |

### Modes

Embeddings follow `AI_MODE` exactly like chat, so retrieval works in every
environment with no extra configuration:

- `AI_MODE=local` — a deterministic local embedding (hashed bag-of-words,
  unit-normalized). Free and offline, and shared vocabulary genuinely raises
  similarity, so sandbox retrieval demos behave sensibly — and tests can
  assert exact top-k ordering.
- `AI_MODE=openai` — the real embeddings model (`AI_EMBEDDINGS_MODEL` in
  `AiEmbeddingsService.ts`) on the account's own key.
- `AI_MODE=gateway` — the same call through the platform AI gateway's
  `POST /embeddings` route: keyless, model-allowlisted, and metered to the
  account's platform credits like chat tokens.

### Where the vectors live (pgvector)

The store's vector column is `real[]`, not pgvector's `vector` type, so one
schema works everywhere. Where the extension is installed — deployed
Cloud SQL (the platform's DATABASE provisioning guarantees the grants; the
kernel migration's `CREATE EXTENSION vector` enables it) and the local
docker databases (`pgvector/pgvector:pg16` in `scripts/dev-db.sh`) — top-k
runs in SQL by casting to `vector` and ordering by cosine distance. The
embedded sandbox Postgres has no pgvector: the guarded migration no-ops and
the helper scores the same rows with in-app cosine. Both paths order
identically, and the helper picks automatically — callers never know.

### Recipe: retrieval for your domain

1. Own your content in your domain (the exemplar mirrors the blog pack's
   posts in `BlogKnowledgePosts.ts`; a database-backed domain uses its own
   rows).
2. Converge the index with `aiRetrievalService.indexDocuments({ source,
documents })` — chunks are hashed, so unchanged content costs one SELECT
   and zero embedding calls. The exemplar indexes lazily before each
   search; a large or hot corpus moves the same call into its write path or
   a registered job (`docs/jobs.md`).
3. Query with `aiRetrievalService.searchTopK({ source, query, k })`.
4. Make it a chat tool (`AiChatTools.ts`) returning titles/keys with each
   passage so the model can cite — `search_blog_posts` is the worked
   example, and `test/Ai/AiRetrievalTest.ts` pins the whole loop.

### Invariants

- Embeddings always go through the embeddings client
  (`aiEmbeddingsService.embedTexts`) — never raw embeddings API calls, on
  any surface, in any mode.
- Retrieval queries always go through the retrieval helper
  (`aiRetrievalService`) — never hand-written vector SQL against
  `ai_embeddings`.
- Changing the embedding model or dimensions bumps
  `AI_EMBEDDINGS_VERSION`, which re-embeds indexed content on next use —
  never mix vectors from different models in one source.

## Voice

The talk pack's push-to-talk surface is iOS-native over the OpenAI Realtime
API. The server-side broker (`AiVoiceService.ts`, exposed as the public
`createAiVoiceSession` mutation) mints a short-lived Realtime client secret so
the OpenAI key never reaches the device; voice, model, and instructions are
server-side config.

Voice is part of the kernel AI contract: push-to-talk surfaces compose the
broker plus the `AiVoiceStore`/`AiVoiceComponent` twins
(`ios/App/Components/AiVoice/`) — never bespoke Realtime wiring or client-side
keys. Customization is `AI_VOICE_INSTRUCTIONS`, `AI_VOICE_VOICE`, and
`AI_VOICE_MODEL` in the broker.

In `AI_MODE=local` the broker returns a simulated session (its client secret
is the `AI_VOICE_SIMULATED_SECRET` marker) instead of refusing: the component
skips the realtime bridge and plays scripted transcript replies through the
same store transitions, so connect / hold-to-talk / interrupt are all
exercisable in the sandbox for free — mirroring the chat simulation. Real
speech still requires the real model (`AI_MODE=openai` locally, or any
deploy — the platform's AI gateway brokers Realtime sessions for keyless
`AI_MODE=gateway` environments too). See `packs/talk/PACK.md`.

Web hold-to-talk (the `agent` pack) is a different surface on the same
brain: `ai__request__voice` transcribes with ElevenLabs, runs
`aiChatService.collectChatResponse` (so catalog tools fire), and speaks
the answer with ElevenLabs TTS. The OpenAI and ElevenLabs keys stay on
the server. In `ELEVENLABS_MODE=local` the turn accepts a transcript and
returns no audio; the web client falls back to the browser's speech
synthesis. Customization is `ELEVENLABS_VOICE_ID` and the chat tools /
system prompt. See `packs/agent/PACK.md`.
