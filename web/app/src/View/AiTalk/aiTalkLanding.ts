import type { LandingConfig } from "@ui"

/**
 * The talk pack's web landing as a landing-kernel config (docs/landing.md).
 * The product itself is the native iOS surface — hold-to-talk voice over
 * OpenAI Realtime — so this page presents it and explains how the pieces
 * fit. The `dark-dev` preset carries the pack's near-black look; the brand
 * accent flows in from `repobot.theme.json` via the preset overlay.
 */
export const aiTalkLanding: LandingConfig = {
    style: { preset: "dark-dev" },
    sections: [
        {
            type: "nav",
            variant: "minimal",
            content: {
                logo: { emoji: "🎙️", name: "TalkBot" },
            },
        },
        {
            type: "hero",
            variant: "centered-stack",
            content: {
                badge: "The voice surface ships in this project's iOS app",
                headline: "Hold a button. Talk to your app.",
                subheadline:
                    "TalkBot is a push-to-talk voice assistant: hold to speak, release, and the assistant " +
                    "answers out loud with a live transcript. Speech streams straight to OpenAI Realtime — no " +
                    "wake word, no typing.",
                media: { kind: "emoji", emoji: "🎙️" },
            },
        },
        {
            type: "steps",
            variant: "numbered-cards",
            content: {
                kicker: "How it works",
                steps: [
                    {
                        title: "Hold to talk",
                        description:
                            "The iOS app streams mic audio over a WebSocket while the button is held, and commits it when released.",
                    },
                    {
                        title: "The backend brokers",
                        description:
                            "The app never sees your OpenAI key: the backend mints a short-lived Realtime session secret with the voice and prompt configured server-side.",
                    },
                    {
                        title: "It talks back",
                        description:
                            "Replies stream back as audio plus a live transcript, and a hold while the assistant is speaking interrupts it — like a real conversation.",
                    },
                ],
            },
        },
        {
            type: "footer",
            variant: "single-row",
            content: {
                blurb:
                    "Voice needs a deployed backend with an OpenAI key (or AI_MODE=openai locally). The chat " +
                    "starter's simulated sandbox mode does not apply to realtime speech.",
            },
        },
    ],
}
