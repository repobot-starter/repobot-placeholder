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

## Two modes, one protocol

Like auth and payments, the assistant runs in two modes chosen by `AI_MODE`
(see `docs/environments-and-secrets.md`):

- `AI_MODE=local` — the sandbox default. `AiChatSimulation.ts` streams a
  simulated assistant with the identical protocol: reasoning summaries, a real
  run of the clock tool, and token-by-token answers. No key, no cost, so every
  template can ship an AI surface that works out of the box.
- `AI_MODE=openai` — deployed environments. The real model via the OpenAI
  Responses API, using `OPENAI_API_KEY`, which the platform injects at deploy
  time from the account's connected OpenAI integration when the deploy
  manifest declares the `AI` capability.

Because the two modes share one protocol, everything below — surfaces, tools,
tests — behaves the same in both.

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
   (`AI_MODE=local`); on the next deploy the platform provisions the
   `OPENAI_KEY` step and injects `AI_MODE=openai` + `OPENAI_API_KEY` from the
   account's connected OpenAI integration.
3. Make it yours: set the system prompt, then add domain tools
   (`AiChatTools.ts`) so the assistant can act on your product's data.

Chat history is client-held by design; if the product needs saved
conversations, add a domain (`docs/adding-a-domain.md`) and persist the
snapshots.

## Voice

The talk pack's push-to-talk surface is iOS-native over the OpenAI Realtime
API. The server-side broker (`AiVoiceService.ts`, exposed as the public
`createAiVoiceSession` mutation) mints a short-lived Realtime client secret so
the OpenAI key never reaches the device; voice, model, and instructions are
server-side config. Voice has no simulated mode — realtime speech requires
OpenAI (`AI_MODE=local` refuses with instructions). See `packs/talk/PACK.md`.
