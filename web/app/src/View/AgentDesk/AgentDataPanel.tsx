import React, { useMemo, useState } from "react"
import {
    useCreateSongMutation,
    useDeleteSongMutation,
    useSongsQuery,
    useUpdateSongMutation,
} from "../../generated/graphql/types"
import * as styles from "./AgentDeskPage.styles.css"

interface SongDraft {
    chartRank: string
    title: string
    artist: string
    year: string
    genre: string
    streamsBillions: string
    notes: string
}

const emptyDraft: SongDraft = {
    chartRank: "",
    title: "",
    artist: "",
    year: "",
    genre: "",
    streamsBillions: "",
    notes: "",
}

/**
 * The living chart. Edits here are the same rows the agent reads and writes,
 * so a change on this tab is already known on the next chat or voice turn.
 */
export default function AgentDataPanel(): React.ReactElement {
    const [search, setSearch] = useState("")
    const [selectedId, setSelectedId] = useState<string | "new" | undefined>(undefined)
    const [draft, setDraft] = useState<SongDraft>(emptyDraft)
    const [formError, setFormError] = useState<string>()

    const songsQuery = useSongsQuery({
        variables: {
            input: {
                filters: search.trim() === "" ? undefined : { search: search.trim() },
                connection: {
                    pagination: { first: 50 },
                    sort: [{ fieldName: "chartRank", direction: "asc" }],
                },
            },
        },
        fetchPolicy: "network-only",
    })
    const [createSong, createState] = useCreateSongMutation()
    const [updateSong, updateState] = useUpdateSongMutation()
    const [deleteSong, deleteState] = useDeleteSongMutation()

    // Connection nodes are Maybe<Song>; dropping nulls here keeps every
    // downstream read (table rows, the selected editor) non-nullable.
    const songs = useMemo(
        () => (songsQuery.data?.songs.nodes ?? []).flatMap((song) => (song ? [song] : [])),
        [songsQuery.data],
    )
    const selected = useMemo(() => songs.find((song) => song.id === selectedId), [songs, selectedId])
    const busy = createState.loading || updateState.loading || deleteState.loading

    const openNew = (): void => {
        setSelectedId("new")
        setDraft({ ...emptyDraft, chartRank: String((songs[songs.length - 1]?.chartRank ?? 0) + 1) })
        setFormError(undefined)
    }

    const openSong = (id: string): void => {
        const song = songs.find((row) => row.id === id)
        if (song === undefined) return
        setSelectedId(id)
        setDraft({
            chartRank: String(song.chartRank),
            title: song.title,
            artist: song.artist,
            year: String(song.year),
            genre: song.genre,
            streamsBillions: song.streamsBillions != null ? String(song.streamsBillions) : "",
            notes: song.notes ?? "",
        })
        setFormError(undefined)
    }

    const save = async (): Promise<void> => {
        setFormError(undefined)
        const chartRank = Number(draft.chartRank)
        const year = Number(draft.year)
        if (!Number.isInteger(chartRank) || chartRank < 1) {
            setFormError("Rank must be a whole number, 1 or higher.")
            return
        }
        if (draft.title.trim() === "" || draft.artist.trim() === "" || draft.genre.trim() === "") {
            setFormError("Title, artist, and genre are required.")
            return
        }
        if (!Number.isInteger(year) || year < 1900) {
            setFormError("Year must be a four-digit year.")
            return
        }
        const streamsBillions =
            draft.streamsBillions.trim() === "" ? undefined : Number(draft.streamsBillions)
        try {
            if (selectedId === "new" || selectedId === undefined) {
                const created = await createSong({
                    variables: {
                        input: {
                            idempotencyKey: crypto.randomUUID(),
                            fields: {
                                chartRank,
                                title: draft.title.trim(),
                                artist: draft.artist.trim(),
                                year,
                                genre: draft.genre.trim(),
                                streamsBillions,
                                notes: draft.notes.trim() === "" ? undefined : draft.notes.trim(),
                            },
                        },
                    },
                })
                await songsQuery.refetch()
                const id = created.data?.createSong.id
                if (id !== undefined) openSong(id)
            } else {
                await updateSong({
                    variables: {
                        input: {
                            objectId: selectedId,
                            idempotencyKey: crypto.randomUUID(),
                            fields: {
                                chartRank,
                                title: draft.title.trim(),
                                artist: draft.artist.trim(),
                                year,
                                genre: draft.genre.trim(),
                                streamsBillions,
                                notes: draft.notes.trim() === "" ? undefined : draft.notes.trim(),
                            },
                        },
                    },
                })
                await songsQuery.refetch()
            }
        } catch (error) {
            setFormError(error instanceof Error ? error.message : "Could not save the song.")
        }
    }

    const remove = async (): Promise<void> => {
        if (selectedId === undefined || selectedId === "new") return
        setFormError(undefined)
        try {
            await deleteSong({ variables: { input: { objectId: selectedId } } })
            setSelectedId(undefined)
            setDraft(emptyDraft)
            await songsQuery.refetch()
        } catch (error) {
            setFormError(error instanceof Error ? error.message : "Could not delete the song.")
        }
    }

    const loadError = songsQuery.error?.message

    return (
        <div className={styles.dataLayout}>
            <div className={styles.tableWrap}>
                {loadError !== undefined ? (
                    <p className={styles.errorText} role="alert" style={{ padding: "0.75rem 1rem 0" }}>
                        {loadError}
                    </p>
                ) : null}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "0.75rem",
                        padding: "0.75rem 1rem",
                    }}
                >
                    <input
                        className={styles.search}
                        type="search"
                        placeholder="Search the chart"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        aria-label="Search the chart"
                    />
                    <button type="button" className={styles.primaryButton} onClick={openNew}>
                        Add song
                    </button>
                </div>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th className={styles.th}>#</th>
                            <th className={styles.th}>Title</th>
                            <th className={styles.th}>Artist</th>
                            <th className={styles.th}>Year</th>
                            <th className={styles.th}>Genre</th>
                            <th className={styles.th}>Streams B</th>
                        </tr>
                    </thead>
                    <tbody>
                        {songs.map((song) => (
                            <tr
                                key={song.id}
                                className={`${styles.row} ${selectedId === song.id ? styles.rowActive : ""}`}
                                onClick={() => openSong(song.id)}
                            >
                                <td className={styles.td}>{song.chartRank}</td>
                                <td className={styles.td}>{song.title}</td>
                                <td className={styles.td}>{song.artist}</td>
                                <td className={styles.td}>{song.year}</td>
                                <td className={styles.td}>{song.genre}</td>
                                <td className={styles.td}>
                                    {song.streamsBillions != null ? song.streamsBillions.toFixed(1) : "—"}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <form
                className={styles.editor}
                onSubmit={(event) => {
                    event.preventDefault()
                    void save()
                }}
            >
                <h2 className={styles.editorTitle}>
                    {selectedId === "new" || selectedId === undefined
                        ? "New song"
                        : selected !== undefined
                          ? `#${selected.chartRank}`
                          : "Song"}
                </h2>
                <label className={styles.label}>
                    Rank
                    <input
                        className={styles.input}
                        type="number"
                        min={1}
                        value={draft.chartRank}
                        onChange={(event) => setDraft({ ...draft, chartRank: event.target.value })}
                    />
                </label>
                <label className={styles.label}>
                    Title
                    <input
                        className={styles.input}
                        value={draft.title}
                        onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                    />
                </label>
                <label className={styles.label}>
                    Artist
                    <input
                        className={styles.input}
                        value={draft.artist}
                        onChange={(event) => setDraft({ ...draft, artist: event.target.value })}
                    />
                </label>
                <label className={styles.label}>
                    Year
                    <input
                        className={styles.input}
                        type="number"
                        value={draft.year}
                        onChange={(event) => setDraft({ ...draft, year: event.target.value })}
                    />
                </label>
                <label className={styles.label}>
                    Genre
                    <input
                        className={styles.input}
                        value={draft.genre}
                        onChange={(event) => setDraft({ ...draft, genre: event.target.value })}
                    />
                </label>
                <label className={styles.label}>
                    Streams (billions)
                    <input
                        className={styles.input}
                        type="number"
                        step="0.1"
                        value={draft.streamsBillions}
                        onChange={(event) => setDraft({ ...draft, streamsBillions: event.target.value })}
                    />
                </label>
                <label className={styles.label}>
                    Notes
                    <textarea
                        className={styles.textarea}
                        value={draft.notes}
                        onChange={(event) => setDraft({ ...draft, notes: event.target.value })}
                    />
                </label>
                {formError !== undefined ? (
                    <p className={styles.errorText} role="alert">
                        {formError}
                    </p>
                ) : null}
                <div className={styles.editorActions}>
                    <button type="submit" className={styles.primaryButton} disabled={busy}>
                        Save
                    </button>
                    {selectedId !== undefined && selectedId !== "new" ? (
                        <button
                            type="button"
                            className={styles.ghostButton}
                            disabled={busy}
                            onClick={() => void remove()}
                        >
                            Delete
                        </button>
                    ) : null}
                </div>
            </form>
        </div>
    )
}
