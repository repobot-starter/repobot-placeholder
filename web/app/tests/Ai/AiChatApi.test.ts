import { deriveAiChatEndpoint, handleAiChatEventLine, AiChatResponse } from "@base/core"
import { describe, expect, it, vi } from "vitest"

// The AI chat client lives in web/core (docs/ai.md); these tests pin the two
// pure pieces of the transport: endpoint derivation from the GraphQL URL and
// NDJSON stream-line routing.
describe("deriveAiChatEndpoint", () => {
    it("swaps the trailing GraphQL function name for the chat function", () => {
        expect(deriveAiChatEndpoint("http://127.0.0.1:5001/demo/us-central1/graphql__request__api")).toBe(
            "http://127.0.0.1:5001/demo/us-central1/ai__request__chat",
        )
        expect(deriveAiChatEndpoint("https://example.cloudfunctions.net/graphql__request__api/")).toBe(
            "https://example.cloudfunctions.net/ai__request__chat",
        )
    })

    it("throws when the URL does not end with the GraphQL function name", () => {
        expect(() => deriveAiChatEndpoint("https://example.com/graphql")).toThrow(
            /Could not derive the AI chat endpoint/,
        )
    })
})

describe("deriveAiVoiceTurnEndpoint", () => {
    it("swaps the trailing GraphQL function name for the voice function", async () => {
        const { deriveAiVoiceTurnEndpoint } = await import("@base/core")
        expect(
            deriveAiVoiceTurnEndpoint("http://127.0.0.1:5001/demo/us-central1/graphql__request__api"),
        ).toBe("http://127.0.0.1:5001/demo/us-central1/ai__request__voice")
    })
})

describe("runAiVoiceTurn", () => {
    it("surfaces a missing-function body instead of a JSON SyntaxError", async () => {
        const { runAiVoiceTurn } = await import("@base/core")
        vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue({
                ok: false,
                status: 404,
                text: async () => "Function us-central1-ai__request__voice does not exist",
            }),
        )
        try {
            await expect(
                runAiVoiceTurn("http://example/ai__request__voice", { id: "1", transcript: "hi" }),
            ).rejects.toThrow(/voice function is not running/)
        } finally {
            vi.unstubAllGlobals()
        }
    })
})

describe("handleAiChatEventLine", () => {
    const makeCallbacks = () => ({
        onResponse: vi.fn(),
        onError: vi.fn(),
        onComplete: vi.fn(),
    })

    it("routes data lines to onResponse", () => {
        const callbacks = makeCallbacks()
        const response: AiChatResponse = {
            requestId: "req-1",
            requestMessage: "hi",
            responseItems: [],
        }
        handleAiChatEventLine(JSON.stringify({ data: response }), callbacks)
        expect(callbacks.onResponse).toHaveBeenCalledWith(response)
        expect(callbacks.onError).not.toHaveBeenCalled()
    })

    it("routes error lines to onError", () => {
        const callbacks = makeCallbacks()
        handleAiChatEventLine(JSON.stringify({ error: { message: "boom" } }), callbacks)
        expect(callbacks.onError).toHaveBeenCalledWith("boom")
        expect(callbacks.onResponse).not.toHaveBeenCalled()
    })

    it("reports malformed lines without throwing", () => {
        const callbacks = makeCallbacks()
        handleAiChatEventLine("not json", callbacks)
        expect(callbacks.onError).toHaveBeenCalledWith("The server sent a malformed stream event.")
    })
})
