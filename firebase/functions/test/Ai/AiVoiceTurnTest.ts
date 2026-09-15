import { expect } from "chai"
import { randomUUID } from "node:crypto"
import { aiVoiceTurnService } from "../../src/Services/Ai/AiVoiceTurnService.js"
import { executeAiChatTool } from "../../src/Services/Ai/AiChatTools.js"
import { resetValidatedEnvForTests } from "../../src/Utils/Env.js"

describe("Ai voice turn (ELEVENLABS_MODE=local)", function () {
    beforeEach(function () {
        process.env.AI_MODE = "local"
        process.env.ELEVENLABS_MODE = "local"
        resetValidatedEnvForTests()
    })

    it("transcribes a catalog question, runs list_songs, and skips TTS audio", async function () {
        const result = await aiVoiceTurnService.runTurn({
            id: randomUUID(),
            transcript: "Who is number one on the chart?",
        })
        expect(result.userTranscript).to.equal("Who is number one on the chart?")
        expect(result.assistantText).to.match(/Bohemian Rhapsody/)
        expect(result.audioBase64).to.equal(undefined)
        expect(result.responseId).to.match(/^local-/)
    })
})

describe("song chat tools", function () {
    it("lists the seeded chart from the top", async function () {
        const output = JSON.parse(await executeAiChatTool("list_songs", JSON.stringify({ limit: 3 }))) as {
            songs: { title: string; rank: number }[]
        }
        expect(output.songs).to.have.length(3)
        expect(output.songs[0]?.title).to.equal("Bohemian Rhapsody")
        expect(output.songs[0]?.rank).to.equal(1)
    })

    it("searches by artist", async function () {
        const output = JSON.parse(
            await executeAiChatTool("search_songs", JSON.stringify({ query: "Nirvana" })),
        ) as { songs: { title: string }[] }
        expect(output.songs.map((song) => song.title)).to.deep.equal(["Smells Like Teen Spirit"])
    })
})
