import { randomUUID } from "node:crypto"
import { expect } from "chai"
import sinon from "sinon"
import { eq } from "drizzle-orm"
import { aiDb } from "../../src/Data/AiDatabase.js"
import { aiEmbeddingsTable } from "../../src/Data/Ai/AiEmbedding.js"
import {
    OpenAiEmbeddingsRequest,
    OpenAiEmbeddingsResult,
    OpenAiModelTurn,
    OpenAiModelTurnCallbacks,
    OpenAiModelTurnRequest,
    OpenAiWrapper,
    setOpenAiWrapperForTests,
} from "../../src/DependencyWrappers/OpenAiWrapper/index.js"
import { aiChatService } from "../../src/Services/Ai/AiChatService.js"
import { AiChatResponse } from "../../src/Services/Ai/AiChatTypes.js"
import {
    AI_EMBEDDINGS_DIMENSIONS,
    aiEmbeddingsService,
    cosineSimilarity,
    localDeterministicEmbedding,
} from "../../src/Services/Ai/AiEmbeddingsService.js"
import { executeAiChatTool } from "../../src/Services/Ai/AiChatTools.js"
import { aiRetrievalService, chunkTextForEmbedding } from "../../src/Services/Ai/AiRetrievalService.js"
import { resetValidatedEnvForTests } from "../../src/Utils/Env.js"

/**
 * Runs a block with AI env variables temporarily overridden (undefined
 * deletes); the validated-env cache is reset around it so the services see
 * the overrides. Same helper shape as AiTest.ts.
 */
async function withAiEnv(
    overrides: Record<string, string | undefined>,
    block: () => Promise<void>,
): Promise<void> {
    const originals = new Map(Object.keys(overrides).map((name) => [name, process.env[name]]))
    for (const [name, value] of Object.entries(overrides)) {
        if (value === undefined) {
            delete process.env[name]
        } else {
            process.env[name] = value
        }
    }
    resetValidatedEnvForTests()
    try {
        await block()
    } finally {
        for (const [name, original] of originals) {
            if (original === undefined) {
                delete process.env[name]
            } else {
                process.env[name] = original
            }
        }
        resetValidatedEnvForTests()
    }
}

async function withAiMode(mode: string, block: () => Promise<void>): Promise<void> {
    await withAiEnv({ AI_MODE: mode }, block)
}

/** Forces the retrieval helper's in-app cosine path for one block. */
async function withoutPgvector(block: () => Promise<void>): Promise<void> {
    const service = aiRetrievalService as unknown as { pgvectorAvailable?: boolean }
    const original = service.pgvectorAvailable
    service.pgvectorAvailable = false
    try {
        await block()
    } finally {
        service.pgvectorAvailable = original
    }
}

/** A tiny corpus with clearly separated vocabulary. */
const orchardCorpus = {
    source: "test_corpus",
    documents: [
        {
            key: "orchard",
            title: "The Orchard",
            body: "Apple trees fill the orchard. Apple cider and apple pie come from the autumn apple harvest.",
        },
        {
            key: "harbor",
            title: "The Harbor",
            body: "Sailing boats crowd the harbor. Sailors trim the sails while gulls circle the fishing boats.",
        },
        {
            key: "observatory",
            title: "The Observatory",
            body: "Telescopes track distant planets. Astronomers chart rockets, comets, and the winter stars.",
        },
    ],
}

describe("Ai retrieval", function () {
    describe("local embeddings (AI_MODE=local)", function () {
        it("is deterministic, unit-normalized, and vocabulary-sensitive", async function () {
            const first = localDeterministicEmbedding("apple pie and apple cider")
            const second = localDeterministicEmbedding("apple pie and apple cider")
            expect(first).to.deep.equal(second)
            expect(first).to.have.length(AI_EMBEDDINGS_DIMENSIONS)

            const norm = Math.sqrt(first.reduce((sum, value) => sum + value * value, 0))
            expect(norm).to.be.closeTo(1, 1e-9)

            // Shared vocabulary scores higher than disjoint vocabulary.
            const applePie = localDeterministicEmbedding("baking an apple pie")
            const sailing = localDeterministicEmbedding("sailing boats in the harbor")
            expect(cosineSimilarity(first, applePie)).to.be.greaterThan(cosineSimilarity(first, sailing))

            // The embeddings client serves exactly this vector in local mode,
            // touching no wrapper and no network.
            await withAiMode("local", async () => {
                const [embedded] = await aiEmbeddingsService.embedTexts(["apple pie and apple cider"])
                expect(embedded).to.deep.equal(first)
            })
        })
    })

    describe("chunking", function () {
        it("packs paragraphs without splitting them", function () {
            const paragraph = "word ".repeat(80).trim() // ~400 chars
            const chunks = chunkTextForEmbedding([paragraph, paragraph, paragraph, paragraph].join("\n\n"))
            expect(chunks.length).to.be.greaterThan(1)
            for (const chunk of chunks) {
                // Chunks are whole paragraphs joined by blank lines — no
                // paragraph was cut mid-way.
                for (const piece of chunk.split("\n\n")) {
                    expect(piece).to.equal(paragraph)
                }
            }
        })
    })

    describe("indexing and top-k search (AI_MODE=local)", function () {
        it("returns the k best chunks, best first, on both query paths", async function () {
            await withAiMode("local", async () => {
                await aiRetrievalService.indexDocuments(orchardCorpus)

                const results = await aiRetrievalService.searchTopK({
                    source: orchardCorpus.source,
                    query: "apple cider and apple pie",
                    k: 2,
                })
                expect(results).to.have.length(2)
                expect(results[0].documentKey).to.equal("orchard")
                expect(results[0].title).to.equal("The Orchard")
                expect(results[0].content).to.contain("apple harvest")
                expect(results[0].score).to.be.greaterThan(results[1].score)

                // The in-app cosine path (embedded sandbox Postgres, no
                // pgvector) orders identically to whatever path ran above.
                await withoutPgvector(async () => {
                    const fallbackResults = await aiRetrievalService.searchTopK({
                        source: orchardCorpus.source,
                        query: "apple cider and apple pie",
                        k: 2,
                    })
                    expect(fallbackResults.map((result) => result.documentKey)).to.deep.equal(
                        results.map((result) => result.documentKey),
                    )
                    for (const [index, result] of fallbackResults.entries()) {
                        expect(result.score).to.be.closeTo(results[index].score, 1e-4)
                    }
                })
            })
        })

        it("converges the index: unchanged content keeps rows, removed documents lose them", async function () {
            await withAiMode("local", async () => {
                await aiRetrievalService.indexDocuments(orchardCorpus)
                const before = await aiDb
                    .select()
                    .from(aiEmbeddingsTable)
                    .where(eq(aiEmbeddingsTable.source, orchardCorpus.source))
                expect(before).to.have.length(3)

                // Re-indexing a shrunk corpus deletes the stale document's
                // rows and leaves the unchanged ones in place (same hash).
                await aiRetrievalService.indexDocuments({
                    source: orchardCorpus.source,
                    documents: orchardCorpus.documents.slice(0, 2),
                })
                const after = await aiDb
                    .select()
                    .from(aiEmbeddingsTable)
                    .where(eq(aiEmbeddingsTable.source, orchardCorpus.source))
                expect(after.map((row) => row.documentKey).sort()).to.deep.equal(["harbor", "orchard"])
                const orchardBefore = before.find((row) => row.documentKey === "orchard")
                const orchardAfter = after.find((row) => row.documentKey === "orchard")
                expect(orchardAfter!.contentHash).to.equal(orchardBefore!.contentHash)
            })
        })
    })

    describe("chat tool: search_blog_posts", function () {
        it("answers from the embedded blog content in local mode", async function () {
            await withAiMode("local", async () => {
                const output = JSON.parse(
                    await executeAiChatTool(
                        "search_blog_posts",
                        JSON.stringify({ query: "what makes a good design review meeting" }),
                    ),
                ) as { results: { title: string; slug: string; passage: string; score: number }[] }
                expect(output.results.length).to.be.greaterThan(0)
                expect(output.results[0].title).to.equal("The 20-minute design review")
                expect(output.results[0].slug).to.equal("twenty-minute-design-review")
                expect(output.results[0].passage.length).to.be.greaterThan(0)
            })
        })

        it("feeds retrieved passages back through the chat tool loop", async function () {
            const fakeOpenAi = new RetrievalFakeOpenAiWrapper()
            setOpenAiWrapperForTests(fakeOpenAi)
            try {
                // Turn 1: the model asks for the retrieval tool.
                fakeOpenAi.scriptedTurns.push({
                    play: (callbacks) => {
                        callbacks.onResponseCreated("resp_1")
                        callbacks.onFunctionCallCreated({
                            callId: "call_1",
                            name: "search_blog_posts",
                            argumentsJson: JSON.stringify({
                                query: "what makes a good design review meeting",
                            }),
                        })
                    },
                    turn: {
                        responseId: "resp_1",
                        functionCalls: [
                            {
                                callId: "call_1",
                                name: "search_blog_posts",
                                argumentsJson: JSON.stringify({
                                    query: "what makes a good design review meeting",
                                }),
                            },
                        ],
                    },
                })
                // Turn 2: with the passages, the model answers and cites.
                fakeOpenAi.scriptedTurns.push({
                    play: (callbacks) => {
                        callbacks.onResponseCreated("resp_2")
                        callbacks.onAssistantTextDelta(
                            'Per "The 20-minute design review": one review, one job, twenty minutes.',
                        )
                    },
                    turn: { responseId: "resp_2", functionCalls: [] },
                })

                const snapshots: AiChatResponse[] = []
                const errors: string[] = []
                await withAiMode("openai", async () => {
                    await aiChatService.streamChatResponse(
                        { id: randomUUID(), message: "What does the blog say about design reviews?" },
                        {
                            stream: (response) =>
                                snapshots.push(JSON.parse(JSON.stringify(response)) as AiChatResponse),
                            sendError: (message) => errors.push(message),
                        },
                    )
                })
                expect(errors).to.deep.equal([])

                // The tool really ran: the embeddings went through the
                // wrapper (openai mode) and the retrieved passages — with
                // the citable title and slug — fed the second turn.
                expect(fakeOpenAi.embeddingsRequests.length).to.be.greaterThan(0)
                const toolOutputs = fakeOpenAi.turnRequests[1].input
                expect(toolOutputs).to.have.length(1)
                const toolOutput = JSON.parse((toolOutputs[0] as { output: string }).output) as {
                    results: { title: string; slug: string }[]
                }
                expect(toolOutput.results[0].title).to.equal("The 20-minute design review")
                expect(toolOutput.results[0].slug).to.equal("twenty-minute-design-review")

                const final = snapshots[snapshots.length - 1]
                expect(final.assistantMessage?.status).to.equal("COMPLETED")
                expect(final.assistantMessage?.message[0].content).to.contain("The 20-minute design review")
            } finally {
                setOpenAiWrapperForTests(undefined)
            }
        })
    })

    describe("gateway mode (AI_MODE=gateway)", function () {
        it("embeds through the gateway's /embeddings route with the bearer token", async function () {
            const gatewayEnv = {
                AI_MODE: "gateway",
                AI_GATEWAY_URL: "https://gateway.test.example/ai_gateway__request__api",
                AI_GATEWAY_TOKEN: "v1.fake.gateway-token",
            }
            const fetchStub = sinon.stub(globalThis, "fetch").resolves(
                Response.json({
                    object: "list",
                    data: [{ object: "embedding", index: 0, embedding: [0.6, 0.8] }],
                    usage: { prompt_tokens: 5, total_tokens: 5 },
                }),
            )

            try {
                await withAiEnv(gatewayEnv, async () => {
                    const [vector] = await aiEmbeddingsService.embedTexts(["hello"])
                    expect(vector[0]).to.be.closeTo(0.6, 1e-9)
                    expect(vector[1]).to.be.closeTo(0.8, 1e-9)
                })
            } finally {
                fetchStub.restore()
            }

            // The identical Embeddings-API call, aimed at the gateway with
            // the per-environment token instead of an OpenAI key.
            expect(fetchStub.calledOnce).to.equal(true)
            const [url, init] = fetchStub.firstCall.args as [string, RequestInit]
            expect(url).to.equal(`${gatewayEnv.AI_GATEWAY_URL}/embeddings`)
            const headers = init.headers as Record<string, string>
            expect(headers.authorization).to.equal(`Bearer ${gatewayEnv.AI_GATEWAY_TOKEN}`)
            const body = JSON.parse(init.body as string) as { model: string; dimensions: number }
            expect(body.model).to.equal("text-embedding-3-small")
            expect(body.dimensions).to.equal(AI_EMBEDDINGS_DIMENSIONS)
        })
    })
})

/** One scripted model turn: emit the given callbacks, then return the turn. */
interface ScriptedTurn {
    play: (callbacks: OpenAiModelTurnCallbacks) => void
    turn: OpenAiModelTurn
}

class RetrievalFakeOpenAiWrapper implements OpenAiWrapper {
    turnRequests: OpenAiModelTurnRequest[] = []
    scriptedTurns: ScriptedTurn[] = []
    embeddingsRequests: OpenAiEmbeddingsRequest[] = []

    async streamModelTurn(
        request: OpenAiModelTurnRequest,
        callbacks: OpenAiModelTurnCallbacks,
    ): Promise<OpenAiModelTurn> {
        this.turnRequests.push(request)
        const scripted = this.scriptedTurns.shift()
        if (scripted === undefined) {
            throw new Error("RetrievalFakeOpenAiWrapper: no scripted turn left")
        }
        scripted.play(callbacks)
        return scripted.turn
    }

    async createRealtimeClientSecret(): Promise<never> {
        throw new Error("Not scripted in this suite.")
    }

    // Embeds with the deterministic local algorithm so retrieval is
    // meaningful without scripting vectors by hand.
    async createEmbeddings(request: OpenAiEmbeddingsRequest): Promise<OpenAiEmbeddingsResult> {
        this.embeddingsRequests.push(request)
        return {
            embeddings: request.input.map((text) => localDeterministicEmbedding(text)),
            inputTokens: 0,
        }
    }
}
