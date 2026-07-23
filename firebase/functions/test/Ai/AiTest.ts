import { randomUUID } from "node:crypto"
import { expect } from "chai"
import {
    OpenAiModelTurn,
    OpenAiModelTurnCallbacks,
    OpenAiModelTurnRequest,
    OpenAiRealtimeClientSecret,
    OpenAiRealtimeSessionRequest,
    OpenAiWrapper,
    setOpenAiWrapperForTests,
} from "../../src/DependencyWrappers/OpenAiWrapper/index.js"
import { aiChatService } from "../../src/Services/Ai/AiChatService.js"
import { AiChatResponse } from "../../src/Services/Ai/AiChatTypes.js"
import { AI_VOICE_MODEL, AI_VOICE_VOICE } from "../../src/Services/Ai/AiVoiceService.js"
import assert from "node:assert/strict"
import { resetValidatedEnvForTests } from "../../src/Utils/Env.js"
import { executeGql, firstGqlError } from "../Utils/Gql/GqlUtils.js"

const createAiVoiceSessionMutation = `
    mutation CreateAiVoiceSession {
        createAiVoiceSession { clientSecret expiresAt model voice }
    }
`

interface GqlAiVoiceSessionResult {
    clientSecret: string
    expiresAt?: string
    model: string
    voice: string
}

/**
 * Runs a block with AI_MODE temporarily overridden; the validated-env cache
 * is reset around it so the services see the override. Tests default to
 * AI_MODE=openai (the schema default) with the wrapper faked.
 */
async function withAiMode(mode: string, block: () => Promise<void>): Promise<void> {
    const original = process.env.AI_MODE
    process.env.AI_MODE = mode
    resetValidatedEnvForTests()
    try {
        await block()
    } finally {
        if (original === undefined) {
            delete process.env.AI_MODE
        } else {
            process.env.AI_MODE = original
        }
        resetValidatedEnvForTests()
    }
}

/** One scripted model turn: emit the given callbacks, then return the turn. */
interface ScriptedTurn {
    play: (callbacks: OpenAiModelTurnCallbacks) => void
    turn: OpenAiModelTurn
}

class FakeOpenAiWrapper implements OpenAiWrapper {
    turnRequests: OpenAiModelTurnRequest[] = []
    scriptedTurns: ScriptedTurn[] = []
    realtimeRequests: OpenAiRealtimeSessionRequest[] = []
    realtimeSecret: OpenAiRealtimeClientSecret = {
        clientSecret: "ek_test_fake",
        expiresAtSeconds: 1_700_000_000,
        model: AI_VOICE_MODEL,
        voice: AI_VOICE_VOICE,
    }

    async streamModelTurn(
        request: OpenAiModelTurnRequest,
        callbacks: OpenAiModelTurnCallbacks,
    ): Promise<OpenAiModelTurn> {
        this.turnRequests.push(request)
        const scripted = this.scriptedTurns.shift()
        if (scripted === undefined) {
            throw new Error("FakeOpenAiWrapper: no scripted turn left")
        }
        scripted.play(callbacks)
        return scripted.turn
    }

    async createRealtimeClientSecret(
        request: OpenAiRealtimeSessionRequest,
    ): Promise<OpenAiRealtimeClientSecret> {
        this.realtimeRequests.push(request)
        return this.realtimeSecret
    }
}

describe("Ai", function () {
    let fakeOpenAi: FakeOpenAiWrapper

    beforeEach(function () {
        fakeOpenAi = new FakeOpenAiWrapper()
        setOpenAiWrapperForTests(fakeOpenAi)
    })

    afterEach(function () {
        setOpenAiWrapperForTests(undefined)
    })

    describe("createAiVoiceSession (AI_MODE=openai)", function () {
        it("mints a realtime client secret anonymously", async function () {
            await withAiMode("openai", async () => {
                // The talk surface never signs in: null principal exercises
                // the public gate.
                const response = await executeGql(this.apolloServer, createAiVoiceSessionMutation, {}, null)
                assert(response.body.kind === "single")
                expect(response.body.singleResult.errors).to.equal(undefined)
                const session = response.body.singleResult.data
                    ?.createAiVoiceSession as GqlAiVoiceSessionResult
                expect(session.clientSecret).to.equal("ek_test_fake")
                expect(session.model).to.equal(AI_VOICE_MODEL)
                expect(session.voice).to.equal(AI_VOICE_VOICE)
                expect(new Date(session.expiresAt ?? "").getTime()).to.equal(1_700_000_000 * 1000)

                // The session (model, voice, instructions) is configured
                // server-side; the client only ever sees the minted secret.
                expect(fakeOpenAi.realtimeRequests).to.have.length(1)
                expect(fakeOpenAi.realtimeRequests[0].instructions).to.contain("push-to-talk")
            })
        })

        it("refuses in local mode with the setup spelled out", async function () {
            await withAiMode("local", async () => {
                const response = await executeGql(this.apolloServer, createAiVoiceSessionMutation, {}, null)
                const error = firstGqlError(response)
                expect(error.code).to.equal("FAILED_PRECONDITION")
                expect(error.message).to.contain("AI_MODE=openai")
            })
        })
    })

    describe("chat stream (AI_MODE=openai)", function () {
        it("runs the tool loop and streams growing snapshots to completion", async function () {
            // Turn 1: the model thinks, then asks for the exemplar tool.
            fakeOpenAi.scriptedTurns.push({
                play: (callbacks) => {
                    callbacks.onResponseCreated("resp_1")
                    callbacks.onReasoningSummaryDelta("rs_1", "**Checking the clock**")
                    callbacks.onReasoningSummaryDone("rs_1")
                    callbacks.onFunctionCallCreated({
                        callId: "call_1",
                        name: "get_current_time",
                        argumentsJson: JSON.stringify({ timezone: "UTC" }),
                    })
                },
                turn: {
                    responseId: "resp_1",
                    functionCalls: [
                        {
                            callId: "call_1",
                            name: "get_current_time",
                            argumentsJson: JSON.stringify({ timezone: "UTC" }),
                        },
                    ],
                },
            })
            // Turn 2: with the tool output, the model writes the answer.
            fakeOpenAi.scriptedTurns.push({
                play: (callbacks) => {
                    callbacks.onResponseCreated("resp_2")
                    callbacks.onAssistantTextDelta("It is ")
                    callbacks.onAssistantTextDelta("time to build.")
                },
                turn: { responseId: "resp_2", functionCalls: [] },
            })

            const snapshots: AiChatResponse[] = []
            const errors: string[] = []
            await withAiMode("openai", async () => {
                await aiChatService.streamChatResponse(
                    { id: randomUUID(), message: "What time is it?" },
                    {
                        stream: (response) =>
                            snapshots.push(JSON.parse(JSON.stringify(response)) as AiChatResponse),
                        sendError: (message) => errors.push(message),
                    },
                )
            })

            expect(errors).to.deep.equal([])
            expect(snapshots.length).to.be.greaterThan(3)

            // The second turn chains onto the first via previousResponseId.
            expect(fakeOpenAi.turnRequests).to.have.length(2)
            expect(fakeOpenAi.turnRequests[0].previousResponseId).to.equal(undefined)
            expect(fakeOpenAi.turnRequests[1].previousResponseId).to.equal("resp_1")
            // The tool actually ran: its real output went back to the model.
            const toolOutputs = fakeOpenAi.turnRequests[1].input
            expect(toolOutputs).to.have.length(1)
            const toolOutput = toolOutputs[0] as { call_id: string; output: string }
            expect(toolOutput.call_id).to.equal("call_1")
            expect((JSON.parse(toolOutput.output) as { timezone: string }).timezone).to.equal("UTC")

            const final = snapshots[snapshots.length - 1]
            expect(final.responseId).to.equal("resp_2")
            expect(final.assistantMessage?.status).to.equal("COMPLETED")
            expect(final.assistantMessage?.message[0].content).to.equal("It is time to build.")
            const functionCall = final.responseItems.find(
                (item) => item.functionCall !== undefined,
            )?.functionCall
            expect(functionCall?.status).to.equal("COMPLETED")
            expect(functionCall?.output).to.equal(toolOutput.output)
            const summary = final.responseItems.find(
                (item) => item.reasoningSummary !== undefined,
            )?.reasoningSummary
            expect(summary?.status).to.equal("COMPLETED")
        })

        it("reports a model failure as a terminal stream error", async function () {
            // No scripted turns: the fake wrapper throws on the first call.
            const errors: string[] = []
            await withAiMode("openai", async () => {
                await aiChatService.streamChatResponse(
                    { id: randomUUID(), message: "hello" },
                    { stream: () => undefined, sendError: (message) => errors.push(message) },
                )
            })
            expect(errors).to.have.length(1)
        })
    })

    describe("chat stream (AI_MODE=local)", function () {
        it("streams the full simulated protocol without touching OpenAI", async function () {
            const snapshots: AiChatResponse[] = []
            const errors: string[] = []
            await withAiMode("local", async () => {
                await aiChatService.streamChatResponse(
                    { id: randomUUID(), message: "Hello there" },
                    {
                        stream: (response) =>
                            snapshots.push(JSON.parse(JSON.stringify(response)) as AiChatResponse),
                        sendError: (message) => errors.push(message),
                    },
                )
            })

            expect(errors).to.deep.equal([])
            expect(fakeOpenAi.turnRequests).to.deep.equal([])

            const final = snapshots[snapshots.length - 1]
            expect(final.requestMessage).to.equal("Hello there")
            expect(final.responseId).to.match(/^local-/)
            expect(final.assistantMessage?.status).to.equal("COMPLETED")
            // The simulation exercises the whole protocol: a completed
            // reasoning summary and a real run of the exemplar tool.
            const summary = final.responseItems.find(
                (item) => item.reasoningSummary !== undefined,
            )?.reasoningSummary
            expect(summary?.status).to.equal("COMPLETED")
            const functionCall = final.responseItems.find(
                (item) => item.functionCall !== undefined,
            )?.functionCall
            expect(functionCall?.name).to.equal("get_current_time")
            expect(functionCall?.status).to.equal("COMPLETED")
            expect(functionCall?.output).to.not.equal(undefined)
        })
    })
})
