import { asc, eq } from "drizzle-orm"
import { Song, songInsertSchema, songsTable, songUpdateSchema } from "../../Data/Songs/Song.js"
import { songSearchCondition, songsDb } from "../../Data/SongsDatabase.js"
import {
    ConnectionParameters,
    getRowByIdOrThrow,
    idempotentInsertAndGet,
    listRows,
    ListRowsResult,
    updateRowReturning,
} from "../../Data/Utils/index.js"
import { RpcError } from "../../Utils/RpcError.js"

class SongsService {
    async listSongs(request: ListSongsRequest): Promise<ListRowsResult<Song>> {
        const search = request.filters?.search?.trim()
        return await listRows(songsDb, songsTable, request.connection, {
            filters: [search != null && search.length > 0 ? songSearchCondition(search) : undefined],
            sortColumnKeys: ["chartRank", "title", "artist", "year", "rowCreatedAt"],
        })
    }

    /**
     * The full chart in rank order — what the assistant tools read. Capped
     * so a tool call cannot dump an unbounded table into the model.
     */
    async listSongsForAgent(limit = 50): Promise<Song[]> {
        const cap = Math.min(Math.max(1, limit), 100)
        return await songsDb
            .select()
            .from(songsTable)
            .orderBy(asc(songsTable.chartRank), asc(songsTable.id))
            .limit(cap)
    }

    async getSongByIdOrThrow(songId: string): Promise<Song> {
        return await getRowByIdOrThrow(songsDb, songsTable, songId)
    }

    async getSongByRank(chartRank: number): Promise<Song | undefined> {
        const [row] = await songsDb
            .select()
            .from(songsTable)
            .where(eq(songsTable.chartRank, chartRank))
            .limit(1)
        return row
    }

    async createSong(request: CreateSongRequest): Promise<Song> {
        const newSong = songInsertSchema.parse({
            chartRank: request.fields.chartRank,
            title: request.fields.title,
            artist: request.fields.artist,
            year: request.fields.year,
            genre: request.fields.genre,
            streamsBillions: request.fields.streamsBillions ?? null,
            notes: request.fields.notes ?? null,
        })
        await this.assertRankAvailable(newSong.chartRank)
        try {
            return await idempotentInsertAndGet(songsDb, songsTable, newSong, request.idempotencyKey)
        } catch (error) {
            throw remapRankConflict(error, newSong.chartRank)
        }
    }

    async updateSong(request: UpdateSongRequest): Promise<Song> {
        const existing = await this.getSongByIdOrThrow(request.objectId)
        const nextRank = request.fields.chartRank ?? existing.chartRank
        if (nextRank !== existing.chartRank) {
            await this.assertRankAvailable(nextRank)
        }
        const updateValue = songUpdateSchema.parse({
            chartRank: request.fields.chartRank ?? undefined,
            title: request.fields.title ?? undefined,
            artist: request.fields.artist ?? undefined,
            year: request.fields.year ?? undefined,
            genre: request.fields.genre ?? undefined,
            streamsBillions: request.fields.streamsBillions,
            notes: request.fields.notes,
        })
        try {
            return await updateRowReturning(songsDb, songsTable, request.objectId, updateValue)
        } catch (error) {
            throw remapRankConflict(error, nextRank)
        }
    }

    async deleteSong(request: DeleteSongRequest): Promise<void> {
        await this.getSongByIdOrThrow(request.objectId)
        await songsDb.delete(songsTable).where(eq(songsTable.id, request.objectId))
    }

    private async assertRankAvailable(chartRank: number): Promise<void> {
        const taken = await this.getSongByRank(chartRank)
        if (taken !== undefined) {
            throw new RpcError(
                "INVALID_ARGUMENT",
                `Chart rank ${chartRank} is already taken by "${taken.title}" by ${taken.artist}. ` +
                    "Pick a free rank or update that song first.",
            )
        }
    }
}

function remapRankConflict(error: unknown, chartRank: number): Error {
    const message = error instanceof Error ? error.message : String(error)
    if (message.includes("songs_chart_rank_unique")) {
        return new RpcError(
            "INVALID_ARGUMENT",
            `Chart rank ${chartRank} is already taken. Pick a free rank or update that song first.`,
        )
    }
    return error instanceof Error ? error : new Error(message)
}

export const songsService = new SongsService()

export interface ListSongsRequest {
    connection: ConnectionParameters
    filters?: { search?: string | null } | null
}

export interface CreateSongRequest {
    idempotencyKey: string
    fields: {
        chartRank: number
        title: string
        artist: string
        year: number
        genre: string
        streamsBillions?: number | null
        notes?: string | null
    }
}

export interface UpdateSongRequest {
    objectId: string
    idempotencyKey: string
    fields: {
        chartRank?: number | null
        title?: string | null
        artist?: string | null
        year?: number | null
        genre?: string | null
        streamsBillions?: number | null
        notes?: string | null
    }
}

export interface DeleteSongRequest {
    objectId: string
}
