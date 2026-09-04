import { expect } from "chai"
import {
    GqlConnectionInput,
    GqlCreateSongFields,
    GqlCreateSongInput,
} from "../../generated/GraphqlResolverTypes.js"
import { newIdempotencyKey } from "../Utils/Factories/RandomValues.js"
import { executeGql, firstGqlError } from "../Utils/Gql/GqlUtils.js"

// The chart seed from migrations/20260827T180000__create_songs.sql.
const seededTopTitle = "Bohemian Rhapsody"
const seededCount = 24

const rankOrder: GqlConnectionInput = {
    pagination: { first: 50 },
    sort: [{ fieldName: "chartRank", direction: "asc" }],
}

function buildCreateSongInput(fields: GqlCreateSongFields): GqlCreateSongInput {
    return { idempotencyKey: newIdempotencyKey(), fields }
}

describe("Songs", function () {
    it("lists the seeded chart in rank order", async function () {
        const connection = await this.songsHelper.getSongs({ connection: rankOrder })
        expect(connection.nodes).to.have.length(seededCount)
        expect(connection.nodes[0]?.title).to.equal(seededTopTitle)
        expect(connection.nodes[0]?.chartRank).to.equal(1)
        expect(connection.nodes[0]?.artist).to.equal("Queen")
        expect(connection.nodes[23]?.title).to.equal("Old Town Road")
        expect(connection.nodes.map((song) => song?.chartRank)).to.deep.equal(
            Array.from({ length: seededCount }, (_, index) => index + 1),
        )
    })

    it("searches across title, artist, genre, and notes", async function () {
        const byArtist = await this.songsHelper.getSongs({
            connection: rankOrder,
            filters: { search: "beatles" },
        })
        expect(byArtist.nodes.map((song) => song?.title).sort()).to.deep.equal(["Hey Jude", "Yesterday"])

        const byNote = await this.songsHelper.getSongs({
            connection: rankOrder,
            filters: { search: "moonwalk" },
        })
        expect(byNote.nodes).to.have.length(1)
        expect(byNote.nodes[0]?.title).to.equal("Billie Jean")
    })

    it("creates, updates, and deletes a song off the seeded ranks", async function () {
        const created = await this.songsHelper.createSong(
            buildCreateSongInput({
                chartRank: 99,
                title: "Fast Car",
                artist: "Tracy Chapman",
                year: 1988,
                genre: "Folk",
                streamsBillions: 1.1,
                notes: "A story song that still stops a room.",
            }),
        )
        expect(created.title).to.equal("Fast Car")
        expect(created.chartRank).to.equal(99)

        const updated = await this.songsHelper.updateSong({
            objectId: created.id,
            idempotencyKey: newIdempotencyKey(),
            fields: { chartRank: 50, notes: "Moved up after a reunion tour." },
        })
        expect(updated.chartRank).to.equal(50)
        expect(updated.notes).to.equal("Moved up after a reunion tour.")

        const deleted = await this.songsHelper.deleteSong({ objectId: created.id })
        expect(deleted).to.equal(true)

        const remaining = await this.songsHelper.getSongs({ connection: rankOrder })
        expect(remaining.nodes).to.have.length(seededCount)
        expect(remaining.nodes.some((song) => song?.id === created.id)).to.equal(false)
    })

    it("refuses a rank that is already on the chart", async function () {
        const response = await executeGql(
            this.apolloServer,
            `mutation CreateSong($input: CreateSongInput!) {
                createSong(input: $input) { id }
            }`,
            {
                input: buildCreateSongInput({
                    chartRank: 1,
                    title: "New Number One",
                    artist: "Someone",
                    year: 2026,
                    genre: "Pop",
                }),
            },
        )
        const error = firstGqlError(response)
        expect(error.message).to.match(/already taken/i)
        expect(error.message).to.match(/Bohemian Rhapsody/)
    })

    it("builds create and update forms from the song fields", async function () {
        const createForm = await this.songsHelper.getSongCreateFormSchema()
        const createSchema = JSON.parse(createForm.jsonSchema) as { required?: string[] }
        expect(createSchema.required).to.include.members(["chartRank", "title", "artist", "year", "genre"])

        const top = (await this.songsHelper.getSongs({ connection: rankOrder })).nodes[0]
        expect(top).to.not.equal(undefined)
        const updateForm = await this.songsHelper.getSongUpdateFormSchema(top!.id)
        // defaultData is a JSON string by contract (Form.gql), like jsonSchema above.
        const defaultData = JSON.parse(updateForm.defaultData) as Record<string, unknown>
        expect(defaultData).to.include({ title: seededTopTitle, chartRank: 1 })
    })
})
