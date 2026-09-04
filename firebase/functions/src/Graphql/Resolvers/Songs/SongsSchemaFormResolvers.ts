import { GqlResolvers } from "../../../../generated/GraphqlResolverTypes.js"
import { songsService } from "../../../Services/Songs/index.js"
import { buildSchemaForm } from "../../../Utils/SchemaForms.js"

const notesOverride = {
    uiSchema: { "ui:widget": "textarea" },
}

export const songsSchemaFormResolvers: GqlResolvers = {
    Query: {
        songCreateFormSchema: () => {
            return buildSchemaForm({
                baseSchemaKey: "CreateSongFields",
                title: "Add song",
                displayOrder: ["chartRank", "title", "artist", "year", "genre", "streamsBillions", "notes"],
                overrides: { notes: notesOverride },
            })
        },

        songUpdateFormSchema: async (_parent, { input }) => {
            const song = await songsService.getSongByIdOrThrow(input.objectId)
            return buildSchemaForm({
                baseSchemaKey: "UpdateSongFields",
                title: "Update song",
                displayOrder: ["chartRank", "title", "artist", "year", "genre", "streamsBillions", "notes"],
                overrides: { notes: notesOverride },
                defaultData: {
                    chartRank: song.chartRank,
                    title: song.title,
                    artist: song.artist,
                    year: song.year,
                    genre: song.genre,
                    streamsBillions: song.streamsBillions ?? undefined,
                    notes: song.notes ?? undefined,
                },
            })
        },
    },
}
