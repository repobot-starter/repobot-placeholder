import { GqlResolvers } from "../../../../generated/GraphqlResolverTypes.js"
import { songsService } from "../../../Services/Songs/index.js"

// Every Songs operation is authenticated by the execution-level gate in
// GraphqlServer.ts (layer 1 of docs/authorization.md): none of these root
// fields are in the public sets, so no resolver here can be reached
// anonymously. The catalog is workspace-global, so no per-resource check
// (layer 2) applies.
export const songsResolvers: GqlResolvers = {
    Query: {
        songs: async (_parent, { input }) => {
            return await songsService.listSongs({
                connection: input.connection,
                filters: input.filters,
            })
        },

        song: async (_parent, { id }) => {
            return await songsService.getSongByIdOrThrow(id)
        },
    },

    Mutation: {
        createSong: async (_parent, { input }) => {
            return await songsService.createSong({
                idempotencyKey: input.idempotencyKey,
                fields: input.fields,
            })
        },

        updateSong: async (_parent, { input }) => {
            return await songsService.updateSong({
                objectId: input.objectId,
                idempotencyKey: input.idempotencyKey,
                fields: input.fields,
            })
        },

        deleteSong: async (_parent, { input }) => {
            await songsService.deleteSong({ objectId: input.objectId })
            return true
        },
    },

    Song: {
        streamsBillions: (song) => song.streamsBillions ?? undefined,
        notes: (song) => song.notes ?? undefined,
        createdTime: (song) => song.rowCreatedAt,
        updatedTime: (song) => song.rowUpdatedAt,
    },
}
