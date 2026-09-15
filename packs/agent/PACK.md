# Pack: agent

Feature pack (one-page app): an AI desk that talks, chats, and lives on a
database. The starter catalog is a most-popular-songs-of-all-time list —
seeded with enough history and opinion that the agent is actually fun to
talk to. Chat runs on the kernel's ChatGPT loop; voice runs on ElevenLabs
speech-to-text and text-to-speech around the same brain. Change a song in
the data tab (or ask the agent to) and the next turn already knows.

AI is a kernel capability, not pack-private code — the full layer map and
reuse recipes live in `docs/ai.md`. The songs table is a normal domain
(`docs/adding-a-domain.md`).

## What ships

- The desk at `/`: `web/app/src/View/AgentDesk/` — a dark black-and-white
  dashboard with three tabs:
    - **Agent** — the kernel `AiChatThread` over `useAiChat`, with tools
      that read and write the songs catalog
    - **Voice** — hold-to-talk on the web. Audio goes to
      `ai__request__voice_turn` (ElevenLabs STT → the same chat brain →
      ElevenLabs TTS). The OpenAI and ElevenLabs keys never reach the
      browser
    - **Data** — the live chart: rank, title, artist, year, genre, streams,
      notes. Add, edit, delete; the agent sees the same rows
- No marketing pages (manifest `marketing.pages` is empty by design). The
  tool is the front door: the home route sessions the visitor (anonymous
  when signed out) and lands on the desk
- The Songs backend domain: `firebase/functions/src/{Data,Services,Graphql/Resolvers}/Songs/`
  over the `songs` table, seeded with twenty-four canonical hits
- Chat tools in `AiChatTools.ts` (`list_songs`, `search_songs`, `get_song`,
  `add_song`, `update_song`, `remove_song`) so both surfaces share one
  brain
- The standalone feature surface at `/agent` (`AgentStandalonePage.tsx`)
  for when the pack is added into an existing app

Set [`../active.json`](../active.json) to `{ "key": "agent" }` to make this
pack the home surface.

## The workspace simulation (and the real models)

Like the chat pack, the workspace works for free:

- `AI_MODE=local` streams a simulated assistant that actually runs the
  song tools against the seeded catalog — no OpenAI key, no cost
- `ELEVENLABS_MODE=local` skips ElevenLabs: the voice tab still hold-to-talks,
  the turn uses a transcript (browser speech recognition, or a canned
  catalog question), and the reply is spoken with the browser's own
  speech synthesis

Real speech and a real model: set `AI_MODE=openai` + `OPENAI_API_KEY` and
`ELEVENLABS_MODE=elevenlabs` + `ELEVENLABS_API_KEY` in
`firebase/functions/.env.local` to test locally. Deployed environments get
both automatically when the AI capability is declared — the platform's AI
gateway covers ChatGPT and ElevenLabs for keyless accounts (billed to
platform credits), or the account's own OpenAI / ElevenLabs integrations
when they are connected. Users never need to bring an API key.

## Agent recipe: build on the desk

1. Change the catalog by editing the seed in the `create_songs` migration,
   or just ask the agent (or use the Data tab) — the table is live.
2. Point the same desk at a different domain: add a table, give it tools in
   `AiChatTools.ts`, and restyle the Data tab. The Agent and Voice tabs
   keep working with no client change.
3. Restyle the desk: `AgentDeskPage.styles.css.ts` owns the black-and-white
   chrome (accent and font route through the brand overlay). The thread
   itself is the design system's `AiChatThread`.
4. Change the voice: `ELEVENLABS_VOICE_ID` and `ELEVENLABS_TTS_MODEL` in
   `firebase/functions/src/Services/Ai/ElevenLabsService.ts`.
5. Change the personality: `AI_CHAT_SYSTEM_PROMPT` in `AiChatService.ts`.

## Non-goals for this pack

- Always-on wake-word listening (audio only streams while the button is
  held)
- Multi-user voice rooms (single user ↔ assistant by design)
- Persisted chat history (threads live in the client; add a domain if you
  want saved conversations)
