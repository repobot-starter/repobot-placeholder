# Pack: talk

Full-stack AI voice pack: push-to-talk on iOS over OpenAI Realtime — hold the
orb to speak, release, and the assistant answers out loud with a live
transcript. The web page (`/`) presents the product; the product itself is the
native surface.

AI is a kernel capability, not pack-private code — the full layer map and
reuse recipes live in `docs/ai.md`.

## What ships

- The iOS voice surface (`ios/App/View/AiVoice/AiVoiceView.swift`) with its
  Store → Component layers (`ios/App/Store/AiVoiceStore.swift`,
  `ios/App/Components/AiVoice/`): connect, hold-to-talk, live transcript, and
  barge-in (holding while the assistant speaks interrupts it)
- The realtime audio bridge
  (`ios/App/Components/AiVoice/AiVoiceRealtimeBridge.swift`): AVAudioEngine
  capture resampled to 24kHz PCM16 over the OpenAI Realtime WebSocket, with
  streamed audio playback
- The server-side session broker: the public `createAiVoiceSession` mutation
  (`firebase/functions/src/Services/Ai/AiVoiceService.ts`) mints a short-lived
  Realtime client secret — the OpenAI key never reaches the device, and the
  voice, model, and instructions are configured server-side
- The web landing page (`web/app/src/View/AiTalk/`) explaining the surface, composed on the landing kernel via the `LandingConfig` in `aiTalkLanding.ts` (`docs/landing.md`)

Set [`../active.json`](../active.json) to `{ "key": "talk" }` to make this pack
the home surface.

## The workspace simulation (and the real model)

Like the chat pack, the workspace works for free: in `AI_MODE=local` the
`createAiVoiceSession` mutation returns a simulated session and
`AiVoiceComponent` plays scripted transcript replies through the same
connect / hold-to-talk / interrupt workflow — no microphone, no OpenAI, no
keys. Real speech needs the real model: set `AI_MODE=openai` and
`OPENAI_API_KEY` in `firebase/functions/.env.local` to test locally.
Deployed environments get real speech automatically when the AI capability
is declared — the platform's AI gateway brokers Realtime sessions for
keyless accounts (`AI_MODE=gateway`, billed to platform credits), or the
account's own OpenAI integration is injected when one is connected. Users
never need to bring an API key.

## Agent recipe: build on the voice

1. Change what the assistant is like by editing `AI_VOICE_INSTRUCTIONS`,
   `AI_VOICE_VOICE`, and `AI_VOICE_MODEL` in
   `firebase/functions/src/Services/Ai/AiVoiceService.ts` — sessions pick up
   prompt changes on the next connect, with no client change.
2. Restyle the surfaces: the orb and stage live in
   `ios/App/View/AiVoice/AiVoiceView.swift`; the web landing is the landing
   kernel config in `web/app/src/View/AiTalk/aiTalkLanding.ts` — swap its
   style preset, sections, or copy (`docs/landing.md`).
3. Give the voice assistant tools by adding them to the session configuration
   in the broker and handling `response.function_call_arguments.done` events in
   the bridge (the chat pack's `AiChatTools.ts` shows the tool shape).

## Non-goals for this pack

- A web voice surface (the landing page presents the iOS app; browser
  push-to-talk over WebRTC is a natural extension, not shipped)
- Multi-user voice rooms (single user ↔ assistant by design)
- Wake words or always-on listening (audio only streams while the button is
  held)
