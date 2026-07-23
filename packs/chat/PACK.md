# Pack: chat

Full-stack AI pack: a streaming chat assistant on web and iOS — reasoning
summaries, a real tool-call loop, and token-by-token answers over one NDJSON
HTTP stream.

AI is a kernel capability, not pack-private code — the full layer map and
reuse recipes live in `docs/ai.md`.

## What ships

- The chat surface at `/`: `web/app/src/View/AiChat/AiChatPage.tsx` is a thin
  binder plugging the `useAiChat` stream (`web/app/src/Ai/`, transport in
  `web/core/src/Ai/`) into the design system's `AiChatThread` component; the
  native twin is `ios/App/View/AiChat/` with the Store → Component → View
  layers under `ios/App/Store/AiChatStore.swift` and
  `ios/App/Components/AiChat/`
- The kernel's one streaming endpoint: `ai__request__chat`
  (`firebase/functions/src/CloudFunctions/Ai.ts`), streaming newline-delimited
  `AiChatStreamEvent` JSON. Clients derive its URL from the GraphQL URL — no
  extra config.
- The Ai service layer (`firebase/functions/src/Services/Ai/`): the model turn
  loop, a light markdown-to-segments formatter, and one exemplar tool
  (`get_current_time`) demonstrating the full tool-call cycle
- Two modes, mirroring auth and payments: in the sandbox `AI_MODE=local`
  streams a simulated assistant (no key, no cost, identical protocol); on
  deploy `AI_MODE=openai` runs the real model with the platform-injected
  `OPENAI_API_KEY`
- Conversation context without server state: the client chains each turn's
  `responseId` into the next request's `previousResponseId`

Set [`../active.json`](../active.json) to `{ "key": "chat" }` to make this pack
the home surface.

## Agent recipe: build on the assistant

Tools are the extension point: the assistant becomes a product feature when
it can act on your domain, not when the UI changes (see `docs/ai.md`).

1. Add a tool in `firebase/functions/src/Services/Ai/AiChatTools.ts`: extend
   `aiChatTools` with a definition and give it a case in `executeAiChatTool`.
   Tools run server-side, so they may call your services and database; the
   call streams into the thread's machinery on web and iOS with no client
   changes.
2. Give the assistant a personality by editing `AI_CHAT_SYSTEM_PROMPT` (and the
   model in `AI_CHAT_MODEL`) in
   `firebase/functions/src/Services/Ai/AiChatService.ts`.
3. Restyle the surfaces: the thread is the design system's `AiChatThread`
   (`AiChatThread.styles.css.ts`, theme tokens, full Storybook coverage); the
   pack's page shell owns its night-sky chrome in
   `web/app/src/View/AiChat/AiChatPage.styles.css.ts`; the iOS view mirrors
   the palette in `ios/App/View/AiChat/AiChatView.swift`.
4. The wire protocol lives in three mirrored files (backend `AiChatTypes.ts`,
   web `web/core/src/Ai/AiChatTypes.ts`, iOS `AiChatModels.swift`) — change
   them together.
5. To require sign-in, add the `AUTH` capability, gate the route with
   `ProtectedRoutes` (kernel auth surfaces, never hand-built), and verify the
   bearer token in `CloudFunctions/Ai.ts` with `principalService`.

## Non-goals for this pack

- Real model calls in the sandbox (the simulated assistant is by design; set
  `AI_MODE=openai` plus `OPENAI_API_KEY` in `firebase/functions/.env.local` to
  test the real model locally)
- Persisted chat history (threads live in the client; add a domain via
  `docs/adding-a-domain.md` if you want saved conversations)
- Voice — that is the `talk` pack
